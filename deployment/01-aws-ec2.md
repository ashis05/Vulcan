# 1. AWS EC2 (Terraform)

The API host is a single **EC2 instance** in a dedicated VPC (one public subnet +
Internet Gateway), reached over SSH at a stable **Elastic IP**. Provisioning is
fully declared in [`terraform/`](terraform/README.md).

Because the API is published by an **outbound-only Cloudflare Tunnel**, the
security group opens only **port 22** — there are no inbound 80/443 rules, no
TLS certificates on the instance, and no NAT gateway.

## Prerequisites

- An AWS account with credits/billing enabled, and credentials with permission
  to manage VPC, EC2, and Elastic IPs (`aws configure`, an `AWS_PROFILE`, or env
  vars). Verify with `aws sts get-caller-identity`.
- **Terraform >= 1.6** (`terraform -version`).
- An SSH keypair for deploys. This runbook assumes `~/.ssh/vulcan_deploy` (see
  [05-github-actions.md](05-github-actions.md)); any ed25519/RSA key works.

## Choose the instance size

The API is stateless, I/O-bound (waiting on Supabase/Gemini), and tiny; the only
demanding moment is the on-VM Docker image build. All options below are
2-vCPU **burstable** — the fraction is the sustained baseline, bursting to 2.

| `instance_type` | `ami_architecture` | RAM | $/mo + EBS + IPv4 | Notes |
|---|---|---|---|---|
| `t4g.nano` | `arm64` | 0.5 GB | ~$6.4 | Needs the swapfile; tightest |
| **`t4g.micro`** | `arm64` | **1 GB** | **~$9.2** | Default; 2 GB swap covers the build |
| `t3a.micro` | `amd64` | 1 GB | ~$9.7 | x86 alternative |
| `t3.micro` | `amd64` | 1 GB | ~$13.3 | Free-tier eligible (750 h) on classic accounts |
| `t4g.small` | `arm64` | 2 GB | ~$13.7 | Zero build-memory pain |

`ami_architecture` **must match** the instance family: `arm64` for `t4g`, `amd64`
for `t2`/`t3`/`t3a`.

## Provision

```cmd
cd /d "D:\Personal Projects\Vulcan\deployment\terraform"
copy /y terraform.tfvars.example terraform.tfvars
```

Edit `terraform.tfvars`:

- `ssh_public_key` — paste the contents of `~/.ssh/vulcan_deploy.pub`.
- `region` — `ap-south-1` (Mumbai) by default; keep it near Supabase/your users.
- `instance_type` / `ami_architecture` — optional overrides from the table above.

Then:

```cmd
terraform init
terraform fmt
terraform validate
terraform plan
terraform apply
```

`apply` creates the VPC, subnet, IGW, route table, security group, key pair,
instance, and Elastic IP. Note the outputs:

```cmd
terraform output elastic_ip
terraform output ssh_command
```

## First boot

`user_data.sh` (run once as root) installs Docker CE + the compose plugin, adds a
2 GB swapfile, enables `unattended-upgrades`, and creates `~/vulcan/backend`. It
does **not** install secrets. Wait ~1–2 minutes, then confirm:

```cmd
ssh -i "%USERPROFILE%\.ssh\vulcan_deploy" ubuntu@<EIP> "cat /var/log/vulcan-bootstrap.log"
ssh -i "%USERPROFILE%\.ssh\vulcan_deploy" ubuntu@<EIP> "docker --version && docker compose version"
```

If Docker complains about permissions, log out and back in (the `ubuntu` user was
just added to the `docker` group).

## Security notes

- Ingress is **22 only**, key-only. `ssh_allowed_cidrs` defaults to `0.0.0.0/0`
  so GitHub Actions runners (dynamic IPs) can deploy. Tighten it to your home IP
  plus GitHub's published ranges when you no longer need that.
- IMDSv2 is enforced (`http_tokens = "required"`).
- The root volume is gp3 and encrypted.
- Do **not** add inbound 80/443 — the Cloudflare Tunnel dials out.

Next: [02-cloudflare-tunnel.md](02-cloudflare-tunnel.md).
