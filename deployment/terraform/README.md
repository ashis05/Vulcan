# VULCAN Terraform — AWS EC2

Provisions a single EC2 instance that hosts the FastAPI API and its Cloudflare
Tunnel. Everything runs in a dedicated VPC with one public subnet and an
Internet Gateway.

## What it creates

| Resource | Purpose | Cost |
|---|---|---|
| VPC + 1 public subnet + IGW + route table | Networking | $0 |
| Security group | Inbound 22 only, all outbound | $0 |
| Key pair | SSH (from `ssh_public_key`) | $0 |
| EC2 instance (`t4g.micro` default) | Runs `api` + `cf-tunnel` containers | ~$4/mo |
| Elastic IP | Stable SSH/deploy host | ~$3.65/mo |
| gp3 root volume (16 GB) | OS + Docker images + swap | ~$1.46/mo |
| user_data bootstrap | Docker, compose plugin, 2 GB swap, app dir | $0 |

No NAT gateway, no load balancer, no database — the API is stateless and talks
to Supabase/Gemini outbound. Data transfer out is free up to 100 GB/mo and the
API payloads are tiny, so egress is ~$0.

## Cost estimate (ap-south-1, on-demand, running 24/7)

| Instance | Shape | $/mo + EBS + IPv4 |
|---|---|---|
| `t4g.nano` | 2 vCPU burstable / 0.5 GB, arm64 | ~$6.4 |
| **`t4g.micro`** | 2 vCPU burstable / 1 GB, arm64 | **~$9.2** |
| `t3a.micro` | 2 vCPU burstable / 1 GB, x86 | ~$9.7 |
| `t3.micro` | 2 vCPU burstable / 1 GB, x86 | ~$13.3 (free-tier eligible) |
| `t4g.small` | 2 vCPU burstable / 2 GB, arm64 | ~$13.7 |

## Usage

Prerequisites: Terraform >= 1.6, AWS credentials for the target account
(`aws configure`, or `AWS_PROFILE`/env vars), and an SSH key.

```cmd
cd /d "D:\Personal Projects\Vulcan\deployment\terraform"
copy /y terraform.tfvars.example terraform.tfvars
REM edit terraform.tfvars: set ssh_public_key (contents of your .pub) and any overrides

terraform init
terraform fmt
terraform validate
terraform plan
terraform apply
```

Then:

```cmd
terraform output elastic_ip
terraform output ssh_command
```

First boot takes ~1–2 minutes (Docker install). Check it finished:

```bash
ssh ubuntu@<eip> 'cat /var/log/vulcan-bootstrap.log'   # "vulcan bootstrap complete"
```

Next: follow `../02-cloudflare-tunnel.md` and `../03-backend-deploy.md`.

## Changing instance size

Set `instance_type` (and matching `ami_architecture`) in `terraform.tfvars`,
then `terraform apply`. Changing the type is an in-place resize; changing the
architecture replaces the instance (new AMI), so the root volume and any files
on it — including `backend/.env` — are lost.

## Teardown

```cmd
terraform destroy
```

This deletes the instance, its root volume, and the Elastic IP. There is no
persistent state to lose (Supabase holds the data), but you will re-create
`~/vulcan/backend/.env` on any replacement instance.

## Notes

- State is local (`terraform.tfstate`, gitignored). For a personal project that
  is fine; switch to an S3 backend later if you want shared/locked state.
- Secrets never enter Terraform. `GEMINI_API_KEY` and the Supabase key live only in
  `~/vulcan/backend/.env` on the instance; the Cloudflare Tunnel credentials live in
  `~/vulcan/cloudflared/` (see `../02-cloudflare-tunnel.md`).
- SSH defaults to `ssh_allowed_cidrs = ["0.0.0.0/0"]` (key-only) so GitHub
  Actions can reach it. Restrict this when you stop deploying from runners.
