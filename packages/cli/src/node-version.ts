// The floor is set by `node:sqlite`, which the opencode adapter needs.
// `node:sqlite` landed in 22.5.0 but stayed behind `--experimental-sqlite`
// until 22.13.0 (and, on the 23 line, until 23.4.0): on the flagged versions
// the import throws and opencode silently drops out of detection while the
// file-based adapters keep working. So the gate refuses every flagged
// version, not just the ones below 22.5.
export const MINIMUM_NODE_VERSION = "22.13.0";

function versionParts(version: string): [number, number, number] | null {
	const match = /^(?:v)?(\d+)\.(\d+)\.(\d+)/.exec(version);
	if (!match) return null;
	return [Number(match[1]), Number(match[2]), Number(match[3])];
}

function atLeast(actual: [number, number, number], floor: string): boolean {
	const minimum = versionParts(floor);
	if (!minimum) return false;
	for (let i = 0; i < actual.length; i++) {
		if (actual[i] !== minimum[i])
			return (actual[i] as number) > (minimum[i] as number);
	}
	return true;
}

export function supportsNodeVersion(version: string): boolean {
	const actual = versionParts(version);
	if (!actual) return false;
	if (!atLeast(actual, MINIMUM_NODE_VERSION)) return false;
	// 23.0 to 23.3 still flag node:sqlite even though they sort above 22.13.
	if (actual[0] === 23) return atLeast(actual, "23.4.0");
	return true;
}

export function unsupportedNodeMessage(version: string): string {
	return `aistack requires Node.js ${MINIMUM_NODE_VERSION} or newer (23.x needs 23.4.0). You are running ${version}. Upgrade Node.js so sync can read OpenCode's SQLite usage database.`;
}
