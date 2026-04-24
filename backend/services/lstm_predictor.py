# SignBridge AI - LSTM Gesture Prediction Service

# pyre-ignore-all-errors
import numpy as np
from tensorflow.keras.models import Sequential, load_model  # pyre-ignore
from tensorflow.keras.layers import LSTM, Dense, Dropout  # pyre-ignore
from tensorflow.keras.preprocessing.sequence import pad_sequences  # pyre-ignore
from typing import List, Tuple, Optional, Union, Any
import os
import pickle

class LSTMGesturePredictor:
    def __init__(
        self,
        model_path: str = "models/lstm_gesture_model.h5",
        sequence_length: int = 30,
        model=None,
    ):
        self.model_path = model_path
        self.sequence_length = sequence_length
        self.model = model
        
        # Default labels, will be updated by label_mapping.pkl if it exists
        self.gestures = ["A", "B", "C", "Hello", "Thank_You"]
        self._load_label_mapping()
        
        self.gesture_to_id = {gesture: idx for idx, gesture in enumerate(self.gestures)}
        self.id_to_gesture = {
            idx: gesture for gesture, idx in self.gesture_to_id.items()
        }

        self.buffer: List[List[float]] = []  # Store recent frames for sequence prediction
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
                    # mapping is usually {idx: label}
                    if isinstance(mapping, dict):
                        # Sort by index to ensure correct order
                        sorted_indices = sorted(mapping.keys())
                        self.gestures = [mapping[i] for i in sorted_indices]
                        print(f"Loaded {len(self.gestures)} gestures from {mapping_path}")
            except Exception as e:
                print(f"Error loading label mapping: {e}")

    def _load_model(self):
        """Load the pre-trained LSTM model."""
        if self.model is None:
            if os.path.exists(self.model_path):
                try:
                    self.model = load_model(self.model_path)
                    print(f"Loaded LSTM model from {self.model_path}")
                except Exception as e:
                    print(f"Error loading model: {e}")
                    self._create_model()
            else:
                print(f"Model not found at {self.model_path}, creating new model")
                self._create_model()

    def _create_model(self):
        """Create a new LSTM model architecture matching backend/scripts/model.py."""
        self.model = Sequential([
            LSTM(64, return_sequences=True, input_shape=(self.sequence_length, 97)),
            Dropout(0.2),
            LSTM(128, return_sequences=True),
            Dropout(0.2),
            LSTM(64, return_sequences=False),
            Dropout(0.2),
            Dense(64, activation='relu'),
            Dense(len(self.gestures), activation='softmax')
        ])

        self.model.compile(
            optimizer="adam", loss="categorical_crossentropy", metrics=["accuracy"]
        )

        print("Created new LSTM model architecture")

    def predict(self, features: List[float]) -> Optional[Tuple[str, float]]:
        """Predict gesture from extracted features."""
        if not features or len(features) < 97:
            # We expect 97 features
            return None

        # Add features to buffer and maintain sequence length
        self.buffer.append(features)
        if len(self.buffer) > self.sequence_length:
            self.buffer.pop(0)

        # Only predict when we have enough data
        if len(self.buffer) < self.sequence_length:
            return None

        # Ensure the sequence matches the input_shape of (sequence_length, 97)
        sequence = np.array(self.buffer, dtype="float32")
        
        # Add batch dimension: (1, sequence_length, 97)
        sequence = np.expand_dims(sequence, axis=0)

        try:
            # Make prediction
            predictions = self.model.predict(sequence, verbose=0)
            prediction_idx = np.argmax(predictions[0])
            confidence = predictions[0][prediction_idx]

            gesture = self.id_to_gesture.get(prediction_idx, "unknown")
            self.current_prediction = (gesture, confidence)

            if confidence > self.confidence_threshold:
                return (gesture, confidence)
            else:
                return None

        except Exception as e:
            print(f"Prediction error: {e}")
            return None

    def train(
        self, X: List[List[float]], y: List[int], epochs: int = 10, batch_size: int = 32
    ):
        """Train the LSTM model with new data."""
        if not X or not y:
            print("No training data provided")
            return

        # Convert to numpy arrays
        X_np = np.array(X)
        y_np = np.array(y)

        # Pad sequences
        X_padded = pad_sequences(X_np, maxlen=self.sequence_length, dtype="float32")

        # One-hot encode labels
        y_encoded = np.eye(len(self.gestures))[y_np]

        try:
            # Train model
            history = self.model.fit(
                X_padded,
                y_encoded,
                epochs=epochs,
                batch_size=batch_size,
                validation_split=0.2,
                verbose=1,
            )

            # Save model
            self.model.save(self.model_path)
            print(f"Model trained and saved to {self.model_path}")
            return history

        except Exception as e:
            print(f"Training error: {e}")
            return None

    def clear_buffer(self):
        """Clear the feature buffer."""
        self.buffer = []
        self.current_prediction = None

    def get_model_summary(self) -> str:
        """Get model architecture summary."""
        if self.model:
            import io
            from contextlib import redirect_stdout

            buffer = io.StringIO()
            with redirect_stdout(buffer):
                self.model.summary()

            return buffer.getvalue()
        return "No model available"
