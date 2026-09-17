# VULCAN — Master Plan

> **Forge your physique.** An AI-native, all-in-one fitness app: workout tracking, AI coaching, food photo analysis, physique analysis, and step-driven calorie budgeting — personalized to every user.

**Tagline:** *Forged by VULCAN.*
**Brand identity:** Roman god of fire and the forge. The AI is the blacksmith; the user is the steel. Visual language: near-black forge atmosphere + molten orange glow (see `DESIGN.md`).

---

## 1. How to use these docs (for any model/developer picking this up)

1. Read this file fully — it is the single source of truth.
2. Read `frontend/Design/DESIGN.md` before touching any UI.
3. Open the current phase file in `phases/` (they are numbered in build order). Each phase has a **"Done when"** checklist — a phase is complete only when every box is verifiably checked.
4. When a phase is complete, update its status in the phase table below and check off its items.
5. Make **minimal, modular** changes. Follow existing code style. Do not expand scope beyond the phase file.

**Project status:** ✅ Phase 3 complete — Health Connect steps, adaptive calorie budget, Today dashboard, nutrition diary (manual meals), weight trend. Next: `phases/PHASE-4-ai-food.md`.

---

## 2. Product pillars (all are v1 scope)

| # | Pillar | Summary |
|---|--------|---------|
| 1 | **Gym tracker** | Exercises, routines, live session logging (sets/reps/weight/RPE/supersets/dropsets), rest timer, PRs, history, 1RM + volume charts. Offline-tolerant. |
| 2 | **AI workout programs** | Gemini 2.5 Flash generates full programs from the user's profile + actual performance history; materialized as editable routines. |
| 3 | **AI food logging** | Photo → Gemini estimates calories/macros → user confirms/edits → logged against daily targets. |
| 4 | **Physique analysis** | Progress check-in photos → Gemini identifies strong/weak areas → focus areas feed into the next program. |
| 5 | **Steps & calorie budget** | Health Connect steps refine the daily calorie target; weight trend auto-adjusts cut/bulk budgets. |

Plus a **personalization engine** (deterministic, unit-tested pure functions) that computes TDEE, calorie/macro targets, progression, stall/deload detection — the data layer that makes the AI actually personal.

---

## 3. Locked decisions

| Decision | Choice |
|---|---|
| App name / brand | **VULCAN** — dark forge aesthetic, molten orange accent |
| Mobile stack | React Native + **Expo** (TypeScript, Expo Router), Android-first, iOS later |
| Build mode | **expo-dev-client** (development build — Expo Go is NOT usable; Health Connect needs native code) |
| Backend (AI proxy) | **FastAPI (Python)** — user's own backend, holds the Gemini key server-side |
| Auth / DB / Storage | **Supabase** hosted free tier: Postgres + RLS, Auth (email + Google), private Storage buckets |
| App ↔ data | App talks **directly to Supabase** (supabase-js, RLS-secured) for all CRUD; talks to **FastAPI only for AI** |
| AI model | **Gemini 2.5 Flash** via AI Studio API key, free tier + per-user quotas, upgrade to pay-as-you-go later |
| Steps | **Health Connect (Android)** via `react-native-health-connect` |
| Logging depth | Advanced: RPE, supersets/dropsets, set types, auto 1RM (Epley), PR detection, stall/deload |
| Hosting (later) | Oracle Cloud Always Free VPS (Docker). Note: Ampere ARM64 — build matching Docker image |
| Audience | Public product — therefore: no secrets in the app, quotas mandatory, disclaimers mandatory |

---

## 4. Architecture

```
┌────────────────────────────────────────────────────────┐
│  VULCAN mobile — React Native + Expo (TypeScript)      │
│  ├─ supabase-js → Auth, DB CRUD, photo uploads         │
│  │   (protected by Postgres Row-Level Security)        │
│  ├─ fetch + Bearer JWT → FastAPI (AI features only)    │
│  ├─ TanStack Query (server state) · Zustand (UI state) │
│  ├─ NativeWind (styling, tokens from DESIGN.md)        │
│  └─ react-native-health-connect (steps)                │
└───────────┬──────────────────────────┬─────────────────┘
            │                          │ Authorization: Bearer <supabase JWT>
┌───────────▼──────────────┐  ┌────────▼─────────────────┐
│  Supabase (hosted)       │  │  VULCAN API — FastAPI     │
│  ├─ Postgres + RLS       │◄─┤  ├─ Verifies Supabase JWT  │
│  ├─ Auth: email + Google │  │  │   via JWKS (PyJWT)      │
│  └─ Storage (private):   │  │  ├─ POST /ai/analyze-food │
│     food-photos          │  │  ├─ POST /ai/generate-    │
│     progress-photos      │  │  │   program               │
│                          │  │  ├─ POST /ai/analyze-     │
│                          │  │  │   physique              │
│                          │  │  ├─ Quota system (ai_usage)│
│                          │  │  ├─ Call logging (ai_calls)│
│                          │  │  └─ Gemini via google-genai│
│                          │  │     SDK (service role key) │
│                          │  └────────┬─────────────────┘
│                          │           │
│                          │  ┌────────▼────────┐
│                          │  │  Gemini 2.5 Flash│
│                          │  └─────────────────┘
└──────────────────────────┘
```

**The key design rule:** normal data flows app ↔ Supabase directly (fast, cacheable, RLS-secured). AI flows app → FastAPI → Gemini. FastAPI reads photos/queries performance data with the **service role key** (server-only secret), enforces quotas, logs every call, and writes AI results server-side.

---

## 5. Repo structure

```
VULCAN/
├─ PLAN.md                 ← this file
├─ AGENTS.md               ← agent guidelines
├─ phases/                 ← phase-by-phase build instructions
├─ frontend/               # Expo app (React Native + TypeScript, expo-router)
│  ├─ app/                 # expo-router routes
│  ├─ src/
│  │  ├─ components/       # shared UI (from DESIGN.md specs)
│  │  ├─ features/         # today, train, nutrition, progress, profile
│  │  ├─ engine/           # personalization PURE FUNCTIONS (unit-tested)
│  │  ├─ lib/              # supabase client, api client, hooks
│  │  └─ theme/            # tokens translated from DESIGN.md
│  ├─ Design/              # design system: DESIGN.md + navigable HTML prototype
│  └─ .env                 # EXPO_PUBLIC_* (anon key only — never secrets)
├─ backend/                # FastAPI + Supabase migrations
│  ├─ app/
│  │  ├─ main.py
│  │  ├─ core/             # config, db, auth (JWT verify), quotas
│  │  ├─ db.py             # SQLModel engine/session
│  │  ├─ models.py         # SQLModel tables (schema source of truth)
│  │  ├─ routers/          # ai.py, health.py
│  │  ├─ services/         # gemini.py, ai_log.py, program_context.py, supabase_admin.py, prompts.py
│  │  └─ schemas.py        # pydantic models (also used as Gemini response_schema)
│  ├─ tests/
│  └─ alembic/             # Alembic migrations (versions/0001_profiles.py, ...)
└─ .env.example files on both sides — never commit real .env
```

---

## 6. Database schema (canonical)

All tables live in Supabase Postgres, created via **Alembic** migrations in `backend/alembic/versions/` — table DDL from SQLModel metadata (`backend/app/models.py`), with raw SQL for RLS policies and triggers. **Every table has RLS enabled**; policy: `auth.uid() = user_id` for user tables. `ai_calls` is service-role only (no user read).

| Table | Key columns | Notes |
|---|---|---|
| `profiles` | id (FK auth.users), display_name, sex, birth_date, height_cm, height_unit, weight_unit, goal (cut/recomp/maintain/bulk), pace_kg_wk, activity_level, experience, days_per_week, session_len_min, equipment text[], injuries text[], injuries_note, onboarding_completed | auto-created via `handle_new_user` trigger |
| `body_metrics` | user_id, measured_on (date), weight_kg, bodyfat_pct? | unique(user_id, measured_on); drives weight trend |
| `exercises` | id, user_id NULL (= global), name, primary_muscle, secondary_muscles text[], equipment, is_custom | global readable by all authed users; customs owner-only |
| `routines` | id, user_id, name, source (manual/ai), program_id?, day_label, sort_order | templates; AI-generated ones link to `programs` |
| `routine_exercises` | routine_id, exercise_id, sort_order, target_sets, target_reps (e.g. "8-12"), target_rpe?, superset_group?, rest_seconds? | |
| `workouts` | id, user_id, routine_id?, started_at, ended_at?, notes | a live/finished session |
| `workout_sets` | workout_id, exercise_id, set_number, set_type (warmup/normal/drop/failure), superset_group?, reps, weight_kg, rpe?, completed, is_pr | the core logging table |
| `meals` | user_id, logged_at, name, meal_slot (breakfast/lunch/dinner/snacks), photo_path?, calories, protein_g, carbs_g, fat_g, source (photo/manual), ai_raw jsonb? | |
| `foods` | id, user_id NULL (global) / set (custom), name, brand?, region?, serving_description, serving_grams?, kcal, protein_g, carbs_g, fat_g, source (indb/off/custom), barcode?, is_custom | global catalog readable by authed users; customs owner-only; seeded from Anuvaad INDB |
| `progress_photos` | user_id, taken_on, photo_path, analysis jsonb? | analysis written by FastAPI |
| `programs` | user_id, status (active/archived), goal_snapshot jsonb, payload jsonb, rationale text, created_at | one active at a time |
| `daily_activity` | user_id, activity_date, steps, target_kcal, step_bonus_kcal | unique(user_id, activity_date) |
| `ai_usage` | user_id, usage_date, feature, count | unique(user_id, usage_date, feature); quota enforcement |
| `ai_calls` | user_id, feature, model, prompt_tokens, output_tokens, latency_ms, status, error? | service-role only; cost observability |

Storage buckets (both **private**): `food-photos`, `progress-photos`. Storage RLS: users can only access objects under `{their_user_id}/`.

---

## 7. AI system

**Model:** `gemini-2.5-flash` via the `google-genai` Python SDK. All calls use **structured output** (`response_mime_type="application/json"` + a Pydantic-derived `response_schema`) so parsing never breaks. Every call is quota-checked, timed, token-logged, and wrapped in retry-once + graceful error.

### Endpoints (all require `Authorization: Bearer <supabase access_token>`, verified via Supabase JWKS)

| Endpoint | Input | Output (JSON) | Quota (free tier) |
|---|---|---|---|
| `POST /ai/analyze-food` | `{ photo_path, hint? }` | `{ name, serving_description, calories, protein_g, carbs_g, fat_g, confidence: low/med/high, notes }` | 5 / day |
| `POST /ai/generate-program` | `{ notes?, focus_areas? }` | program payload: `{ name, weeks: [{ sessions: [{ day_label, exercises: [{ name, sets, reps, rpe?, rest_seconds?, notes? }] }] }], progression_notes, rationale }` | 1 / 7 days |
| `POST /ai/analyze-physique` | `{ photo_path, compare_to? }` | `{ summary, strong_areas[], focus_areas[], posture_notes, recommendations[], disclaimer }` | 1 / 7 days |

### Prompting strategy

- **System instructions** frame the model as a certified strength & conditioning coach / sports nutritionist. Output must be guidance, never medical diagnosis; every physique response includes a disclaimer string.
- **generate-program** receives a rich context object built server-side by `program_context.py`: profile, goal, days/week, equipment, injuries, last-12-weeks per-lift best e1RM, weekly volume, stalled lifts, and focus areas from the latest physique analysis.
- **Physique/food images** are fetched by FastAPI from private Storage via the service key, sent as inline image parts.
- **Refusal handling:** if Gemini declines (safety), return HTTP 422 with friendly guidance (e.g., lighting/clothing tips for physique photos).
- Program exercises are matched case-insensitively to the `exercises` library; unmatched names are created as user customs.

---

## 8. Personalization engine (TypeScript, pure functions, unit-tested)

Lives in `frontend/src/engine/`. No I/O, no framework imports — deterministic and fully testable.

| Module | Function | Formula / rule |
|---|---|---|
| `units.ts` | kg↔lb, cm↔ft/in conversions | — |
| `tdee.ts` | BMR | Mifflin-St Jeor — male: `10w + 6.25h − 5a + 5`; female: `10w + 6.25h − 5a − 161` · Katch-McArdle `370 + 21.6 × leanMass` when body-fat % is known |
| | TDEE | BMR × activity multiplier (sedentary 1.2 / light 1.375 / moderate 1.55 / very 1.725) |
| `targets.ts` | Calorie target | pace-based: TDEE + `pace_kg_wk × 7700 ÷ 7`; pace capped to ≤1% BW/wk (cut/recomp) · ≤0.5% BW/wk (bulk) and the delta capped at ±25% TDEE — floors: 1500 (M) / 1200 (F) kcal |
| | Macros | protein: cut 2.2 g/kg, else 1.8 g/kg · fat: 25% of kcal · carbs: remainder |
| `steps.ts` | Step calorie bonus | `steps × weight_kg × 0.0005` — added on top of sedentary-baseline target |
| | Trend adjustment | if 14-day weight trend contradicts goal (no loss on cut / no gain on bulk), adjust target ∓100 kcal · **Phase 3: adaptive TDEE** (see PHASE-3) |
| `strength.ts` | Estimated 1RM | Epley: `weight × (1 + reps/30)` |
| | PR detection | new max weight, max reps at weight, or max e1RM per exercise |
| | Stall detection | no e1RM improvement across 3+ exposures → flag for deload / feed to program generation |

---

## 9. Design direction (summary — full spec in `frontend/Design/DESIGN.md`)

- **Vibe:** dark forge atmosphere — near-black backgrounds, warm-white text, molten orange accent that "glows".
- **Accent:** ember `#FF6A00` with flame gradient `#FFB347 → #FF6A00 → #E63E00`.
- **Type:** Space Grotesk (display/numbers), Inter (UI body).
- **References:** Hevy/Strong (logging speed), Fitbod (AI program UX), Whoop/Oura (premium dark data viz), MacroFactor (nutrition logging).
- **Signature interactions:** completing a set *ignites* the row; PRs burst ember particles; streaks are flames; the center tab is a raised ember "Train" button.

---

## 10. Phase roadmap

| Phase | File | Deliverable | Status |
|---|---|---|---|
| 0 | `phases/PHASE-0-scaffold.md` | Expo + FastAPI + Supabase scaffold, auth end-to-end | ✅ |
| 1 | `phases/PHASE-1-onboarding-engine.md` | Onboarding wizard + personalization engine (tested) | ✅ |
| 2 | `phases/PHASE-2-gym-tracker.md` | Full workout logging core (offline-tolerant) | ✅ |
| 3 | `phases/PHASE-3-steps-budget.md` | Health Connect steps, calorie budget, weight, manual meals | ✅ |
| 4 | `phases/PHASE-4-ai-food.md` | First AI route: food photo → macros, quota system | ⬜ |
| 5 | `phases/PHASE-5-ai-programs.md` | AI program generation → editable routines | ⬜ |
| 6 | `phases/PHASE-6-physique.md` | Physique check-ins, analysis, feedback loop into programs | ⬜ |
| 7 | `phases/PHASE-7-launch.md` | Hardening, deploy API to Oracle, Play Store internal release | ⬜ |

Phases are sequential — each depends on the previous. Do not start Phase N+1 until Phase N's "Done when" checklist passes.

---

## 11. Environments & secrets

**`frontend/.env`** (safe, client-side):
```
EXPO_PUBLIC_SUPABASE_URL=
EXPO_PUBLIC_SUPABASE_ANON_KEY=
EXPO_PUBLIC_API_URL=        # http://<LAN-IP>:8000 in dev
```

**`backend/.env`** (NEVER in the app, never committed):
```
SUPABASE_URL=
DATABASE_URL=               # Postgres pooler URI — Alembic migrations only
SUPABASE_SERVICE_ROLE_KEY=  # bypasses RLS — server only
GEMINI_API_KEY=
ALLOWED_ORIGINS=            # app scheme in prod, * in dev
QUOTA_FOOD_PER_DAY=5
QUOTA_PROGRAM_PER_DAYS=7
QUOTA_PHYSIQUE_PER_DAYS=7
```

Auth on the API: verify the Supabase access token against `https://<project>.supabase.co/auth/v1/.well-known/jwks.json`, audience `authenticated` (PyJWT).

---

## 12. Cost plan (beta = $0)

| Service | Free tier (verify current limits) | Fits? |
|---|---|---|
| Supabase | 500MB DB · 1GB storage · 50k MAU · pauses after ~7d inactivity | ✅ compress photos |
| Gemini 2.5 Flash (AI Studio) | ~10 RPM / ~250 req/day | ✅ with quotas (5 food scans + weekly gens ≈ 40 users/day comfortable) |
| Oracle Always Free | ARM64 VM (up to 4 OCPU / 24GB) or 2× AMD micro | ✅ runs FastAPI + Docker easily |
| Expo EAS | limited free builds/month | ✅ local `expo run:android` for daily dev |

Upgrade path when quotas bite: enable billing on the same AI Studio key — zero code change.

---

## 13. Risks & mitigations

| Risk | Mitigation |
|---|---|
| Gemini safety refusals on physique photos | Coach-framed system prompt; 422 + friendly retake guidance (lighting, framing, clothing) |
| Food estimates inaccurate | Editable confirmation screen is mandatory before logging; confidence chip shown |
| Free-tier rate limits | Per-user quotas sized below daily caps; usage logged for tuning; paid upgrade path ready |
| Gym has no signal | Active workout persisted locally; mutations queued and synced |
| Health Connect store approval | Play health-data declaration handled in Phase 7; works on sideloaded builds immediately |
| Health/AI advice liability | In-app disclaimers (onboarding, food confirm, physique analysis); "guidance, not medical advice" |
| Supabase free-tier pause | Regular usage keeps it active; dashboard check during dev |
