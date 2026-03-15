import numpy as np  # pyre-ignore
import os
import tensorflow as tf  # pyre-ignore
from tensorflow.keras.models import Sequential, load_model  # pyre-ignore
from tensorflow.keras.layers import LSTM, Dense, Dropout  # pyre-ignore
from tensorflow.keras.utils import to_categorical  # pyre-ignore

# Config
DATA_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "data")
MODEL_SAVE_PATH = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "models", "isl_gesture_model.h5")

# Exactly matching the `collect_data.py` labels
GESTURES = ["A", "B", "C", "Hello", "Thank_You"]
SEQUENCE_LENGTH = 1   # We are tracking single frames for these static signs currently
FEATURE_DIM = 24      # The output of hand_tracker.extract_features() has 24 floats

def main():
    if not os.path.exists(DATA_DIR):
        print(f"Error: Data directory not found at {DATA_DIR}. Please run collect_data.py first.")
        return
        
    print("Loading prepared ISL dataset...")
    X, y = [], []
    
    for idx, gesture in enumerate(GESTURES):
        file_path = os.path.join(DATA_DIR, f"{gesture}.npy")
        if not os.path.exists(file_path):
            print(f"Missing data for {gesture}. Run collect_data.py to get it.")
            continue
            
        data = np.load(file_path) # Shape: (frames, 24)
        
        # We assume each frame is a standalone prediction for the simple signs
        for frame_features in data:
            # We reshape to (1, 24) because LSTM expects (timesteps, features)
            X.append([frame_features]) 
            y.append(idx)
            
    if not X:
        print("No data found! Exiting.")
        return
        
    X = np.array(X)
    y = to_categorical(y).astype(int)
    
    print(f"Dataset shape: {X.shape}, Labels shape: {y.shape}")
    
    print("Building new LSTM architecture for ISL gestures...")
    # This architecture matches the one your backend expects
    model = Sequential()
    model.add(LSTM(64, return_sequences=True, activation='relu', input_shape=(SEQUENCE_LENGTH, FEATURE_DIM)))
    model.add(LSTM(128, return_sequences=True, activation='relu'))
    model.add(LSTM(64, return_sequences=False, activation='relu'))
    model.add(Dense(64, activation='relu'))
    model.add(Dense(32, activation='relu'))
    model.add(Dense(len(GESTURES), activation='softmax'))
    
    model.compile(optimizer='Adam', loss='categorical_crossentropy', metrics=['categorical_accuracy'])
    
    print("Training model...")
    model.fit(X, y, epochs=100, batch_size=16)
    
    print(f"Saving new ISL model to {MODEL_SAVE_PATH}")
    os.makedirs(os.path.dirname(MODEL_SAVE_PATH), exist_ok=True)
    model.save(MODEL_SAVE_PATH)
    print("Training complete! The backend will now load this ISL model.")

if __name__ == "__main__":
    main()
