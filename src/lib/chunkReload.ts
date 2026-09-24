// A deploy replaces every hashed file under /assets. A tab (or a crawler's
// renderer) holding HTML from before the deploy then imports a chunk that no
// longer exists, and the route fails. One reload fetches fresh HTML with the
// current hashes. The guard keeps a chunk that is missing for another reason
// from reloading in a loop.

const CHUNK_ERROR_PATTERNS = [
	"Failed to fetch dynamically imported module", // Chromium
	"error loading dynamically imported module", // Firefox
	"Importing a module script failed", // Safari
	"Unable to preload CSS", // Vite preload helper
];

const RELOAD_KEY = "aistack:chunk-reload";
const RELOAD_WINDOW_MS = 30_000;

export function isChunkLoadError(error: unknown): boolean {
	const message = error instanceof Error ? error.message : String(error);
	return CHUNK_ERROR_PATTERNS.some((pattern) => message.includes(pattern));
}

/**
 * Records a reload attempt and returns true when the caller should reload.
 * Returns false when a reload already ran in the last 30 seconds, or when
 * storage is unavailable (no guard means no reload).
 */
export function claimChunkReload(
	storage: Pick<Storage, "getItem" | "setItem"> | undefined,
	now: number,
): boolean {
	if (!storage) return false;
	try {
		const last = Number(storage.getItem(RELOAD_KEY));
		if (last && now - last < RELOAD_WINDOW_MS) return false;
		storage.setItem(RELOAD_KEY, String(now));
		return true;
	} catch {
		return false;
	}
}
