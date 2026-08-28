#!/usr/bin/env bash
# Run a Convex CLI command against the PROD self-hosted backend.
#
# The command runs ON THE SERVER over ssh - never point the local CLI at prod
# from this machine (it has broken the local setup before). The admin key is
# minted on the server per invocation and never touches this repo.
#
# Usage:
#   scripts/convex-prod.sh data models --limit 20
#   scripts/convex-prod.sh run measured:getUsageByStackSlug '{"slug":"x-abc123"}'
#   scripts/convex-prod.sh env list
set -euo pipefail

HOST=root@10.0.0.20
BACKEND_CONTAINER=aistack-backend-1

# THE PUSH GUARD. Read this before you widen it.
#
# The CLI runs from a MINIMAL project dir on the server: a package.json and
# nothing else. It holds no `convex/` directory, so anything that writes code to
# the deployment writes an EMPTY function set, and prod loses every function and
# every index at once. That is a full outage, and it happened on 2026-08-24 from
# a stray `--push` on an otherwise harmless `run`.
#
# Reading and running deployed functions is safe and is the whole point of this
# script. Deploying is not: prod code arrives through GitHub Actions on a push
# to `main`, never from here. So refuse the code-writing verbs outright.
FORBIDDEN_COMMANDS='deploy dev push codegen'

for arg in "$@"; do
  case "$arg" in
    --push)
      echo "convex-prod.sh: refusing --push." >&2
      echo "  It would push this server's EMPTY project dir over prod's" >&2
      echo "  functions and indexes. Deploys go through GitHub Actions." >&2
      exit 2
      ;;
  esac
done

for forbidden in $FORBIDDEN_COMMANDS; do
  if [ "${1:-}" = "$forbidden" ]; then
    echo "convex-prod.sh: refusing \`convex $forbidden\`." >&2
    echo "  It would push this server's EMPTY project dir over prod's" >&2
    echo "  functions and indexes. Deploys go through GitHub Actions:" >&2
    echo "  push to \`main\` and let .github/workflows/deploy-convex.yml run." >&2
    exit 2
  fi
done

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
