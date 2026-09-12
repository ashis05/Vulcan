# PHASE 3 — Steps, Calorie Budget & Nutrition Basics

**Goal:** The Today dashboard comes alive: steps from Health Connect adjust the daily calorie budget; weight logging + trend; manual meal logging so the rings have data (photo AI arrives in Phase 4).

**Depends on:** Phase 1 (engine, targets) and Phase 2 (Today shell exists).

## DB changes — Alembic revision `0003_activity_nutrition` (`backend/alembic/versions/0003_activity_nutrition.py`)

- `daily_activity` (user_id, activity_date, steps, target_kcal, step_bonus_kcal; unique per user+date).
- `meals` (columns per PLAN.md §6; `photo_path` nullable, `source` manual|photo).
- RLS owner-only on both.

## Tasks

1. **Health Connect** — install `react-native-health-connect`, add config plugin + manifest permissions (`android.permission.health.READ_STEPS`). Build a new dev client (native change!). Screens: permission request flow (graceful denial → manual-entry fallback state).
2. **Step sync** — on app foreground: read today's steps + backfill 7 days; upsert `daily_activity`. Compute `step_bonus_kcal = steps × latest_weight_kg × 0.0005` and `target_kcal = base_target + step_bonus_kcal` (base = sedentary TDEE ± goal delta, from engine).
3. **Today dashboard** (S6 per DESIGN.md): hero calorie RingProgress (consumed/target from `meals` sum), MacroBar, steps StatTile (7-day mini bars), weight StatTile + log modal (upsert `body_metrics`), streak flame placeholder (consecutive days with any log), CoachNote placeholder card.
4. **Nutrition diary** (S16): date strip, meal sections, MacroBar per day, FAB.
5. **Add meal** (S17): "Quick add" (name + kcal + macros fields) and "Recent meals" re-log list. ("Scan food" button present but marked *Soon* — wired in Phase 4.)
6. **Meal detail** (S20): edit/delete.
7. **Weight trend adjustment** — engine `trendAdjustment`: compare 14-day weight slope vs goal; if contradicting (no loss on cut / no gain on bulk), suggest ±100 kcal and surface as a Today card ("Adjust target?"). Applied only on user confirm.

## Done when

- [ ] Real steps appear on Today (walk test with phone) and calorie target visibly increases with steps
- [ ] Steps backfill works for the past 7 days on first permission grant
- [ ] Manual meal logged → ring + macros update immediately (optimistic)
- [ ] Weight logged → body_metrics row; trend arrow on the tile reflects it
- [ ] Health Connect permission denial degrades gracefully (banner + manual steps entry)
- [ ] `daily_activity` upsert is idempotent (re-sync never duplicates)

## Test plan

- Manual: walk test; permission-denial path; meal add/edit/delete; date navigation.
- Engine: add tests for step bonus + trend adjustment thresholds.

## Notes

- Health Connect requires the Play declaration only for store release (Phase 7) — sideloaded dev builds work now.
- Do not build the food camera here. Phase 4 owns it.
- **Adaptive TDEE (this phase's accuracy upgrade):** once `meals` + `body_metrics` have history, estimate `TDEE = avg_intake + (Δweight_kg × 7700 ÷ days)` over a rolling 14–21 day window and let it converge from the Mifflin/Katch cold-start prior. This self-corrects for metabolic adaptation, activity drift, and logging error — more accurate than any static equation. Keep it in `frontend/src/engine/` as a pure function with unit tests.
