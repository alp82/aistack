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
  splitting: false,
  sourcemap: true,
  // One source of truth for the version the CLI reports (#78): `--version` and
  // the login call both read src/version.ts, which this replaces at build time.
  define: { __AISTACK_CLI_VERSION__: JSON.stringify(pkg.version) },
})
