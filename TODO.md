# SignBridge AI v2.0 - Optimized Roadmap

## P0: Quality & Evaluation
- [ ] **Core Linguistics Validation**: Run ADK evaluations (`agents-cli eval run`) to verify that Gemini correctly handles ISL (SOV) to English (SVO) translation rules. **(BLOCKED: API Key restricted/denied access)**
- [x] **Heuristic vs LSTM Audit**: Compare performance and accuracy of heuristic detection vs. LSTM prediction for common signs. ✅ 2026-05-01
- [x] **Backend Authentication**: Implement JWT-secured WebSocket and `/login` endpoint. ✅ 2026-05-02

## P1: Expansion & Scale
- [ ] **Full ISL Alphabet Dataset**: Record high-quality landmark data for all 26 ISL alphabet signs using `backend/scripts/collect_data.py`.
- [ ] **Model Retraining**: Retrain the LSTM model (`backend/scripts/train.py`) with the expanded 97-feature dataset.
- [x] **Cloud Deployment**: Backend migrated to Render.com (Auto-deploy via Blue-Green). ✅ 2026-05-03

## P2: User Experience & Hardware
- [x] **Visual "Safe Zone" Overlay**: Implement a UI guide in `web-frontend` to help users position their hands within the optimal tracking area. ✅ 2026-05-01
- [ ] **Proper Login UI**: Implement a dedicated login page in `web-frontend` to replace the current basic authentication flow.
- [x] **Performance Profiling**: Execute `backend/scripts/profile_performance.py`. Stable ~25 FPS achieved (Target 60 FPS requires multi-threading). ✅ 2026-05-02
- [x] **Multi-Hand Coordination**: Refine heuristic logic for gestures requiring two-hand interaction (e.g., "HELP"). ✅ 2026-05-01 (Implemented via `HybridRecognitionEngine`)

