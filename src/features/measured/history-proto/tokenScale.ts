/**
 * PROTOTYPE - making a token count tangible. Wayfinder ticket #80.
 *
 * "4.71B tokens" is a number nobody has a feel for. Everything here converts it
 * into something a reader has held, read or walked past.
 *
 * ONE assumption drives all of it: about 0.75 English words per token. That is
 * the usual working figure for English prose, and it is wrong for code, for
 * other languages and for the cache-heavy traffic an agent actually generates.
 * So every surface built on this file has to say "roughly" and show the rule.
 * The site's whole claim is that its numbers are honest, and a fun fact that
 * quietly pretends to be precise would spend that credit.
 */

export const WORDS_PER_TOKEN = 0.75;

/** Reference lengths, in words. */
const NOVEL = 90_000;
const WAR_AND_PEACE = 587_287;
const LOTR = 481_103;
const HARRY_POTTER_ALL = 1_084_170;
/** Every article in the English Wikipedia, prose only. */
const WIKIPEDIA = 4_900_000_000;

const READ_WPM = 238;
const SPEAK_WPM = 130;
const TYPE_WPM = 40;

const WORDS_PER_PAGE = 500;
/** Sheet thickness of ordinary 80gsm paper. */
const SHEET_MM = 0.1;
/** The long side of an A4 sheet, for pages laid end to end. */
const A4_HEIGHT_M = 0.297;

export const EIFFEL_M = 330;
export const MARATHON_M = 42_195;

export type TokenScale = {
	tokens: number;
	words: number;
	novels: number;
	warAndPeace: number;
	lotr: number;
	harryPotter: number;
	/** Share of the whole English Wikipedia, as a fraction. */
	wikipedia: number;
	readYears: number;
	speakYears: number;
	typeYears: number;
	pages: number;
	/** Height of the printed stack, double-sided, in meters. */
	paperMeters: number;
	/** The same pages laid end to end, in meters. */
	roadMeters: number;
	/** That length, counted in marathons. */
	marathons: number;
};

export function tokenScale(tokens: number): TokenScale {
	const words = tokens * WORDS_PER_TOKEN;
	const pages = words / WORDS_PER_PAGE;
	const minutesToYears = (m: number) => m / 60 / 24 / 365;
	return {
		tokens,
		words,
		novels: words / NOVEL,
		warAndPeace: words / WAR_AND_PEACE,
		lotr: words / LOTR,
		harryPotter: words / HARRY_POTTER_ALL,
		wikipedia: words / WIKIPEDIA,
		readYears: minutesToYears(words / READ_WPM),
		speakYears: minutesToYears(words / SPEAK_WPM),
		typeYears: minutesToYears(words / TYPE_WPM),
		pages,
		paperMeters: (pages / 2) * SHEET_MM * 0.001,
		roadMeters: (pages / 2) * A4_HEIGHT_M,
		marathons: ((pages / 2) * A4_HEIGHT_M) / MARATHON_M,
	};
}

// --- formatting -------------------------------------------------------------

/** A count a person can say out loud: 39,000 rather than 39,244. */
export function fmtCount(n: number): string {
	if (n >= 1e9) return `${(n / 1e9).toFixed(1)} billion`;
	if (n >= 1e6) return `${(n / 1e6).toFixed(1)} million`;
	if (n >= 10_000) return `${Math.round(n / 1000).toLocaleString("en-US")},000`;
	if (n >= 1000) return (Math.round(n / 100) * 100).toLocaleString("en-US");
	if (n >= 10) return Math.round(n).toLocaleString("en-US");
	if (n >= 1) return n.toFixed(1);
	return n.toFixed(2);
}

/** Years, or months when there are not enough years to round to one. */
export function fmtDuration(years: number): string {
	if (years >= 2) return `${Math.round(years).toLocaleString("en-US")} years`;
	const months = years * 12;
	if (months >= 2) return `${Math.round(months)} months`;
	const days = years * 365;
	if (days >= 2) return `${Math.round(days)} days`;
	return `${Math.round(days * 24)} hours`;
}

export function fmtMeters(m: number): string {
	const km = m / 1000;
	if (km >= 100) return `${Math.round(km).toLocaleString("en-US")} km`;
	if (km >= 1) return `${km.toFixed(1)} km`;
	if (m >= 1) return `${Math.round(m).toLocaleString("en-US")} m`;
	return `${Math.round(m * 100)} cm`;
}
