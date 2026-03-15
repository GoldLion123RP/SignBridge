# SignBridge AI - MediaPipe Hand Tracking Service

import mediapipe as mp
import cv2
import numpy as np
from typing import List, Dict, Tuple, Optional

class HandTracker:
    def __init__(self, max_hands: int = 1, min_detection_confidence: float = 0.7, min_tracking_confidence: float = 0.5):
        self.mp_hands = mp.solutions.hands
        self.mp_drawing = mp.solutions.drawing_utils

        self.hands = self.mp_hands.Hands(
            max_num_hands=max_hands,
            min_detection_confidence=min_detection_confidence,
            min_tracking_confidence=min_tracking_confidence,
            static_image_mode=False
        )

        # Hand landmarks in order
        self.landmark_names = [
            "wrist", "thumb_cmc", "thumb_mcp", "thumb_ip", "thumb_tip",
            "index_finger_mcp", "index_finger_pip", "index_finger_dip", "index_finger_tip",
            "middle_finger_mcp", "middle_finger_pip", "middle_finger_dip", "middle_finger_tip",
            "ring_finger_mcp", "ring_finger_pip", "ring_finger_dip", "ring_finger_tip",
            "pinky_mcp", "pinky_pip", "pinky_dip", "pinky_tip"
        ]

        # Important landmarks for gesture recognition
        self.key_landmarks = [4, 8, 12, 16, 20]  # thumb_tip, index_finger_tip, middle_finger_tip, ring_finger_tip, pinky_tip

    def process_frame(self, frame: np.ndarray) -> Optional[Dict[str, any]]:
        """Process a single video frame and return hand landmarks if detected."""
        try:
            # Convert frame to RGB for MediaPipe
            image_rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)

            # Flip horizontally for selfie view
            image_rgb = cv2.flip(image_rgb, 1)

            # Process frame
            results = self.hands.process(image_rgb)

            if results.multi_hand_landmarks:
                hand_data = []

                for hand_landmarks in results.multi_hand_landmarks:
                    landmarks = []

                    for idx, landmark in enumerate(hand_landmarks.landmark):
                        # Convert normalized coordinates to pixel coordinates
                        x = int(landmark.x * frame.shape[1])
                        y = int(landmark.y * frame.shape[0])
                        z = landmark.z  # Depth (0 = back, 1 = front)

                        landmarks.append({
                            "id": idx,
                            "name": self.landmark_names[idx] if idx < len(self.landmark_names) else f"unknown_{idx}",
                            "x": x,
                            "y": y,
                            "z": z
                        })

                    hand_data.append(landmarks)

                return {
                    "hands_detected": len(hand_data),
                    "landmarks": hand_data,
                    "timestamp": float(cv2.getTickCount()),
                    "frame_shape": [frame.shape[1], frame.shape[0]]  # width, height
                }

            return None

        except Exception as e:
            print(f"Hand tracking error: {e}")
            return None

    def extract_features(self, landmarks: List[Dict[str, any]]) -> List[float]:
        """Extract key features from hand landmarks for ML model."""
        if not landmarks:
            return []

        features = []

        try:
            # Get key landmark positions
            key_positions = []
            for key_id in self.key_landmarks:
                for landmark in landmarks:
                    if landmark["id"] == key_id:
                        key_positions.append((landmark["x"], landmark["y"], landmark["z"]))
                        break

            if len(key_positions) == 5:
                # Calculate distances between key points
                for i in range(5):
                    for j in range(i + 1, 5):
                        dist = np.linalg.norm(np.array(key_positions[i]) - np.array(key_positions[j]))
                        features.append(dist)

                # Calculate angles (simplified)
                if len(key_positions) >= 3:
                    # Example: angle between thumb, index, middle fingertips
                    v1 = np.array(key_positions[0]) - np.array(key_positions[1])
                    v2 = np.array(key_positions[2]) - np.array(key_positions[1])
                    angle = np.arccos(np.clip(np.dot(v1, v2) / (np.linalg.norm(v1) * np.linalg.norm(v2)), -1.0, 1.0))
                    features.append(angle)

            # Add additional features
            features.append(len(landmarks))  # Number of landmarks detected

        except Exception as e:
            print(f"Feature extraction error: {e}")

        return features

    def close(self):
        """Release MediaPipe resources."""
        self.hands.close()
