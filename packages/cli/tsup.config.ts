import { defineConfig } from 'tsup'
import pkg from './package.json' with { type: 'json' }

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm'],
  target: 'node22',
  clean: true,
  // These private workspace packages are never published, so the CLI bundles
  // them into dist. Externalizing either package would break the npm release.
  noExternal: ['@aistack/pricing', '@aistack/workflow-rules'],
  banner: { js: '#!/usr/bin/env node' },
  // tsup strips the `node:` prefix from builtin imports by default. `fs` and
  // `zlib` survive that; `sqlite` does not - it resolves ONLY as `node:sqlite`
  // (like `node:test`), so the stripped `import("sqlite")` throws and opencode
  // silently drops out of detection in every published build.
  removeNodeProtocol: false,
  splitting: false,
  sourcemap: true,
  // One source of truth for the version the CLI reports (#78): `--version` and
  // the login call both read src/version.ts, which this replaces at build time.
  define: { __AISTACK_CLI_VERSION__: JSON.stringify(pkg.version) },
})
