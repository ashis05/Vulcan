# VULCAN Deployment

Deploying VULCAN: the FastAPI AI proxy runs in Docker on a single **AWS EC2
instance** (provisioned with **Terraform**), published to the internet through an
**outbound-only Cloudflare Tunnel** (no open inbound ports, no TLS certificates
to manage). The Android app is built with **EAS** and distributed on an internal
track. CI/deploys run from **GitHub Actions**.

- Public API hostname: **`api-vulcan.ashiswadhwani.in`**
- AWS account: CLI profile **`vulcan-prod`** (account `905418101086`), region `ap-south-1`.
  The Terraform provider is pinned to it via `aws_profile` in `terraform.tfvars`.
- Repo: `github.com/ashis05/Vulcan` (public)
- EC2 path: `~/vulcan/backend` (source) + `~/vulcan/backend/deploy` (compose)
- IaC: [`terraform/`](terraform/README.md) — VPC + EC2 + Elastic IP
- Cost: **~$9/mo** on `t4g.micro` (`$0` + ~$9 for the instance, EBS, and IPv4;
  Cloudflare / EAS / Supabase / Gemini stay free).

## Architecture

```
Android APK (EAS internal)
  ├─ supabase-js ─────────────────────────────► Supabase (hosted Postgres/RLS/Storage/Auth)
  └─ https://api-vulcan.ashiswadhwani.in ─────► Cloudflare edge (TLS termination)
                                                     │  outbound-only tunnel (QUIC 7844)
      AWS EC2 (t4g.micro) ┌──────────────────────────┘
                          │  cf-tunnel (cloudflared) ──► api:8000 (uvicorn container)
                          └── docker compose; SG opens 22 only (no inbound 80/443)
```

The API is **stateless**: it talks to Supabase over HTTPS with the service-role
key and to Gemini. There is no local database, so nothing persistent lives on the
EC2 instance (no NAT gateway, no load balancer, no RDS).

## Deploy flow

```
PR opened/updated   → CI workflow (pytest · tsc · lint · vitest · docker build)
merge to master     → nothing automatic
terraform apply     → (one-time / on instance changes) VPC + EC2 + Elastic IP
Run workflow        → "Deploy Backend"   (workflow_dispatch, master only)
                    → rsync backend/ to EC2 → docker compose up -d --build
Run workflow        → "Build Frontend (EAS)" (workflow_dispatch) → EAS builds the APK/AAB
```

## Command shells

The runbooks label every command block: **cmd** = your Windows PC; **bash** = typed on the
EC2 instance after SSH (Ubuntu is Linux, so those are unavoidably bash). Start with
[00-STEP-BY-STEP.md](00-STEP-BY-STEP.md).

## Read in order

| # | Doc | Covers |
|---|-----|--------|
| 0 | [00-STEP-BY-STEP.md](00-STEP-BY-STEP.md) | **Start here** — the whole deploy, end to end, copy-paste |
| 1 | [01-aws-ec2.md](01-aws-ec2.md) | Provision the instance with Terraform (size, region, VPC, Docker, swap) |
| 2 | [02-cloudflare-tunnel.md](02-cloudflare-tunnel.md) | Tunnel + public hostname + token |
| 3 | [03-backend-deploy.md](03-backend-deploy.md) | Server `.env`, first deploy, updates, migrations |
| 4 | [04-frontend-eas.md](04-frontend-eas.md) | Expo/EAS project, env vars, build, Auth redirect |
| 5 | [05-github-actions.md](05-github-actions.md) | Repo secrets and workflow reference |
| 6 | [06-troubleshooting.md](06-troubleshooting.md) | Common failures |
| — | [terraform/README.md](terraform/README.md) | Terraform module: resources, cost, teardown |

## One-time checklist

- [ ] AWS account with billing/credits; AWS CLI **`vulcan-prod`** profile configured
- [ ] SSH deploy key generated (`~/.ssh/vulcan_deploy`)
- [ ] Terraform >= 1.6 installed; `deployment/terraform/terraform.tfvars` written
- [ ] `terraform apply` complete; Elastic IP noted (`terraform output elastic_ip`)
- [ ] Docker installed on the instance by `user_data`; `~/vulcan/backend` created
- [ ] `backend/.env` written on the instance (secrets, never committed)
- [ ] Cloudflare tunnel created; `api-vulcan.ashiswadhwani.in` → `http://api:8000`
- [ ] `https://api-vulcan.ashiswadhwani.in/health` returns `{"status":"ok"}`
- [ ] Expo account + `eas init` (adds `extra.eas.projectId` to `app.json`)
- [ ] EAS environment variables set (`EXPO_PUBLIC_*` per environment)
- [ ] Supabase Auth redirect allowlist includes `vulcan://`
- [ ] GitHub secrets added (`SSH_HOST` = Elastic IP, `SSH_USER` = `ubuntu`); first "Deploy Backend" and "Build Frontend (EAS)" runs green

## Conventions

- Secrets live only in the instance's `backend/.env`, the tunnel credentials
  (`~/vulcan/cloudflared/<tunnel-id>.json` + `config.yml`), and in GitHub Actions secrets.
  Never commit `.env` files, tunnel credentials, the Supabase service-role key, or the
  Gemini key. Terraform manages no secrets.
- The app ships only `EXPO_PUBLIC_*` values (Supabase URL + anon key + API URL).
- The Cloudflare tunnel is outbound-only: do **not** open ports 80/443 in the
  security group. Port 22 (SSH) is the only inbound rule.
