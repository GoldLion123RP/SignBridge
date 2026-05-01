import cv2
import numpy as np
import os
import time
import sys
import psutil
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
    print("SignBridge AI - Performance Profiler")
    print("====================================")
    print("Hardware Target: Intel i5-4440 (Expected)")
    print(f"Current Time: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print("------------------------------------\n")
    
    tracker = HolisticTracker()
    cap = cv2.VideoCapture(0)
    
    if not cap.isOpened():
        print("Error: Could not open webcam.")
        return

    frame_count = 0
    total_latency = 0
    start_time = time.time()
    
    print("Profiling started... Press 'q' to stop and generate report.")
    
    try:
        while True:
            ret, frame = cap.read()
            if not ret:
                break
                
            frame_start = time.time()
            
            # Simulate real-world usage: Resize + Process
            frame_resized = cv2.resize(frame, (320, 240))
            res = tracker.process_frame(frame_resized)
            _ = tracker.extract_features(res)
            
            frame_end = time.time()
            latency = (frame_end - frame_start) * 1000
            total_latency += latency
            frame_count += 1
            
            # UI Feedback
            cv2.putText(frame, f"FPS: {frame_count / (time.time() - start_time):.1f}", (10, 30), cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 255, 0), 2)
            cv2.putText(frame, f"Latency: {latency:.1f}ms", (10, 60), cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 255, 0), 2)
            cv2.putText(frame, f"CPU: {get_cpu_usage()}%", (10, 90), cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 255, 0), 2)
            cv2.imshow("SignBridge Profiler", frame)
            
            if cv2.waitKey(1) & 0xFF == ord('q'):
                break
                
    except KeyboardInterrupt:
        pass
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
        print("\nRecommendations for Intel i5-4440:")
        if avg_fps < 20:
            print("- DISABLE Face landmarks (already implemented in config).")
            print("- Ensure frame resizing to 320x240 is ACTIVE.")
        else:
            print("- Performance within acceptable range for real-time translation.")
            
        cap.release()
        cv2.destroyAllWindows()
        tracker.close()

if __name__ == "__main__":
    main()
