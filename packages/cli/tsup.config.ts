import { defineConfig } from 'tsup'
import pkg from './package.json' with { type: 'json' }

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm'],
  target: 'node18',
  clean: true,
  // The price table is a workspace package that is never published (#93), so it
  // has to be bundled INTO dist. It is a devDependency, which tsup already
  // bundles - this is the belt to that braces, because externalizing it would
  // ship a package.json pointing at a package npm does not have.
  noExternal: ['@aistack/pricing'],
  banner: { js: '#!/usr/bin/env node' },
  splitting: false,
  sourcemap: true,
  // One source of truth for the version the CLI reports (#78): `--version` and
  // the login call both read src/version.ts, which this replaces at build time.
  define: { __AISTACK_CLI_VERSION__: JSON.stringify(pkg.version) },
})
