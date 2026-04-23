# SignBridge AI - Model Training Script

import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import numpy as np
from scripts.model import LSTMModel, DataCollector
from typing import Tuple, List
import pickle

def load_training_data(data_dir: str = "../data") -> Tuple[np.ndarray, np.ndarray, List[str]]:
    """Load all training data from data directory."""
    collector = DataCollector(output_dir=data_dir)
    X, y = collector.load_all_data()
    
    gestures = [f.replace(".npy", "") for f in os.listdir(data_dir) if f.endswith(".npy")]
    gestures = sorted(gestures)
    
    collector.close()
    return X, y, gestures

def prepare_training_data(X: np.ndarray, y: np.ndarray) -> Tuple[np.ndarray, np.ndarray]:
    """Prepare training data sequences."""
    if len(X) == 0:
        raise ValueError("No training data found")

    print(f"Loaded {len(X)} samples")
    print(f"Number of unique labels: {len(np.unique(y))}")

    # Ensure float32
    X = X.astype(np.float32)
    return X, y

def save_label_mapping(gestures: List[str], output_dir: str = "models"):
    """Save gesture label mapping."""
    os.makedirs(output_dir, exist_ok=True)
    mapping = {idx: gesture for idx, gesture in enumerate(gestures)}
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
    if not os.path.exists(data_dir):
        print(f"ERROR: Data directory {data_dir} does not exist.")
        return None
        
    X, y, gestures = load_training_data(data_dir)

    if len(X) == 0:
        print("ERROR: No training data found in .npy files.")
        return None

    # Save label mapping
    num_gestures = len(gestures)
    label_mapping = save_label_mapping(gestures)

    # Prepare data
    print("\n[2/4] Preparing training sequences...")
    X_prepared, y_prepared = prepare_training_data(X, y)

    # Determine input features
    num_features = X_prepared.shape[1]
    print(f"Detected {num_features} features per frame.")

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

    # Print final results
    if history:
        print("\nTraining completed!")
        print(f"Final accuracy: {history.history['accuracy'][-1]:.4f}")
        print(f"Final validation accuracy: {history.history['val_accuracy'][-1]:.4f}")

    print(f"\nModel saved to: {output_model_path}")
    print("=" * 60)

    return model, history

if __name__ == "__main__":
    # Configuration
    base_path = os.path.dirname(os.path.abspath(__file__))
    DATA_DIR = os.path.join(base_path, "..", "data")
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
        print(f"\nTraining failed: {e}")
        import traceback
        traceback.print_exc()
