# backend/AGENTS.md — VULCAN FastAPI + Supabase

Stack-specific rules for the backend: the Python FastAPI AI proxy **and** the Supabase migrations/RLS. Combine with root `../AGENTS.md`. Schema is canonical in PLAN.md §6; this service exists for **AI features only** (it never serves normal CRUD).

## Layout

- `app/` — FastAPI: `main.py` (app + CORS via `ALLOWED_ORIGINS`) · `core/` (`config.py` pydantic-settings, `auth.py` JWT verify, `quotas.py`) · `routers/` (`ai.py`, `health.py`) · `services/` (`gemini.py`, `program_context.py`, `supabase_admin.py`, `prompts.py`) · `schemas.py` (pydantic models, doubled as Gemini `response_schema`).
- `tests/` — `pytest`.
- `migrations/` — versioned SQL (`0001_profiles.sql`, `0002_training.sql`, `0003_activity_nutrition.sql`, `0004_ai.sql`, `0005_programs.sql`, `0006_physique.sql`). One per phase; never edit an applied migration — add a new titled one. Keep them additive/idempotent.
- `backend/.env` is never committed; commit only `.env.example` with all vars from PLAN.md §11.

## FastAPI — the AI route pipeline (reusable; follow it on every AI endpoint)

**auth → quota → fetch storage (service key) → Gemini structured output → log call → respond.**

1. **Auth:** verify `Authorization: Bearer <supabase access_token>` against the Supabase JWKS (`core/auth.py`, PyJWT, audience `authenticated`). Expose as a FastAPI dependency returning `user_id`. Garbage/missing tokens → 401.
2. **Quota:** `core/quotas.py` calls the `increment_ai_usage` SQL function with the per-feature limit. Denied → HTTP 429 with `resets_at`.
3. **Storage/fetch:** read photos / query performance data with the **service-role key only** (`supabase_admin.py`). Never return the key or signed URLs exposing other users' data.
4. **Gemini:** `google-genai`, model `gemini-2.5-flash`, **structured output** (`response_mime_type="application/json"` + the Pydantic schema). Wrap with **one retry**; log tokens + latency into `ai_calls`. Prompts live in `services/prompts.py`, versioned.
5. **Log & respond:** every call logs to `ai_calls` (tokens, latency, status). Return clean, typed responses.

### FastAPI conventions

- **Type everything** with Pydantic; never return untyped dicts where a schema exists (`schemas.py` IS the Gemini `response_schema`).
- **Graceful degradation, never crash:** malformed Gemini output → clean 502; safety refusal → 422 with friendly guidance (e.g., physique retake tips). No stack traces to the client.
- **Secrets:** the service-role key and Gemini key never leave server-side — not in responses, not in logs. `ALLOWED_ORIGINS` gates CORS.
- **Quota + disclaimer discipline:** every AI endpoint enforces quota; every AI-generated surface carries the mandatory disclaimer copy (root AGENTS.md §3). AI output is guidance, never medical diagnosis.

## Supabase — database & storage

- **RLS is mandatory on every table.** User tables get owner policies (`auth.uid() = user_id`). Documented exceptions only:
  - `exercises` global rows (`user_id NULL`) — readable by any authenticated user; custom rows owner-only.
  - `ai_usage` / `ai_calls` — `ai_calls` service-role only (no user read); users may read only their own `ai_usage` rows; writes service-role only.
- **Unique constraints the app relies on:** `body_metrics(user_id, measured_on)`, `daily_activity(user_id, activity_date)`, `ai_usage(user_id, usage_date, feature)`, one active `programs` per user (partial unique index `ON programs(user_id) WHERE status='active'`).
- **Quota function:** `increment_ai_usage(p_user uuid, p_feature text, p_limit int) returns boolean` — atomic upsert + increment; returns whether the call is allowed. Single enforcement point for AI quotas.
- **Storage buckets** `food-photos` and `progress-photos` are private (server/service-role only at the storage level) with storage RLS scoping objects to `{auth.uid()}/`.
- **Triggers:** `profiles` auto-created via a `handle_new_user()` trigger on `auth.users` insert.
- **Indexes** for hot read paths from PLAN.md §6 (e.g., `workout_sets(workout_id)`, `workouts(user_id, started_at desc)`).

## Testing & verification (exit gates)

- `pytest`: auth (valid accepted / garbage rejected), quota allow/deny (429), schema parsing (conformant + malformed → clean 502), refusal mapping to 422. **Mock the Gemini client** — no real API calls in tests.
- After a migration, verify with actual SQL/API calls: anonymous read fails, cross-user read fails, owner can read/write. Confirm storage policies the same way. State the evidence, don't assume.
- RLS audit is a Phase 7 gate; keep every table clean from Phase 1 onward.
- Before finishing work: run `pytest`, typecheck, and lint.
