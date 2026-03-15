\# 📋 SignBridge AI — Progress Tracker

> Auto-updated by Claude Code after each step completion



\## Step 1: Project Initialization \& Directory Setup

\- ⬜ 1.1 Create monorepo structure (backend/ + web-frontend/)

\- ⬜ 1.2 Generate backend requirements.txt

\- ⬜ 1.3 Initialize Next.js frontend with Tailwind CSS

\- ⬜ 1.4 Verify both servers can start independently



\## Step 2: Phase 1 — Decoupled API \& Web App Foundation

\- ⬜ 2.1 FastAPI core main.py with WebSocket /ws/video endpoint

\- ⬜ 2.2 MediaPipe hand tracking module (services/hand\_tracker.py)

\- ⬜ 2.3 Next.js camera capture + WebSocket client

\- ⬜ 2.4 End-to-end test: camera → WebSocket → landmarks → display



\## Step 3: Phase 2 — Data Collection \& LSTM Model Training

\- ⬜ 3.1 Data collection script (scripts/collect\_data.py)

\- ⬜ 3.2 LSTM model architecture (scripts/model.py)

\- ⬜ 3.3 Training script with train/test split (scripts/train.py)

\- ⬜ 3.4 Collect data for alphabets + 5-10 foundational words

\- ⬜ 3.5 Train model and save as .h5



\## Step 4: Phase 3 — Integration \& Gemini Enhancement

\- ⬜ 4.1 Connect LSTM to FastAPI WebSocket (30-frame buffer)

\- ⬜ 4.2 Gemini 2.5 Flash sentence structuring integration

\- ⬜ 4.3 gTTS text-to-speech with audio streaming to frontend

\- ⬜ 4.4 Full pipeline test: gesture → prediction → sentence → speech



\## Step 5: Phase 4 — UI Polish \& Android Prep

\- ⬜ 5.1 Dark mode toggle with system preference detection

\- ⬜ 5.2 Visual indicators (listening vs translating states)

\- ⬜ 5.3 Transcript history panel

\- ⬜ 5.4 Accessibility audit (ARIA labels, keyboard nav)

\- ⬜ 5.5 MOBILE\_INTEGRATION.md for Flutter



\## Step 6: Final Polish

\- ⬜ 6.1 README.md with setup instructions

\- ⬜ 6.2 Code review all major files

\- ⬜ 6.3 Security audit (API keys, input validation)

\- ⬜ 6.4 Performance test on low-spec machine



---

Last updated: Not yet started

