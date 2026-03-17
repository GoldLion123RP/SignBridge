"""
Debug Test: Tests each stage of the gesture detection pipeline.
Run this INSTEAD of main.py to diagnose where detection fails.
"""
import cv2
import numpy as np
import sys
import os

# Ensure services are importable
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

print("=" * 60)
print("SignBridge Debug Test - Gesture Detection Pipeline")
print("=" * 60)

# Stage 1: Test HandTracker
print("\n[STAGE 1] Testing HandTracker...")
try:
    from services.hand_tracker import HandTracker
    tracker = HandTracker()
    print("  ✓ HandTracker initialized")
except Exception as e:
    print(f"  ✗ HandTracker FAILED: {e}")
    sys.exit(1)

# Stage 2: Test camera capture
print("\n[STAGE 2] Testing camera capture...")
cap = cv2.VideoCapture(0)
if not cap.isOpened():
    print("  ✗ Cannot open webcam!")
    sys.exit(1)

ret, frame = cap.read()
if not ret or frame is None:
    print("  ✗ Cannot read frame from webcam!")
    sys.exit(1)
print(f"  ✓ Camera works. Frame shape: {frame.shape}")

# Stage 3: Test hand detection
print("\n[STAGE 3] Testing hand detection (show your hand to camera!)...")
print("  Trying 30 frames to detect a hand...")
hand_detected = False
tracking_result = None

for i in range(30):
    ret, frame = cap.read()
    if not ret:
        continue
    result = tracker.process_frame(frame)
    if result and result.get("landmarks"):
        tracking_result = result
        hand_detected = True
        print(f"  ✓ Hand detected on frame {i+1}!")
        print(f"    Hands detected: {result['hands_detected']}")
        print(f"    Landmarks count: {len(result['landmarks'][0])}")
        break

if not hand_detected:
    print("  ✗ No hand detected in 30 frames.")
    print("  → Make sure your hand is clearly visible to the webcam.")
    print("  → Try better lighting or moving your hand closer.")
    cap.release()
    tracker.close()
    sys.exit(1)

# Stage 4: Test feature extraction
print("\n[STAGE 4] Testing feature extraction...")
hand_landmarks = tracking_result["landmarks"][0]
features = tracker.extract_features(hand_landmarks)
print(f"  Features extracted: {len(features)} values")
print(f"  Feature values: {features}")

if len(features) == 0:
    print("  ✗ No features extracted! extract_features() returned empty list.")
    cap.release()
    tracker.close()
    sys.exit(1)

if len(features) != 12:
    print(f"  ⚠ Expected 12 features but got {len(features)}!")
    print(f"  → This is the DIMENSION MISMATCH causing the model to fail.")

print(f"  ✓ Feature extraction works. Got {len(features)} features.")

# Stage 5: Test LSTM Predictor
print("\n[STAGE 5] Testing LSTM Predictor...")
try:
    from services.lstm_predictor import LSTMGesturePredictor
    predictor = LSTMGesturePredictor()
    print(f"  ✓ Predictor initialized")
    print(f"  Model input shape: {predictor.model.input_shape}")
    print(f"  Sequence length: {predictor.sequence_length}")
    print(f"  Gestures: {predictor.gestures}")
    print(f"  Confidence threshold: {predictor.confidence_threshold}")
except Exception as e:
    print(f"  ✗ Predictor FAILED: {e}")
    import traceback
    traceback.print_exc()
    cap.release()
    tracker.close()
    sys.exit(1)

# Stage 6: Test prediction
print("\n[STAGE 6] Testing prediction with extracted features...")
try:
    # Manually reshape and predict to see raw output
    sequence = np.array([features], dtype='float32')
    print(f"  Sequence shape before expand: {sequence.shape}")
    sequence = np.expand_dims(sequence, axis=0)
    print(f"  Sequence shape after expand: {sequence.shape}")
    print(f"  Model expected input: {predictor.model.input_shape}")
    
    raw_predictions = predictor.model.predict(sequence, verbose=0)
    print(f"  Raw model output: {raw_predictions}")
    print(f"  Max confidence: {np.max(raw_predictions):.4f}")
    print(f"  Predicted class index: {np.argmax(raw_predictions)}")
    predicted_gesture = predictor.id_to_gesture.get(np.argmax(raw_predictions[0]), "unknown")
    print(f"  Predicted gesture: {predicted_gesture}")
    
    # Now test through the predict() method
    predictor.clear_buffer()
    result = predictor.predict(features)
    print(f"\n  predict() method returned: {result}")
    if result is None:
        print(f"  → predict() returned None. This means confidence ({np.max(raw_predictions):.4f}) < threshold ({predictor.confidence_threshold})")
        print(f"  → Since the model is UNTRAINED, this is EXPECTED behavior.")
        print(f"  → Solution: Lower confidence_threshold OR train the model first.")
    else:
        print(f"  ✓ Prediction works! Gesture: {result[0]}, Confidence: {result[1]:.4f}")
        
except Exception as e:
    print(f"  ✗ Prediction FAILED: {e}")
    import traceback
    traceback.print_exc()

cap.release()
tracker.close()

print("\n" + "=" * 60)
print("Debug test complete!")
print("=" * 60)
