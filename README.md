# SignBridge AI v2.0
> Bridging the Gap: Real-time Sign Language to Speech Translation with Neural Intelligence.

![License](https://img.shields.io/badge/License-Apache_2.0-blue.svg)
![Next.js](https://img.shields.io/badge/Frontend-Next.js_16-black?logo=next.js)
![FastAPI](https://img.shields.io/badge/Backend-FastAPI-009688?logo=fastapi)
![MediaPipe](https://img.shields.io/badge/ML-Hand_Tracking_Fast-0078d4?logo=google)
![Status](https://img.shields.io/badge/Status-Pro_Implementation-success)

## Overview
SignBridge AI v2.0 is a high-performance, real-time sign language translation system designed to convert hand gestures into natural spoken English. Optimized for legacy hardware, v2.0 features an ultra-low latency "Neural Link" interface, deterministic finger-state heuristics, and advanced sentence structuring via **Google Gemini AI**.

## Key Features
- **Zero-Latency Neural Link**: Optimized frame throttling ensures the UI remains responsive (60 FPS target) by preventing buffer bloat.
- **Perfect Skeleton Alignment**: Adaptive coordinate mapping handles `object-contain` video scaling for pixel-perfect landmark overlays.
- **Legacy Port (Archive)**: Re-implemented the streamlined hand-tracking logic from the project archive for maximum speed on Intel i5-4440 class CPUs.
- **Gemini AI Integration**: Uses Gemini 2.5 Flash to transform Subject-Object-Verb (SOV) sign sequences into natural English sentences.
- **ADK Powered**: Now a formal **Agent Development Kit (ADK)** project, enabling systematic evaluation and agentic workflows.
- **Full-Screen Support**: Dedicated view button to toggle immersive translation mode.

## Architecture
- **Frontend**: Next.js 16 + Tailwind CSS 4.
- **Backend**: FastAPI + MediaPipe Hands (Complexity 0) + Gemini AI.
- **Agent**: ADK-based `signbridge` agent for translation logic processing.

## Installation

### Backend Setup
1. Navigate to the backend directory: `cd backend`
2. Activate your virtual environment: `.\venv\Scripts\activate`
3. Install dependencies: `pip install -r requirements.txt`
4. Configure `.env.local` in the **root** directory with your `GEMINI_API_KEY`.
5. Start the engine: `python main.py`

### Frontend Setup
1. Navigate to the frontend directory: `cd web-frontend`
2. Install dependencies: `npm install`
3. Run the interface: `npm run dev`

### ADK Setup (Evaluation)
1. Install `uv` and `google-agents-cli`.
2. Run `agents-cli install`.
3. Run `agents-cli eval run` to verify translation accuracy.

## Performance & Optimization
- **Targeted Resizing**: Internal frame resizing to **160x90** maintains ultra-high throughput.
- **Smart Throttling**: Frontend waits for backend ACK before dispatching the next frame.
- **Model Complexity 0**: Minimal CPU overhead for real-time tracking on older hardware.

## Security
- **Credential Protection**: API keys are isolated in `.env.local` and excluded from Git.
- **Security Scanned**: Verified with Antigravity Kit security auditors.

## License
Licensed under the **Apache License 2.0**.
