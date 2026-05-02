import cv2
import numpy as np
import os
import time
import sys
import psutil
import platform
from datetime import datetime

# Ensure Python can find the `services` module
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from services.holistic_tracker import HolisticTracker

def get_cpu_usage():
    return psutil.cpu_percent(interval=None)

def get_memory_usage():
    process = psutil.Process(os.getpid())
    return process.memory_info().rss / (1024 * 1024)  # MB

def main():
    print("SignBridge AI - Performance Profiler (Headless)")
    print("===============================================")
    print(f"Current Time: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print(f"Processor:    {platform.processor()}")
    print(f"System:       {platform.system()} {platform.release()}")
    print(f"Python:       {sys.version.split()[0]}")
    print("------------------------------------\n")
    
    try:
        tracker = HolisticTracker()
    except Exception as e:
        print(f"Failed to initialize tracker: {e}")
        return

    # Use 100 frames for profiling
    num_frames = 100
    frame_count = 0
    total_latency = 0
    
    # Create a synthetic frame (320x240 as per original script's resize)
    synthetic_frame = np.zeros((240, 320, 32), dtype=np.uint8) 
    # Wait, HolisticTracker expects 3 channels (BGR)
    synthetic_frame = np.zeros((240, 320, 3), dtype=np.uint8)
    # Add some "noise" to make it more like a real image if needed, 
    # but blank is fine for just measuring pipeline latency.
    
    print(f"Profiling {num_frames} synthetic frames...")
    
    start_time = time.time()
    
    try:
        for _ in range(num_frames):
            frame_start = time.time()
            
            # Simulate real-world usage
            res = tracker.process_frame(synthetic_frame)
            _ = tracker.extract_features(res)
            
            frame_end = time.time()
            latency = (frame_end - frame_start) * 1000
            total_latency += latency
            frame_count += 1
            
            if frame_count % 20 == 0:
                print(f"Processed {frame_count}/{num_frames} frames...")
                
    except Exception as e:
        print(f"An error occurred during profiling: {e}")
    finally:
        end_time = time.time()
        duration = end_time - start_time
        avg_fps = frame_count / duration if duration > 0 else 0
        avg_latency = total_latency / frame_count if frame_count > 0 else 0
        
        print("\n" + "="*40)
        print("          PERFORMANCE REPORT          ")
        print("="*40)
        print(f"Total Frames Processed: {frame_count}")
        print(f"Average FPS:            {avg_fps:.2f}")
        print(f"Average Latency:        {avg_latency:.2f} ms")
        print(f"Peak CPU Usage:         {get_cpu_usage()}%")
        print(f"Memory Footprint:       {get_memory_usage():.2f} MB")
        print("="*40)
        
        # Recommendations (based on original script logic)
        if avg_fps < 20:
            print("\nWARNING: Performance below target for 60 FPS.")
            print("Recommendations:")
            print("- Ensure Face landmarks are DISABLED.")
            print("- Use model_complexity=0 (currently used).")
            print("- Consider further reducing resolution if needed.")
        else:
            print("\nPerformance is within acceptable range for real-time translation.")
            
        tracker.close()

if __name__ == "__main__":
    main()
