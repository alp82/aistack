// "Is this harness alive?" — the detection primitive behind every adapter's
// `detect()` (#101, decided in #100).
//
// A directory that merely exists proves nothing: a Claude Code install from
// months ago leaves its transcript root behind forever, and detection keyed on
// that root scanned it, published a dead snapshot next to a live one, and asked
// its owner to connect a harness they had stopped using.
//
// So detection asks the same question the scan asks: did this harness write
// anything inside the rolling window? It answers with `stat` calls only —
// nothing is opened, nothing is parsed. A live harness answers on the first
// recent file it meets, which is usually the first file it meets. A dead
// harness pays a full walk of stats to say no, which is the cost the old
// `exists()` check saved and the reason the answer was wrong.
//
// Directory mtimes cannot prune this walk. `claude/scan.ts` verified why:
// appending to a file does not move its parent directory's mtime, so a resumed
// session writes in-window records into a directory that looks untouched.

import type { Dirent, Stats } from "node:fs";
import { readdir, stat } from "node:fs/promises";
import path from "node:path";

export type RecencyOptions = {
	/** Override the directory reader. Tests only. */
	readdirImpl?: (dir: string) => Promise<Dirent[]>;
	/** Override the stat call. Tests only. */
	statImpl?: (file: string) => Promise<Stats>;
};

/**
 * True when any file under `roots` whose basename passes `matches` was modified
 * at or after `sinceMs`. Unreadable directories and files are silence, not an
 * error — the same fail-quiet rule the scanners hold, and for the same reason:
 * the error object carries the absolute path.
 */
export async function hasRecentFile(
	roots: readonly string[],
	matches: (basename: string) => boolean,
	sinceMs: number,
	opts: RecencyOptions = {},
): Promise<boolean> {
	const readDir =
		opts.readdirImpl ??
		((dir: string) => readdir(dir, { withFileTypes: true }));
	const statFile = opts.statImpl ?? stat;

	const seen = new Set<string>();
	const pending: string[] = [...roots];
	while (pending.length > 0) {
		const dir = pending.pop() as string;
		if (seen.has(dir)) continue;
		seen.add(dir);

		let entries: Dirent[];
		try {
			entries = await readDir(dir);
		} catch {
			continue;
		}
		for (const e of entries) {
			const full = path.join(dir, e.name);
			if (e.isDirectory()) {
				pending.push(full);
				continue;
			}
			if (!e.isFile() || !matches(e.name)) continue;
			try {
				const st = await statFile(full);
				if (st.mtimeMs >= sinceMs) return true;
			} catch {
				/* unreadable file — it proves nothing either way */
			}
		}
	}
	return false;
}
