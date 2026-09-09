import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import path from "node:path";

export type GrokDateHints = Record<string, string[]>;
type Cache = Record<string, GrokDateHints>;
const defaultFile = path.join(
	homedir(),
	".config",
	"aistack",
	"grok-session-dates.json",
);

export function grokCacheScope(
	baseUrl: string,
	stack: string,
	token: string,
): string {
	return createHash("sha256")
		.update(`${baseUrl}\0${stack}\0${token}`)
		.digest("hex");
}
function read(file: string): Cache {
	if (!existsSync(file)) return {};
	try {
		const value = JSON.parse(readFileSync(file, "utf8"));
		return value && typeof value === "object" ? (value as Cache) : {};
	} catch {
		return {};
	}
}
export function loadGrokDateHints(
	scope: string,
	file = defaultFile,
): GrokDateHints {
	return read(file)[scope] ?? {};
}
export function saveGrokDateHints(
	scope: string,
	hints: GrokDateHints,
	file = defaultFile,
): void {
	const cache = read(file);
	cache[scope] = hints;
	mkdirSync(path.dirname(file), { recursive: true });
	writeFileSync(file, JSON.stringify(cache, null, 2));
}
export function mapToHints(
	value: Map<string, Set<string>>,
	floor: string,
): GrokDateHints {
	return Object.fromEntries(
		[...value].map(([id, dates]) => [
			id,
			[...dates].filter((d) => d >= floor).sort(),
		]),
	);
}
