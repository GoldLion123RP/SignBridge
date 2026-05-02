# SignBridge AI v2.0
> Bridging the Gap: Real-time Indian Sign Language to Speech Translation with Neural Intelligence.

![License](https://img.shields.io/badge/License-Apache_2.0-blue.svg)
![Next.js](https://img.shields.io/badge/Frontend-Next.js_16-black?logo=next.js)
![FastAPI](https://img.shields.io/badge/Backend-FastAPI-009688?logo=fastapi)
![MediaPipe](https://img.shields.io/badge/ML-Hand_Tracking_Fast-0078d4?logo=google)
![Status](https://img.shields.io/badge/Status-Pro_Implementation-success)

## Overview
SignBridge AI v2.0 is a high-performance, real-time sign language translation system designed to convert hand gestures into natural spoken English. Built for the modern web and optimized for legacy hardware, v2.0 features an ultra-low latency "Neural Link" interface, deterministic finger-state heuristics, and deep integration with **Google Gemini AI** for grammatically correct, natural language translation.

It specifically targets **Indian Sign Language (ISL)**, transforming its Subject-Object-Verb (SOV) structure into fluent English (SVO).

## Key Features
- **Zero-Latency Neural Link**: Optimized frame throttling ensures the UI remains responsive (60 FPS target) by preventing buffer bloat.
- **Perfect Skeleton Alignment**: Adaptive coordinate mapping handles `object-contain` video scaling for pixel-perfect landmark overlays.
- **Ultra-Fast ML Engine**: Powered by MediaPipe Hands for maximum speed on CPUs like the Intel i5-4440.
- **Gemini AI Integration**: Uses **Gemini 2.0 Flash** to transform ISL sign sequences into natural English sentences, inferring tenses and articles.
- **Real-time Audio**: Integrated neural Text-to-Speech (TTS) provides immediate verbal feedback.
- **ADK Powered**: Built on the **Agent Development Kit (ADK)** for systematic evaluation and agentic workflow management.

## Architecture
The system is hosted on **Render.com** (Backend) and GitHub Pages (Frontend), providing a globally accessible, auto-scaling infrastructure.

```
┌─────────────────────────────────┐           WebSocket (JSON + Binary)           ┌─────────────────────────────────┐
│     Next.js 16 (Redesigned)     │ <───────────────────────────────────────────> │        FastAPI (Async)          │
├─────────────────────────────────┤                                               ├─────────────────────────────────┤
│                                 │           1. Camera Frames (RAW/resized)      │           Render.com Host       │
│   ┌─────────────────────────┐   │ ────────────────────────────────────────────> │   ┌─────────────────────────┐   │
│   │     Neural Link App     │   │                                               │   │   MediaPipe (Holistic)  │   │
│   └───────────┬─────────────┘   │                                               │   └────────────┬────────────┘   │
│               │                 │           2. Landmarks & Confidence           │                │                │
│   ┌───────────▼─────────────┐   │ <──────────────────────────────────────────── │   ┌────────────▼────────────┐   │
│   │    Adaptive Overlay     │   │                                               │   │ LSTM / Heuristic Engine │   │
│   └───────────┬─────────────┘   │                                               │   └────────────┬────────────┘   │
│               │                 │           3. Translated Audio (B64)           │                │                │
│   ┌───────────▼─────────────┐   │ <──────────────────────────────────────────── │   ┌────────────▼────────────┐   │
│   │    Translation Panel    │   │                                               │   │  Gemini 2.0 Flash Agent │   │
│   └─────────────────────────┘   │                                               │   └─────────────────────────┘   │
│                                 │                                               │                                 │
└─────────────────────────────────┘                                               └─────────────────────────────────┘
```

## Installation

### Prerequisites
- Python 3.11+
- [uv](https://github.com/astral-sh/uv) (Recommended for Python management)
- Node.js 18+
- Google Gemini API Key

### Backend & Agent Setup
1. **Root Configuration**: Create a `.env.local` file in the root directory:
   ```env
   GEMINI_API_KEY=your_key_here
   JWT_SECRET=your_secret_here
   ```

2. **Start Backend Engine**:
   ```bash
   cd backend
   uv run python main.py
   ```

3. **Authentication**: The backend is secured via JWT. 
   - Obtain a token via the `/login` endpoint (default credentials: `admin`/`password`).
   - The WebSocket connection requires this token passed as a `token` query parameter or in the `Authorization` header during the handshake.

### Frontend Setup
1. Navigate to the frontend directory:
   ```bash
   cd web-frontend
   ```
2. Install dependencies and build for production:
   ```bash
   npm install
   npm run build
   ```
3. Deploy to GitHub Pages (Automated via GitHub Actions).

## Development & Evaluation (ADK)
This project utilizes the **google-agents-cli** for systematic agent testing:
1. Install ADK: `uv tool install google-agents-cli`
2. Sync dependencies: `uv sync --extra eval`
3. Execute evaluations: `agents-cli eval run`

## Performance & Benchmarks
- **Target Hardware**: Intel i5-4440 (60 FPS Goal)
- **Current Performance**: ~25 FPS (Headless Profiling)
- **Bottlenecks**: Neural processing on CPU.
- **Optimizations**: `model_complexity=0` used in MediaPipe; `asyncio.to_thread` for non-blocking ML inference.

## Security
- **Credential Protection**: API keys are isolated in `.env` and strictly excluded from version control via `.gitignore`.
- **Stateless Processing**: Video frames are processed in-memory and discarded immediately after landmark extraction.

## License
Licensed under the **Apache License 2.0**.
