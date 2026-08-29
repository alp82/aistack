/**
 * models.dev provider logos are single-color SVGs painted with `currentColor`,
 * which renders black inside an <img>. The site defaults to dark, so those
 * logos are inverted unless the root carries the `.light` class.
 */
export const MONOCHROME_LOGO_HOST = "https://models.dev/logos/";

export function isMonochromeLogo(src?: string | null): boolean {
	return typeof src === "string" && src.startsWith(MONOCHROME_LOGO_HOST);
}

/** Tailwind classes that flip a monochrome logo to the current theme. */
export function monochromeLogoClass(src?: string | null): string | undefined {
	return isMonochromeLogo(src) ? "invert [.light_&]:invert-0" : undefined;
}
