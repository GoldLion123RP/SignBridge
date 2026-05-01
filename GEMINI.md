# SignBridge AI — Master Configuration & Agent Guidelines

> This is the foundational mandate for all AI agents working in this workspace. It consolidates ADK standards and the Antigravity Kit protocols.

---

## 🚀 AGENT CORE PROTOCOL (START HERE)

### 1. Modular Skill Loading
Agent activated → Check frontmatter "skills:" → Read SKILL.md (INDEX) → Read specific sections.
- **Selective Reading**: DO NOT read all files in a skill folder. 
- **Rule Priority**: P0 (GEMINI.md) > P1 (Agent .md) > P2 (SKILL.md).

### 2. Enforcement Protocol
1. **Activate**: Read Rules → Check Frontmatter → Load SKILL.md → Apply All.
2. **Forbidden**: Never skip reading agent rules or skill instructions.

---

## 📥 REQUEST CLASSIFIER

| Request Type     | Active Tiers                   | Result                      |
| ---------------- | ------------------------------ | --------------------------- |
| **QUESTION**     | TIER 0 only                    | Text Response               |
| **SURVEY/INTEL** | TIER 0 + Explorer              | Session Intel (No File)     |
| **SIMPLE CODE**  | TIER 0 + TIER 1 (lite)         | Inline Edit                 |
| **COMPLEX CODE** | TIER 0 + TIER 1 (full) + Agent | **{task-slug}.md Required** |
| **DESIGN/UI**    | TIER 0 + TIER 1 + Agent        | **{task-slug}.md Required** |

---

## 🤖 ADK DEVELOPMENT WORKFLOW

### Phase 1: Understand Requirements
- Define constraints, goals, and success criteria before writing code.

### Phase 2: Build & Implement
- Implement logic in `app/`.
- Use `agents-cli run` for smoke tests.
- **Principle: Code Preservation**: Only modify targeted segments. Preserve surrounding code, config (model), and formatting.

### Phase 3: The Evaluation Loop (CRITICAL)
- **MANDATORY**: Run `agents-cli eval run` before deployment.
- Tests response quality, tool usage, and persona consistency.
- **NEVER** write pytest assertions on LLM output content.

### Phase 4: Deploy to Cloud Run
- **Explicit Approval Required**: Only run `agents-cli deploy` after user confirmation.
- Configure `ALLOWED_ORIGINS` to `*` for public WebSocket access in production.
- Use port **8080** for Cloud Run compatibility.

---

## 📱 PROJECT ROUTING

| Project Type | Primary Agent         | Skills                        |
| ------------ | --------------------- | ----------------------------- |
| **MOBILE**   | `mobile-developer`    | mobile-design                 |
| **WEB**      | `frontend-specialist` | frontend-design               |
| **BACKEND**  | `backend-specialist`  | api-patterns, database-design |

---

## 🏁 FINAL CHECKLIST PROTOCOL
**Trigger**: "final checks", "çalıştır tüm testleri", "son kontroller".

1. **Security Scan**: `python .agent/scripts/security_scan.py`
2. **Lint Check**: `agents-cli lint`
3. **E2E Tests**: `agents-cli eval run`

---

## 🧠 OPERATIONAL RULES
- **No Repeated Errors**: Stop if the same error appears 3+ times.
- **Run Python with `uv`**: Always use `uv run python script.py`.
- **Credential Safety**: Never commit `.env` files. Ensure `.env.local` is in `.gitignore`.
- **ADK Tool Imports**: Import the tool instance, not the module: `from google.adk.tools.load_web_page import load_web_page`.
