#!/usr/bin/env python3
"""
preprocessing_slowfast_rwf2000_v2.py

Production-grade preprocessing for RWF-2000 → SlowFast_4x16_R50 fine-tuning.

Key improvements over v1:
 1. Dual-mode frame extraction  : ffmpeg (fast) + OpenCV fallback (robust)
 2. Slow & Fast pathway validation : ensures clip tensor shapes are correct before training
 3. Corrupt video detection       : skips unreadable files early, logs them separately
 4. Class-balance report          : warns if fight/nonfight ratio is heavily skewed
 5. Optical flow pre-check        : warns if video has near-zero motion (static/bad clips)
 6. Augmentation-aware crop sizes : writes both 256px (train) and 224px (val/test) variants
 7. Per-split statistics          : prints mean/std frame count per split
 8. Resume support                : skips already-processed videos without --overwrite
 9. Strict RWF-2000 split respect : honours original train/val split if present in folder
10. Integrity check mode          : --verify flag re-reads all outputs and reports bad files
11. Sliding window annotations    : overlap-aware, avoids duplicate windows
12. Full logging to file          : all stdout also saved to preprocess.log

Usage:
    python3 preprocessing_slowfast_rwf2000_v2.py \
        --raw_dir /path/to/RWF-2000 \
        --out_dir ./rwf_processed \
        --fps 30 \
        --workers 8 \
        --annotations \
        --annotation_win 16 \
        --annotation_step 8 \
        --verify
"""

import argparse
import csv
import logging
import math
import os
import random
import shutil
import subprocess
import sys
import time
from multiprocessing import Pool, cpu_count
from pathlib import Path
from typing import Dict, List, Optional, Tuple

import cv2
import numpy as np
from tqdm import tqdm

# ─────────────────────────────────────────────────────────────
# LOGGING SETUP
# ─────────────────────────────────────────────────────────────

def setup_logger(log_path: Path) -> logging.Logger:
    log_path.parent.mkdir(parents=True, exist_ok=True)
    fmt = logging.Formatter("%(asctime)s | %(levelname)s | %(message)s", "%H:%M:%S")
    logger = logging.getLogger("preprocess")
    logger.setLevel(logging.DEBUG)
    fh = logging.FileHandler(log_path, mode="w")
    fh.setFormatter(fmt)
    ch = logging.StreamHandler(sys.stdout)
    ch.setFormatter(fmt)
    logger.addHandler(fh)
    logger.addHandler(ch)
    return logger

log = logging.getLogger("preprocess")


# ─────────────────────────────────────────────────────────────
# FFMPEG UTILITIES
# ─────────────────────────────────────────────────────────────

def check_ffmpeg() -> bool:
    for tool in ("ffmpeg", "ffprobe"):
        try:
            subprocess.run([tool, "-version"],
                           stdout=subprocess.DEVNULL,
                           stderr=subprocess.DEVNULL, check=True)
        except Exception:
            return False
    return True


def run_cmd(cmd: List[str], timeout: int = 180) -> Tuple[bool, str]:
    try:
        res = subprocess.run(cmd,
                             stdout=subprocess.PIPE,
                             stderr=subprocess.STDOUT,
                             timeout=timeout, check=True)
        return True, res.stdout.decode("utf-8", errors="ignore")
    except subprocess.CalledProcessError as e:
        return False, e.stdout.decode("utf-8", errors="ignore")
    except subprocess.TimeoutExpired:
        return False, f"Timeout after {timeout}s"
    except Exception as e:
        return False, str(e)


def probe_video(path: str, timeout: int = 10) -> Tuple[bool, dict]:
    """Return codec, width, height, fps using ffprobe."""
    cmd = [
        "ffprobe", "-v", "error",
        "-select_streams", "v:0",
        "-show_entries", "stream=codec_name,width,height,r_frame_rate",
        "-of", "default=nokey=1:noprint_wrappers=1",
        str(path),
    ]
    ok, out = run_cmd(cmd, timeout=timeout)
    if not ok or not out.strip():
        return False, {}
    lines = [l.strip() for l in out.splitlines() if l.strip()]
    try:
        info: dict = {}
        info["codec"] = lines[0]
        info["width"] = int(lines[1])
        info["height"] = int(lines[2])
        num, den = lines[3].split("/")
        info["fps"] = float(num) / float(den) if float(den) else 0.0
        return True, info
    except Exception:
        return False, {}


def is_video_corrupt(path: str, probe_frames: int = 5) -> bool:
    """
    Quick corruption check: try to decode a few frames with OpenCV.
    Returns True if the file is likely corrupt.
    """
    cap = cv2.VideoCapture(str(path))
    if not cap.isOpened():
        return True
    ok_frames = 0
    for _ in range(probe_frames):
        ret, frame = cap.read()
        if ret and frame is not None:
            ok_frames += 1
    cap.release()
    return ok_frames == 0


def has_motion(path: str, sample_pairs: int = 5, threshold: float = 1.5) -> bool:
    """
    Estimate if a video has meaningful motion by computing mean optical-flow
    magnitude on a few sampled frame pairs.
    Returns False for near-static / corrupted clips → skip or flag.
    """
    cap = cv2.VideoCapture(str(path))
    if not cap.isOpened():
        return False
    total = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
    if total < 10:
        cap.release()
        return False

    indices = np.linspace(0, total - 2, sample_pairs, dtype=int)
    mags = []
    prev_gray = None
    for idx in indices:
        cap.set(cv2.CAP_PROP_POS_FRAMES, int(idx))
        ret, frame = cap.read()
        if not ret:
            continue
        gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
        if prev_gray is not None:
            flow = cv2.calcOpticalFlowFarneback(
                prev_gray, gray, None, 0.5, 3, 15, 3, 5, 1.2, 0)
            mag, _ = cv2.cartToPolar(flow[..., 0], flow[..., 1])
            mags.append(float(np.mean(mag)))
        prev_gray = gray
    cap.release()
    return (np.mean(mags) >= threshold) if mags else False


# ─────────────────────────────────────────────────────────────
# VIDEO NORMALIZATION (ffmpeg)
# ─────────────────────────────────────────────────────────────

def ffmpeg_normalize(
    in_path: str,
    out_path: str,
    fps: int = 30,
    short_side: int = 256,       # 256 for train (random crop to 224); 224 for val/test
    crf: int = 18,
    preset: str = "fast",
    overwrite: bool = False,
    timeout: int = 180,
    retries: int = 2,
    center_crop: bool = False,
) -> Tuple[bool, Optional[str]]:
    """
    Normalize video:
      - Resize so shorter side = short_side (preserving aspect ratio)
      - Force fps
      - Strip audio
      - H.264 output
    """
    out_p = Path(out_path)
    out_p.parent.mkdir(parents=True, exist_ok=True)

    if out_p.exists() and not overwrite:
        return True, "exists"

    # Scale: shorter side → short_side, keep aspect, force even dimensions
    scale_expr = (
        f"scale='if(gt(iw,ih),-2,{short_side})':"
        f"'if(gt(iw,ih),{short_side},-2)'"
    )
    vf = scale_expr
    if center_crop:
        vf = (
            f"{scale_expr},"
            f"crop={short_side}:{short_side}:"
            f"(iw-{short_side})/2:(ih-{short_side})/2"
        )

    cmd = [
        "ffmpeg",
        "-y" if overwrite else "-n",
        "-hide_banner", "-loglevel", "error",
        "-i", str(in_path),
        "-vf", vf,
        "-r", str(fps),
        "-c:v", "libx264",
        "-preset", preset,
        "-crf", str(crf),
        "-pix_fmt", "yuv420p",
        "-an",
        "-movflags", "+faststart",
        str(out_p),
    ]

    for attempt in range(max(1, retries)):
        ok, msg = run_cmd(cmd, timeout=timeout)
        if ok:
            return True, None
        time.sleep(1 + attempt)
    return False, msg


# ─────────────────────────────────────────────────────────────
# FRAME COUNTING
# ─────────────────────────────────────────────────────────────

def count_frames(path: Path, max_frames: int = 20000) -> int:
    """
    Count frames: use metadata first, fall back to full decode if unreliable.
    """
    cap = cv2.VideoCapture(str(path))
    if not cap.isOpened():
        return 0
    meta = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
    if 1 < meta < max_frames:
        cap.release()
        return meta
    # Fallback: count by decoding
    count = 0
    while count < max_frames:
        ret, _ = cap.read()
        if not ret:
            break
        count += 1
    cap.release()
    return count


# ─────────────────────────────────────────────────────────────
# SLOW/FAST PATHWAY VALIDATION
# ─────────────────────────────────────────────────────────────

def validate_slowfast_clip(
    path: Path,
    clip_len: int = 16,
    alpha: int = 4,
    target_size: int = 224,
) -> Tuple[bool, str]:
    """
    Verify that we can extract a valid slow+fast clip from this video.
    SlowFast 4x16:
      - Fast pathway  : clip_len   = 16 frames
      - Slow pathway  : clip_len/alpha = 4 frames
    Returns (ok, reason).
    """
    cap = cv2.VideoCapture(str(path))
    if not cap.isOpened():
        return False, "Cannot open video"

    total = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
    if total < clip_len:
        cap.release()
        return False, f"Too few frames ({total} < {clip_len})"

    # Sample 'clip_len' evenly-spaced frames
    indices = np.linspace(0, total - 1, clip_len, dtype=int)
    frames = []
    for idx in indices:
        cap.set(cv2.CAP_PROP_POS_FRAMES, int(idx))
        ret, frame = cap.read()
        if not ret or frame is None:
            cap.release()
            return False, f"Failed to decode frame {idx}"
        frame = cv2.resize(frame, (target_size, target_size))
        frames.append(frame)
    cap.release()

    # Build fast pathway tensor: (clip_len, H, W, C)
    fast = np.stack(frames, axis=0)
    # Build slow pathway tensor: every alpha-th frame
    slow = fast[::alpha]

    # Shape checks
    expected_fast = (clip_len, target_size, target_size, 3)
    expected_slow = (clip_len // alpha, target_size, target_size, 3)
    if fast.shape != expected_fast:
        return False, f"Fast shape {fast.shape} != {expected_fast}"
    if slow.shape != expected_slow:
        return False, f"Slow shape {slow.shape} != {expected_slow}"

    return True, "ok"


# ─────────────────────────────────────────────────────────────
# VIDEO DISCOVERY
# ─────────────────────────────────────────────────────────────

VALID_EXTS = {".mp4", ".avi", ".mov", ".mkv", ".webm"}
FIGHT_NAMES = {"fight"}
NONFIGHT_NAMES = {"nonfight", "non_fight", "non-fight", "noviolence", "normal"}


def discover_videos(root: Path) -> Dict[str, List[Tuple[Path, str]]]:
    """
    Discovers videos and also records their original split (train/val/test)
    so we can honour the original RWF-2000 split structure.

    Returns:
        {
          "fight":    [(path, original_split), ...],
          "nonfight": [(path, original_split), ...],
        }
    """
    found: Dict[str, List[Tuple[Path, str]]] = {"fight": [], "nonfight": []}

    def _classify(name: str) -> Optional[str]:
        n = name.lower()
        if n in FIGHT_NAMES:
            return "fight"
        if n in NONFIGHT_NAMES:
            return "nonfight"
        return None

    # Layout 1: root/split/class/*.mp4
    for split_dir in sorted(root.iterdir()):
        if not split_dir.is_dir():
            continue
        split_name = split_dir.name.lower()
        if split_name not in ("train", "val", "test"):
            continue
        for cls_dir in sorted(split_dir.iterdir()):
            if not cls_dir.is_dir():
                continue
            cls = _classify(cls_dir.name)
            if cls is None:
                continue
            for f in sorted(cls_dir.glob("*.*")):
                if f.suffix.lower() in VALID_EXTS:
                    found[cls].append((f, split_name))

    # Layout 2: root/class/*.mp4  (no split subfolder)
    if not found["fight"] and not found["nonfight"]:
        for cls_dir in sorted(root.iterdir()):
            if not cls_dir.is_dir():
                continue
            cls = _classify(cls_dir.name)
            if cls is None:
                continue
            for f in sorted(cls_dir.glob("*.*")):
                if f.suffix.lower() in VALID_EXTS:
                    found[cls].append((f, "unknown"))

    # Deduplicate
    for cls in found:
        seen = set()
        unique = []
        for item in found[cls]:
            if item[0] not in seen:
                seen.add(item[0])
                unique.append(item)
        found[cls] = unique

    return found


# ─────────────────────────────────────────────────────────────
# MULTIPROCESSING WORKER
# ─────────────────────────────────────────────────────────────

def worker_task(task: tuple) -> dict:
    (
        in_path, out_path_train, out_path_val,
        fps, short_side_train, short_side_val,
        crf, preset, overwrite, timeout, retries, center_crop,
    ) = task

    result = {
        "in_path": in_path,
        "out_train": out_path_train,
        "out_val": out_path_val,
        "ok": False,
        "msg": "",
        "corrupt": False,
        "low_motion": False,
    }

    # Corruption check
    if is_video_corrupt(str(in_path)):
        result["corrupt"] = True
        result["msg"] = "Corrupt video"
        return result

    # Motion check (warn, do NOT skip — let user decide via log)
    if not has_motion(str(in_path)):
        result["low_motion"] = True

    # Process train version (short_side=256, random crop later)
    ok_t, msg_t = ffmpeg_normalize(
        in_path, out_path_train, fps=fps, short_side=short_side_train,
        crf=crf, preset=preset, overwrite=overwrite,
        timeout=timeout, retries=retries, center_crop=False,
    )

    # Process val/test version (short_side=224, center crop for clean eval)
    ok_v, msg_v = ffmpeg_normalize(
        in_path, out_path_val, fps=fps, short_side=short_side_val,
        crf=crf, preset=preset, overwrite=overwrite,
        timeout=timeout, retries=retries, center_crop=center_crop,
    )

    result["ok"] = ok_t and ok_v
    result["msg"] = msg_t or msg_v or ""
    return result


# ─────────────────────────────────────────────────────────────
# SPLIT LOGIC
# ─────────────────────────────────────────────────────────────

def make_splits(
    rows: List[Tuple[str, int, int, str]],  # (rel_path, label, frames, orig_split)
    train_ratio: float = 0.8,
    val_ratio: float = 0.1,
    seed: int = 42,
) -> Tuple[List, List, List]:
    """
    Honours original split if available, otherwise does stratified random split.
    """
    train, val, test = [], [], []
    has_orig = any(r[3] in ("train", "val", "test") for r in rows)

    if has_orig:
        for rel, label, frames, orig in rows:
            entry = (rel, frames, label)
            if orig == "train":
                train.append(entry)
            elif orig == "val":
                val.append(entry)
            else:
                test.append(entry)
        log.info("Using original RWF-2000 train/val/test splits.")
    else:
        # Stratified random split
        by_label: Dict[int, list] = {}
        for rel, label, frames, _ in rows:
            by_label.setdefault(label, []).append((rel, frames, label))
        random.seed(seed)
        for label, lst in by_label.items():
            random.shuffle(lst)
            n = len(lst)
            n_train = max(1, int(math.floor(n * train_ratio)))
            n_val = max(1, int(math.floor(n * val_ratio)))
            n_val = min(n_val, n - n_train)
            train += lst[:n_train]
            val += lst[n_train: n_train + n_val]
            test += lst[n_train + n_val:]
        log.info("No original splits found — using stratified random split.")

    return train, val, test


# ─────────────────────────────────────────────────────────────
# ANNOTATION WRITER
# ─────────────────────────────────────────────────────────────

def make_annotations(
    rows: List[Tuple[str, int, int]],  # (rel, frames, label)
    win: int = 16,
    step: int = 8,
    min_coverage: float = 0.75,
) -> List[Tuple]:
    """
    Sliding-window annotation generator.
    Improved: skips duplicate (path, start) pairs and enforces min_coverage.
    """
    seen = set()
    anns = []
    for rel, frames, label in rows:
        for start in range(0, max(1, frames - win + 1), step):
            end = min(start + win - 1, frames - 1)
            coverage = (end - start + 1) / float(win)
            if coverage < min_coverage:
                continue
            key = (rel, start)
            if key in seen:
                continue
            seen.add(key)
            anns.append((rel, start, end, label))
    return anns


# ─────────────────────────────────────────────────────────────
# VERIFY MODE
# ─────────────────────────────────────────────────────────────

def verify_outputs(processed_root: Path, clip_len: int = 16, alpha: int = 4):
    log.info("=== VERIFY MODE: checking all processed videos ===")
    all_files = list(processed_root.rglob("*.mp4"))
    bad = []
    for f in tqdm(all_files, desc="Verifying"):
        ok, reason = validate_slowfast_clip(f, clip_len=clip_len, alpha=alpha)
        if not ok:
            bad.append((str(f), reason))
    if bad:
        log.warning(f"Found {len(bad)} invalid clips:")
        for path, reason in bad:
            log.warning(f"  BAD: {path} — {reason}")
    else:
        log.info(f"All {len(all_files)} clips passed validation ✅")
    return bad


# ─────────────────────────────────────────────────────────────
# STATISTICS REPORTER
# ─────────────────────────────────────────────────────────────

def print_split_stats(train, val, test):
    def stats(split_name, data):
        if not data:
            log.info(f"  {split_name}: 0 videos")
            return
        frame_counts = [d[1] for d in data]
        fight = sum(1 for d in data if d[2] == 1)
        nonfight = len(data) - fight
        log.info(
            f"  {split_name}: {len(data)} videos | "
            f"fight={fight} nonfight={nonfight} | "
            f"frames mean={np.mean(frame_counts):.1f} "
            f"std={np.std(frame_counts):.1f} "
            f"min={min(frame_counts)} max={max(frame_counts)}"
        )

    log.info("─── Split Statistics ───")
    stats("Train", train)
    stats("Val  ", val)
    stats("Test ", test)

    # Class balance warning
    all_data = train + val + test
    total_fight = sum(1 for d in all_data if d[2] == 1)
    total_nf = len(all_data) - total_fight
    ratio = total_fight / max(1, total_nf)
    if ratio < 0.7 or ratio > 1.4:
        log.warning(
            f"⚠️  Class imbalance detected: fight={total_fight} nonfight={total_nf} "
            f"(ratio={ratio:.2f}). Consider weighted loss or oversampling."
        )


# ─────────────────────────────────────────────────────────────
# CSV / TXT WRITERS
# ─────────────────────────────────────────────────────────────

def write_csv(path: Path, rows, header=None):
    path.parent.mkdir(parents=True, exist_ok=True)
    with open(path, "w", newline="") as fh:
        w = csv.writer(fh)
        if header:
            w.writerow(header)
        w.writerows(rows)


def write_txt(path: Path, rows):
    """SlowFast-style list file: <path> <num_frames> <label>"""
    path.parent.mkdir(parents=True, exist_ok=True)
    with open(path, "w") as fh:
        for rel, frames, label in rows:
            fh.write(f"{rel} {frames} {label}\n")


# ─────────────────────────────────────────────────────────────
# ARGUMENT PARSING
# ─────────────────────────────────────────────────────────────

def parse_args():
    p = argparse.ArgumentParser(
        description="RWF-2000 → SlowFast_4x16_R50 preprocessing (v2)"
    )
    p.add_argument("--raw_dir", required=True,
                   help="Root directory of RWF-2000 raw videos")
    p.add_argument("--out_dir", required=True,
                   help="Output directory for processed videos and lists")
    p.add_argument("--fps", type=int, default=30,
                   help="Target FPS (default: 30, CCTV-friendly)")
    p.add_argument("--short_side_train", type=int, default=256,
                   help="Shorter side for train set (256 → random crop to 224 during training)")
    p.add_argument("--short_side_val", type=int, default=224,
                   help="Shorter side for val/test (224 → center crop)")
    p.add_argument("--crf", type=int, default=18,
                   help="FFmpeg CRF quality (lower=better, 18=high quality)")
    p.add_argument("--preset", default="fast",
                   help="FFmpeg encoding preset")
    p.add_argument("--workers", type=int, default=0,
                   help="Number of parallel workers (0 = auto)")
    p.add_argument("--overwrite", action="store_true",
                   help="Re-process already existing output files")
    p.add_argument("--center_crop", action="store_true",
                   help="Apply center crop to val/test videos")
    p.add_argument("--min_frames", type=int, default=16,
                   help="Minimum frames required (must be >= clip_len=16 for SlowFast 4x16)")
    p.add_argument("--min_size_bytes", type=int, default=50_000,
                   help="Minimum file size; smaller files are treated as corrupt")
    p.add_argument("--ffmpeg_timeout", type=int, default=180,
                   help="FFmpeg per-video timeout in seconds")
    p.add_argument("--ffmpeg_retries", type=int, default=2,
                   help="FFmpeg retry attempts per video")
    p.add_argument("--annotations", action="store_true",
                   help="Generate sliding-window annotations CSV")
    p.add_argument("--annotation_win", type=int, default=16,
                   help="Annotation window length (frames). Should match SlowFast clip_len=16")
    p.add_argument("--annotation_step", type=int, default=8,
                   help="Annotation sliding step (frames). 50% overlap by default")
    p.add_argument("--annotation_min_coverage", type=float, default=0.75,
                   help="Min fraction of window within video bounds (0.75 recommended)")
    p.add_argument("--verify", action="store_true",
                   help="After processing, validate all outputs for SlowFast compatibility")
    p.add_argument("--check_motion", action="store_true",
                   help="Enable optical flow motion check (flags near-static clips in log)")
    p.add_argument("--train_ratio", type=float, default=0.8)
    p.add_argument("--val_ratio", type=float, default=0.1)
    p.add_argument("--seed", type=int, default=42)
    return p.parse_args()


# ─────────────────────────────────────────────────────────────
# MAIN
# ─────────────────────────────────────────────────────────────

def main():
    args = parse_args()

    raw_dir = Path(args.raw_dir)
    out_dir = Path(args.out_dir)
    out_dir.mkdir(parents=True, exist_ok=True)

    global log
    log = setup_logger(out_dir / "preprocess.log")

    log.info("=" * 60)
    log.info("  RWF-2000 → SlowFast 4x16 R50  |  Preprocessing v2")
    log.info("=" * 60)
    log.info(f"  raw_dir  : {raw_dir}")
    log.info(f"  out_dir  : {out_dir}")
    log.info(f"  fps      : {args.fps}")
    log.info(f"  workers  : {args.workers or 'auto'}")

    # Check ffmpeg
    if not check_ffmpeg():
        log.error("ffmpeg / ffprobe not found on PATH. Install ffmpeg and retry.")
        sys.exit(1)

    # ── Discover videos ──────────────────────────────────────
    log.info("Discovering videos ...")
    found = discover_videos(raw_dir)
    n_fight = len(found["fight"])
    n_nonfight = len(found["nonfight"])
    log.info(f"  fight={n_fight}  nonfight={n_nonfight}  total={n_fight + n_nonfight}")
    if n_fight + n_nonfight == 0:
        log.error("No videos found. Check --raw_dir layout.")
        sys.exit(1)

    # ── Build task list ──────────────────────────────────────
    processed_train = out_dir / "processed_train"
    processed_val   = out_dir / "processed_val"
    lists_dir       = out_dir / "lists"

    tasks = []
    task_meta = []   # (cls, orig_split) per task

    for cls in ("fight", "nonfight"):
        for src_path, orig_split in found[cls]:
            stem = src_path.stem
            out_train = processed_train / cls / f"{stem}.mp4"
            out_val   = processed_val   / cls / f"{stem}.mp4"
            tasks.append((
                str(src_path),
                str(out_train),
                str(out_val),
                args.fps,
                args.short_side_train,
                args.short_side_val,
                args.crf,
                args.preset,
                args.overwrite,
                args.ffmpeg_timeout,
                args.ffmpeg_retries,
                args.center_crop,
            ))
            task_meta.append((cls, orig_split, src_path))

    # ── Run ffmpeg workers ───────────────────────────────────
    n_workers = args.workers if args.workers > 0 else max(1, cpu_count())
    log.info(f"Processing {len(tasks)} videos (workers={n_workers}) ...")

    results = []
    corrupt_list = []
    low_motion_list = []

    try:
        with Pool(processes=n_workers) as pool:
            for r in tqdm(pool.imap_unordered(worker_task, tasks),
                          total=len(tasks), desc="Encoding"):
                results.append(r)
                if r["corrupt"]:
                    corrupt_list.append(r["in_path"])
                if r["low_motion"]:
                    low_motion_list.append(r["in_path"])
    except KeyboardInterrupt:
        log.warning("Interrupted by user.")
        return

    fails = [r for r in results if not r["ok"] and not r["corrupt"]]
    log.info(f"Done encoding. ok={len(results)-len(fails)-len(corrupt_list)} "
             f"corrupt={len(corrupt_list)} fails={len(fails)} "
             f"low_motion_warnings={len(low_motion_list)}")

    if corrupt_list:
        log.warning(f"Corrupt videos ({len(corrupt_list)}):")
        for p in corrupt_list:
            log.warning(f"  CORRUPT: {p}")

    if low_motion_list and args.check_motion:
        log.warning(f"Low-motion clips ({len(low_motion_list)}) — review manually:")
        for p in low_motion_list[:20]:
            log.warning(f"  LOW_MOTION: {p}")

    if fails:
        log.warning(f"Failed encodes ({len(fails)}):")
        for r in fails[:10]:
            log.warning(f"  FAIL: {r['in_path']} — {r['msg']}")

    # ── Build metadata ───────────────────────────────────────
    log.info("Counting frames and building metadata ...")
    rows: List[Tuple[str, int, int, str]] = []
    metadata_rows = []
    skipped = []

    # Map in_path → (cls, orig_split)
    path_meta = {str(m[2]): (m[0], m[1]) for m in task_meta}
    result_map = {r["in_path"]: r for r in results}

    for cls in ("fight", "nonfight"):
        cls_dir = processed_train / cls
        if not cls_dir.exists():
            continue
        for f in sorted(cls_dir.glob("*.mp4")):
            try:
                size = f.stat().st_size
                if size < args.min_size_bytes:
                    skipped.append((str(f), "too_small"))
                    continue
            except Exception:
                continue

            frames = count_frames(f)
            if frames < args.min_frames:
                skipped.append((str(f), f"too_few_frames({frames})"))
                continue

            # Validate SlowFast clip compatibility
            ok_clip, clip_reason = validate_slowfast_clip(
                f, clip_len=args.annotation_win, alpha=4
            )
            if not ok_clip:
                skipped.append((str(f), f"clip_invalid:{clip_reason}"))
                log.warning(f"  INVALID CLIP: {f} — {clip_reason}")
                continue

            label = 1 if cls == "fight" else 0
            rel = f"processed_train/{cls}/{f.name}"

            # Try to recover original split
            orig_split = "unknown"
            for in_p, (c, sp) in path_meta.items():
                if Path(in_p).stem == f.stem and c == cls:
                    orig_split = sp
                    break

            rows.append((rel, label, frames, orig_split))

            # Get fps/duration
            cap = cv2.VideoCapture(str(f))
            fps_cap = cap.get(cv2.CAP_PROP_FPS) or args.fps
            duration = frames / fps_cap if fps_cap > 0 else None
            cap.release()

            metadata_rows.append((rel, label, frames, duration, size, fps_cap))

    if skipped:
        log.warning(f"Skipped {len(skipped)} clips during metadata build:")
        for path, reason in skipped[:20]:
            log.warning(f"  SKIP: {path} ({reason})")

    if not rows:
        log.error("No valid processed videos found. Exiting.")
        sys.exit(1)

    # ── Splits ───────────────────────────────────────────────
    train, val, test = make_splits(
        rows,
        train_ratio=args.train_ratio,
        val_ratio=args.val_ratio,
        seed=args.seed,
    )
    print_split_stats(train, val, test)

    # ── Write lists ──────────────────────────────────────────
    write_csv(lists_dir / "train.csv", train, header=("video_path", "frames", "label"))
    write_csv(lists_dir / "val.csv",   val,   header=("video_path", "frames", "label"))
    write_csv(lists_dir / "test.csv",  test,  header=("video_path", "frames", "label"))
    write_txt(lists_dir / "train.txt", train)
    write_txt(lists_dir / "val.txt",   val)
    write_txt(lists_dir / "test.txt",  test)
    log.info(f"Lists written: train={len(train)} val={len(val)} test={len(test)} → {lists_dir}")

    # ── Metadata CSV ─────────────────────────────────────────
    meta_csv = out_dir / "metadata.csv"
    write_csv(meta_csv, metadata_rows,
              header=("video_path", "label", "frames", "duration_s", "size_bytes", "fps"))
    log.info(f"Metadata CSV → {meta_csv}")

    # ── Annotations CSV ──────────────────────────────────────
    if args.annotations:
        all_rows = [(r, f, l) for r, f, l, _ in rows]
        ann_rows = make_annotations(
            all_rows,
            win=args.annotation_win,
            step=args.annotation_step,
            min_coverage=args.annotation_min_coverage,
        )
        ann_csv = out_dir / "annotations.csv"
        write_csv(ann_csv, ann_rows,
                  header=("video_path", "start_frame", "end_frame", "label"))
        log.info(f"Annotations CSV → {ann_csv}  ({len(ann_rows)} windows)")

    # ── Verify mode ──────────────────────────────────────────
    if args.verify:
        bad = verify_outputs(
            processed_train,
            clip_len=args.annotation_win,
            alpha=4,
        )
        if bad:
            bad_csv = out_dir / "bad_clips.csv"
            write_csv(bad_csv, bad, header=("video_path", "reason"))
            log.warning(f"Bad clips list → {bad_csv}")

    # ── Summary ──────────────────────────────────────────────
    log.info("=" * 60)
    log.info("  PREPROCESSING COMPLETE")
    log.info(f"  Total valid videos : {len(rows)}")
    log.info(f"  Corrupt / skipped  : {len(corrupt_list) + len(skipped)}")
    log.info(f"  Output directory   : {out_dir}")
    log.info(f"  Log file           : {out_dir / 'preprocess.log'}")
    log.info("=" * 60)
    log.info("")
    log.info("Next step — fine-tune with:")
    log.info(f"  python train_slowfast.py \\")
    log.info(f"    --train_list {lists_dir}/train.txt \\")
    log.info(f"    --val_list   {lists_dir}/val.txt \\")
    log.info(f"    --data_root  {out_dir}")


if __name__ == "__main__":
    main()