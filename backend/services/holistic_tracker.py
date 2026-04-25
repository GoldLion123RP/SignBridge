"""Holistic tracker using MediaPipe for hand, face, and body landmark extraction.
Optimized for i5-4440 by selecting specific engines based on configuration.
"""

import mediapipe as mp
import cv2
import numpy as np
from typing import List, Dict, Optional, Any
from config import config

# Key landmark indices
HAND_FINGERTIPS: List[int] = [4, 8, 12, 16, 20]
# Send all 33 pose points in natural order
POSE_KEY_POINTS: List[int] = list(range(33))
# Send a wide range of face points (including the LSTM ones) in natural order
FACE_KEY_POINTS: List[int] = sorted([
    1, 33, 133, 263, 362, 13, 14, 152, 61, 291, 199, 10, 151, 108, 338, 
    297, 332, 284, 251, 389, 356, 454, 323, 361, 288, 397, 365, 379, 378, 400, 377,
    148, 176, 149, 150, 136, 172, 58, 132, 93, 234, 127, 162, 21, 54, 103, 67, 109
])

class HolisticTracker:
    def __init__(self, min_detection_confidence: float = 0.5, min_tracking_confidence: float = 0.5):
        # Optimization: Only initialize Holistic if face or pose is needed
        self.use_holistic = config.ENABLE_FACE_TRACKING or config.ENABLE_POSE_TRACKING
        
        self.holistic = None
        self.hands_only = None
        
        if self.use_holistic:
            print("[Tracker] Initializing Holistic Engine (Heavier)...")
            self.mp_holistic = mp.solutions.holistic
            self.holistic = self.mp_holistic.Holistic(
                static_image_mode=False,
                model_complexity=0, # Lightest model
                min_detection_confidence=min_detection_confidence,
                min_tracking_confidence=min_tracking_confidence,
                smooth_landmarks=config.SMOOTH_LANDMARKS
            )
        else:
            print("[Tracker] Initializing Dedicated Hands Engine (Faster)...")
            self.mp_hands = mp.solutions.hands
            self.hands_only = self.mp_hands.Hands(
                static_image_mode=False,
                max_num_hands=2,
                model_complexity=0, # Lightest model
                min_detection_confidence=min_detection_confidence,
                min_tracking_confidence=min_tracking_confidence,
            )

    def process_frame(self, frame: np.ndarray) -> Optional[Dict[str, Any]]:
        if frame is None: return None
        try:
            h, w = frame.shape[:2]
            rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
            
            hands_data = []
            face_data = []
            pose_data = []
            
            if self.holistic:
                # 1. Use Holistic (Tracks everything in one pass)
                results = self.holistic.process(rgb_frame)
                if results.left_hand_landmarks:
                    hands_data.append(self._format_hand(results.left_hand_landmarks, "Left"))
                if results.right_hand_landmarks:
                    hands_data.append(self._format_hand(results.right_hand_landmarks, "Right"))
                
                if config.ENABLE_FACE_TRACKING and results.face_landmarks:
                    for idx in FACE_KEY_POINTS:
                        lm = results.face_landmarks.landmark[idx]
                        face_data.append({"x": lm.x, "y": lm.y, "z": lm.z})

                if config.ENABLE_POSE_TRACKING and results.pose_landmarks:
                    for idx in POSE_KEY_POINTS:
                        lm = results.pose_landmarks.landmark[idx]
                        pose_data.append({"x": lm.x, "y": lm.y, "z": lm.z})
            else:
                # 2. Use dedicated Hand engine (Much faster)
                hand_res = self.hands_only.process(rgb_frame)
                if hand_res.multi_hand_landmarks:
                    for idx, hand_lms in enumerate(hand_res.multi_hand_landmarks):
                        label = hand_res.multi_handedness[idx].classification[0].label
                        hands_data.append(self._format_hand(hand_lms, label))

            return {
                "hands": hands_data,
                "face": face_data,
                "pose": pose_data,
                "hands_detected": len(hands_data),
                "face_detected": len(face_data) > 0,
                "pose_detected": len(pose_data) > 0,
                "frame_shape": [h, w]
            }
        except Exception as e:
            print(f"[Tracker Error] {e}")
            return None

    def _format_hand(self, landmarks, label: str) -> Dict:
        # Optimization: Only extract needed landmarks if possible? 
        # For now, LSTM might need more than fingertips, but fingertips are explicitly sent
        all_lms = [{"x": lm.x, "y": lm.y, "z": lm.z} for lm in landmarks.landmark]
        fingertips = [all_lms[i] for i in HAND_FINGERTIPS]
        return {
            "landmarks": all_lms,
            "fingertips": fingertips,
            "hand_label": label
        }

    def extract_features(self, tracking_result: Dict) -> List[float]:
        """Extract a 97-feature vector for the LSTM model."""
        features = []
        # Hand Features (15 left + 15 right = 30)
        for side in ["Left", "Right"]:
            hand = next((h for h in tracking_result.get("hands", []) if h["hand_label"] == side), None)
            if hand:
                for pt in hand["fingertips"]:
                    features.extend([pt["x"], pt["y"], pt["z"]])
            else:
                features.extend([0.0] * 15)

        # Face Features (8 points * 3 = 24)
        face_lstm_indices = [1, 33, 133, 263, 362, 13, 14, 152]
        face_data = tracking_result.get("face", [])
        
        if face_data:
            face_map = {val: i for i, val in enumerate(FACE_KEY_POINTS)}
            for idx in face_lstm_indices:
                if idx in face_map and face_map[idx] < len(face_data):
                    pt = face_data[face_map[idx]]
                    features.extend([pt["x"], pt["y"], pt["z"]])
                else:
                    features.extend([0.0, 0.0, 0.0])
        else:
            features.extend([0.0] * 24)
        
        # Pose Features (6 points * 3 = 18)
        pose_lstm_indices = [11, 12, 13, 14, 15, 16]
        pose_data = tracking_result.get("pose", [])
        if pose_data:
            for idx in pose_lstm_indices:
                if idx < len(pose_data):
                    pt = pose_data[idx]
                    features.extend([pt["x"], pt["y"], pt["z"]])
                else:
                    features.extend([0.0, 0.0, 0.0])
        else:
            features.extend([0.0] * 18)

        # Boolean indicators (4)
        features.append(float(any(h["hand_label"] == "Left" for h in tracking_result.get("hands", []))))
        features.append(float(any(h["hand_label"] == "Right" for h in tracking_result.get("hands", []))))
        features.append(float(tracking_result.get("face_detected", False)))
        features.append(float(tracking_result.get("pose_detected", False)))
        
        # Padding to 97
        while len(features) < 97: features.append(0.0)
        return features[:97]

    def close(self):
        if self.holistic:
            self.holistic.close()
        if self.hands_only:
            self.hands_only.close()
