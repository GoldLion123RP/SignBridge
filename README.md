# SignBridge AI v2.0
> Bridging the Gap: Real-time Sign Language to Speech Translation with Neural Intelligence.

![License](https://img.shields.io/badge/License-Apache_2.0-blue.svg)
![Next.js](https://img.shields.io/badge/Frontend-Next.js_16-black?logo=next.js)
![FastAPI](https://img.shields.io/badge/Backend-FastAPI-009688?logo=fastapi)
![MediaPipe](https://img.shields.io/badge/ML-MediaPipe_Lite-0078d4?logo=google)
![Status](https://img.shields.io/badge/Status-Pro_Implementation-success)

## Overview
SignBridge AI v2.0 is a high-performance, real-time sign language translation system designed to convert hand gestures and body language into natural spoken English. Built for the modern web, v2.0 features a completely redesigned "Neural Link" interface, asynchronous processing for zero-latency feedback, and deep integration with Google's Gemini generative AI for grammatically correct translations.

## Key Features
- **Premium v2.0 UI/UX**: A high-contrast, modern dark interface built with Next.js 16 and Tailwind CSS 4. Features glassmorphism, ambient glow effects, and a mobile-first responsive design.
- **Asynchronous Neural Link**: Refactored backend using `asyncio` threading to decouple heavy ML processing from WebSocket I/O, enabling true 60 FPS real-time feedback even on older hardware.
- **Full-Body Intelligence**: Optimized MediaPipe Holistic integration for face, body, and hand landmark extraction with mirrored canvas alignment.
- **Integrated Lexicon**: Built-in library of supported ISL gestures with predictive hints for users.
- **Archived Sessions**: Persistent session history with AI confidence tracking and timestamped translation logs.
- **Real-time Audio**: Low-latency neural Text-to-Speech (TTS) integration provides immediate verbal feedback.

## Architecture
```
┌─────────────────────────────────┐           WebSocket (JSON + Binary)           ┌─────────────────────────────────┐
│     Next.js 16 (Redesigned)     │ <───────────────────────────────────────────> │        FastAPI (Async)          │
├─────────────────────────────────┤                                               ├─────────────────────────────────┤
│                                 │           1. Camera Frames (640x360)          │                                 │
│   ┌─────────────────────────┐   │ ────────────────────────────────────────────> │   ┌─────────────────────────┐   │
│   │     Neural Link App     │   │                                               │   │    MediaPipe (Lite)     │   │
│   └───────────┬─────────────┘   │                                               │   └────────────┬────────────┘   │
│               │                 │           2. Landmarks & Confidence           │                │                │
│   ┌───────────▼─────────────┐   │ <──────────────────────────────────────────── │   ┌────────────▼────────────┐   │
│   │     Mirrored Overlay    │   │                                               │   │    Async LSTM Worker    │   │
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
1. Navigate to the backend directory: `cd backend`
2. Activate your virtual environment: `.\venv\Scripts\activate` (Windows) or `source venv/bin/activate` (Linux/Mac)
3. Install dependencies: `pip install -r requirements.txt`
4. Configure `.env.local` with your `GEMINI_API_KEY`.
5. Start the engine: `python main.py`

### Frontend Setup
1. Navigate to the frontend directory: `cd web-frontend`
2. Install dependencies: `npm install`
3. Run the pro interface: `npm run dev`

## Performance & Optimization
SignBridge v2.0 is specifically engineered for legacy hardware (e.g., **Intel i5-4440**) and low-bandwidth environments:
- **Threaded Inference**: Uses `asyncio.to_thread` to prevent compute-heavy models from blocking the network stack.
- **Lite Model Complexity**: Defaults to MediaPipe `Complexity 0` for maximum FPS without sacrificing accuracy.
- **Smart Frame Synchronization**: Frontend only sends new frames once the previous one is processed, eliminating buffer bloat and queue latency.
- **Targeted Resizing**: Internal frame resizing to 320x180 (16:9) maintains high-speed throughput for neural analysis.

## Security
- **Neural Link Integrity**: WebSocket connections are restricted to authorized local interfaces by default.
- **Environment Protection**: All sensitive API keys are isolated in `.env.local` and never committed to source control.
- **Stateless Processing**: Video data remains in transient memory and is discarded immediately after landmark extraction.

## License
Licensed under the **Apache License 2.0**.
