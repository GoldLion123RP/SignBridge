from fastapi import APIRouter, WebSocket, WebSocketDisconnect
import json
import base64
import cv2
import numpy as np
import time
from collections import deque, Counter
from core.ml_pipeline import SignLanguagePipeline
from services.heuristic_predictor import HeuristicPredictor
from services.gemini_service import GeminiService
from services.tts_service import TTSService
from config import config

router = APIRouter()

@router.websocket("/ws/video")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    print(f"[WS] Client connected: {websocket.client}")
    
    # Lazy-load references
    pipeline = None
    heuristic_predictor = HeuristicPredictor()
    gemini = None
    tts = None

    def get_pipeline():
        nonlocal pipeline
        if pipeline is None:
            print("[Pipeline] Handshake successful. Lazy-loading ML Pipeline...")
            pipeline = SignLanguagePipeline()
        return pipeline

    def get_services():
        nonlocal gemini, tts
        if gemini is None and config.GEMINI_API_KEY:
            try:
                gemini = GeminiService(api_key=config.GEMINI_API_KEY)
                tts = TTSService(language=config.TTS_LANGUAGE)
            except Exception as e:
                print(f"[WS] Service init error: {e}")
        return gemini, tts

    # Buffers and state
    sentence_buffer = []
    last_trigger_time = 0
    smoothing_buffer = deque(maxlen=10)
    GESTURE_COOLDOWN = 1.5
    
    # Latency-based frame skipping for i5-4440
    last_processing_duration = 0
    frame_count = 0
    LATENCY_THRESHOLD = 0.08  # 80ms

    try:
        while True:
            try:
                msg_text = await websocket.receive_text()
                msg_data = json.loads(msg_text)
                
                if "frame" not in msg_data:
                    continue

                # Decode and optimize frame
                try:
                    img_bytes = base64.b64decode(msg_data["frame"])
                    nparr = np.frombuffer(img_bytes, np.uint8)
                    frame = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
                    if frame is None:
                        raise ValueError("CV2 Decode failed")
                    
                    # 400x300 for i5-4440 optimization
                    frame = cv2.resize(frame, (400, 300))
                except Exception as e:
                    print(f"[WS] Decode error: {e}")
                    continue

                # Latency-based frame skipping
                frame_count += 1
                if last_processing_duration > LATENCY_THRESHOLD and frame_count % 2 == 0:
                    await websocket.send_json({
                        "status": "skipped", 
                        "latency": f"{last_processing_duration * 1000:.0f}",
                        "timestamp": msg_data.get("timestamp", 0)
                    })
                    continue

                start_time = time.time()
                
                # Process through ML Pipeline
                pl = get_pipeline()
                res = pl.tracker.process_frame(frame)
                
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
                    feats = pl.tracker.extract_features(res)
                    
                    # 1. Try Heuristic (Zero-RAM footprint)
                    raw_pred = heuristic_predictor.predict(res)
                    
                    # 2. Fallback to LSTM
                    if not raw_pred:
                        raw_pred = pl.predictor.predict(feats)
                    
                    # Smoothing logic
                    current_gesture = raw_pred[0] if raw_pred else None
                    smoothing_buffer.append(current_gesture)
                    
                    counts = Counter(smoothing_buffer)
                    most_common_gesture, count = counts.most_common(1)[0] if counts else (None, 0)
                    
                    if most_common_gesture and count >= 6:
                        recognized_gesture = most_common_gesture
                        recognized_conf = float(raw_pred[1]) if raw_pred and raw_pred[0] == most_common_gesture else 0.9
                        
                        if time.time() - last_trigger_time > GESTURE_COOLDOWN:
                            response["gesture"] = recognized_gesture
                            response["confidence"] = recognized_conf
                            
                            print(f"[DETECT] {recognized_gesture} ({recognized_conf:.2f})")
                            
                            if not sentence_buffer or sentence_buffer[-1] != recognized_gesture:
                                sentence_buffer.append(recognized_gesture)
                            
                            last_trigger_time = time.time()

                    # Translation logic
                    if len(sentence_buffer) >= 3 and (time.time() - last_trigger_time) > 2.5:
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

                # Calculate final latency for this frame
                last_processing_duration = time.time() - start_time
                response["latency"] = int(last_processing_duration * 1000)
                
                await websocket.send_json(response)
                
            except WebSocketDisconnect:
                raise
            except Exception as e:
                print(f"[WS] Inner loop error: {e}")
                continue

    except WebSocketDisconnect:
        print(f"[WS] Client disconnected")
    except Exception as e:
        print(f"[WS] Fatal WebSocket error: {e}")
    finally:
        if pipeline:
            pipeline.close()
