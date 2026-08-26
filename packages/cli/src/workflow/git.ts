import { execFileSync } from "node:child_process";
import path from "node:path";
import type { GitDay } from "@aistack/workflow-rules";

/**
 * Both rules changed together in #278: a path a machine owns (a dependency
 * tree, build output, a lockfile) no longer reaches either of them, so both the
 * test-file count and the file-type mix can differ from what v1 published for
 * the same repository.
 */
export const TEST_FILE_RULE_VERSION = "test-files/v2";
export const FILE_TYPE_RULE_VERSION = "file-types/v2";
/**
 * Which commits count at all (#279). A merge commit and a commit whose every
 * path is machine-owned leave the reading. Without this id a reading synced
 * before the rule and one synced after are indistinguishable on the wire while
 * disagreeing about which commits exist.
 */
export const COMMIT_SET_RULE_VERSION = "commit-set/v1";

export type GitWorkflowRunner = (
	cwd: string,
	args: readonly string[],
) => string | null;

/** One UTC day of Git history, with the day it belongs to. */
export type GitDayRow = GitDay & { date: string };

/**
 * Git history for the touched repositories, one row per UTC day that holds a
 * counted commit (#285). A commit belongs to the day of its author time.
 */
export type GitWorkflowResult = {
	days: GitDayRow[];
};

export type ExtractGitWorkflowOptions = {
	/** Local working directories touched by sessions inside the sync window. */
	workingDirectories: Iterable<string>;
	fromMs: number;
	toMs: number;
	/**
	 * This machine's offset from UTC, in minutes east. Cells ship in UTC, and the
	 * late-night count reads those same cells through this offset, so the count
	 * and the grid always agree. Every commit uses the one offset, not its own.
	 */
	utcOffsetMinutes: number;
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

/** A day with no counted commit, carrying the rule ids a fold needs. */
export const emptyGitDay = (): GitDay => ({
	testFileRuleVersion: TEST_FILE_RULE_VERSION,
	fileTypeRuleVersion: FILE_TYPE_RULE_VERSION,
	commitSetRuleVersion: COMMIT_SET_RULE_VERSION,
	commits: 0,
	lateNightCommits: 0,
	additions: 0,
	removals: 0,
	changedLinesPerCommit: [],
	testFileCommits: 0,
	changedLinesByExtension: [],
	withheldExtensionLines: 0,
	weekdayHourCells: [],
});

type MutableGitDay = Omit<
	GitDay,
	"changedLinesPerCommit" | "changedLinesByExtension" | "weekdayHourCells"
> & {
	changedLinesPerCommit: number[];
	extensionLines: Map<string, number>;
	cells: Map<string, number>;
};

/**
 * The names this rule is willing to print. A path with no extension is absent
 * on purpose: `Dockerfile`, `LICENSE` and `.gitignore` are not coding
 * languages, and ranking them as one made the leading language of a TypeScript
 * repository read as `(none)`.
 */
const APPROVED_EXTENSIONS: ReadonlySet<string> = new Set([
	".c",
	".cc",
	".cjs",
	".cpp",
	".cs",
	".css",
	".cts",
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
	".mjs",
	".mts",
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

/**
 * Directory names a machine owns rather than a person. A dependency tree, a
 * build output directory, or a directory of captured tool output can carry
 * millions of changed lines that nobody wrote, and one accidental commit of one
 * of them is enough to bury every authored line in the reading.
 */
const UNAUTHORED_SEGMENTS: ReadonlySet<string> = new Set([
	".bundle",
	".cache",
	".cargo",
	".gradle",
	".next",
	".nuxt",
	".pnpm",
	".pnpm-store",
	".svelte-kit",
	".turbo",
	".venv",
	"_generated",
	"bower_components",
	"build",
	"coverage",
	"dist",
	"generated",
	"node_modules",
	"out",
	"pods",
	"site-packages",
	"target",
	"third_party",
	"vendor",
	"venv",
	"__pycache__",
]);

/** Dependency lockfiles. A resolver writes these, and their extension lies. */
const UNAUTHORED_BASENAMES: ReadonlySet<string> = new Set([
	"bun.lock",
	"bun.lockb",
	"cargo.lock",
	"composer.lock",
	"flake.lock",
	"gemfile.lock",
	"go.sum",
	"mix.lock",
	"npm-shrinkwrap.json",
	"package-lock.json",
	"packages.lock.json",
	"pipfile.lock",
	"pnpm-lock.yaml",
	"podfile.lock",
	"poetry.lock",
	"pubspec.lock",
	"uv.lock",
	"yarn.lock",
]);

/**
 * True when the path is machine-written rather than authored. Those lines leave
 * the reading entirely: they are not withheld, because withholding keeps a line
 * in the denominator, and a line nobody wrote does not belong in either half.
 */
function isUnauthoredPath(file: string): boolean {
	const parts = file.replaceAll("\\", "/").toLowerCase().split("/");
	if (parts.some((part) => UNAUTHORED_SEGMENTS.has(part))) return true;
	return UNAUTHORED_BASENAMES.has(parts.at(-1) ?? "");
}

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

function utcCell(authoredMs: number): { weekdayUtc: number; hourUtc: number } {
	const at = new Date(authoredMs);
	return { weekdayUtc: at.getUTCDay(), hourUtc: at.getUTCHours() };
}

/** The hour on the machine's clock for a UTC cell. */
function localHour(hourUtc: number, utcOffsetMinutes: number): number {
	return (
		((((hourUtc * 60 + utcOffsetMinutes) % (24 * 60)) + 24 * 60) % (24 * 60)) /
		60
	);
}

function isLateNight(hour: number): boolean {
	return hour >= 23 || hour < 3;
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

	const days = new Map<string, MutableGitDay>();
	const dayOf = (date: string): MutableGitDay => {
		let day = days.get(date);
		if (!day) {
			const {
				changedLinesByExtension: _extensions,
				weekdayHourCells: _cells,
				...rest
			} = emptyGitDay();
			day = {
				...rest,
				changedLinesPerCommit: [],
				extensionLines: new Map(),
				cells: new Map(),
			};
			days.set(date, day);
		}
		return day;
	};
	const seenCommits = new Set<string>();
	for (const root of roots) {
		const history = run(root, [
			"log",
			"--all",
			"--no-merges",
			`--format=%x00${COMMIT_MARKER}%x00%H%x00%aI%x00`,
			"--numstat",
			"-z",
		]);
		if (!history) continue;

		type CurrentCommit = {
			included: boolean;
			date: string;
			cell: { weekdayUtc: number; hourUtc: number };
			/** True once one path a person could have written appears. */
			authored: boolean;
			additions: number;
			removals: number;
			changedLines: number;
			touchesTest: boolean;
			withheldLines: number;
			extensionLines: Map<string, number>;
		};
		let current: CurrentCommit | undefined;
		// A commit counts only once its records are read: one with no authored
		// path leaves the reading entirely, rather than surviving as a commit
		// that changed nothing (commit-set/v1).
		const finishCommit = (): void => {
			if (!current?.included || !current.authored) return;
			const day = dayOf(current.date);
			day.commits++;
			day.additions += current.additions;
			day.removals += current.removals;
			day.changedLinesPerCommit.push(current.changedLines);
			if (current.touchesTest) day.testFileCommits++;
			const { weekdayUtc, hourUtc } = current.cell;
			if (isLateNight(localHour(hourUtc, options.utcOffsetMinutes))) {
				day.lateNightCommits++;
			}
			const cellKey = `${weekdayUtc}:${hourUtc}`;
			day.cells.set(cellKey, (day.cells.get(cellKey) ?? 0) + 1);
			day.withheldExtensionLines += current.withheldLines;
			for (const [extension, lines] of current.extensionLines) {
				day.extensionLines.set(
					extension,
					(day.extensionLines.get(extension) ?? 0) + lines,
				);
			}
		};
		const fields = history.split("\u0000");
		for (let fieldIndex = 0; fieldIndex < fields.length; fieldIndex++) {
			const field = fields[fieldIndex] ?? "";
			if (field.replace(/^\n+/, "") === COMMIT_MARKER) {
				finishCommit();
				const hash = fields[++fieldIndex] ?? "";
				const authoredAt = fields[++fieldIndex] ?? "";
				const authoredMs = Date.parse(authoredAt);
				const included =
					Number.isFinite(authoredMs) &&
					authoredMs >= options.fromMs &&
					authoredMs <= options.toMs &&
					!seenCommits.has(hash);
				current = {
					included,
					date: included ? new Date(authoredMs).toISOString().slice(0, 10) : "",
					cell: utcCell(included ? authoredMs : 0),
					authored: false,
					additions: 0,
					removals: 0,
					changedLines: 0,
					touchesTest: false,
					withheldLines: 0,
					extensionLines: new Map(),
				};
				if (included) seenCommits.add(hash);
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
			if (isUnauthoredPath(file)) continue;
			current.authored = true;
			const fileChangedLines = stat.additions + stat.removals;
			current.additions += stat.additions;
			current.removals += stat.removals;
			current.changedLines += fileChangedLines;
			if (isTestFile(file)) current.touchesTest = true;
			if (fileChangedLines <= 0) continue;
			// An empty extension is not in the approved set, so it withholds.
			const extension = path.extname(file).toLowerCase();
			if (APPROVED_EXTENSIONS.has(extension)) {
				current.extensionLines.set(
					extension,
					(current.extensionLines.get(extension) ?? 0) + fileChangedLines,
				);
			} else current.withheldLines += fileChangedLines;
		}
		finishCommit();
	}

	return {
		days: [...days]
			.sort(([a], [b]) => a.localeCompare(b))
			.map(([date, day]) => {
				const { extensionLines, cells, ...rest } = day;
				return {
					date,
					...rest,
					changedLinesByExtension: [...extensionLines]
						.map(([extension, changedLines]) => ({ extension, changedLines }))
						.sort((a, b) => a.extension.localeCompare(b.extension)),
					weekdayHourCells: [...cells]
						.map(([key, commits]) => {
							const [weekdayUtc, hourUtc] = key.split(":").map(Number);
							return {
								weekdayUtc: weekdayUtc ?? 0,
								hourUtc: hourUtc ?? 0,
								commits,
							};
						})
						.sort(
							(a, b) => a.weekdayUtc - b.weekdayUtc || a.hourUtc - b.hourUtc,
						),
				};
			}),
	};
}
