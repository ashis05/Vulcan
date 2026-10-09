# PHASE 7 — Hardening & Launch

**Goal:** Production deployment of the API, app-wide polish, and a Play Store internal-track release.

**Depends on:** Phases 0–6 complete.

## API deployment (AWS EC2 + Cloudflare Tunnel)

Runbook: `deployment/` (index `deployment/README.md`). Locked approach: Docker on a single
**AWS EC2 instance** provisioned with **Terraform** (`deployment/terraform/`), published via an
**outbound-only Cloudflare Tunnel** (no Caddy, no open inbound ports, no TLS certs on the
instance). Domain: `api-vulcan.ashiswadhwani.in`.

1. **Dockerize** — `backend/Dockerfile` (python:3.12-slim, uvicorn with `--proxy-headers`, non-root user) + `backend/.dockerignore` + `backend/deploy/docker-compose.yml` (`api` + `cf-tunnel`). Build **on the instance** (native arch), so no cross-platform build is needed. Default instance `t4g.micro` (2 vCPU burstable / 1 GB ARM) with a 2 GB swapfile; bump to `t4g.small` if the build needs more headroom. Region `ap-south-1`.
2. **Server setup** — Terraform provisions the VPC + EC2 + Elastic IP and `user_data.sh` installs Docker + the Compose plugin; `backend/.env` via `--env-file`; the tunnel runs from a locally-managed `~/vulcan/cloudflared/config.yml` mounted into `cf-tunnel`; `docker compose up -d --build`; `restart: unless-stopped`. **Security group opens only port 22** — the tunnel dials out on 7844; no inbound 80/443.
3. **Hardening** — `ALLOWED_ORIGINS` locked to `https://api-vulcan.ashiswadhwani.in`, structured logging, `/health` wired to a free uptime check. FastAPI bodies are tiny (`{photo_path, hint}`) — the app uploads photos to Supabase Storage, so no request size limit is needed on the API.
4. Point `EXPO_PUBLIC_API_URL` at the production domain for release builds — set as an **EAS environment variable** (cloud builds don't read `frontend/.env`).
5. **CI/CD** — GitHub Actions: `ci.yml` checks on PRs; `deploy-backend.yml` (manual, master-only) rsyncs `backend/` to the VM and rebuilds; `build-frontend.yml` (manual) runs EAS.

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

- [ ] API serves production traffic over HTTPS from the AWS EC2 instance; app release build talks to it
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
