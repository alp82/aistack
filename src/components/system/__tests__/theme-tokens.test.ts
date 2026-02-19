// @vitest-environment node
import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

const stylesPath = new URL('../../../styles.css', import.meta.url)

describe('theme tokens', () => {
  it('defines terminal-first semantic tokens and aliases', () => {
    const css = readFileSync(stylesPath, 'utf8')

    expect(css).toContain('--bg-canvas')
    expect(css).toContain('--bg-panel')
    expect(css).toContain('--fg-primary')
    expect(css).toContain('--accent-lime')
    expect(css).toContain('--stroke-subtle')
    expect(css).toContain('--shadow-terminal-md')
    expect(css).toContain('--spacing-gutter')
    expect(css).toContain('--radius-xs')
    expect(css).toContain('--background: var(--bg-canvas);')
  })
})
