#!/usr/bin/env python3
"""
train_slowfast_rwf2000.py

Fine-tuning SlowFast_4x16_R50 (Kinetics-400 pretrained) on RWF-2000
for real-time violence detection.

Uses pytorchvideo's official SlowFast model for correct architecture
and pretrained weight loading.

Features:
  - Official pytorchvideo SlowFast 4x16 R50 model
  - Kinetics-400 pretrained weights via torch.hub
  - Two-stage training: head-only warmup -> full fine-tune
  - AdamW + Cosine Annealing
  - Mixed precision (FP16) training
  - Strong data augmentation (train) + clean eval (val)
  - Per-epoch: Accuracy, Precision, Recall, F1, Confusion Matrix
  - Early stopping on val F1
  - Saves best checkpoint + last checkpoint
  - Full logging to train.log
  - Reproducible (seed everything)

Usage:
    python train.py ^
        --data_root   ./rwf_processed ^
        --train_list  ./rwf_processed/lists/train.txt ^
        --val_list    ./rwf_processed/lists/val.txt ^
        --out_dir     ./runs/exp1 ^
        --epochs      40 ^
        --warmup_epochs 5 ^
        --batch_size  8 ^
        --lr          0.0001 ^
        --weighted_sampler
"""

import argparse
import csv
import logging
import random
import sys
import time
from pathlib import Path
from typing import List, Tuple

import cv2
import numpy as np
import torch
import torch.nn as nn
import torch.optim as optim
from torch.cuda.amp import GradScaler, autocast
from torch.utils.data import DataLoader, Dataset, WeightedRandomSampler
from sklearn.metrics import (
    accuracy_score, confusion_matrix,
    f1_score, precision_score, recall_score,
)
from tqdm import tqdm


# ---- REPRODUCIBILITY ----

def seed_everything(seed: int = 42):
    random.seed(seed)
    np.random.seed(seed)
    torch.manual_seed(seed)
    torch.cuda.manual_seed_all(seed)
    torch.backends.cudnn.deterministic = True
    torch.backends.cudnn.benchmark = False


# ---- LOGGING ----

def setup_logger(log_path: Path) -> logging.Logger:
    log_path.parent.mkdir(parents=True, exist_ok=True)
    fmt = logging.Formatter("%(asctime)s | %(levelname)s | %(message)s", "%H:%M:%S")
    logger = logging.getLogger("train")
    logger.setLevel(logging.DEBUG)
    # Remove old handlers to avoid duplicates on re-run
    logger.handlers.clear()
    fh = logging.FileHandler(log_path, mode="w", encoding="utf-8")
    fh.setFormatter(fmt)
    ch = logging.StreamHandler(sys.stdout)
    ch.setFormatter(fmt)
    logger.addHandler(fh)
    logger.addHandler(ch)
    return logger

log = logging.getLogger("train")


# ---- MODEL: Official pytorchvideo SlowFast ----

def build_slowfast_model(num_classes: int = 2, pretrained: bool = True, dropout: float = 0.5):
    """
    Build SlowFast R50 using pytorchvideo via torch.hub.
    Replaces the 400-class head with a binary classification head.
    """
    log.info("Loading SlowFast R50 from pytorchvideo (torch.hub) ...")
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

    log.info(f"  Head replaced: {in_features} -> {num_classes}")
    log.info(f"  Total params: {sum(p.numel() for p in model.parameters()):,}")
    return model


def freeze_backbone(model):
    """Freeze all layers except the final classification head."""
    for name, param in model.named_parameters():
        if "blocks.6" in name:  # block 6 is the head
            param.requires_grad = True
        else:
            param.requires_grad = False
    trainable = sum(p.numel() for p in model.parameters() if p.requires_grad)
    log.info(f"Backbone frozen. Trainable params: {trainable:,}")


def unfreeze_all(model):
    """Unfreeze all parameters for full fine-tuning."""
    for param in model.parameters():
        param.requires_grad = True
    trainable = sum(p.numel() for p in model.parameters() if p.requires_grad)
    log.info(f"All layers unfrozen. Trainable params: {trainable:,}")


# ---- DATASET ----

class RWF2000Dataset(Dataset):
    """
    Loads video clips for SlowFast 4x16:
      - 16 frames total  -> fast pathway
      - 4  frames sampled -> slow pathway (every 4th frame)

    Train: random temporal crop + spatial augmentation
    Val:   center temporal crop + center spatial crop
    """

    MEAN = np.array([0.45, 0.45, 0.45], dtype=np.float32)
    STD  = np.array([0.225, 0.225, 0.225], dtype=np.float32)

    def __init__(self, list_file, data_root, clip_len=32, alpha=4,
                 spatial_size=224, mode="train"):
        self.data_root = Path(data_root)
        self.clip_len = clip_len
        self.alpha = alpha
        self.spatial_size = spatial_size
        self.mode = mode

        self.samples = []
        with open(list_file, "r") as f:
            for line in f:
                line = line.strip()
                if not line or line.startswith("video_path"):
                    continue
                parts = line.split()
                if len(parts) == 3:
                    path, frames, label = parts
                    self.samples.append((path, int(frames), int(label)))
                elif len(parts) == 2:
                    path, label = parts
                    self.samples.append((path, -1, int(label)))

        log.info(f"[{mode}] Loaded {len(self.samples)} samples from {list_file}")

    def __len__(self):
        return len(self.samples)

    def __getitem__(self, idx):
        rel_path, num_frames, label = self.samples[idx]
        video_path = self.data_root / rel_path

        frames = self._load_frames(video_path)
        slow, fast = self._make_pathways(frames)

        return [slow, fast], label

    def _load_frames(self, path):
        cap = cv2.VideoCapture(str(path))
        if not cap.isOpened():
            raise RuntimeError(f"Cannot open: {path}")

        total = max(int(cap.get(cv2.CAP_PROP_FRAME_COUNT)), 1)

        if self.mode == "train":
            if total <= self.clip_len:
                indices = np.linspace(0, total - 1, self.clip_len, dtype=int)
            else:
                start = random.randint(0, total - self.clip_len)
                indices = np.arange(start, start + self.clip_len)
        else:
            if total <= self.clip_len:
                indices = np.linspace(0, total - 1, self.clip_len, dtype=int)
            else:
                start = (total - self.clip_len) // 2
                indices = np.arange(start, start + self.clip_len)

        frames = []
        for i in indices:
            cap.set(cv2.CAP_PROP_POS_FRAMES, int(i))
            ret, frame = cap.read()
            if not ret or frame is None:
                if frames:
                    frames.append(frames[-1].copy())
                else:
                    frames.append(np.zeros((self.spatial_size, self.spatial_size, 3), dtype=np.uint8))
                continue
            frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
            frames.append(frame)
        cap.release()

        return np.stack(frames, axis=0)  # (T, H, W, 3)

    def _make_pathways(self, frames):
        if self.mode == "train":
            frames = self._augment_train(frames)
        else:
            frames = self._augment_val(frames)

        # Normalize
        frames = (frames - self.MEAN) / self.STD

        # (T, H, W, 3) -> (3, T, H, W)
        tensor = torch.from_numpy(frames).permute(3, 0, 1, 2).float()

        # SlowFast expects [slow_tensor, fast_tensor]
        fast = tensor                        # (3, T, H, W)
        slow = tensor[:, ::self.alpha, :, :] # (3, T//alpha, H, W)

        return slow, fast

    def _augment_train(self, frames):
        T, H, W, C = frames.shape
        frames = self._resize_short_side(frames, 256)
        T, H, W, C = frames.shape

        top = random.randint(0, max(0, H - self.spatial_size))
        left = random.randint(0, max(0, W - self.spatial_size))
        frames = frames[:, top:top+self.spatial_size, left:left+self.spatial_size, :]

        if random.random() < 0.5:
            frames = frames[:, :, ::-1, :].copy()

        frames = frames.astype(np.float32) / 255.0

        brightness = random.uniform(0.8, 1.2)
        contrast = random.uniform(0.8, 1.2)
        frames = np.clip(frames * brightness, 0, 1)
        mean = frames.mean()
        frames = np.clip((frames - mean) * contrast + mean, 0, 1)

        if random.random() < 0.3:
            noise = np.random.normal(0, 0.02, frames.shape).astype(np.float32)
            frames = np.clip(frames + noise, 0, 1)

        return frames

    def _augment_val(self, frames):
        frames = self._resize_short_side(frames, self.spatial_size)
        T, H, W, C = frames.shape
        top = max(0, (H - self.spatial_size) // 2)
        left = max(0, (W - self.spatial_size) // 2)
        frames = frames[:, top:top+self.spatial_size, left:left+self.spatial_size, :]
        return frames.astype(np.float32) / 255.0

    @staticmethod
    def _resize_short_side(frames, short_side):
        T, H, W, C = frames.shape
        if min(H, W) == short_side:
            return frames
        if H < W:
            new_h = short_side
            new_w = int(W * short_side / H)
        else:
            new_w = short_side
            new_h = int(H * short_side / W)
        new_w = new_w if new_w % 2 == 0 else new_w + 1
        new_h = new_h if new_h % 2 == 0 else new_h + 1
        resized = np.stack(
            [cv2.resize(f, (new_w, new_h), interpolation=cv2.INTER_LINEAR) for f in frames],
            axis=0,
        )
        return resized


def slowfast_collate(batch):
    slow_list, fast_list, labels = [], [], []
    for (slow, fast), label in batch:
        slow_list.append(slow)
        fast_list.append(fast)
        labels.append(label)
    return [torch.stack(slow_list), torch.stack(fast_list)], torch.tensor(labels, dtype=torch.long)


# ---- METRICS ----

def compute_metrics(all_labels, all_preds):
    acc = accuracy_score(all_labels, all_preds)
    prec = precision_score(all_labels, all_preds, zero_division=0)
    rec = recall_score(all_labels, all_preds, zero_division=0)
    f1 = f1_score(all_labels, all_preds, zero_division=0)
    cm = confusion_matrix(all_labels, all_preds)
    return {"acc": acc, "precision": prec, "recall": rec, "f1": f1, "cm": cm}


def print_metrics(phase, metrics, epoch, loss):
    cm = metrics["cm"]
    log.info(
        f"[{phase}] Epoch {epoch:03d} | "
        f"Loss={loss:.4f} | Acc={metrics['acc']:.4f} | "
        f"P={metrics['precision']:.4f} | R={metrics['recall']:.4f} | F1={metrics['f1']:.4f}"
    )
    if cm is not None and cm.size > 0:
        log.info(f"  Confusion Matrix:\n{cm}")
        if cm.shape == (2, 2):
            tn, fp, fn, tp = cm.ravel()
            log.info(f"  TP={tp} FP={fp} FN={fn} TN={tn}")


# ---- WEIGHTED SAMPLER ----

def make_weighted_sampler(dataset):
    labels = [s[2] for s in dataset.samples]
    class_counts = np.bincount(labels)
    class_weights = 1.0 / class_counts
    sample_weights = [class_weights[l] for l in labels]
    return WeightedRandomSampler(
        weights=sample_weights,
        num_samples=len(sample_weights),
        replacement=True,
    )


# ---- TRAINING LOOP ----

def train_one_epoch(model, loader, criterion, optimizer, scaler, device, epoch):
    model.train()
    total_loss = 0.0
    all_labels, all_preds = [], []

    pbar = tqdm(loader, desc=f"Train E{epoch:03d}", leave=False)
    for inputs, labels in pbar:
        slow = inputs[0].to(device, non_blocking=True)
        fast = inputs[1].to(device, non_blocking=True)
        labels = labels.to(device, non_blocking=True)

        optimizer.zero_grad()

        with autocast():
            logits = model([slow, fast])
            loss = criterion(logits, labels)

        scaler.scale(loss).backward()
        scaler.unscale_(optimizer)
        nn.utils.clip_grad_norm_(model.parameters(), max_norm=1.0)
        scaler.step(optimizer)
        scaler.update()

        preds = logits.argmax(dim=1).cpu().numpy()
        all_labels.extend(labels.cpu().numpy())
        all_preds.extend(preds)
        total_loss += loss.item()
        pbar.set_postfix(loss=f"{loss.item():.4f}")

    avg_loss = total_loss / len(loader)
    metrics = compute_metrics(all_labels, all_preds)
    return avg_loss, metrics


@torch.no_grad()
def validate(model, loader, criterion, device, epoch):
    model.eval()
    total_loss = 0.0
    all_labels, all_preds = [], []

    pbar = tqdm(loader, desc=f"Val   E{epoch:03d}", leave=False)
    for inputs, labels in pbar:
        slow = inputs[0].to(device, non_blocking=True)
        fast = inputs[1].to(device, non_blocking=True)
        labels = labels.to(device, non_blocking=True)

        with autocast():
            logits = model([slow, fast])
            loss = criterion(logits, labels)

        preds = logits.argmax(dim=1).cpu().numpy()
        all_labels.extend(labels.cpu().numpy())
        all_preds.extend(preds)
        total_loss += loss.item()

    avg_loss = total_loss / len(loader)
    metrics = compute_metrics(all_labels, all_preds)
    return avg_loss, metrics


# ---- CHECKPOINT ----

def save_checkpoint(state, path):
    path.parent.mkdir(parents=True, exist_ok=True)
    torch.save(state, str(path))


def load_checkpoint(model, optimizer, scheduler, path, device):
    log.info(f"Resuming from checkpoint: {path}")
    ckpt = torch.load(path, map_location=device)
    model.load_state_dict(ckpt["model"])
    optimizer.load_state_dict(ckpt["optimizer"])
    scheduler.load_state_dict(ckpt["scheduler"])
    return ckpt.get("epoch", 0), ckpt.get("best_f1", 0.0)


# ---- ARGS ----

def parse_args():
    p = argparse.ArgumentParser(
        description="Fine-tune SlowFast 4x16 R50 on RWF-2000"
    )
    p.add_argument("--data_root", required=True)
    p.add_argument("--train_list", required=True)
    p.add_argument("--val_list", required=True)
    p.add_argument("--pretrained", default=None,
                   help="Ignored (uses torch.hub pretrained). Kept for CLI compat.")
    p.add_argument("--resume", default=None)
    p.add_argument("--out_dir", default="./runs/exp1")
    p.add_argument("--num_classes", type=int, default=2)
    p.add_argument("--clip_len", type=int, default=32)
    p.add_argument("--alpha", type=int, default=4)
    p.add_argument("--dropout", type=float, default=0.5)
    p.add_argument("--epochs", type=int, default=40)
    p.add_argument("--warmup_epochs", type=int, default=5)
    p.add_argument("--batch_size", type=int, default=8)
    p.add_argument("--lr", type=float, default=1e-4)
    p.add_argument("--weight_decay", type=float, default=1e-4)
    p.add_argument("--label_smoothing", type=float, default=0.1)
    p.add_argument("--early_stop", type=int, default=10)
    p.add_argument("--workers", type=int, default=4)
    p.add_argument("--seed", type=int, default=42)
    p.add_argument("--no_amp", action="store_true")
    p.add_argument("--weighted_sampler", action="store_true")
    return p.parse_args()


# ---- MAIN ----

def main():
    args = parse_args()
    out_dir = Path(args.out_dir)
    out_dir.mkdir(parents=True, exist_ok=True)

    global log
    log = setup_logger(out_dir / "train.log")
    seed_everything(args.seed)

    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    use_amp = not args.no_amp and torch.cuda.is_available()

    log.info("=" * 60)
    log.info("  SlowFast 4x16 R50 -- Fine-tuning on RWF-2000")
    log.info("=" * 60)
    log.info(f"  Device    : {device}")
    log.info(f"  AMP (FP16): {use_amp}")
    log.info(f"  Clip len  : {args.clip_len} (fast) / {args.clip_len // args.alpha} (slow)")
    log.info(f"  Epochs    : {args.epochs}  (warmup={args.warmup_epochs})")
    log.info(f"  Batch size: {args.batch_size}")
    log.info(f"  LR        : {args.lr}  WD={args.weight_decay}")

    # -- Datasets --
    train_ds = RWF2000Dataset(
        args.train_list, args.data_root,
        clip_len=args.clip_len, alpha=args.alpha, mode="train"
    )
    val_ds = RWF2000Dataset(
        args.val_list, args.data_root,
        clip_len=args.clip_len, alpha=args.alpha, mode="val"
    )

    sampler = make_weighted_sampler(train_ds) if args.weighted_sampler else None

    train_loader = DataLoader(
        train_ds, batch_size=args.batch_size,
        sampler=sampler, shuffle=(sampler is None),
        num_workers=args.workers, pin_memory=True,
        collate_fn=slowfast_collate, drop_last=True,
    )
    val_loader = DataLoader(
        val_ds, batch_size=args.batch_size,
        shuffle=False, num_workers=args.workers,
        pin_memory=True, collate_fn=slowfast_collate,
    )

    log.info(f"  Train batches: {len(train_loader)} | Val batches: {len(val_loader)}")

    # -- Model (official pytorchvideo) --
    model = build_slowfast_model(
        num_classes=args.num_classes,
        pretrained=True,
        dropout=args.dropout,
    ).to(device)

    # -- Loss --
    criterion = nn.CrossEntropyLoss(label_smoothing=args.label_smoothing)

    # -- Optimizer: separate LR for head vs backbone --
    head_params = list(model.blocks[-1].parameters())
    head_param_ids = {id(p) for p in head_params}
    backbone_params = [p for p in model.parameters() if id(p) not in head_param_ids]

    optimizer = optim.AdamW([
        {"params": head_params,     "lr": args.lr},
        {"params": backbone_params, "lr": args.lr * 0.1},
    ], weight_decay=args.weight_decay)

    scheduler = optim.lr_scheduler.CosineAnnealingLR(
        optimizer, T_max=args.epochs, eta_min=1e-6
    )

    scaler = GradScaler(enabled=use_amp)

    # -- Resume --
    start_epoch = 1
    best_f1 = 0.0
    no_improve_count = 0

    if args.resume:
        start_epoch, best_f1 = load_checkpoint(
            model, optimizer, scheduler, args.resume, device
        )
        start_epoch += 1

    # -- Stage 1: Head-only warmup --
    if start_epoch == 1:
        freeze_backbone(model)
        log.info(f"Stage 1: Head warmup for {args.warmup_epochs} epochs ...")

    # -- Training loop --
    log.info("-" * 60)
    history = []

    for epoch in range(start_epoch, args.epochs + 1):

        # Unfreeze backbone after warmup
        if epoch == args.warmup_epochs + 1:
            unfreeze_all(model)
            log.info("Stage 2: Full fine-tuning started.")
            # Rebuild optimizer with all params unfrozen
            head_params = list(model.blocks[-1].parameters())
            head_param_ids = {id(p) for p in head_params}
            backbone_params = [p for p in model.parameters() if id(p) not in head_param_ids]
            optimizer = optim.AdamW([
                {"params": head_params,     "lr": args.lr},
                {"params": backbone_params, "lr": args.lr * 0.1},
            ], weight_decay=args.weight_decay)
            scheduler = optim.lr_scheduler.CosineAnnealingLR(
                optimizer, T_max=args.epochs - args.warmup_epochs, eta_min=1e-6
            )

        t0 = time.time()
        train_loss, train_metrics = train_one_epoch(
            model, train_loader, criterion, optimizer, scaler, device, epoch
        )
        val_loss, val_metrics = validate(
            model, val_loader, criterion, device, epoch
        )
        scheduler.step()

        elapsed = time.time() - t0
        cur_lr = optimizer.param_groups[0]["lr"]

        print_metrics("Train", train_metrics, epoch, train_loss)
        print_metrics("Val  ", val_metrics,   epoch, val_loss)
        log.info(f"  LR={cur_lr:.2e} | Time={elapsed:.1f}s")
        log.info("-" * 60)

        history.append({
            "epoch": epoch,
            "train_loss": train_loss, "val_loss": val_loss,
            "train_acc": train_metrics["acc"], "val_acc": val_metrics["acc"],
            "train_f1": train_metrics["f1"],   "val_f1": val_metrics["f1"],
            "val_recall": val_metrics["recall"],
        })

        # Save last checkpoint
        save_checkpoint({
            "epoch": epoch, "model": model.state_dict(),
            "optimizer": optimizer.state_dict(),
            "scheduler": scheduler.state_dict(),
            "best_f1": best_f1, "val_metrics": val_metrics,
        }, out_dir / "last.pth")

        # Save best checkpoint (on val F1)
        val_f1 = val_metrics["f1"]
        if val_f1 > best_f1:
            best_f1 = val_f1
            no_improve_count = 0
            save_checkpoint({
                "epoch": epoch, "model": model.state_dict(),
                "optimizer": optimizer.state_dict(),
                "scheduler": scheduler.state_dict(),
                "best_f1": best_f1, "val_metrics": val_metrics,
            }, out_dir / "best.pth")
            log.info(f"  >> New best val F1 = {best_f1:.4f} -- saved best.pth")
        else:
            no_improve_count += 1
            log.info(
                f"  Val F1 did not improve ({no_improve_count}/{args.early_stop}) "
                f"[best={best_f1:.4f}]"
            )

        # Early stopping
        if no_improve_count >= args.early_stop:
            log.info(f"Early stopping triggered at epoch {epoch}.")
            break

    # -- Training complete --
    log.info("=" * 60)
    log.info(f"  Training complete. Best Val F1 = {best_f1:.4f}")
    log.info("=" * 60)

    # Save training history CSV
    history_csv = out_dir / "history.csv"
    with open(history_csv, "w", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=history[0].keys())
        writer.writeheader()
        writer.writerows(history)
    log.info(f"Training history saved to {history_csv}")

    # Load best and save final
    log.info("Loading best checkpoint ...")
    best_ckpt = torch.load(out_dir / "best.pth", map_location=device)
    model.load_state_dict(best_ckpt["model"])

    log.info("Done! Files saved:")
    log.info(f"  Best checkpoint  : {out_dir / 'best.pth'}")
    log.info(f"  Last checkpoint  : {out_dir / 'last.pth'}")
    log.info(f"  Training history : {history_csv}")
    log.info(f"  Training log     : {out_dir / 'train.log'}")


if __name__ == "__main__":
    main()