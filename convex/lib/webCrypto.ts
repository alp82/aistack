const TEXT_ENCODER = new TextEncoder()

export function encodeUtf8(value: string): Uint8Array<ArrayBuffer> {
  return TEXT_ENCODER.encode(value)
}

export function bytesToHex(buffer: ArrayBuffer | Uint8Array<ArrayBuffer>): string {
  const bytes = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer)
  return Array.from(bytes)
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('')
}

export function hexToBytes(value: string): Uint8Array<ArrayBuffer> {
  const buffer = new ArrayBuffer(value.length / 2)
  const bytes = new Uint8Array(buffer)
  for (let index = 0; index < bytes.length; index++) {
    bytes[index] = Number.parseInt(value.slice(index * 2, index * 2 + 2), 16)
  }
  return bytes
}

export function encodeBase64Url(value: string): string {
  const bytes = encodeUtf8(value)
  let binary = ''
  for (const byte of bytes) binary += String.fromCharCode(byte)
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

export function decodeBase64Url(value: string): string {
  let base64 = value.replace(/-/g, '+').replace(/_/g, '/')
  while (base64.length % 4 !== 0) base64 += '='
  const binary = atob(base64)
  const bytes = new Uint8Array(binary.length)
  for (let index = 0; index < binary.length; index++) {
    bytes[index] = binary.charCodeAt(index)
  }
  return new TextDecoder().decode(bytes)
}

export async function importHmacKey(
  secret: string,
  usage: KeyUsage,
): Promise<CryptoKey> {
  return await crypto.subtle.importKey(
    'raw',
    encodeUtf8(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    [usage],
  )
}
