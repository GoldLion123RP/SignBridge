# SignBridge AI - LSTM Gesture Prediction Service (TFLite Optimized)

import numpy as np
try:
    import tflite_runtime.interpreter as tflite
except ImportError:
    # Fallback for local development if tflite-runtime isn't installed but full TF is
    try:
        from tensorflow import lite as tflite
    except ImportError:
        tflite = None

from typing import List, Tuple, Optional, Union, Any
from collections import deque
import os
import pickle

class LSTMGesturePredictor:
    def __init__(
        self,
        model_path: str = "models/lstm_gesture_model.tflite",
        sequence_length: int = 30,
        model=None,
    ):
        # Update path to .tflite
        if model_path.endswith(".h5"):
            model_path = model_path.replace(".h5", ".tflite")
            
        self.model_path = model_path
        self.sequence_length = sequence_length
        self.interpreter = None
        self.input_details = None
        self.output_details = None
        
        # Default labels
        self.gestures = ["A", "B", "C", "Hello", "Thank_You"]
        self._load_label_mapping()
        
        self.id_to_gesture = {idx: gesture for idx, gesture in enumerate(self.gestures)}

        # Use deque with maxlen for O(1) buffer maintenance
        self.buffer = deque(maxlen=self.sequence_length)
        self.current_prediction: Optional[Tuple[str, float]] = None
        self.confidence_threshold = 0.3

        self._load_model()

    def _load_label_mapping(self):
        """Load gesture labels from pkl file if available."""
        mapping_path = os.path.join(os.path.dirname(self.model_path), "label_mapping.pkl")
        if os.path.exists(mapping_path):
            try:
                with open(mapping_path, 'rb') as f:
                    mapping = pickle.load(f)
                    if isinstance(mapping, dict):
                        sorted_indices = sorted(mapping.keys())
                        self.gestures = [mapping[i] for i in sorted_indices]
                        print(f"[Predictor] Loaded {len(self.gestures)} gestures")
            except Exception as e:
                print(f"[Predictor] Error loading labels: {e}")

    def _load_model(self):
        """Load the TFLite model."""
        if tflite is None:
            print("[Predictor] ERROR: TFLite runtime not found.")
            return

        if os.path.exists(self.model_path):
            try:
                self.interpreter = tflite.Interpreter(model_path=self.model_path)
                self.interpreter.allocate_tensors()
                
                self.input_details = self.interpreter.get_input_details()
                self.output_details = self.interpreter.get_output_details()
                
                print(f"[Predictor] Loaded TFLite model from {self.model_path}")
            except Exception as e:
                print(f"[Predictor] Error loading TFLite model: {e}")
        else:
            print(f"[Predictor] Model not found at {self.model_path}")

    def predict(self, features: List[float]) -> Optional[Tuple[str, float]]:
        """Predict gesture from extracted features using TFLite interpreter."""
        if self.interpreter is None:
            return None

        if not features or len(features) < 97:
            return None

        self.buffer.append(features)

        if len(self.buffer) < self.sequence_length:
            return None

        # Prepare sequence: (1, sequence_length, 97)
        sequence = np.array([list(self.buffer)], dtype="float32")

        try:
            # Set input tensor
            self.interpreter.set_tensor(self.input_details[0]['index'], sequence)
            
            # Run inference
            self.interpreter.invoke()
            
            # Get output tensor
            predictions = self.interpreter.get_tensor(self.output_details[0]['index'])
            
            prediction_idx = np.argmax(predictions[0])
            confidence = float(predictions[0][prediction_idx])

            gesture = self.id_to_gesture.get(prediction_idx, "unknown")
            self.current_prediction = (gesture, confidence)

            if confidence > self.confidence_threshold:
                return (gesture, confidence)
            return None

        except Exception as e:
            print(f"[Predictor] Prediction error: {e}")
            return None

    def clear_buffer(self):
        self.buffer.clear()
        self.current_prediction = None
