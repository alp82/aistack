const TEXT_ENCODER = new TextEncoder()
const MESSAGE_PREFIX = 'discord-link:v1:'
const HMAC_HEX_LENGTH = 64

export const DISCORD_LINK_TTL_MS = 10 * 60 * 1000

export interface DiscordLinkTokenPayload {
  discordUserId: string
  nonce: string
  expiresAt: number
}

function hex(buffer: ArrayBuffer): string {
  return Array.from(new Uint8Array(buffer))
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('')
}

function hexToBytes(value: string): Uint8Array<ArrayBuffer> {
  const buffer = new ArrayBuffer(value.length / 2)
  const bytes = new Uint8Array(buffer)
  for (let index = 0; index < bytes.length; index++) {
    bytes[index] = Number.parseInt(value.slice(index * 2, index * 2 + 2), 16)
  }
  return bytes
}

function base64url(input: string): string {
  const bytes = TEXT_ENCODER.encode(input)
  let binary = ''
  for (const byte of bytes) binary += String.fromCharCode(byte)
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

function fromBase64Url(input: string): string {
  let base64 = input.replace(/-/g, '+').replace(/_/g, '/')
  while (base64.length % 4 !== 0) base64 += '='
  const binary = atob(base64)
  const bytes = new Uint8Array(binary.length)
  for (let index = 0; index < binary.length; index++) {
    bytes[index] = binary.charCodeAt(index)
  }
  return new TextDecoder().decode(bytes)
}

async function hmacKey(secret: string, usage: KeyUsage): Promise<CryptoKey> {
  return await crypto.subtle.importKey(
    'raw',
    TEXT_ENCODER.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    [usage],
  )
}

export async function signDiscordLinkToken(
  payload: DiscordLinkTokenPayload,
  secret: string,
): Promise<string> {
  const encoded = base64url(JSON.stringify(payload))
  const key = await hmacKey(secret, 'sign')
  const signature = await crypto.subtle.sign(
    'HMAC',
    key,
    TEXT_ENCODER.encode(`${MESSAGE_PREFIX}${encoded}`),
  )
  return `${encoded}.${hex(signature)}`
}

export async function verifyDiscordLinkToken(
  token: string,
  secret: string,
): Promise<DiscordLinkTokenPayload | null> {
  try {
    const [encoded, signature, ...rest] = token.split('.')
    if (!encoded || !signature || rest.length > 0) return null
    if (signature.length !== HMAC_HEX_LENGTH || !/^[0-9a-f]+$/.test(signature)) {
      return null
    }
    const payload = JSON.parse(fromBase64Url(encoded)) as Partial<DiscordLinkTokenPayload>
    if (
      typeof payload.discordUserId !== 'string' ||
      !isDiscordUserId(payload.discordUserId) ||
      typeof payload.nonce !== 'string' ||
      !/^[0-9a-f]{64}$/.test(payload.nonce) ||
      typeof payload.expiresAt !== 'number' ||
      !Number.isSafeInteger(payload.expiresAt)
    ) {
      return null
    }
    const key = await hmacKey(secret, 'verify')
    const valid = await crypto.subtle.verify(
      'HMAC',
      key,
      hexToBytes(signature),
      TEXT_ENCODER.encode(`${MESSAGE_PREFIX}${encoded}`),
    )
    return valid ? (payload as DiscordLinkTokenPayload) : null
  } catch {
    return null
  }
}

export async function hashDiscordLinkTokenId(nonce: string): Promise<string> {
  return hex(await crypto.subtle.digest('SHA-256', TEXT_ENCODER.encode(nonce)))
}

export function isDiscordUserId(value: string): boolean {
  return /^\d{17,20}$/.test(value)
}

export function randomTokenNonce(): string {
  const bytes = new Uint8Array(32)
  crypto.getRandomValues(bytes)
  return Array.from(bytes)
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('')
}
