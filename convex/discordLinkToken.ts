import {
  bytesToHex,
  decodeBase64Url,
  encodeBase64Url,
  encodeUtf8,
  hexToBytes,
  importHmacKey,
} from './lib/webCrypto'

const MESSAGE_PREFIX = 'discord-link:v1:'
const HMAC_HEX_LENGTH = 64

export const DISCORD_LINK_TTL_MS = 10 * 60 * 1000

export interface DiscordLinkTokenPayload {
  discordUserId: string
  nonce: string
  expiresAt: number
}

export async function signDiscordLinkToken(
  payload: DiscordLinkTokenPayload,
  secret: string,
): Promise<string> {
  const encoded = encodeBase64Url(JSON.stringify(payload))
  const key = await importHmacKey(secret, 'sign')
  const signature = await crypto.subtle.sign(
    'HMAC',
    key,
    encodeUtf8(`${MESSAGE_PREFIX}${encoded}`),
  )
  return `${encoded}.${bytesToHex(signature)}`
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
    const payload = JSON.parse(decodeBase64Url(encoded)) as Partial<DiscordLinkTokenPayload>
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
    const key = await importHmacKey(secret, 'verify')
    const valid = await crypto.subtle.verify(
      'HMAC',
      key,
      hexToBytes(signature),
      encodeUtf8(`${MESSAGE_PREFIX}${encoded}`),
    )
    return valid ? (payload as DiscordLinkTokenPayload) : null
  } catch {
    return null
  }
}

export async function hashDiscordLinkTokenId(nonce: string): Promise<string> {
  return bytesToHex(await crypto.subtle.digest('SHA-256', encodeUtf8(nonce)))
}

export function isDiscordUserId(value: string): boolean {
  return /^\d{17,20}$/.test(value)
}

export function randomTokenNonce(): string {
  const bytes = new Uint8Array(32)
  crypto.getRandomValues(bytes)
  return bytesToHex(bytes)
}
