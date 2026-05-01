# SignBridge AI v2.0 - Optimized Roadmap

## P0: Quality & Evaluation
- [ ] **Core Linguistics Validation**: Run ADK evaluations (`agents-cli eval run`) to verify that Gemini 2.0 Flash correctly handles ISL (SOV) to English (SVO) translation rules. **(BLOCKED: API Key 403 Permission Denied)**
- [x] **Heuristic vs LSTM Audit**: Compare performance and accuracy of heuristic detection vs. LSTM prediction for common signs. ✅ 2026-05-01

## P1: Expansion & Scale
- [ ] **Full ISL Alphabet Dataset**: Record high-quality landmark data for all 26 ISL alphabet signs using `backend/scripts/collect_data.py`.
- [ ] **Model Retraining**: Retrain the LSTM model (`backend/scripts/train.py`) with the expanded 97-feature dataset.
- [ ] **Cloud Deployment**: Finalize Production CORS settings and execute `agents-cli deploy` to host the agent on Google Cloud Run.

## P2: User Experience & Hardware
- [x] **Visual "Safe Zone" Overlay**: Implement a UI guide in `web-frontend` to help users position their hands within the optimal tracking area. ✅ 2026-05-01
- [ ] **Final Performance Profile**: Execute `backend/scripts/profile_performance.py` on target hardware (Intel i5-4440) to ensure a stable 60 FPS under load.
- [x] **Multi-Hand Coordination**: Refine heuristic logic for gestures requiring two-hand interaction (e.g., "HELP"). ✅ 2026-05-01 (Implemented via `HybridRecognitionEngine`)

