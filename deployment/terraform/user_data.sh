#!/usr/bin/env bash
# VULCAN API host first-boot bootstrap. Runs once as root via EC2 user_data.
# Brings up Docker + the compose plugin, a swapfile, and the app directory.
# It does NOT install secrets — backend/.env is created manually later.

set -euxo pipefail

SWAP_SIZE_GB="${swap_size_gb}"

# --- Swapfile: keeps the on-VM image build from OOMing on a 1 GB instance ---
if [ ! -f /swapfile ]; then
  fallocate -l "$${SWAP_SIZE_GB}G" /swapfile || dd if=/dev/zero of=/swapfile bs=1M count="$(( SWAP_SIZE_GB * 1024 ))"
  chmod 600 /swapfile
  mkswap /swapfile
  swapon /swapfile
  echo '/swapfile none swap sw 0 0' >> /etc/fstab
fi

export DEBIAN_FRONTEND=noninteractive

apt-get update -y
apt-get install -y ca-certificates curl rsync unattended-upgrades

# --- Docker CE + Compose plugin (official Docker apt repo) ---
install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg -o /etc/apt/keyrings/docker.asc
chmod a+r /etc/apt/keyrings/docker.asc

echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.asc] https://download.docker.com/linux/ubuntu $(. /etc/os-release && echo "$VERSION_CODENAME") stable" \
  > /etc/apt/sources.list.d/docker.list

apt-get update -y
apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

systemctl enable --now docker

# Deploy over SSH runs as the default Ubuntu user; let it use Docker.
usermod -aG docker ubuntu

install -d -o ubuntu -g ubuntu /home/ubuntu/vulcan/backend

# Signal that bootstrap finished (handy when checking the cloud-init log).
echo "vulcan bootstrap complete" > /var/log/vulcan-bootstrap.log
