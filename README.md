# SignBridge AI
> Bridging the Gap: Real-time Sign Language to Speech Translation with Spatial Awareness.

![License](https://img.shields.io/badge/License-Apache_2.0-blue.svg)
![Next.js](https://img.shields.io/badge/Frontend-Next.js-black?logo=next.js)
![FastAPI](https://img.shields.io/badge/Backend-FastAPI-009688?logo=fastapi)
![MediaPipe](https://img.shields.io/badge/ML-MediaPipe-0078d4?logo=google)
![Status](https://img.shields.io/badge/Status-Live_Implementation-success)

## Overview
SignBridge AI is a high-performance, real-time sign language translation system designed to convert hand gestures and body language into natural spoken English. Unlike simple gesture recognizers, SignBridge accounts for **3D spatial grammar** and the complex **SOV (Subject-Object-Verb) syntax** inherent in many sign languages. It leverages MediaPipe for landmark extraction and an LSTM neural network to interpret sequences of motion, which are then refined into natural sentences using Google's Gemini generative AI.

## Key Features
- **Premium UI/UX**: A modern, modular interface built with Next.js 16 and Tailwind CSS 4, featuring real-time system analytics and high-fidelity video overlays.
- **Hardware Optimization**: Specifically engineered for legacy hardware, including smooth operation on **Intel i5-4440 (4th Gen)** CPUs without requiring a dedicated GPU.
- **Real-time Audio**: Low-latency text-to-speech (TTS) integration provides immediate verbal feedback for translated gestures.
- **Bidirectional Communication**: High-speed WebSockets ensure seamless synchronization between the camera capture and the backend inference engine.

## Architecture
```
┌─────────────────────────────────┐           WebSocket (JSON + Binary)           ┌─────────────────────────────────┐
│         Client (Next.js)        │ <───────────────────────────────────────────> │         Backend (FastAPI)       │
├─────────────────────────────────┤                                               ├─────────────────────────────────┤
│                                 │           1. Camera Frames (B64)              │                                 │
│   ┌─────────────────────────┐   │ ────────────────────────────────────────────> │   ┌─────────────────────────┐   │
│   │     Camera Capture      │   │                                               │   │    MediaPipe Holistic   │   │
│   └───────────┬─────────────┘   │                                               │   └────────────┬────────────┘   │
│               │                 │           2. Landmarks & Predictions          │                │                │
│   ┌───────────▼─────────────┐   │ <──────────────────────────────────────────── │   ┌────────────▼────────────┐   │
│   │     Canvas Overlay      │   │                                               │   │      LSTM Predictor     │   │
│   └───────────┬─────────────┘   │                                               │   └────────────┬────────────┘   │
│               │                 │           3. Translated Audio (MP3)           │                │                │
│   ┌───────────▼─────────────┐   │ <──────────────────────────────────────────── │   ┌────────────▼────────────┐   │
│   │    Translation Panel    │   │                                               │   │     Gemini Service      │   │
│   └─────────────────────────┘   │                                               │   └─────────────────────────┘   │
│                                 │                                               │                                 │
└─────────────────────────────────┘                                               └─────────────────────────────────┘
```

## Installation

### Backend Setup
1. Navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Create and activate a virtual environment:
   ```bash
   python -m venv venv
   # Windows
   .\venv\Scripts\activate
   # Linux/Mac
   source venv/bin/activate
   ```
3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
4. Configure environment variables:
   ```bash
   cp .env.example .env.local
   # Add your GEMINI_API_KEY to .env.local
   ```
5. Start the FastAPI server:
   ```bash
   python main.py
   ```

### Frontend Setup
1. Navigate to the frontend directory:
   ```bash
   cd web-frontend
   ```
2. Install Node.js dependencies:
   ```bash
   npm install
   ```
3. Run the development server:
   ```bash
   npm run dev
   ```

## Usage

### 1. Data Collection
To train the system for new gestures, use the collection script:
```bash
python backend/scripts/collect_data.py
```
This utility captures sequences of landmarks and saves them as `.npy` files for training.

### 2. Model Training
Once data is collected, train the LSTM model:
```bash
python backend/scripts/train.py
```
The trained model (`.h5`) and label mapping will be automatically updated in the backend models directory.

### 3. Live Translation
Run both the backend and frontend servers. Open your browser to `http://localhost:3000`. Ensure your camera is enabled and start signing. The system will detect gestures, structure them into sentences, and play the corresponding audio.

## Performance
SignBridge AI implements several critical optimizations for low-end hardware (e.g., i5-4440):
- **CPU-Only Inference**: All ML models are optimized for TensorFlow CPU execution, avoiding the overhead of specialized GPU drivers.
- **Resolution Scaling**: Frames are dynamically resized to 640x480 before processing to reduce MediaPipe computational load.
- **Sequence Buffering**: Uses a sliding window of 30 frames to provide stable predictions without re-processing the entire video stream.
- **Asynchronous Processing**: Landmark extraction and translation services run in non-blocking threads to maintain high UI responsiveness.

## Security
- **Localhost Binding**: By default, the backend binds to `127.0.0.1` to prevent unauthorized network access to your camera stream.
- **Environment Protection**: All sensitive API keys and configurations are stored in `.env.local`, which is strictly excluded from version control via `.gitignore`.
- **Stateless Frames**: No video data is permanently stored on the server; frames are processed in-memory and discarded immediately.

## Contributing
We welcome contributions! Please see [CONTRIBUTING.md](CONTRIBUTING.md) for our code of conduct and the process for submitting pull requests.

## License
This project is licensed under the **Apache License 2.0**. See the [LICENSE](LICENSE) file for the full text.
