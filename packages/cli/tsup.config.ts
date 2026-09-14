import { defineConfig } from 'tsup'
import pkg from './package.json' with { type: 'json' }

export default defineConfig({
  // The Cursor read runs in a worker thread (#420); it is its own entry so
  // `new Worker(new URL('./cursor-worker.js', import.meta.url))` finds it
  // beside index.js.
  entry: { index: 'src/index.ts', 'cursor-worker': 'src/harness/cursor/worker.ts' },
  format: ['esm'],
  target: 'node22',
  clean: true,
  // These private workspace packages are never published, so the CLI bundles
  // them into dist. Externalizing either package would break the npm release.
  //
  // cursor-history is bundled too, so the pnpm patch in patches/ ships to
  // users: as an external dependency npm would install the unpatched
  // registry copy. The patch fixes the quadratic page walk that hangs sync on
  // a multi-gigabyte Cursor database (`? IS NULL OR rowid > ?` plans as a
  // full SCAN per page; `rowid > COALESCE(?, -1)` seeks). The Cursor read
  // goes through node:sqlite, so the library's better-sqlite3 import stays
  // external and is never resolved.
  noExternal: ['@aistack/pricing', '@aistack/workflow-rules', 'cursor-history'],
  external: ['better-sqlite3'],
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
