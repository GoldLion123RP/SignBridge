# SignBridge AI - Data Collection Script

import cv2
import mediapipe as mp
import numpy as np
import os
from datetime import datetime
from typing import List, Dict
import json
import pickle

class DataCollector:
    def __init__(self, output_dir: str = "../data", landmark_count: int = 21):
        self.output_dir = output_dir
        self.landmark_count = landmark_count

        # Initialize MediaPipe Hands
        self.mp_hands = mp.solutions.hands
        self.hands = self.mp_hands.Hands(
            max_num_hands=1,
            min_detection_confidence=0.7,
            min_tracking_confidence=0.5,
            static_image_mode=False
        )

        os.makedirs(output_dir, exist_ok=True)

    def extract_landmarks(self, frame: np.ndarray) -> np.ndarray:
        """Extract hand landmarks from a frame."""
        image_rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        results = self.hands.process(image_rgb)

        if results.multi_hand_landmarks:
            landmarks = []
            for hand_landmarks in results.multi_hand_landmarks:
                for landmark in hand_landmarks.landmark:
                    landmarks.extend([landmark.x, landmark.y, landmark.z])

            return np.array(landmarks, dtype=np.float32)

        return np.zeros(self.landmark_count * 3, dtype=np.float32)

    def collect_samples(self, gesture_name: str, num_samples: int = 100):
        """Collect samples for a specific gesture."""
        print(f"\nCollecting data for: {gesture_name}")
        print("Press 'SPACE' to capture sample, 'q' to quit early")

        cap = cv2.VideoCapture(0)
        collected = []

        try:
            frame_idx = 0
            while len(collected) < num_samples:
                ret, frame = cap.read()
                if not ret:
                    print("Error: Could not read frame")
                    break

                # Extract landmarks
                landmarks = self.extract_landmarks(frame)

                if np.any(landmarks):  # Check if hand is detected
                    collected.append(landmarks)
                    print(f"  Sample {len(collected)}/{num_samples}", end='\r')

                    # Display frame with progress
                    cv2.putText(frame, f"{{gesture_name}}", (10, 30), cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 255, 0), 2)
                    cv2.putText(frame, f"Samples: {len(collected)}/{num_samples}", (10, 70), cv2.FONT_HERSHEY_SIMPLEX, 0.7, (255, 255, 255), 2)

                else:
                    cv2.putText(frame, "No hand detected", (10, 30), cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 0, 255), 2)

                cv2.imshow(f'Collecting: {gesture_name}', frame)
                key = cv2.waitKey(1) & 0xFF

                if key == ord('q'):
                    print("\nCollection cancelled")
                    break

                frame_idx += 1

        finally:
            cap.release()
            cv2.destroyAllWindows()

        # Save collected data
        if collected:
            self.save_data(gesture_name, np.array(collected))
            print(f"\nSaved {len(collected)} samples for '{gesture_name}'")
            return len(collected)

        return 0

    def save_data(self, gesture_name: str, data: np.ndarray):
        """Save collected data to file."""
        # Create gesture subdirectory
        gesture_dir = os.path.join(self.output_dir, gesture_name)
        os.makedirs(gesture_dir, exist_ok=True)

        # Generate unique filename with timestamp
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        filename = f"{gesture_name}_{timestamp}.npy"
        filepath = os.path.join(gesture_dir, filename)

        np.save(filepath, data)

        # Also update manifest file
        self.update_manifest(gesture_name, filepath, len(data))

    def update_manifest(self, gesture_name: str, filepath: str, num_samples: int):
        """Update the data manifest with new collection info."""
        manifest_path = os.path.join(self.output_dir, "manifest.json")
        manifest = {}

        if os.path.exists(manifest_path):
            with open(manifest_path, 'r') as f:
                manifest = json.load(f)

        if gesture_name not in manifest:
            manifest[gesture_name] = []

        manifest[gesture_name].append({
            "file": filepath,
            "samples": num_samples,
            "timestamp": datetime.now().isoformat()
        })

        with open(manifest_path, 'w') as f:
            json.dump(manifest, f, indent=2)

    def load_all_data(self) -> tuple:
        """Load all collected data for training."""
        X, y = [], []

        gestures = [d for d in os.listdir(self.output_dir) if os.path.isdir(os.path.join(self.output_dir, d)) and d != "manifest.json"]

        for gesture_idx, gesture_name in enumerate(sorted(gestures)):
            gesture_dir = os.path.join(self.output_dir, gesture_name)

            for filename in os.listdir(gesture_dir):
                if filename.endswith('.npy'):
                    filepath = os.path.join(gesture_dir, filename)
                    data = np.load(filepath)

                    for sample in data:
                        X.append(sample)
                        y.append(gesture_idx)

        return np.array(X), np.array(y)

    def close(self):
        """Release resources."""
        self.hands.close()


if __name__ == "__main__":
    # Configuration
    GESTURES = [
        "thumbs_up", "thumbs_down", "peace", "ok", "fist", "open_hand",
        "point_up", "point_down", "point_left", "point_right"
    ]
    SAMPLES_PER_GESTURE = 100

    collector = DataCollector()

    print("=" * 60)
    print("SignBridge AI - Data Collection")
    print("=" * 60)

    for gesture in GESTURES:
        input(f"\nPress Enter to start collecting '{gesture}'...")
        collector.collect_samples(gesture, SAMPLES_PER_GESTURE)

    collector.close()
    print("\nData collection complete!")

    # Show summary
    X, y = collector.load_all_data()
    print(f"\nTotal samples collected: {{len(X)}}")
    print(f"Number of gestures: {{len(np.unique(y))}}")
