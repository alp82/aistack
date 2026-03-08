import slugify from "slugify";

/**
 * Normalize and transliterate a string to ASCII.
 * Uses Unicode NFD normalization to decompose accented characters,
 * then removes diacritical marks for consistent cross-environment behavior.
 *
 * Examples: François → Francois, café → cafe, über → uber
 */
function transliterateToAscii(value: string): string {
	return value
		.normalize("NFD") // Decompose: é → e + ́ (combining accent)
		.replace(/[\u0300-\u036f]/g, "") // Remove combining diacritical marks
		.replace(/ø/g, "o") // Handle special Nordic chars
		.replace(/Ø/g, "O")
		.replace(/æ/g, "ae")
		.replace(/Æ/g, "AE")
		.replace(/œ/g, "oe")
		.replace(/Œ/g, "OE")
		.replace(/ß/g, "ss")
		.replace(/ð/g, "d")
		.replace(/Ð/g, "D")
		.replace(/þ/g, "th")
		.replace(/Þ/g, "TH")
		.replace(/ł/g, "l")
		.replace(/Ł/g, "L");
}

export function asciify(value: string): string {
	return slugify(transliterateToAscii(value), {
		lower: false,
		strict: false,
		trim: true,
	});
}

export function slugifyAscii(value: string, fallback: string): string {
	const base = slugify(transliterateToAscii(value), {
		lower: true,
		strict: true,
		trim: true,
	});

	if (base) {
		return base;
	}

	return slugify(transliterateToAscii(fallback), {
		lower: true,
		strict: true,
		trim: true,
	});
}
