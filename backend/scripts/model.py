# SignBridge AI - LSTM Model Definition

import numpy as np
from tensorflow.keras.models import Sequential, load_model
from tensorflow.keras.layers import LSTM, Dense, Dropout
from tensorflow.keras.preprocessing.sequence import pad_sequences
from typing import List, Tuple, Optional
import os

class LSTMModel:
    def __init__(self, sequence_length: int = 30, num_features: int = 63, num_gestures: int = 10):
        self.sequence_length = sequence_length
        self.num_features = num_features
        self.num_gestures = num_gestures
        self.model = None
        self.model_path = "models/lstm_gesture_model.h5"

        self._create_model()

    def _create_model(self):
        """Create the LSTM model architecture."""
        self.model = Sequential([
            LSTM(128, return_sequences=True, input_shape=(self.sequence_length, self.num_features)),
            Dropout(0.2),
            LSTM(64, return_sequences=False),
            Dropout(0.2),
            Dense(64, activation='relu'),
            Dense(self.num_gestures, activation='softmax')
        ])

        self.model.compile(
            optimizer='adam',
            loss='categorical_crossentropy',
            metrics=['accuracy']
        )

        print("LSTM model created")

    def load(self):
        """Load pre-trained model."""
        if os.path.exists(self.model_path):
            self.model = load_model(self.model_path)
            print(f"Loaded model from {self.model_path}")
            return True
        return False

    def save(self):
        """Save the model to disk."""
        if self.model:
            self.model.save(self.model_path)
            print(f"Model saved to {self.model_path}")

    def prepare_sequences(self, X: np.ndarray, y: np.ndarray) -> Tuple[np.ndarray, np.ndarray]:
        """Prepare data sequences for training."""
        if len(X) < self.sequence_length:
            print(f"Not enough data: need at least {self.sequence_length} samples")
            return np.array([]), np.array([])

        # Pad sequences to ensure uniform length
        X_padded = pad_sequences([X], maxlen=self.sequence_length, dtype='float32')[0]

        # Create sequences with sliding window
        sequences = []
        labels = []

        for i in range(len(X_padded) - self.sequence_length + 1):
            sequences.append(X_padded[i:i + self.sequence_length])
            labels.append(y)

        return np.array(sequences), np.array(labels)

    def train(self, X: np.ndarray, y: np.ndarray, epochs: int = 10, batch_size: int = 32):
        """Train the model with prepared data."""
        if len(X) < self.sequence_length:
            print(f"Not enough data for training: need at least {self.sequence_length} samples")
            return None

        # Prepare sequences
        X_sequences = []
        y_sequences = []

        for i in range(len(X) - self.sequence_length + 1):
            X_sequences.append(X[i:i + self.sequence_length])
            y_sequences.append(y[i + self.sequence_length - 1])  # Use last label in sequence

        X_sequences = np.array(X_sequences)
        y_sequences = np.array(y_sequences)

        # One-hot encode labels
        y_encoded = np.eye(self.num_gestures)[y_sequences]

        print(f"Training with {{len(X_sequences)}} sequences")
        print(f"Input shape: {{X_sequences.shape}}")
        print(f"Output shape: {{y_encoded.shape}}")

        # Train model
        history = self.model.fit(
            X_sequences, y_encoded,
            epochs=epochs,
            batch_size=batch_size,
            validation_split=0.2,
            verbose=1
        )

        # Save model
        self.save()

        return history

    def predict(self, X: np.ndarray) -> Optional[np.ndarray]:
        """Predict gesture for a single frame or sequence."""
        if len(X) < self.sequence_length:
            return None

        # Prepare sequence
        X_padded = pad_sequences([X], maxlen=self.sequence_length, dtype='float32')[0]
        X_sequence = X_padded[-self.sequence_length:]  # Get last sequence_length frames
        X_sequence = np.expand_dims(X_sequence, axis=0)  # Add batch dimension

        try:
            predictions = self.model.predict(X_sequence, verbose=0)
            return predictions[0]
        except Exception as e:
            print(f"Prediction error: {e}")
            return None

    def evaluate(self, X: np.ndarray, y: np.ndarray) -> Optional[dict]:
        """Evaluate model on test data."""
        if len(X) < self.sequence_length:
            return None

        # Prepare sequences
        X_sequences = []
        y_sequences = []

        for i in range(len(X) - self.sequence_length + 1):
            X_sequences.append(X[i:i + self.sequence_length])
            y_sequences.append(y[i + self.sequence_length - 1])

        X_sequences = np.array(X_sequences)
        y_sequences = np.array(y_sequences)

        # One-hot encode labels
        y_encoded = np.eye(self.num_gestures)[y_sequences]

        loss, accuracy = self.model.evaluate(X_sequences, y_encoded, verbose=0)
        return {"loss": loss, "accuracy": accuracy}

    def get_summary(self) -> str:
        """Get model architecture summary."""
        if self.model:
            import io
            from contextlib import redirect_stdout

            buffer = io.StringIO()
            with redirect_stdout(buffer):
                self.model.summary()

            return buffer.getvalue()
        return "No model available"

    def predict_gesture(self, features: List[float]) -> Optional[Tuple[int, float]]:
        """Predict gesture from extracted features."""
        if len(features) < self.num_features:
            return None

        # Add features to buffer and maintain sequence length
        try:
            prediction = self.predict(np.array(features))
            if prediction is not None:
                gesture_idx = np.argmax(prediction)
                confidence = prediction[gesture_idx]
                return (gesture_idx, confidence)
        except Exception as e:
            print(f"Error in predict_gesture: {e}")

        return None

    def get_model_config(self) -> dict:
        """Get model configuration for debugging."""
        return {
            "sequence_length": self.sequence_length,
            "num_features": self.num_features,
            "num_gestures": self.num_gestures,
            "model_path": self.model_path,
            "layer_count": len(self.model.layers) if self.model else 0
        }
