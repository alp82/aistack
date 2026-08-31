import {
	type GitDay,
	type HarnessDay,
	WORKFLOW_AGGREGATES_V2,
	type WorkflowDay,
} from "@aistack/workflow-rules";
import {
	emptyGitDay,
	extractGitWorkflow,
	extractGitWorkflowAsync,
	type GitWorkflowResult,
	type GitWorkflowRunner,
} from "./git.js";
import type {
	HarnessWorkflowAggregate,
	WorkflowLocalSources,
} from "./reducer.js";

export type LocalHarnessWorkflow = {
	aggregate: HarnessWorkflowAggregate;
	local: WorkflowLocalSources;
};

/**
 * The workflow section as extracted on the machine (#285): one row per UTC
 * day, each holding only combinable atoms. The server folds a window out of
 * these and computes every row there; nothing here computes a share, a median
 * or a rank.
 */
export type WorkflowExtraction = {
	aggregateVersion: typeof WORKFLOW_AGGREGATES_V2;
	/**
	 * This machine's offset from UTC, in minutes east (#218). Session hours ship
	 * in UTC, and the page renders them in the owner's local time. The machine is
	 * the only end of the wire that knows which clock the owner reads.
	 */
	utcOffsetMinutes: number;
	days: WorkflowDay[];
};

export type ExtractLocalWorkflowOptions = {
	harnesses: readonly LocalHarnessWorkflow[];
	fromMs: number;
	toMs: number;
	run?: GitWorkflowRunner;
	/** Tests only: pin the machine clock so a fixture does not move with the runner's zone. */
	utcOffsetMinutes?: number;
};

/** Read only repositories touched by windowed sessions, then return safe daily rows. */
export function extractLocalWorkflow(
	options: ExtractLocalWorkflowOptions,
): WorkflowExtraction {
	const utcOffsetMinutes =
		options.utcOffsetMinutes ?? machineUtcOffsetMinutes();
	const git = extractGitWorkflow({
		workingDirectories: options.harnesses.flatMap(({ local }) => [
			...local.projectWorkspaces,
		]),
		fromMs: options.fromMs,
		toMs: options.toMs,
		utcOffsetMinutes,
		...(options.run ? { run: options.run } : {}),
	});
	return buildWorkflowExtraction(options.harnesses, git, utcOffsetMinutes);
}

/** Production extraction with Git subprocesses that do not block terminal UI. */
export async function extractLocalWorkflowAsync(
	options: Omit<ExtractLocalWorkflowOptions, "run">,
): Promise<WorkflowExtraction> {
	const utcOffsetMinutes =
		options.utcOffsetMinutes ?? machineUtcOffsetMinutes();
	const git = await extractGitWorkflowAsync({
		workingDirectories: options.harnesses.flatMap(({ local }) => [
			...local.projectWorkspaces,
		]),
		fromMs: options.fromMs,
		toMs: options.toMs,
		utcOffsetMinutes,
	});
	return buildWorkflowExtraction(options.harnesses, git, utcOffsetMinutes);
}

/** Minutes EAST of UTC, the sign convention the wire and the page both read. */
export function machineUtcOffsetMinutes(now: Date = new Date()): number {
	return -now.getTimezoneOffset();
}

/**
 * Join the harness days and the Git days by date.
 *
 * A harness that failed its gate over the window ships every day WITHOUT its
 * phase block: the gate is a window judgment (see `HarnessWorkflowAggregate`),
 * and a day that shipped phase atoms anyway could be folded into a playbook
 * the gate refused. The parallel-project count is the union of workspaces
 * across harnesses on that day, counted here because one workspace opened by
 * two harnesses is one project.
 *
 * Local session keys, project paths, event arguments and timestamps do not
 * enter the returned value.
 */
export function buildWorkflowExtraction(
	harnessWorkflows: readonly LocalHarnessWorkflow[],
	git: GitWorkflowResult,
	utcOffsetMinutes: number = machineUtcOffsetMinutes(),
): WorkflowExtraction {
	const harnessDays = new Map<string, HarnessDay[]>();
	const projectDays = new Map<string, Set<string>>();
	for (const { aggregate, local } of harnessWorkflows) {
		for (const { date, ...day } of aggregate.days) {
			const rows = harnessDays.get(date) ?? [];
			const { phase, ...safe } = day;
			rows.push(
				aggregate.gate.publishable && phase ? { ...safe, phase } : safe,
			);
			harnessDays.set(date, rows);
		}
		for (const [date, workspaces] of local.activeProjectDays) {
			const projects = projectDays.get(date) ?? new Set<string>();
			for (const project of workspaces) projects.add(project);
			projectDays.set(date, projects);
		}
	}
	const gitDays = new Map<string, GitDay>();
	for (const { date, ...day } of git.days) gitDays.set(date, day);

	const dates = [
		...new Set([
			...harnessDays.keys(),
			...gitDays.keys(),
			...projectDays.keys(),
		]),
	].sort();

	return {
		aggregateVersion: WORKFLOW_AGGREGATES_V2,
		utcOffsetMinutes,
		days: dates.map((date) => {
			const projects = projectDays.get(date)?.size;
			return {
				date,
				harnesses: harnessDays.get(date) ?? [],
				git: gitDays.get(date) ?? emptyGitDay(),
				...(projects === undefined ? {} : { parallelProjects: projects }),
			};
		}),
	};
}
