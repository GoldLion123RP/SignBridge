# SignBridge AI - Configuration

import os
from dotenv import load_dotenv

# Use absolute path for .env file
base_dir = os.path.dirname(os.path.abspath(__file__))
# Check for .env.local or .env in the backend directory
env_path = os.path.join(base_dir, ".env.local")
if not os.path.exists(env_path):
    env_path = os.path.join(base_dir, ".env")

load_dotenv(env_path)


class Config:
    # Server
    HOST: str = os.getenv("SERVER_HOST", "127.0.0.1")
    PORT: int = int(os.getenv("SERVER_PORT", 8000))

    # API Keys
    GEMINI_API_KEY: str = os.getenv("GEMINI_API_KEY", "")

    # CORS
    ALLOWED_ORIGINS: list = os.getenv(
        "ALLOWED_ORIGINS", "http://localhost:3000,http://127.0.0.1:3000,http://localhost:3001,http://127.0.0.1:3001"
    ).split(",")

    # TTS
    TTS_LANGUAGE: str = os.getenv("TTS_LANGUAGE", "en")
    TTS_SPEED: float = float(os.getenv("TTS_SPEED", "1.0"))

    # Debug
    DEBUG: bool = os.getenv("DEBUG", "True").lower() in ("true", "1", "yes")

    # Optimization
    ENABLE_FACE_TRACKING: bool = os.getenv("ENABLE_FACE_TRACKING", "True").lower() in ("true", "1", "yes")
    ENABLE_POSE_TRACKING: bool = os.getenv("ENABLE_POSE_TRACKING", "True").lower() in ("true", "1", "yes")

    # ML
    LSTM_SEQUENCE_LENGTH: int = 30
    LSTM_MODEL_PATH: str = os.path.join(base_dir, "models", "lstm_gesture_model.h5")

    def __init__(self):
        if not self.GEMINI_API_KEY:
            print("WARNING: GEMINI_API_KEY not set. Gemini features will not work.")


config = Config()
