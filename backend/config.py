# SignBridge AI - Configuration

import os
from dotenv import load_dotenv

# Use absolute path for .env file
base_dir = os.path.dirname(os.path.abspath(__file__))
project_root = os.path.dirname(base_dir)

# Check for .env.local in root, then backend
env_paths = [
    os.path.join(project_root, ".env.local"),
    os.path.join(base_dir, ".env.local"),
    os.path.join(base_dir, ".env")
]

for path in env_paths:
    if os.path.exists(path):
        load_dotenv(path)
        break


class Config:
    # Server
    HOST: str = os.getenv("SERVER_HOST", "0.0.0.0")
    # Cloud Run uses PORT env var. Fallback to 8080 (Cloud Run default) then 8000.
    PORT: int = int(os.getenv("PORT", os.getenv("SERVER_PORT", 8080)))

    # API Keys
    GEMINI_API_KEY: str = os.getenv("GEMINI_API_KEY", "")

    # Auth
    JWT_SECRET: str = os.getenv("JWT_SECRET", "super-secret-key-change-in-production")
    JWT_ALGORITHM: str = os.getenv("JWT_ALGORITHM", "HS256")

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
    ENABLE_FACE_TRACKING: bool = os.getenv("ENABLE_FACE_TRACKING", "False").lower() in ("true", "1", "yes")
    ENABLE_POSE_TRACKING: bool = os.getenv("ENABLE_POSE_TRACKING", "False").lower() in ("true", "1", "yes")
    SMOOTH_LANDMARKS: bool = os.getenv("SMOOTH_LANDMARKS", "False").lower() in ("true", "1", "yes")
    HAND_TRACKER_COMPLEXITY: int = int(os.getenv("HAND_TRACKER_COMPLEXITY", "0")) # 0: Lite, 1: Balanced

    # ML
    LSTM_SEQUENCE_LENGTH: int = 30
    LSTM_MODEL_PATH: str = os.path.join(base_dir, "models", "lstm_gesture_model.h5")

    def __init__(self):
        if not self.GEMINI_API_KEY:
            print("WARNING: GEMINI_API_KEY not set. Gemini features will not work.")


config = Config()
