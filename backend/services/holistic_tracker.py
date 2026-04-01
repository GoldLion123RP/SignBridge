"""Holistic tracker using MediaPipe Holistic for hand, face, and body landmark extraction."""

import mediapipe as mp
import cv2
import numpy as np
from typing import List, Dict, Optional


# Key landmark indices for feature extraction
HAND_FINGERTIPS: List[int] = [4, 8, 12, 16, 20]  # thumb, index, middle, ring, pinky

FACE_KEY_POINTS: List[int] = [
    1,  # nose tip
    33,  # left eye inner
    133,  # left eye outer
    263,  # right eye inner
    362,  # right eye outer
    70,  # left eyebrow inner
    107,  # left eyebrow outer
    300,  # right eyebrow inner
    334,  # right eyebrow outer
    13,  # upper lip top
    14,  # upper lip bottom
    17,  # lower lip top
    18,  # lower lip bottom
    61,  # left mouth corner
    291,  # right mouth corner
    152,  # chin
    1,  # nose tip (repeated for padding to 17 points if needed)
]

# Deduplicate and ensure consistent length
FACE_KEY_POINTS: List[int] = list(dict.fromkeys(FACE_KEY_POINTS))  # 15 unique points

POSE_KEY_POINTS: List[int] = [
    11,  # left shoulder
    12,  # right shoulder
    13,  # left elbow
    14,  # right elbow
    15,  # left wrist
    16,  # right wrist
]

# Feature dimensions
HAND_FEATURES: int = len(HAND_FINGERTIPS) * 3  # 15 per hand
FACE_FEATURES: int = len(FACE_KEY_POINTS) * 3  # 45
POSE_FEATURES: int = len(POSE_KEY_POINTS) * 3  # 18
DETECTION_FLAGS: int = 4  # left hand, right hand, face, pose
TOTAL_FEATURES: int = (
    HAND_FEATURES * 2 + FACE_FEATURES + POSE_FEATURES + DETECTION_FLAGS
)  # 97


class HolisticTracker:
    """MediaPipe Holistic wrapper for extracting hand, face, and pose landmarks."""

    def __init__(
        self,
        min_detection_confidence: float = 0.5,
        min_tracking_confidence: float = 0.5,
    ) -> None:
        self.mp_holistic = mp.solutions.holistic
        self.holistic = self.mp_holistic.Holistic(
            static_image_mode=False,
            model_complexity=1,
            min_detection_confidence=min_detection_confidence,
            min_tracking_confidence=min_tracking_confidence,
        )

    def process_frame(self, frame: np.ndarray) -> Optional[Dict[str, any]]:
        """Process a single BGR frame and return structured tracking data.

        Returns None if no landmarks are detected at all.
        """
        rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        rgb_frame.flags.writeable = False
        results = self.holistic.process(rgb_frame)

        h, w, _ = frame.shape

        # Extract hand landmarks (both left and right)
        hands: List[Dict[str, float]] = []
        left_detected = results.left_hand_landmarks is not None
        right_detected = results.right_hand_landmarks is not None

        if left_detected:
            hands.append(
                self._extract_hand_landmarks(results.left_hand_landmarks, w, h, "Left")
            )
        if right_detected:
            hands.append(
                self._extract_hand_landmarks(
                    results.right_hand_landmarks, w, h, "Right"
                )
            )

        # Extract face landmarks
        face: List[Dict[str, float]] = []
        face_detected = results.face_landmarks is not None
        if face_detected:
            face = self._extract_face_landmarks(results.face_landmarks, w, h)

        # Extract pose landmarks
        pose: List[Dict[str, float]] = []
        pose_detected = results.pose_landmarks is not None
        if pose_detected:
            pose = self._extract_pose_landmarks(results.pose_landmarks, w, h)

        if not (left_detected or right_detected or face_detected or pose_detected):
            return None

        return {
            "hands": hands,
            "face": face,
            "pose": pose,
            "hands_detected": int(left_detected) + int(right_detected),
            "face_detected": face_detected,
            "pose_detected": pose_detected,
            "frame_shape": [h, w],
        }

    def extract_features(self, tracking_result: Dict) -> List[float]:
        """Extract a fixed-size feature vector from tracking result for LSTM input."""
        features: List[float] = []

        frame_h, frame_w = 1, 1
        if tracking_result.get("frame_shape"):
            frame_h, frame_w = tracking_result["frame_shape"]

        left_hand_features, right_hand_features = self._get_hand_features(
            tracking_result
        )
        features.extend(left_hand_features)
        features.extend(right_hand_features)

        face_features = self._get_face_features(tracking_result, frame_w, frame_h)
        features.extend(face_features)

        pose_features = self._get_pose_features(tracking_result, frame_w, frame_h)
        features.extend(pose_features)

        # Detection flags: left_hand, right_hand, face, pose
        has_left = any(
            "hand_label" in h and h["hand_label"] == "Left"
            for h in tracking_result.get("hands", [])
        )
        has_right = any(
            "hand_label" in h and h["hand_label"] == "Right"
            for h in tracking_result.get("hands", [])
        )
        features.append(float(has_left))
        features.append(float(has_right))
        features.append(float(tracking_result.get("face_detected", False)))
        features.append(float(tracking_result.get("pose_detected", False)))

        return features

    def close(self) -> None:
        """Release MediaPipe resources."""
        self.holistic.close()

    # ── Private helpers ──────────────────────────────────────────────

    @staticmethod
    def _extract_hand_landmarks(
        hand_landmarks, frame_w: int, frame_h: int, label: str = ""
    ) -> Dict[str, any]:
        """Extract fingertip landmarks from a single hand."""
        points: List[Dict[str, float]] = []
        for idx in HAND_FINGERTIPS:
            lm = hand_landmarks.landmark[idx]
            points.append({"x": lm.x, "y": lm.y, "z": lm.z})
        return {"fingertips": points, "hand_label": label}

    @staticmethod
    def _extract_face_landmarks(
        face_landmarks, frame_w: int, frame_h: int
    ) -> List[Dict[str, float]]:
        """Extract key facial landmark positions."""
        points: List[Dict[str, float]] = []
        for idx in FACE_KEY_POINTS:
            if idx < len(face_landmarks.landmark):
                lm = face_landmarks.landmark[idx]
                points.append({"x": lm.x, "y": lm.y, "z": lm.z})
        return points

    @staticmethod
    def _extract_pose_landmarks(
        pose_landmarks, frame_w: int, frame_h: int
    ) -> List[Dict[str, float]]:
        """Extract key body pose landmark positions."""
        points: List[Dict[str, float]] = []
        for idx in POSE_KEY_POINTS:
            if idx < len(pose_landmarks.landmark):
                lm = pose_landmarks.landmark[idx]
                points.append({"x": lm.x, "y": lm.y, "z": lm.z})
        return points

    @staticmethod
    def _get_hand_features(tracking_result: Dict) -> tuple:
        """Return (left_hand_features, right_hand_features) as flat float lists."""
        left: List[float] = []
        right: List[float] = []

        for hand in tracking_result.get("hands", []):
            coords: List[float] = []
            for tip in hand.get("fingertips", []):
                coords.extend([tip["x"], tip["y"], tip["z"]])

            label = hand.get("hand_label", "")
            if label == "Left":
                left = coords
            elif label == "Right":
                right = coords

        # Pad with zeros if hand not detected
        if len(left) < HAND_FEATURES:
            left.extend([0.0] * (HAND_FEATURES - len(left)))
        if len(right) < HAND_FEATURES:
            right.extend([0.0] * (HAND_FEATURES - len(right)))

        return left, right

    @staticmethod
    def _get_face_features(
        tracking_result: Dict, frame_w: int, frame_h: int
    ) -> List[float]:
        """Return flat list of face landmark coordinates (normalized)."""
        features: List[float] = []
        for point in tracking_result.get("face", []):
            features.extend([point["x"], point["y"], point["z"]])
        if len(features) < FACE_FEATURES:
            features.extend([0.0] * (FACE_FEATURES - len(features)))
        return features

    @staticmethod
    def _get_pose_features(
        tracking_result: Dict, frame_w: int, frame_h: int
    ) -> List[float]:
        """Return flat list of pose landmark coordinates (normalized)."""
        features: List[float] = []
        for point in tracking_result.get("pose", []):
            features.extend([point["x"], point["y"], point["z"]])
        if len(features) < POSE_FEATURES:
            features.extend([0.0] * (POSE_FEATURES - len(features)))
        return features
