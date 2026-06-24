// Stateless, signed unsubscribe tokens for email broadcasts.
//
// Runs in the Convex DEFAULT runtime (httpActions) → Web Crypto only, no
// node:crypto. The token format is `${base64url(email)}.${hex(hmac)}` where the
// HMAC is computed over a domain-separated message `unsubscribe:v1:${email}`
// (the prefix prevents the MAC from being reused as a signature for any other
// purpose). The email is always trimmed + lowercased before signing so the
// token is case-normalized.

const TEXT_ENCODER = new TextEncoder()

const MESSAGE_PREFIX = 'unsubscribe:v1:'

// HMAC-SHA-256 produces 32 bytes → 64 hex chars. Anything else is malformed.
const HMAC_HEX_LENGTH = 64

function hex(buffer: ArrayBuffer): string {
  return Array.from(new Uint8Array(buffer))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}

function hexToBytes(hexStr: string): Uint8Array<ArrayBuffer> {
  const buf = new ArrayBuffer(hexStr.length / 2)
  const bytes = new Uint8Array(buf)
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = Number.parseInt(hexStr.slice(i * 2, i * 2 + 2), 16)
  }
  return bytes
}

function base64url(input: string): string {
  // btoa expects a binary string; encode the UTF-8 bytes first.
  const bytes = TEXT_ENCODER.encode(input)
  let binary = ''
  for (const b of bytes) binary += String.fromCharCode(b)
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

function fromBase64Url(input: string): string {
  // Translate URL-safe alphabet back to standard base64 and re-pad.
  let b64 = input.replace(/-/g, '+').replace(/_/g, '/')
  while (b64.length % 4 !== 0) b64 += '='
  const binary = atob(b64)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)
  return new TextDecoder().decode(bytes)
}

async function hmacKey(secret: string, usage: KeyUsage): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    'raw',
    TEXT_ENCODER.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    [usage],
  )
}

export async function signUnsubscribeToken(email: string, secret: string): Promise<string> {
  const emailLower = email.trim().toLowerCase()
  const msg = `${MESSAGE_PREFIX}${emailLower}`
  const key = await hmacKey(secret, 'sign')
  const sig = await crypto.subtle.sign('HMAC', key, TEXT_ENCODER.encode(msg))
  return `${base64url(emailLower)}.${hex(sig)}`
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

    const emailLower = fromBase64Url(emailPart).toLowerCase()
    if (!emailLower) return null

    const key = await hmacKey(secret, 'verify')
    // crypto.subtle.verify does the comparison in constant time — do NOT
    // hand-roll a string compare.
    const ok = await crypto.subtle.verify(
      'HMAC',
      key,
      hexToBytes(sigHex),
      TEXT_ENCODER.encode(`${MESSAGE_PREFIX}${emailLower}`),
    )
    return ok ? emailLower : null
  } catch {
    return null
  }
}
