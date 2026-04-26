from fastapi import APIRouter, WebSocket, WebSocketDisconnect
import json
import base64
import cv2
import numpy as np
import time
import asyncio
from collections import deque, Counter
from core.ml_pipeline import SignLanguagePipeline
from services.heuristic_predictor import HeuristicPredictor
from services.gemini_service import GeminiService
from services.tts_service import TTSService
from config import config

router = APIRouter()

@router.websocket("/ws/video")
async def websocket_endpoint(websocket: WebSocket):
    # Log connection request details
    origin = websocket.headers.get("origin")
    client_host = websocket.client.host if websocket.client else "unknown"
    print(f"[WS] Connection request from {client_host} (Origin: {origin})")

    await websocket.accept()
    print(f"[WS] Link established: {client_host}")
    
    # Global singleton pipeline (already warmed up on startup)
    pipeline = None
    heuristic_predictor = None
    gemini = None
    tts = None
    
    try:
        # Initialize pipeline and services
        try:
            pipeline = SignLanguagePipeline()
            heuristic_predictor = HeuristicPredictor()
        except Exception as e:
            print(f"[WS] Failed to initialize pipeline: {e}")
            await websocket.send_json({
                "status": "error",
                "message": "Failed to initialize ML pipeline"
            })
            await websocket.close()
            return

        def get_services():
            nonlocal gemini, tts
            if gemini is None and config.GEMINI_API_KEY:
                try:
                    gemini = GeminiService(api_key=config.GEMINI_API_KEY)
                    tts = TTSService(language=config.TTS_LANGUAGE)
                except Exception as e:
                    print(f"[WS] Service init error: {e}")
            return gemini, tts

        async def process_frame_async(frame, pl):
            if pl is None or pl.tracker is None:
                return None
            try:
                return await asyncio.to_thread(pl.tracker.process_frame, frame)
            except Exception as e:
                print(f"[WS] Frame processing error: {e}")
                return None

        # Buffers and state
        sentence_buffer = []
        last_trigger_time = 0
        smoothing_buffer = deque(maxlen=8)
        GESTURE_COOLDOWN = 1.2
        
        # Latency-based frame skipping
        last_processing_duration = 0
        frame_count = 0
        LATENCY_THRESHOLD = 0.033  # 30ms

        # Security limits
        MAX_MESSAGE_SIZE = 1024 * 1024  # 1MB
        MAX_FRAME_SIZE = 500 * 1024  # 500KB

        while True:
            try:
                # 1. Receive message
                msg_text = await websocket.receive_text()
                
                # 2. Basic validation
                if len(msg_text) > MAX_MESSAGE_SIZE:
                    print(f"[WS] Dropping large message: {len(msg_text)} bytes")
                    continue

                msg_data = json.loads(msg_text)
                if "frame" not in msg_data:
                    # Heartbeat support
                    if msg_data.get("type") == "ping":
                        await websocket.send_json({"type": "pong", "timestamp": time.time()})
                    continue

                # 3. Decode frame
                try:
                    frame_b64 = msg_data["frame"]
                    if not frame_b64:  # Empty frame
                        continue
                    
                    if len(frame_b64) > MAX_FRAME_SIZE * 1.5:  # Approx check
                        print(f"[WS] Frame too large: {len(frame_b64)} bytes")
                        continue
                        
                    img_bytes = base64.b64decode(frame_b64)
                    nparr = np.frombuffer(img_bytes, np.uint8)
                    frame = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
                    
                    if frame is None:
                        print("[WS] Frame decode returned None")
                        continue
                    
                    # Validate frame dimensions
                    if len(frame.shape) < 2 or frame.shape[0] <= 0 or frame.shape[1] <= 0:
                        print(f"[WS] Invalid frame dimensions: {frame.shape}")
                        continue
                    
                    # Optimization: Resize for i5-4440
                    frame = cv2.resize(frame, (320, 180))
                except Exception as e:
                    print(f"[WS] Frame decode error: {e}")
                    continue

                # 4. Latency-based frame skipping
                frame_count += 1
                if last_processing_duration > LATENCY_THRESHOLD and frame_count % 2 == 0:
                    await websocket.send_json({
                        "status": "skipped", 
                        "latency": int(last_processing_duration * 1000),
                        "timestamp": msg_data.get("timestamp", 0)
                    })
                    continue

                # 5. ML Processing
                if pipeline is None:
                    print("[WS] Pipeline is None, cannot process")
                    continue
                
                start_time = time.time()
                res = await process_frame_async(frame, pipeline)
                
                response = {
                    "status": "received",
                    "gesture": None,
                    "confidence": 0.0,
                    "landmarks": res,
                    "sentence": None,
                    "audio": None,
                    "timestamp": msg_data.get("timestamp", 0),
                    "latency": 0
                }

                if res and res.get("hands_detected", 0) > 0:
                    try:
                        feats = pipeline.tracker.extract_features(res)
                        lstm_pred = pipeline.predictor.predict(feats)
                        
                        # Heuristic vs LSTM priority
                        raw_pred = heuristic_predictor.predict(res) or lstm_pred
                        
                        current_gesture = raw_pred[0] if raw_pred else None
                        recognized_conf = float(raw_pred[1]) if raw_pred else 0.0
                        
                        smoothing_buffer.append(current_gesture)
                        response["confidence"] = recognized_conf
                        
                        counts = Counter(smoothing_buffer)
                        most_common_gesture, count = counts.most_common(1)[0] if counts else (None, 0)
                        
                        if most_common_gesture and count >= 5:
                            if time.time() - last_trigger_time > GESTURE_COOLDOWN:
                                response["gesture"] = most_common_gesture
                                print(f"[DETECT] {most_common_gesture} ({recognized_conf:.2f})")
                                
                                if not sentence_buffer or sentence_buffer[-1] != most_common_gesture:
                                    sentence_buffer.append(most_common_gesture)
                                
                                last_trigger_time = time.time()
                    except Exception as e:
                        print(f"[WS] Prediction error: {e}")
                else:
                    smoothing_buffer.append(None)

                # 6. Translation logic (Gemini)
                if sentence_buffer:
                    time_since_last = time.time() - last_trigger_time
                    if len(sentence_buffer) >= 3 or (time_since_last > 2.5 and len(sentence_buffer) > 0):
                        g_service, t_service = get_services()
                        if g_service and t_service:
                            try:
                                sentence = g_service.translate_sign_to_text(sentence_buffer)
                                if sentence:
                                    response["sentence"] = sentence
                                    response["audio"] = t_service.text_to_speech_base64(sentence)
                                    print(f"[TRANS] Sentence: {sentence}")
                            except Exception as e:
                                print(f"[WS] Translation error: {e}")
                        sentence_buffer = []

                # 7. Final response
                last_processing_duration = time.time() - start_time
                response["latency"] = int(last_processing_duration * 1000)
                await websocket.send_json(response)
                
            except WebSocketDisconnect:
                raise
            except Exception as e:
                print(f"[WS] Loop error: {e}")
                continue

    except WebSocketDisconnect:
        print(f"[WS] Client disconnected: {client_host}")
    except Exception as e:
        print(f"[WS] Fatal WebSocket error: {e}")
    finally:
        # Ensure proper cleanup on disconnect or error
        print(f"[WS] Cleanup: Closing connection for {client_host}")
        try:
            await websocket.close()
        except Exception:
            pass  # Connection might already be closed
