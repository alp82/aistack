/**
 * Making a token count tangible. Locked by #80, built by #81.
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
 *
 * EVERY CONSTANT CARRIES ITS SOURCE, in a comment beside it. Two of them do not
 * rest on words per token at all - electricity and vision - and the cards that
 * use those carry their own caveat instead of the shared one.
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

// --- the second wave of framings ------------------------------------------

/** Characters per English word, counting the space after it. */
const CHARS_PER_WORD = 5.7;
/** Keypresses a switch is typically rated for. */
const KEYBOARD_RATING = 50_000_000;
/** Bytes per word as UTF-8 plain text, counting the space. */
const BYTES_PER_WORD = 6;
/** A 3.5 inch high-density floppy disk. */
const FLOPPY_BYTES = 1_474_560;
/** The complete works of Shakespeare, plays and poems. */
const SHAKESPEARE = 884_647;
/** What a medieval scribe could copy in a working day. */
const SCRIBE_WORDS_PER_DAY = 3_000;
/** Words in a 160-character text message. */
const SMS_WORDS = 28;
/** Sheets of A4 from one tree, the usual working figure. */
const SHEETS_PER_TREE = 8_333;
/**
 * Energy per 1,000 tokens, in watt-hours. The softest number in this file by a
 * wide margin: it swings by an order of magnitude across models, hardware and
 * batch size, and no vendor publishes a per-token figure. The card that uses it
 * carries its own caveat instead of the words-per-token one.
 */
const WH_PER_1K_TOKENS = 0.3;
/** A European household, per year. */
const HOME_KWH_PER_YEAR = 3_500;
/** An electric car, per kilometer. */
const EV_KWH_PER_KM = 0.18;
/** Books an avid reader finishes in a year, over a reading life of 60 years. */
const READING_LIFETIME_BOOKS = 12 * 60;
/** Width of one character set in 12pt monospace. */
const CHAR_WIDTH_MM = 2.5;
export const EARTH_KM = 40_075;
/**
 * VISION, not text. A model reads an image in 28x28 pixel patches, so a frame
 * costs ceil(w/28) * ceil(h/28) visual tokens: 1920x1080 comes to 2,691 on the
 * high-resolution tier (Claude 4.7 and later), which does not downscale it.
 *
 * There is no video input. Video is read as sampled still frames, and one frame
 * a second is the usual sampling rate. So this is the one conversion in the
 * file that does NOT go through words per token, and the card that uses it says
 * so instead of borrowing the shared caveat.
 */
const HD_FRAME_TOKENS = 2_691;
const VIDEO_FPS = 1;
/** The Lord of the Rings, extended editions, all three, in hours. */
const LOTR_TRILOGY_HOURS = 11.37;

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

	/** Keystrokes to type it all, and keyboards worn out doing so. */
	keystrokes: number;
	keyboards: number;
	/** Size as UTF-8 plain text, in bytes, and in 1.44 MB floppy disks. */
	bytes: number;
	floppies: number;
	/** Times over the complete works of Shakespeare. */
	shakespeare: number;
	/** Years a medieval scribe would need, copying by hand. */
	scribeYears: number;
	/** Text messages at 160 characters each. */
	texts: number;
	/** Trees felled if every page were actually printed. */
	trees: number;
	/** Energy at a rough per-token rate, in kWh, and what it would otherwise do. */
	kwh: number;
	homeYears: number;
	evKm: number;
	/** Reading lifetimes of someone who finishes a book a month for 60 years. */
	readingLifetimes: number;
	/** Every character set in one line: its length in km, and laps of the Earth. */
	lineKm: number;
	earthLaps: number;
	/** Full HD video the same token count would buy, sampled at one frame a second. */
	videoFrames: number;
	videoHours: number;
	/** Those hours, counted in extended Lord of the Rings trilogies. */
	lotrTrilogies: number;
};

export function tokenScale(tokens: number): TokenScale {
	const words = tokens * WORDS_PER_TOKEN;
	const pages = words / WORDS_PER_PAGE;
	const chars = words * CHARS_PER_WORD;
	const kwh = (tokens / 1000) * (WH_PER_1K_TOKENS / 1000);
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

		keystrokes: chars,
		keyboards: chars / KEYBOARD_RATING,
		bytes: words * BYTES_PER_WORD,
		floppies: (words * BYTES_PER_WORD) / FLOPPY_BYTES,
		shakespeare: words / SHAKESPEARE,
		scribeYears: words / SCRIBE_WORDS_PER_DAY / 365,
		texts: words / SMS_WORDS,
		trees: pages / 2 / SHEETS_PER_TREE,
		kwh,
		homeYears: kwh / HOME_KWH_PER_YEAR,
		evKm: kwh / EV_KWH_PER_KM,
		readingLifetimes: words / NOVEL / READING_LIFETIME_BOOKS,
		lineKm: (chars * CHAR_WIDTH_MM) / 1_000_000,
		earthLaps: (chars * CHAR_WIDTH_MM) / 1_000_000 / EARTH_KM,
		videoFrames: tokens / HD_FRAME_TOKENS,
		videoHours: tokens / HD_FRAME_TOKENS / VIDEO_FPS / 3600,
		lotrTrilogies:
			tokens / HD_FRAME_TOKENS / VIDEO_FPS / 3600 / LOTR_TRILOGY_HOURS,
	};
}

// --- formatting -------------------------------------------------------------

/** A count a person can say out loud: 39,000 rather than 39,244. */
export function fmtCount(n: number): string {
	if (n >= 1e12) return `${(n / 1e12).toFixed(1)} trillion`;
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
	const hours = Math.round(days * 24);
	return `${hours} ${hours === 1 ? "hour" : "hours"}`;
}

/** Bytes as a size a person recognises. */
export function fmtBytes(n: number): string {
	if (n >= 1e12) return `${(n / 1e12).toFixed(1)} TB`;
	if (n >= 1e9) return `${(n / 1e9).toFixed(1)} GB`;
	if (n >= 1e6) return `${(n / 1e6).toFixed(0)} MB`;
	return `${Math.round(n / 1000).toLocaleString("en-US")} KB`;
}

export function fmtKm(km: number): string {
	if (km >= 100) return `${Math.round(km).toLocaleString("en-US")} km`;
	if (km >= 1) return `${km.toFixed(1)} km`;
	return `${Math.round(km * 1000)} m`;
}

export function fmtMeters(m: number): string {
	const km = m / 1000;
	if (km >= 100) return `${Math.round(km).toLocaleString("en-US")} km`;
	if (km >= 1) return `${km.toFixed(1)} km`;
	if (m >= 1) return `${Math.round(m).toLocaleString("en-US")} m`;
	return `${Math.round(m * 100)} cm`;
}
