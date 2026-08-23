import { defineConfig } from 'vitest/config'
import viteReact from '@vitejs/plugin-react'
import viteTsConfigPaths from 'vite-tsconfig-paths'

export default defineConfig({
  plugins: [
    viteTsConfigPaths({
      projects: ['./tsconfig.json'],
    }),
    viteReact(),
  ],
  test: {
    globals: true,
    server: { deps: { inline: ['convex-test'] } },
    projects: [
      {
        extends: true,
        test: {
          name: 'convex',
          include: ['convex/**/*.test.{ts,tsx}'],
          environment: 'edge-runtime',
        },
      },
      {
        extends: true,
        test: {
          name: 'src',
          include: ['src/**/*.test.{ts,tsx}'],
          environment: 'jsdom',
          setupFiles: ['./src/test/setup.ts'],
        },
      },
      {
        extends: true,
        test: {
          name: 'packages',
          include: ['packages/**/*.test.ts'],
          environment: 'node',
        },
      },
      {
        extends: true,
        test: {
          name: 'scripts',
          include: ['scripts/**/*.test.ts'],
          environment: 'node',
        },
      },
    ],
  },
})
