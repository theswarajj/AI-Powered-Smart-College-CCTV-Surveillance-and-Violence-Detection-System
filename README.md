# SentinelX AI — Smart College CCTV Surveillance & Violence Detection System

<div align="center">

![Python](https://img.shields.io/badge/Python-3.10-blue.svg?logo=python&logoColor=white)
![PyTorch](https://img.shields.io/badge/PyTorch-2.0+-EE4C2C.svg?logo=pytorch&logoColor=white)
![CUDA](https://img.shields.io/badge/CUDA-RTX%203070%20Ti-76B900.svg?logo=nvidia&logoColor=white)
![YOLOv8](https://img.shields.io/badge/YOLOv8-Ultralytics-00FFFF.svg)
![SlowFast](https://img.shields.io/badge/SlowFast-4x16%20ResNet50-FF6F00.svg)
![InsightFace](https://img.shields.io/badge/FaceRec-InsightFace-red.svg)
![Next.js](https://img.shields.io/badge/Next.js-16%20App%20Router-black.svg?logo=next.js&logoColor=white)
![React](https://img.shields.io/badge/React-19-61DAFB.svg?logo=react&logoColor=black)
![TailwindCSS](https://img.shields.io/badge/Tailwind-CSS-38B2AC.svg?logo=tailwind-css&logoColor=white)
![Author](https://img.shields.io/badge/Author-Swaraj%20Krishna%20P%20P-brightgreen.svg)
![Education](https://img.shields.io/badge/KTU-Class%20of%202026-blueviolet.svg)

**An end-to-end intelligent campus security framework integrating real-time human detection, spatial-temporal action recognition, facial identification, and an enterprise management dashboard.**

[Overview](#-about-the-project) • [Demo Videos](#-demo--showcase-media) • [System Architecture](#-system-architecture) • [ML & Training Pipeline](#-deep-learning--training-pipeline) • [Frontend Dashboard](#-premium-frontend-dashboard) • [Installation & Usage](#-installation--quick-start)

---

</div>

## 📌 About The Project

Campus safety is one of the most critical responsibilities for educational institutions worldwide. Traditional CCTV monitoring relies almost entirely on human security personnel watching dozens of split-screen feeds in real time. Cognitive science research demonstrates that after just 20 minutes of continuous monitoring, an operator misses up to 95% of subtle scene activity due to visual fatigue. As a result, standard CCTV systems remain purely **reactive** and **forensic** — footage is only investigated *after* a fight or injury has already occurred.

I designed and engineered **SentinelX AI (VisionGuard)** to bridge this gap by transforming conventional passive CCTV cameras into an **active, proactive threat detection system**.

Instead of treating violence detection as simple 2D image classification (which notoriously triggers false alarms whenever students run, embrace, or play sports), my architecture models human interactions **across space and time**. By combining real-time human localization, multi-object temporal tracking, a fine-tuned two-pathway 3D Spatiotemporal Convolutional Network (SlowFast), and facial feature extraction, SentinelX AI accurately identifies violent altercations as they unfold, logs the timestamp and location, and checks suspect identities against a registered student database.

---

## 🎥 Demo & Showcase Media

To allow full reproducibility and immediate demonstration, I have included the sample test files directly in this repository:

| File | Description | Status in Repository |
| :--- | :--- | :--- |
| **[`input_fight.mp4`](file:///c:/Users/swrjk/OneDrive/Desktop/sentinelX_AI/AI-Powered%20Smart%20College%20CCTV%20Surveillance%20and%20Violence%20Detection%20System/input_fight.mp4)** | Raw CCTV surveillance test clip containing dynamic real-world student altercation. | Included (~12.9 MB) |
| **[`output_fight.mp4`](file:///c:/Users/swrjk/OneDrive/Desktop/sentinelX_AI/AI-Powered%20Smart%20College%20CCTV%20Surveillance%20and%20Violence%20Detection%20System/output_fight.mp4)** | Real-time processed output featuring YOLOv8 bounding boxes, ByteTrack IDs, live SlowFast fight confidence bars, red danger banner overlay, and facial verification. | Included (~34.9 MB) |

### Key Visual Indicators Rendered in `output_fight.mp4`:
- **Tracking Bounding Box & HUD**: Individual bounding boxes with tracking ID (`ID<x>`) and current fight probability score (`0.00` to `1.00`).
- **Dynamic Probability Gauge**: Real-time colored progress bar mounted under each bounding box (Green = Safe, Orange = Warning, Red = Fight).
- **Hysteresis Alert State**: Instant HUD alert banner (`!!! VIOLENCE DETECTED !!!`) displayed across the camera view whenever violence confidence crosses the activation threshold.
- **Identity Recognition**: Automated face crop triggered during an alert event and matched against `face_db` embeddings to log person names.

---

## 🛠️ Tech Stack & Hardware

### Core Technologies
- **Deep Learning Framework**: PyTorch 2.0+ (CUDA Accelerated)
- **Spatiotemporal Action Recognition**: SlowFast (4×16 ResNet-50 backbone) via PyTorchVideo
- **Object Detection**: YOLOv8 Nano (`yolov8n.pt`) via Ultralytics
- **Multi-Object Tracking**: ByteTrack
- **Facial Feature Embedding**: InsightFace (`buffalo_l` ResNet-50 / ArcFace) with ONNX Runtime
- **Backend Server & Streaming**: FastAPI, Uvicorn, OpenCV, Multiprocessing / Threading
- **Frontend Dashboard**: Next.js 16 (App Router), React 19, Tailwind CSS, Radix UI Primitives, Lucide Icons

### Hardware Setup
- **Training & Inference Hardware**: Local NVIDIA GeForce RTX 3070 Ti GPU (8 GB GDDR6X VRAM)
- **Host OS**: Windows 11 (x64)
- **Environment**: Python 3.10 with native CUDA 11.8/12.x execution

---

## 🏗️ System Architecture

The pipeline operates as an asynchronous, multi-threaded producer-consumer system designed to maximize throughput and minimize latency:

```
                      ┌──────────────────────────────────────┐
                      │    CCTV Camera / Video Stream Source  │
                      └──────────────────┬───────────────────┘
                                         │
                                         ▼
                      ┌──────────────────────────────────────┐
                      │    Threaded Frame Capture Buffer     │
                      └──────────────────┬───────────────────┘
                                         │
                                         ▼
                      ┌──────────────────────────────────────┐
                      │    YOLOv8 Person Detection (Class 0) │
                      └──────────────────┬───────────────────┘
                                         │
                                         ▼
                      ┌──────────────────────────────────────┐
                      │       ByteTrack Temporal Tracker     │
                      │     (Assigns Persistent Track IDs)   │
                      └──────────────────┬───────────────────┘
                                         │
                                         ▼
                      ┌──────────────────────────────────────┐
                      │   Per-Track Temporal Frame Queue     │
                      │   (FIFO Buffer: 16 Frames @ 30 FPS)  │
                      └──────────────────┬───────────────────┘
                                         │
                                         ▼
                      ┌──────────────────────────────────────┐
                      │   SlowFast 4x16 R50 Spatiotemporal   │
                      │ ├─ Fast Path: 16 frames (Motion)     │
                      │ └─ Slow Path: 4 frames (Spatial)     │
                      └──────────────────┬───────────────────┘
                                         │
                                         ▼
                      ┌──────────────────────────────────────┐
                      │     Temporal Smoothing Engine        │
                      │  (Moving Average + Hysteresis Logic) │
                      └──────────────────┬───────────────────┘
                                         │
                         [Threshold Triggered? (p ≥ 0.68)]
                                         │
                        ┌────────────────┴────────────────┐
                        │                                 │
                     [YES]                               [NO]
                        │                                 │
                        ▼                                 ▼
         ┌──────────────────────────────┐          Continue Video
         │  InsightFace Face Extraction │          Tracking Loop
         │  (ArcFace 512-d Embedding)   │
         └──────────────┬───────────────┘
                        │
                        ▼
         ┌──────────────────────────────┐
         │ Cosine Match against face_db │
         │   (Identifies Student Name)  │
         └──────────────┬───────────────┘
                        │
                        ▼
         ┌──────────────────────────────┐
         │     Alert Worker Dispatch    │
         │ ├─ Save Snapshot & Face Crop │
         │ ├─ Log to fight_events.csv   │
         │ └─ Expose Event to REST API  │
         └──────────────────────────────┘
```

### Pipeline Breakdown:
1. **Threaded Video Ingestion**: Decoupled frame capture running on a dedicated thread prevents I/O bottlenecks and frame drops.
2. **Person Detection & Tracking**: Every incoming frame is evaluated by YOLOv8n (filtering exclusively for `person` class). Detections are correlated across consecutive frames using ByteTrack to maintain continuous spatial trajectories.
3. **Clip Formation & Dual-Pathway Sampling**: For every active track, a sliding window buffer collects 16 contiguous RGB crops.
   - **Fast Pathway**: Receives all 16 frames to capture fine-grained kinetic motion dynamics and rapid limb movements.
   - **Slow Pathway**: Subsamples every 4th frame ($\alpha = 4$, yielding 4 frames) to preserve static spatial context and body posture representations.
4. **Temporal Smoothing & Dual-Threshold Hysteresis**: Raw network output probabilities can fluctuate frame-to-frame. I implemented a moving average smoothing window ($N=3$) combined with hysteresis state logic:
   - **Activation Threshold (`thresh_on = 0.68`)**: Triggers an alert when probability exceeds 68%.
   - **Deactivation Threshold (`thresh_off = 0.53`)**: Remains in alert state until confidence drops below 53%, eliminating rapid alert flickering.
   - **Cooldown Throttling**: A 5-second cooldown per track ID prevents alert flooding and duplicate incident logging.
5. **Facial Recognition on Demand**: Face recognition is computationally heavy. Instead of executing face recognition continuously on every frame, InsightFace (`buffalo_l`) is triggered **only upon a confirmed violence alert**. It crops the upper region of the person bounding box, extracts a 512-dimensional feature embedding, and performs cosine similarity search against pre-enrolled student profiles in `face_db`.
6. **Asynchronous Audit Logging**: An async `AlertWorker` saves high-resolution incident frames, cropped face captures, and structured CSV records (`fight_events.csv`) containing timestamps, bounding box coordinates, camera identifier, and identified individuals.

---

## 🔬 Deep Learning & Training Pipeline

### 1. The RWF-2000 Dataset
I fine-tuned the model on the benchmark **RWF-2000 (Real-World Fight)** surveillance dataset. RWF-2000 consists of **2,000 video clips** captured directly by low-resolution CCTV and surveillance cameras in diverse indoor and outdoor environments:
- **1,000 Fight Clips**: Real physical altercations, brawls, and violent behavior.
- **1,000 Non-Fight Clips**: Normal daily activities that frequently cause false positives (cheering, group hugging, running, sports, walking).

### 2. Preprocessing & Video Conditioning (`preprocessning.py`)
To ensure high quality training data and prevent runtime errors during batch generation, I built a production-grade preprocessing engine featuring:
- **Dual-Mode Frame Extraction**: High-speed multi-threaded FFmpeg extraction with an automatic OpenCV fallback decoder.
- **Motion Pre-Validation**: Optical flow magnitude checks across frame pairs to automatically detect and flag corrupted or static video files before training.
- **Temporal Normalization**: Standardized frame rates to 30 FPS.
- **Spatial Transformation**: Preserved aspect ratio by scaling the short side to 256 pixels, followed by central spatial cropping to 224×224 pixels.
- **Pathway Generation**: Formatted data into dual Slow and Fast pathways with channel-wise ImageNet normalization ($\mu = [0.45, 0.45, 0.45]$, $\sigma = [0.225, 0.225, 0.225]$).

### 3. Model Architecture & Fine-Tuning Strategy (`train.py`)
- **Base Architecture**: SlowFast 4×16 ResNet-50 originally pretrained on Kinetics-400.
- **Custom Classification Head**: Stripped the original 400-class Kinetics projection layer and replaced it with a custom dropout-regularized ($p=0.5$) binary linear head (`Linear(in_features=2048, out_features=2)`).
- **Two-Stage Progressive Training**:
  - **Stage 1 (Head Warmup)**: All ResNet-50 backbone blocks were frozen. Only the newly initialized binary classification head was trained for 5 epochs with a conservative learning rate to prevent gradient disruption in the pretrained weights.
  - **Stage 2 (Full Backbone Fine-Tuning)**: All backbone layers were unfrozen for end-to-end fine-tuning with AdamW optimizer and a Cosine Annealing learning rate schedule.
- **Mixed Precision Acceleration**: Implemented `torch.cuda.amp.autocast` and `GradScaler` to train in FP16, doubling compute throughput and fitting memory constraints comfortably within the 8GB VRAM of the RTX 3070 Ti.
- **Class Balancing**: Integrated PyTorch's `WeightedRandomSampler` to prevent any batch skew between fight and non-fight samples.
- **Validation & Metrics**: Evaluated after every epoch on validation Accuracy, Precision, Recall, and F1-score with early stopping to prevent overfitting.

---

## 💻 Premium Frontend Dashboard

The `FRONTEND/` directory contains an enterprise-tier web dashboard built with **Next.js 16 (App Router)**, **React 19**, and styled with modern **Tailwind CSS** and **Radix UI** primitives.

> [!NOTE]
> ### ⚠️ Note on Frontend & Backend Hardware Decoupling
> In my local testing environment, I intentionally did not connect the frontend client directly to the live backend pipeline. 
> 
> **Why?** Running the full computer vision backend (YOLOv8 + ByteTrack + 3D Conv SlowFast inference + InsightFace face recognition + video encoding) requires intense local GPU compute and dedicated VRAM on the RTX 3070 Ti. Running continuous live browser streaming and web client rendering on the same machine during intensive model execution can cause GPU memory contention and throttle detection frame rates.
> 
> Therefore, I developed the frontend as an independent, modular **command center** with rich pre-built UI workflows. The frontend is already architected with ready-to-use API hooks configured to consume the backend endpoints (`/api/stats`, `/api/events`, `/video_feed`, `/api/add_face`). In an enterprise deployment with dedicated host servers or multi-GPU infrastructure, connecting both systems simply requires running both services simultaneously.

### Dashboard Pages & Feature Suite:
1. **Live Command Dashboard (`/dashboard`)**:
   - Real-time video viewport with custom live HUD overlay and offline fallback states.
   - Real-time pipeline performance metrics (Active FPS, Total Alerts, Threat Level status badge).
   - Emergency Protocol trigger for immediate campus-wide broadcast.
2. **Security Alerts Feed (`/alerts`)**:
   - Chronological incident log with color-coded threat probability ratings.
   - Associated camera identifier, incident timestamp, and verified student identity badge.
3. **Student Face Management (`/students`)**:
   - Student directory and enrollment management.
   - Multipart file upload portal enabling staff to upload portrait photos directly into the `face_db` directory via the `/api/add_face` endpoint.
4. **Multi-Camera Infrastructure (`/cameras`)**:
   - Comprehensive grid overview of CCTV cameras deployed across college zones (Library, Canteen, Main Corridor, Sports Ground, Parking).
5. **Incident Forensics & Review (`/review`)**:
   - Post-incident evidence playback, detailed breakdown of altercations, and administrative audit logging.
6. **Analytics & Heatmaps (`/analytics`)**:
   - Incident frequency analytics, peak-hour threat distributions, and historical safety trend charts.
7. **Authentication (`/login`)**:
   - Security personnel login portal with session handling and role-based permissions.

---

## 📁 Repository Directory Structure

```plaintext
AI-Powered Smart College CCTV Surveillance and Violence Detection System/
├── alerts/                         # Generated incident alerts directory
│   └── .gitkeep                    # Directory anchor (CSV and alert snapshots stored here)
├── face_db/                        # Enrolled face identity database
│   ├── akshay/                     # Registered identity folder example
│   │   └── .gitkeep
│   ├── sree/                       # Registered identity folder example
│   │   └── .gitkeep
│   └── .gitkeep
├── FRONTEND/                       # Next.js 16 / React 19 Enterprise Dashboard
│   ├── src/
│   │   ├── app/                    # App Router pages (dashboard, alerts, cameras, students, etc.)
│   │   ├── components/             # Reusable UI components, layout wrappers, and badges
│   │   └── lib/                    # Helper utilities
│   ├── public/                     # Logos, icons, and UI assets
│   ├── package.json                # Frontend package dependencies
│   └── tsconfig.json               # TypeScript configuration
├── input_fight.mp4                 # Sample surveillance video clip (Input demonstration)
├── output_fight.mp4                # Processed surveillance video with detection HUD (Output demonstration)
├── yolov8n.pt                      # Pretrained YOLOv8 Nano model weights
├── loadpretrained.py               # Utility script to download official SlowFast Kinetics-400 checkpoint
├── preprocessning.py               # Video preprocessing & dual-pathway dataset generator
├── train.py                        # SlowFast 4x16 fine-tuning script with PyTorch & AMP
├── runningback.py                  # Real-time integrated detection pipeline & FastAPI server
├── requirements.txt                # Python backend dependencies
├── .gitignore                      # Configured to protect repository from heavy datasets/weights (>100MB)
├── .gitattributes                  # LF/CRLF normalization & binary media rules
└── README.md                       # Comprehensive documentation
```

---

## 🚀 Installation & Quick Start

### 1. Prerequisites
- **Operating System**: Windows 10/11 or Ubuntu 20.04/22.04 LTS
- **Python**: Version 3.10 recommended
- **Node.js**: Version 18.x or 20.x LTS (for frontend)
- **NVIDIA GPU**: RTX 2060 or higher with updated NVIDIA Studio/Game Ready drivers and CUDA 11.8+

### 2. Backend Environment Setup
Clone the repository and install the Python dependencies:

```bash
# Clone the repository
git clone https://github.com/your-username/your-repo-name.git
cd "AI-Powered Smart College CCTV Surveillance and Violence Detection System"

# Create a virtual environment
python -m venv venv
venv\Scripts\activate   # On Windows
# source venv/bin/activate # On Linux

# Install PyTorch with CUDA support first
pip install torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cu118

# Install remaining dependencies
pip install -r requirements.txt
```

> **InsightFace Installation Note for Windows**:
> If building `insightface` from source presents C++ build tool dependencies, you can install the pre-compiled wheel included in this repo:
> ```bash
> pip install insightface-0.7.3-cp310-cp310-win_amd64.whl
> ```

### 3. Model Checkpoints
To download the base SlowFast Kinetics-400 weights:
```bash
python loadpretrained.py
```
This saves `SLOWFAST_4x16_R50.pkl` into the `checkpoints/` folder.

If you have trained a custom checkpoint or downloaded `best.pth`, place it inside `runs/exp1/best.pth` (or specify via `--model` argument).

### 4. Running the Detection Pipeline
To run the real-time detection pipeline on the included demo video:
```bash
python runningback.py --source input_fight.mp4 --model runs/exp1/best.pth
```

To run on a live webcam or RTSP camera feed:
```bash
# Webcam (ID 0)
python runningback.py --source 0

# RTSP Stream
python runningback.py --source "rtsp://username:password@camera_ip:554/stream"
```

#### Available Command-Line Arguments:
- `--source`: Path to input video file or integer webcam index (Default: `input_fight.mp4`).
- `--model`: Path to fine-tuned SlowFast PyTorch `.pth` checkpoint.
- `--yolo`: YOLO weights file (Default: `yolov8n.pt`).
- `--tracker`: Tracking configuration (Default: `bytetrack.yaml`).
- `--face_db`: Path to face database folder (Default: `./face_db`).
- `--thresh_on`: Upper threshold to activate violence alert (Default: `0.68`).
- `--thresh_off`: Lower threshold to deactivate violence alert (Default: `0.53`).
- `--no_display`: Run in headless mode without local OpenCV window.

### 5. Running the Frontend Dashboard
In a separate terminal:
```bash
cd FRONTEND
npm install
npm run dev
```
Open your browser and navigate to **`http://localhost:3000`** to access the dashboard interface.

---

## 🔮 Future Enhancements & Roadmap

- [ ] **Multi-Stream RTSP Ingestion**: Transition from OpenCV threaded capture to an asynchronous NVIDIA DeepStream / GStreamer pipeline to process 16+ high-resolution CCTV cameras simultaneously.
- [ ] **TensorRT / INT8 Quantization**: Quantize SlowFast 3D convolutional kernels and ArcFace backbones to INT8 using TensorRT, slashing inference latency to under 15ms.
- [ ] **Automated Emergency Dispatch**: Connect the alert worker to Twilio / Telegram Bot API to send instant push notifications, SMS alerts, and incident snapshots directly to campus security officers' mobile devices.
- [ ] **Distributed Deployment**: Containerize the pipeline with Docker & Kubernetes, separating the heavy GPU inference node from the Next.js web application cluster.

---

## 👤 Author & Acknowledgments

### Developed & Engineered by
**Swaraj Krishna P P**  
AI / ML Enthusiast & Computer Science and Engineering Graduate (Class of 2026)  
🎓 **APJ Abdul Kalam Technological University (KTU)**  
📬 **Email**: [swrjkrishna@gmail.com](mailto:swrjkrishna@gmail.com)  

> [!IMPORTANT]
> All conceptualization, full-stack architecture, machine learning modeling, and platform engineering credits for this project belong to **Swaraj Krishna P P**.

---

### Acknowledgments
Special thanks to the authors and open-source contributors of PyTorch, PyTorchVideo, Ultralytics YOLOv8, ByteTrack, InsightFace, and the creators of the RWF-2000 dataset for advancing computer vision in public safety.
