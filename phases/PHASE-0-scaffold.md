# PHASE 0 — Scaffold

**Goal:** A runnable skeleton: Expo app on a real Android device + FastAPI running locally + Supabase project, with **auth working end-to-end** (app ↔ Supabase Auth; app → FastAPI with verified JWT).

**Depends on:** nothing. **Blocks:** everything.

## Tasks

1. **Repo layout** — create `mobile/`, `api/`, `supabase/migrations/` inside the project root (alongside PLAN.md / DESIGN.md / phases/).
2. **Mobile app init** — `npx create-expo-app@latest mobile` (TypeScript + expo-router template). Install:
   - core: `expo-router`, `expo-constants`, `expo-linking`, `expo-status-bar`, `expo-dev-client`
   - data: `@supabase/supabase-js`, `react-native-url-polyfill`, `expo-secure-store`, `@tanstack/react-query`, `zustand`
   - styling: `nativewind`, `tailwindcss` (configure per NativeWind docs: babel + metro + tailwind.config)
   - auth: `expo-auth-session`, `expo-web-browser`
3. **Theme tokens** — translate `DESIGN.md` §3 tokens into `mobile/src/theme/` (colors, spacing, radius, typography) + wire into `tailwind.config.js`.
4. **Supabase project** — create free project at supabase.com. Record URL + anon key in `mobile/.env` (see PLAN.md §11). Enable email auth. Enable Google provider (Google Cloud OAuth client; configure redirect URLs for Expo).
5. **Supabase client** — `mobile/src/lib/supabase.ts` with SecureStore session adapter + auth state listener.
6. **Auth gate** — expo-router: `(auth)` group (welcome/login/signup per DESIGN.md S2–S4) and `(tabs)` group; redirect based on session. Email sign-up/in working. Google sign-in working via `expo-auth-session` PKCE flow.
7. **FastAPI skeleton** — `api/`: Python 3.12, `python -m venv .venv` (or `uv`). Deps: `fastapi`, `uvicorn[standard]`, `pydantic`, `pydantic-settings`, `PyJWT[crypto]`, `httpx`. Structure per PLAN.md §5. Routes: `GET /health` (public), `GET /health/protected` (requires auth).
8. **JWT verification** — `api/app/core/auth.py`: fetch + cache Supabase JWKS from `{SUPABASE_URL}/auth/v1/.well-known/jwks.json`, verify Bearer token (aud `authenticated`), return `user_id`. Dependency usable on any route.
9. **CORS** — allow all origins in dev; configurable via `ALLOWED_ORIGINS`.
10. **App → API proof** — a temporary button on the Today tab calls `GET /health/protected` with `session.access_token`; displays the returned `user_id`.
11. **Dev build on device** — `eas.json` with `development` profile (developmentClient). Build via `eas build -p android --profile development` **or** local `npx expo run:android`. Install on the dev phone. `EXPO_PUBLIC_API_URL=http://<LAN-IP>:8000`.
12. **Hygiene** — `.gitignore` (node_modules, .env, .venv, __pycache__, dist, *.aab), `.env.example` in both `mobile/` and `api/`, `api/requirements.txt` (or `pyproject.toml`).

## Done when

- [ ] App launches on a physical Android device (dev build, not Expo Go)
- [ ] Email sign-up + login persists across app restarts (SecureStore session)
- [ ] Google sign-in completes and returns to the app
- [ ] Unauthenticated users are redirected to `(auth)`; authenticated users land on tabs
- [ ] The Today tab shows the `user_id` returned by FastAPI `/health/protected` (JWT verified server-side)
- [ ] `GET /health` returns 200 without a token; `/health/protected` returns 401 without one
- [ ] No secrets in `mobile/.env` beyond the Supabase anon key

## Test plan

- Manual: full auth flows on device (email + Google), token expiry/refresh behavior.
- API: `pytest api/tests/test_auth.py` — valid token mock accepted, garbage token rejected.

## Notes

- Expo Go will NOT work (dev-client needed for later Health Connect). Establish the dev-build habit now.
- Keep auth screens visually minimal but use DESIGN.md tokens (dark bg, ember accents) from day one.
