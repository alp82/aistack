import slugify from "slugify";

export function asciify(value: string): string {
	return slugify(value, {
		lower: false,
		strict: false,
		trim: true,
	});
}

export function slugifyAscii(value: string, fallback: string): string {
	const base = slugify(value, {
		lower: true,
		strict: true,
		trim: true,
	});

	if (base) {
		return base;
	}

	return slugify(fallback, {
		lower: true,
		strict: true,
		trim: true,
	});
}
