/**
 * Validate an icon URL accepted from authenticated users.
 *
 * Requirements:
 *  - Must parse as a URL.
 *  - Must use the `https:` protocol — rejects `data:`, `javascript:`,
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
