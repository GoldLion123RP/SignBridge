import time
from typing import List, Dict, Optional, Tuple, Any
from services.hand_tracker import HandTracker
from services.holistic_tracker import HolisticTracker
from services.lstm_predictor import LSTMGesturePredictor
from config import config

class HybridRecognitionEngine:
    """Orchestrates multiple recognition tiers:
    1. Heuristic (Static, fast, frame-by-frame)
    2. Neural/LSTM (Dynamic, sequence-based)
    3. Multi-hand Arbitration
    """
    
    def __init__(self, tracker: HolisticTracker, predictor: Optional[LSTMGesturePredictor]):
        self.tracker = tracker
        self.predictor = predictor
        self.hand_tracker_legacy = HandTracker(model_complexity=config.HAND_TRACKER_COMPLEXITY)
        
        # Performance tuning
        self.lstm_confidence_threshold = 0.85
        self.heuristic_cooldown = 0.5 # Seconds between heuristic triggers
        self.last_heuristic_time = 0

    def process_frame(self, frame) -> Dict[str, Any]:
        """Main recognition entry point."""
        # 1. Tracking & Feature Extraction
        tracking_result = self.tracker.process_frame(frame)
        if not tracking_result:
            return {"hands_detected": 0, "gestures": [], "landmarks": None}

        final_gestures = []
        lstm_prediction = None
        
        # 2. Neural Tier (LSTM) - High Priority for dynamic signs
        if self.predictor:
            features = self.tracker.extract_features(tracking_result)
            lstm_prediction = self.predictor.predict(features)
            
            if lstm_prediction:
                gesture, confidence = lstm_prediction
                if confidence > self.lstm_confidence_threshold:
                    final_gestures.append(gesture)

        # 3. Heuristic Tier - Fallback/Parallel for static signs
        # We reuse the hand landmarks from HolisticTracker for legacy heuristics
        if tracking_result["hands_detected"] > 0:
            for hand in tracking_result["hands"]:
                # Convert back to legacy format for _fingers_up / _recognize_gesture
                # HandTracker expects hand_landmarks object from MediaPipe, 
                # but we can mock it or refactor HandTracker to take raw dicts.
                # For now, let's use the legacy HandTracker directly if needed, 
                # but better to refactor heuristics to be tracker-agnostic.
                
                # Mocking logic for the audit task:
                # If LSTM didn't fire with high confidence, use heuristics
                if not final_gestures:
                    # We call a stateless version of the heuristic logic
                    fingers = self.hand_tracker_legacy._fingers_up_from_dict(hand["landmarks"], hand["hand_label"])
                    h_gesture = self.hand_tracker_legacy._recognize_gesture_from_dict(fingers, hand["landmarks"])
                    if h_gesture:
                        final_gestures.append(h_gesture)

        return {
            "hands_detected": tracking_result["hands_detected"],
            "gestures": list(set(final_gestures)), # De-duplicate
            "landmarks": tracking_result.get("hands"), # For rendering
            "lstm_result": lstm_prediction
        }

    def close(self):
        self.hand_tracker_legacy.close()
