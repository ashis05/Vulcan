# PHASE 4 — AI Food Logging (first FastAPI AI route)

**Goal:** Photo → Gemini Flash-Lite (`gemini-3.1-flash-lite`) → calorie/macro estimate → **user confirms/edits** → logged. This phase also builds the reusable AI infrastructure: Gemini service, quota system, call logging, storage buckets.

**Depends on:** Phase 3 (meals + diary exist). First phase that touches the FastAPI AI layer.

## DB changes — Alembic revision `0006_ai` (`backend/alembic/versions/0006_ai.py`)

- `ai_usage` (user_id, usage_date, feature, count; unique per user+date+feature). RLS: owner read-only (UI meters); writes service-role only.
- `ai_calls` (per PLAN.md §6) — service-role only, no user read policy.
- SQL function `increment_ai_usage(p_user uuid, p_feature text, p_limit int) returns boolean` — atomic upsert+increment, returns whether the call is allowed.
- Storage: create private bucket `food-photos`; storage RLS so users can only read/write under `{auth.uid()}/`.

### Food reference catalog — Alembic revision `0007_food_catalog`

A global, searchable food/recipe table so "Quick add" and food search can autofill macros instead of the user typing them. Follows the `exercises` catalog pattern (global rows readable by authenticated users, custom rows owner-only), seeded from `backend/app/data/` like `0002_training` / `0003_exercise_media`.

- `foods` — id, `user_id` NULL (= global) / set (= custom), name, brand?, region?, serving_description (e.g. "1 katori, 150 g"), serving_grams?, kcal, protein_g, carbs_g, fat_g, source (dataset id, e.g. `indb` / `off` / `custom`), barcode? (packaged items), is_custom. Partial unique index on `lower(name)` for globals + `(user_id, lower(name))` for customs; indexes for search.
- RLS: global rows readable by any authenticated user; custom rows owner-only; writes service-role only (seed = migration).
- **Source is intentionally undecided at planning time** — pick during Phase 4 kickoff:
  - **Recipes/dishes (primary):** Anuvaad **INDB** (open-access, ~1,014 Indian recipes + raw items). Seeded **per 100 g** (`0008_food_per_gram`) so users log an exact gram amount rather than an ambiguous "1 bowl".
  - **Packaged/barcoded (secondary):** **Open Food Facts** (ODbL) — either seed an India subset or proxy a barcode lookup through FastAPI.
  - Decide **bundle-a-seed vs on-demand API**, and confirm **license/attribution** (ODbL share-alike for OFF; verify INDB terms) before seeding.

## API tasks (`backend/`)

1. **Gemini service** — `app/services/gemini.py`: `google-genai` client, model `gemini-3.1-flash-lite` (configurable via `GEMINI_MODEL`), structured output (`response_mime_type="application/json"` + Pydantic schema), one retry, latency + token logging into `ai_calls`.
2. **Schemas** — `FoodEstimate`: name, serving_description, calories, protein_g, carbs_g, fat_g, confidence (low/medium/high), notes.
3. **Quota dependency** — `app/core/quotas.py`: calls `increment_ai_usage` with `QUOTA_FOOD_PER_DAY` (default 5); on deny → HTTP 429 with `resets_at`.
4. **Route** — `POST /ai/analyze-food`: auth → quota → create signed URL for `photo_path` (service key) → download bytes → Gemini (system prompt: sports nutritionist; estimate from image; honest confidence) → log call → return estimate. **Server does not write the meal** — the app saves after user confirmation.

## App tasks

5. **Scan flow** — S18 camera (`expo-camera`) or gallery (`expo-image-picker`); compress/resize to ≤1600px (`expo-image-manipulator`); upload to `food-photos/{uid}/{uuid}.jpg` via supabase-js; call the API with the path.
6. **Confirm screen** — S19 exactly per DESIGN.md: photo, editable name/serving/kcal/protein/carbs/fat, ConfidenceChip + "AI estimate — adjust before logging", QuotaMeter caption. Save → `meals` row (`source=photo`, `photo_path`, `ai_raw` = raw response).
7. **Wire S17** "Scan food" button; quota-exceeded BottomSheet ("The forge cools until midnight"); error/retry states.
8. **Food catalog search** — seed the global `foods` table (source decided at kickoff, see DB changes) and add a search/add flow to S17: search by name → autofill name + **per-100 g** macros + an **Amount (g)** field that scales them. Packaged products come from Open Food Facts via `GET /foods/search` (backend proxy). Reuse the search patterns from the exercise picker (S12).

## Done when

- [ ] Real food photo → editable estimate → confirmed meal appears in diary + rings update
- [ ] 6th scan in a day → friendly 429 sheet; `ai_usage` row shows the count
- [ ] Every call logged in `ai_calls` with tokens + latency (check Supabase)
- [ ] Photo is private: another user cannot access the storage object (signed URL test)
- [ ] Confidence = low estimates still work (user edits freely)
- [ ] Food catalog seeded; searching a dish/food from S17 autofills name + serving + macros and logs correctly (source chosen at kickoff)
- [ ] `pytest` passes: quota allow/deny, Gemini response parsing (mocked client), auth required

## Test plan

- API: mocked `genai` client — schema-conformant response parses; malformed → clean 502.
- Catalog: seeded row count sanity; search returns expected matches; custom foods stay private to their owner.
- Manual: 10 real meals across lighting conditions; sanity-check estimates (expect ±20%, that's why confirm exists).

## Notes

- This phase sets the pattern Phases 5–6 reuse: auth → quota → storage fetch → Gemini structured output → log → respond. Build it clean.
- Prompt lives in `backend/app/services/prompts.py` — versioned in code, easy to tune.

