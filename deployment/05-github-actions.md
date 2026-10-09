# 5. GitHub Actions

Three workflows in `.github/workflows/`:

| Workflow | Trigger | Purpose |
|---|---|---|
| `ci.yml` | `pull_request`, `workflow_dispatch` | Checks: backend pytest, frontend tsc/lint/vitest, Docker image build |
| `deploy-backend.yml` | `workflow_dispatch` (master only) | rsync `backend/` to the EC2 instance, `docker compose up -d --build` |
| `build-frontend.yml` | `workflow_dispatch` | EAS cloud build of the Android app |

Deploys are deliberately **manual** and the backend deploy **fails unless dispatched from
`master`**. PRs get checks only (no deploy).

## 5.1 Repository secrets

Settings → Secrets and variables → Actions → **New repository secret**.

| Secret | Used by | Value |
|---|---|---|
| `SSH_HOST` | deploy-backend | EC2 Elastic IP (`terraform output elastic_ip`) |
| `SSH_USER` | deploy-backend | `ubuntu` (default for Ubuntu AMIs) |
| `SSH_PRIVATE_KEY` | deploy-backend | Private key matching the `ssh_public_key` used by Terraform (`~/.ssh/vulcan_deploy`) |
| `EXPO_TOKEN` | build-frontend | Expo access token (expo.dev → Account → Access tokens) |

`GITHUB_TOKEN` is provided automatically and only needs `contents: read` (already set).

### Creating the deploy key

```cmd
ssh-keygen -t ed25519 -C "vulcan-deploy" -f %USERPROFILE%\.ssh\vulcan_deploy -N ""
```

The public half (`vulcan_deploy.pub`) goes into `terraform.tfvars` as `ssh_public_key`
(so EC2 authorizes it on creation). The private half goes into the GitHub secret —
copy it with:

```cmd
type %USERPROFILE%\.ssh\vulcan_deploy | clip
```

## 5.2 Running a deploy

1. Actions → **Deploy Backend** → Run workflow → branch **`master`** → Run.
2. It rsyncs `backend/` (excluding `.venv`, caches, `.env`, `tests`, `scripts`; the instance's
   `.env` is preserved) and rebuilds/restarts the containers.
3. On completion, confirm `https://api-vulcan.ashiswadhwani.in/health`.

Frontend: Actions → **Build Frontend (EAS)** → Run workflow → pick `preview`/`production`.
The run log prints the EAS build URL and, on success, the artifact link.

## 5.3 What CI checks

- **Backend:** `pip install -r requirements.txt -r requirements-dev.txt` → `compileall` →
  `pytest -q`. `SUPABASE_URL` is set to a placeholder and `QUOTA_ENABLED=false`; all I/O is
  mocked, so no real secrets or DB are touched.
- **Frontend:** `npm ci` → `npm run typecheck` (`tsc --noEmit`) → `npm run lint` (`expo lint`)
  → `npm run test` (`vitest run`). Placeholder `EXPO_PUBLIC_*` values are provided because the
  Supabase client validates them at import.
- **Docker:** builds `backend/Dockerfile` to catch packaging/requirements regressions.

## 5.4 Adding more checks (optional)

- **Backend lint:** add `ruff` to `requirements-dev.txt` with a `pyproject.toml`/`ruff.toml`,
  then a `ruff check app` step.
- **Frontend bundle:** `npx expo export --platform web` as a heavier smoke test.
- **Tunnel/uptime:** point a free uptime monitor at `/health`.

Next: [06-troubleshooting.md](06-troubleshooting.md).
