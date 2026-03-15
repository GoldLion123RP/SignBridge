# SignBridge AI — Project Instructions for Claude Code

## Project Overview
SignBridge AI is a real-time sign language detection and translation system.
- Backend: Python 3.11+, FastAPI, WebSockets, MediaPipe, LSTM (TensorFlow/Keras)
- Frontend: Next.js + Tailwind CSS
- AI: Google Gemini 2.5 Flash for sentence structuring, gTTS for audio
- Future: Flutter mobile app connecting to the same API

## Machine Constraints (CRITICAL)
- Intel i5-4440, 8GB RAM, NO dedicated GPU
- All code MUST be optimized for low-spec hardware
- Use lightweight model architectures
- Minimize memory usage in all operations
- Backend handles all heavy ML tasks; frontend stays lightweight

## Directory Structure
```
SignBridge/
├── backend/                  # Python FastAPI + ML
│   ├── main.py               # FastAPI entry point
│   ├── requirements.txt
│   ├── services/             # Modular service classes
│   │   ├── hand_tracker.py   # MediaPipe hand tracking
│   │   ├── lstm_predictor.py # LSTM model inference
│   │   ├── gemini_service.py # Gemini API integration
│   │   └── tts_service.py    # gTTS text-to-speech
│   ├── models/               # Saved .h5 model files
│   ├── data/                 # Training data (.npy files)
│   ├── scripts/              # Data collection & training scripts
│   └── tests/
├── web-frontend/             # Next.js + Tailwind
│   ├── src/
│   ├── public/
│   └── package.json
├── .env.local                # Real API keys (GITIGNORED)
├── .env.example              # Template for other devs (committed)
├── CLAUDE.md                 # This file (committed)
├── CLAUDE.local.md           # Personal overrides (GITIGNORED)
├── TODO.md                   # Progress tracker (auto-updated)
├── README.md
└── MOBILE_INTEGRATION.md     # Flutter integration guide
```

## CLI Tool Rules (ALWAYS follow these)
- Use `rg` instead of grep/findstr for ALL searches
- Use `fd` instead of find/dir for file finding
- Use `bat` instead of cat/type for file viewing
- Use `eza --tree --icons` for directory structure display
- Use `ast-grep` for any structural code refactoring across files
- Use `lazygit` for complex Git operations

## Agent Delegation Rules
When working on this project, delegate to these specialized agents:

### Backend / ML Work
- **AI Engineer agent** → LSTM architecture, training pipeline, model optimization
- **Backend Architect agent** → FastAPI structure, WebSocket design, API endpoints
- **Data Engineer agent** → Data collection pipeline, .npy file management
- **Database Optimizer agent** → Query and data access optimization

### Frontend Work
- **Frontend Developer agent** → Next.js components, React hooks, Tailwind styling
- **UX Architect agent** → Accessibility, dark mode, responsive design
- **UI Designer agent** → Visual layout, component design

### Quality & Security
- **Code Reviewer agent** → Review every major file before moving to next step
- **Security Engineer agent** → API key handling, .env security, input validation
- **Performance Benchmarker agent** → Ensure everything runs on low-spec machine

### Documentation & Testing
- **Technical Writer agent** → README.md, MOBILE_INTEGRATION.md, code comments
- **API Tester agent** → Test WebSocket endpoints, API responses

## MCP Server Usage
- **Context7 MCP**: ALWAYS fetch latest docs before implementing. Use for:
  - FastAPI WebSocket docs
  - Next.js 15 App Router
  - MediaPipe Hand Landmarker
  - TensorFlow/Keras LSTM
  - Google Gemini API
- **Playwright MCP**: Use for E2E testing the web frontend
- **GitHub MCP**: Use for creating issues, PRs, and repo management

## Environment Variables
- NEVER hardcode API keys in any source file
- Backend reads from `.env.local` using `python-dotenv`
- Frontend reads from `.env.local` using Next.js built-in env support
- All env vars in `.env.example` as templates with placeholder values
- Prefix frontend-accessible vars with `NEXT_PUBLIC_`

## TODO.md Auto-Update Rules
- After completing each step/sub-step, IMMEDIATELY update TODO.md
- Mark completed items with ✅ and add completion timestamp
- Mark in-progress items with 🔄
- Mark pending items with ⬜
- Add any blockers or notes discovered during implementation

## Code Quality Standards
- Type hints on ALL Python functions
- JSDoc comments on ALL TypeScript/React components
- Error handling on EVERY async operation
- Modular architecture: one class/function per responsibility
- No file longer than 200 lines — split if needed
