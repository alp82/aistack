/**
 * Known platform names
 */
declare const platforms: readonly ["aws", "azure", "cloudflare", "deno", "firebase", "netlify", "vercel"];
/**
 * Known platform name
 */
type PlatformName = (typeof platforms)[number] | (string & {});
/**
 * Normalize the compatibility dates from input config and defaults.
 */
type Year = `${number}${number}${number}${number}`;
type Month = `${"0" | "1"}${number}`;
type Day = `${"0" | "1" | "2" | "3"}${number}`;
/**
 * Typed date string in `YYYY-MM-DD` format
 *
 * Empty string is used to represent an "unspecified" date.
 *
 * "latest" is used to represent the latest date available (date of today).
 */
type DateString = "" | "latest" | `${Year}-${Month}-${Day}`;
/**
 * Last known compatibility dates for platforms
 *
 * @example
 * {
 *  "default": "2024-01-01",
 *  "cloudflare": "2024-03-01",
 * }
 */
type CompatibilityDates = {
  /**
   * Default compatibility date for all unspecified platforms (required)
   */
  default: DateString;
} & Partial<Record<PlatformName, DateString>>;
/**
 * Last known compatibility date for the used platform
 */
type CompatibilityDateSpec = DateString | Partial<CompatibilityDates>;
/**
 * Get compatibility updates applicable for the user given platform and date range.
 */
export type { CompatibilityDateSpec, CompatibilityDates, DateString };