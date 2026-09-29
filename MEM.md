# MEM.md — VULCAN session memory

Continuing the project from anywhere. This file is the session log and current-state snapshot.

## How to use

- **READ this file first** when resuming work.
- **After every session, append a new entry** to the Session log below: what was done, decisions made, verification results, current state, and next steps. Keep each entry concise and factual.
- Never put secrets in this file (no keys, no tokens).

---

## Current state

- **Active branch:** `feat/ai-programs` (Phases 5). `master` = Phase 2 complete, pushed to `origin` (`github.com/ashis05/Vulcan`).
- **Branches:** `master` (through Phase 2) · `feat/gym-tracker` (merged to master) · `feat/steps-budget` (Phases 3–4) · `feat/ai-programs` (Phase 5, current) · historical: `feat/onboarding`, `frontend`, `feat/auth`.
- **Frontend** (`frontend/`): Expo SDK 57 · expo-router (new `js-tabs`) · React Native 0.86 · TypeScript · NativeWind v5 preview + Tailwind v4 · fonts (Space Grotesk/Inter) · DESIGN tokens in `src/theme/` + `src/global.css` (`@theme`).
- **Routes:** `/` = **splash** (`src/app/index.tsx`, S1 ember ignite → wordmark → redirects `/welcome`, `/onboarding`, or `/today`) · `(auth)/welcome` · `(onboarding)` · `(tabs)/today|nutrition|train|progress|profile`. `Stack.Protected` gates `(auth)` / `(onboarding)` / `(tabs)`.
- **Auth (Google-only UI):** welcome screen offers **Google sign-in only** (email button removed; `login`/`signup`/`forgot-password` route files still exist but unreachable — candidate for deletion). Google flow: PKCE (`src/lib/oauth.ts`, client `flowType:'pkce'`, redirect `vulcan://`), deep-link fallback via `Linking.addEventListener`, WebCrypto polyfill (`react-native-quick-crypto`) for SHA-256. Works end-to-end on device. Session persisted in SecureStore.
- **Styling:** **No `className` anywhere** — all styles are explicit RN `StyleSheet` objects derived from DESIGN tokens (NativeWind v5 `react-native-css` runtime was unreliable for a subset of `--text-*` utilities on native; inline styles are proven to work). `src/components/ui/{Screen,Button,TextField,TabBar}.tsx` + all screens use tokens directly.
- **Tab bar:** floating dock (rounded pill, 16px margins, elevated + shadow), center Train button raised with flame gradient, **DumbbellIcon** (64px button / 28px icon).
- **Backend** (`backend/`): FastAPI skeleton — `GET /health` (public), `GET /health/protected` (JWT verified against Supabase JWKS). **Fixed ES256 support** (Supabase signs with EC P-256): `_key_for_kid` handles EC, decode accepts `["ES256","RS256"]`. Tests 8/8 passing.
- **Migrations (Alembic + SQLModel):** `backend/app/models.py` = schema source of truth; `backend/app/db.py` (engine, psycopg3 URL normalization); `backend/alembic/`. `DATABASE_URL` set in `backend/.env`; **`0001_profiles` → `0008b_ai_quota_timezone` applied to the live DB and RLS verified** (repo head = `0008b_ai_quota_timezone`). `0002_training` = training tables; `0003_exercise_media` = `exercises.media_url` + 1,084-exercise catalog; `0004_activity_nutrition` = `daily_activity` + `meals`; `0004b` = GIF backfill; `0005_meal_slot`; `0006_ai` = `ai_usage`/`ai_calls`/`increment_ai_usage` + `food-photos` bucket; `0007_food_catalog` = `foods` (1,014 INDB); `0008_food_per_gram`; `0008b_ai_quota_timezone` = Pacific quota day.
- **Phase 2 complete** (waves A–E + improvement rounds; committed through `6378601`): routines, offline-tolerant session logging (set types/RPE/supersets/bodyweight), rest timer, PR detection on finish, history + past-workout + Repeat, exercise-detail charts (gifted-charts), 1,084-lift catalog with GIF thumbnails + YouTube tutorial link, resume banner, Spark app icon. Device pass confirmed by user; **RPE field not data-verified** (its code path is identical to reps/weight).
- **Phase 3 — Steps, Calorie Budget & Nutrition — ✅ COMPLETE (`feat/steps-budget`).** Device pass confirmed by user. Highlights:
  - `0004_activity_nutrition` (`daily_activity`, `meals`; RLS owner-only) + `0005_meal_slot` (both applied); engine `trendAdjustment`, `adaptiveTdee`, `tdeeOverride` target path.
  - Health Connect steps (`react-native-health-connect`, `minSdkVersion 26`, `READ_STEPS`); auto-sync on focus + every 60 s; local-date bucketing; `aggregateGroupByPeriod` (no double-count); 7-day avg = last 7 completed days; new **steps history page** `/steps`.
  - Today dashboard S6 (ring, macro bar, steps/weight tiles, streak, coach placeholder, trend card); nutrition diary S16 + add meal S17 + meal detail S20 (manual); weight logging → `body_metrics`; persisted ±100 kcal trend offset.
  - Shared UI: `components/ui/{RingProgress,MacroBar,StatTile,CoachNote}`; `lib/dates.ts`.
  - Code gate green: vitest 64/64 · `tsc` clean · `expo lint` clean · web export OK · pytest 8/8 · `alembic` head `0005_meal_slot`.
- **Phase 4 — AI Food Logging — ✅ COMPLETE (device-verified 2026-09-28, `feat/steps-budget`; commits `0fb3803` → `d36ad74`).** Decisions: catalog = **Anuvaad INDB**, scan = **camera + gallery**, build order = **backend first**.
  - **Wave A** (committed `0fb3803`, docs `9431d3f`): `0006_ai` applied (`ai_usage`, `ai_calls`, `increment_ai_usage` security-definer fn, private `food-photos` bucket + 4 owner storage policies), `core/quotas.py`, `schemas.py`, `services/{gemini,ai_log,supabase_admin,prompts}.py`, `routers/ai.py` (`POST /ai/analyze-food`). `SUPABASE_SERVICE_ROLE_KEY` + `GEMINI_API_KEY` in `backend/.env`.
  - **Wave B** (committed `d5f9949`, docs `4c1a1f3`): `expo-camera` + `expo-image-picker` + `expo-image-manipulator` (+ app.json camera/photo plugins); `features/nutrition/{ai,photo}.ts` (analyze call, quota query, resize+upload to `food-photos/{uid}/`); S18 `app/meal/scan` (camera + gallery, busy/error/429 states); S19 `app/meal/confirm` (editable estimate, serving rescale, confidence chip, disclaimer, quota meter, slot, log → `source=photo` + `photo_path` + `ai_raw`); S17 "Scan food" wired; shared `MacroEdit`/`ConfidenceChip`.
  - **Wave C** (committed `2b78635`/`3fa354d`, docs `cab3347`): `0007_food_catalog` — new `foods` table (global/custom; RLS: globals readable by authed users, customs owner-only) seeded with **1,014 Anuvaad INDB recipes** (`scripts/build_foods_seed.py` → `app/data/foods_seed.json`). S17 **Search foods** autofill.
  - **Fixes** (committed `9a8a2cf` → `d36ad74`): image-mime fix (RN uploaded `text/plain` → Gemini tokenized bytes as text and hallucinated; now uploads `ArrayBuffer` + `contentType: image/jpeg`, backend infers mime from extension); Gemini model default `gemini-3.1-flash-lite` + fallback on model-not-found; `0008_food_per_gram` (INDB rows per 100 g + Amount (g) scaling); `0008b_ai_quota_timezone` (quota day = Pacific midnight); `GET /foods/search` merges INDB + **Open Food Facts** packaged products (ODbL); Today ring = burnt / Nutrition ring = eaten; real app id `in.ashiswadhwani.vulcan`.
  - **Verified:** device pass confirmed by user 2026-09-28; `tsc` clean · `expo lint` clean · vitest 64/64 · pytest 31/31 · web export OK. `PHASE-4` "Done when" checked; `PLAN.md` §10 Phase 4 ✅.
- **Phase 5 — AI Program Generation — ✅ COMPLETE (`feat/ai-programs`; commits `537e3b6` → `049c5f9`).** Waves: A schema `0009_programs` + `program_context.py`; B `/ai/generate-program` + materialization + `/ai/program/active`; C S25 forge + S26 review; D Train/Today integration; E verification.
  - **`0009_programs` applied** to the live DB: `programs` (status active/archived, `goal_snapshot`/`payload` jsonb, `rationale`, `prompt_version`), partial unique index `programs_one_active_key` (one active/user), owner RLS (4 policies), `routines.program_id → programs` FK + index. Repo head = `0009_programs`.
  - **Backend:** `services/program_context.py` (profile + 12 wks: best e1RM, weekly volume, frequency, stalls — mirrors `engine/strength.ts`; `latest_focus_areas()` degrades gracefully pre-Phase-6); `services/program_materialize.py` (`save_program` archives previous active, inserts program, materializes **week 1** as `routines(source='ai')` + `routine_exercises`, case-insensitive name match, creates customs for unmatched); `gemini.generate_program` (shared retry/fallback path with `analyze_food_image`); `routers/ai.py` (`POST /ai/generate-program`, `GET /ai/program/active`); `core/quotas.py` windowed quota (`check_once_per_days` + `record_use`, `window_resets_at`; recorded only on success).
  - **Frontend:** `features/programs/` (types, api, hooks, components incl. `ProgramBanner`/`WeekTabs`/`DayCard`/`ProgramQuotaMeter`); `app/program/{_layout,generate,review}.tsx` (S25 forge overlay + quota meter; S26 week tabs/day cards/rationale/Regenerate/Apply + editable name); program banner + rationale on Train/S8/Today; routes guarded.
  - **Verified:** `pytest` **50/50** · `vitest` 64/64 · `tsc`/`expo lint` clean · web export OK · migration `alembic current = 0009_programs` with RLS/index/FK confirmed · live DB smoke: materialization created routines+sets+custom for an unmatched name, regeneration left exactly one active (old archived), auth 401 unauthenticated, `check_once_per_days` returns allow with no prior use.
  - **Note:** constraint adherence (days/week, equipment, injuries) is prompt-enforced, not yet verified across 3 real profiles on device.
- **Phase 6 — Physique Analysis & Check-ins — PARTIAL (essentials done early, `feat/ai-programs`; commit `5975971`).** Pulled forward to make Phase-5 generation **physique-driven**.
  - **`0010_physique` applied** to the live DB: `progress_photos` (owner RLS, 4 policies, `pose` check) + private `progress-photos` bucket with 4 owner storage policies. Repo head = `0010_physique`.
  - **Backend:** `schemas.py` `PhysiqueAnalysis` + `AnalyzePhysiqueRequest`; `services/prompts.py` `PHYSIQUE_SYSTEM_INSTRUCTION` (`physique-v1`); `gemini.analyze_physique_images` (multi-image structured output on the shared retry/fallback path); `supabase_admin.download_progress_photo` (generic bucket download via `_download`); `routers/ai.py` **`POST /ai/analyze-physique`** (auth → 7-day window quota → fetch photos → Gemini → log; refusal → **422 without consuming quota**). `PHYSIQUE_BUCKET` + `progress-photos` wired.
  - **Physique → program loop:** `program_context.build_program_context` now adds a `physique` block (summary/strong/focus/recommendations) and `latest_physique_summary()`; `PROGRAM_SYSTEM_INSTRUCTION` prioritizes `physique.focus_areas`; `gemini.generate_program` passes the user's typed request as "honor unless it conflicts with hard constraints".
  - **Frontend:** `features/progress/` (types, api incl. `createSignedUrl`, photo upload to `progress-photos`, hooks); Progress tab is now real (check-in grid, latest-analysis card, empty state); **S22-lite** `app/progress/checkin.tsx` (camera/gallery + pose + privacy caption); **S24** `app/progress/analysis.tsx` (summary, strong/focus chips, posture, recommendations, Analyze → 422/429 states, "Forge a program from this"); routes added to root stack.
  - **Forge button (was missing):** Train tab now has a primary **"Forge a program"** button → `/program/generate`. Forge screen shows a "From your physique check-in" card and **prefills the focus field** with the latest analysis focus areas (editable).
  - **Verified:** `pytest` **55/55** (+`test_physique.py`) · vitest 64/64 · `tsc` clean · `expo lint` clean · web export OK · live: `/ai/analyze-physique` present + auth 401 unauth; live DB check confirmed `progress_photos` analysis `focus_areas` flow into program context (`latest_physique_summary`) then cleaned up.
  - **Still TODO for full Phase 6:** photo **compare slider (S23)**, 4-week check-in **reminder** notification, progress **grid by month**, `progress_photos` RLS/storage **cross-user test**, real **physique Gemini call on device** (not yet run live), and Phase-6 "Done when" checklist.
- **Open issue (unresolved):** Metro **"Unable to resolve ./photo"** from `features/progress/hooks.ts` when bundling for Android (reported Session 29). File exists on disk + committed; `@/lib/id` resolves. **Not re-verified Session 30** (the app was running from a bundle that already contained the progress feature, so resolution appears fine at runtime). If it recurs: `npx expo start -c`. Nothing in Phase 5/6 blocks on it (all gates green).
- **Phase 6 code status (Session 30):** essentials built early (Session 29) + polish this session. **All code gates green** (pytest 57/57 · vitest 64/64 · tsc/lint clean). Still open for full Phase 6: compare slider (S23), 4-week check-in reminder, progress grid by month, and the manual device + storage RLS checks in the PHASE-6 "Done when" list. See Session 30 log.
- **Docs:** `README.md` (run backend/frontend/test-on-phone + manual emulator boot), `frontend/ANDROID-EMULATOR.md` (device/emulator setup).

---

## Session log

### 2026-09-30 · Session 30 — UI polish, routine delete, quota toggle, program-delete diagnostics

- **Routine delete (Train page):** added a small trash affordance to `RoutineCard` (`features/train/components.tsx`, optional `onDelete` prop, 44px target) wired on the Train tab with a confirm `Alert`. Deletes via the existing `useDeleteRoutine`. **History preserved** — `workouts.routine_id` is `ON DELETE SET NULL`, so past workouts/sets stay; confirm copy says so.
- **Forge button + banner:** removed the raised floating Train tab; `TabBar.tsx` now renders Train as a normal tab (icon + label, ember tint on focus). Removed the **"Active AI program" banner** from Train and Today (deleted the now-unused `ProgramBanner` + styles). Applied program now shows on the **Forge page** as a new `ActiveProgramCard` (name, days/week, tap → review).
- **Quota toggle (dev):** new `QUOTA_ENABLED` (default `true`) on the backend; `false` disables all three AI quotas (food/program/physique) — `quotas.py` short-circuits with an `UNLIMITED` sentinel; counters still record. Frontend mirror `EXPO_PUBLIC_AI_QUOTA_ENABLED` (via `AI_QUOTA_ENABLED` in `features/nutrition/ai.ts`) hides the food-scan meter and the program forge gate. `.env.example` (both) documented; `backend/.env` set `QUOTA_ENABLED=false`, `frontend/.env` set `EXPO_PUBLIC_AI_QUOTA_ENABLED=false` (both gitignored). Tests +2 → **pytest 57/57**.
- **`/ai/program/active` 404 diagnosis:** the route is registered in OpenAPI and an authenticated call with a real user token returned **200**; the 404 body is the expected `{"error":"no_active_program"}` (no active program row), which the app maps to `null` (no banner). Verified by minting a session via the Supabase admin API and calling the live endpoint; DB inspected (0 programs at the time), generated + materialized a smoke program via the real pipeline (4 routines, 13 customs), then cleaned it up. Conclusion: backend + route are fine; a visible POST failure was most likely the long-running uvicorn serving stale code (restart required) or a stale Metro bundle.
- **Env caveat:** Expo inlines `EXPO_PUBLIC_*` at Metro startup and caches it — adding/changing a var requires **`npx expo start -c`**. Confirmed the running bundle's HMR env block was missing the new var. Backend `.env` changes need a uvicorn restart.
- **Docs:** PHASE-6 + PLAN updated for status; MEM current-state refreshed.
- **Next:** restart dev servers (`npx expo start -c` + uvicorn) so the new env vars take effect; then the Phase-6 manual device pass (check-in → analyze → forge focus prefill) and the remaining Phase-6 items (compare slider S23, 4-week reminder, month grid, cross-user storage RLS test).

---

### 2026-09-29 · Session 29 — Physique-driven generation + Train forge button (Phase 6 pulled forward)

- **Trigger:** user asked for generation based on **physique photos (current condition) + a specific request**, and a visible **Forge button** ("can't test shit").
- **Added the Forge entry point** (Train tab): primary **"Forge a program"** button above "Start empty workout" → `/program/generate`.
- **Built the physique essentials early (Phase 6 core):** `0010_physique` **applied** (`progress_photos` owner RLS + private `progress-photos` bucket with 4 owner storage policies); `PhysiqueAnalysis`/`AnalyzePhysiqueRequest` schemas; `PHYSIQUE_SYSTEM_INSTRUCTION` (`physique-v1`) — no bodyfat/medical claims, lower confidence on poor photos; multi-image `gemini.analyze_physique_images`; generic `supabase_admin._download` + `download_progress_photo`; **`POST /ai/analyze-physique`** (auth → 7-day window quota → fetch → Gemini → log; refusal 422 **without** consuming quota).
- **Wired physique → program:** `program_context` adds a `physique` block + `latest_physique_summary()`; program prompt prioritizes `focus_areas`; user request passed as "honor unless it conflicts with hard constraints". Frontend: real Progress tab, check-in (camera/gallery + pose + privacy), analysis screen, forge shows the check-in summary card + **prefills focus** (editable).
- **Gates:** `pytest` **55/55** · vitest 64/64 · `tsc` clean · `expo lint` clean · web export OK · live route 401 unauth · live DB confirmed focus_areas flow into context (smoke row removed).
- **Committed `5975971`.**
- **BLOCKER for next session:** Android bundling failed with `Unable to resolve "./photo" from "src/features/progress/hooks.ts"` — file exists on disk + committed; **likely stale Metro cache**. Try `npx expo start -c` first. User paused here ("will start this later on").
- **Next:** fix the Metro resolution (cache clear), then on-device: check-in → analyze (real Gemini) → forge (focus prefilled) → review → apply → train. Then finish full Phase 6 (compare slider S23, 4-week reminder, month grid, cross-user storage test).

---

### 2026-09-28 · Session 28 — Phase 5 waves A–E: AI program generation (complete)

- **Branch `feat/ai-programs`** off `feat/steps-budget` (which carried the Phase-4 close-out docs).
- **Wave A** (`537e3b6`): `Program` model + Alembic `0009_programs` (one-active partial unique index, owner RLS, `routines.program_id` FK) **applied** (`alembic current = 0009_programs`); `services/program_context.py` (pure `summarize_context`/`estimated_1rm`/`detect_stall` mirroring `engine/strength.ts`) + `tests/test_program_context.py`. `pytest` 37/37.
- **Wave B** (`8bf1f16`): `schemas.py` program models; `gemini.generate_program` (shared retry/fallback `_invoke_models`/`_parse_model`, `analyze_food_image` refactored onto it); `services/program_materialize.py` (archive previous → insert program → materialize **week 1** routines + customs for unmatched names); `routers/ai.py` (`POST /ai/generate-program`, `GET /ai/program/active`); `core/quotas.py` windowed 7-day quota (`check_once_per_days`/`record_use`/`window_resets_at`, recorded only on success). Tests → `pytest` 50/50.
- **Wave C** (`2d7a59c`): `features/programs/` (types/api/hooks/components) + S25 `app/program/generate.tsx` (snapshot, focus field, quota meter, reduce-motion-aware forge overlay) + S26 `app/program/review.tsx` (week tabs, day cards, progression, rationale CoachNote, Regenerate/Apply, editable name). Fixed lint (`setState`-in-effect → child-key pattern; `useRef().current`/`interpolate` → `useMemo` `Animated.Value`).
- **Wave D** (`049c5f9`): `ProgramBanner` on Train + Today; AI-routine rationale on S8; Today coach-note copy refreshed.
- **Wave E (verification):** `pytest` 50/50 · `vitest` 64/64 · `tsc`/`expo lint` clean · web export OK. Live: `GET /health` ok, OpenAPI exposes `/ai/generate-program` + `/ai/program/active`; unauth → **401**; live `save_program` smoke on a real profile materialized routines+sets and **created a custom for an unmatched exercise**, regeneration left **exactly one active** (old archived), then cleaned up. Phase-5 "Done when" checked; `PLAN.md` §10 Phase 5 ✅ + status.
- **Caveat:** constraint adherence (days/week, equipment, injuries) is prompt-enforced; not yet verified across 3 real profiles on device.
- **Next:** Phase 6 — physique analysis (`0010_physique`, `progress-photos` bucket, `POST /ai/analyze-physique`, S22/S24, progress grid + compare slider).

---

### 2026-09-28 · Session 27 — Phase 4 closed (device-verified); Phase 5 wave plan

- **Phase 4 device pass confirmed by the user** ("all is working"): scan→analyze→confirm→log, 6th-scan 429, catalog/gram search, burn/eaten rings. Backend `pytest` **31/31**; frontend gates already green (`tsc`/lint/vitest 64/web export).
- **Phase 4 formally closed:** checked off `PHASE-4` "Done when"; `PLAN.md` §10 Phase 4 → ✅ and project status → Phase 4 complete. No unresolved Phase-4 code.
- **Ops notes (not code):**
  - Supabase project `trjtcfnmqufrqxhwhrtk` had **auto-paused** (free tier, ~9 days idle) → every `/auth/v1/*` route returned 502, surfacing as `{"message":"Bad Gateway"}` on Google sign-in. User restored it from the dashboard.
  - AVD `Medium_Phone_API_36.0` had a **corrupt quick-boot snapshot** (`emulator-5554 offline`); fixed by cold booting (`-no-snapshot-load`). Added a **"Boot the Android emulator manually"** section to `README.md` (incl. the `fastboot.forceColdBoot=yes` permanent fix).
- **Phase 5 planned:** added a **5-wave build order** to `phases/PHASE-5-ai-programs.md` — A schema `0009_programs` + `program_context.py`; B `POST /ai/generate-program` + materialization (+ `GET /ai/program/active`); C S25 generate + S26 review; D Train/Today integration; E verification/close. Reuses the Phase-4 AI pipeline.
- **Next:** start **Phase 5 Wave A** (`0009_programs` migration + `program_context.py`), wave-by-wave.

---

### 2026-09-27 · Session 26 — Phase 4 status audit; ready for the device pass

- Confirmed **Phase 4 is code-complete and committed** on `feat/steps-budget` (head `d36ad74`, working tree clean; migrations `0001`→`0008b`). Corrected the stale "Current state" section above (it still reported wave B/C as uncommitted and the branch as Phase 3).
- No unresolved Phase-4 code. Remaining to close the phase = the device pass + the PHASE-4 "Done when" manual checks.
- **Next:** run the device checklist (rebuild for camera → scan/confirm/log, gram search, burn ring, 6th-scan 429, `ai_calls`/`ai_usage`, storage privacy); then check off `PHASE-4`, set `PLAN.md` §10 Phase 4 ✅ + project status, and commit.

---

### 2026-09-18 · Session 25 — Phase 4 fixes round 2: per-100g catalog, default-closed add, prompt v2

- **Food amounts by gram (not bowl/plate):** new Alembic **`0008_food_per_gram`** (applied) refreshes the global INDB rows to **per-100 g** macros (`serving_description = "100 g"`); `scripts/build_foods_seed.py` now reads the per-100 g columns; all **1,014** rows verified. S17 search shows **"per 100 g"** and Quick add has an **Amount (g)** field that scales kcal/P/C/F (`foods` values remain per-100 g; no schema change).
- **Add-food page:** nothing open by default (Quick add no longer auto-expands; Scan/Search/Quick/Recent all collapsed until tapped).
- **AI prompt v2 (`food-v2`)** — the apple → "Chicken and vegetable stir-fry" misidentification prompted a stricter prompt: identify the literal single food ("apple → Apple"), never invent ingredients/dishes, lower confidence + note uncertainty instead of guessing. Validated live against an apple photo (correct: "Apple", high confidence). Prompt lives in `services/prompts.py`; user prompt in `services/gemini.py` now says "Identify the food in this photo…".
- **Model resilience:** a `GEMINI_MODEL` of `gemini-3.8-flash-lite` (does **not** exist) caused a 404 → 502. `gemini.analyze_food_image` now falls back to **`gemini-3.1-flash-lite`** on model-not-found (and logs the model actually used). Valid names documented in `.env.example`: `gemini-3.1-flash-lite` (default), `gemini-3.5-flash-lite`, `gemini-flash-lite-latest`, `gemini-3.8-flash`. New tests → pytest 24/24.
- **ROOT CAUSE of wrong food (apple → "Grilled chicken with rice"):** food photos were stored in `food-photos` with `mimetype: text/plain` (the RN `Blob` upload carried no type, and supabase-js stored `text/plain`), so `download_food_photo` forwarded `text/plain` to Gemini — it tokenized the image bytes as **text** (100k–307k prompt tokens!) and hallucinated a dish. Fix: (a) backend infers the image mime from the file extension when Storage's content-type isn't `image/*` (`supabase_admin._image_mime`, unit-tested); (b) frontend uploads an **`ArrayBuffer`** with `contentType: 'image/jpeg'` so Storage records it correctly. Re-ran the exact stored apple object → **"Apple", 95 kcal, 1,247 tokens** (was 307,432). `GEMINI_MODEL=gemini-3.5-flash-lite` works.
- **Add-food back button:** top-left back (arrow + "Back") on S17.
- **Verified:** `tsc` clean · `expo lint` clean · vitest 64/64 · pytest 27/27 · web export OK.
- **Note:** model is `gemini-3.1-flash-lite` (weakest vision tier) — if misidentification persists on device, try `GEMINI_MODEL=gemini-3.5-flash-lite` or `gemini-3.8-flash` (bad names now auto-fallback).

**Next:** device test of scan→confirm (prompt v2), gram-based search/autofill, burn ring; then close Phase 4.

---

### 2026-09-18 · Session 24 — Phase 4 fixes: model, burn/eaten rings, packaged-food search

- **502 on `/ai/analyze-food` root cause:** Gemini returned `404 ... models/gemini-2.5-flash is no longer available to new users`. Default model changed to **`gemini-3.1-flash-lite`** (configurable via `GEMINI_MODEL`); validated text + **vision** + structured `FoodEstimate` output live. Gemini retries bumped to 3 with backoff (free tier returns transient 503 "high demand"). Docs (`PLAN` §7, `PHASE-4`, `backend/AGENTS`, `.env.example`) updated.
- **Today ring = burnt, Nutrition ring = eaten (user request):** Today hero now shows **calories burned** (step-based `stepBonusKcal`) against a 10k-step burn goal (`stepKcalBonus(10000, weight)`), with a `steps · goal` caption; the old "remaining" hero is gone. Nutrition card relabelled **"Calories eaten"** (center = consumed / target).
- **Packaged/barcoded products in search:** new backend `GET /foods/search` (auth, no quota) merges local `foods` (INDB + customs) with **Open Food Facts** packaged products (Search-a-licious index + v2 product detail for nutrition; ODbL attribution in `services/openfoodfacts.py`; degrades gracefully if OFF is down). New `routers/foods.py`, `FoodSearchResult` schema, `tests/test_foods_search.py`. S17 search now calls FastAPI (`foods-api.ts`), shows the **kcal** unit, and discovers packaged items (e.g. "lays", "sting").
  - Caveat: OFF has gaps for Indian packaged goods — e.g. many "Lays" SKUs return with 0 kcal (no nutrition recorded); the row still appears and is editable. Curating/seeding a packaged subset is a Phase-4 follow-up if needed.
- **Verified:** `tsc` clean · `expo lint` clean · vitest 64/64 · pytest **22/22** · web export OK. Live OFF + Gemini calls spot-checked from the backend.

**Next:** device test (rebuild for camera) — scan→analyze (now on flash-lite), food search incl. packaged, burn ring; then close Phase 4.

---

### 2026-09-17 · Session 23 — Phase 4 kickoff: wave A (AI infrastructure)

- **Kickoff decisions (user):** food catalog source = **Anuvaad INDB**; scan input = **camera + gallery** (`expo-camera` + `expo-image-picker`); build order = **backend first**.
- **Revision naming fixed:** added the food-catalog plan to `PHASE-4` (new `foods` table, `0007_food_catalog`) and renumbered future revisions to avoid the `0005_meal_slot` collision → `0006_ai`, `0007_food_catalog`, `0008_programs`, `0009_physique`.
- **Wave A (backend AI infra), applied + tested:**
  - `0006_ai` migration: `ai_usage`, `ai_calls` (RLS: `ai_usage` owner-select only; `ai_calls` no policies = service-role only), `increment_ai_usage(uuid, text, int) returns boolean` (SECURITY DEFINER, atomic upsert+increment), private `food-photos` bucket + 4 owner-scoped storage policies. **Applied to the live DB**; verified tables/RLS/function (`prosecdef=true`)/bucket/policies; quota function exercised in a rolled-back txn (allow→deny at limit 1).
  - `core/config.py` gained `SUPABASE_SERVICE_ROLE_KEY`, `GEMINI_API_KEY`, `GEMINI_MODEL`, quotas (all optional/defaulted so tests boot without secrets).
  - `schemas.py` (`FoodEstimate`, `AnalyzeFoodRequest`), `services/prompts.py` (versioned), `services/gemini.py` (structured output, lazy SDK import, retry-once, `GeminiRefusal`/`GeminiParseError`), `services/supabase_admin.py` (service-role photo download), `services/ai_log.py` (best-effort `ai_calls`), `routers/ai.py` (`POST /ai/analyze-food`: auth → path-ownership → quota → storage → Gemini → log → respond; 403/429/422/502 mapping).
  - `requirements.txt` + installed `google-genai`. `pytest` **14/14** (6 new; all AI dependencies mocked).
- **Live keys added:** `SUPABASE_SERVICE_ROLE_KEY` + `GEMINI_API_KEY` are now in `backend/.env` (presence verified; never printed). Wave A committed (`0fb3803`, docs `9431d3f`) and pushed.
- **Wave B (scan→confirm) committed `d5f9949` (+ docs `4c1a1f3`), pushed:** installed `expo-camera`, `expo-image-picker`, `expo-image-manipulator` (+ `app.json` permission plugins/`CAMERA`); `features/nutrition/ai.ts` (`analyzeFoodPhoto`, `fetchFoodScansToday`, `FOOD_SCAN_LIMIT`) and `photo.ts` (resize ≤1600px → upload `food-photos/{uid}/{uuid}.jpg`); S18 `app/meal/scan` (camera + gallery, permission-denied fallback, busy overlay, 403/422/429/502 messages); S19 `app/meal/confirm` (editable name/serving/macros, `ConfidenceChip`, mandatory disclaimer, quota meter, slot, Retake/Log → `source=photo`, `photo_path`, `ai_raw`); S17 "Scan food" enabled; shared `MacroEdit`/`ConfidenceChip`; `ApiError` now carries `detail`.
- **Wave C (food catalog), done/uncommitted:** `0007_food_catalog` **applied** — `foods` table (global/custom; RLS: globals readable by authed users, customs owner-only; partial unique indexes) seeded with **1,014 Anuvaad INDB recipes** (`scripts/build_foods_seed.py` → `app/data/foods_seed.json`, per-serving macros, source=`indb`). S17 **Search foods** autofills Quick add via `features/nutrition/foods-api.ts` + `useFoodSearch`. `pytest` 17/17 · `tsc`/lint clean · vitest 64/64 · web export OK.
- **Verified:** `tsc` clean · `expo lint` clean · vitest 64/64 · pytest 17/17 · web export OK. **Native rebuild required** for the camera/picker modules.
  - **Session 24 fixes:** AI model → `gemini-3.1-flash-lite` (2.5-flash retired); Today ring = **burnt** (steps) / Nutrition ring = **eaten**; food search now proxied via FastAPI and includes **Open Food Facts packaged products**.
  - **Next:** device test of scan→analyze→confirm→log + food search (incl. packaged) + burn ring; then close Phase 4.

---

### 2026-09-17 · Session 22c — Phase 3 CLOSED (device-verified) + committed

- User confirmed the Phase-3 device pass: steps + target rise, backfill, permission-denial/manual entry, meal add/edit/delete, weight row + trend arrow, idempotent `daily_activity`.
- Checked off `PHASE-3` "Done when"; `PLAN.md` §10 Phase 3 → ✅ and project status → Phase 3 complete.
- Committed waves C–E + the UX fixes (backend `0005_meal_slot`, frontend dashboard/diary/steps/weight, splash lockup) and pushed `feat/steps-budget`.
- **Next:** Phase 4 — user trials meal logging (AI + free Indian food datasets); build `0006_ai` + `0007_food_catalog`.

---

### 2026-09-17 · Session 22b — Phase 3 UX fixes + steps history page

- **Today:** removed the "Verify FastAPI (Phase 0 proof)" button (and its state/imports). Steps tile is **read-only** — tapping now opens the new **steps history page** (`/steps`) instead of the manual-entry modal. The manual-entry modal remains reachable only from the `ConnectStepsBanner` degradation path (HC denied/unavailable).
- **Ring overflow fix:** `RingProgress`'s centre overlay is now inset by the stroke width and constrained; the Today value font dropped from `display` (44) to 34 so `2,140` can't spill past the ring.
- **Nutrition diary:** one consistent daily goal across the date strip — the base target (adaptive TDEE + confirmed offset); step bonuses are a Today-ring concern only, so the number no longer jumps between days.
- **New S-steps page (`app/steps.tsx`, guarded route):** today total + kcal bonus, 7-day average, best day, a 14-day `BarChart` (gifted-charts), and a 30-day history list. Auto-syncs on focus with a 30-day backfill (`useSyncSteps`/`useAutoSyncSteps` now take a `days` arg).
- **FAB:** nutrition add button is now **absolute bottom-right** (safe-area aware, above the floating dock); diary bottom scroll padding trimmed to clear it.
- **Splash (`app/index.tsx`):** removed the background glow; the spark now ignites at centre, then slides to the **left of VULCAN** (slide distance measured via `onLayout` so it lands as the compact lockup on any font/device). Reduce-motion shows the final lockup immediately.
- **Verified:** `tsc` clean · `expo lint` clean · vitest 64/64 · web export OK.
- **Research (Phase 4, not built):** open Indian food datasets identified — **Anuvaad INDB** (1,014 recipes + 1,095 raw items, per-100g & per-serving, open-access, GitHub `lindsayjaacks/Indian-Nutrient-Databank-INDB-`); `prabhubng/indian-nutrition-data` (620+ foods); Kaggle "Indian Food Nutritional Values 2025" (250+/1,014 dishes from INDB); and **Open Food Facts** for **packaged/barcoded** items (ODbL open data, REST API `world.openfoodfacts.org/api/v2/product/{barcode}.json`, India subset via `countries_tags`, nightly dumps/parquet). See open questions.
- **Phase docs:** added the food-catalog plan to `PHASE-4` (new `foods` reference table, source TBD at kickoff) and renumbered future revisions to avoid the `0005_meal_slot` collision: `0006_ai`, `0007_food_catalog`, `0008_programs`, `0009_physique`.

**Next:** native rebuild + Phase-3 device pass → commit.

---

### 2026-09-17 · Session 22 — Phase 3 waves C–E: Today dashboard + nutrition + weight trend

- **Schema (user-approved):** new Alembic **`0005_meal_slot`** adds `meals.meal_slot` (breakfast/lunch/dinner/snacks, default `snacks`, CHECK). Made idempotent because `0004` creates `meals` from live SQLModel metadata. **Applied to the live DB** and verified (`meal_slot` non-null, `meals_meal_slot_check`, RLS on, `alembic_version = 0005_meal_slot`). `models.py` + `PLAN.md` §6 updated.
- **Shared UI:** `RingProgress` (SVG gradient ring), `MacroBar`/`MacroLegend`, `StatTile`, `CoachNote`; new icons `Plate/Trash/Camera/Pencil`.
- **Engine:** `computeTargets` accepts an optional `tdeeOverride` (adaptive maintenance; goal delta/caps/floors still apply). New tests: adaptive override, invalid override fallback, pace cap off the adaptive maintenance. Vitest 64/64.
- **Wave C — Today S6 (`(tabs)/today`):** live calorie ring (`remaining / live target`), macro bar + legend, steps tile (7-day mini bars) with manual-entry modal fallback, weight tile + log modal, streak flame (consecutive logged days), coach-note placeholder, trend-adjust card. `ConnectStepsCard` became `ConnectStepsBanner` (permission prompt + manual fallback). Adaptive TDEE is used once ≥10 aligned weight+intake days exist (21-day window).
- **Wave D — nutrition:** `features/nutrition/{types,api,hooks,components}`; diary S16 (date strip, ring, macro bar, slot sections, delete, FAB), add-meal S17 (Quick add + Recent re-log; Scan food disabled → Phase 4), meal detail S20 (edit/delete). Optimistic create so the ring/macros update immediately. Routes `app/meal/{_layout,add,[id]}` guarded in the root stack (modal presentation).
- **Wave E — weight/trend:** `features/today/weight.ts` (`body_metrics` upsert, invalidates profile so targets recalc); `target-offset.ts` (persisted ±100 kcal the user confirms); trend card only shows when the offset is still 0.
- **Verified:** vitest 64/64 · `tsc --noEmit` clean · `expo lint` clean · web export OK · pytest 8/8 · migration applied. Not committed yet.
- **Pending (device):** native rebuild (`npx expo run:android`) then walk test, permission-denial path, meal add/edit/delete, weight row + trend arrow, and the Phase-3 "Done when" gate.

**Next:** native rebuild + Phase-3 device pass → mark Phase 3 complete, commit waves C–E.

---

### 2026-09-15 · Session 21 — steps auto-sync, GIF ratio, media backfill

- **Steps auto-sync:** `useAutoSyncSteps` (focus-aware `useFocusEffect`) syncs on entering Today and then every 60 s **while focused**; the manual "Sync steps" button was removed.
- **Permission detection fix:** `hasStepsPermission`/`requestStepsPermission`/`readDailySteps` now call `initialize()` first — previously the card queried `getGrantedPermissions()` before the SDK was initialized, so it showed "Connect steps" on every launch even when already granted.
- **Timezone fix:** steps were bucketed by **UTC** date (`toISOString()`), so just after local midnight the app showed the previous day's total as "today". Now `localDateString()` (phone-local yyyy-mm-dd) is used for step bucketing, the `daily_activity` range filter, and the "today" lookup.
- **Step double-counting fix:** `readDailySteps` now uses Health Connect's `aggregateGroupByPeriod` (DAYS/1) instead of summing raw `readRecords` — the raw sum double-counted multiple sources (phone + watch/Google Fit), inflating the 7-day average.
- **7-day average = last 7 completed days:** the card excludes today (`syncDailyActivity` now covers 8 days, today + the last 7 full days; the average is taken over the 7 days with data before today).
- **GIF ratio (S13):** the exercise hero is now a full-width **square** (`aspectRatio: 1`) with `contentFit="contain"` — the whole 1:1 GIF shows, undistorted, no crop. List thumbnails stay small 1:1 squares.
- **Media backfill (bug fix):** routines created before the catalog referenced the original seed rows; `0003_exercise_media` preserved referenced rows but 5 had names that didn't match the dataset (Cable Crossover, Incline Dumbbell Press, Overhead Triceps Extension, Pec Deck, Triceps Pushdown), so they had no media. New revision **`0004b_exercise_media_backfill`** maps them to the closest catalog GIFs — **all 1,089 globals now have media** (verified).
- **Verified:** vitest 61/61 · `tsc` clean · `expo lint` clean.

**Next:** wave C (Today dashboard S6).

---

### 2026-09-15 · Session 20 — Phase 3 waves A + B (schema/engine + Health Connect)

- **Wave A:** new Alembic `0004_activity_nutrition` — `daily_activity` (steps/target_kcal/step_bonus_kcal, unique per user+date) + `meals` (macros, `source` manual|photo, `ai_raw` jsonb). RLS owner-only (4 policies each) + indexes; applied to the live DB. Engine: `trendAdjustment(weightsKg, goal)` in `steps.ts`; `adaptiveTdee(intakeKcal, weightsKg)` in `targets.ts`. Tests 61/61.
- **Wave B:** `react-native-health-connect` (4.1.3) + its config plugin; `expo-build-properties` with `android.minSdkVersion 26`; `android.permission.health.READ_STEPS`. Added `features/today/health-connect.ts` (status/permission/read daily steps), `features/today/steps.ts` (idempotent `daily_activity` upsert with step bonus), `features/today/hooks.ts`, and `ConnectStepsCard` on Today. Connect once → `useAutoSyncSteps` syncs on focus and every 60 s **while the Today screen is focused** (no manual sync button).
- **Native:** `npx expo prebuild --clean -p android` regenerated the manifest — verified `READ_STEPS`, the rationale intent-filter + `ViewPermissionUsageActivity` alias, and `minSdkVersion=26`. `android/local.properties` recreated.
- **Verified:** vitest 61/61 · `tsc` clean · `expo lint` clean · web export OK.

**Next:** rebuild + device test step sync → Phase 3 wave C (Today dashboard S6).

---

### 2026-09-15 · Session 19 — Phase 2 closed; set-type discoverability fix

- **DB evidence (user's device pass):** 2 workouts / 14 sets synced, 6 `is_pr`, 2 warmup, 2 drop, 6 superset sets, 4 bodyweight `0 kg`, weighted sets present → airplane-sync, set types, supersets, PRs and chart data all confirmed. User confirmed kill/resume + screen-off rest notification. RPE not captured (0 rows) — accepted.
- **Set-type UX:** tapping a set number now opens the type sheet (previously long-press only); added a hint line on the active-session screen. RPE remains a per-row input.
- **Phase 2 marked ✅** in `PHASE-2` Done-when + `PLAN.md` §10; merged `feat/gym-tracker` → `master`; started `feat/steps-budget` (Phase 3).

**Next:** Phase 3 — `0004_activity_nutrition`, Health Connect steps, Today dashboard, nutrition diary, weight trend.

---

### 2026-09-12 · Session 18 — Fix: launcher icon + native splash were stale native assets

- **Root cause:** the launcher icon and the pre-JS splash on device are **compiled into `android/`** at prebuild time. The old build still had the 8-point star icon and the decorative `wordmark.png` splash. Regenerating `assets/images/*.png` alone does nothing until a prebuild runs.
- **Fix:** corrected the icon back to **Spark-only** (text belongs on the splash, not the icon); regenerated assets and ran `npx expo prebuild --clean --platform android` → `mipmap-*/ic_launcher*` and `drawable-*/splashscreen_logo.png` now hold the Spark. Recreated `android/local.properties` (prebuild --clean removed it; `ANDROID_HOME` is also set).
- **Result:** launcher icon = ember Spark on `#0B0B0D`; native splash = Spark mark (the JS splash then animates the plain `VULCAN` text from `index.tsx`). No decorative wordmark anywhere.
- **Verified:** native `splashscreen_logo.png` and `ic_launcher_foreground.webp` visually checked (Spark).

**Next:** `npx expo run:android` (uninstall first if the launcher keeps the cached old icon).

---

### 2026-09-12 · Session 17 — Phase 2 improvements round 3: filter clipping, Spark app icon

- **#7 Filter clipping:** exercise-picker muscle chips `ScrollView` now has an explicit height with vertically-centred content (no more cut-off at the bottom).
- **#8/#9 App icon:** the old icon was the elaborate 8-point star; regenerated from the simple 4-point `SparkIcon` **plus the plain `VULCAN` wordmark** (Space Grotesk bold, like `index.tsx` — not the decorative `wordmark.png`). `icon.png` (dark bg + glow + text), `android-icon-foreground.png` (transparent, safe-zone), `splash-icon.png` (mark only), `favicon.png` (mark only). Added `frontend/scripts/generate-icons.mjs` + `npm run icons`; dev dep `@resvg/resvg-js` (sharp removed). `app.json` already points at these files.
- **Verified:** regenerated icons visually checked · `tsc` clean · `expo lint` clean · vitest 53/53.
- Note: `assets/images/wordmark.png` is unused by the app (kept for reference).

**Next:** native rebuild (`npx expo run:android`) to see the new launcher icon + reorder lib, then the Phase-2 device pass.

---

### 2026-09-12 · Session 16 — Phase 2 improvements round 2: remove set, bodyweight handling, resume session

- **#4 Add/remove set:** active-session exercise cards now show a **Remove set** button next to **Add set** (removes the last set; per-set long-press still deletes a specific one).
- **#5 Bodyweight exercises:** when `exercise.equipment === 'bodyweight'` the kg input is replaced by a **BW** chip; new sets default weight `'0'`; `buildWorkoutResult` forces `weight_kg = 0` for bodyweight (so nothing is dropped) and PR/volume are reps-based.
- **#6 Resume session:** new `useActiveSession()` (hydration-aware) + **`ActiveSessionBanner`** on **Today** and **Train** ("Resume workout · name · n/m sets") that re-enters `/workout/active`, which already resumes the persisted session. No more forced new session.
- **Verification:** `tsc` clean · `expo lint` clean · vitest 53/53 · web export OK.

**Next:** native rebuild + Phase-2 device pass.

---

### 2026-09-12 · Session 15 — Phase 2 improvements: horizontal filters, drag reorder, exercise media catalog

- **#1 Filter scroll:** exercise picker muscle chips now in a horizontal `ScrollView`.
- **#2 Drag reorder:** installed `react-native-reorderable-list`; builder uses a `ReorderableList` with a grip handle (long-press to drag); ▲▼ kept as fallback; `GestureHandlerRootView` added at the app root; builder store gained `reorder(from, to)`.
- **#3 Exercise media + expanded catalog:** new Alembic **`0003_exercise_media`** adds `exercises.media_url` and expands the global library to **1,084 gym exercises** with tutorial GIFs from the MIT `mohamedatef90/exercise-library` (MIT, derived from ExerciseDB). Seed generated to `backend/app/data/exercises_seed.json`; the revision drops unreferenced old seed rows, updates referenced ones, inserts the rest. **Applied to the live DB** (1,089 globals; 1,084 with media).
  - App: `Exercise.mediaUrl` flows through the API; `ExerciseThumb` (expo-image) shows thumbnails in S12 picker, S8 routine detail, S15 past workout, S10 active session, plus a hero GIF on S13.
  - Phase docs renumbered: `0004_activity_nutrition`, `0005_ai`, `0006_programs`, `0007_physique`.
- **Verification:** `tsc` clean · `expo lint` clean · vitest 53/53 · pytest 8/8 · web export OK · GIF CDN returns `image/gif`.

**Next:** native rebuild (`npx expo run:android`) — reorder lib + expo-image usage — then the Phase-2 device pass. Thumbnails hotlink `raw.githubusercontent.com` (fine for beta; self-host/bundle before production).

---

### 2026-09-12 · Session 14 — Phase 2 wave E: history, past workout + Repeat, exercise detail + charts

- **Dep added (JS):** `react-native-gifted-charts` (uses the existing `react-native-svg`).
- **S14 History** (`app/history.tsx`): month-grouped workout history with duration/exercise count, volume, sets or PR count; tap → past workout.
- **S15 Past workout** (`app/workout/[id].tsx`): read-only stats + per-exercise set groups; tapping an exercise opens its detail; **Repeat as new workout** rebuilds a prefilled session (`sessionExercisesFromHistory`) and starts it.
- **S13 Exercise detail** (`app/exercise/[id].tsx`): e1RM/Volume toggle with `LineChart`/`BarChart`, PR history, all-time top sets.
- **S7 Train home** history preview now lists the 5 most recent workouts with a "See all" link.
- **API** (`features/train/api.ts`): `fetchWorkoutHistory`, `fetchWorkoutDetail`, `fetchExerciseStats`; new hooks + sync invalidations. Root layout guards `history` + `exercise`.
- **Verification:** vitest 53/53 · `tsc --noEmit` clean · `expo lint` clean · web bundle (incl. gifted-charts) OK. Device test pending.

**Next:** native rebuild + full device pass against the Phase-2 "Done when" list (airplane-mode sync, kill/resume, rest notification with screen off, supersets/dropsets/warmup/RPE render, charts from real data) → then Phase 2 complete.

---

### 2026-09-12 · Session 13 — Phase 2 wave D: finish/summary + PR detection + offline sync queue

- **Dep added (native):** `@react-native-community/netinfo` (reconnect detection).
- **Pure result builder** (`features/train/workout-result.ts` + tests): turns the local session into a persistable workout — drops unfinished/invalid sets, computes working volume (warmups excluded), and flags PRs via `detectPR` against prior DB history (first-ever set = PR; equal ≠ PR). Client-generated UUIDs for workout + set ids.
- **Offline queue** (`features/train/sync.ts`): AsyncStorage-backed ordered op queue (`workout`, `notes`). Upserts `workouts` + `workout_sets` idempotently on `id`; flushes on mount and on NetInfo reconnect (`useSyncManager` in the root layout); stops at the first failure so nothing is lost.
- **Finish flow** (`app/workout/active.tsx`): fetches exercise history (graceful if offline), builds the result, enqueues + flushes, stores the result, navigates to summary. Offline banner added (NetInfo).
- **S11 summary** (`app/workout/summary.tsx`): ember burst (reduce-motion aware), duration/volume/sets tiles, PR list, notes field (queued as a notes op on Done).
- **Verification:** vitest 53/53 (added workout-result tests) · `tsc --noEmit` clean · `expo lint` clean. On-device offline test pending (needs native rebuild).

**Next:** native rebuild + device test (airplane-mode session → reconnect → rows appear) → wave E (S14 history, S15 past workout + Repeat, S13 exercise detail + charts).

---

### 2026-09-12 · Session 12 — Phase 2 wave C: S10 active session, rest timer, local persistence

- **Deps added (native — rebuild required):** `@react-native-async-storage/async-storage`, `expo-notifications` (+ config plugin), `expo-keep-awake`, `expo-haptics`.
- **Session store** (`features/train/session-store.ts`): Zustand + `persist` (AsyncStorage). Client-UUID `workoutId`, routine name, `startedAt`, per-exercise rest/superset, sets (kg/reps/RPE/type/completed). Every keystroke persists.
- **S10** (`app/workout/active.tsx`): elapsed timer; Discard/Finish confirms; exercise cards with prev-performance ghost (`fetchLastPerformance`), complete-toggle with ignite tint + haptic; long-press a set for type (warmup/normal/drop/failure) or delete; add/remove set & exercise; Add exercise → picker (`?target=session`).
- **Rest timer** (`use-rest-timer.ts` + `RestTimerBar`): auto-start on set completion using the exercise's `rest_seconds` (default 120s), ring countdown, +30s, skip, local notification on finish, `useKeepAwake` during the session.
- **Summary scaffold** (`app/workout/summary.tsx`): duration/volume/sets from params — PR detection, notes and ember burst land in wave D.
- **Deviations:** swipe gesture → long-press sheet (set type/delete); routine drag-reorder → up/down buttons.
- **Verification:** `tsc --noEmit` clean · `expo lint` clean · vitest 49/49 · web bundle OK. **On-device test + native rebuild pending.**

**Next:** native rebuild (`npx expo run:android`) + device test → wave D (finish/summary with PR flags + notes + offline mutation queue sync).

---

### 2026-09-12 · Session 11 — Phase 2 wave B: routines, routine builder, exercise picker

- **Train data layer** (`frontend/src/features/train/`): `types.ts` (Exercise/Routine/RoutineExercise + muscle/equipment labels + picker filters), `api.ts` (supabase queries: exercises, custom exercise, routines with nested `routine_exercises.exercises`, save/delete), `hooks.ts` (TanStack Query), `builder-store.ts` (Zustand draft + `toDraft` parser assigning superset groups).
- **S7 Train home** (`app/(tabs)/train.tsx`): routines list, New routine, Start empty workout (→ `/workout/active` stub). History section is a placeholder until sessions exist (wave D/E).
- **S8 Routine detail** (`app/routine/[id].tsx`): muscle chips, exercise list with targets, Edit, Start workout.
- **S9 Routine builder** (`app/routine/builder.tsx`): create/edit, name, per-exercise Sets/Reps/RPE/Rest, superset toggle, up/down reorder, add exercise, delete. (Drag-reorder replaced with up/down for reliability; revisit if wanted.)
- **S12 Exercise picker** (`app/exercise-picker.tsx`): search, muscle filter chips, multi-select, **create custom exercise** sheet (name + muscle + equipment), Done.
- **Routes:** added `routine/_layout`, `workout/_layout`, `exercise-picker`, `workout/active` (scaffold); root `_layout` guards them under `isAuthed && onboarded`.
- **Verification:** `tsc --noEmit` clean · `expo lint` clean · vitest 49/49 · `expo export --platform web` succeeds (typed routes regenerated). Device/runtime test pending.

**Next:** commit wave B → wave C (S10 active session + rest timer + per-keystroke persistence).

---

### 2026-09-12 · Session 10 — Phase 2 kickoff: Phase 1 merged to master; wave A (training schema + strength engine)

- Merged `feat/onboarding` → `master` (fast-forward) and pushed `master` + new `feat/gym-tracker` to `origin` (`github.com/ashis05/Vulcan`).
- Phase 2 decisions locked: local-first + client-UUID + mutation queue · ~60 lifts seeded **plus user-created custom exercises** · `gifted-charts` · native rebuild OK · wave order A→E.
- **Wave A done:**
  - `0002_training` (`backend/alembic/versions/0002_training.py` + SQLModel tables): `exercises` (71 seeded global lifts across 10 muscle groups), `routines` (`source`, reserved `program_id` for Phase 5), `routine_exercises`, `workouts`, `workout_sets`. Owner RLS (4 policies each); global exercises readable only by authenticated users; partial unique indexes on exercise names; required indexes. **Applied to the live DB.**
  - `frontend/src/engine/strength.ts`: Epley e1RM (single rep = weight), `detectPR` (weight / reps-at-weight / e1rm; first-ever set = PR; equal ≠ PR), `totalVolume` (excludes warmups), `detectStall`. Vitest added.
- **Verification:** vitest 49/49 · `tsc --noEmit` clean · `expo lint` clean · pytest 8/8 · DB: `0002_training` head, 71 seed rows, RLS on all 5 tables, anon REST reads `[]`.
- Corrected an RLS gap before finalising: global-exercise read now requires `auth.uid() is not null` (was readable by anon).

**Next:** commit wave A → wave B (Train home S7, exercise picker S12, routine CRUD S8/S9).

---

### 2026-09-12 · Session 9 — Phase 1 engine caps + Katch-McArdle; migration stack switched to Alembic + SQLModel

- **Supabase project had been paused** (`/auth/v1/health` → 502; `db` host briefly NXDOMAIN). User restored it → health 200. Confirmed `profiles`/`body_metrics` did **not** exist (PGRST205) → `0001` migration was never applied.
- **Engine accuracy (Phase 1):** `tdee.ts` gained `bmrKatchMcArdle` + `leanMassKg`. `targets.ts` stays pace-based but now (a) caps pace to bodyweight (cut/recomp ≤1% BW/wk, bulk ≤0.5% BW/wk), (b) caps the pace delta at ±25% of TDEE, (c) uses Katch-McArdle when `bodyfatPct` is supplied. `Targets` gained `effectivePaceKgWk`. Tests 25→**36 passing**. Adaptive TDEE documented as the Phase-3 upgrade (PLAN §8 + PHASE-3 notes).
- **Migration stack switched to Alembic + SQLModel** (user decision — supersedes the earlier "raw SQL only" rule): added `app/models.py` (profiles, body_metrics = schema source of truth), `app/db.py` (engine + psycopg3 URL normalization), `backend/alembic/` (`alembic.ini`, `env.py`, `script.py.mako`, `versions/0001_profiles.py`). Revision creates tables from SQLModel metadata, then applies raw SQL for the `auth.users` FK, RLS policies, and the `handle_new_user` trigger. Added `sqlmodel`, `alembic`, `psycopg[binary]`; added `DATABASE_URL` to config + `.env.example`. Removed `backend/migrations/`.
- **Docs synced:** root `AGENTS.md` §4, `backend/AGENTS.md` layout, `PLAN.md` §5/§6/§8/§11, every phase `DB changes` header, PHASE-3 adaptive-TDEE note.
- **Pace slider fix:** `PaceSlider` jittered back and forth because `locationX` switches reference frame between the track and the thumb as the finger moves. Now uses absolute `pageX` against a `measureInWindow`-tracked offset, refuses responder termination (it lives inside a `ScrollView`), and marks decorative layers `pointerEvents="none"`.
- **Onboarding completion fix:** `onContinue` now `setQueryData`s the saved profile and navigation is a `useEffect` keyed on `onboardingCompleted` — the old inline `router.replace('/today')` raced the `(tabs)` guard (still false) and was dropped, so finishing the wizard didn't reach home.
- **Auth/cache fix:** `RootNavigator` removes the previous account's `['profile', id]` query when the auth user changes (sign-out or account switch), so a new account starts fresh instead of inheriting stale onboarding state.
- **Verification:** vitest 36/36 · `tsc --noEmit` clean · `expo lint` clean · pytest 8/8 · `alembic upgrade head --sql` (offline) renders the correct tables/FK/RLS/trigger.
- **Migration applied:** `DATABASE_URL` (Session pooler) added to `backend/.env` → `alembic upgrade head` succeeded; `alembic current` = `0001_profiles (head)`; `profiles` + `body_metrics` live.
- **RLS verified at runtime (rolled-back simulation, no rows persisted):** user A sees 1 profile, user B sees 1, unknown user sees 0; `rowsecurity = true` on both tables; 6 owner policies + `on_auth_user_created` trigger + `handle_new_user` fn + `profiles_id_fkey` confirmed; anon REST read → `200 []`.

**Next:** run the Phase-1 "Done when" gate on device (fresh account → wizard → Reveal targets; profile + first weight row persisted; edit profile recalculates) → commit.

---

### 2026-08-30 · Session 8 — Phase 0 closed: email routes deleted, deep-link diagnostics, committed + merged to master

- **Verify FastAPI now works on device:** Today tab "Verify FastAPI" shows the server-verified `user_id` (ES256 fix holds). ✅
- **Email auth routes deleted:** `(auth)/login.tsx`, `(auth)/signup.tsx`, `(auth)/forgot-password.tsx` removed — welcome is Google-only; routes were unreachable and only cross-referenced each other. `tsc --noEmit` + `expo lint` clean after.
- **Deep-link fallback diagnostics:** added `console.log('[oauth] authSession result: … | deep-link fallback: captured/none')` in `src/lib/oauth.ts` so the `cancel`-but-worked path is observable in Metro logs. JS-only change (no rebuild).
- **Docs updated:** PHASE-0 "Done when" checked off (email item reworded to "Google session persists across restarts"); `PLAN.md` project status → ✅ Phase 0 complete, §10 table Phase 0 ✅.
- **Committed `feat/auth` and merged into `master`** (repo default branch; no `main`). Phase 0 is closed.

**Verification:** pytest 8/8 · `tsc --noEmit` clean · `expo lint` clean.

**Next:** branch `feat/onboarding` → Phase 1 (onboarding wizard + personalization engine `frontend/src/engine/` + `backend/migrations/0001_profiles.sql`).

---

### 2026-08-28 · Session 7 — Google sign-in end-to-end, floating dock, session close

**Google sign-in now works end-to-end** (verified via device network logs + backend acceptance):
- Network log proved the chain: Google `code=4/…` → Supabase callback → `vulcan:?code=…` back to app. `status: cancelled` on `vulcan:` is **normal** (browser tab closes to hand the deep link to the app).
- **Backend bug fixed (401 on valid token):** Supabase signs access tokens with **ES256 (EC P-256)** — confirmed from live JWKS (`kid=c38a2514… kty=EC alg=ES256 crv=P-256`). `backend/app/core/auth.py` only handled RS256/RSA. Fixed: `_key_for_kid` branches on `kty == "EC"` → `ECAlgorithm.from_jwk`; decode now accepts `["ES256","RS256"]`. Added regression test `test_es256_token_accepted` → **8/8 pytest pass**.
- **OAuth deep-link fallback:** on Android dev builds `openAuthSessionAsync` often returns `cancel` even when the deep link fires. `src/lib/oauth.ts` now also listens via `Linking.addEventListener('url', …)`; whichever wins, extract `code` → `exchangeCodeForSession`. Added `try/catch` + `console.log('[oauth] authorize URL:', …)` for diagnostics; `welcome.tsx` onGoogle has `try/finally` so the button can't stick.

**UI changes:**
- **Removed email sign-in:** welcome screen is Google-only now. `login`/`signup`/`forgot-password` route files still exist but are unreachable from UI (candidate for deletion).
- **Real Google logo:** welcome button uses the multicolor `GoogleIcon` (was white "G" badge).
- **App logo = splash logo:** confirmed `icon.png` / `android-icon-foreground.png` / `splash-icon.png` are byte-identical ember/spark marks; app.json references all correctly.
- **Floating dock tab bar:** `TabBar.tsx` is now a rounded floating pill (16px margins, safe-area bottom, elevated + shadow). Train tab uses a new `DumbbellIcon` (lucide-style), raised center button, sized 56→**64px** with 28px icon.

**Verification:** `tsc` clean · `expo lint` clean · `expo export` (android) clean.

**Still pending (next session):**
- Full device re-test after the backend ES256 fix: "Verify FastAPI" on Today tab should show `user_id` (was 401).
- Confirm the Google sign-in deep-link fallback completes on device.
- Consider deleting the now-unreachable email auth routes.
- Complete the Phase 0 "Done when" checklist; commit `feat/auth`.

---

### 2026-08-28 · Session 6 — PKCE WebCrypto polyfill + primary Button width fix

**Reported:** "WebCrypto API is not supported. Code challenge method will default to use plain instead of sha256." warning on Google sign-in; "Continue with Google" button not full-width (email button is).

**RC6a — WebCrypto warning:** Hermes has no `crypto.subtle`, so supabase-js `generatePKCEChallenge` falls back to `plain`. Fix: installed `react-native-quick-crypto` (`npx expo install` → auto-added config plugin in app.json) and call its `install()` in `src/lib/supabase.ts` (import + `installQuickCrypto()` at module top, before `createClient`). SHA-256 code challenge now works. **Native module → requires full `npx expo run:android` rebuild, not a JS reload.**

**RC6b — Google button not full width:** primary `Button` wrapped the flame gradient in `<View style={{flex:1}}>` while the Pressable had `alignItems:'center'` → inner View shrank to content width, so the gradient pill was narrow. Secondary button rendered content directly → full width. Fix: gradient is now a direct `StyleSheet.absoluteFill` child of the Pressable (fills its `width:'100%'`); label row is a centered flex-row content sibling. Both variants now full-width.

**Verification:** `tsc` clean · `expo lint` clean · `expo export` android succeeds.

**Next:** full rebuild (`npx expo run:android`), then test Google sign-in — warning should be gone and button full-width.

---

### 2026-08-28 · Session 5 — Dropped NativeWind className; explicit StyleSheet from tokens

**Reported:** splash works but auth screens "very off" — `Welcome back.`/`Forge your physique.`/all button labels missing or exploded; buttons and login layout wrong; Google sign-in "cancelled."

**RC5a — subset of `@theme` font-size utilities fail on native:** Screenshots show `text-h2`(VULCAN), `text-caption`, `text-label` render, but `text-display`(44), `text-title`(28), `text-body`(15) don't — text is missing/exploded. Verified all classes (incl. arbitrary `h-[52px]`) exist in generated web CSS, so the Tailwind compiler is fine; the failure is the NativeWind v5 `react-native-css` runtime resolving a subset of `--text-*` utilities on native. Splash "works" only because its VULCAN size is an inline style. **Decision: determinism > class indirection.** Removed every `className` in the app and switched to explicit RN `StyleSheet` objects built from DESIGN tokens (`colors`, `fonts`, `typeScale`, `radius`, sorted in each component). Covers: `Screen`, `Button`, `TextField`, `TabBar`, splash (`index.tsx`), welcome, login, signup, forgot-password, and all 5 tab screens. `grep className=` now returns none.

**RC5b — Google "cancelled":** `openAuthSessionAsync` returns `dismiss`/`cancel` when the browser never redirects to `vulcan://` — the classic allowlist miss. `oauth.ts` cancel message now hints to add `vulcan://` under Supabase → Authentication → URL Configuration. (Requires `flowType:'pkce'` — already set last session.)

**Verification:** `tsc` clean · `expo lint` clean · `expo export` web+android succeed.

**User action:** confirm `vulcan://` is in Supabase Redirect URLs, then `npx expo run:android` and re-test.

---

### 2026-08-28 · Session 4 — Layout fix (SafeAreaView not CSS-wrapped) + Google PKCE fix

**Reported:** layout "everything stuck to the top, even input boxes"; Google sign-in "did not complete. Please try again."

**RC4a — Layout stuck to top (SafeAreaView className no-op):** Every screen wrapped content in `<SafeAreaView className="flex-1 bg-bg-base">`. But `SafeAreaView` from `react-native-safe-area-context` is **not** wrapped by the NativeWind/`react-native-css` className polyfill — only `SafeAreaProvider` is (its `components/react-native-safe-area-context.native.js` re-exports everything else raw). So `className` on `SafeAreaView` was silently ignored on native → no `flex-1`, no bg → content collapsed to the top. Fix: new `src/components/ui/Screen.tsx` = plain css-wrapped `View` (`flex-1 bg-bg-base`) + `useSafeAreaInsets` padding. Replaced `SafeAreaView` on all 10 screens (splash index, welcome, login, signup, forgot-password, today, train, nutrition, progress, profile). Expo Router already mounts `SafeAreaProvider`, so `useSafeAreaInsets` works. (Note: RN core `SafeAreaView` is deprecated; this is the RN-safe-area-context one.)

**RC4b — Google "did not complete":** supabase client defaulted to `flowType: 'implicit'`, but `oauth.ts` uses `exchangeCodeForSession(code)` which **requires PKCE** — with implicit flow no `code` comes back → error. Fix: `flowType: 'pkce'` on the client (`src/lib/supabase.ts`). This also requires the redirect URL to be in Supabase's allowlist.

**Verification:** `tsc` clean · `expo lint` clean · `expo export` web+android succeed; confirmed compiled CSS (`paddingInline`) is present in the native Hermes bundle.

**User checklist before retesting:**
- Supabase → Google provider has the **Web** client ID + Secret.
- Supabase → URL Configuration → Redirect URLs include `vulcan://`.
- Google Cloud Web OAuth client has Authorized redirect URI `https://trjtcfnmqufrqxhwhrtk.supabase.co/auth/v1/callback`.

---

### 2026-08-28 · Session 3 — Root-cause fixes: Google OAuth secret, splash routing, screen fidelity

**Reported:** Google sign-in error `{"code":400,"error_code":"validation_failed","msg":"Unsupported provider: missing OAuth secret"}`; splash screen never appears; layout "improper / not following the HTML files."

**RC1 — Google "missing OAuth secret":** This is a **dashboard** issue, not code. Supabase's Google provider needs a **Web** OAuth client's Client ID **and** Client Secret. The user created an **Android** OAuth client (Google Cloud) — Android clients have **no secret** (SHA-1 only). Fix: create a **Web application** OAuth client in Google Cloud, copy its Client ID + Client Secret into Supabase → Authentication → Providers → Google. The Android client is not used by Supabase's hosted OAuth flow.

**RC2 — Splash never shows:** `initialRouteName="splash"` was a no-op — expo-router initializes state from the URL `/`, which resolved to `(auth)/index` (welcome), so the router went straight to welcome. Fix: splash is now the root **index route** (`src/app/index.tsx` = `/`); welcome moved to `(auth)/welcome.tsx` = `/welcome`. Root Stack no longer declares a `splash` screen. Splash redirects to `/welcome` (logged out) or `/today` (logged in).

**RC3 — Layout fidelity:** Matched login/signup/welcome to the DESIGN HTML prototypes (S2/S3/S4):
- Welcome: wordmark top-third (SparkIcon + VULCAN), display H1 "Forge your physique.", caption, "Continue with Google" (white **G** badge, per HTML `g-badge`), "Continue with email", "Terms & Privacy Policy".
- Login: "Welcome back." / "The forge kept your place." / `you@forge.gg` placeholder / "New to VULCAN? Create account".
- Signup: "Forge your account." / "Steel starts with a name on the metal." / Name + Email + Password (8+ chars) fields / "Already on the forge? Log in".
- Profile sign-out target updated `/(auth)` → `/welcome`.

**Verification:** `tsc --noEmit` clean · `expo lint` clean · `expo export` web + android succeed; typed routes regenerated (`/`, `/welcome`, `/today`, etc.).

**User action still required:** Web OAuth client ID + Secret in Supabase Google provider (RC1). Then re-test Google sign-in on device.

---

### 2026-08-28 · Session 2 — Phase 0 frontend fix: Google sign-in + S1 splash + S2 welcome

**Context:** User reported the frontend was "totally wrong" and had no proper splash screen; Supabase auth already set up on the dashboard. Audited the frontend end-to-end before changing anything.

**Audit findings (no changes yet):**
- `expo export` (web + android), `tsc --noEmit`, `expo lint` all passed before edits; Supabase health 200 / anon key accepted.
- NativeWind v5 setup is correct (plain babel is intentional for v5; `withNativewind` metro wrapper + `globalClassNamePolyfill` handles runtime). Generated CSS contained every design token — styling pipeline was NOT the bug.
- Real issues found: Google sign-in was a stub (Alert only); no S1 splash route (app jumped straight from static native splash → welcome); `splash-icon.png` was byte-identical to `wordmark.png` (splash showed the wordmark, not the ember mark); welcome screen rendered the giant wordmark image instead of the S2 compact wordmark spec.

**Changes made (Phase 0 scope):**
- `src/lib/oauth.ts` (new): `signInWithGoogle()` — `signInWithOAuth({ provider:'google', skipBrowserRedirect:true })` → `WebBrowser.openAuthSessionAsync` → `exchangeCodeForSession`. Redirect pinned to `vulcan://` (`makeRedirectUri({ scheme:'vulcan', native:'vulcan://' })`).
- `src/app/(auth)/index.tsx`: welcome rewritten to DESIGN S2 — compact wordmark (SparkIcon + VULCAN text) top-third, "Forge your physique." display H1, caption, "Continue with Google" (with GoogleIcon, wired) + "Continue with email" + terms.
- `src/app/splash.tsx` (new): S1 splash — ember spark ignites (spring scale + glow), resolves into VULCAN wordmark, then routes to `/` (not authed) or `/today` (authed). Reduce-motion aware (`AccessibilityInfo`), delays skipped. No text besides wordmark per spec.
- `src/app/_layout.tsx`: splash added as unguarded `Stack.Screen`, `initialRouteName="splash"`; `(auth)`/`(tabs)` remain `Stack.Protected`.
- `src/components/icons.tsx`: `SparkIcon` gained `filled` prop (solid ember variant); added `GoogleIcon` (multicolor G).
- `src/components/ui/Button.tsx`: added `leading` ReactNode prop (content row with icon + label).
- `assets/images/splash-icon.png`: overwritten with the ember mark (copy of `icon.png`), so the native splash shows the ember mark not the wordmark. `android/` is gitignored/generated → next `expo run:android` regenerates native splash drawables.

**Verification:** `tsc --noEmit` clean · `expo lint` clean · `expo export` web + android succeed.

**User action required (Supabase dashboard):**
- Authentication → URL Configuration → Redirect URLs: add `vulcan://` and `http://localhost:8081`.
- Google provider confirmed enabled; leave Google Cloud OAuth creds as-is.
- Email "Confirm email" left ON by default (app handles it); can be disabled for instant dev logins.

**Next steps:**
- Re-run `npx expo run:android` (regenerates native splash + installs dev build) and test on device: splash animation, Google sign-in round-trip, email flow, FastAPI proof button.
- Commit `feat/auth` once the Phase 0 "Done when" checklist is verified on device.

---

### 2026-08-28 · Session 1 — Project setup → Phase 0 (auth + backend)

**Repo foundation**
- Read `PLAN.md` (8 phases, personalization engine, AI system) + `DESIGN.md` (tokens, 30 screens) + all `phases/`.
- Created `AGENTS.md` (root) + per-directory `frontend/AGENTS.md`, `backend/AGENTS.md`; `git init` + `.gitignore`.
- Merged `api/` + `supabase/` → `backend/` (migrations will live in `backend/migrations/`); renamed `mobile/` → `frontend/`. Updated `PLAN.md` §5/§6/§11 and all phase files to the new layout.
- Design system lives in `frontend/Design/` (HTML prototype S1–S30, `tokens.css`, components/shell CSS, logo + wordmark PNGs, `screen-spec-plan.md`).

**Frontend scaffold** (branch `frontend`, commit `4e61e30`)
- `create-expo-app` default template (SDK 57), stripped example content; added `@supabase/supabase-js`, `@tanstack/react-query`, `zustand`, `expo-secure-store`, `expo-auth-session`, `expo-dev-client`, `expo-linear-gradient`, `react-native-svg`.
- Upgraded to **Tailwind v4 via NativeWind v5 (pre-release)** — v4 doesn't support Tailwind v4. CSS-first `@theme` tokens in `src/global.css`, `postcss.config.mjs`, `withNativewind` metro, pinned `lightningcss@1.30.1`.
- Loaded fonts (`@expo-google-fonts/space-grotesk` + `inter`); swapped brand assets (Spark icon/adaptive/favicon, wordmark splash).
- `frontend/.env` created for manual fill (Supabase URL + anon key now filled by user; `EXPO_PUBLIC_API_URL` still needs LAN IP).

**Auth gate** (branch `feat/auth`)
- `src/lib/use-auth.ts` (session hook), `auth-errors.ts`, UI primitives (`Button`, `TextField`), custom icons from `Design/screens/shared/icons.js` paths, `VulcanTabBar` (raised Train button).
- Routes: `(auth)` welcome/login/signup/forgot-password; `(tabs)` 5 placeholder screens (Profile has Sign out). Root layout uses `Stack.Protected` guards.
- Supabase creds verified via `frontend/scripts/check-supabase.mjs` (health 200, anon key accepted).

**Backend Phase 0** (`backend/`, Python 3.12 venv in `.venv`)
- `app/core/config.py` (pydantic-settings), `app/core/auth.py` (Supabase JWKS JWT verify, cached, `aud=authenticated`), `app/routers/health.py`, `app/main.py` (CORS via `ALLOWED_ORIGINS`).
- `backend/.env` created (SUPABASE_URL filled, `ALLOWED_ORIGINS=*`), `.env.example` committed, `requirements.txt`/`requirements-dev.txt`/`pytest.ini`.
- **Verification:** `pytest` 7/7 (valid token accepted; missing/garbage/expired/wrong-audience → 401; health 200 / protected 401). Live: uvicorn boots, real JWKS reachable (1 key), `/health` 200, `/health/protected` 401. Frontend `tsc`, `expo lint`, `expo export` all green.

**Docs**
- `README.md` (run backend + frontend + phone test walkthrough). `frontend/ANDROID-EMULATOR.md` (Android Studio/AVD/device setup).

**Device/build**
- First `npx expo run:android` failed: "SDK location not found". Fixed: created `frontend/android/local.properties` (`sdk.dir=C\:\\Users\\Dell\\AppData\\Local\\Android\\Sdk`) and persisted `ANDROID_HOME` + `JAVA_HOME` (Android Studio JBR) to user env. Re-run `npx expo run:android` next.

---

## Key decisions & conventions

- **Folders:** `frontend/` (Expo app) · `backend/` (FastAPI + `migrations/`) · `phases/` · `Design/` inside `frontend/`.
- **Data flow:** CRUD app ↔ Supabase directly (supabase-js, RLS). AI app → FastAPI → Gemini only. Secrets server-side only.
- **State:** TanStack Query (server), Zustand (UI). `src/engine/` = pure functions (Phase 1+).
- **Strict phase gates:** only current phase; "Done when" checklist = exit gate; never pre-build later phases.
- **Google sign-in:** works end-to-end (PKCE + deep-link fallback + WebCrypto polyfill). Email auth removed; welcome is Google-only.
- **Email confirmation:** kept Supabase's default email-confirm flow; Resend/Google SMTP to be added later.

## Environment (no secrets)

- Supabase project: `https://trjtcfnmqufrqxhwhrtk.supabase.co`
- `frontend/.env`: `EXPO_PUBLIC_SUPABASE_URL`, `EXPO_PUBLIC_SUPABASE_ANON_KEY` (filled), `EXPO_PUBLIC_API_URL` (set to LAN IP for device testing).
- `backend/.env`: `SUPABASE_URL` (filled), `DATABASE_URL` (Supabase Session pooler URI, for Alembic), `ALLOWED_ORIGINS=*`.
- Android SDK: `C:\Users\Dell\AppData\Local\Android\Sdk`; `local.properties` written; env vars persisted.

## Phase 2 device test checklist (pending)

Rebuild first (`npx expo run:android`) — wave C–E added native modules. Backend/FastAPI not needed (training CRUD goes straight to Supabase).

1. **Exercise picker (S12):** Train → New routine → Add exercise. 71 seeded lifts; search + muscle filters; create a custom exercise.
2. **Routine builder/detail (S9/S8):** add exercises + targets, toggle a superset, reorder, Save; open it → Start workout.
3. **Active session (S10):** complete sets → ignite + haptic + rest timer; +30/Skip; long-press a set → set type/delete; add/remove sets & exercises; prev-value ghost on a repeat exercise.
4. **Kill/resume:** swipe the app away mid-session, reopen → Train → Start empty workout → the session is restored.
5. **Rest notification:** with the screen off/locked, the "Rest done" notification fires (grant notification permission on first run).
6. **Finish/summary (S11):** confirm sheet → ember burst, duration/volume/sets, PR list (first-ever set = PR), notes.
7. **Airplane-mode sync:** log a session in airplane mode → Finish works locally → turn signal back on → the workout appears in History and in Supabase `workouts`/`workout_sets` (`is_pr` set); nothing lost.
8. **History/past (S14/S15):** month grouping; tap → read-only detail; Repeat prefills a new session.
9. **Exercise detail (S13):** e1RM line / Volume bars from real data; PR history; top sets.

Caveats: drag-reorder → up/down; set-type → long-press (not swipe).

## Open questions / next steps

- [x] Session 7: Google sign-in works end-to-end (deep-link fallback + WebCrypto polyfill); **backend ES256 fix** (was rejecting valid tokens with 401 — `auth.py` now handles EC keys, 8/8 pytest); welcome is Google-only with real Google logo; app icon = splash ember mark confirmed; **floating dock tab bar + DumbbellIcon** (64px Train button).
- [x] Session 8: Verify FastAPI shows `user_id` on device ✅; deep-link fallback diagnostic log added (confirm via Metro log on next Google sign-in); email auth routes deleted; Phase 0 "Done when" closed; `feat/auth` committed + merged into `master`.
- [x] Phase 1 complete (engine + wizard + settings stub; `0001_profiles` applied, RLS verified, persistence confirmed on device). Merged to `master` and pushed to `origin`.
  - [x] Phase 2 complete: schema + engine + Train/routine/picker + S10 session/timer/persistence + S11 summary/PR/offline sync + history/past-workout/exercise-detail/charts + media catalog. Device pass confirmed; merged to `master`.
  - [ ] Phase 3 in progress (`feat/steps-budget`): waves A–E code-complete (schema/engine, Health Connect steps, Today dashboard S6, nutrition S16/S17/S20, weight trend). `0005_meal_slot` applied. **Next: native rebuild (`npx expo run:android`) + device pass on the Phase-3 "Done when" gate, then commit waves C–E and mark Phase 3 complete.**
- [ ] Phase 4 food catalog (planned in `phases/PHASE-4-ai-food.md` — `0007_food_catalog`, source TBD at kickoff): **recipes/dishes** → Anuvaad INDB (open-access, per-100g + per-serving, ~1,014 recipes) or `prabhubng/indian-nutrition-data` (620+ foods); **packaged/barcoded** → Open Food Facts (ODbL, barcode lookup + India filter). Decide bundle-a-seed vs on-demand API and confirm license/attribution before seeding.
- [ ] Backend: add `routers/ai.py` + `schemas.py` when Phase 4 starts.
- [x] Real app id set from `ashiswadhwani.in`: `android.package` + `ios.bundleIdentifier` = **`in.ashiswadhwani.vulcan`**; native project regenerated (`expo prebuild --clean -p android`), minSdk 26 + READ_STEPS/CAMERA verified.