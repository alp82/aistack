/**
 * Pure handle validation shared by the client (profile editor feedback) and
 * Convex (`creators.updateProfile` / `creators.checkHandle`).
 *
 * A handle is the creator slug rendered under `/@<handle>`. Format:
 * lowercase `[a-z0-9-]`, 3-40 chars, no leading/trailing hyphen.
 *
 * RESERVED_HANDLES is defense-in-depth: handles live under `/@` so root-route
 * collisions can't happen; the blocklist is cheap insurance, not the
 * load-bearing guard.
 */

const HANDLE_PATTERN = /^[a-z0-9-]+$/;

const HANDLE_MIN_LENGTH = 3;
const HANDLE_MAX_LENGTH = 40;

const RESERVED_HANDLES = [
	"about",
	"admin",
	"api",
	"assets",
	"auth-callback",
	"cli",
	"edit",
	"forgot-password",
	"index",
	"new",
	"prototype",
	"reset-password",
	"settings",
	"signin",
	"signin-create",
	"stacks",
	"static",
	"test",
	"tools",
	"waitlist",
];

/**
 * Validate a handle. Returns a human-readable error string, or null when the
 * handle is valid.
 */
function validateHandle(handle: string): string | null {
	if (handle.length < HANDLE_MIN_LENGTH) {
		return `Handle must be at least ${HANDLE_MIN_LENGTH} characters`;
	}
	if (handle.length > HANDLE_MAX_LENGTH) {
		return `Handle must be at most ${HANDLE_MAX_LENGTH} characters`;
	}
	if (!HANDLE_PATTERN.test(handle)) {
		return "Handle may only contain lowercase letters, digits, and hyphens";
	}
	if (handle.startsWith("-") || handle.endsWith("-")) {
		return "Handle may not start or end with a hyphen";
	}
	if (RESERVED_HANDLES.includes(handle)) {
		return "This handle is reserved";
	}
	return null;
}

export { HANDLE_PATTERN, RESERVED_HANDLES, validateHandle };
