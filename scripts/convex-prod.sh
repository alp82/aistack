#!/usr/bin/env bash
# Run a Convex CLI command against the PROD self-hosted backend.
#
# The command runs ON THE SERVER over ssh - never point the local CLI at prod
# from this machine (it has broken the local setup before). The admin key is
# minted on the server per invocation and never touches this repo.
#
# Usage:
#   scripts/convex-prod.sh data models --limit 20
#   scripts/convex-prod.sh run measured:getCurrentByStackSlug '{"slug":"x-abc123"}'
#   scripts/convex-prod.sh env list
set -euo pipefail

HOST=root@10.0.0.20
BACKEND_CONTAINER=aistack-backend-1

# %q-quote every argument so JSON args survive the ssh hop intact.
printf -v REMOTE_ARGS '%q ' "$@"

ssh "$HOST" "
  set -euo pipefail
  KEY=\$(docker exec $BACKEND_CONTAINER ./generate_admin_key.sh | tail -1)
  # Minimal project dir - the Convex CLI refuses to run without a package.json.
  mkdir -p /root/.aistack-convex-cli && cd /root/.aistack-convex-cli
  [ -f package.json ] || echo '{\"name\":\"aistack-convex-cli\",\"private\":true}' > package.json
  [ -d node_modules/convex ] || npm install --no-fund --no-audit convex >/dev/null
  CONVEX_SELF_HOSTED_URL=http://localhost:3210 \
  CONVEX_SELF_HOSTED_ADMIN_KEY=\"\$KEY\" \
  npx -y convex $REMOTE_ARGS
"
