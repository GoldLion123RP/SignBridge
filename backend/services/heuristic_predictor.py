import math
from typing import Dict, Any, Tuple, Optional

class HeuristicPredictor:
    def __init__(self):
        self.gesture_cooldown = 1.5

    def _fingers_up(self, hand: Dict[str, Any]) -> list:
        lm = hand.get("landmarks", [])
        if not lm or len(lm) < 21:
            return [False]*5
            
        label = hand.get("hand_label", "Right")
        tips = [4, 8, 12, 16, 20]
        pips = [3, 6, 10, 14, 18]
        
        fingers = []
        
        # Thumb: compare x-position (depends on hand side)
        if label == "Right":
            fingers.append(lm[tips[0]]["x"] < lm[pips[0]]["x"])
        else:
            fingers.append(lm[tips[0]]["x"] > lm[pips[0]]["x"])
            
        # Index -> Pinky: tip above PIP => extended
        for i in range(1, 5):
            fingers.append(lm[tips[i]]["y"] < lm[pips[i]]["y"])
            
        return fingers

    def predict(self, tracking_result: Dict[str, Any]) -> Optional[Tuple[str, float]]:
        if not tracking_result or not tracking_result.get("hands"):
            return None
            
        # Prioritize the most prominent hand or check all hands
        # For simplicity, we check the first hand that yields a gesture
        for hand in tracking_result["hands"]:
            gesture = self._recognize_single_hand(hand, tracking_result)
            if gesture:
                return gesture, 0.95
                
        return None

    def _recognize_single_hand(self, hand: Dict[str, Any], tracking_result: Dict[str, Any]) -> Optional[str]:
        fingers = self._fingers_up(hand)
        lm = hand.get("landmarks", [])
        if len(fingers) != 5 or len(lm) < 21: return None
        
        t, i, m, r, p = fingers
        total_up = sum(fingers)
        
        # FACE-TOUCHING Check
        # Using nose tip (usually face point 0 or 1 in standard MediaPipe if we extract it)
        # We will assume face_data contains the nose at index 0.
        face_data = tracking_result.get("face", [])
        if face_data and len(face_data) > 0:
            nose = face_data[0] # assuming first point is nose
            index_tip = lm[8]
            dx = nose["x"] - index_tip["x"]
            dy = nose["y"] - index_tip["y"]
            dist = math.sqrt(dx**2 + dy**2)
            # Threshold may need tuning depending on camera distance, usually 0.05 to 0.1
            if dist < 0.08:
                return "FACE-TOUCHING"

        # HELLO / OPEN PALM
        if total_up == 5:
            return "HELLO"

        # FIST / YES
        if total_up == 0:
            return "YES"

        # LIKE / GOOD (Thumbs Up) and DISLIKE / BAD (Thumbs Down)
        if t and not i and not m and not r and not p:
            if lm[4]["y"] < lm[3]["y"]:
                return "LIKE"
            else:
                return "DISLIKE"

        # PEACE / V
        if not t and i and m and not r and not p:
            return "PEACE"

        # YOU / POINTING
        if not t and i and not m and not r and not p:
            return "YOU"

        # OK SIGN
        if t and i and m and r and p:
            dx = lm[4]["x"] - lm[8]["x"]
            dy = lm[4]["y"] - lm[8]["y"]
            dist = math.sqrt(dx**2 + dy**2)
            if dist < 0.06:
                return "OK"

        # LOVE / I LOVE YOU
        if t and i and not m and not r and p:
            return "LOVE"

        # CALL ME
        if t and not i and not m and not r and p:
            return "CALL"

        # WATER (W shape)
        if not t and i and m and r and not p:
            return "WATER"

        # HELP/STOP (all except thumb)
        if not t and i and m and r and p:
            return "HELP/STOP"

        # ROCK
        if not t and i and not m and not r and p:
            return "ROCK"

        # TWO
        if t and i and not m and not r and not p:
            return "TWO"

        # WAIT
        if not t and not i and m and not r and not p:
            return "WAIT"

        # PROMISE
        if not t and not i and not m and not r and p:
            return "PROMISE"

        return None
