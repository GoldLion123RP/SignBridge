# SignBridge AI - Configuration

import os
from dotenv import load_dotenv

load_dotenv("backend/.env.local")

class Config:
    # Server
    HOST: str = os.getenv("SERVER_HOST", "0.0.0.0")
    PORT: int = int(os.getenv("SERVER_PORT", 8000))

    # API Keys
    GEMINI_API_KEY: str = os.getenv("GEMINI_API_KEY", "")

    # CORS
    ALLOWED_ORIGINS: list = os.getenv("ALLOWED_ORIGINS", "http://localhost:3000").split(",")

    # TTS
    TTS_LANGUAGE: str = os.getenv("TTS_LANGUAGE", "en")
    TTS_SPEED: float = float(os.getenv("TTS_SPEED", "1.0"))

    # Debug
    DEBUG: bool = os.getenv("DEBUG", "False").lower() in ("true", "1", "yes")

    # ML
    LSTM_SEQUENCE_LENGTH: int = 30
    LSTM_MODEL_PATH: str = "models/lstm_gesture_model.h5"

    def __init__(self):
        if not self.GEMINI_API_KEY:
            print("WARNING: GEMINI_API_KEY not set. Gemini features will not work.")

config = Config()
