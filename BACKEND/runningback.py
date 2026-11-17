#!/usr/bin/env python3
"""
fight_detection_integrated.py

Production-grade Real-Time Violence Detection System
Architecture:
  CCTV/Video → ThreadedCapture → YOLOv8+ByteTrack → SlowFast(fine-tuned)
             → [Violence Confirmed?] → InsightFace → AlertWorker
             → Flask API → Web Dashboard (Livestream + Stats)

Key upgrades over old code:
  1. Loads fine-tuned PyTorch model checkpoint (.pth)
  2. Clip preprocessing matches training pipeline exactly (4x16 pathways)
  3. Standalone Script: Native OpenCV window + MP4 video save output
  4. Config via environment variables for deployment flexibility
  5. Annotated frame queue (thread-safe, drop-on-full)
  6. Alert cooldown per track (avoid duplicate alerts)
  7. All components cleanly separated into classes

Usage:
    python3 runningback.py \\
        --model       C:\\Users\\swrjk\\OneDrive\\Desktop\\SREEPATHY\\runs\\exp1\\best.pth \\
        --source      fight.mp4 \\
        --yolo        yolov8n.pt \\
        --face_db     ./face_db \\
        --alert_dir   ./alerts
"""

import argparse
import csv
import gc
import io
import json
import logging
import os
import queue
import random
import signal
import sys
import threading
import time
import traceback
from collections import defaultdict, deque
from dataclasses import dataclass, field
from pathlib import Path
from typing import Dict, List, Optional, Tuple

import cv2
import numpy as np
import torch
import torch.nn as nn
from fastapi import FastAPI, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
import uvicorn
from ultralytics import YOLO

# ─────────────────────────────────────────────────────────────
# LOGGING
# ─────────────────────────────────────────────────────────────

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(levelname)s | %(name)s | %(message)s",
    datefmt="%H:%M:%S",
)
log = logging.getLogger("FightDetect")


# ─────────────────────────────────────────────────────────────
# CONFIGURATION
# ─────────────────────────────────────────────────────────────

@dataclass
class Config:
    # Paths
    model_path:    str = r"C:\Users\swrjk\OneDrive\Desktop\SREEPATHY\runs\exp1\best.pth"
    yolo_model:    str = "yolov8n.pt"
    tracker_cfg:   str = "bytetrack.yaml"
    video_source:  str = "fight.mp4"   # 0 = webcam
    alert_dir:     str = "./alerts"
    face_db_dir:   str = "./face_db"

    # SlowFast params — must match training config
    clip_len:      int   = 16           # fast pathway frames (SlowFast 4x16)
    alpha:         int   = 4            # slow = every 4th frame → 4 frames
    input_size:    int   = 224
    mean:          Tuple = (0.45, 0.45, 0.45)
    std:           Tuple = (0.225, 0.225, 0.225)

    # Detection thresholds
    fight_thresh_on:  float = 0.68      # above → fight alert ON
    fight_thresh_off: float = 0.53      # below → fight alert OFF (hysteresis)
    smooth_window:    int   = 3         # moving average window for probabilities
    yolo_conf:        float = 0.25
    yolo_iou:         float = 0.45
    stale_frames:     int   = 150       # drop track if unseen

    # Alert cooldown: minimum seconds between alerts for same track
    alert_cooldown:   float = 5.0

    # Performance
    inference_stride: int  = 2          # run SlowFast every N frames
    device:           str  = "cuda" if torch.cuda.is_available() else "cpu"
    use_amp:          bool = True       # FP16 inference


# ─────────────────────────────────────────────────────────────
# FINE-TUNED SLOWFAST LOADER (PyTorch `.pth` Checkpoint)
# ─────────────────────────────────────────────────────────────

def build_slowfast_model(num_classes: int = 2, pretrained: bool = False, dropout: float = 0.5):
    """
    Build SlowFast R50 using pytorchvideo via torch.hub.
    Replaces the 400-class head with a binary classification head.
    """
    log.info("Loading SlowFast R50 architecture ...")
    model = torch.hub.load(
        "facebookresearch/pytorchvideo",
        "slowfast_r50",
        pretrained=pretrained,
    )

    # Replace the classification head for binary classification
    # The head is: model.blocks[-1].proj  (Linear 400 -> num_classes)
    in_features = model.blocks[-1].proj.in_features
    model.blocks[-1].proj = nn.Linear(in_features, num_classes)
    model.blocks[-1].dropout = nn.Dropout(p=dropout)

    return model

def load_finetuned_model(model_path: str, device: torch.device) -> nn.Module:
    """
    Load the fine-tuned SlowFast model from a PyTorch .pth checkpoint.
    """
    log.info(f"Loading fine-tuned SlowFast checkpoint: {model_path}")
    if not Path(model_path).exists():
        raise FileNotFoundError(f"Model not found: {model_path}")
    
    model = build_slowfast_model(num_classes=2, pretrained=False)
    
    ckpt = torch.load(model_path, map_location=device)
    if "model" in ckpt:
        model.load_state_dict(ckpt["model"])
    else:
        model.load_state_dict(ckpt)  # Fallback in case state dict is bare
        
    model.to(device)
    model.eval()
    log.info(f"  Model loaded on {device}")
    return model


# ─────────────────────────────────────────────────────────────
# PREPROCESSING — matches training pipeline exactly
# ─────────────────────────────────────────────────────────────

def preprocess_clip(
    frames: List[np.ndarray],
    cfg: Config,
    device: torch.device,
) -> Tuple[torch.Tensor, torch.Tensor]:
    """
    Input : list of `clip_len` RGB uint8 frames (H,W,3)
    Output: (slow_tensor, fast_tensor) on device
      fast: (1, 3, clip_len,       input_size, input_size)
      slow: (1, 3, clip_len//alpha, input_size, input_size)
    """
    mean = np.array(cfg.mean, dtype=np.float32)
    std  = np.array(cfg.std,  dtype=np.float32)
    size = cfg.input_size

    processed = []
    for f in frames:
        h, w = f.shape[:2]
        # Resize short side to 256 then center crop to 224
        scale = 256 / min(h, w)
        new_w, new_h = int(w * scale), int(h * scale)
        f = cv2.resize(f, (new_w, new_h), interpolation=cv2.INTER_LINEAR)
        # Center crop
        sy = (new_h - size) // 2
        sx = (new_w - size) // 2
        f = f[sy:sy+size, sx:sx+size]
        f = f.astype(np.float32) / 255.0
        f = (f - mean) / std
        processed.append(f)

    # (T, H, W, C) → (C, T, H, W)
    arr = np.stack(processed, axis=0)
    tensor = torch.from_numpy(arr).permute(3, 0, 1, 2).float()

    fast = tensor.unsqueeze(0)                        # (1, C, T, H, W)
    slow = tensor[:, ::cfg.alpha, :, :].unsqueeze(0)  # (1, C, T//alpha, H, W)

    if device.type == "cuda":
        fast = fast.pin_memory().to(device, non_blocking=True)
        slow = slow.pin_memory().to(device, non_blocking=True)
    else:
        fast = fast.to(device)
        slow = slow.to(device)

    return slow, fast


# ─────────────────────────────────────────────────────────────
# THREADED VIDEO CAPTURE
# ─────────────────────────────────────────────────────────────

class VideoCaptureThread:
    def __init__(self, src):
        self.cap   = cv2.VideoCapture(src)
        self._lock = threading.Lock()
        self._frame = None
        self._stop  = threading.Event()
        self._thread = threading.Thread(target=self._run, daemon=True)

    def start(self):
        self._thread.start()
        time.sleep(0.5)
        return self

    def _run(self):
        fps = self.cap.get(cv2.CAP_PROP_FPS) or 30
        delay = 1.0 / fps
        while not self._stop.is_set():
            t0 = time.time()
            ret, frame = self.cap.read()
            if not ret:
                self._stop.set()
                break
            with self._lock:
                self._frame = frame
            wait = delay - (time.time() - t0)
            if wait > 0:
                time.sleep(wait)

    def read(self) -> Optional[np.ndarray]:
        with self._lock:
            return self._frame.copy() if self._frame is not None else None

    def is_running(self) -> bool:
        return not self._stop.is_set()

    def stop(self):
        self._stop.set()
        self._thread.join(timeout=2.0)
        self.cap.release()

    @property
    def fps(self) -> float:
        return self.cap.get(cv2.CAP_PROP_FPS) or 30.0

    @property
    def frame_size(self) -> Tuple[int, int]:
        return (
            int(self.cap.get(cv2.CAP_PROP_FRAME_WIDTH)),
            int(self.cap.get(cv2.CAP_PROP_FRAME_HEIGHT)),
        )


# ─────────────────────────────────────────────────────────────
# INFERENCE WORKER (SlowFast in background thread)
# ─────────────────────────────────────────────────────────────

class InferenceWorker:
    def __init__(self, model_path: str, cfg: Config):
        self.model_path = model_path
        self.cfg    = cfg
        self.device = torch.device(cfg.device)
        self.in_q   = queue.Queue(maxsize=8)
        self.out_q  = queue.Queue()
        self._stop  = threading.Event()
        self._thread = threading.Thread(target=self._run, daemon=True, name="InferenceWorker")

    def start(self):
        self._thread.start()
        return self

    def _run(self):
        model = load_finetuned_model(self.model_path, self.device)
        use_amp = self.cfg.use_amp and self.device.type == "cuda"

        while not self._stop.is_set():
            try:
                tid, frames = self.in_q.get(timeout=0.1)
            except queue.Empty:
                continue

            try:
                slow, fast = preprocess_clip(frames, self.cfg, self.device)
                with torch.no_grad():
                    if use_amp:
                        with torch.cuda.amp.autocast():
                            logits = model([slow, fast])
                    else:
                        logits = model([slow, fast])
                    prob = float(torch.softmax(logits, dim=1)[0, 1].cpu())

                try:
                    self.out_q.put_nowait((tid, prob))
                except queue.Full:
                    pass
            except Exception:
                log.warning(f"Inference error for track {tid}:")
                traceback.print_exc()
            finally:
                try:
                    self.in_q.task_done()
                except Exception:
                    pass

    def submit(self, tid: int, frames: List[np.ndarray]) -> bool:
        try:
            self.in_q.put_nowait((tid, frames))
            return True
        except queue.Full:
            return False

    def drain_results(self) -> List[Tuple[int, float]]:
        results = []
        while not self.out_q.empty():
            try:
                results.append(self.out_q.get_nowait())
            except queue.Empty:
                break
        return results

    def stop(self):
        self._stop.set()
        self._thread.join(timeout=3.0)


# ─────────────────────────────────────────────────────────────
# FACE RECOGNIZER (InsightFace — alert-only)
# ─────────────────────────────────────────────────────────────

class FaceRecognizer:
    def __init__(self, db_dir: str, threshold: float = 0.45):
        self.enabled   = False
        self.threshold = threshold
        self.db: Dict[str, np.ndarray] = {}

        # InsightFace face detection enabled
        try:
            from insightface.app import FaceAnalysis
            ctx = 0 if torch.cuda.is_available() else -1
            self.app = FaceAnalysis(name="buffalo_l")
            self.app.prepare(ctx_id=ctx, det_size=(320, 320))
            self.enabled = True
            log.info("InsightFace initialized")
            self._load_db(db_dir)
        except Exception as e:
            log.warning(f"InsightFace not available: {e}")
            self.enabled = False

    def _load_db(self, db_dir: str):
        if not Path(db_dir).exists():
            log.warning(f"Face DB not found: {db_dir}")
            return
        count = 0
        for person_dir in sorted(Path(db_dir).iterdir()):
            if not person_dir.is_dir():
                continue
            embeds = []
            for img_path in sorted(person_dir.glob("*.*")):
                try:
                    img = cv2.imread(str(img_path))
                    if img is None:
                        continue
                    faces = self.app.get(img)
                    if faces:
                        embeds.append(np.array(faces[0].embedding, dtype=np.float32))
                except Exception:
                    continue
            if embeds:
                self.db[person_dir.name] = np.mean(embeds, axis=0)
                count += 1
        log.info(f"Face DB: {count} identities loaded from {db_dir}")

    def identify(self, img_bgr: np.ndarray) -> Tuple[str, float]:
        if not self.enabled or img_bgr is None:
            return "Unknown", 0.0
        try:
            faces = self.app.get(img_bgr)
            if not faces:
                return "Unknown", 0.0
            emb = np.array(faces[0].embedding, dtype=np.float32)
            best_name, best_score = "Unknown", 0.0
            for name, ref in self.db.items():
                sim = float(np.dot(emb, ref) / (np.linalg.norm(emb) * np.linalg.norm(ref) + 1e-8))
                if sim > best_score:
                    best_name, best_score = name, sim
            if best_score >= self.threshold:
                return best_name, best_score
            return "Unknown", best_score
        except Exception:
            return "Unknown", 0.0


# ─────────────────────────────────────────────────────────────
# ALERT WORKER (async file I/O)
# ─────────────────────────────────────────────────────────────

class AlertWorker:
    def __init__(self, alert_dir: str):
        self.alert_dir = Path(alert_dir)
        self.alert_dir.mkdir(parents=True, exist_ok=True)
        self._q      = queue.Queue(maxsize=256)
        self._stop   = threading.Event()
        self._thread = threading.Thread(target=self._run, daemon=True, name="AlertWorker")
        self._events: List[dict] = []   # in-memory log for API
        self._lock   = threading.Lock()
        self._init_csv()
        self._thread.start()

    def _init_csv(self):
        csv_path = self.alert_dir / "fight_events.csv"
        if not csv_path.exists():
            with open(csv_path, "w", newline="") as f:
                csv.writer(f).writerow([
                    "timestamp", "track_id", "prob_fight",
                    "name", "face_conf",
                    "x1", "y1", "x2", "y2",
                    "source", "frame_path", "face_path",
                ])

    def log_alert(self, frame, tid, prob, bbox,
                  source, name="Unknown", face_conf=0.0, face_crop=None):
        payload = {
            "frame":     frame.copy() if frame is not None else None,
            "face_crop": face_crop.copy() if face_crop is not None else None,
            "tid":       int(tid),
            "prob":      float(prob),
            "bbox":      tuple(int(v) for v in bbox),
            "source":    str(source),
            "name":      str(name),
            "face_conf": float(face_conf),
            "time_str":  time.strftime("%Y-%m-%d %H:%M:%S"),
            "file_ts":   time.strftime("%Y%m%d_%H%M%S"),
        }
        try:
            self._q.put_nowait(payload)
        except queue.Full:
            log.warning("AlertWorker queue full — dropping alert")

    def _run(self):
        while not self._stop.is_set() or not self._q.empty():
            try:
                p = self._q.get(timeout=0.2)
            except queue.Empty:
                continue
            try:
                self._process(p)
            except Exception:
                traceback.print_exc()
            finally:
                try:
                    self._q.task_done()
                except Exception:
                    pass

    def _process(self, p):
        base = f"alert_tid{p['tid']}_{p['file_ts']}"
        frame_path = face_path = ""

        if p["frame"] is not None:
            frame_path = str(self.alert_dir / f"{base}_frame.jpg")
            cv2.imwrite(frame_path, p["frame"])

        if p["face_crop"] is not None:
            face_path = str(self.alert_dir / f"{base}_face.jpg")
            cv2.imwrite(face_path, p["face_crop"])

        row = [
            p["time_str"], p["tid"], f"{p['prob']:.3f}",
            p["name"], f"{p['face_conf']:.3f}",
            *p["bbox"], p["source"], frame_path, face_path,
        ]
        with open(self.alert_dir / "fight_events.csv", "a", newline="") as f:
            csv.writer(f).writerow(row)

        event = {
            "timestamp":  p["time_str"],
            "track_id":   p["tid"],
            "prob":       round(p["prob"], 3),
            "name":       p["name"],
            "face_conf":  round(p["face_conf"], 3),
            "frame_path": frame_path,
        }
        with self._lock:
            self._events.append(event)
            if len(self._events) > 500:
                self._events = self._events[-500:]

        log.info(f"ALERT saved — track={p['tid']} prob={p['prob']:.3f} name={p['name']}")

    def get_events(self, n: int = 50) -> List[dict]:
        with self._lock:
            return list(reversed(self._events[-n:]))

    def stop(self):
        self._stop.set()
        self._thread.join(timeout=3.0)


# ─────────────────────────────────────────────────────────────
# SYSTEM STATS
# ─────────────────────────────────────────────────────────────

def get_system_stats() -> dict:
    stats = {}
    try:
        import psutil
        stats["cpu_percent"]   = psutil.cpu_percent(interval=None)
        stats["ram_percent"]   = psutil.virtual_memory().percent
    except Exception:
        stats["cpu_percent"]   = 0
        stats["ram_percent"]   = 0
    if torch.cuda.is_available():
        try:
            alloc = torch.cuda.memory_allocated() / 1e9
            total = torch.cuda.get_device_properties(0).total_memory / 1e9
            stats["gpu_mem_used_gb"]  = round(alloc, 2)
            stats["gpu_mem_total_gb"] = round(total, 2)
            stats["gpu_name"]         = torch.cuda.get_device_name(0)
        except Exception:
            pass
    return stats


# ─────────────────────────────────────────────────────────────
# FASTAPI BACKEND SETUP
# ─────────────────────────────────────────────────────────────

app = FastAPI(title="VisionGuard API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

pipeline_instance = None # Will be set in main()

@app.get("/api/stats")
async def get_stats():
    if pipeline_instance:
        return pipeline_instance.get_stats()
    return {}

@app.get("/api/events")
async def get_events(n: int = 50):
    if pipeline_instance:
        return pipeline_instance.alert_worker.get_events(n)
    return []

@app.post("/api/add_face")
async def add_face(name: str = Form(...), file: UploadFile = File(...)):
    if not pipeline_instance:
        return {"error": "Pipeline not initialized"}
    
    # Save the file to face_db
    db_dir = Path(pipeline_instance.cfg.face_db_dir)
    person_dir = db_dir / name
    person_dir.mkdir(parents=True, exist_ok=True)
    
    file_path = person_dir / file.filename
    with open(file_path, "wb") as f:
        f.write(await file.read())
        
    # Reload DB
    if pipeline_instance.face_rec.enabled:
        pipeline_instance.face_rec._load_db(str(pipeline_instance.cfg.face_db_dir))
        
    return {"message": f"Successfully added {name}'s face and reloaded DB"}

def generate_frames():
    while True:
        if not pipeline_instance:
            time.sleep(0.1)
            continue
            
        frame = pipeline_instance.get_annotated_frame()
        if frame is None:
            time.sleep(0.01)
            continue
            
        ret, buffer = cv2.imencode('.jpg', frame)
        if not ret:
            continue
            
        frame_bytes = buffer.tobytes()
        yield (b'--frame\r\n'
               b'Content-Type: image/jpeg\r\n\r\n' + frame_bytes + b'\r\n')

@app.get("/video_feed")
async def video_feed():
    return StreamingResponse(generate_frames(), media_type="multipart/x-mixed-replace; boundary=frame")


# ─────────────────────────────────────────────────────────────
# MAIN PIPELINE ORCHESTRATOR
# ─────────────────────────────────────────────────────────────

class FightDetectionPipeline:
    def __init__(self, cfg: Config):
        self.cfg = cfg
        self.device = torch.device(cfg.device)
        self._annotated_q: queue.Queue = queue.Queue(maxsize=4)
        self._stop = threading.Event()

        # State
        self.frame_buffers: Dict[int, deque]     = defaultdict(lambda: deque(maxlen=cfg.clip_len))
        self.prob_buffers:  Dict[int, deque]     = defaultdict(lambda: deque(maxlen=cfg.smooth_window))
        self.alert_state:   Dict[int, bool]      = defaultdict(bool)
        self.last_seen:     Dict[int, int]        = {}
        self.last_alert_time: Dict[int, float]   = defaultdict(float)

        # Metrics
        self._fps         = 0.0
        self._total_alerts = 0
        self._global_fight = False
        self._active_tracks: Dict[int, dict] = {}
        self._stats_lock = threading.Lock()

    def setup(self):
        log.info("=" * 55)
        log.info("  VisionGuard — Initialising Components")
        log.info("=" * 55)

        # Video
        log.info(f"Opening video source: {self.cfg.video_source}")
        self.video = VideoCaptureThread(self.cfg.video_source).start()

        # YOLO
        log.info(f"Loading YOLO: {self.cfg.yolo_model}")
        self.yolo = YOLO(self.cfg.yolo_model)

        # SlowFast inference worker
        log.info("Starting inference worker ...")
        self.inference = InferenceWorker(self.cfg.model_path, self.cfg).start()

        # Face recognizer
        self.face_rec = FaceRecognizer(self.cfg.face_db_dir)

        # Alert worker
        self.alert_worker = AlertWorker(self.cfg.alert_dir)
        
        # Output Video Writer
        self.video_writer = None
        if self.video.frame_size[0] > 0 and self.video.frame_size[1] > 0:
            fourcc = cv2.VideoWriter_fourcc(*'mp4v')
            self.video_writer = cv2.VideoWriter(
                "output_fight.mp4", 
                fourcc, 
                self.video.fps, 
                self.video.frame_size
            )

        log.info("All components ready ✅")

    def get_annotated_frame(self) -> Optional[np.ndarray]:
        try:
            return self._annotated_q.get_nowait()
        except queue.Empty:
            return None

    def get_stats(self) -> dict:
        with self._stats_lock:
            return {
                "fps":          round(self._fps, 1),
                "active_tracks": len(self._active_tracks),
                "total_alerts": self._total_alerts,
                "global_fight": self._global_fight,
                "tracks":       {str(k): v for k, v in self._active_tracks.items()},
            }

    def run(self):
        frame_idx   = 0
        fps_t0      = time.time()
        fps_count   = 0

        log.info(f"Pipeline running. Displaying output in OpenCV window.")
        log.info("Press 'q' to quit.")

        try:
            while self.video.is_running() and not self._stop.is_set():
                frame = self.video.read()
                if frame is None:
                    time.sleep(0.01)
                    continue

                # ── FPS ─────────────────────────────────────
                fps_count += 1
                elapsed = time.time() - fps_t0
                if elapsed >= 1.0:
                    with self._stats_lock:
                        self._fps = fps_count / elapsed
                    fps_count = 0
                    fps_t0 = time.time()

                # ── Collect inference results ────────────────
                for tid, prob in self.inference.drain_results():
                    self.prob_buffers[tid].append(prob)

                # ── YOLO + ByteTrack ─────────────────────────
                try:
                    results = self.yolo.track(
                        frame, persist=True,
                        tracker=self.cfg.tracker_cfg,
                        classes=[0], verbose=False,
                        conf=self.cfg.yolo_conf,
                        iou=self.cfg.yolo_iou, half=True,
                    )
                except Exception:
                    results = None

                vis_frame   = frame.copy()
                global_fight = False
                current_tracks: Dict[int, dict] = {}

                if results and results[0].boxes is not None:
                    boxes = results[0].boxes
                    if boxes.id is not None:
                        ids  = boxes.id.cpu().numpy().astype(int)
                        xyxy = boxes.xyxy.cpu().numpy()

                        for (x1, y1, x2, y2), tid in zip(xyxy, ids):
                            tid = int(tid)
                            self.last_seen[tid] = frame_idx
                            x1,y1,x2,y2 = int(x1),int(y1),int(x2),int(y2)

                            # Crop person → buffer
                            person_crop = self._safe_crop(frame, x1, y1, x2, y2)
                            if person_crop is not None:
                                rgb = cv2.cvtColor(person_crop, cv2.COLOR_BGR2RGB)
                                self.frame_buffers[tid].append(rgb)

                            # Submit inference
                            if (
                                len(self.frame_buffers[tid]) == self.cfg.clip_len
                                and frame_idx % self.cfg.inference_stride == 0
                            ):
                                self.inference.submit(tid, list(self.frame_buffers[tid]))

                            # Smooth probability
                            avg_prob = float(np.mean(self.prob_buffers[tid])) \
                                       if self.prob_buffers[tid] else 0.0

                            # State machine
                            if not self.alert_state[tid] and avg_prob >= self.cfg.fight_thresh_on:
                                self.alert_state[tid] = True
                                now = time.time()
                                # Alert with cooldown
                                if now - self.last_alert_time[tid] > self.cfg.alert_cooldown:
                                    self.last_alert_time[tid] = now
                                    face_crop = self._safe_crop(frame, x1, y1, x2, y2, pad=20)
                                    name, face_conf = "Unknown", 0.0
                                    if face_crop is not None and self.face_rec.enabled:
                                        name, face_conf = self.face_rec.identify(face_crop)
                                    self.alert_worker.log_alert(
                                        frame, tid, avg_prob,
                                        (x1, y1, x2, y2),
                                        self.cfg.video_source,
                                        name, face_conf, face_crop,
                                    )
                                    with self._stats_lock:
                                        self._total_alerts += 1

                            elif self.alert_state[tid] and avg_prob <= self.cfg.fight_thresh_off:
                                self.alert_state[tid] = False

                            if self.alert_state[tid]:
                                global_fight = True

                            # Draw
                            self._draw_track(vis_frame, tid, x1, y1, x2, y2,
                                             avg_prob, self.alert_state[tid])
                            current_tracks[tid] = {"prob": round(avg_prob, 3),
                                                   "fight": self.alert_state[tid]}

                # ── Prune stale tracks ───────────────────────
                stale = [t for t, f in self.last_seen.items()
                         if frame_idx - f > self.cfg.stale_frames]
                for t in stale:
                    for d in (self.last_seen, self.frame_buffers,
                              self.prob_buffers, self.alert_state):
                        d.pop(t, None)

                # ── Global HUD ──────────────────────────────
                if global_fight:
                    self._draw_alert_banner(vis_frame)

                self._draw_hud(vis_frame, frame_idx)

                with self._stats_lock:
                    self._global_fight = global_fight
                    self._active_tracks = current_tracks

                if self._annotated_q.full():
                    try:
                        self._annotated_q.get_nowait()
                    except queue.Empty:
                        pass
                self._annotated_q.put(vis_frame.copy())

                # Display and Save Frame directly
                cv2.imshow("VisionGuard Live", vis_frame)
                if self.video_writer is not None:
                    self.video_writer.write(vis_frame)
                    
                if cv2.waitKey(1) & 0xFF == ord('q'):
                    log.info("User requested exit ('q' pressed)")
                    break

                frame_idx += 1

        except KeyboardInterrupt:
            pass
        except Exception:
            traceback.print_exc()
        finally:
            self._shutdown()

    def _safe_crop(self, img, x1, y1, x2, y2, pad=10):
        h, w = img.shape[:2]
        x1 = max(0, x1 - pad)
        y1 = max(0, y1 - pad)
        x2 = min(w, x2 + pad)
        y2 = min(h, y2 + pad)
        if x2 <= x1 or y2 <= y1:
            return None
        return img[y1:y2, x1:x2]

    def _draw_track(self, frame, tid, x1, y1, x2, y2, prob, is_fight):
        if is_fight:
            color = (0, 0, 255)
            label = f"FIGHT  {prob:.2f}"
        elif prob > 0.4:
            color = (0, 140, 255)
            label = f"WARN  {prob:.2f}"
        else:
            color = (0, 220, 80)
            label = f"ID{tid}  {prob:.2f}"

        cv2.rectangle(frame, (x1, y1), (x2, y2), color, 2)

        # Probability bar under bbox
        bar_w = x2 - x1
        filled = int(bar_w * prob)
        cv2.rectangle(frame, (x1, y2), (x2, y2 + 4), (30, 30, 30), -1)
        cv2.rectangle(frame, (x1, y2), (x1 + filled, y2 + 4), color, -1)

        # Label background
        (tw, th), _ = cv2.getTextSize(label, cv2.FONT_HERSHEY_SIMPLEX, 0.5, 1)
        cv2.rectangle(frame, (x1, max(0, y1 - th - 6)), (x1 + tw + 4, y1), color, -1)
        cv2.putText(frame, label, (x1 + 2, max(th, y1 - 3)),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.5, (255, 255, 255), 1, cv2.LINE_AA)

    def _draw_alert_banner(self, frame):
        h, w = frame.shape[:2]
        overlay = frame.copy()
        cv2.rectangle(overlay, (0, 0), (w, 60), (0, 0, 180), -1)
        cv2.addWeighted(overlay, 0.4, frame, 0.6, 0, frame)
        cv2.putText(frame, "!!! VIOLENCE DETECTED !!!",
                    (w // 2 - 220, 42),
                    cv2.FONT_HERSHEY_SIMPLEX, 1.1, (0, 0, 255), 3, cv2.LINE_AA)

    def _draw_hud(self, frame, frame_idx):
        with self._stats_lock:
            fps = self._fps
            alerts = self._total_alerts
        cv2.putText(frame, f"FPS: {fps:.1f}",
                    (10, 30), cv2.FONT_HERSHEY_SIMPLEX, 0.65, (0, 230, 80), 2)
        cv2.putText(frame, f"ALERTS: {alerts}",
                    (10, 56), cv2.FONT_HERSHEY_SIMPLEX, 0.55, (60, 60, 255), 2)

    def _shutdown(self):
        log.info("Shutting down pipeline ...")
        self._stop.set()
        for comp in [self.video, self.inference, self.alert_worker]:
            try:
                comp.stop()
            except Exception:
                pass
        
        if self.video_writer is not None:
            self.video_writer.release()
        try:
            cv2.destroyAllWindows()
        except cv2.error:
            pass
            
        log.info("Shutdown complete.")

    def stop(self):
        self._stop.set()


# ─────────────────────────────────────────────────────────────
# ENTRY POINT
# ─────────────────────────────────────────────────────────────

def parse_args():
    p = argparse.ArgumentParser(description="VisionGuard — Real-Time Fight Detection")
    p.add_argument("--model",     default=r"C:\Users\swrjk\OneDrive\Desktop\SREEPATHY\runs\exp1\best.pth",
                   help="Path to fine-tuned PyTorch checkpoint")
    p.add_argument("--source",    default="fight.mp4",
                   help="Video source: file path or 0 for webcam")
    p.add_argument("--yolo",      default="yolov8n.pt")
    p.add_argument("--tracker",   default="bytetrack.yaml")
    p.add_argument("--face_db",   default="./face_db")
    p.add_argument("--alert_dir", default="./alerts")
    p.add_argument("--clip_len",  type=int, default=32)
    p.add_argument("--alpha",     type=int, default=4)
    p.add_argument("--thresh_on", type=float, default=0.68)
    p.add_argument("--thresh_off",type=float, default=0.53)
    p.add_argument("--no_display",action="store_true",
                   help="Run headless (no cv2.imshow)")
    return p.parse_args()


def main():
    args = parse_args()

    # Try to parse source as int (webcam)
    source = args.source
    try:
        source = int(source)
    except ValueError:
        pass

    cfg = Config(
        model_path    = args.model,
        video_source  = source,
        yolo_model    = args.yolo,
        tracker_cfg   = args.tracker,
        face_db_dir   = args.face_db,
        alert_dir     = args.alert_dir,
        clip_len      = args.clip_len,
        alpha         = args.alpha,
        fight_thresh_on  = args.thresh_on,
        fight_thresh_off = args.thresh_off,
    )

    global pipeline_instance
    pipeline_instance = FightDetectionPipeline(cfg)
    pipeline_instance.setup()
    
    # Start FastAPI server in a background thread
    def run_api():
        uvicorn.run(app, host="0.0.0.0", port=5000, log_level="warning")
    
    api_thread = threading.Thread(target=run_api, daemon=True)
    api_thread.start()

    # Handle Ctrl+C gracefully
    def _sigint(sig, frame):
        log.info("Received SIGINT — stopping ...")
        pipeline_instance.stop()
        sys.exit(0)
    signal.signal(signal.SIGINT, _sigint)

    # Run main pipeline (blocking)
    pipeline_instance.run()


if __name__ == "__main__":
    main()