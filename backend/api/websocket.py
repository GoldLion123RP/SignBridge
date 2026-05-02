from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Query
import json
import base64
import cv2
import numpy as np
import time
import asyncio
from collections import deque, Counter
from jose import jwt, JWTError
from core.ml_pipeline import SignLanguagePipeline
from services.heuristic_predictor import HeuristicPredictor
from services.gemini_service import GeminiService
from services.tts_service import TTSService
from config import config

router = APIRouter()

# Service Cache
_GEMINI_SERVICE = None
_TTS_SERVICE = None

# Constants
GESTURE_COOLDOWN = 1.0
SILENCE_TIMEOUT = 1.5
MAX_SENTENCE_BUFFER = 6
MAX_MESSAGE_SIZE = 1024 * 1024
FRAME_QUEUE_SIZE = 2

def verify_token(token: str):
    try:
        payload = jwt.decode(token, config.JWT_SECRET, algorithms=[config.JWT_ALGORITHM])
        return payload
    except JWTError:
        return None

async def get_services():
    global _GEMINI_SERVICE, _TTS_SERVICE
    if _GEMINI_SERVICE is None and config.GEMINI_API_KEY:
        try:
            _GEMINI_SERVICE = GeminiService(api_key=config.GEMINI_API_KEY)
            _TTS_SERVICE = TTSService(language=config.TTS_LANGUAGE)
        except Exception as e:
            print(f"[WS] Service init error: {e}")
    return _GEMINI_SERVICE, _TTS_SERVICE

@router.websocket("/ws/video")
async def websocket_endpoint(websocket: WebSocket, token: str = Query(None)):
    # ... origin logging ...
    origin = websocket.headers.get("origin")
    client_host = websocket.client.host if websocket.client else "unknown"
    
    # 0. Auth Check
    if not token:
        await websocket.close(code=4001)
        return

    payload = verify_token(token)
    if not payload:
        await websocket.close(code=4002)
        return

    await websocket.accept()
    
    # Global singleton pipeline
    pipeline = SignLanguagePipeline()
    
    # Buffers and state
    sentence_buffer = []
    last_hand_time = time.time()
    smoothing_buffer = deque(maxlen=3)
    
    # Frame queue for decoupling I/O and CPU
    frame_queue = asyncio.Queue(maxsize=FRAME_QUEUE_SIZE)
    
    async def worker():
        nonlocal last_hand_time, sentence_buffer
        last_trigger_time = 0
        
        while True:
            try:
                frame_data = await frame_queue.get()
                if frame_data is None: break
                
                frame, timestamp = frame_data
                start_time = time.time()
                
                # ML Processing
                res = await asyncio.to_thread(pipeline.engine.process_frame, frame)
                
                response = {
                    "status": "received",
                    "gesture": None,
                    "confidence": 0.0,
                    "landmarks": res,
                    "sentence": None,
                    "audio": None,
                    "timestamp": timestamp,
                    "latency": 0
                }

                if res and res.get("hands_detected", 0) > 0:
                    last_hand_time = time.time()
                    gestures = res.get("gestures", [])
                    current_gesture = gestures[0] if gestures else None
                    
                    if current_gesture:
                        smoothing_buffer.append(current_gesture)
                        response["confidence"] = 0.98
                        
                        counts = Counter(smoothing_buffer)
                        most_common_gesture, count = counts.most_common(1)[0] if counts else (None, 0)
                        
                        if most_common_gesture and count >= 2:
                            if time.time() - last_trigger_time > GESTURE_COOLDOWN:
                                response["gesture"] = most_common_gesture
                                if not sentence_buffer or sentence_buffer[-1] != most_common_gesture:
                                    sentence_buffer.append(most_common_gesture)
                                response["sentence"] = f"Detected: {most_common_gesture}"
                                last_trigger_time = time.time()
                else:
                    smoothing_buffer.append(None)

                # Periodic translation check
                if len(sentence_buffer) >= MAX_SENTENCE_BUFFER:
                    g_service, t_service = await get_services()
                    if g_service and t_service:
                        try:
                            sentence = g_service.translate_sign_to_text(sentence_buffer)
                            if sentence:
                                response["status"] = "translated"
                                response["sentence"] = sentence
                                response["audio"] = t_service.text_to_speech_base64(sentence)
                        except Exception as e:
                            print(f"[WS] Translation error: {e}")
                    sentence_buffer = []

                response["latency"] = int((time.time() - start_time) * 1000)
                await websocket.send_json(response)
                frame_queue.task_done()
                
            except Exception as e:
                print(f"[WS] Worker error: {e}")
                if not frame_queue.empty(): frame_queue.task_done()

    # Start worker task
    worker_task = asyncio.create_task(worker())

    try:
        while True:
            try:
                try:
                    msg_text = await asyncio.wait_for(websocket.receive_text(), timeout=0.5)
                except asyncio.TimeoutError:
                    if sentence_buffer and (time.time() - last_hand_time > SILENCE_TIMEOUT):
                        g_service, t_service = await get_services()
                        if g_service and t_service:
                            try:
                                sentence = g_service.translate_sign_to_text(sentence_buffer)
                                if sentence:
                                    await websocket.send_json({
                                        "status": "translated",
                                        "sentence": sentence,
                                        "audio": t_service.text_to_speech_base64(sentence),
                                        "timestamp": time.time()
                                    })
                            except Exception as e:
                                print(f"[WS] Silence translation error: {e}")
                        sentence_buffer = []
                    continue
                
                if len(msg_text) > MAX_MESSAGE_SIZE: continue

                msg_data = json.loads(msg_text)
                if msg_data.get("type") == "ping":
                    await websocket.send_json({"type": "pong", "timestamp": time.time()})
                    continue

                if "frame" not in msg_data: continue

                frame_b64 = msg_data["frame"]
                img_bytes = base64.b64decode(frame_b64)
                nparr = np.frombuffer(img_bytes, np.uint8)
                frame = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
                if frame is None: continue

                try:
                    frame_queue.put_nowait((frame, msg_data.get("timestamp", 0)))
                except asyncio.QueueFull:
                    try:
                        frame_queue.get_nowait()
                        frame_queue.task_done()
                        frame_queue.put_nowait((frame, msg_data.get("timestamp", 0)))
                    except Exception:
                        pass
                
            except WebSocketDisconnect:
                raise
            except Exception as e:
                print(f"[WS] Producer error: {e}")
                continue

    except WebSocketDisconnect:
        pass
    finally:
        worker_task.cancel()
        try:
            await websocket.close()
        except Exception:
            pass

