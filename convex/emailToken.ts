// Stateless, signed unsubscribe tokens for email broadcasts.
//
// Runs in the Convex DEFAULT runtime (httpActions) → Web Crypto only, no
// node:crypto. The token format is `${base64url(email)}.${hex(hmac)}` where the
// HMAC is computed over a domain-separated message `unsubscribe:v1:${email}`
// (the prefix prevents the MAC from being reused as a signature for any other
// purpose). The email is always trimmed + lowercased before signing so the
// token is case-normalized.

import {
  bytesToHex,
  decodeBase64Url,
  encodeBase64Url,
  encodeUtf8,
  hexToBytes,
  importHmacKey,
} from './lib/webCrypto'

const MESSAGE_PREFIX = 'unsubscribe:v1:'

// HMAC-SHA-256 produces 32 bytes → 64 hex chars. Anything else is malformed.
const HMAC_HEX_LENGTH = 64

export async function signUnsubscribeToken(email: string, secret: string): Promise<string> {
  const emailLower = email.trim().toLowerCase()
  const msg = `${MESSAGE_PREFIX}${emailLower}`
  const key = await importHmacKey(secret, 'sign')
  const sig = await crypto.subtle.sign('HMAC', key, encodeUtf8(msg))
  return `${encodeBase64Url(emailLower)}.${bytesToHex(sig)}`
}

export async function verifyUnsubscribeToken(
  token: string,
  secret: string,
): Promise<string | null> {
  try {
    const parts = token.split('.')
    if (parts.length !== 2) return null
    const [emailPart, sigHex] = parts
    if (!emailPart || !sigHex) return null

    // Length-guard the MAC: HMAC-SHA-256 hex is exactly 64 lowercase hex chars.
    if (sigHex.length !== HMAC_HEX_LENGTH) return null
    if (!/^[0-9a-f]+$/.test(sigHex)) return null

    const emailLower = decodeBase64Url(emailPart).toLowerCase()
    if (!emailLower) return null

    const key = await importHmacKey(secret, 'verify')
    // crypto.subtle.verify does the comparison in constant time - do NOT
    // hand-roll a string compare.
    const ok = await crypto.subtle.verify(
      'HMAC',
      key,
      hexToBytes(sigHex),
      encodeUtf8(`${MESSAGE_PREFIX}${emailLower}`),
    )
    return ok ? emailLower : null
  } catch {
    return null
  }
}
