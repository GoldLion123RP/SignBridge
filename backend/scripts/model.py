# SignBridge AI - LSTM Model Definition

import numpy as np
from tensorflow.keras.models import Sequential, load_model
from tensorflow.keras.layers import LSTM, Dense, Dropout
from tensorflow.keras.preprocessing.sequence import pad_sequences
from typing import List, Tuple, Optional
import os

class LSTMModel:
    def __init__(self, sequence_length: int = 30, num_features: int = 97, num_gestures: int = 10):
        self.sequence_length = sequence_length
        self.num_features = num_features
        self.num_gestures = num_gestures
        self.model = None
        self.model_path = "models/lstm_gesture_model.h5"

        self._create_model()

    def _create_model(self):
        """Create the LSTM model architecture."""
        self.model = Sequential([
            LSTM(64, return_sequences=True, input_shape=(self.sequence_length, self.num_features)),
            Dropout(0.2),
            LSTM(128, return_sequences=True),
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
        """Save the model to disk in both Keras (.h5) and TFLite formats."""
        if self.model:
            # Ensure directory exists
            os.makedirs(os.path.dirname(self.model_path), exist_ok=True)
            
            # Save Keras model
            h5_path = self.model_path if self.model_path.endswith(".h5") else self.model_path + ".h5"
            self.model.save(h5_path)
            print(f"Model saved to {h5_path}")
            
            # Export to TFLite
            try:
                import tensorflow as tf
                converter = tf.lite.TFLiteConverter.from_keras_model(self.model)
                # Optimization for size/speed
                converter.optimizations = [tf.lite.Optimize.DEFAULT]
                tflite_model = converter.convert()
                
                tflite_path = h5_path.replace(".h5", ".tflite")
                with open(tflite_path, 'wb') as f:
                    f.write(tflite_model)
                print(f"TFLite model exported to {tflite_path}")
            except Exception as e:
                print(f"TFLite export failed: {e}")

    def train(self, X: np.ndarray, y: np.ndarray, epochs: int = 10, batch_size: int = 32):
        """Train the model with prepared data."""
        if len(X) < self.sequence_length:
            print(f"Not enough data for training: need at least {self.sequence_length} samples")
            return None

        # Prepare sequences (Sliding window)
        X_sequences = []
        y_sequences = []

        for i in range(len(X) - self.sequence_length + 1):
            X_sequences.append(X[i:i + self.sequence_length])
            # Use the most common label in the sequence as the target
            window_labels = y[i:i + self.sequence_length]
            most_common_label = np.bincount(window_labels.astype(int)).argmax()
            y_sequences.append(most_common_label)

        X_sequences = np.array(X_sequences)
        y_sequences = np.array(y_sequences)

        # One-hot encode labels
        y_encoded = np.eye(self.num_gestures)[y_sequences]

        print(f"Training with {len(X_sequences)} sequences")
        print(f"Input shape: {X_sequences.shape}")
        print(f"Output shape: {y_encoded.shape}")

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

class DataCollector:
    def __init__(self, output_dir: str = "data"):
        self.output_dir = output_dir
        if not os.path.exists(self.output_dir):
            os.makedirs(self.output_dir)

    def load_all_data(self) -> Tuple[np.ndarray, np.ndarray]:
        """Load all .npy data from nested subdirectories."""
        X = []
        y = []
        
        # Get all subdirectories (labels)
        labels = [d for d in os.listdir(self.output_dir) if os.path.isdir(os.path.join(self.output_dir, d))]
        labels = sorted(labels)
        label_map = {label: i for i, label in enumerate(labels)}
        
        print(f"[Data] Found {len(labels)} classes: {labels}")

        for label in labels:
            label_dir = os.path.join(self.output_dir, label)
            files = [f for f in os.listdir(label_dir) if f.endswith(".npy")]
            
            count = 0
            for f in files:
                path = os.path.join(label_dir, f)
                data = np.load(path) # This is a (seq_len, num_features) array
                
                # Check if data is already sequenced or raw frames
                if len(data.shape) == 2: # (sequence_length, num_features)
                    X.append(data)
                    y.append(label_map[label])
                    count += 1
                else: # Legacy flat data (frames, features)
                    X.extend(data)
                    y.extend([label_map[label]] * len(data))
                    count += len(data)

            print(f"[Data] Loaded {count} samples for '{label}'")
            
        return np.array(X), np.array(y)

    def close(self):
        pass
