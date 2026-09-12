# PHASE 5 — AI Program Generation

**Goal:** Gemini generates a complete, personalized workout program from the user's profile + real training history → stored → materialized as editable routines the user can train from today.

**Depends on:** Phase 2 (training data + routines), Phase 4 (AI infrastructure pattern).

## DB changes — Alembic revision `0005_programs` (`backend/alembic/versions/0005_programs.py`)

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

- [ ] Generate → review → apply → routines visible in Train and startable as sessions
- [ ] Program respects onboarding constraints (days/week, equipment, injuries) — verify across 3 test profiles
- [ ] Regeneration archives the old program (exactly one active)
- [ ] Unmatched exercise names become user customs without crashing materialization
- [ ] Quota blocks a 2nd generation within 7 days
- [ ] `ai_calls` shows the generation with token counts

## Test plan

- API: mocked Gemini — context builder correctness (seed known workouts), materialization name-matching (fuzzy/case), one-active invariant.
- Manual: end-to-end on a profile with ≥2 weeks of logged training; train one full generated session.

## Notes

- Program quality depends on context quality — invest in `program_context.py` before touching prompts.
- Keep the generation prompt in `prompts.py` with a version comment; log prompt version in `ai_calls.error` is wrong — add a `prompt_version` column if needed (small migration OK).
