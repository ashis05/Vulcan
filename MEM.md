# MEM.md — VULCAN session memory

Continuing the project from anywhere. This file is the session log and current-state snapshot.

## How to use

- **READ this file first** when resuming work.
- **After every session, append a new entry** to the Session log below: what was done, decisions made, verification results, current state, and next steps. Keep each entry concise and factual.
- Never put secrets in this file (no keys, no tokens).

---

## Current state

- **Active branch:** `feat/onboarding` (Phase 1 — engine + wizard + Alembic built, uncommitted). `master` has Phase 0 merged.
- **Branches:** `master` (init + frontend scaffold + Phase 0/auth) · `frontend` (scaffold only) · `feat/auth` (merged into master) · `feat/onboarding` (Phase 1, WIP).
- **Frontend** (`frontend/`): Expo SDK 57 · expo-router (new `js-tabs`) · React Native 0.86 · TypeScript · NativeWind v5 preview + Tailwind v4 · fonts (Space Grotesk/Inter) · DESIGN tokens in `src/theme/` + `src/global.css` (`@theme`).
- **Routes:** `/` = **splash** (`src/app/index.tsx`, S1 ember ignite → wordmark → redirects `/welcome` or `/today`) · `(auth)/welcome|login|signup|forgot-password` · `(tabs)/today|nutrition|train|progress|profile`. `Stack.Protected` gates `(auth)` vs `(tabs)`; splash is always available as the anchor.
- **Auth (Google-only UI):** welcome screen offers **Google sign-in only** (email button removed; `login`/`signup`/`forgot-password` route files still exist but unreachable — candidate for deletion). Google flow: PKCE (`src/lib/oauth.ts`, client `flowType:'pkce'`, redirect `vulcan://`), deep-link fallback via `Linking.addEventListener`, WebCrypto polyfill (`react-native-quick-crypto`) for SHA-256. Works end-to-end on device. Session persisted in SecureStore.
- **Styling:** **No `className` anywhere** — all styles are explicit RN `StyleSheet` objects derived from DESIGN tokens (NativeWind v5 `react-native-css` runtime was unreliable for a subset of `--text-*` utilities on native; inline styles are proven to work). `src/components/ui/{Screen,Button,TextField,TabBar}.tsx` + all screens use tokens directly.
- **Tab bar:** floating dock (rounded pill, 16px margins, elevated + shadow), center Train button raised with flame gradient, **DumbbellIcon** (64px button / 28px icon).
- **Backend** (`backend/`): FastAPI skeleton — `GET /health` (public), `GET /health/protected` (JWT verified against Supabase JWKS). **Fixed ES256 support** (Supabase signs with EC P-256): `_key_for_kid` handles EC, decode accepts `["ES256","RS256"]`. Tests 8/8 passing.
- **Migrations (switched to Alembic + SQLModel):** `backend/app/models.py` = schema source of truth (`profiles`, `body_metrics`); `backend/app/db.py` (engine, psycopg3 URL normalization); `backend/alembic/` with revision `0001_profiles` (table DDL from SQLModel metadata + raw SQL for RLS, `handle_new_user` trigger, and the cross-schema `auth.users` FK). `DATABASE_URL` set in `backend/.env`; **`0001_profiles` applied to the live DB and RLS verified**. Old `backend/migrations/*.sql` removed.
- **Frontend ↔ backend proof:** Today tab "Verify FastAPI (Phase 0 proof)" button calls `/health/protected` with the access token and shows the server-verified `user_id` — **pending device re-test after the ES256 backend fix** (was 401).
- **Docs:** `README.md` (run backend/frontend/test-on-phone), `frontend/ANDROID-EMULATOR.md` (device/emulator setup).

---

## Session log

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
- **Google sign-in:** provider enabled in Supabase, but **wiring deferred** — button shows a notice. Email auth is the tested path. When wired: the app's OAuth `clientId` is the anon key (no Google Client ID in `.env`); Google creds go in the Supabase dashboard; device redirect will be the `vulcan://` scheme (not `localhost:3000`).
- **Email confirmation:** kept Supabase's default email-confirm flow; Resend/Google SMTP to be added later.

## Environment (no secrets)

- Supabase project: `https://trjtcfnmqufrqxhwhrtk.supabase.co`
- `frontend/.env`: `EXPO_PUBLIC_SUPABASE_URL`, `EXPO_PUBLIC_SUPABASE_ANON_KEY` (filled), `EXPO_PUBLIC_API_URL` (set to LAN IP for device testing).
- `backend/.env`: `SUPABASE_URL` (filled), `ALLOWED_ORIGINS=*`.
- Android SDK: `C:\Users\Dell\AppData\Local\Android\Sdk`; `local.properties` written; env vars persisted.

## Open questions / next steps

- [x] Session 7: Google sign-in works end-to-end (deep-link fallback + WebCrypto polyfill); **backend ES256 fix** (was rejecting valid tokens with 401 — `auth.py` now handles EC keys, 8/8 pytest); welcome is Google-only with real Google logo; app icon = splash ember mark confirmed; **floating dock tab bar + DumbbellIcon** (64px Train button).
- [x] Session 8: Verify FastAPI shows `user_id` on device ✅; deep-link fallback diagnostic log added (confirm via Metro log on next Google sign-in); email auth routes deleted; Phase 0 "Done when" closed; `feat/auth` committed + merged into `master`.
- [ ] Phase 1: engine + wizard + settings stub built on `feat/onboarding` (uncommitted); `0001_profiles` applied to the live DB and RLS verified. Remaining: device "Done when" gate (wizard → Reveal targets, profile + first weight persisted, edit recalculates).
- [ ] Backend: add `routers/ai.py` + `schemas.py` when Phase 4 starts.
- [ ] Set the real Android bundle id in `app.json` (Phase 7; currently `com.anonymous.vulcan`).