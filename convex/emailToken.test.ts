/// <reference types="vite/client" />
import { describe, expect, test } from 'vitest'
import { signUnsubscribeToken, verifyUnsubscribeToken } from './emailToken'

// Fixed test secret used throughout - 32 ASCII bytes (exact length not enforced by impl, but explicit here).
const SECRET = 'test-secret-32-bytes-padded-here'
const WRONG_SECRET = 'wrong-secret-32-bytes-padded-xxx'

// ---------------------------------------------------------------------------
// TC-ET-01: sign→verify roundtrip returns lowercased email
// ---------------------------------------------------------------------------
test('TC-ET-01: sign→verify roundtrip returns lowercased email', async () => {
  const email = 'user@example.com'
  const token = await signUnsubscribeToken(email, SECRET)
  const result = await verifyUnsubscribeToken(token, SECRET)

  expect(result).toBe('user@example.com')
})

// ---------------------------------------------------------------------------
// TC-ET-02: mixed-case input → verify returns fully lowercased email
// ---------------------------------------------------------------------------
test('TC-ET-02: mixed-case "Ada@X.COM" → verify returns "ada@x.com"', async () => {
  const token = await signUnsubscribeToken('Ada@X.COM', SECRET)
  const result = await verifyUnsubscribeToken(token, SECRET)

  expect(result).toBe('ada@x.com')
})

// ---------------------------------------------------------------------------
// TC-ET-03: sign is case-normalized - same token regardless of input case
// ---------------------------------------------------------------------------
test('TC-ET-03: sign("ADA@X.COM") === sign("ada@x.com") (normalized; same token)', async () => {
  const tokenUpper = await signUnsubscribeToken('ADA@X.COM', SECRET)
  const tokenLower = await signUnsubscribeToken('ada@x.com', SECRET)

  expect(tokenUpper).toBe(tokenLower)
})

// ---------------------------------------------------------------------------
// TC-ET-04: single-char tamper in the hex/mac segment → null
// ---------------------------------------------------------------------------
test('TC-ET-04: single-char tamper in mac segment → null', async () => {
  const token = await signUnsubscribeToken('user@example.com', SECRET)
  const [b64, mac] = token.split('.')

  // Flip the first hex nibble: '0'→'1', anything else→'0'
  const tamperedMac = (mac[0] === '0' ? '1' : '0') + mac.slice(1)
  const tamperedToken = `${b64}.${tamperedMac}`

  const result = await verifyUnsubscribeToken(tamperedToken, SECRET)

  expect(result).toBeNull()
})

// ---------------------------------------------------------------------------
// TC-ET-05: tampered base64url email segment → null
// ---------------------------------------------------------------------------
test('TC-ET-05: tampered base64url email segment → null', async () => {
  const token = await signUnsubscribeToken('user@example.com', SECRET)
  const [b64, mac] = token.split('.')

  // Append a character to corrupt the base64url payload
  const tamperedB64 = b64 + 'X'
  const tamperedToken = `${tamperedB64}.${mac}`

  const result = await verifyUnsubscribeToken(tamperedToken, SECRET)

  expect(result).toBeNull()
})

// ---------------------------------------------------------------------------
// TC-ET-06: wrong secret → null
// ---------------------------------------------------------------------------
test('TC-ET-06: sign with one secret, verify with different secret → null', async () => {
  const token = await signUnsubscribeToken('user@example.com', SECRET)
  const result = await verifyUnsubscribeToken(token, WRONG_SECRET)

  expect(result).toBeNull()
})

// ---------------------------------------------------------------------------
// TC-ET-07..09,12: garbage tokens - all return null, never throw
// ---------------------------------------------------------------------------
describe('TC-ET-07..09,12: garbage tokens return null, never throw', () => {
  const garbageTokens = [
    ['TC-ET-07: empty string', ''],
    ['TC-ET-08: no dot separator', 'nodot'],
    ['TC-ET-09: invalid chars', '!!!.abcdef'],
    ['TC-ET-12: space-containing string', 'this is not a token'],
  ] as const

  for (const [label, token] of garbageTokens) {
    test(label, async () => {
      const result = await verifyUnsubscribeToken(token, SECRET)

      expect(result).toBeNull()
    })
  }
})

// ---------------------------------------------------------------------------
// TC-ET-10: hmac segment too short → null (length-guard)
// ---------------------------------------------------------------------------
test('TC-ET-10: mac segment too short → null', async () => {
  const token = await signUnsubscribeToken('user@example.com', SECRET)
  const [b64] = token.split('.')

  // Truncate mac to only 4 hex chars (clearly too short for SHA-256 HMAC = 64 chars)
  const shortMacToken = `${b64}.abcd`

  const result = await verifyUnsubscribeToken(shortMacToken, SECRET)

  expect(result).toBeNull()
})

// ---------------------------------------------------------------------------
// TC-ET-11: hmac segment too long → null
// ---------------------------------------------------------------------------
test('TC-ET-11: mac segment too long → null', async () => {
  const token = await signUnsubscribeToken('user@example.com', SECRET)
  const [b64, mac] = token.split('.')

  // Extend mac by appending 10 extra hex chars
  const longMacToken = `${b64}.${mac}${'0'.repeat(10)}`

  const result = await verifyUnsubscribeToken(longMacToken, SECRET)

  expect(result).toBeNull()
})

// ---------------------------------------------------------------------------
// TC-ET-DS: domain separation - mac over unprefixed email must NOT verify
//
// Strategy: sign normally, then independently compute HMAC over the RAW
// (unprefixed) lowercased email via Web Crypto and confirm the resulting
// mac differs from the mac in the signed token.  If they differ, we know
// the impl uses the "unsubscribe:v1:" prefix (and a token hand-built with
// the unprefixed mac would not pass verify).
// ---------------------------------------------------------------------------
test('TC-ET-DS: domain separation - mac over unprefixed email differs from mac in token', async () => {
  const email = 'user@example.com'
  const emailLower = email.toLowerCase()
  const token = await signUnsubscribeToken(email, SECRET)
  const tokenMac = token.split('.')[1]

  // Compute HMAC-SHA256 over the RAW (un-prefixed) email using Web Crypto
  const enc = new TextEncoder()
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    enc.encode(SECRET),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  )
  const rawMacBuf = await crypto.subtle.sign('HMAC', keyMaterial, enc.encode(emailLower))
  const rawMacHex = Array.from(new Uint8Array(rawMacBuf))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')

  // The token's mac MUST differ from the unprefixed-message mac
  expect(tokenMac).not.toBe(rawMacHex)
})
