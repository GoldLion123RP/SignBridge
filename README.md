# SignBridge AI

Real-time sign language detection and translation system powered by MediaPipe Holistic, LSTM, and Gemini 2.5 Flash.

**Status**: Core implementation complete. Project is currently in the **Live Implementation** phase, focusing on high-quality data collection and real-world testing.

## Features

- **Premium Modular UI** — Clean, high-performance interface with dedicated components for analytics, translation, and video.
- **Hand + Face + Body Tracking** — MediaPipe Holistic for comprehensive landmark detection (21 hand points, 468 face points, 33 pose points).
- **Gesture Recognition** — Dual-engine prediction using LSTM neural networks (97-feature input) and heuristic fallbacks.
- **Smart Translation** — Gemini 2.5 Flash for natural sentence structuring (SOV to Natural English).
- **Audio Output** — gTTS text-to-speech for translated text.
- **WebSockets** — Low-latency bidirectional communication for real-time feedback.
- **Hardware Optimized** — Specifically tuned for low-spec machines (CPU-only ML, frame resizing, and performance toggles).
- **Secure** — Localhost-only binding, no network exposure, API keys in gitignored `.env.local`.

## Architecture

```
┌───────────────┐     WebSocket      ┌───────────────┐
│   Browser     │ ◄────────────────► │   FastAPI     │
│  (Next.js)    │   JSON frames      │   Backend     │
│               │                    │               │
│  Camera ──►   │   Landmarks        ├───────────────┤
│  Capture      │                    │  Services:    │
│               │                    │  • Holistic Tracker (MediaPipe)
│  ┌──────────┐ │                    │  • LSTM Predictor (TensorFlow)
│  │ Canvas   │ │                    │  • Gemini Service
│  │ Overlay  │ │                    │  • TTS Service
│  └──────────┘ │                    └───────────────┘
└───────────────┘
```

## Tech Stack

- **Backend**: Python 3.11+, FastAPI 0.115, WebSockets, TensorFlow (CPU), MediaPipe Holistic, Google Gemini API, gTTS
- **Frontend**: Next.js 16 (App Router), TypeScript, Tailwind CSS 4, Framer Motion
- **ML Models**: LSTM (30-frame sequence buffer, 97-feature input), MediaPipe Holistic

## Machine Requirements

SignBridge is highly optimized for performance on legacy hardware:

- **CPU**: Intel i5-4440 (4th Gen) or equivalent.
- **RAM**: 8GB minimum.
- **GPU**: Not required (CPU-only inference enabled by default).
- **OS**: Windows 10+, Linux, macOS.

## Quick Start

### 1. Clone & Setup

```bash
git clone <repository-url>
cd SignBridge
```

### 2. Backend Setup

```bash
cd backend
python -m venv venv

# On Windows
venv\Scripts\activate
# On Linux/Mac
source venv/bin/activate

pip install -r requirements.txt

# Copy environment template
cp .env.example .env.local

# Edit .env.local with your Gemini API key
# GEMINI_API_KEY=your_key_here

# Run backend server
python main.py
# Server starts at http://127.0.0.1:8000
```

### 3. Frontend Setup

```bash
cd ../web-frontend
npm install
npm run dev
# App runs at http://localhost:3000
```

### 4. Data Collection (Optional)

```bash
cd backend
python scripts/collect_data.py
```

Follow on-screen instructions to collect samples for each gesture.

### 5. Model Training (Optional)

```bash
cd backend
python scripts/train.py
```

The trained model will be saved to `backend/models/lstm_gesture_model.h5`.

## Project Structure

```
SignBridge/
├── backend/
│   ├── api/
│   │   └── websocket.py           # WebSocket endpoint logic
│   ├── core/
│   │   └── ml_pipeline.py         # Standardized ML feature extraction
│   ├── main.py                    # FastAPI app entry point
│   ├── config.py                  # Server configuration
│   ├── services/
│   │   ├── hand_tracker.py        # MediaPipe hand tracking
│   │   ├── holistic_tracker.py    # MediaPipe holistic (hand+face+body)
│   │   ├── lstm_predictor.py      # LSTM gesture prediction (97 features)
│   │   ├── heuristic_predictor.py # Rule-based fallback predictor
│   │   ├── gemini_service.py      # Gemini API integration
│   │   └── tts_service.py         # Text-to-speech
│   ├── scripts/
│   │   ├── collect_data.py        # Data collection utility
│   │   ├── model.py               # LSTM model definition
│   │   └── train.py               # Model training script
│   ├── models/                    # Saved ML models (.h5)
│   └── data/                      # Training data (.npy files)
├── web-frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Sidebar.tsx         # App navigation and controls
│   │   │   ├── PremiumSidebar.tsx  # Enhanced sidebar with analytics
│   │   │   ├── VideoView.tsx       # Primary video display area
│   │   │   ├── LiveVideoContainer.tsx # Orchestrator for video + overlay
│   │   │   ├── TranslationPanel.tsx # Real-time text display
│   │   │   ├── SystemAnalytics.tsx # Hardware & FPS monitoring
│   │   │   ├── CameraCapture.tsx   # WebRTC camera + landmark overlay
│   │   │   └── WebSocketClient.tsx # WebSocket connection hook
│   │   └── app/
│   │       ├── page.tsx            # Main UI with detection indicators
│   │       └── layout.tsx          # Root layout
```

## API Reference

### WebSocket Endpoint: `WS /ws/video`

**Request Format** (base64 encoded JPEG frames):
```json
{
  "frame": "base64_encoded_image_data",
  "timestamp": 1234567890
}
```

**Response Format**:
```json
{
  "status": "received",
  "gesture": "A",
  "confidence": 0.92,
  "sentence": "Hello!",
  "audio": "base64_encoded_mp3",
  "landmarks": {
    "hands": [{"fingertips": [{"x": 0.5, "y": 0.3, "z": 0.01}], "hand_label": "Right"}],
    "face": [{"x": 0.5, "y": 0.4, "z": 0.02}],
    "pose": [{"x": 0.4, "y": 0.3, "z": 0.05}],
    "hands_detected": 1,
    "face_detected": true,
    "pose_detected": true
  }
}
```

## Environment Variables

See `backend/.env.example` for full reference:

- `GEMINI_API_KEY` — Google Gemini API key (required for translation)
- `SERVER_HOST` — Backend host (default: `127.0.0.1`, localhost only)
- `SERVER_PORT` — Backend port (default: `8000`)
- `ALLOWED_ORIGINS` — CORS allowed origins (default: `http://localhost:3000`)
- `TTS_LANGUAGE` — Text-to-speech language (default: `en`)
- `DEBUG` — Debug mode (default: `False`)

## Security

- Backend and frontend bind to `127.0.0.1` (localhost only) — not exposed on network
- API keys stored in `.env.local` (gitignored, never committed)
- `.env.example` contains placeholder values only
- No secrets in source code

## Troubleshooting

### Camera Permission Denied
- Ensure localhost (not IP address)
- Check browser camera permissions

### WebSocket Connection Failed
- Backend must be running on port 8000
- Ensure both servers bind to `127.0.0.1`

### No Hands/Face Detected
- Improve lighting conditions
- Move closer to camera
- Check backend terminal for `[HolisticTracker]` debug logs

### High CPU Usage
- Reduce camera resolution in `CameraCapture.tsx`
- Lower `min_detection_confidence` in holistic tracker
- Reduce LSTM sequence length (currently 30)

## Future Enhancements

- [ ] Mobile app (Flutter)
- [ ] More gesture categories (alphabet, numbers)
- [ ] Customizable gesture training UI
- [ ] Multi-language support
- [ ] User profiles & gesture personalization
- [ ] Offline mode (local LLM)

## License

MIT License — see LICENSE file for details.

## Acknowledgements

- [MediaPipe](https://mediapipe.dev/) — Holistic tracking (hands, face, pose)
- [TensorFlow](https://www.tensorflow.org/) — LSTM model
- [Google Gemini](https://ai.google.dev/) — Sentence structuring
- [gTTS](https://pypi.org/project/gTTS/) — Text-to-speech
- [FastAPI](https://fastapi.tiangolo.com/) — Backend framework
- [Next.js](https://nextjs.org/) — Frontend framework
