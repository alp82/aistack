import { execFile, execFileSync } from "node:child_process";
import { existsSync } from "node:fs";
import path from "node:path";
import type { GitDay } from "@aistack/workflow-rules";
import { trace, traceError } from "../trace.js";

/**
 * Both rules changed together in #278: a path a machine owns (a dependency
 * tree, build output, a lockfile) no longer reaches either of them, so both the
 * test-file count and the file-type mix can differ from what v1 published for
 * the same repository.
 */
export const TEST_FILE_RULE_VERSION = "test-files/v2";
/**
 * v3: a file over `BIG_FILE_THRESHOLD` counts no line. Git treats it as binary,
 * so its record reads `-` for both counts, the same as an image. Nobody writes
 * a megabyte of source by hand; what reaches that size is a dump, a rotated
 * log, or a generated table, and diffing it was most of the Git cost on a
 * repository that had committed a few (19 s of 20 on one monorepo).
 */
export const FILE_TYPE_RULE_VERSION = "file-types/v3";
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

export type AsyncGitWorkflowRunner = (
	cwd: string,
	args: readonly string[],
) => Promise<string | null>;

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

type ReportGitError = (
	error: unknown,
	cwd: string,
	args: readonly string[],
	stderr?: string,
) => void;

function gitDiagnostics() {
	let missing = 0;
	let nonRepositories = 0;
	const report: ReportGitError = (error, cwd, args, stderr) => {
		const details = error as { code?: unknown; stderr?: unknown };
		if (args[0] === "rev-parse") {
			if (details.code === "ENOENT" && !existsSync(cwd)) {
				missing++;
				return;
			}
			const message =
				stderr ?? (typeof details.stderr === "string" ? details.stderr : "");
			if (/not a git repository/i.test(message)) {
				nonRepositories++;
				return;
			}
		}
		traceError(
			args.includes("log") ? "git history" : "git repository discovery",
			error,
			"warn",
		);
	};
	return {
		report,
		finish: () => {
			if (missing || nonRepositories)
				trace(
					`git discovery · skipped ${missing} missing directories, ${nonRepositories} non-repository directories`,
				);
		},
	};
}

const defaultRunner = (
	cwd: string,
	args: readonly string[],
	report: ReportGitError,
): string | null => {
	try {
		return execFileSync("git", [...args], {
			cwd,
			encoding: "utf8",
			stdio: ["ignore", "pipe", "pipe"],
			maxBuffer: 64 * 1024 * 1024,
		});
	} catch (error) {
		report(error, cwd, args);
		return null;
	}
};

const defaultAsyncRunner = (
	cwd: string,
	args: readonly string[],
	report: ReportGitError,
): Promise<string | null> =>
	new Promise((resolve) => {
		execFile(
			"git",
			[...args],
			{
				cwd,
				encoding: "utf8",
				maxBuffer: 64 * 1024 * 1024,
			},
			(error, stdout, stderr) => {
				if (error) report(error, cwd, args, stderr);
				resolve(error ? null : stdout);
			},
		);
	});

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
/** Git's `core.bigFileThreshold` for the read: above it a blob is binary. */
const BIG_FILE_THRESHOLD = "1m";
/** Git processes at once. After deduplication there are few, and each is CPU-bound. */
const GIT_CONCURRENCY = 4;

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
	const diagnostics = gitDiagnostics();
	const run =
		options.run ??
		((cwd, args) => defaultRunner(cwd, args, diagnostics.report));
	const roots = new Map<string, string>();
	for (const directory of options.workingDirectories) {
		const root = parseRepositoryRoot(run(directory, gitRevParseArgs()));
		if (root && !roots.has(root.key)) roots.set(root.key, root.cwd);
	}
	diagnostics.finish();
	const histories: string[] = [];
	let index = 0;
	for (const cwd of roots.values()) {
		const done = repositoryTimer(++index, roots.size);
		const history = run(cwd, gitLogArgs());
		done(history);
		if (history) histories.push(history);
	}
	return reduceGitHistories(histories, options);
}

/** The non-blocking production path. Tests can keep using the synchronous seam. */
export async function extractGitWorkflowAsync(
	options: Omit<ExtractGitWorkflowOptions, "run"> & {
		run?: AsyncGitWorkflowRunner;
	},
): Promise<GitWorkflowResult> {
	const diagnostics = gitDiagnostics();
	const run =
		options.run ??
		((cwd, args) => defaultAsyncRunner(cwd, args, diagnostics.report));
	const roots = new Map<string, string>();
	for (const directory of options.workingDirectories) {
		const root = parseRepositoryRoot(await run(directory, gitRevParseArgs()));
		if (root && !roots.has(root.key)) roots.set(root.key, root.cwd);
	}
	diagnostics.finish();
	const queue = [...roots.values()];
	const total = queue.length;
	const histories: string[] = [];
	let index = 0;
	const worker = async (): Promise<void> => {
		for (let cwd = queue.shift(); cwd !== undefined; cwd = queue.shift()) {
			const done = repositoryTimer(++index, total);
			const history = await run(cwd, gitLogArgs());
			done(history);
			if (history) histories.push(history);
		}
	};
	await Promise.all(
		Array.from({ length: Math.min(GIT_CONCURRENCY, total) }, worker),
	);
	return reduceGitHistories(histories, options);
}

/**
 * One line asks for both: the directory every worktree of a repository shares,
 * and the top level of this checkout. The first is the identity, the second
 * is where `git log` runs.
 */
function gitRevParseArgs(): readonly string[] {
	return [
		"rev-parse",
		"--path-format=absolute",
		"--git-common-dir",
		"--show-toplevel",
	];
}

/**
 * A repository is read once, however many worktrees of it the sessions
 * touched. `--all` walks the refs of the shared directory, so two worktrees
 * hand back the same history, and the reducer's hash set was the only thing
 * keeping the duplicate reads from counting twice. On one machine 98
 * top levels were 12 repositories, and 86 reads were thrown away.
 *
 * Exposed for tests: a fake runner may answer with the top level alone, and
 * then the top level is the identity.
 */
export function parseRepositoryRoot(
	output: string | null,
): { key: string; cwd: string } | null {
	if (!output) return null;
	const [common, top] = output.split("\n").map((line) => line.trim());
	if (!common) return null;
	return { key: common, cwd: top || common };
}

function repositoryTimer(
	index: number,
	total: number,
): (history: string | null) => void {
	const started = performance.now();
	return (history) => {
		const ms = Math.round(performance.now() - started);
		const commits =
			history === null ? "unreadable" : `${countCommits(history)} commits`;
		trace(`git repository ${index}/${total} · ${ms} ms · ${commits}`);
	};
}

function countCommits(history: string): number {
	let count = 0;
	for (let at = history.indexOf(COMMIT_MARKER); at !== -1; ) {
		count++;
		at = history.indexOf(COMMIT_MARKER, at + COMMIT_MARKER.length);
	}
	return count;
}

function gitLogArgs(): readonly string[] {
	return [
		"-c",
		`core.bigFileThreshold=${BIG_FILE_THRESHOLD}`,
		"log",
		"--all",
		"--no-merges",
		`--format=%x00${COMMIT_MARKER}%x00%H%x00%aI%x00`,
		"--numstat",
		"-z",
	];
}

function reduceGitHistories(
	histories: Iterable<string>,
	options: Pick<
		ExtractGitWorkflowOptions,
		"fromMs" | "toMs" | "utcOffsetMinutes"
	>,
): GitWorkflowResult {
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
	for (const history of histories) {
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
