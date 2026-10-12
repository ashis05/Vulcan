# 0. Deploy VULCAN from scratch — step by step

A complete, copy-paste runbook: from an empty AWS account to a live API at
`https://api-vulcan.ashiswadhwani.in` and an installable Android APK.

Follow the steps in order. Each step ends with a **checkpoint** — confirm it before
moving on. Deep detail for any step lives in the sibling docs (`01`–`06`), linked inline.

## Two shells — read this first

There are **two machines**, and each uses different commands:

| Label | Machine | Shell | What runs there |
|---|---|---|---|
| **`LOCAL`** | your Windows PC | **cmd** | AWS CLI, Terraform, `ssh`, `scp`/`tar`, `curl` |
| **`SERVER`** | the EC2 instance | **bash** (Ubuntu) | `cloudflared`, `docker compose`, writing `config.yml` |

- **`LOCAL` blocks** (```cmd) are typed into the Windows **Command Prompt** (`Win+R` →
  `cmd`). Do **not** use PowerShell — the examples are cmd-specific.
- **`SERVER` blocks** (```bash) are typed **after** you SSH in (step 6). They are Linux
  bash because the server is Ubuntu — this is unavoidable; it's just a remote shell, not
  something you install locally.

**Target setup (already chosen for this project):**

| Thing | Value |
|---|---|
| AWS account (CLI profile) | `vulcan-prod` — account `905418101086` |
| AWS region | `ap-south-1` (Mumbai) |
| Instance | `t4g.micro` (arm64, 1 GB + 2 GB swap) |
| Public hostname | `api-vulcan.ashiswadhwani.in` (Cloudflare zone `ashiswadhwani.in`) |
| Repo | `github.com/ashis05/Vulcan` (`master` is the deploy branch) |
| Cost | ~$9/mo (EC2 + EBS + IPv4); Cloudflare/EAS/Supabase/Gemini stay free |

---

## Prerequisites (accounts & tools)

Have these ready before you start:

- [ ] **AWS** — CLI profile `vulcan-prod` configured (`aws configure` or `aws sso login`).
- [ ] **Terraform** ≥ 1.6 — `terraform -version`.
- [ ] **OpenSSH client** — `ssh -V` (bundled with Windows 10+).
- [ ] **`tar`** — `tar --version` (bundled with Windows 10 1803+; used for the first deploy).
- [ ] **Cloudflare** — `ashiswadhwani.in` is a zone, nameservers delegated (status "Active").
- [ ] **Supabase** — project created; you have the project URL, the **service-role** key,
      and the **anon** key.
- [ ] **Gemini** — API key from Google AI Studio.
- [ ] **Expo** — an account at expo.dev for EAS builds (step 10).
- [ ] **Repo cloned locally**, e.g. `D:\Personal Projects\Vulcan`.

Open **Command Prompt** and change into the repo before starting:

```cmd
cd /d "D:\Personal Projects\Vulcan"
```

---

## Step 1 — Point your terminal at the right AWS account

The provider is pinned to `aws_profile = "vulcan-prod"` (in `terraform.tfvars`), so
Terraform can't silently hit the wrong account. Set the env var too so plain `aws`
commands agree (`LOCAL`):

```cmd
set AWS_PROFILE=vulcan-prod
aws sts get-caller-identity
```

**Checkpoint:** `"Account": "905418101086"`. If you see `111491018377`, you are on the
old `default` account — stop and re-check your profile.

---

## Step 2 — Clean up the old `default`-account leftovers (one-time)

An earlier partial run created a VPC and an **unattached Elastic IP** in the `default`
account (`111491018377`). Idle EIPs are billed, so destroy them. This only affects the
old account; skip if you never ran `apply` there.

```cmd
cd /d "D:\Personal Projects\Vulcan\deployment\terraform"
terraform init
terraform destroy -var="aws_profile=default"
```

Type `yes` at the prompt. This removes the `vulcan-vpc`, subnet, IGW, route table,
security group, and releases the EIP `52.66.33.11`.

Then reset the local state so we start clean in `vulcan-prod`:

```cmd
del /q .terraform\terraform.tfstate*
```

Verify the old account is empty (optional):

```cmd
aws ec2 describe-addresses --profile default --region ap-south-1 --query "Addresses[].PublicIp" --output text
```

**Checkpoint:** no `52.66.33.11` listed.

---

## Step 3 — Generate the SSH deploy key

You don't have one yet. Create a dedicated key (don't use your personal `id_ed25519`):

```cmd
ssh-keygen -t ed25519 -C "vulcan-deploy" -f %USERPROFILE%\.ssh\vulcan_deploy -N ""
```

This writes:

- `%USERPROFILE%\.ssh\vulcan_deploy` — **private** (goes into the GitHub Action secret, step 11).
- `%USERPROFILE%\.ssh\vulcan_deploy.pub` — **public** (goes into Terraform, next step).

Print the public key to copy it:

```cmd
type %USERPROFILE%\.ssh\vulcan_deploy.pub
```

**Checkpoint:** one line starting `ssh-ed25519 AAAAC3...`.

---

## Step 4 — Configure `terraform.tfvars`

```cmd
copy /y terraform.tfvars.example terraform.tfvars
notepad terraform.tfvars
```

Open `deployment\terraform\terraform.tfvars` and set `ssh_public_key` to the **entire**
line printed above:

```hcl
aws_profile      = "vulcan-prod"
region           = "ap-south-1"
project          = "vulcan"
instance_type    = "t4g.micro"
ami_architecture = "arm64"
root_volume_gb   = 16
swap_size_gb     = 2

ssh_public_key   = "ssh-ed25519 AAAAC3... vulcan-deploy"   # <- paste the whole .pub line
ssh_allowed_cidrs = ["0.0.0.0/0"]
```

`terraform.tfvars` is gitignored — never commit it. Details: [01-aws-ec2.md](01-aws-ec2.md).

---

## Step 5 — Provision the infrastructure

From `deployment\terraform` (`LOCAL`):

```cmd
terraform init
terraform fmt
terraform validate
terraform plan
terraform apply
```

Type `yes`. This creates the VPC + public subnet + IGW, the security group (SSH 22 only),
the key pair, the EC2 instance, and an Elastic IP attached to it.

Note the outputs:

```cmd
terraform output elastic_ip
terraform output ssh_command
```

**Checkpoint:** `apply` completes; you have an Elastic IP; `terraform output instance_id`
returns an `i-...` id.

---

## Step 6 — First boot & SSH

`user_data.sh` installs Docker + compose plugin, adds a 2 GB swapfile, and creates
`~/vulcan/backend`. It takes ~1–2 minutes.

```cmd
ssh -i %USERPROFILE%\.ssh\vulcan_deploy ubuntu@<EIP> "cat /var/log/vulcan-bootstrap.log; docker --version; docker compose version"
```

**Checkpoint:** the log ends with `vulcan bootstrap complete`, and Docker prints versions.

Now **open a session** to the instance for the `SERVER` steps (keep it open):

```cmd
ssh -i %USERPROFILE%\.ssh\vulcan_deploy ubuntu@<EIP>
```

If Docker says "permission denied", log out/in (the `ubuntu` user was just added to the
`docker` group), or run `newgrp docker`.

---

## Step 7 — Create the Cloudflare Tunnel (locally-managed) — `SERVER`

Full detail: [02-cloudflare-tunnel.md](02-cloudflare-tunnel.md). Run these in the SSH
session from step 6.

```bash
# install cloudflared
sudo mkdir -p --mode=0755 /usr/share/keyrings
curl -fsSL https://pkg.cloudflare.com/cloudflare-main.gpg \
  | sudo tee /usr/share/keyrings/cloudflare-main.gpg >/dev/null
echo 'deb [signed-by=/usr/share/keyrings/cloudflare-main.gpg] https://pkg.cloudflare.com/cloudflared any main' \
  | sudo tee /etc/apt/sources.list.d/cloudflared.list
sudo apt-get update && sudo apt-get install -y cloudflared

# log in: open the printed URL in a browser (on your PC), pick the ashiswadhwani.in zone
cloudflared tunnel login

# create the tunnel — note the UUID it prints
cloudflared tunnel create vulcan-api

# create the proxied CNAME api-vulcan.ashiswadhwani.in -> <UUID>.cfargotunnel.com
cloudflared tunnel route dns vulcan-api api-vulcan.ashiswadhwani.in

# config + credentials OUTSIDE backend/ (the deploy uses --delete)
mkdir -p ~/vulcan/cloudflared
cp ~/.cloudflared/<UUID>.json ~/vulcan/cloudflared/
nano ~/vulcan/cloudflared/config.yml
```

`config.yml`:

```yaml
tunnel: <UUID>
credentials-file: /etc/cloudflared/<UUID>.json
ingress:
  - hostname: api-vulcan.ashiswadhwani.in
    service: http://api:8000
  - service: http_status:404
```

```bash
chmod 700 ~/vulcan/cloudflared
chmod 600 ~/vulcan/cloudflared/config.yml ~/vulcan/cloudflared/<UUID>.json
```

> The compose `cf-tunnel` service mounts `~/vulcan/cloudflared` read-only, runs as uid 1000
> (so it can read the `0600` files), and runs this config. The security group opens **only
> port 22**; `cloudflared` dials out — no inbound 80/443, no TLS certs on the box.

**Checkpoint:** the CNAME appears in Cloudflare **DNS → Records** (Proxied).

---

## Step 8 — Write the server secrets (`~/vulcan/backend/.env`) — `SERVER`

```bash
nano ~/vulcan/backend/.env
```

Paste (fill the `<...>` values):

```dotenv
SUPABASE_URL=https://<project-ref>.supabase.co
ALLOWED_ORIGINS=https://api-vulcan.ashiswadhwani.in
# Session-pooler URI — required (see note below). Same value as local backend/.env.
DATABASE_URL=postgresql://postgres.<project-ref>:<db-password>@aws-0-<region>.pooler.supabase.com:5432/postgres
SUPABASE_SERVICE_ROLE_KEY=<service-role-key>
GEMINI_API_KEY=<gemini-api-key>
GEMINI_MODEL=gemini-3.1-flash-lite
QUOTA_ENABLED=true
QUOTA_FOOD_PER_DAY=5
QUOTA_PROGRAM_PER_DAYS=7
QUOTA_PHYSIQUE_PER_DAYS=7
```

Save, then lock it down:

```bash
chmod 600 ~/vulcan/backend/.env
```

> `DATABASE_URL` **is** required here: the AI routes (quota/`ai_calls`) and `/foods/search`
> query Postgres directly, so without it those routes return HTTP 500. Use the same
> session-pooler URI as your local `backend/.env`. Migrations still run from your dev machine
> (step 12). These secrets live only on the instance and are never committed. Details:
> [03-backend-deploy.md](03-backend-deploy.md).

---

## Step 9 — First backend deploy

The GitHub Action (step 12) is the normal path, but it needs the repo pushed with the
workflows — so do a one-off manual copy first. From the **repo root** (`LOCAL`):

```cmd
cd /d "D:\Personal Projects\Vulcan"
tar -czf - --exclude=.venv --exclude=__pycache__ --exclude=.pytest_cache --exclude=.env --exclude=tests --exclude=scripts backend | ssh -i "%USERPROFILE%\.ssh\vulcan_deploy" ubuntu@<EIP> "mkdir -p ~/vulcan/backend && tar -xzf - -C ~/vulcan/backend --strip-components=1"
```

This streams `backend/` to the instance (excluding `.venv`, caches, `.env`, `tests`,
`scripts`; the server's `.env` is preserved). Then **`SERVER`**:

If your Windows `tar` chokes on the binary pipe, write a tarball first:
`tar -czf backend.tgz --exclude ... backend` then
`scp -i "%USERPROFILE%\.ssh\vulcan_deploy" backend.tgz ubuntu@<EIP>:~/` and extract on the
server with `tar -xzf ~/backend.tgz -C ~/vulcan/backend --strip-components=1`.

```bash
cd ~/vulcan/backend
docker compose --env-file .env -f deploy/docker-compose.yml up -d --build
docker compose --env-file .env -f deploy/docker-compose.yml ps
```

Both `api` and `cf-tunnel` should be **Up** (api `healthy`).

**Checkpoint (`LOCAL`):**

```cmd
curl -s https://api-vulcan.ashiswadhwani.in/health
```

`{"status":"ok"}`. If it 502s, see [06-troubleshooting.md](06-troubleshooting.md).

---

## Step 10 — Supabase auth redirect

Google sign-in uses the app scheme `vulcan://`. In Supabase → **Authentication → URL
Configuration → Redirect URLs**, add:

```
vulcan://
```

**Checkpoint:** the URL is listed and saved.

---

## Step 11 — Frontend build (EAS) — `LOCAL`

Full detail: [04-frontend-eas.md](04-frontend-eas.md).

```cmd
cd /d "D:\Personal Projects\Vulcan\frontend"
npm install -g eas-cli
eas login
eas init
```

Set the `EXPO_PUBLIC_*` values for the build environment (EAS cloud builds do **not** read
your local `frontend/.env`):

```cmd
eas env:set --name EXPO_PUBLIC_SUPABASE_URL      --value "https://<project-ref>.supabase.co"    --environment preview --visibility plaintext
eas env:set --name EXPO_PUBLIC_SUPABASE_ANON_KEY --value "<anon-key>"                            --environment preview --visibility plaintext
eas env:set --name EXPO_PUBLIC_API_URL           --value "https://api-vulcan.ashiswadhwani.in"  --environment preview --visibility plaintext
eas env:set --name EXPO_PUBLIC_AI_QUOTA_ENABLED  --value "true"                                  --environment preview --visibility plaintext
```

Repeat with `--environment production` for release builds. Build the internal APK:

```cmd
eas build --platform android --profile preview
```

EAS prints an install link/QR. Install on your device.

**Checkpoint:** the app launches and reaches the API (health + an AI action) over the tunnel.

---

## Step 12 — CI/CD via GitHub Actions

Full detail: [05-github-actions.md](05-github-actions.md). Commit + push the deployment
files first, then add repository secrets (**Settings → Secrets and variables → Actions**):

| Secret | Value |
|---|---|
| `SSH_HOST` | the Elastic IP (`terraform output elastic_ip`) |
| `SSH_USER` | `ubuntu` |
| `SSH_PRIVATE_KEY` | the **private** key — copy it with: `type %USERPROFILE%\.ssh\vulcan_deploy \| clip` |
| `EXPO_TOKEN` | Expo access token (expo.dev → Account → Access tokens) |

Then, from `master`:

- **Actions → Deploy Backend → Run workflow** (master only) — rsyncs + rebuilds on the box.
- **Actions → Build Frontend (EAS) → Run workflow** — pick `preview` or `production`.

**Checkpoint:** both runs go green.

### Migrations (from your dev machine, against Supabase)

The API has no direct DB connection, so migrations are a local step (`LOCAL`):

```cmd
cd /d "D:\Personal Projects\Vulcan\backend"
.\.venv\Scripts\python -m alembic upgrade head
```

Current head: `0010_physique`.

---

## Step 13 — End-to-end smoke test

On the installed APK, in order:

1. Google sign-in → onboarding.
2. Log a workout (kill/resume mid-session).
3. Steps sync + nutrition diary.
4. Food scan (AI) → confirm → log.
5. Forge a program → apply.
6. Progress check-in → analyze (physique).

---

## Day-to-day operations

- **Update the API:** run **Deploy Backend** from `master` (or repeat the step-9 `tar` pipe +
  `docker compose ... up -d --build`).
- **Change server secrets:** edit `~/vulcan/backend/.env`, then
  `docker compose --env-file .env -f deploy/docker-compose.yml up -d`.
- **Change instance size:** edit `instance_type`/`ami_architecture` → `terraform apply`
  (same arch = in-place resize; arch change replaces the instance and its root volume).

## Teardown

From `deployment\terraform` (`LOCAL`):

```cmd
terraform destroy
```

Deletes the instance, root volume, and EIP. Supabase holds all data, so nothing persistent
is lost (you'll re-create `~/vulcan/backend/.env` on any replacement host).

## Command cheat-sheet

| Task | Where | Command |
|---|---|---|
| Identity | LOCAL | `aws sts get-caller-identity --profile vulcan-prod` |
| Provision | LOCAL | `cd /d "D:\Personal Projects\Vulcan\deployment\terraform" && terraform apply` |
| SSH | LOCAL | `ssh -i %USERPROFILE%\.ssh\vulcan_deploy ubuntu@<EIP>` |
| Logs | SERVER | `cd ~/vulcan/backend && docker compose --env-file .env -f deploy/docker-compose.yml logs -f api` |
| Health | LOCAL | `curl -s https://api-vulcan.ashiswadhwani.in/health` |
| Teardown | LOCAL | `cd /d "D:\Personal Projects\Vulcan\deployment\terraform" && terraform destroy` |

Next: [01-aws-ec2.md](01-aws-ec2.md) for provisioning detail ·
[06-troubleshooting.md](06-troubleshooting.md) when something breaks.
