import mediapipe as mp
import cv2
import numpy as np
from typing import List, Tuple, Optional, Dict, Any

class HandTracker:
    def __init__(
        self,
        static_image_mode=False,
        max_num_hands=2,
        min_detection_confidence=0.5,
        min_tracking_confidence=0.5,
        model_complexity=0
    ):
        self.mp_hands = mp.solutions.hands
        self.mp_drawing = mp.solutions.drawing_utils
        self.mp_drawing_styles = mp.solutions.drawing_styles
        
        self.hands = self.mp_hands.Hands(
            static_image_mode=static_image_mode,
            max_num_hands=max_num_hands,
            min_detection_confidence=min_detection_confidence,
            min_tracking_confidence=min_tracking_confidence,
            model_complexity=model_complexity
        )
        print(f"[HandTracker] Initialized with Complexity {model_complexity}")

    def process_frame(self, frame: np.ndarray) -> Dict[str, Any]:
        """Process a single frame and return landmarks and detection status."""
        # Convert to RGB (No longer flipping here to align with mirrored frontend)
        rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        
        results = self.hands.process(rgb_frame)
        
        # Frontend expects: { hands: [ { hand_label: 'Left', landmarks: [...] } ] }
        processed_data = {
            "hands_detected": 0,
            "hands": [],
            "gestures": []
        }
        
        if results.multi_hand_landmarks:
            processed_data["hands_detected"] = len(results.multi_hand_landmarks)
            for hand_landmarks, handedness in zip(results.multi_hand_landmarks, results.multi_handedness):
                label = handedness.classification[0].label
                
                # 1. Store landmarks for frontend rendering (NESTED as expected by CameraCapture.tsx)
                lms = []
                for lm in hand_landmarks.landmark:
                    # Rounding to 4 decimal places reduces JSON payload size significantly
                    lms.append({
                        "x": round(lm.x, 4), 
                        "y": round(lm.y, 4), 
                        "z": round(lm.z, 4)
                    })
                
                processed_data["hands"].append({
                    "hand_label": label,
                    "landmarks": lms
                })
                
                # 2. Heuristic Gesture Recognition
                fingers = self._fingers_up(hand_landmarks, label)
                gesture = self._recognize_gesture(fingers, hand_landmarks)
                processed_data["gestures"].append(gesture)
                
        return processed_data

    def _fingers_up(self, hand_landmarks, handedness_label: str) -> List[bool]:
        """Legacy logic for finger state detection."""
        # Wrap the dict-based logic
        lms = [{"x": lm.x, "y": lm.y, "z": lm.z} for lm in hand_landmarks.landmark]
        return self._fingers_up_from_dict(lms, handedness_label)

    def _fingers_up_from_dict(self, landmarks: List[Dict], handedness_label: str) -> List[bool]:
        """Stateless finger state detection from raw landmark dicts."""
        tips = [4, 8, 12, 16, 20]
        pips = [3, 6, 10, 14, 18]
        fingers = []

        # Thumb
        if handedness_label == "Right":
            fingers.append(landmarks[tips[0]]["x"] < landmarks[pips[0]]["x"])
        else:
            fingers.append(landmarks[tips[0]]["x"] > landmarks[pips[0]]["x"])

        # Index -> Pinky
        for i in range(1, 5):
            fingers.append(landmarks[tips[i]]["y"] < landmarks[pips[i]]["y"])

        return fingers

    def _recognize_gesture(self, fingers: List[bool], hand_landmarks) -> Optional[str]:
        """Legacy logic for gesture mapping."""
        # Wrap the dict-based logic
        lms = [{"x": lm.x, "y": lm.y, "z": lm.z} for lm in hand_landmarks.landmark]
        return self._recognize_gesture_from_dict(fingers, lms)

    def _recognize_gesture_from_dict(self, fingers: List[bool], landmarks: List[Dict]) -> Optional[str]:
        """Stateless gesture mapping from raw landmark dicts."""
        t, i, m, r, p = fingers
        total_up = sum(fingers)

        if total_up == 5: return "HELLO"
        if total_up == 0: return "YES"

        if t and not i and not m and not r and not p:
            return "GOOD" if landmarks[4]["y"] < landmarks[3]["y"] else "BAD"

        if not t and i and m and not r and not p: return "PEACE"
        if not t and i and not m and not r and not p: return "YOU"

        if t and i and m and r and p:
            # Using squared distance to avoid expensive square root
            dist_sq = (landmarks[4]["x"] - landmarks[8]["x"])**2 + (landmarks[4]["y"] - landmarks[8]["y"])**2
            if dist_sq < 0.0036: # 0.06^2 = 0.0036
                return "OK"

        if t and i and not m and not r and p: return "I LOVE YOU"
        if t and not i and not m and not r and p: return "CALL"
        if not t and i and m and r and not p: return "WATER"
        if not t and i and m and r and p: return "HELP/STOP"
        if not t and i and not m and not r and p: return "ROCK"
        if t and i and not m and not r and not p: return "TWO"
        if not t and not i and m and not r and not p: return "WAIT"
        if not t and not i and not m and not r and p: return "PROMISE"

        return None

    def close(self):
        self.hands.close()
