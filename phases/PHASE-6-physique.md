# PHASE 6 — Physique Analysis & Check-ins

**Goal:** Progress photos → Gemini physique analysis (strong/weak areas, posture, recommendations) → focus areas feed back into program generation, closing the AI loop.

**Depends on:** Phase 4 (AI infra). Phase 5 benefits from it but isn't a hard prerequisite.

## DB changes — Alembic revision `0010_physique` (`backend/alembic/versions/0010_physique.py`)

- `progress_photos` (per PLAN.md §6; `analysis jsonb` written by the API).
- Storage: private bucket `progress-photos` + owner-scoped storage RLS (same pattern as `food-photos`).

## API tasks

1. **Schema** — `PhysiqueAnalysis`: summary, strong_areas[], focus_areas[], posture_notes, recommendations[], disclaimer (always present).
2. **Route** — `POST /ai/analyze-physique`: auth → quota (`QUOTA_PHYSIQUE_PER_DAYS=7`) → fetch current photo (+ optional `compare_to` previous) via service key → Gemini (system prompt: physique/strength coach assessing training-relevant musculature development; **no bodyfat % precision claims, no medical claims**; structured output) → write `analysis` onto the `progress_photos` row (service role) → log → return analysis.
3. **Refusal handling** — Gemini safety refusal → HTTP 422 `{ "reason": "refused", "tips": [...] }` (lighting, framing, attire guidance).

## App tasks

4. **Check-in flow** (S22): guided 1–3 photos (front/side/back optional), pose outlines, privacy caption, upload, "Analyze with VULCAN".
5. **Analysis screen** (S24): summary, strong/focus chips, posture notes, recommendations, disclaimer, "Apply focus to next program" (stores focus for Phase 5's route to pick up — simply: it's already on the row; Phase 5 reads latest analysis).
6. **Progress integration** — photo grid by month on S21, PhotoCompareSlider (S23), latest analysis summary card; focus areas surfaced as Today CoachNote.
7. Reminder logic: local notification check-in prompt every 4 weeks (skippable).

## Done when

- [ ] Check-in → analysis renders with all schema sections + disclaimer
- [ ] Focus areas from the latest analysis appear in the next generated program's context (verify in `ai_calls` payload or program rationale)
- [ ] Refusal path tested (provocative/low-quality image) → friendly tips, no crash, **quota not consumed**
- [ ] Photos inaccessible to other users (storage RLS test)
- [ ] Compare slider works between any two check-ins

## Test plan

- API: mocked Gemini — analysis parsing, refusal mapping to 422, quota.
- Manual: 2 check-ins 2 weeks apart on a real device; verify comparison + second analysis references progress.

## Notes

- Privacy is the product here: photos never leave the user's private bucket except server-side to Gemini; say so in the UI copy.
- `Disclaimer` copy: "AI-generated training guidance, not medical advice."

