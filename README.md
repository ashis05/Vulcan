# VULCAN

**Forge your physique.** AI-native, all-in-one fitness app: workout tracking, AI coaching, food photo analysis, physique analysis, and step-driven calorie budgeting — personalized to every user.

> Design system, tokens, and the navigable HTML prototype live in `frontend/Design/` (read `frontend/Design/DESIGN.md` before touching any UI). The full plan is `PLAN.md`; phases are in `phases/`.

---

## Repo layout

```
VULCAN/
├─ PLAN.md            # source of truth
├─ AGENTS.md          # agent/developer guidelines
├─ phases/            # phase-by-phase build instructions
├─ frontend/          # React Native + Expo (TypeScript, expo-router, NativeWind v5 + Tailwind v4)
│  ├─ src/app/        # routes: (auth), (tabs), ...
│  ├─ src/components/ # shared UI
│  ├─ src/engine/     # personalization pure functions (Phase 1)
│  ├─ src/lib/        # supabase client, FastAPI client, hooks
│  ├─ src/theme/      # DESIGN.md tokens
│  └─ Design/         # design system + HTML prototype (reference only)
└─ backend/           # FastAPI AI proxy + Supabase migrations (Phase 4+)
   ├─ app/            # core (config/auth), routers
   └─ tests/          # pytest
```

---

## Prerequisites

- **Node.js ≥ 20** (`node -v`)
- **Python 3.12** via the `py` launcher (`py -3.12 --version`)
- **Android Studio + SDK** for running on a phone/emulator — see [`frontend/ANDROID-EMULATOR.md`](frontend/ANDROID-EMULATOR.md) for the full setup
- A **Supabase** free project (URL + anon key), with Auth enabled

---

## 1. Environment setup

### Frontend — `frontend/.env`

Copy `frontend/.env.example` → `frontend/.env` and fill in:

```
EXPO_PUBLIC_SUPABASE_URL=https://YOUR-PROJECT.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
EXPO_PUBLIC_API_URL=http://<YOUR-LAN-IP>:8000   # the machine running FastAPI (see "Get your LAN IP" below)
```

Get your LAN IP:

```powershell
ipconfig | findstr /i "IPv4"
```

### Backend — `backend/.env`

Copy `backend/.env.example` → `backend/.env` and fill in `SUPABASE_URL` (and `ALLOWED_ORIGINS=*` for dev).

> `.env` files are gitignored — never commit them. Secrets (service-role key, Gemini key) are Phase 4+.

---

## 2. Install dependencies

### Backend (once)

```powershell
cd backend
py -3.12 -m venv .venv
.\.venv\Scripts\pip install -r requirements.txt -r requirements-dev.txt
```

### Frontend (once)

```powershell
cd frontend
npm install
```

Verify Supabase credentials reachable:

```powershell
cd frontend
node scripts/check-supabase.mjs
```

---

## 3. Run the backend

```powershell
cd backend
.\.venv\Scripts\python -m uvicorn app.main:app --host 0.0.0.0 --port 8000
```

Smoke-check it:

```powershell
Invoke-RestMethod http://127.0.0.1:8000/health          # -> {"status":"ok"}
Invoke-WebRequest http://127.0.0.1:8000/health/protected  # -> 401 (no token)
```

Run backend tests:

```powershell
cd backend
.\.venv\Scripts\python -m pytest
```

---

## 4. Run the frontend on your phone

> VULCAN uses **expo-dev-client** — **Expo Go will NOT work.** This builds a native dev build.

1. Connect your phone via USB (enable **Developer options → USB debugging**) or boot an emulator.
2. Confirm the device is visible:

```powershell
adb devices
```

3. From `frontend/`:

```powershell
npx expo run:android
```

First build compiles native code (~5–15 min) and installs the app. It also starts Metro; wait for the VULCAN splash.

**Subsequent dev sessions** (after the build is installed):

```powershell
cd frontend
npx expo start
```

then press `a`. Rebuild with `npx expo run:android` after adding/updating any native module.

> Emulator notes: the emulator reaches your machine's `localhost` via `10.0.2.2` (set `EXPO_PUBLIC_API_URL=http://10.0.2.2:8000`); a physical phone needs your LAN IP. Detailed setup + troubleshooting: [`frontend/ANDROID-EMULATOR.md`](frontend/ANDROID-EMULATOR.md).

---

## 5. Test on the phone (Phase 0 — auth end-to-end)

With the app installed, backend running, and `EXPO_PUBLIC_API_URL` pointing at the backend:

1. **Sign up** — Welcome → *Continue with email* → *Create account* → email + password.
   - If Supabase has email confirmation enabled, confirm via the email link, then log in. (To skip during dev: Supabase dashboard → Authentication → email → toggle off **Confirm email**.)
2. **Log in** — you should land on the 5-tab shell with the raised orange **Train** button.
3. **Session persistence** — kill the app (swipe away) and reopen: you should land on the tabs (session stored in SecureStore).
4. **Backend proof** — on the **Today** tab tap **"Verify FastAPI (Phase 0 proof)"**: it sends your access token to `/health/protected` and shows the server-verified `user_id` (JWT verified against Supabase's JWKS).
5. **Sign out** — Profile tab → *Sign out* → back to Welcome.

**Expected Phase 0 gate results:** fresh install → unauthenticated users land on `(auth)`; signed-in users land on tabs; email sign-up/login persist across restarts; `/health` returns 200 without a token and `/health/protected` returns 401 without one; no secrets beyond the anon key in `frontend/.env`.

---

## 6. Useful commands

| Task | Command |
|---|---|
| Frontend typecheck | `cd frontend; npm run typecheck` |
| Frontend lint | `cd frontend; npm run lint` |
| Frontend web bundle check | `cd frontend; npx expo export --platform web` |
| Backend tests | `cd backend; .\.venv\Scripts\python -m pytest` |
| Supabase creds check | `cd frontend; node scripts/check-supabase.mjs` |
| Start backend | see §3 |

---

## Troubleshooting

- **`No module named 'app'`** when starting uvicorn → you're not in `backend/`. `cd backend` first.
- **Phone shows blank/white** → Metro isn't running; run `npx expo start` then press `a`.
- **Build fails: "SDK location not found"** → `ANDROID_HOME` isn't set. Quick fix: create `frontend\android\local.properties` containing `sdk.dir=C\:\\Users\\<you>\\AppData\\Local\\Android\\Sdk` (or set `ANDROID_HOME` and reopen the terminal).
- **`/health/protected` call fails from the phone** → `EXPO_PUBLIC_API_URL` is wrong (must be your LAN IP, not `localhost`), the backend isn't running, or port 8000 is blocked by the firewall.
- **Google sign-in button shows a notice** → Google provider flow is wired later; email auth is the tested path.
- Full emulator/device setup + Android troubleshooting: [`frontend/ANDROID-EMULATOR.md`](frontend/ANDROID-EMULATOR.md).