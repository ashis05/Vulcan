# PHASE 7 — Hardening & Launch

**Goal:** Production deployment of the API, app-wide polish, and a Play Store internal-track release.

**Depends on:** Phases 0–6 complete.

## API deployment (Oracle Always Free)

1. **Dockerize** — `backend/Dockerfile` (python:3.12-slim, uvicorn with workers, non-root user), `.dockerignore`. Note: Oracle free tier is often **ARM64 (Ampere)** — build with `docker buildx --platform linux/arm64` or provision the AMD micro instance.
2. **Server setup** — Docker + Caddy (automatic HTTPS) on the VM; `.env` via `--env-file`; `docker compose up -d` (api + caddy services); restart policies; firewall: 443 only.
3. **Hardening** — `ALLOWED_ORIGINS` locked to the app scheme, request size limits (photos ≤8MB), structured logging, `/health` wired to uptime checks.
4. Point `EXPO_PUBLIC_API_URL` at the production domain for release builds.

## App hardening

5. **States pass** — every screen: loading skeleton, empty state, error state, offline banner (DESIGN.md §9).
6. **Crash reporting** — Sentry free tier (expo plugin).
7. **Legal/safety** — privacy policy + terms pages; disclaimers on onboarding, food confirm, physique analysis; data export + delete account (Play requirement) in S30.
8. **RLS audit** — checklist query per table: anonymous read fails, cross-user read fails. Verify storage policies the same way.
9. **Assets** — app icon (ember/anvil on near-black), adaptive icon, splash per S1; app name "VULCAN"; bundle id `app.vulcan.fitness` (or chosen variant).

## Release

10. `eas.json` production profile; `eas build -p android --profile production` → AAB.
11. Play Console: app listing (screenshots from a device), content rating, **Health Connect declaration** (steps read justification), data-safety form (photos, health data, AI processing disclosed).
12. Internal testing track → invite testers → smoke pass checklist.

## Done when

- [ ] API serves production traffic over HTTPS from the Oracle VM; app release build talks to it
- [ ] Full smoke pass on the release AAB: auth → onboarding → workout → steps → food scan → program → physique
- [ ] Sentry receives events from the release build
- [ ] Delete-account + export work (Play compliance)
- [ ] Health Connect declaration submitted; internal track live with at least one tester build installed
- [ ] `PLAN.md` phase table updated: all phases ✅

## Test plan

- Smoke checklist (above) executed on the production build, not dev.
- Load sanity: 20 sequential `/ai/analyze-food` calls — verify quota + Gemini rate behavior, observe `ai_calls` latency.

## Notes

- Post-launch backlog (explicitly out of v1): iOS build + Apple Health, social/leaderboards, paywall (quota system is ready for it), barcode food search, Wear OS.
- After launch, monitor `ai_calls` token spend weekly to decide the Gemini paid-tier flip.
