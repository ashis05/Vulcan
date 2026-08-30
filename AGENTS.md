# AGENTS.md — VULCAN

Guidelines for any agent (or developer) working in this repo. Read this before doing anything. Stack-specific rules live in `frontend/AGENTS.md` and `backend/AGENTS.md` — follow the one for the code you touch.

---

## 1. Sources of truth (read order)

1. `PLAN.md` — the single source of truth: pillars, locked decisions, architecture, DB schema, AI system, personalization engine formulas.
2. `frontend/Design/DESIGN.md` — read before touching **any** UI. Tokens (§3), component library (§6), screen specs (§8), plus the navigable HTML prototype in `frontend/Design/screens/`. Every value is a token — no one-off colors or spacing.
3. `phases/PHASE-N-*.md` — the current phase file defines exactly what to build. Each has a **"Done when"** checklist; a phase is complete only when every box is verifiably checked.

If a phase file contradicts `PLAN.md`, `PLAN.md` wins — flag the conflict rather than silently picking one.

## 2. Phase discipline (strict)

- Work **only** on the current phase. Phases are sequential; Phase N+1 must not start until Phase N's "Done when" checklist passes.
- The current phase's "Done when" checklist is the **exit gate**. Do not mark it done on intent — verify each item (tests run, manual/DB checks performed) before claiming completion.
- When a phase is complete, update its status in the `PLAN.md` §10 phase table and check off its items.
- **No scope creep.** If a change isn't needed by the current phase file, don't make it. Note it as a backlog idea instead.
- Never pre-build a later phase's feature "because it's easy" (e.g., no AI features before Phase 4, no food camera before Phase 4).

## 3. Architecture boundaries (hard constraints)

- **Data vs AI flow:** all normal CRUD flows app ↔ Supabase directly (supabase-js, RLS-secured). AI flows app → FastAPI → Gemini only. The app never calls Gemini directly; FastAPI never serves normal CRUD.
- **Secrets:** the Supabase service-role key and the Gemini API key exist **server-side only** (FastAPI). They must never appear in the app, in responses, in logs, or in committed files.
- **`frontend/.env`** may contain only `EXPO_PUBLIC_*` values — the Supabase anon key is safe, nothing else. `backend/.env` is never committed; only `.env.example` files are.
- **Quotas are mandatory** on every AI endpoint (see `ai_usage` / `increment_ai_usage`). Deny → HTTP 429 with `resets_at`.
- **Disclaimers are mandatory** on every AI-generated surface: "AI estimate — adjust before logging" (food), "AI-generated training guidance, not medical advice" (physique/programs). AI output is guidance, never medical diagnosis.
- **RLS everywhere:** every table has RLS enabled. User tables: `auth.uid() = user_id`. `ai_calls` is service-role only (no user read). Storage buckets (`food-photos`, `progress-photos`) are private and owner-scoped to `{user_id}/`.
- **Engine purity:** `frontend/src/engine/` is deterministic pure TypeScript — no React, no I/O, no framework imports. Targets are **computed, not stored**.
- **Offline tolerance:** a full workout session must be loggable with zero signal. Session state persists locally on every keystroke; mutations queue and sync.

## 4. Modularity

- Everything is modular: reusable components and utilities, not one-off blobs. Follow the folder responsibilities from `PLAN.md` §5:
  - `frontend/src/components/` — shared UI (from DESIGN.md specs) · `frontend/src/features/` — today, train, nutrition, progress, profile · `frontend/src/engine/` — pure functions · `frontend/src/lib/` — supabase client, api client, hooks · `frontend/src/theme/` — tokens from DESIGN.md.
  - `backend/app/core/` — config, auth, quotas · `backend/app/routers/` — ai.py, health.py · `backend/app/services/` — gemini.py, program_context.py, supabase_admin.py · `backend/app/schemas.py` — pydantic models.
  - `backend/migrations/` — versioned SQL only.
- When a piece of logic already exists (units, e1RM, TDEE, quota check, AI call pipeline), **reuse it** — do not duplicate or re-implement inline.
- If you find yourself writing the same thing twice, extract it into the right shared module. If a component is only used by one screen and won't be reused, keep it local to that feature.
- The AI route pipeline is a reusable pattern: **auth → quota → fetch storage → Gemini structured output → log call → respond.** Phases 5–6 reuse Phase 4's infrastructure. Build it clean.

## 5. Engineering guidelines

- **Minimal, modular changes.** Match the existing code style and conventions of the file you touch. Do not reformat unrelated code.
- **Type everything** (TypeScript / Pydantic). No `any`, no untyped dicts where a schema exists.
- **No unnecessary comments.** Prefer expressive code. Only comment non-obvious decisions or formulas (e.g., the exact engine formula and its source).
- **Naming:** descriptive, consistent. Components PascalCase, hooks `useX`, engine modules lowercase file names, routes match DESIGN.md route names.
- **Testing:**
  - Engine (TS): pure-function unit tests with `vitest` — known-input cases, floor clamping, edge cases (e.g., first-ever set = PR). Engine tests are a phase exit gate.
  - API (Python): `pytest` — mock the Gemini client, test auth (valid/garbage tokens), quota allow/deny, schema parsing.
  - Before finishing any work: run the relevant tests, typecheck, and lint. Ask for the exact commands if unsure.
- **Verification before completion:** if a "Done when" item requires a manual check (device test, DB query, storage RLS test), say what you did and what the evidence is — don't assume.
- **Error handling:** graceful, never crash. AI failures degrade to a friendly, retryable state. Offline degradation is designed, not accidental.
- **Design fidelity:** UI must use DESIGN.md tokens and component specs. Touch targets ≥44px. Respect reduce-motion and accessibility rules in DESIGN.md §11.

## 6. Git rules

- Commit only when explicitly asked. Write a concise commit message matching the repo's style. Never commit secrets, `.env` files, or build artifacts.
- Do not commit `.planning/`-style scratch or local tooling state (`.idea/`, `.obsidian/`, `.expo/` are ignored).

## 7. Session memory (MEM.md)

- `MEM.md` (repo root) is the session log + current-state snapshot. **Read it first when resuming work.**
- **After every session, append a concise summary to the Session log** in `MEM.md`: what was done, decisions, verification results, current state, and next steps. Keep it factual, no secrets.
- Keep the **Current state** section in `MEM.md` up to date when the branch/status changes materially.

## 8. When in doubt

- Read the current phase file fully before touching code.
- If a task is ambiguous, ask — do not guess at scope, formulas, or design intent.
