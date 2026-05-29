/// <reference types="vite/client" />
import { expect, test } from 'vitest'
import { parseGithubHandle } from './resourceLinks'

test('parseGithubHandle extracts the owner from https, git@, and trailing-slash forms', () => {
  expect(parseGithubHandle('https://github.com/acme/repo')).toBe('acme')
  expect(parseGithubHandle('https://github.com/acme/repo.git')).toBe('acme')
  expect(parseGithubHandle('https://github.com/acme/repo/')).toBe('acme')
  expect(parseGithubHandle('git@github.com:acme/repo.git')).toBe('acme')
  expect(parseGithubHandle('  https://github.com/acme/repo  ')).toBe('acme')
})
