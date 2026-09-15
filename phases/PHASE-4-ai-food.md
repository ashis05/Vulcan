# PHASE 4 — AI Food Logging (first FastAPI AI route)

**Goal:** Photo → Gemini 2.5 Flash → calorie/macro estimate → **user confirms/edits** → logged. This phase also builds the reusable AI infrastructure: Gemini service, quota system, call logging, storage buckets.

**Depends on:** Phase 3 (meals + diary exist). First phase that touches the FastAPI AI layer.

## DB changes — Alembic revision `0005_ai` (`backend/alembic/versions/0005_ai.py`)

- `ai_usage` (user_id, usage_date, feature, count; unique per user+date+feature). RLS: owner read-only (UI meters); writes service-role only.
- `ai_calls` (per PLAN.md §6) — service-role only, no user read policy.
- SQL function `increment_ai_usage(p_user uuid, p_feature text, p_limit int) returns boolean` — atomic upsert+increment, returns whether the call is allowed.
- Storage: create private bucket `food-photos`; storage RLS so users can only read/write under `{auth.uid()}/`.

## API tasks (`backend/`)

1. **Gemini service** — `app/services/gemini.py`: `google-genai` client, model `gemini-2.5-flash`, structured output (`response_mime_type="application/json"` + Pydantic schema), one retry, latency + token logging into `ai_calls`.
2. **Schemas** — `FoodEstimate`: name, serving_description, calories, protein_g, carbs_g, fat_g, confidence (low/medium/high), notes.
3. **Quota dependency** — `app/core/quotas.py`: calls `increment_ai_usage` with `QUOTA_FOOD_PER_DAY` (default 5); on deny → HTTP 429 with `resets_at`.
4. **Route** — `POST /ai/analyze-food`: auth → quota → create signed URL for `photo_path` (service key) → download bytes → Gemini (system prompt: sports nutritionist; estimate from image; honest confidence) → log call → return estimate. **Server does not write the meal** — the app saves after user confirmation.

## App tasks

5. **Scan flow** — S18 camera (`expo-camera`) or gallery (`expo-image-picker`); compress/resize to ≤1600px (`expo-image-manipulator`); upload to `food-photos/{uid}/{uuid}.jpg` via supabase-js; call the API with the path.
6. **Confirm screen** — S19 exactly per DESIGN.md: photo, editable name/serving/kcal/protein/carbs/fat, ConfidenceChip + "AI estimate — adjust before logging", QuotaMeter caption. Save → `meals` row (`source=photo`, `photo_path`, `ai_raw` = raw response).
7. **Wire S17** "Scan food" button; quota-exceeded BottomSheet ("The forge cools until midnight"); error/retry states.

## Done when

- [ ] Real food photo → editable estimate → confirmed meal appears in diary + rings update
- [ ] 6th scan in a day → friendly 429 sheet; `ai_usage` row shows the count
- [ ] Every call logged in `ai_calls` with tokens + latency (check Supabase)
- [ ] Photo is private: another user cannot access the storage object (signed URL test)
- [ ] Confidence = low estimates still work (user edits freely)
- [ ] `pytest` passes: quota allow/deny, Gemini response parsing (mocked client), auth required

## Test plan

- API: mocked `genai` client — schema-conformant response parses; malformed → clean 502.
- Manual: 10 real meals across lighting conditions; sanity-check estimates (expect ±20%, that's why confirm exists).

## Notes

- This phase sets the pattern Phases 5–6 reuse: auth → quota → storage fetch → Gemini structured output → log → respond. Build it clean.
- Prompt lives in `backend/app/services/prompts.py` — versioned in code, easy to tune.
