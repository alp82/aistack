import {
	buildFitInputs,
	type FitInputRow,
	type HarnessName,
	type WorkflowFacts,
} from "@aistack/workflow-rules";
import {
	extractGitWorkflow,
	type GitWorkflowResult,
	type GitWorkflowRunner,
} from "./git.js";
import {
	type HarnessWorkflowAggregate,
	WORKFLOW_AGGREGATE_VERSION,
	type WorkflowLocalSources,
} from "./reducer.js";

export type PublishableHarnessWorkflow = Omit<
	HarnessWorkflowAggregate,
	"phase"
> & {
	phase?: HarnessWorkflowAggregate["phase"];
};

export type LocalHarnessWorkflow = {
	aggregate: HarnessWorkflowAggregate;
	local: WorkflowLocalSources;
};

export type WorkflowExtraction = {
	aggregateVersion: typeof WORKFLOW_AGGREGATE_VERSION;
	harnesses: PublishableHarnessWorkflow[];
	git: GitWorkflowResult;
	metricInputs: FitInputRow[];
};

export type ExtractLocalWorkflowOptions = {
	harnesses: readonly LocalHarnessWorkflow[];
	fromMs: number;
	toMs: number;
	run?: GitWorkflowRunner;
};

/** Read only repositories touched by windowed sessions, then return safe aggregates. */
export function extractLocalWorkflow(
	options: ExtractLocalWorkflowOptions,
): WorkflowExtraction {
	const git = extractGitWorkflow({
		workingDirectories: options.harnesses.flatMap(({ local }) => [
			...local.projectWorkspaces,
		]),
		fromMs: options.fromMs,
		toMs: options.toMs,
		...(options.run ? { run: options.run } : {}),
	});
	return buildWorkflowExtraction(options.harnesses, git);
}

/**
 * Join the privacy-safe harness and Git aggregates, then run the shared metric
 * rules. Local session keys, project paths, event arguments, and timestamps do
 * not enter the returned value.
 */
export function buildWorkflowExtraction(
	harnessWorkflows: readonly LocalHarnessWorkflow[],
	git: GitWorkflowResult,
): WorkflowExtraction {
	const projectDays = new Map<string, Set<string>>();
	const webSearches = new Map<string, number>();
	const webSearchDays = new Set<string>();
	const sessions: Array<NonNullable<WorkflowFacts["sessions"]>[number]> = [];

	for (const { aggregate: workflow, local } of harnessWorkflows) {
		sessions.push(...workflow.facts.sessions);
		for (const [date, workspaces] of local.activeProjectDays) {
			const projects = projectDays.get(date) ?? new Set<string>();
			for (const project of workspaces) projects.add(project);
			projectDays.set(date, projects);
		}
		for (const day of workflow.facts.activeDays) {
			if (day.webSearches === undefined) continue;
			webSearchDays.add(day.date);
			webSearches.set(
				day.date,
				(webSearches.get(day.date) ?? 0) + day.webSearches,
			);
		}
	}

	const facts: WorkflowFacts = {
		git: {
			totalCommits: git.totalCommits,
			lateNightCommits: git.lateNightCommits,
		},
		sessions,
		activeDays: [...projectDays]
			.sort(([a], [b]) => a.localeCompare(b))
			.map(([date, projects]) => ({
				date,
				parallelProjectCount: projects.size,
				...(webSearchDays.has(date)
					? { webSearches: webSearches.get(date) ?? 0 }
					: {}),
			})),
	};
	const syncedHarnesses = [
		...new Set(harnessWorkflows.map(({ aggregate }) => aggregate.harness)),
	] as HarnessName[];

	return {
		aggregateVersion: WORKFLOW_AGGREGATE_VERSION,
		harnesses: harnessWorkflows.map(({ aggregate }) => {
			const { phase, ...safe } = aggregate;
			return phase.publishable ? { ...safe, phase } : safe;
		}),
		git,
		metricInputs: buildFitInputs(facts, syncedHarnesses),
	};
}
