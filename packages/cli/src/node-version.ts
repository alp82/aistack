export const MINIMUM_NODE_VERSION = "22.5.0";

function versionParts(version: string): [number, number, number] | null {
	const match = /^(?:v)?(\d+)\.(\d+)\.(\d+)/.exec(version);
	if (!match) return null;
	return [Number(match[1]), Number(match[2]), Number(match[3])];
}

export function supportsNodeVersion(version: string): boolean {
	const actual = versionParts(version);
	const minimum = versionParts(MINIMUM_NODE_VERSION);
	if (!actual || !minimum) return false;

	for (let i = 0; i < actual.length; i++) {
		if (actual[i] !== minimum[i]) return actual[i] > minimum[i];
	}
	return true;
}

export function unsupportedNodeMessage(version: string): string {
	return `aistack requires Node.js ${MINIMUM_NODE_VERSION} or newer. You are running ${version}. Upgrade Node.js so sync can read OpenCode's SQLite usage database.`;
}
