import { readdir, realpath, stat } from "node:fs/promises";
import { homedir } from "node:os";
import path from "node:path";
import { traceError } from "../../trace.js";

/** Discover transcript folders without opening account settings or credentials. */
export async function discoverClaudeRoots(): Promise<{
	roots: string[];
	complete: boolean;
}> {
	const home = homedir();
	const configHome = process.env.XDG_CONFIG_HOME || path.join(home, ".config");
	const dataHome =
		process.env.XDG_DATA_HOME || path.join(home, ".local", "share");
	let complete = true;
	const failed = (error: unknown) => {
		const code = (error as NodeJS.ErrnoException)?.code;
		if (code === "ENOENT" || code === "ENOTDIR") return;
		complete = false;
		traceError("claude profile discovery", error, "warn");
	};
	const children = async (dir: string, prefix = ""): Promise<string[]> => {
		try {
			return (await readdir(dir, { withFileTypes: true }))
				.filter(
					(entry) =>
						entry.name.startsWith(prefix) &&
						(entry.isDirectory() || entry.isSymbolicLink()),
				)
				.map((entry) => path.join(dir, entry.name))
				.sort();
		} catch (error) {
			failed(error);
			return [];
		}
	};
	const configured = (process.env.CLAUDE_CONFIG_DIR ?? "")
		.split(",")
		.map((s) => s.trim())
		.filter(Boolean)
		.map((dir) =>
			path.resolve(dir.startsWith("~/") ? path.join(home, dir.slice(2)) : dir),
		);
	// An account-specific shell must still scan the other profiles. Otherwise a
	// later complete sync from that shell would replace their published days.
	const profiles = new Set([
		path.join(home, ".claude"),
		path.join(configHome, "claude"),
		...configured,
		...(await children(home, ".claude")),
		...(await children(configHome, "claude")),
	]);
	for (const profile of [...profiles]) {
		for (const collection of ["profiles", "accounts"]) {
			for (const child of await children(path.join(profile, collection)))
				profiles.add(child);
		}
	}
	// Claude Swap stores persistent session profiles beneath these roots. Legacy
	// layouts also keep numbered profile folders directly inside the backup root.
	for (const manager of [
		path.join(home, ".claude-swap-backup"),
		path.join(dataHome, "claude-swap"),
	]) {
		for (const collection of [manager, path.join(manager, "sessions")]) {
			for (const child of await children(collection)) profiles.add(child);
		}
	}
	const roots = new Set<string>();
	for (const profile of profiles) {
		const projects = path.join(profile, "projects");
		try {
			if ((await stat(projects)).isDirectory())
				roots.add(await realpath(projects));
		} catch (error) {
			failed(error);
		}
	}
	return { roots: [...roots], complete };
}

export async function transcriptRoots(): Promise<string[]> {
	return (await discoverClaudeRoots()).roots;
}
