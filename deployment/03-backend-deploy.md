# 3. Backend deploy

The API runs as two containers (`api` + `cf-tunnel`) via `backend/deploy/docker-compose.yml`.
Deploys **rsync the source to the EC2 instance and rebuild the image there**.

## 3.1 Server secrets: `~/vulcan/backend/.env`

Create the file on the instance once. It is gitignored and never synced (the rsync excludes `.env`).

```bash
# on the EC2 instance
nano ~/vulcan/backend/.env
```

```dotenv
SUPABASE_URL=https://<project-ref>.supabase.co
ALLOWED_ORIGINS=https://api-vulcan.ashiswadhwani.in
# Session-pooler URI — required at runtime (see notes). Same value as local backend/.env.
DATABASE_URL=postgresql://postgres.<project-ref>:<db-password>@aws-0-<region>.pooler.supabase.com:5432/postgres
SUPABASE_SERVICE_ROLE_KEY=<service-role-key>
GEMINI_API_KEY=<gemini-api-key>
GEMINI_MODEL=gemini-3.1-flash-lite
QUOTA_ENABLED=true
QUOTA_FOOD_PER_DAY=5
QUOTA_PROGRAM_PER_DAYS=7
QUOTA_PHYSIQUE_PER_DAYS=7
```

Guard it:

```bash
chmod 600 ~/vulcan/backend/.env
```

Notes:
- **`DATABASE_URL` is required on the server.** The AI routes (quota checks, `ai_calls`
  logging, program context/materialization) and `/foods/search` query Postgres directly via
  SQLAlchemy, so without it every DB-backed route returns **HTTP 500**. Use the same
  session-pooler URI as your local `backend/.env`.
- Migrations still run from your dev machine (see 3.4); the server only needs the URI at runtime.
- `GEMINI_MODEL` and the `QUOTA_*` values are optional (defaults apply) but documenting them
  avoids surprises.

## 3.2 First deploy (manual, from your machine)

Two options — pick one.

**Option A — GitHub Actions (recommended after setup):** run the **Deploy Backend** workflow
from the `master` branch (see [05-github-actions.md](05-github-actions.md)).

**Option B — manual copy from the repo root (Windows cmd):**

```cmd
tar -czf - --exclude=.venv --exclude=__pycache__ --exclude=.pytest_cache --exclude=.env --exclude=tests --exclude=scripts backend | ssh -i "%USERPROFILE%\.ssh\vulcan_deploy" ubuntu@<EIP> "mkdir -p ~/vulcan/backend && tar -xzf - -C ~/vulcan/backend --strip-components=1"
```

Then on the instance:

```bash
cd ~/vulcan/backend
docker compose --env-file .env -f deploy/docker-compose.yml up -d --build
docker compose --env-file .env -f deploy/docker-compose.yml ps
docker compose --env-file .env -f deploy/docker-compose.yml logs -f api
```

Verify: `curl -s https://api-vulcan.ashiswadhwani.in/health` → `{"status":"ok"}`.

## 3.3 Updating

Any code change → rerun the workflow, or repeat the rsync + `up -d --build` above. Because the
compose project is named and `restart: unless-stopped`, only changed containers are recreated.
`docker image prune -f` after deploy drops the old image layers.

## 3.4 Migrations

Migrations are **not** part of the deploy — the API doesn't use a direct DB connection. Run
them from your dev machine against Supabase (session pooler URI in `backend/.env` locally):

```cmd
cd /d "D:\Personal Projects\Vulcan\backend"
.\.venv\Scripts\python -m alembic upgrade head
```

Current head: `0010_physique`. Never edit an applied revision — add a new one.

## 3.5 Rebuild triggers

The image rebuilds when `backend/` changes. Rebuild manually after editing the `Dockerfile`,
`requirements.txt`, or `deploy/docker-compose.yml`.

Next: [04-frontend-eas.md](04-frontend-eas.md).
