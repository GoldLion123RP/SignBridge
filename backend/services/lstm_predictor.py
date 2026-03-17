# SignBridge AI - LSTM Gesture Prediction Service

# pyre-ignore-all-errors
import numpy as np
from tensorflow.keras.models import Sequential, load_model  # pyre-ignore
from tensorflow.keras.layers import LSTM, Dense, Dropout  # pyre-ignore
from tensorflow.keras.preprocessing.sequence import pad_sequences  # pyre-ignore
from typing import List, Tuple, Optional, Union, Any
import os

class LSTMGesturePredictor:
    def __init__(self, model_path: str = "models/isl_gesture_model.h5", sequence_length: int = 1, model=None):
        self.model_path = model_path
        self.sequence_length = sequence_length
        self.model = model
        self.gestures = [
            "A", "B", "C", "Hello", "Thank_You"
        ]
        self.gesture_to_id = {gesture: idx for idx, gesture in enumerate(self.gestures)}
        self.id_to_gesture = {idx: gesture for gesture, idx in self.gesture_to_id.items()}

        self.buffer: List[List[float]] = []  # Store recent frames for sequence prediction
        self.current_prediction: Optional[Tuple[str, float]] = None
        self.confidence_threshold = 0.7

        self._load_model()

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
        """Create a new LSTM model architecture."""
        self.model = Sequential([
            LSTM(64, return_sequences=True, activation='relu', input_shape=(self.sequence_length, 12)),
            LSTM(128, return_sequences=True, activation='relu'),
            LSTM(64, return_sequences=False, activation='relu'),
            Dropout(0.2),
            Dense(64, activation='relu'),
            Dense(len(self.gestures), activation='softmax')
        ])

        self.model.compile(
            optimizer='adam',
            loss='categorical_crossentropy',
            metrics=['accuracy']
        )

        print("Created new LSTM model")

    def predict(self, features: List[float]) -> Optional[Tuple[str, float]]:
        """Predict gesture from extracted features."""
        if not features or len(features) < 5:
            return None

        # Add features to buffer and maintain sequence length
        self.buffer.append(features)
        if len(self.buffer) > self.sequence_length:
            self.buffer.pop(0)

        # Only predict when we have enough data
        if len(self.buffer) < self.sequence_length:
            return None

        # Ensure the sequence matches the input_shape of (1, 12)
        # Reshape for LSTM: [batch, timesteps, features] -> (1, 1, 12)
        sequence = np.array(self.buffer, dtype='float32')
        if sequence.shape[0] != self.sequence_length or sequence.shape[1] != 12:
             return None

        # Add batch dimension
        sequence = np.expand_dims(sequence, axis=0)

        try:
            # Make prediction
            predictions = self.model.predict(sequence, verbose=0)
            prediction_idx = np.argmax(predictions[0])
            confidence = predictions[0][prediction_idx]

            gesture = self.id_to_gesture.get(prediction_idx, "unknown")
            self.current_prediction = (gesture, confidence)

            return (gesture, confidence) if confidence > self.confidence_threshold else None

        except Exception as e:
            print(f"Prediction error: {e}")
            return None

    def train(self, X: List[List[float]], y: List[int], epochs: int = 10, batch_size: int = 32):
        """Train the LSTM model with new data."""
        if not X or not y:
            print("No training data provided")
            return

        # Convert to numpy arrays
        X_np = np.array(X)
        y_np = np.array(y)

        # Pad sequences
        X_padded = pad_sequences(X_np, maxlen=self.sequence_length, dtype='float32')

        # One-hot encode labels
        y_encoded = np.eye(len(self.gestures))[y_np]

        try:
            # Train model
            history = self.model.fit(
                X_padded, y_encoded,
                epochs=epochs,
                batch_size=batch_size,
                validation_split=0.2,
                verbose=1
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
