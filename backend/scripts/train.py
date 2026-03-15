# SignBridge AI - Model Training Script

import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import numpy as np
from scripts.collect_data import DataCollector
from scripts.model import LSTMModel
from typing import Tuple
import pickle

def load_training_data(data_dir: str = "../data") -> Tuple[np.ndarray, np.ndarray]:
    """Load all training data from data directory."""
    collector = DataCollector(output_dir=data_dir)
    X, y = collector.load_all_data()
    collector.close()
    return X, y

def prepare_training_data(X: np.ndarray, y: np.ndarray) -> Tuple[np.ndarray, np.ndarray]:
    """Prepare training data sequences."""
    if len(X) == 0:
        raise ValueError("No training data found")

    print(f"Loaded {{len(X)}} samples")
    print(f"Number of unique labels: {{len(np.unique(y))}}")

    # Normalize X (landmark coordinates)
    # Convert to float32 for better performance
    X = X.astype(np.float32)

    # Normalize coordinates to [0, 1] range if not already normalized
    # Landmarks 0-2 for all 21 points (x, y, z) = 63 features
    for i in range(0, X.shape[1], 3):
        X[:, i] = X[:, i] / 10000.0  # x coordinates
        X[:, i + 1] = X[:, i + 1] / 10000.0  # y coordinates
        # z coordinates don't need normalization

    return X, y

def save_label_mapping(gestures: List[str], output_dir: str = "models"):
    """Save gesture label mapping."""
    os.makedirs(output_dir, exist_ok=True)
    mapping = {{gesture: idx for idx, gesture in enumerate(sorted(gestures))}}
    filepath = os.path.join(output_dir, "label_mapping.pkl")

    with open(filepath, 'wb') as f:
        pickle.dump(mapping, f)

    print(f"Label mapping saved to {filepath}")
    return mapping

def train_model(
    data_dir: str = "../data",
    epochs: int = 50,
    batch_size: int = 32,
    sequence_length: int = 30,
    output_model_path: str = "models/lstm_gesture_model.h5"
):
    """Train the LSTM model on collected data."""
    print("\n" + "=" * 60)
    print("SignBridge AI - LSTM Model Training")
    print("=" * 60)

    # Load data
    print("\n[1/4] Loading training data...")
    X, y = load_training_data(data_dir)

    if len(X) == 0:
        print("ERROR: No training data found. Please collect data first.")
        return None

    # Get unique gestures
    unique_labels = np.unique(y)
    num_gestures = len(unique_labels)
    print(f"Found {{num_gestures}} gesture(s): {{unique_labels.tolist()}}")

    # Save label mapping
    gestures = [f"gesture_{{i}}" for i in range(num_gestures)]  # Placeholder names
    label_mapping = save_label_mapping(gestures)

    # Prepare data
    print("\n[2/4] Preparing training sequences...")
    X_prepared, y_prepared = prepare_training_data(X, y)

    # Determine input features (landmark coordinates)
    # We expect 21 landmarks * 3 coordinates = 63 features per frame
    num_features = X_prepared.shape[1]

    # Create model
    print("\n[3/4] Creating LSTM model...")
    model = LSTMModel(
        sequence_length=sequence_length,
        num_features=num_features,
        num_gestures=num_gestures
    )
    model.model_path = output_model_path

    print("\nModel architecture:")
    print(model.get_summary())

    # Train
    print("\n[4/4] Training model...")
    history = model.train(
        X_prepared, y_prepared,
        epochs=epochs,
        batch_size=batch_size
    )

    # Save final model
    model.save()

    # Print final results
    if history:
        print("\nTraining completed!")
        print(f"Final accuracy: {{history.history['accuracy'][-1]:.4f}}")
        print(f"Final validation accuracy: {{history.history['val_accuracy'][-1]:.4f}}")

    print(f"\nModel saved to: {output_model_path}")
    print("=" * 60)

    return model, history

if __name__ == "__main__":
    # Configuration
    DATA_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "data")
    EPOCHS = 50
    BATCH_SIZE = 32
    SEQUENCE_LENGTH = 30

    try:
        train_model(
            data_dir=DATA_DIR,
            epochs=EPOCHS,
            batch_size=BATCH_SIZE,
            sequence_length=SEQUENCE_LENGTH
        )
    except Exception as e:
        print(f"\nTraining failed: {{e}}")
        import traceback
        traceback.print_exc()
