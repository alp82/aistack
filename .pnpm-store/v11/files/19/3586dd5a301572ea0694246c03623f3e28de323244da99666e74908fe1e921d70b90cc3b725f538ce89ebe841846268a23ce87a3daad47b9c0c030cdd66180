# Platform.sh

> Deploy Nitro apps to platform.sh

**Preset:** `platform_sh`

<read-more></read-more>

## Setup

First, create a new project on platform.sh and link it to the repository you want to auto-deploy with.

Then in repository create `.platform.app.yaml` file:

```yaml [.platform.app.yaml]
name: nitro-app
type: 'nodejs:20'
disk: 128
web:
  commands:
    start: "node .output/server/index.mjs"
build:
  flavor: none
hooks:
  build: |
    corepack enable
    npx nypm install
    NITRO_PRESET=platform_sh npm run build
mounts:
    '.data':
        source: local
        source_path: .data
```

<read-more></read-more>

<read-more></read-more>
