# VULCAN — Android emulator / device setup

How to run the Expo app on the Android Emulator (Android Studio) or a physical device, and test auth end-to-end.

> **Important:** VULCAN uses `expo-dev-client`. **Expo Go will NOT work** — every install below is a dev-client build.

---

## 1. Prerequisites

- **Node.js ≥ 20** (we use 22). Check: `node -v`
- **Java JDK 17+** (bundled with Android Studio's JBR, or standalone). Check: `java -version`
- ~15 GB free disk for the Android SDK + emulator images.

## 2. Install Android Studio + Android SDK

1. Download Android Studio (https://developer.android.com/studio) and install with defaults.
2. On first launch, the SDK Manager offers a default SDK — accept (Android SDK Platform, Platform-Tools, Build-Tools).
3. In **Settings → Languages & Frameworks → Android SDK**, make sure these are installed:
   - Android SDK Platform (at least one, e.g. API 35/36)
   - Android SDK Build-Tools
   - Android SDK Platform-Tools
   - **Android Emulator** (component) + a **System Image** (step 3 below).

## 3. Set environment variables (Windows / PowerShell)

Add these to your user environment (System Properties → Environment Variables), then reopen your terminal:

```
ANDROID_HOME = C:\Users\<you>\AppData\Local\Android\Sdk
JAVA_HOME    = <Android Studio JBR, e.g. C:\Program Files\Android\Android Studio\jbr>
```

Also add `%ANDROID_HOME%\platform-tools` and `%ANDROID_HOME%\emulator` to `PATH`.

Verify:

```powershell
adb --version     # should print the Android Debug Bridge version
emulator -list-avds   # empty for now — you'll create one next
```

## 4. Create a virtual device (AVD)

1. In Android Studio: **Device Manager** (icon on the right toolbar) → **Create Device**.
2. Pick a phone profile — **Pixel 7 / Pixel 8** work well.
3. Choose a **system image**: recommend `API 35` or `API 36` (Android 15/16) **Google APIs**, x86_64 (this is your CPU architecture for the emulator).
4. Finish → the AVD appears in Device Manager. Click **▶** to boot it (first boot takes a few minutes; enable "Cold boot" if it seems stuck).

> Emulator acceleration on Windows requires **Hypervisor Platform (WHPX)** or the **Android Emulator Hypervisor Driver** (installable from SDK Manager → SDK Tools). If the emulator won't start, install the "Android Emulator hypervisor driver" and run the `silent_install.bat` it provides.

## 5. Run the app on the emulator

With the emulator booted (or a physical phone connected via USB with **USB debugging** enabled and `adb devices` showing it), from `frontend/`:

```powershell
npx expo run:android
```

This compiles the native app (dev-client), installs it on the emulator/device, and starts the Metro bundler. Wait for the VULCAN splash (wordmark on near-black) — you should land on the **Welcome** screen.

> First `run:android` triggers a full Gradle build (~5–15 min). Later runs are fast.

### Subsequent dev sessions

Once installed, just start Metro and press `a` (or open the app manually — it auto-connects to the dev server):

```powershell
npx expo start
```

Rebuild after native dependency changes (new `expo-*` package, config plugin, etc.): `npx expo run:android` again.

## 6. Pointing the app at your backend (later phases)

The Android emulator reaches your dev machine's `localhost` via **`10.0.2.2`** (not `localhost`). For Phase 0's FastAPI proof and Phase 4+ AI routes, set in `frontend/.env`:

```
EXPO_PUBLIC_API_URL=http://10.0.2.2:8000
```

Physical device: use your PC's LAN IP, e.g. `http://192.168.1.50:8000`, and ensure port 8000 is reachable on the local network.

Start the FastAPI backend from `backend/`:

```powershell
.\.venv\Scripts\python -m uvicorn app.main:app --host 0.0.0.0 --port 8000
```

Then on the **Today** tab, tap **"Verify FastAPI (Phase 0 proof)"** — it calls `/health/protected` with your Supabase access token and shows the server-side `user_id` (JWT verified against Supabase's JWKS).

## 7. Testing auth (current feature)

With the app on the emulator:

1. **Sign up** → Welcome → "Continue with email" → "Create account" → email + password.
   - If Supabase has **email confirmation enabled**, you'll get "Check your email…" — confirm via the link, then log in.
   - To skip confirmation during dev: Supabase dashboard → Authentication → Providers/email → toggle off **Confirm email**.
2. **Log in** → you should be routed to the 5-tab shell (raised orange **Train** button in the center).
3. **Sign out** → Profile tab → Sign out → back to Welcome.
4. **Session persistence** → log in, kill the app (swipe away), reopen — you should land on the tabs (session stored in SecureStore).

## 8. Troubleshooting

| Symptom | Fix |
|---|---|
| `emulator: ERROR: x86_64 emulation currently requires hardware acceleration` | Install the Android Emulator hypervisor driver (SDK Manager → SDK Tools) or enable Windows Hypervisor Platform. |
| `adb: command not found` | Add `%ANDROID_HOME%\platform-tools` to PATH; check `ANDROID_HOME`. |
| App installs but shows blank white | Metro dev server not running — run `npx expo start` then press `a`. |
| Gradle build fails on JDK | Point `JAVA_HOME` at Android Studio's bundled JBR (17+). |
| Emulator slow / won't boot | Cold boot from Device Manager dropdown; increase RAM in AVD settings; close other apps. |
| `expo run:android` complains about SDK location | Ensure `ANDROID_HOME` is set and contains `platform-tools`, `platforms`, `build-tools`. Quick fix: create `android\local.properties` with `sdk.dir=C\:\\Users\\<you>\\AppData\\Local\\Android\\Sdk` (default SDK location). |
| Port conflict on Metro (8081) | `npx expo start --port 8082` and press `a`. |

## 9. Physical device (alternative to emulator)

- Enable **Developer options** → **USB debugging** on the phone.
- Connect via USB, run `adb devices` (accept the RSA prompt on the phone).
- From `frontend/`: `npx expo run:android` — installs the dev build on the phone. This is also the path for testing Health Connect (Phase 3), which the emulator can't do.