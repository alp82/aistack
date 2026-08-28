const ACCENT_CLASS = /^accent-[a-z]+$/;

/**
 * The `.accent-<key>` class nearest to an element, walking up from the
 * element itself. Portaled surfaces (hover cards, dialogs) mount on
 * `document.body`, outside the stack page's accent wrapper, so they read
 * the class here and carry it along (alp82/aistack#298).
 *
 * Walks every ancestor: a utility such as `hover:text-accent-lime` on the
 * way up is not a wrapper and must not stop the search.
 */
export function accentClassOf(
	el: Element | null | undefined,
): string | undefined {
	for (let node = el; node; node = node.parentElement) {
		for (const c of node.classList) {
			if (ACCENT_CLASS.test(c)) return c;
		}
	}
	return undefined;
}
