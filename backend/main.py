# SignBridge AI - FastAPI WebSocket Endpoint

from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.responses import HTMLResponse
from typing import List, Dict, Any
import uvicorn
import base64
import cv2
import numpy as np
import time
import os
import json

from services.hand_tracker import HandTracker
from services.lstm_predictor import LSTMGesturePredictor
from services.gemini_service import GeminiService
from services.tts_service import TTSService
from config import config

app = FastAPI(title="SignBridge AI", description="Real-time sign language translation system")

# Global pre-loaded LSTM model to avoid loading multiple times
_shared_lstm_model = None

def get_shared_lstm_model():
    global _shared_lstm_model
    if _shared_lstm_model is None:
        try:
            from tensorflow.keras.models import load_model
            if os.path.exists(config.LSTM_MODEL_PATH):
                print(f"Pre-loading LSTM model from {config.LSTM_MODEL_PATH}...")
                _shared_lstm_model = load_model(config.LSTM_MODEL_PATH)
                print("LSTM model loaded successfully")
            else:
                print(f"LSTM model not found at {config.LSTM_MODEL_PATH}. Will create a new one on first connection.")
        except Exception as e:
            print(f"Could not pre-load LSTM model: {e}")
    return _shared_lstm_model

@app.get("/")
async def get():
    html_content = """
    <html>
        <head>
            <title>SignBridge AI Backend</title>
            <style>
                body { font-family: sans-serif; padding: 40px; background: #f5f5f5; }
                .container { max-width: 800px; margin: 0 auto; background: white; padding: 30px; border-radius: 8px; }
                h1 { color: #333; }
                .status { padding: 10px; background: #e8f5e9; margin: 10px 0; border-radius: 4px; }
                code { background: #f0f0f0; padding: 2px 6px; border-radius: 3px; }
            </style>
        </head>
        <body>
            <div class="container">
                <h1>SignBridge AI Backend</h1>
                <div class="status">
                    <strong>Status:</strong> Running
                </div>
                <h2>Endpoints</h2>
                <ul>
                    <li><strong>GET /</strong> - This page</li>
                    <li><strong>WS /ws/video</strong> - WebSocket endpoint for real-time video processing</li>
                </ul>
                <h2>WebSocket Message Format</h2>
                <p><strong>Send:</strong></p>
                <pre>{
  "frame": "base64_encoded_jpeg",
  "timestamp": 1234567890
}</pre>
                <p><strong>Receive:</strong></p>
                <pre>{
  "status": "received",
  "gesture": "peace",
  "confidence": 0.92,
  "sentence": "Hello!",
  "audio": "base64_encoded_mp3"
}</pre>
                <p><em>Server time: """ + time.strftime("%Y-%m-%d %H:%M:%S") + """</em></p>
            </div>
        </body>
    </html>
    """
    return HTMLResponse(content=html_content)

def decode_frame(base64_frame: str) -> np.ndarray:
    """Decode base64 JPEG frame to numpy array (BGR)."""
    try:
        img_data = base64.b64decode(base64_frame)
        nparr = np.frombuffer(img_data, np.uint8)
        img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        return img
    except Exception as e:
        print(f"Frame decode error: {e}")
        return None

@app.websocket("/ws/video")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()

    # Initialize per-connection services
    hand_tracker = HandTracker()
    shared_model = get_shared_lstm_model()
    lstm_predictor = LSTMGesturePredictor(model=shared_model)
    gemini_service = None
    tts_service = None

    # State for this connection
    state = {
        "gesture_buffer": [],
        "last_gesture_time": 0,
        "current_sentence": None,
        "current_audio": None,
        "last_activity": 0,
        "sentence_cooldown": 5.0,  # Seconds to wait before generating new sentence
        "pause_threshold": 1.5,   # Seconds of no gesture to consider pause
        "max_gestures_per_sentence": 10
    }

    # Initialize Gemini/TTS only when needed
    def init_gemini_tts():
        nonlocal gemini_service, tts_service
        if gemini_service is None and config.GEMINI_API_KEY:
            try:
                gemini_service = GeminiService(api_key=config.GEMINI_API_KEY)
                tts_service = TTSService(language=config.TTS_LANGUAGE)
            except Exception as e:
                print(f"Failed to initialize Gemini/TTS: {e}")

    print(f"New WebSocket connection from {websocket.client}")

    try:
        while True:
            data = await websocket.receive_text()
            message = json.loads(data)

            if "frame" not in message:
                continue

            frame_b64 = message["frame"]
            frame = decode_frame(frame_b64)

            if frame is None:
                await websocket.send_json({"status": "error", "message": "Invalid frame"})
                continue

            # Process frame with hand tracker
            landmarks = hand_tracker.process_frame(frame)

            response = {
                "status": "received",
                "gesture": None,
                "confidence": 0.0,
                "sentence": None,
                "audio": None
            }

            if landmarks:
                # Extract features
                features = hand_tracker.extract_features(landmarks)

                if features:
                    # Predict gesture
                    prediction = lstm_predictor.predict(features)
                    now = time.time()

                    if prediction:
                        gesture, confidence = prediction
                        response["gesture"] = gesture
                        response["confidence"] = float(confidence)

                        # Handle gesture for sentence building
                        state["last_activity"] = now

                        # Deduplicate: avoid adding same gesture repeatedly
                        if not state["gesture_buffer"] or gesture != state["gesture_buffer"][-1]:
                            state["gesture_buffer"].append(gesture)

                            # Limit buffer size
                            if len(state["gesture_buffer"]) > state["max_gestures_per_sentence"]:
                                state["gesture_buffer"].pop(0)

                            state["last_gesture_time"] = now

                        # Check if we should generate a sentence
                        should_generate = False

                        # Condition 1: Buffer reached max size
                        if len(state["gesture_buffer"]) >= state["max_gestures_per_sentence"]:
                            should_generate = True
                        # Condition 2: Pause detected (enough time since last gesture)
                        elif len(state["gesture_buffer"]) >= 3 and (now - state["last_gesture_time"]) > state["pause_threshold"]:
                            should_generate = True
                        # Condition 3: Last gesture happened a while ago and we have at least one gesture
                        elif now - state["last_activity"] > state["sentence_cooldown"] and len(state["gesture_buffer"]) >= 1:
                            should_generate = True
                            state["last_activity"] = now  # Reset cooldown

                        if should_generate and len(state["gesture_buffer"]) > 0:
                            # Generate sentence via Gemini
                            init_gemini_tts()
                            if gemini_service and tts_service:
                                try:
                                    sentence = gemini_service.translate_sign_to_text(state["gesture_buffer"])
                                    if sentence:
                                        response["sentence"] = sentence
                                        state["current_sentence"] = sentence

                                        # Generate TTS
                                        audio_b64 = tts_service.text_to_speech_base64(sentence)
                                        if audio_b64:
                                            response["audio"] = audio_b64
                                            state["current_audio"] = audio_b64
                                except Exception as e:
                                    print(f"Gemini/TTS error: {e}")

                            # Clear gesture buffer after sentence generation
                            state["gesture_buffer"] = []
                            lstm_predictor.clear_buffer()

            await websocket.send_json(response)

    except WebSocketDisconnect:
        print("WebSocket disconnected")
        hand_tracker.close()
    except Exception as e:
        print(f"WebSocket error: {e}")
        hand_tracker.close()

if __name__ == "__main__":
    uvicorn.run(app, host=config.HOST, port=config.PORT, log_level="info" if not config.DEBUG else "debug")
