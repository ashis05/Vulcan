# 2. Cloudflare Tunnel (locally-managed)

The tunnel exposes the API **without opening any inbound ports**. `cloudflared` dials
**out** to Cloudflare's edge; Cloudflare terminates TLS and forwards
`https://api-vulcan.ashiswadhwani.in` to `http://api:8000` on the EC2 instance's Docker
network.

This runbook uses a **locally-managed** tunnel: a `config.yml` + credentials JSON live on
the instance and are mounted into the `cf-tunnel` container. There is **no tunnel token**.
The DNS **CNAME is created by the CLI** (`cloudflared tunnel route dns`), and the hostname →
service mapping lives in `config.yml`.

```
Browser ──► https://api-vulcan.ashiswadhwani.in
        ──► Cloudflare edge (TLS termination)
        ──► outbound-only tunnel (QUIC 7844)
        ──► cf-tunnel container (cloudflared, config.yml) ──► http://api:8000
```

Prerequisite: **`ashiswadhwani.in` is an active zone on Cloudflare** (Networking → your
domain shows "Active"). Do **not** use a quick `trycloudflare.com` tunnel — its URL changes
on every restart and can't be baked into the app.

> All commands in steps 2.1–2.4 run **on the EC2 instance** (SSH session), headless.

## 2.1 Install cloudflared on the instance

Ubuntu 24.04 (arm64 or amd64 — the repo covers both):

```bash
sudo mkdir -p --mode=0755 /usr/share/keyrings
curl -fsSL https://pkg.cloudflare.com/cloudflare-main.gpg \
  | sudo tee /usr/share/keyrings/cloudflare-main.gpg >/dev/null
echo 'deb [signed-by=/usr/share/keyrings/cloudflare-main.gpg] https://pkg.cloudflare.com/cloudflared any main' \
  | sudo tee /etc/apt/sources.list.d/cloudflared.list
sudo apt-get update && sudo apt-get install -y cloudflared
cloudflared --version
```

## 2.2 Create the tunnel (headless login)

```bash
cloudflared tunnel login
```

It prints a URL like `https://dash.cloudflare.com/argotunnel?callback=...`. **Copy that URL
and open it in a browser on any machine**, log in, and select the `ashiswadhwani.in` zone →
Authorize. The waiting CLI then downloads `~/.cloudflared/cert.pem`.

Create the tunnel and note the **UUID** it prints:

```bash
cloudflared tunnel create vulcan-api
# Created tunnel vulcan-api with id 1a2b3c4d-....
```

This writes `~/.cloudflared/<UUID>.json` (the tunnel credentials).

## 2.3 Create the DNS CNAME

```bash
cloudflared tunnel route dns vulcan-api api-vulcan.ashiswadhwani.in
```

This adds a **proxied CNAME** `api-vulcan.ashiswadhwani.in → <UUID>.cfargotunnel.com` to the
zone. Confirm it under **DNS → Records** (Proxy status = Proxied).

## 2.4 Write `config.yml` (outside the source tree)

The tunnel's secrets are kept in `~/vulcan/cloudflared/` — deliberately **not** under
`backend/`, because the deploy rsyncs `backend/` with `--delete` and would otherwise delete
them.

```bash
mkdir -p ~/vulcan/cloudflared
cp ~/.cloudflared/<UUID>.json ~/vulcan/cloudflared/
nano ~/vulcan/cloudflared/config.yml
```

```yaml
tunnel: 1a2b3c4d-....                       # the UUID from 2.2
credentials-file: /etc/cloudflared/<UUID>.json   # in-container path (the host dir is mounted at /etc/cloudflared)

ingress:
  - hostname: api-vulcan.ashiswadhwani.in
    service: http://api:8000
  - service: http_status:404
```

Protect it:

```bash
chmod 700 ~/vulcan/cloudflared
chmod 600 ~/vulcan/cloudflared/config.yml ~/vulcan/cloudflared/<UUID>.json
```

> The `cf-tunnel` compose service sets `user: "1000:1000"` (the `ubuntu` user) precisely so
> it can read these `0600` files — the `cloudflared` image would otherwise run as a non-root
> user and fail with "permission denied".

Optionally validate the ingress rules (`credentials-file` points at the in-container path,
so ignore any "credentials" warning — it's only needed when the tunnel actually runs):

```bash
cloudflared tunnel ingress validate --config ~/vulcan/cloudflared/config.yml
```

> Do **not** run `cloudflared tunnel run` on the host — `api:8000` only resolves inside the
> `vulcan` Docker network, so the compose container is the only correct place to run it.

## 2.5 Wire it into compose

`backend/deploy/docker-compose.yml` already runs the tunnel with this config:

```yaml
  cf-tunnel:
    image: cloudflare/cloudflared:latest
    command: tunnel --no-autoupdate --config /etc/cloudflared/config.yml run
    user: "1000:1000"
    volumes:
      - /home/ubuntu/vulcan/cloudflared:/etc/cloudflared:ro
    restart: unless-stopped
    depends_on:
      - api
```

Start it with the stack (see [03-backend-deploy.md](03-backend-deploy.md)):

```bash
cd ~/vulcan/backend
docker compose --env-file .env -f deploy/docker-compose.yml up -d
docker compose --env-file .env -f deploy/docker-compose.yml logs cf-tunnel
```

## 2.6 Verify

Look for `Registered tunnel connection` in the `cf-tunnel` logs, then:

```bash
curl -s https://api-vulcan.ashiswadhwani.in/health
# {"status":"ok"}
```

If the tunnel shows **Healthy** in the dashboard but the app 502s, the `api` container
isn't up or the service URL is wrong — check `docker compose ps` and `logs api`.

## 2.7 Changing ingress / rotating

- **Change routing:** edit `~/vulcan/cloudflared/config.yml`, then
  `docker compose --env-file .env -f deploy/docker-compose.yml restart cf-tunnel`.
- **Re-create the tunnel:** repeat 2.2–2.4 (new UUID/config) and restart the container.
- `~/.cloudflared/cert.pem` is account-level and is **not** mounted into the container —
  only the tunnel's own credentials are.

## Notes

- Cloudflare's proxy terminates TLS at the edge; the origin speaks plain HTTP inside the
  Docker network. No certificates on the EC2 instance.
- The tunnel is outbound-only over QUIC (UDP 7844). The security group needs no inbound
  rules beyond SSH (22).
- FastAPI runs uvicorn with `--proxy-headers --forwarded-allow-ips '*'` so `X-Forwarded-*`
  is honored behind the tunnel.

Next: [03-backend-deploy.md](03-backend-deploy.md).
