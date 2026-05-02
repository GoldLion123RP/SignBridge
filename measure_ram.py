import os
import sys
import psutil
import time

# Add backend to sys.path
backend_dir = r"E:\Projects\SignBridge\backend"
sys.path.append(backend_dir)

def get_ram_usage():
    process = psutil.Process(os.getpid())
    return process.memory_info().rss / (1024 * 1024)  # MB

print(f"Initial RAM usage: {get_ram_usage():.2f} MB")

try:
    from core.ml_pipeline import SignLanguagePipeline
    print("Imported SignLanguagePipeline")
except ImportError as e:
    print(f"Import error: {e}")
    sys.exit(1)

pipeline = SignLanguagePipeline()
print(f"Pipeline created: {get_ram_usage():.2f} MB")

pipeline.warm_up()
print(f"Pipeline warmed up: {get_ram_usage():.2f} MB")

# Wait a bit to see if it settles
time.sleep(2)
print(f"Final RAM usage: {get_ram_usage():.2f} MB")
