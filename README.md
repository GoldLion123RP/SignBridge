# SignBridge AI 🎯

Real-time sign language detection and translation system powered by MediaPipe, LSTM, and Gemini 2.5 Flash.

## Features

- **Real-time Hand Tracking** - MediaPipe Hands for 21 landmark detection
- **Gesture Recognition** - LSTM neural network for sequence-based sign language
- **Smart Translation** - Gemini 2.5 Flash for natural sentence structuring
- **Audio Output** - gTTS text-to-speech for translated text
- **WebSockets** - Low-latency bidirectional communication
- **Lightweight** - Optimized for low-spec machines (CPU-only ML)

## Architecture

```
┌─────────────┐     WebSocket      ┌─────────────┐
│  Browser    │ ◄─────────────────► │  FastAPI    │
│ (Next.js)   │   JSON frames       │  Backend    │
│             │                     │             │
│  Camera  ──►│   Landmarks       ├─────────────┤
│  Capture    │                     │ Services:   │
│             │                     │  • Hand Tracker (MediaPipe)
│  ┌────────┐ │                     │  • LSTM Predictor (TensorFlow)
│  │ WebSocket│                     │  • Gemini Service
│  └────────┘ │                     │  • TTS Service
└─────────────┘                     └─────────────┘
```

## Tech Stack

- **Backend**: FastAPI, WebSockets, TensorFlow (CPU), MediaPipe, Google Gemini API, gTTS
- **Frontend**: Next.js 15 (App Router), TypeScript, Tailwind CSS, WebSocket API
- **ML Models**: LSTM (30-frame sequence buffer), MediaPipe Hands

## Machine Requirements

- **CPU**: Intel i5-4440 or equivalent
- **RAM**: 8GB minimum
- **GPU**: Not required (CPU-only inference)
- **OS**: Windows 10+, Linux, macOS

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
# Server starts at http://localhost:8000
```

### 3. Frontend Setup

```bash
cd ../web-frontend
npm install
npm run dev
# App runs at http://localhost:3000
```

### 4. Data Collection (Optional)

First, ensure the backend is running and you can access the camera:

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
│   ├── main.py                  # FastAPI app & WebSocket endpoint
│   ├── requirements.txt         # Python dependencies
│   ├── .env.example             # Environment template
│   ├── services/
│   │   ├── hand_tracker.py      # MediaPipe hand tracking
│   │   ├── lstm_predictor.py    # LSTM gesture prediction
│   │   ├── gemini_service.py    # Gemini API integration
│   │   └── tts_service.py       # Text-to-speech
│   ├── scripts/
│   │   ├── collect_data.py      # Data collection utility
│   │   ├── model.py             # LSTM model definition
│   │   └── train.py             # Model training script
│   ├── models/                  # Saved ML models (.h5)
│   ├── data/                    # Training data (.npy files)
│   └── tests/                   # Backend tests
├── web-frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── CameraCapture.tsx    # WebRTC camera access
│   │   │   └── WebSocketClient.tsx  # WebSocket connection
│   │   └── app/
│   │       └── page.tsx        # Main UI
│   ├── public/
│   └── package.json
├── TODO.md                      # Progress tracking
└── MOBILE_INTEGRATION.md        # Flutter setup guide
```

## API Reference

### FastAPI Endpoints

#### `GET /`
Health check endpoint - returns HTML description

#### `WS /ws/video`
WebSocket endpoint for real-time video processing

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
  "gesture": "peace",
  "confidence": 0.92,
  "sentence": "Hello!",
  "audio": "base64_encoded_audio"
}
```

## Environment Variables

See `backend/.env.example` for full reference:

- `GEMINI_API_KEY` - Google Gemini API key (required)
- `SERVER_HOST` - Backend host (default: 0.0.0.0)
- `SERVER_PORT` - Backend port (default: 8000)
- `ALLOWED_ORIGINS` - CORS allowed origins (default: http://localhost:3000)
- `TTS_LANGUAGE` - Text-to-speech language (default: en)
- `DEBUG` - Debug mode (default: False)

## Supported Gestures (Default)

- thumbs_up, thumbs_down
- peace, ok, fist, open_hand
- point_up, point_down, point_left, point_right
- rock_on, heart, clap, wave, call_me, stop, question, exclamation

## Development Notes

### Low-Spec Optimization

- TensorFlow CPU-only build (no GPU required)
- MediaPipe optimized for real-time performance on CPU
- Frame rate limiting to reduce CPU usage
- 30-frame sequence buffer for LSTM (≈ 1 second at 30fps)
- Async WebSocket handling with FastAPI

### Memory Management

- Hand landmarks extracted to 63-element feature vector per frame
- Sequence buffer cleared after each recognized gesture
- MediaPipe resources released on shutdown

## Troubleshooting

### Camera Permission Denied
- Ensure HTTPS or localhost
- Check browser permissions
- Try `facingMode: 'user'` or `'environment'`

### WebSocket Connection Failed
- Backend must be running on port 8000
- Check CORS settings in `backend/main.py`

### High CPU Usage
- Reduce camera resolution in `CameraCapture.tsx`
- Lower MediaPipe `min_detection_confidence`
- Reduce LSTM sequence length (currently 30)

## Future Enhancements

- [ ] Mobile app (Flutter)
- [ ] More gesture categories (alphabet, numbers)
- [ ] Customizable gesture training UI
- [ ] Multi-language support
- [ ] User profiles & gesture personalization
- [ ] Offline mode (local LLM)

## License

MIT License - see LICENSE file for details.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make changes with clear commit messages
4. Submit a pull request

## Acknowledgements

- [MediaPipe](https://mediapipe.dev/) - Hand tracking
- [TensorFlow](https://www.tensorflow.org/) - LSTM model
- [Google Gemini](https://ai.google.dev/) - Sentence structuring
- [gTTS](https://pypi.org/project/gTTS/) - Text-to-speech
- [FastAPI](https://fastapi.tiangolo.com/) - Backend framework
- [Next.js](https://nextjs.org/) - Frontend framework
