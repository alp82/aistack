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
} from "./reducer.js";

export type PublishableHarnessWorkflow = Omit<
	HarnessWorkflowAggregate,
	"localProjectWorkspaces" | "localActiveProjectDays"
>;

export type WorkflowExtraction = {
	aggregateVersion: typeof WORKFLOW_AGGREGATE_VERSION;
	harnesses: PublishableHarnessWorkflow[];
	git: GitWorkflowResult;
	metricInputs: FitInputRow[];
};

export type ExtractLocalWorkflowOptions = {
	harnesses: readonly HarnessWorkflowAggregate[];
	fromMs: number;
	toMs: number;
	run?: GitWorkflowRunner;
};

/** Read only repositories touched by windowed sessions, then return safe aggregates. */
export function extractLocalWorkflow(
	options: ExtractLocalWorkflowOptions,
): WorkflowExtraction {
	const git = extractGitWorkflow({
		workingDirectories: options.harnesses.flatMap(
			(workflow) => workflow.localProjectWorkspaces,
		),
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
	harnessWorkflows: readonly HarnessWorkflowAggregate[],
	git: GitWorkflowResult,
): WorkflowExtraction {
	const projectDays = new Map<string, Set<string>>();
	const webSearches = new Map<string, number>();
	const sessions: Array<NonNullable<WorkflowFacts["sessions"]>[number]> = [];

	for (const workflow of harnessWorkflows) {
		sessions.push(...workflow.facts.sessions);
		for (const day of workflow.localActiveProjectDays) {
			const projects = projectDays.get(day.date) ?? new Set<string>();
			for (const project of day.projectWorkspaces) projects.add(project);
			projectDays.set(day.date, projects);
		}
		for (const day of workflow.facts.activeDays) {
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
				webSearches: webSearches.get(date) ?? 0,
			})),
	};
	const syncedHarnesses = [
		...new Set(harnessWorkflows.map((workflow) => workflow.harness)),
	] as HarnessName[];

	return {
		aggregateVersion: WORKFLOW_AGGREGATE_VERSION,
		harnesses: harnessWorkflows.map(
			({
				localProjectWorkspaces: _paths,
				localActiveProjectDays: _days,
				...safe
			}) => safe,
		),
		git,
		metricInputs: buildFitInputs(facts, syncedHarnesses),
	};
}
