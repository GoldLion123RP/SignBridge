# SignBridge AI - Text-to-Speech Service (gTTS)

import os
import io
from gtts import gTTS
from typing import Optional, Literal
import tempfile
import base64

class TTSService:
    def __init__(self, language: str = "en", slow: bool = False):
        self.language = language or os.getenv("TTS_LANGUAGE", "en")
        self.slow = slow
        self.speed = float(os.getenv("TTS_SPEED", "1.0"))

    def text_to_speech(self, text: str) -> Optional[bytes]:
        """Convert text to speech audio bytes."""
        if not text:
            return None

        try:
            tts = gTTS(text=text, lang=self.language, slow=self.slow)

            # Save to bytes buffer
            audio_buffer = io.BytesIO()
            tts.write_to_fp(audio_buffer)
            audio_buffer.seek(0)

            return audio_buffer.read()

        except Exception as e:
            print(f"TTS error: {e}")
            return None

    def text_to_speech_base64(self, text: str) -> Optional[str]:
        """Convert text to speech and return as base64 string."""
        audio_bytes = self.text_to_speech(text)
        if audio_bytes:
            return base64.b64encode(audio_bytes).decode('utf-8')
        return None

    def text_to_speech_file(self, text: str, output_path: str = None) -> Optional[str]:
        """Convert text to speech and save to file."""
        if not text:
            return None

        try:
            if output_path is None:
                # Create temporary file
                temp_file = tempfile.NamedTemporaryFile(delete=False, suffix=".mp3")
                output_path = temp_file.name
                temp_file.close()

            tts = gTTS(text=text, lang=self.language, slow=self.slow)
            tts.save(output_path)

            return output_path

        except Exception as e:
            print(f"TTS file save error: {e}")
            return None

    def stream_audio(self, text: str):
        """Generator function to stream audio data in chunks."""
        audio_bytes = self.text_to_speech(text)
        if audio_bytes:
            # Stream in 4KB chunks
            chunk_size = 4096
            for i in range(0, len(audio_bytes), chunk_size):
                yield audio_bytes[i:i + chunk_size]

    def set_language(self, language: str):
        """Set the language for TTS."""
        self.language = language

    def set_speed(self, speed: float):
        """Set the speech speed (gTTS limited to slow/not slow)."""
        self.slow = speed < 0.8
        self.speed = speed
