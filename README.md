<p align="center">
  <picture>
    <source media="(max-width: 600px)" srcset="docs/readme/vulcan-mobile.svg">
    <img src="docs/readme/vulcan.svg" alt="VULCAN. Forge your physique. An AI-native fitness app for Android: workout tracking, AI coaching, food photo analysis, physique analysis and a step-driven calorie budget, personalized to every user. Built with Expo and React Native, FastAPI, Supabase and Gemini Flash-Lite." width="100%">
  </picture>
</p>

<p align="center">
  <a href="PLAN.md"><b>Plan</b></a> &nbsp;·&nbsp;
  <a href="frontend/Design/DESIGN.md"><b>Design system</b></a> &nbsp;·&nbsp;
  <a href="phases/"><b>Phases</b></a> &nbsp;·&nbsp;
  <a href="deployment/README.md"><b>Deployment</b></a> &nbsp;·&nbsp;
  <a href="AGENTS.md"><b>Agent guide</b></a>
</p>

<details>
<summary><b>All 29 prototype screens</b></summary>
<br>

Rendered from the navigable HTML prototype in [`frontend/Design/screens/`](frontend/Design/screens/). Open `frontend/Design/index.html` in a browser to click through it.

<h4>Sign in and onboarding</h4>
<table>
<tr><td align="center" width="20%"><img src="docs/readme/screens/s02-welcome.jpg" alt="Welcome screen" width="150"><br><sub>Welcome</sub></td><td align="center" width="20%"><img src="docs/readme/screens/s03-login.jpg" alt="Log in screen" width="150"><br><sub>Log in</sub></td><td align="center" width="20%"><img src="docs/readme/screens/s04-signup.jpg" alt="Create account screen" width="150"><br><sub>Create account</sub></td><td align="center" width="20%"><img src="docs/readme/screens/s05-onboarding-wizard.jpg" alt="Onboarding screen" width="150"><br><sub>Onboarding</sub></td></tr>
</table>

<h4>Today and training</h4>
<table>
<tr><td align="center" width="20%"><img src="docs/readme/screens/s06-today.jpg" alt="Today screen" width="150"><br><sub>Today</sub></td><td align="center" width="20%"><img src="docs/readme/screens/s07-train-home.jpg" alt="Train screen" width="150"><br><sub>Train</sub></td><td align="center" width="20%"><img src="docs/readme/screens/s08-routine-detail.jpg" alt="Routine screen" width="150"><br><sub>Routine</sub></td><td align="center" width="20%"><img src="docs/readme/screens/s09-routine-builder.jpg" alt="Routine builder screen" width="150"><br><sub>Routine builder</sub></td><td align="center" width="20%"><img src="docs/readme/screens/s10-active-workout.jpg" alt="Active session screen" width="150"><br><sub>Active session</sub></td></tr>
<tr><td align="center" width="20%"><img src="docs/readme/screens/s11-workout-summary.jpg" alt="Summary screen" width="150"><br><sub>Summary</sub></td><td align="center" width="20%"><img src="docs/readme/screens/s12-exercise-picker.jpg" alt="Exercise picker screen" width="150"><br><sub>Exercise picker</sub></td><td align="center" width="20%"><img src="docs/readme/screens/s13-exercise-detail.jpg" alt="Exercise screen" width="150"><br><sub>Exercise</sub></td><td align="center" width="20%"><img src="docs/readme/screens/s14-history.jpg" alt="History screen" width="150"><br><sub>History</sub></td><td align="center" width="20%"><img src="docs/readme/screens/s15-past-workout.jpg" alt="Past workout screen" width="150"><br><sub>Past workout</sub></td></tr>
</table>

<h4>Nutrition</h4>
<table>
<tr><td align="center" width="20%"><img src="docs/readme/screens/s16-nutrition-diary.jpg" alt="Nutrition screen" width="150"><br><sub>Nutrition</sub></td><td align="center" width="20%"><img src="docs/readme/screens/s17-add-meal.jpg" alt="Add meal screen" width="150"><br><sub>Add meal</sub></td><td align="center" width="20%"><img src="docs/readme/screens/s18-scan-camera.jpg" alt="Food scan screen" width="150"><br><sub>Food scan</sub></td><td align="center" width="20%"><img src="docs/readme/screens/s19-ai-food-confirm.jpg" alt="Confirm meal screen" width="150"><br><sub>Confirm meal</sub></td><td align="center" width="20%"><img src="docs/readme/screens/s20-meal-detail.jpg" alt="Meal screen" width="150"><br><sub>Meal</sub></td></tr>
</table>

<h4>Progress and AI coaching</h4>
<table>
<tr><td align="center" width="20%"><img src="docs/readme/screens/s21-progress-home.jpg" alt="Progress screen" width="150"><br><sub>Progress</sub></td><td align="center" width="20%"><img src="docs/readme/screens/s22-photo-checkin.jpg" alt="Photo check-in screen" width="150"><br><sub>Photo check-in</sub></td><td align="center" width="20%"><img src="docs/readme/screens/s23-photo-compare.jpg" alt="Photo compare screen" width="150"><br><sub>Photo compare</sub></td><td align="center" width="20%"><img src="docs/readme/screens/s24-physique-analysis.jpg" alt="Physique analysis screen" width="150"><br><sub>Physique analysis</sub></td><td align="center" width="20%"><img src="docs/readme/screens/s25-program-generate.jpg" alt="Forge program screen" width="150"><br><sub>Forge program</sub></td></tr>
<tr><td align="center" width="20%"><img src="docs/readme/screens/s26-program-review.jpg" alt="Program review screen" width="150"><br><sub>Program review</sub></td></tr>
</table>

<h4>Profile</h4>
<table>
<tr><td align="center" width="20%"><img src="docs/readme/screens/s27-profile.jpg" alt="Profile screen" width="150"><br><sub>Profile</sub></td><td align="center" width="20%"><img src="docs/readme/screens/s28-goals-targets.jpg" alt="Goals &amp; targets screen" width="150"><br><sub>Goals &amp; targets</sub></td><td align="center" width="20%"><img src="docs/readme/screens/s29-ai-usage.jpg" alt="AI usage screen" width="150"><br><sub>AI usage</sub></td><td align="center" width="20%"><img src="docs/readme/screens/s30-privacy-data.jpg" alt="Privacy &amp; data screen" width="150"><br><sub>Privacy &amp; data</sub></td></tr>
</table>

</details>

> Read [`frontend/Design/DESIGN.md`](frontend/Design/DESIGN.md) before touching any UI. [`PLAN.md`](PLAN.md) is the source of truth; build phases live in [`phases/`](phases/).

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
├─ backend/           # FastAPI AI proxy + Supabase migrations (Phase 4+)
│  ├─ app/            # core (config/auth), routers
│  └─ tests/          # pytest
├─ deployment/        # Terraform + runbooks (AWS EC2, Cloudflare Tunnel, EAS)
└─ docs/readme/       # README header images, screenshots and the scripts that make them
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

### Boot the Android emulator manually

`emulator` is normally **not on `PATH`** — call it through `$ANDROID_HOME`:

```powershell
# list the AVDs you have
& "$env:ANDROID_HOME\emulator\emulator.exe" -list-avds

# boot one (use the name printed above, e.g. Medium_Phone_API_36.0)
& "$env:ANDROID_HOME\emulator\emulator.exe" -avd Medium_Phone_API_36.0
```

Wait for the Android home screen, then confirm it's attached — `adb devices` should show `emulator-5554  device`. If it instead shows `emulator-5554  offline` and never boots, the quick-boot snapshot is corrupt; **cold boot** past it:

```powershell
& "$env:ANDROID_HOME\emulator\emulator.exe" -avd Medium_Phone_API_36.0 -no-snapshot-load
```

To skip quick-boot permanently, set `fastboot.forceColdBoot=yes` and `fastboot.forceFastBoot=no` in `%USERPROFILE%\.android\avd\<AVD>.avd\config.ini`.

> `npx expo run:android` / `npx expo start` + `a` launch this same `emulator.exe`; booting it manually first just lets you control cold-boot and see errors.

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

## 7. Deployment

The API runs in Docker on a single AWS EC2 instance (provisioned with Terraform), exposed
through an outbound-only Cloudflare Tunnel (no open ports, no certs); the Android app is built
with EAS and shipped on an internal track. Full runbook:
[`deployment/README.md`](deployment/README.md).

- `deployment/terraform/` — Terraform: VPC, EC2, Elastic IP
- `deployment/01-aws-ec2.md` — provision the instance with Terraform
- `deployment/02-cloudflare-tunnel.md` — tunnel + `api-vulcan.ashiswadhwani.in`
- `deployment/03-backend-deploy.md` — server `.env`, compose, rsync/CI deploy
- `deployment/04-frontend-eas.md` — EAS project, env vars, build
- `deployment/05-github-actions.md` — CI checks + manual deploy workflows
- `deployment/06-troubleshooting.md` — common failures

---

## Troubleshooting

- **`No module named 'app'`** when starting uvicorn → you're not in `backend/`. `cd backend` first.
- **Phone shows blank/white** → Metro isn't running; run `npx expo start` then press `a`.
- **Build fails: "SDK location not found"** → `ANDROID_HOME` isn't set. Quick fix: create `frontend\android\local.properties` containing `sdk.dir=C\:\\Users\\<you>\\AppData\\Local\\Android\\Sdk` (or set `ANDROID_HOME` and reopen the terminal).
- **`/health/protected` call fails from the phone** → `EXPO_PUBLIC_API_URL` is wrong (must be your LAN IP, not `localhost`), the backend isn't running, or port 8000 is blocked by the firewall.
- **Google sign-in button shows a notice** → Google provider flow is wired later; email auth is the tested path.
- Full emulator/device setup + Android troubleshooting: [`frontend/ANDROID-EMULATOR.md`](frontend/ANDROID-EMULATOR.md).

---

## README images

The header image and the screenshots are generated, so don't edit them by hand:

```bash
cd docs/readme
npm install --no-save --no-package-lock playwright && npx playwright install chromium   # once
node shoot.cjs          # re-shoot the prototype screens into docs/readme/screens/
python3 make_svg.py     # rebuild vulcan.svg + vulcan-mobile.svg
```

`make_svg.py` reads the phase table in `PLAN.md` §10, so rerun it whenever a phase is ticked off.
