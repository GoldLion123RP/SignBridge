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
    _instance = None
    _initialized = False

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(SignLanguagePipeline, cls).__new__(cls)
        return cls._instance

    def __init__(self):
        if not SignLanguagePipeline._initialized:
            self._tracker = None
            self._predictor = None
            SignLanguagePipeline._initialized = True
            print("[Pipeline] Singleton initialized.")

    @property
    def tracker(self) -> HolisticTracker:
        if self._tracker is None:
            print("[Pipeline] Loading HolisticTracker...")
            self._tracker = HolisticTracker()
        return self._tracker

    @property
    def predictor(self) -> LSTMGesturePredictor:
        if self._predictor is None:
            print("[Pipeline] Loading LSTMGesturePredictor...")
            self._predictor = LSTMGesturePredictor(
                model_path=config.LSTM_MODEL_PATH, 
                sequence_length=config.LSTM_SEQUENCE_LENGTH
            )
        return self._predictor

    def warm_up(self):
        """Pre-load models to avoid latency on first request."""
        print("[Pipeline] Warming up models...")
        _ = self.tracker
        _ = self.predictor
        print("[Pipeline] Warm-up complete.")

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
        SignLanguagePipeline._initialized = False
        print("[Pipeline] Memory cleanup complete.")
