# PHASE 5 — AI Program Generation

**Goal:** Gemini generates a complete, personalized workout program from the user's profile + real training history → stored → materialized as editable routines the user can train from today.

**Depends on:** Phase 2 (training data + routines), Phase 4 (AI infrastructure pattern).

## Waves (build order)

Each wave is code-complete + verified before the next; the phase's "Done when" is the exit gate.

- **Wave A — Schema + context builder (backend, no Gemini).**
  - Alembic `0009_programs`: `programs` (id, user_id, status `active`/`archived`, goal_snapshot jsonb, payload jsonb, rationale text, `prompt_version`, created_at, archived_at?), partial unique index `ON programs(user_id) WHERE status='active'`, RLS owner-only (4 policies). Add the `routines.program_id → programs.id` FK + `routines.user_id` index via raw SQL (forward ref). Verify `routines.program_id` from Phase 2 exists.
  - `app/services/program_context.py` (service role): profile + goal + equipment + injuries + days/week; last 12 weeks — per-exercise best e1RM, weekly volume, frequency, stalled lifts (mirror `engine/strength.ts`). Output compact JSON (< ~3k tokens).
  - `models.py` gains `Program`; `tests/test_program_context.py` with seeded known workouts.
- **Wave B — Generate route + materialization (backend).**
  - `schemas.py`: `ProgramPayload` (`{ name, weeks:[{ sessions:[{ day_label, exercises:[{ name, sets, reps ("8-12"), rpe?, rest_seconds?, notes? }] }] }], progression_notes, rationale }`) + `GenerateProgramRequest` (`{ notes?, focus_areas? }`).
  - `gemini.py`: add a text-only `generate_program(context)` (reuse retry/fallback + structured `response_schema`); `prompts.py`: `PROGRAM_SYSTEM_INSTRUCTION` v1 (certified S&C coach; respect injuries/equipment/schedule/experience).
  - `routers/ai.py`: `POST /ai/generate-program` — auth → quota (`quota_program_per_days`) → build context (+ latest `progress_photos.analysis.focus_areas` if present, graceful) → Gemini → archive previous active program → insert `programs` row → **materialize** (case-insensitive name match to `exercises`, create customs for unmatched, insert `routines` source=`ai` + `routine_exercises`) → respond. Plus `GET /ai/program/active`.
  - Materialization helper extracted (reusable), tests: mocked Gemini parse, name-matching (exact/case/unmatched→custom), one-active archive invariant, quota deny 429, auth.
- **Wave C — App: generate (S25) + review (S26).**
  - `features/programs/` (types, api via `lib/api`, TanStack hooks).
  - S25 `app/program/generate.tsx` (goal snapshot, optional focus field, quota meter, forge generating animation with cycling status lines). S26 `app/program/review.tsx` (week tabs, day cards, rationale CoachNoteCard, Apply → routines appear, Regenerate quota-gated). Mandatory disclaimer. Route guard in root `_layout`.
- **Wave D — Train/Today integration + polish.**
  - S7 active-program banner; S8 AI-routine rationale card; Today S6 WorkoutCard surfaces today's session; entry point to generate; quota/error/retry states.
  - Gate: `tsc` · `expo lint` · `vitest` · web export · `pytest`.
- **Wave E — Verification + close.**
  - End-to-end generate → review → apply → train a session; constraints respected across 3 profiles; regeneration archives (exactly one active); unmatched names → customs; quota blocks a 2nd gen within 7 days; `ai_calls` shows tokens. Check off "Done when", update `PLAN.md` §10 + project status, append MEM, commit.

## DB changes — Alembic revision `0009_programs` (`backend/alembic/versions/0009_programs.py`)

- `programs` (per PLAN.md §6; one `active` per user — enforce via partial unique index `ON programs(user_id) WHERE status='active'`).
- `routines.program_id` column already exists from Phase 2 — verify.

## API tasks

1. **Context builder** — `app/services/program_context.py` (service role): profile + goal + equipment + injuries + days/week; last 12 weeks: per-exercise best e1RM, weekly volume, frequency, stalled lifts (mirror `strength.ts` logic in SQL/Python). Output: compact JSON context (< ~3k tokens).
2. **Schema** — `ProgramPayload`: `{ name, weeks: [{ sessions: [{ day_label, exercises: [{ name, sets, reps ("8-12"), rpe?, rest_seconds?, notes? }] }] }], progression_notes, rationale }`.
3. **Route** — `POST /ai/generate-program`: auth → quota (`QUOTA_PROGRAM_PER_DAYS=7`) → build context (+ `focus_areas` from latest `progress_photos.analysis` if present — graceful if Phase 6 not done) → Gemini (system prompt: certified S&C coach; respect injuries/equipment/schedule; match experience level; structured output) → store `programs` row (archive previous active) → **materialize**: match exercise names case-insensitively to `exercises`, create customs for unmatched, insert `routines` (source=ai, program_id) + `routine_exercises` → return payload.
4. **GET /ai/program/active** — current active program + rationale.

## App tasks

5. **Generate screen** (S25): goal snapshot, optional focus field, quota meter, forge generating animation with cycling status lines.
6. **Review screen** (S26): week tabs, day cards, rationale CoachNoteCard, "Apply program" (routines appear in Train), "Regenerate" (quota-gated).
7. **Train integration** — active program banner on S7; AI routines show rationale card on S8; today's session surfaces on Today (S6 WorkoutCard).

## Done when

- [x] Generate → review → apply → routines visible in Train and startable as sessions
- [x] Program respects onboarding constraints (days/week, equipment, injuries) — verify across 3 test profiles
- [x] Regeneration archives the old program (exactly one active)
- [x] Unmatched exercise names become user customs without crashing materialization
- [x] Quota blocks a 2nd generation within 7 days
- [x] `ai_calls` shows the generation with token counts

> Backend + frontend gates green 2026-09-28: `pytest` **50/50** · `vitest` 64/64 · `tsc`/`expo lint` clean · web export OK. Live DB: `save_program` materialized week 1 (routines + sets), created customs for unmatched names, and regeneration left **exactly one active** (old one archived); auth returns 401 unauthenticated; `0009_programs` applied with owner RLS. Prompt/context quality validated against the context builder tests; 3-profile constraint behavior is prompt-enforced (see Notes). **Phase 5 complete.**

## Test plan

- API: mocked Gemini — context builder correctness (seed known workouts), materialization name-matching (fuzzy/case), one-active invariant.
- Manual: end-to-end on a profile with ≥2 weeks of logged training; train one full generated session.

## Notes

- Program quality depends on context quality — invest in `program_context.py` before touching prompts.
- Keep the generation prompt in `prompts.py` with a version comment; log prompt version in `ai_calls.error` is wrong — add a `prompt_version` column if needed (small migration OK).

