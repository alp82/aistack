// Stage one send: scan every ACTIVE harness → build → derive the gate's text
// from the exact bytes. Active, not installed: a harness with nothing in the
// window is not scanned and does not publish, so a dead Claude Code install no
// longer lands a stale snapshot next to a live Codex one (#101).
//
// Wayfinder ticket #41 (map #29), widened to the adapter seam by #67 (map
// #60). The staged `bodyJson` string IS what a publish transmits - the summary
// and the dialog are derived from it and from nothing else, so the user can
// never approve a sentence about different bytes (#35's binding constraint).
// The publish tool takes only the stage id; it can name WHICH staged send to
// release, never what is in it.
//
// One stage covers ALL detected harnesses (#66 decision 4): the payloads ride
// in one request so the server can land them atomically, and the kept-private
// union is one list because consent is per name, not per harness.

import { createHash } from "node:crypto";
import {
	getProjectWorkspaceId,
	getSettings,
	getToken,
	type Settings,
} from "../config.js";
import { detectedAdapters } from "../harness/index.js";
import {
	type KeptPrivateAtom,
	type LoadedSyncConfig,
	loadSyncConfig,
	type NameCategory,
	type SyncConfig,
} from "../harness/shared/allowlist.js";
import {
	type BuiltPayload,
	buildPayload,
	buildSyncBody,
	mergeKeptPrivate,
	type SyncBody,
	type SyncTrigger,
} from "../harness/shared/payload.js";
import {
	DEFAULT_WINDOW_DAYS,
	type ScanStats,
	windowStartMs,
} from "../harness/shared/window.js";
import type { HarnessAdapter } from "../harness/types.js";
import { CLI_VERSION } from "../version.js";
import {
	extractLocalWorkflow,
	type GitWorkflowRunner,
	type LocalHarnessWorkflow,
	type WorkflowExtraction,
} from "../workflow/index.js";
import { buildGateDialog, buildGateSummary } from "./summary.js";

export type StagedSend = {
	/** Content-derived: the sha256 prefix of `bodyJson`. Same bytes, same id. */
	id: string;
	/** The exact request body a publish sends, already serialized. */
	bodyJson: string;
	body: SyncBody;
	keptPrivate: Record<NameCategory, KeptPrivateAtom[]>;
	summary: string;
	dialog: string;
	config: SyncConfig;
	token: string | null;
	stagedAt: number;
	/**
	 * `null` when this stage may not publish, with `blockedReason` saying why.
	 * A gate that cannot name its destination must not send (#33 decision 7),
	 * so no token and no resolved stack both block here, before any dialog.
	 */
	blockedReason: string | null;
};

export type StageDeps = {
	baseUrl: string;
	now?: () => number;
	getTokenImpl?: () => string | null;
	getProjectWorkspaceIdImpl?: (directory: string) => string;
	loadConfigImpl?: (opts: {
		baseUrl: string;
		token?: string;
	}) => Promise<LoadedSyncConfig>;
	/** Override the adapter set. Tests only. */
	adaptersImpl?: (sinceMs: number) => Promise<HarnessAdapter[]>;
	/** Override the Git reader the workflow extraction shells out to. Tests only. */
	gitRunnerImpl?: GitWorkflowRunner;
	getSettingsImpl?: () => Settings;
	windowDays?: number;
	/**
	 * How this sync fired (#103). Defaults to `manual`, because every caller but
	 * the background run has a human at the keyboard.
	 */
	trigger?: SyncTrigger;
};

export function stageId(bodyJson: string): string {
	return createHash("sha256").update(bodyJson).digest("hex").slice(0, 12);
}

export async function stageSync(deps: StageDeps): Promise<StagedSend> {
	const now = (deps.now ?? Date.now)();
	const token = (deps.getTokenImpl ?? getToken)();
	const loadConfig = deps.loadConfigImpl ?? loadSyncConfig;
	const adapters = deps.adaptersImpl ?? detectedAdapters;
	const windowDays = deps.windowDays ?? DEFAULT_WINDOW_DAYS;
	const projectWorkspaceId =
		deps.getProjectWorkspaceIdImpl ?? getProjectWorkspaceId;

	const { config, source } = await loadConfig({
		baseUrl: deps.baseUrl,
		...(token ? { token } : {}),
	});

	const built: BuiltPayload[] = [];
	const scanStats: Record<string, ScanStats> = {};
	// Collected per harness, extracted ONCE below (#213): local Git history is a
	// property of the machine, not of whichever harness opened the repository,
	// and the metric rows are computed across every synced harness at once.
	const workflowScans: LocalHarnessWorkflow[] = [];
	// One window start for detection AND for the scan (#101), so a harness that
	// counts as detected is exactly a harness with something in the window.
	const sinceMs = windowStartMs(now, windowDays);
	for (const adapter of await adapters(sinceMs)) {
		const { aggregate, stats, workflow, workflowLocal } = await adapter.scan({
			sinceMs,
		});
		scanStats[adapter.name] = stats;
		workflowScans.push({ aggregate: workflow, local: workflowLocal });
		built.push(
			buildPayload({
				aggregate,
				stats,
				syncConfig: config,
				now,
				windowDays,
				harnessName: adapter.name,
				builtinTools: adapter.builtinTools,
				projectWorkspaceId,
			}),
		);
	}

	// The opt-in the machine currently holds, read at stage time so the gate's
	// bytes are the bytes sent (#78). Absent from the settings file means this
	// machine has never answered, which the backend reads as "never told us".
	const settings = (deps.getSettingsImpl ?? getSettings)();

	// Git runs here and not inside an adapter's scan: the reducers hand back the
	// working directories their sessions touched, and reading one repository once
	// for all of them is both cheaper and the only way the commit counts stay
	// right when two harnesses shared a checkout.
	//
	// The extraction is skipped entirely when the owner has the switch off. It
	// shells out to `git` per repository, and running that work to throw it away
	// would be the one visible cost of a preference that is supposed to be free.
	const workflow: WorkflowExtraction | undefined =
		workflowScans.length > 0 && config.publishWorkflow
			? extractLocalWorkflow({
					harnesses: workflowScans,
					fromMs: sinceMs,
					toMs: now,
					...(deps.gitRunnerImpl ? { run: deps.gitRunnerImpl } : {}),
				})
			: undefined;

	const body = buildSyncBody(
		built,
		config,
		settings.autoSync,
		deps.trigger,
		workflow,
		CLI_VERSION,
	);
	const bodyJson = JSON.stringify(body);
	const keptPrivate = mergeKeptPrivate(built.map((b) => b.keptPrivate));

	const ctx = {
		body,
		keptPrivate,
		config,
		source,
		baseUrl: deps.baseUrl,
		scanStats,
	};

	let blockedReason: string | null = null;
	if (built.length === 0) {
		blockedReason = `No active harness on this machine - no Claude Code and no Codex transcript from the last ${windowDays} days to read.`;
	} else if (token === null) {
		blockedReason =
			"This machine is not linked. Run `npx @use-aistack/cli login` first.";
	} else if (config.stack === null) {
		blockedReason =
			source === "bundled"
				? "Could not fetch your settings from aistack, so the destination stack is unknown. Publish needs it. Check the network and preview again."
				: `The token resolves no destination stack. Create one at ${deps.baseUrl}/stacks/new, then sync again.`;
	}

	return {
		id: stageId(bodyJson),
		bodyJson,
		body,
		keptPrivate,
		summary: buildGateSummary(ctx),
		dialog: buildGateDialog(ctx),
		config,
		token,
		stagedAt: now,
		blockedReason,
	};
}
