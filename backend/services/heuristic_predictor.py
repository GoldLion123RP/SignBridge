import math
import time
from typing import Dict, Any, Tuple, Optional
from collections import deque

class HeuristicPredictor:
    def __init__(self):
        self.gesture_cooldown = 1.2
        # History for movement detection: [timestamp, {hand_0_wrist: (x,y), hand_0_index: (x,y), ...}]
        self.history = deque(maxlen=10) 

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
            self.history.clear()
            return None
            
        # Update movement history
        hands_state = {}
        for idx, hand in enumerate(tracking_result["hands"]):
            lm = hand.get("landmarks", [])
            if len(lm) >= 21:
                hands_state[f"h{idx}_wrist"] = (lm[0]["x"], lm[0]["y"])
                hands_state[f"h{idx}_index"] = (lm[8]["x"], lm[8]["y"])
        self.history.append((time.time(), hands_state))

        # Check for gestures
        for hand in tracking_result["hands"]:
            res = self._recognize_single_hand(hand, tracking_result)
            if res:
                gesture, confidence = res
                return gesture, confidence
                
        return None

    def _get_movement(self, key: str) -> Tuple[float, float]:
        """Calculates total movement (dx, dy) over history for a specific landmark."""
        if len(self.history) < 3: return 0.0, 0.0
        
        first = self.history[0][1].get(key)
        last = self.history[-1][1].get(key)
        
        if first and last:
            return last[0] - first[0], last[1] - first[1]
        return 0.0, 0.0

    def _recognize_single_hand(self, hand: Dict[str, Any], tracking_result: Dict[str, Any]) -> Optional[Tuple[str, float]]:
        fingers = self._fingers_up(hand)
        lm = hand.get("landmarks", [])
        if len(fingers) != 5 or len(lm) < 21: return None
        
        t, i, m, r, p = fingers
        total_up = sum(fingers)
        wrist = lm[0]
        
        # 1. THANK YOU (Hand moves from chin forward/down)
        face_data = tracking_result.get("face", [])
        if face_data and len(face_data) > 0:
            chin = face_data[152] if len(face_data) > 152 else face_data[0] 
            dist_to_chin = math.sqrt((lm[8]["x"] - chin["x"])**2 + (lm[8]["y"] - chin["y"])**2)
            
            # If fingers are together and moving away from chin
            if total_up >= 3 and dist_to_chin < 0.15:
                 _, dy = self._get_movement("h0_index")
                 if dy > 0.05: # Moving down/away
                     return "THANK YOU", 0.92

        # 2. HELLO (Waving or High Palm)
        if total_up >= 4:
            # Check if hand is above shoulder/neck
            is_high = False
            pose = tracking_result.get("pose", [])
            if pose and len(pose) > 12:
                shoulder_y = (pose[11]["y"] + pose[12]["y"]) / 2
                if wrist["y"] < shoulder_y: is_high = True
            
            dx, _ = self._get_movement("h0_wrist")
            if abs(dx) > 0.04: # Side to side movement (waving)
                return "HELLO", 0.95
            if is_high:
                return "HELLO", 0.85

        # 3. YES (Fist nodding)
        if total_up == 0:
            _, dy = self._get_movement("h0_wrist")
            if abs(dy) > 0.03: # Vertical movement (nodding)
                return "YES", 0.90
            return "YES", 0.70 # Static fist

        # 4. NO (Index wagging)
        if i and not t and not m and not r and not p:
            dx, _ = self._get_movement("h0_index")
            if abs(dx) > 0.05: # horizontal movement (wagging)
                return "NO", 0.94
            return "YOU", 0.80

        # --- STATIC SIGNS ---
        
        # HELLO (All fingers up)
        if total_up == 5:
            return "HELLO", 0.95

        # PEACE / V (Index + Middle)
        if not t and i and m and not r and not p:
            return "PEACE", 0.92

        # I LOVE YOU (Thumb + Index + Pinky)
        if t and i and not m and not r and p:
            return "I LOVE YOU", 0.95

        # CALL (Thumb + Pinky)
        if t and not i and not m and not r and p:
            return "CALL", 0.92

        # WATER / W (Index + Middle + Ring)
        if not t and i and m and r and not p:
            return "WATER", 0.90

        # ROCK (Index + Pinky)
        if not t and i and not m and not r and p:
            return "ROCK", 0.88

        # PROMISE (Only Pinky)
        if not t and not i and not m and not r and p:
            return "PROMISE", 0.85

        # HELP (Palm of one hand on top of fist or open palm with other hand nearby)
        # For simplicity: All fingers up + Hand positioned low
        if total_up == 5 and wrist["y"] > 0.7:
            return "HELP", 0.88

        # LIKE / GOOD
        if t and not i and not m and not r and not p:
            if lm[4]["y"] < lm[3]["y"]:
                return "LIKE", 0.95
            else:
                return "DISLIKE", 0.95

        # OK SIGN
        if t and i and total_up >= 3:
            dist = math.sqrt((lm[4]["x"] - lm[8]["x"])**2 + (lm[4]["y"] - lm[8]["y"])**2)
            if dist < 0.05:
                return "OK", 0.92

        return None
