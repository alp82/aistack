#!/usr/bin/env bash
# Replace the LOCAL dev database with a fresh export of prod.
#
# DESTRUCTIVE LOCALLY: every local table is replaced (--replace-all), including
# auth tables — log in again locally afterwards. Prod is only read.
#
# The export runs on the server over ssh (never point the local CLI at prod
# from this machine). The local `convex dev` backend must be running.
#
# Usage: scripts/sync-prod-db.sh
set -euo pipefail

HOST=root@10.0.0.20
BACKEND_CONTAINER=aistack-backend-1
STAMP=$(date +%Y%m%d-%H%M%S)
REMOTE_ZIP=/tmp/aistack-export-$STAMP.zip
LOCAL_DIR=$(mktemp -d)
LOCAL_ZIP=$LOCAL_DIR/prod-snapshot-$STAMP.zip

echo "==> Exporting prod on the server..."
ssh "$HOST" "
  set -euo pipefail
  KEY=\$(docker exec $BACKEND_CONTAINER ./generate_admin_key.sh | tail -1)
  # Minimal project dir — the Convex CLI refuses to run without a package.json.
  mkdir -p /root/.aistack-convex-cli && cd /root/.aistack-convex-cli
  [ -f package.json ] || echo '{\"name\":\"aistack-convex-cli\",\"private\":true}' > package.json
  [ -d node_modules/convex ] || npm install --no-fund --no-audit convex >/dev/null
  CONVEX_SELF_HOSTED_URL=http://localhost:3210 \
  CONVEX_SELF_HOSTED_ADMIN_KEY=\"\$KEY\" \
  npx -y convex export --include-file-storage --path $REMOTE_ZIP
"

echo "==> Downloading snapshot..."
scp -q "$HOST:$REMOTE_ZIP" "$LOCAL_ZIP"
ssh "$HOST" "rm -f $REMOTE_ZIP"

echo "==> Importing into the local dev backend (replace-all)..."
cd "$(dirname "$0")/.."
npx convex import --replace-all -y "$LOCAL_ZIP"

rm -rf "$LOCAL_DIR"
echo "==> Done. Local dev database now mirrors prod as of $STAMP."
echo "    Local sessions were replaced — log in again in the local app."
