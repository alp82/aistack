import { ACCENT_PRESET_KEYS } from '../../src/features/stack-view/accentPresets'

/**
 * Validate an icon URL accepted from authenticated users.
 *
 * Requirements:
 *  - Must parse as a URL.
 *  - Must use the `https:` protocol - rejects `data:`, `javascript:`,
 *    `file:`, `ftp:`, plain `http:`, etc.
 *
 * Throws an Error with a stable message on rejection.
 */
export function assertValidIconUrl(url: string): void {
  let parsed: URL
  try {
    parsed = new URL(url)
  } catch {
    throw new Error('suggestedIconUrl must be a valid https URL')
  }
  if (parsed.protocol !== 'https:') {
    throw new Error('suggestedIconUrl must be a valid https URL')
  }
}

/**
 * Validate a personal page URL accepted from authenticated users.
 *
 * Requirements mirror assertValidIconUrl:
 *  - Must parse as a URL.
 *  - Must use the `https:` protocol - rejects `data:`, `javascript:`,
 *    `file:`, `ftp:`, plain `http:`, etc.
 *
 * Throws an Error with a stable message on rejection.
 */
export function assertValidPersonalPageUrl(url: string): void {
  let parsed: URL
  try {
    parsed = new URL(url)
  } catch {
    throw new Error('personalPageUrl must be a valid https URL')
  }
  if (parsed.protocol !== 'https:') {
    throw new Error('personalPageUrl must be a valid https URL')
  }
}

/**
 * Validate an accent preset key accepted from authenticated users.
 *
 * Requirements:
 *  - Must be one of the known accent preset keys.
 *
 * Throws an Error with a stable message on rejection.
 */
export function assertValidAccentPreset(key: string): void {
  if (!ACCENT_PRESET_KEYS.includes(key)) {
    throw new Error(
      'accentPreset must be one of: ' + ACCENT_PRESET_KEYS.join(', '),
    )
  }
}
