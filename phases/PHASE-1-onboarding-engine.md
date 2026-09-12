# PHASE 1 — Onboarding & Personalization Engine

**Goal:** New users answer a wizard → profile saved to Supabase → deterministic engine computes their daily calorie/macro targets. The engine is pure, typed, and unit-tested — every later feature depends on it.

**Depends on:** Phase 0.

## DB changes — Alembic revision `0001_profiles` (`backend/alembic/versions/0001_profiles.py`)

- SQLModel tables in `backend/app/models.py`: `profiles` (columns per PLAN.md §6) and `body_metrics` (unique per user+date).
- Revision applies raw SQL for RLS policies and the `handle_new_user()` trigger on `auth.users` insert.
- RLS enabled + policies: owner select/insert/update (no delete needed).

## Tasks

1. **Engine** — `frontend/src/engine/` as pure TypeScript modules (no React/imports beyond utils):
   - `units.ts` — kg↔lb, cm↔ft/in formatters/parsers
   - `tdee.ts` — Mifflin-St Jeor BMR, activity multipliers (PLAN.md §8)
   - `targets.ts` — goal adjustments (cut −20% / bulk +10% / floors 1200F·1500M), macro split (protein 2.2 g/kg cut else 1.8; fat 25% kcal; carbs remainder), pace→kcal-delta mapping for the wizard slider
   - `steps.ts` — step kcal bonus formula (used in Phase 3, write + test now)
   - `types.ts` — Profile, Goal, Targets types shared app-wide
2. **Engine tests** — `vitest` (or jest): known-input cases (e.g., 80 kg male, 25y, 180cm → BMR ≈ 1780), floor clamping, macro sums ≈ kcal (±5%), unit round-trips.
3. **Onboarding wizard** — `(onboarding)` route group, 13 steps per DESIGN.md S5. Zustand store for wizard state. Progress bar, validation per step, unit toggles.
4. **Save** — on completion: upsert `profiles` (+ `onboarding_completed = true`), insert first `body_metrics` row, compute targets client-side and show the **Reveal** screen (S5.13).
5. **Auth gate update** — users with `onboarding_completed = false` redirect to `(onboarding)` instead of tabs.
6. **Settings stub** — `/(tabs)/profile` minimal screen (S27 shell): shows name/goal, "Edit profile" → re-opens relevant wizard fields, sign-out button.

## Done when

- [x] Fresh account → wizard → Reveal shows targets consistent with engine formulas (spot-check 3 profiles by hand against Mifflin-St Jeor)
- [x] Profile + first weight row persisted in Supabase (verify in dashboard)
- [x] RLS verified: a second user cannot read the first user's `profiles` row (manual SQL/API test)
- [x] `vitest run` passes all engine tests
- [x] Editing profile updates targets on next calculation

## Test plan

- Engine: unit tests above (this phase's exit gate).
- Manual: complete wizard as 2 different users; confirm data isolation.

## Notes

- Targets are **computed, not stored** (except what lands in `daily_activity` later) — engine is the single source of truth.
- Keep wizard screens faithful to DESIGN.md S5 — one question per screen, big tap targets.
