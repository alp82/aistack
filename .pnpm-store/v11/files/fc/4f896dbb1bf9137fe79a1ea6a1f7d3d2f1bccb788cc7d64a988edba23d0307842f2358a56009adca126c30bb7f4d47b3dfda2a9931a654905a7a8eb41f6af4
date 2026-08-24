//#region src/utils/time.d.ts
type Years = "years" | "year" | "yrs" | "yr" | "y";
type Months = "months" | "month" | "mo";
type Weeks = "weeks" | "week" | "w";
type Days = "days" | "day" | "d";
type Hours = "hours" | "hour" | "hrs" | "hr" | "h";
type Minutes = "minutes" | "minute" | "mins" | "min" | "m";
type Seconds = "seconds" | "second" | "secs" | "sec" | "s";
type Unit = Years | Months | Weeks | Days | Hours | Minutes | Seconds;
type UnitAnyCase = Capitalize<Unit> | Uppercase<Unit> | Unit;
type Suffix = " ago" | " from now";
type Prefix = "+" | "-" | "+ " | "- ";
type BaseTimeString = `${number}${UnitAnyCase}` | `${number} ${UnitAnyCase}`;
/**
 * A typed string representing a time duration.
 * Supports formats like "7d", "30m", "1 hour", "2 hours ago", "-5m", etc.
 */
type TimeString = BaseTimeString | `${BaseTimeString}${Suffix}` | `${Prefix}${BaseTimeString}`;
/**
 * Parse a time string and return the value in milliseconds.
 *
 * @param value - A time string like "7d", "30m", "1 hour", "2 hours ago"
 * @returns The parsed value in milliseconds
 * @throws TypeError if the string format is invalid
 *
 * @example
 * ms("1d")          // 86400000
 * ms("2 hours")     // 7200000
 * ms("30s")         // 30000
 * ms("2 hours ago") // -7200000
 */
declare function ms(value: TimeString): number;
/**
 * Parse a time string and return the value in seconds.
 *
 * @param value - A time string like "7d", "30m", "1 hour", "2 hours ago"
 * @returns The parsed value in seconds (rounded)
 * @throws TypeError if the string format is invalid
 *
 * @example
 * sec("1d")          // 86400
 * sec("2 hours")     // 7200
 * sec("-30s")        // -30
 * sec("2 hours ago") // -7200
 */
declare function sec(value: TimeString): number;
//#endregion
export { TimeString, ms, sec };
//# sourceMappingURL=time.d.mts.map