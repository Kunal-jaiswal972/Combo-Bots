#!/bin/bash
set -euo pipefail

REPO_DIR="${REPO_DIR:-$HOME/Code-redeem-bot}"
MODE="${1:-vnc}"

cd "$REPO_DIR"

echo "==> Fetching debug branch..."
git fetch origin
git checkout debug
git pull origin debug

echo "==> Updating .env for mode: $MODE"
set_env() {
  local key="$1"
  local value="$2"
  if grep -q "^${key}=" .env 2>/dev/null; then
    sed -i "s|^${key}=.*|${key}=${value}|" .env
  else
    echo "${key}=${value}" >> .env
  fi
}

set_env CHROME_USER_DATA_DIR /data/chrome
set_env CLI_ADAPTER_ENABLED false

if [ "$MODE" = "vnc" ]; then
  set_env CHROME_VNC_ENABLED true
  set_env HEADLESS false
elif [ "$MODE" = "headless" ]; then
  set_env CHROME_VNC_ENABLED false
  set_env HEADLESS true
else
  echo "Usage: $0 [vnc|headless]" >&2
  exit 1
fi

echo "==> Rebuilding and starting containers..."
cd deploy
docker compose down
docker compose up --build -d

echo "==> Container status:"
docker compose ps

echo "==> Recent logs:"
docker compose logs --tail=40

if [ "$MODE" = "vnc" ]; then
  echo ""
  echo "VNC login mode is active."
  echo "On your PC run: ssh -L 5900:127.0.0.1:5900 Combo-BOTS-VM@98.70.25.6"
  echo "Connect VNC viewer to localhost:5900, then trigger a redeem in Telegram."
  echo "After login works, run: bash deploy/vm-deploy-debug.sh headless"
fi
