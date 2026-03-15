import cv2  # pyre-ignore
import numpy as np  # pyre-ignore
import os
import time
import sys

# Ensure Python can find the `services` module
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from services.hand_tracker import HandTracker  # pyre-ignore

# Define the gestures we want to collect
GESTURES = ["A", "B", "C", "Hello", "Thank_You"]

# Settings
FRAMES_PER_GESTURE = 100
DATA_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "data")

def main():
    if not os.path.exists(DATA_DIR):
        os.makedirs(DATA_DIR)
        
    print("SignBridge AI - Indian Sign Language Data Collector")
    print("--------------------------------------------------")
    print("This script will guide you through recording landmarks for ISL digits/letters.")
    print("Make sure your webcam is ready.")
    
    tracker = HandTracker()
    cap = cv2.VideoCapture(0)
    
    for gesture in GESTURES:
        input(f"\nPress ENTER to start recording for '{gesture}'...")
        print("Starting in 3 seconds...")
        time.sleep(1)
        print("2...")
        time.sleep(1)
        print("1...")
        time.sleep(1)
        print(f"RECORDING '{gesture}'! Please move your hand slightly for variation.")
        
        frames_collected: int = 0
        gesture_data = []
        
        while frames_collected < FRAMES_PER_GESTURE:
            ret, frame = cap.read()
            if not ret:
                print("Failed to grab frame.")
                break
                
            # Process using the exact same logic as your WebSocket backend
            tracking_result = tracker.process_frame(frame)
            
            # Extract features safely
            if tracking_result and tracking_result.get("landmarks"):
                 # Draw landmarks for user feedback
                for hand_landmarks in tracking_result["landmarks"]:
                    for lm in hand_landmarks:
                        cv2.circle(frame, (lm['x'], lm['y']), 3, (0, 255, 0), -1)
                        
                # Extract features from the first hand
                features = tracker.extract_features(tracking_result["landmarks"][0])
                if features:
                    gesture_data.append(features)
                    frames_collected += 1  # pyre-ignore
                    
            # UI Feedback
            cv2.putText(frame, f"Recording: {gesture}", (10, 30), cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 255, 0), 2)
            cv2.putText(frame, f"Frames: {frames_collected}/{FRAMES_PER_GESTURE}", (10, 70), cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 255, 0), 2)
            cv2.imshow("SignBridge Data Collection", frame)
            
            if cv2.waitKey(1) & 0xFF == ord('q'):
                print("User quit.")
                break

        # Save data to numpy file
        if gesture_data:
            save_path = os.path.join(DATA_DIR, f"{gesture}.npy")
            np.save(save_path, np.array(gesture_data))
            print(f"Successfully saved {frames_collected} frames for '{gesture}' to {save_path}")

    print("\nAll done!")
    cap.release()
    cv2.destroyAllWindows()
    tracker.close()

if __name__ == "__main__":
    main()
