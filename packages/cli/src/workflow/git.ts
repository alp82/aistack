import { execFileSync } from "node:child_process";
import path from "node:path";

export const TEST_FILE_RULE_VERSION = "test-files/v1";
export const FILE_TYPE_RULE_VERSION = "file-types/v1";

export type GitWorkflowRunner = (
	cwd: string,
	args: readonly string[],
) => string | null;

export type GitWorkflowResult = {
	testFileRuleVersion: typeof TEST_FILE_RULE_VERSION;
	fileTypeRuleVersion: typeof FILE_TYPE_RULE_VERSION;
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
	withheldExtensionLines: number;
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
	testFileRuleVersion: TEST_FILE_RULE_VERSION,
	fileTypeRuleVersion: FILE_TYPE_RULE_VERSION,
	totalCommits: 0,
	lateNightCommits: 0,
	additions: 0,
	removals: 0,
	changedLinesPerCommit: [],
	testFileCommits: 0,
	changedLinesByExtension: [],
	withheldExtensionLines: 0,
	weekdayHourCells: [],
});

const AUTHOR_LOCAL_RE =
	/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})$/;

const APPROVED_EXTENSIONS: ReadonlySet<string> = new Set([
	"(none)",
	".c",
	".cc",
	".cpp",
	".cs",
	".css",
	".dart",
	".ex",
	".exs",
	".go",
	".h",
	".hpp",
	".html",
	".java",
	".js",
	".jsx",
	".json",
	".kt",
	".kts",
	".lua",
	".md",
	".php",
	".py",
	".r",
	".rb",
	".rs",
	".scala",
	".scss",
	".sh",
	".sql",
	".svelte",
	".swift",
	".toml",
	".ts",
	".tsx",
	".vue",
	".xml",
	".yaml",
	".yml",
	".zig",
]);

const COMMIT_MARKER = "aistack-commit";

function parseNumstat(
	field: string,
): { additions: number; removals: number; file: string } | null {
	const normalized = field.replace(/^\n+(?=(?:\d+|-)\t)/, "");
	const firstTab = normalized.indexOf("\t");
	const secondTab = normalized.indexOf("\t", firstTab + 1);
	if (firstTab <= 0 || secondTab <= firstTab) return null;
	const additionsRaw = normalized.slice(0, firstTab);
	const removalsRaw = normalized.slice(firstTab + 1, secondTab);
	if (!/^(?:\d+|-)$/.test(additionsRaw)) return null;
	if (!/^(?:\d+|-)$/.test(removalsRaw)) return null;
	return {
		additions: additionsRaw === "-" ? 0 : Number(additionsRaw),
		removals: removalsRaw === "-" ? 0 : Number(removalsRaw),
		file: normalized.slice(secondTab + 1),
	};
}

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
	for (const root of roots) {
		const history = run(root, [
			"log",
			"--all",
			`--format=%x00${COMMIT_MARKER}%x00%H%x00%aI%x00`,
			"--numstat",
			"-z",
		]);
		if (!history) continue;

		type CurrentCommit = {
			included: boolean;
			changedLines: number;
			touchesTest: boolean;
		};
		let current: CurrentCommit | undefined;
		const finishCommit = (): void => {
			if (!current?.included) return;
			result.changedLinesPerCommit.push(current.changedLines);
			if (current.touchesTest) result.testFileCommits++;
		};
		const fields = history.split("\u0000");
		for (let fieldIndex = 0; fieldIndex < fields.length; fieldIndex++) {
			const field = fields[fieldIndex] ?? "";
			if (field.replace(/^\n+/, "") === COMMIT_MARKER) {
				finishCommit();
				const hash = fields[++fieldIndex] ?? "";
				const authoredAt = fields[++fieldIndex] ?? "";
				const authoredMs = Date.parse(authoredAt);
				const cell = localCell(authoredAt);
				const included =
					cell !== null &&
					Number.isFinite(authoredMs) &&
					authoredMs >= options.fromMs &&
					authoredMs <= options.toMs &&
					!seenCommits.has(hash);
				current = { included, changedLines: 0, touchesTest: false };
				if (!included || !cell) continue;
				seenCommits.add(hash);
				result.totalCommits++;
				if (cell.hour >= 23 || cell.hour < 3) result.lateNightCommits++;
				const cellKey = `${cell.weekday}:${cell.hour}`;
				cells.set(cellKey, (cells.get(cellKey) ?? 0) + 1);
				continue;
			}

			const stat = parseNumstat(field);
			if (!stat) continue;
			let file = stat.file;
			if (file.length === 0) {
				fieldIndex += 2;
				file = fields[fieldIndex] ?? fields[fieldIndex - 1] ?? "";
			}
			if (!current?.included) continue;
			const fileChangedLines = stat.additions + stat.removals;
			result.additions += stat.additions;
			result.removals += stat.removals;
			current.changedLines += fileChangedLines;
			if (isTestFile(file)) current.touchesTest = true;
			if (fileChangedLines <= 0) continue;
			const extension = path.extname(file).toLowerCase() || "(none)";
			if (APPROVED_EXTENSIONS.has(extension)) {
				extensionLines.set(
					extension,
					(extensionLines.get(extension) ?? 0) + fileChangedLines,
				);
			} else result.withheldExtensionLines += fileChangedLines;
		}
		finishCommit();
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
