# 6. Troubleshooting

## The app can't reach the API

- `curl -s https://api-vulcan.ashiswadhwani.in/health` — if this fails, the problem is
  server-side, not the app.
- On the instance: `docker compose --env-file .env -f deploy/docker-compose.yml ps` — both `api`
  and `cf-tunnel` should be `Up`/`healthy`.
- `docker compose ... logs cf-tunnel` — look for `Registered tunnel connection`. If absent,
  check `~/vulcan/cloudflared/config.yml` (tunnel UUID + `credentials-file` path) and that the
  dir is correctly mounted at `/etc/cloudflared`; locally-managed tunnels use no token.
- The app's URL is baked at **build** time. Changing `EXPO_PUBLIC_API_URL` requires a new EAS
  build — it is not picked up by reinstalling the same APK.

## API returns HTTP 500 on AI routes / food search (but `/health` is OK)

The AI routes (quota checks, `ai_calls` logging, program context/materialization) and
`/foods/search` query Postgres directly via SQLAlchemy, so the server needs `DATABASE_URL`.

- Symptom: `/health` and `/health/protected` return 200, but `/ai/*` and `/foods/search`
  return **500** with an empty body.
- Fix: add `DATABASE_URL` (the same session-pooler URI as your local `backend/.env`) to
  `~/vulcan/backend/.env`, then recreate the container:
  ```
  cd ~/vulcan/backend
  docker compose --env-file .env -f deploy/docker-compose.yml up -d
  ```
- Verify: `docker compose ... logs -f api` shows the request handling without a
  `DATABASE_URL is not set` traceback.

## Cloudflare tunnel "Healthy" but requests 502

- The public hostname's Service URL must be `HTTP` → `api:8000` (the compose service name).
- Ensure `api` is in the **same compose project** as `cf-tunnel` (both in
  `deploy/docker-compose.yml`), so the name resolves.

## `pydantic_settings` validation error on the instance

`SUPABASE_URL` is required with no default. If the container crash-loops with a validation
error, `backend/.env` is missing or wasn't loaded — confirm `--env-file .env` was passed and
the file exists at `~/vulcan/backend/.env`.

## Can't SSH to the instance

- Confirm the Elastic IP and key: `terraform output elastic_ip`, and that your private key
  matches the `ssh_public_key` in `terraform.tfvars`.
- If it times out, your current IP is not in `ssh_allowed_cidrs`. Add it (or temporarily widen
  to `0.0.0.0/0`) and `terraform apply`.
- Wait ~1–2 minutes after `terraform apply`; the security group and instance need a moment.

## Docker permission denied after first boot

The `ubuntu` user is added to the `docker` group by `user_data`, but that only applies to new
logins. Log out and reconnect, or run `newgrp docker`.

## Docker build runs out of memory (1 GB instance)

The `user_data` bootstrap already creates a 2 GB swapfile — confirm it's active with `swapon
--show`. If builds still fail, bump `instance_type` to `t4g.small` (2 GB) and
`terraform apply`; a same-architecture change is an in-place resize.

## Terraform: AMI not found / architecture mismatch

`ami_architecture` must match the instance family: `arm64` for `t4g`, `amd64` for
`t2`/`t3`/`t3a`. If `terraform plan` finds no AMI, check both values in `terraform.tfvars`.

## The instance's public IP changed

Only happens if there is no Elastic IP. This module always attaches one; if you detached it,
look up the current address or re-run `terraform apply` to restore the association.

## Frontend CI fails with "EXPO_PUBLIC_SUPABASE_URL ... missing"

The Supabase client throws at import when the vars are absent. The `ci.yml` frontend job sets
placeholder `EXPO_PUBLIC_*` — if you added a new module-level env check, add the placeholder
too.

## EAS build has empty API URL / app calling localhost

EAS cloud builds don't read `frontend/.env`. Set the values with `eas env:set` for the
environment referenced by the profile in `eas.json`, and check with `eas env:list`.

## `rsync: command not found` on the instance

`sudo apt-get install -y rsync` (already installed by `user_data`).

## Permission denied pushing/ssh during deploy

- `SSH_PRIVATE_KEY` must be the **private** key whose public half is `ssh_public_key` in
  `terraform.tfvars`.
- Re-run the workflow from `master`; other branches are rejected by design.
- If the instance was rebuilt, its host key changed — the workflow uses `ssh-keyscan`, so this
  is handled automatically.

## Rotating secrets

- **Tunnel token / Supabase / Gemini:** update `~/vulcan/backend/.env`, then
  `docker compose --env-file .env -f deploy/docker-compose.yml up -d` to recreate.
- **SSH deploy key:** generate a new pair, set `ssh_public_key` in `terraform.tfvars` and
  `terraform apply`, replace the GitHub secret.
- **EXPO_TOKEN:** regenerate in Expo, update the GitHub secret.
