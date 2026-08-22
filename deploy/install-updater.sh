#!/usr/bin/env bash
#
# One-time setup for pull-based deployment. Run this on the instance, over your
# own SSH session — it is the last thing that needs a human on the host.
#
#   scp -i ~/.ssh/youlearn deploy/install-updater.sh ubuntu@<ip>:/tmp/
#   ssh -i ~/.ssh/youlearn ubuntu@<ip> 'sudo bash /tmp/install-updater.sh'
#
# After this, merging to main is the whole deploy: CI builds and pushes the
# images, and this host notices within a couple of minutes and reconciles
# itself. Nothing ever connects inbound, so port 22 stays shut to everyone but
# you and GitHub holds no key to this machine.

set -euo pipefail

APP_DIR=/opt/youlearn
REPO_DIR="$APP_DIR/repo"
REPO_URL="${REPO_URL:-https://github.com/AmineNaboulsi/youlearn.git}"
BRANCH="${BRANCH:-main}"

if [ "$(id -u)" -ne 0 ]; then
  echo "run with sudo" >&2
  exit 1
fi

# The .env is the one thing that is not in the repository and cannot be
# recreated from it. Stopping here beats installing a timer that fails every
# two minutes for a reason nobody reads.
if [ ! -f "$APP_DIR/.env" ]; then
  echo "ERROR: $APP_DIR/.env is missing." >&2
  echo "Copy it up first — it holds the generated secrets and is not in git." >&2
  exit 1
fi

echo "==> git"
if ! command -v git >/dev/null 2>&1; then
  apt-get update -qq && apt-get install -y -qq git
fi

echo "==> checkout"
if [ -d "$REPO_DIR/.git" ]; then
  sudo -u ubuntu git -C "$REPO_DIR" fetch --quiet --depth 1 origin "$BRANCH"
  sudo -u ubuntu git -C "$REPO_DIR" reset --quiet --hard "origin/$BRANCH"
else
  sudo -u ubuntu git clone --quiet --branch "$BRANCH" --depth 1 "$REPO_URL" "$REPO_DIR"
fi
chmod +x "$REPO_DIR/deploy/update.sh"

# The service runs with ProtectHome, so the Docker CLI cannot reach
# ~/.docker. Give it a directory it can read, or it abandons plugin discovery
# and `docker compose` stops being a command.
install -d -o ubuntu -g ubuntu -m 0700 "$APP_DIR/.docker"

echo "==> systemd"
install -m 0644 "$REPO_DIR/deploy/youlearn-update.service" /etc/systemd/system/
install -m 0644 "$REPO_DIR/deploy/youlearn-update.timer"   /etc/systemd/system/
systemctl daemon-reload
systemctl enable --now youlearn-update.timer

echo "==> first run"
# Synchronously, so a broken setup fails here in front of you rather than
# quietly in the journal two minutes from now.
if systemctl start youlearn-update.service; then
  echo "    ok"
else
  echo "    FAILED — see: journalctl -u youlearn-update -n 50" >&2
  exit 1
fi

echo
systemctl list-timers youlearn-update.timer --no-pager || true
echo
echo "Deploys are now automatic. Merging to main is the whole procedure."
echo
echo "  watch a deploy:   journalctl -u youlearn-update -f"
echo "  force one now:    sudo systemctl start youlearn-update.service"
echo "  pause deploys:    sudo systemctl stop youlearn-update.timer"
echo "  what is live:     cat $APP_DIR/.deployed"
