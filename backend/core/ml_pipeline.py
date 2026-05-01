import threading
import gc
from services.hand_tracker import HandTracker
from services.holistic_tracker import HolisticTracker
from services.lstm_predictor import LSTMGesturePredictor
from services.recognition_engine import HybridRecognitionEngine
from config import config

try:
    import tensorflow as tf
    from keras import backend as K
    TF_AVAILABLE = True
except ImportError:
    print("[Pipeline] WARNING: TensorFlow not found. LSTM prediction will be disabled.")
    TF_AVAILABLE = False

if TF_AVAILABLE:
    # Strictly limit TensorFlow resources for stability on local machine
    try:
        tf.config.threading.set_intra_op_parallelism_threads(1)
        tf.config.threading.set_inter_op_parallelism_threads(1)
    except Exception:
        pass

class SignLanguagePipeline:
    _instance = None
    _initialized = False
    _lock = threading.Lock()

    def __new__(cls):
        if cls._instance is None:
            with cls._lock:
                if cls._instance is None:
                    cls._instance = super(SignLanguagePipeline, cls).__new__(cls)
        return cls._instance

    def __init__(self):
        if not SignLanguagePipeline._initialized:
            with SignLanguagePipeline._lock:
                if not SignLanguagePipeline._initialized:
                    self._tracker = None
                    self._predictor = None
                    self._holistic = None
                    self._engine = None
                    SignLanguagePipeline._initialized = True
                    print("[Pipeline] Singleton initialized.")

    @property
    def tracker(self) -> HandTracker:
        if self._tracker is None:
            complexity = config.HAND_TRACKER_COMPLEXITY
            mode_str = "Lite" if complexity == 0 else "Balanced"
            print(f"[Pipeline] Loading HandTracker ({mode_str})...")
            self._tracker = HandTracker(model_complexity=complexity)
        return self._tracker

    @property
    def holistic(self) -> HolisticTracker:
        if self._holistic is None:
            self._holistic = HolisticTracker()
        return self._holistic

    @property
    def predictor(self):
        if not TF_AVAILABLE:
            return None
        if self._predictor is None:
            print("[Pipeline] Loading LSTMGesturePredictor...")
            self._predictor = LSTMGesturePredictor(
                model_path=config.LSTM_MODEL_PATH, 
                sequence_length=config.LSTM_SEQUENCE_LENGTH
            )
        return self._predictor

    @property
    def engine(self) -> HybridRecognitionEngine:
        if self._engine is None:
            self._engine = HybridRecognitionEngine(self.holistic, self.predictor)
        return self._engine

    def warm_up(self):
        """Pre-load models to avoid latency on first request."""
        print("[Pipeline] Warming up models...")
        _ = self.engine
        print("[Pipeline] Warm-up complete.")

    def close(self):
        """Aggressively free resources and trigger garbage collection."""
        print("[Pipeline] Closing resources...")
        if self._engine:
            self._engine.close()
            self._engine = None
        
        if self._holistic:
            self._holistic.close()
            self._holistic = None

        if self._tracker:
            self._tracker.close()
            self._tracker = None
        
        if self._predictor:
            self._predictor = None
        
        # Clear Keras/TF session and force GC
        if TF_AVAILABLE:
            try:
                K.clear_session()
            except Exception:
                pass
        gc.collect()
        SignLanguagePipeline._initialized = False
        print("[Pipeline] Memory cleanup complete.")
