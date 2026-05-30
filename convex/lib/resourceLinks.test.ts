/// <reference types="vite/client" />
import { expect, test } from 'vitest'
import { parseGithubHandle } from './resourceLinks'

// The parser table itself lives in `src/lib/github-repo.test.ts` (the single
// source of truth). Here we only cover the server-only `parseGithubHandle`
// wrapper that derives the owner handle at the linked-row insert.
test('parseGithubHandle extracts the owner from https, git@, and trailing-slash forms', () => {
  expect(parseGithubHandle('https://github.com/acme/repo')).toBe('acme')
  expect(parseGithubHandle('https://github.com/acme/repo.git')).toBe('acme')
  expect(parseGithubHandle('https://github.com/acme/repo/')).toBe('acme')
  expect(parseGithubHandle('git@github.com:acme/repo.git')).toBe('acme')
  expect(parseGithubHandle('  https://github.com/acme/repo  ')).toBe('acme')
})

test('parseGithubHandle falls back to the trimmed input for unrecognized URLs', () => {
  expect(parseGithubHandle('https://github.com/onlyowner')).toBe(
    'https://github.com/onlyowner',
  )
  expect(parseGithubHandle('  not-a-url  ')).toBe('not-a-url')
})
