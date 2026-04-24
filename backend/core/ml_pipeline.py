import tensorflow as tf
import gc
from tensorflow.keras import backend as K
from services.holistic_tracker import HolisticTracker
from services.lstm_predictor import LSTMGesturePredictor
from config import config

# Strictly limit TensorFlow resources for stability on local machine
tf.config.threading.set_intra_op_parallelism_threads(1)
tf.config.threading.set_inter_op_parallelism_threads(1)

class SignLanguagePipeline:
    def __init__(self):
        self._tracker = None
        self._predictor = None

    @property
    def tracker(self) -> HolisticTracker:
        if self._tracker is None:
            print("[Pipeline] Lazy-loading HolisticTracker...")
            self._tracker = HolisticTracker()
        return self._tracker

    @property
    def predictor(self) -> LSTMGesturePredictor:
        if self._predictor is None:
            print("[Pipeline] Lazy-loading LSTMGesturePredictor...")
            self._predictor = LSTMGesturePredictor(
                model_path=config.LSTM_MODEL_PATH, 
                sequence_length=config.LSTM_SEQUENCE_LENGTH
            )
        return self._predictor

    def close(self):
        """Aggressively free resources and trigger garbage collection."""
        print("[Pipeline] Closing resources...")
        if self._tracker:
            try:
                self._tracker.close()
            except Exception as e:
                print(f"[Pipeline] Error closing tracker: {e}")
            self._tracker = None
        
        if self._predictor:
            self._predictor = None
        
        # Clear Keras/TF session and force GC
        K.clear_session()
        gc.collect()
        print("[Pipeline] Memory cleanup complete.")
