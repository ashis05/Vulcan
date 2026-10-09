# 4. Frontend (EAS Build)

The app is a native Expo (dev-client) Android build. `frontend/eas.json` defines three
profiles; releases are built on EAS servers and distributed on an internal track.

## 4.1 One-time project setup

```cmd
cd /d "D:\Personal Projects\Vulcan\frontend"
npm install -g eas-cli        # or use npx eas-cli
eas login                     # create an account at https://expo.dev if needed
eas init                      # links the project, writes extra.eas.projectId into app.json
eas build:configure           # (eas.json already exists — this just verifies it)
```

`eas init` modifies `app.json` to add `expo.extra.eas.projectId` and `expo.owner`. Commit that.

## 4.2 Environment variables (critical)

EAS cloud builds do **not** see your gitignored `frontend/.env`. Set the values on EAS and
reference them per profile via `"environment"` in `eas.json`.

```cmd
cd /d "D:\Personal Projects\Vulcan\frontend"
eas env:set --name EXPO_PUBLIC_SUPABASE_URL      --value "https://<project-ref>.supabase.co" --environment preview      --visibility plaintext
eas env:set --name EXPO_PUBLIC_SUPABASE_ANON_KEY --value "<anon-key>"                        --environment preview      --visibility plaintext
eas env:set --name EXPO_PUBLIC_API_URL           --value "https://api-vulcan.ashiswadhwani.in" --environment preview    --visibility plaintext
eas env:set --name EXPO_PUBLIC_AI_QUOTA_ENABLED  --value "true"                              --environment preview      --visibility plaintext

# repeat with --environment production for release builds
eas env:list --environment preview
```

`eas.json` maps: `development → environment development`, `preview → preview`,
`production → production`. Independent of EAS, local dev still uses `frontend/.env`.

> Do not use `secret` visibility for `EXPO_PUBLIC_*` — they must be inlined into the JS
> bundle at build time. `plaintext` (or `sensitive`) is correct.

## 4.3 Supabase auth redirect

Google sign-in uses PKCE with the app scheme `vulcan://`. In the Supabase dashboard:
Authentication → URL Configuration → **Redirect URLs** → add `vulcan://`. Without it the
OAuth callback is rejected on release builds.

## 4.4 Build

**Via GitHub Actions:** run the **Build Frontend (EAS)** workflow and choose `preview` or
`production` (see [05-github-actions.md](05-github-actions.md)). Requires the `EXPO_TOKEN`
secret.

**Locally:**

```cmd
cd /d "D:\Personal Projects\Vulcan\frontend"
eas build --platform android --profile preview      # internal-distribution APK
```

EAS prints a build page with a QR/install link. Install the APK on the device, then smoke-test
against production: auth → onboarding → workout → steps → food scan → program → physique.

## 4.5 Profiles

| Profile | Output | Distribution | Use |
|---|---|---|---|
| `development` | APK (dev client) | internal | Debugging on device with `npx expo start` |
| `preview` | APK | internal | Tester builds / internal track |
| `production` | AAB | Play Store | Release; `autoIncrement` bumps versionCode |

The production AAB needs a Google Play developer account ($25 one-time) and the Health Connect
declaration before it can reach a track — see `phases/PHASE-7-launch.md`.

## 4.6 Android signing

EAS manages the keystore. First build generates it; manage with `eas credentials`. **Back it
up** — losing it prevents updating an already-published app.

Next: [05-github-actions.md](05-github-actions.md).
