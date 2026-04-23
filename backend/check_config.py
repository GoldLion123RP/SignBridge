from config import config
import os

print(f"HOST: {config.HOST}")
print(f"PORT: {config.PORT}")
print(f"ALLOWED_ORIGINS: {config.ALLOWED_ORIGINS}")
print(f"GEMINI_API_KEY: {'[SET]' if config.GEMINI_API_KEY else '[MISSING]'}")
print(f"CWD: {os.getcwd()}")
