import { execFileSync } from "node:child_process";
import path from "node:path";

export type GitWorkflowRunner = (
	cwd: string,
	args: readonly string[],
) => string | null;

export type GitWorkflowResult = {
	totalCommits: number;
	lateNightCommits: number;
	additions: number;
	removals: number;
	changedLinesPerCommit: number[];
	testFileCommits: number;
	changedLinesByExtension: Array<{
		extension: string;
		changedLines: number;
	}>;
	weekdayHourCells: Array<{
		/** Sunday is 0 and Saturday is 6, in the commit author's local date. */
		weekday: number;
		hour: number;
		commits: number;
	}>;
};

export type ExtractGitWorkflowOptions = {
	/** Local working directories touched by sessions inside the sync window. */
	workingDirectories: Iterable<string>;
	fromMs: number;
	toMs: number;
	run?: GitWorkflowRunner;
};

const defaultRunner: GitWorkflowRunner = (cwd, args) => {
	try {
		return execFileSync("git", [...args], {
			cwd,
			encoding: "utf8",
			stdio: ["ignore", "pipe", "ignore"],
			maxBuffer: 64 * 1024 * 1024,
		});
	} catch {
		return null;
	}
};

const emptyResult = (): GitWorkflowResult => ({
	totalCommits: 0,
	lateNightCommits: 0,
	additions: 0,
	removals: 0,
	changedLinesPerCommit: [],
	testFileCommits: 0,
	changedLinesByExtension: [],
	weekdayHourCells: [],
});

const NUMSTAT_RE = /^(\d+|-)\t(\d+|-)\t(.*)$/;
const AUTHOR_LOCAL_RE =
	/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})$/;

function isTestFile(file: string): boolean {
	const normalized = file.replaceAll("\\", "/").toLowerCase();
	const parts = normalized.split("/");
	if (parts.some((part) => ["test", "tests", "__tests__"].includes(part))) {
		return true;
	}
	const basename = parts.at(-1) ?? "";
	return /(?:^|[._-])(test|spec)(?:[._-]|$)/.test(basename);
}

function localCell(
	authoredAt: string,
): { weekday: number; hour: number } | null {
	const match = AUTHOR_LOCAL_RE.exec(authoredAt);
	if (!match) return null;
	const year = Number(match[1]);
	const month = Number(match[2]);
	const day = Number(match[3]);
	const hour = Number(match[4]);
	return {
		weekday: new Date(Date.UTC(year, month - 1, day)).getUTCDay(),
		hour,
	};
}

/**
 * Reduce Git history for the repositories touched by windowed harness sessions.
 * Repository roots and paths exist only during this call and never enter the result.
 */
export function extractGitWorkflow(
	options: ExtractGitWorkflowOptions,
): GitWorkflowResult {
	const run = options.run ?? defaultRunner;
	const roots = new Set<string>();
	for (const directory of options.workingDirectories) {
		const root = run(directory, ["rev-parse", "--show-toplevel"])?.trim();
		if (root) roots.add(root);
	}

	const result = emptyResult();
	const extensionLines = new Map<string, number>();
	const cells = new Map<string, number>();
	const seenCommits = new Set<string>();
	const from = new Date(options.fromMs).toISOString();
	const to = new Date(options.toMs).toISOString();

	for (const root of roots) {
		const history = run(root, [
			"log",
			`--since=${from}`,
			`--until=${to}`,
			"--format=%x1e%H%x00%aI",
			"--numstat",
			"--no-renames",
		]);
		if (!history) continue;

		for (const rawCommit of history.split("\u001e")) {
			const lines = rawCommit.split("\n");
			const header = lines.shift()?.trim() ?? "";
			const separator = header.indexOf("\u0000");
			if (separator <= 0) continue;
			const hash = header.slice(0, separator);
			const authoredAt = header.slice(separator + 1);
			const authoredMs = Date.parse(authoredAt);
			const cell = localCell(authoredAt);
			if (
				!cell ||
				!Number.isFinite(authoredMs) ||
				authoredMs < options.fromMs ||
				authoredMs > options.toMs
			) {
				continue;
			}
			if (seenCommits.has(hash)) continue;
			seenCommits.add(hash);

			result.totalCommits++;
			if (cell.hour >= 23 || cell.hour < 3) result.lateNightCommits++;
			const cellKey = `${cell.weekday}:${cell.hour}`;
			cells.set(cellKey, (cells.get(cellKey) ?? 0) + 1);

			let changedLines = 0;
			let touchesTest = false;
			for (const line of lines) {
				const match = NUMSTAT_RE.exec(line);
				if (!match) continue;
				const additions = match[1] === "-" ? 0 : Number(match[1]);
				const removals = match[2] === "-" ? 0 : Number(match[2]);
				const file = match[3] ?? "";
				const fileChangedLines = additions + removals;
				result.additions += additions;
				result.removals += removals;
				changedLines += fileChangedLines;
				if (isTestFile(file)) touchesTest = true;
				if (fileChangedLines > 0) {
					const extension = path.extname(file).toLowerCase() || "(none)";
					extensionLines.set(
						extension,
						(extensionLines.get(extension) ?? 0) + fileChangedLines,
					);
				}
			}
			result.changedLinesPerCommit.push(changedLines);
			if (touchesTest) result.testFileCommits++;
		}
	}

	result.changedLinesByExtension = [...extensionLines]
		.map(([extension, changedLines]) => ({ extension, changedLines }))
		.sort((a, b) => a.extension.localeCompare(b.extension));
	result.weekdayHourCells = [...cells]
		.map(([key, commits]) => {
			const [weekday, hour] = key.split(":").map(Number);
			return { weekday: weekday ?? 0, hour: hour ?? 0, commits };
		})
		.sort((a, b) => a.weekday - b.weekday || a.hour - b.hour);

	return result;
}
