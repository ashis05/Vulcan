# PHASE 2 — Gym Tracker (the core)

**Goal:** Complete workout logging: exercise library, routines, live session with rest timer / RPE / supersets, PR detection, history, and charts. **Offline-tolerant** — a full session must be loggable with zero signal.

**Depends on:** Phase 1 (profile exists; app shell + auth done).

## DB changes — Alembic revisions `0002_training` + `0003_exercise_media`

- `0002_training` (`backend/alembic/versions/0002_training.py`): baseline training tables + ~60-lift seed.
- `0003_exercise_media` (`backend/alembic/versions/0003_exercise_media.py`): adds `exercises.media_url` and expands the global library to **1,084 gym exercises** with tutorial GIFs (MIT `exercise-library` dataset).

- `exercises` (global rows have `user_id NULL`) + **seed ~60 common lifts** (barbell/dumbbell/machine/bodyweight, with primary_muscle + equipment).
- `routines`, `routine_exercises`, `workouts`, `workout_sets` (columns per PLAN.md §6).
- RLS: owner-only on all; `exercises` global rows readable by any authenticated user, customs owner-only.
- Indexes: `workout_sets(workout_id)`, `workout_sets(exercise_id)`, `workouts(user_id, started_at desc)`.

## Tasks

1. **Strength engine** — `frontend/src/engine/strength.ts`: Epley e1RM, PR detection (max weight / max reps-at-weight / max e1RM per exercise), volume calc, stall detection (no e1RM gain over 3 exposures). Unit tests.
2. **Train home** (S7): routines list, "Start empty workout", recent history preview.
3. **Routine builder** (S9) + routine detail (S8): CRUD routines, add/reorder/remove exercises, targets per exercise (sets, rep range, RPE, rest seconds, superset group).
4. **Exercise picker** (S12): search + muscle/equipment filters + create custom exercise.
5. **Active session** (S10) — the priority screen:
   - Start from routine (prefill targets) or empty
   - SetRows: kg/reps/RPE entry, previous-performance ghost text, complete-toggle with ignite animation + haptic, swipe → set type (warmup/drop/failure)/delete, superset spines
   - RestTimerBar: auto-start per exercise rest_seconds (default 120s), +30s, skip, local notification on finish (`expo-notifications`), screen stays awake (`expo-keep-awake`)
   - **Persist every keystroke to AsyncStorage**; resume after app kill
6. **Finish flow** → S11 summary: duration, volume, sets, detected PRs (write `is_pr` flags), notes.
7. **Offline sync** — TanStack Query mutations for sets/workouts with retry; queue writes when offline, sync on reconnect. Banner per DESIGN.md.
8. **History** (S14) + past workout detail (S15, with "Repeat").
9. **Exercise detail** (S13): e1RM line + volume bars (gifted-charts), PR list, set history.

## Done when

- [x] Full workout logged with device in airplane mode → appears in Supabase after reconnect, nothing lost
- [x] Session survives app kill mid-workout (state restored)
- [x] Supersets, dropsets, RPE, warmup sets all log and render correctly
- [x] Rest timer fires a notification with screen off
- [x] PRs detected and flagged on the summary screen (verify against engine tests)
- [x] Exercise detail charts render from real logged data
- [x] Strength engine tests pass

## Test plan

- Engine: unit tests (e1RM known values, PR edge cases: first-ever set = PR, equal performance ≠ PR).
- Manual: airplane-mode full workout; superset flow; kill-and-resume; notification timing.

## Notes

- Do NOT build AI features here — but `routines.source` and `program_id` columns must exist for Phase 5.
- Match DESIGN.md S10 exactly; this screen defines the app's feel.
