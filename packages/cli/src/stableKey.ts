export function computeStableKey(
	group: string,
	type: string,
	relPath: string,
): string {
	return `${group}:${type}:${relPath}`;
}
