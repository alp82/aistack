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
	BUNDLED_PRICE_TABLE_ID,
	layeredPricer,
	type PriceTable,
	setActivePricer,
} from "@aistack/pricing";
import {
	MEASURED_DAYS_V1,
	type MeasuredDay,
	type UsageHarnessDay,
} from "@aistack/workflow-rules";
import { fetchDayManifest, fetchPriceTable } from "../api.js";
import {
	getProjectWorkspaceId,
	getSettings,
	getToken,
	type Settings,
} from "../config.js";
import { detectedAdapters, harnessLabel } from "../harness/index.js";
import {
	type KeptPrivateAtom,
	type LoadedSyncConfig,
	loadSyncConfig,
	type NameCategory,
	type SyncConfig,
} from "../harness/shared/allowlist.js";
import {
	applyDayConsent,
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
import { trace, traceTimer } from "../trace.js";
import {
	buildMeasuredDays,
	buildUsageDays,
	mergeUsageDays,
} from "../usage/days.js";
import {
	type DayManifest,
	type DaySelection,
	MAX_DAY_WINDOW,
	selectDaysToPublish,
} from "../usage/diff.js";
import { CLI_VERSION } from "../version.js";
import {
	extractLocalWorkflow,
	extractLocalWorkflowAsync,
	type GitWorkflowRunner,
	type LocalHarnessWorkflow,
	machineUtcOffsetMinutes,
	type WorkflowExtraction,
} from "../workflow/index.js";
import {
	grokCacheScope,
	loadGrokDateHints,
	mapToHints,
	saveGrokDateHints,
} from "./grokDateCache.js";
import { buildGateDialog, buildGateSummary } from "./summary.js";

const utcDate = (ms: number): string => new Date(ms).toISOString().slice(0, 10);

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
	/**
	 * How the day rows were chosen (#307): the counts the gate prints and the
	 * mode, `diff` against a manifest or `full` when there was none.
	 */
	days?: DaySelection;
	/** Which price table priced this stage (#336). Absent only in fixtures. */
	prices?: PriceTableUsed;
	/** Commit local Grok date hints only after the server accepted these bytes. */
	acknowledgePublish?: () => void;
};

/**
 * The table the adapters priced against. `served` is the server's
 * `modelPrices` table layered over the bundled one; `bundled` means the fetch
 * failed or the server has no such route, and every figure came from the
 * constants shipped with this CLI version.
 */
export type PriceTableUsed = {
	id: string;
	origin: "served" | "bundled";
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
	adaptersImpl?: (
		sinceMs: number,
		hooks?: {
			onAdapter?: (adapter: HarnessAdapter) => void | Promise<void>;
		},
	) => Promise<HarnessAdapter[]>;
	/** Override the Git reader the workflow extraction shells out to. Tests only. */
	gitRunnerImpl?: GitWorkflowRunner;
	/**
	 * Override the manifest fetch (#307). `null` means the server has none.
	 * A throw is caught and reads the same: the whole window goes.
	 */
	fetchManifestImpl?: (
		baseUrl: string,
		token: string,
	) => Promise<DayManifest | null>;
	/**
	 * Override the price table fetch (#336). `null` means the server has none.
	 * A throw is caught and reads the same: the bundled table prices the stage.
	 */
	fetchPricesImpl?: (baseUrl: string) => Promise<PriceTable | null>;
	getSettingsImpl?: () => Settings;
	windowDays?: number;
	/**
	 * How this sync fired (#103). Defaults to `manual`, because every caller but
	 * the background run has a human at the keyboard.
	 */
	trigger?: SyncTrigger;
	/**
	 * Human-facing phase updates for the interactive terminal. A phase change
	 * is AWAITED before the work it names starts: the spinner repaints on a
	 * timer, and a phase that blocks the event loop (Cursor's SQLite walk) would
	 * otherwise leave the previous phase's text on screen for minutes and read
	 * as a hang at the wrong step. File-count updates inside a scan are not
	 * awaited; they are frequent and the scan yields on its own.
	 */
	onProgress?: (message: string) => void | Promise<void>;
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
	const fetchManifest = deps.fetchManifestImpl ?? fetchDayManifest;
	const fetchPrices = deps.fetchPricesImpl ?? fetchPriceTable;
	// `phase` names the step that is about to run and waits for the terminal to
	// show it; `note` refreshes a count inside a running step and returns at once.
	const phase = async (message: string) => {
		trace(message);
		await deps.onProgress?.(message);
	};
	const note = (message: string) => {
		void deps.onProgress?.(message);
	};

	// The price table comes from the server BEFORE any adapter prices a
	// response (#336): the adapters call the module-level pricing functions,
	// which read whichever pricer is active. Served rows win per key; the
	// bundled constants fill what the server does not hold. Unreachable reads
	// as bundled, and the gate says which one it was.
	let prices: PriceTableUsed = {
		id: BUNDLED_PRICE_TABLE_ID,
		origin: "bundled",
	};
	await phase("Checking prices");
	const pricesDone = traceTimer("prices");
	try {
		const table = await fetchPrices(deps.baseUrl);
		if (table) {
			setActivePricer(layeredPricer(table));
			prices = { id: table.id, origin: "served" };
			pricesDone(`served ${table.id}`);
		} else {
			setActivePricer(null);
			pricesDone("server has no price route, bundled table");
		}
	} catch (error) {
		setActivePricer(null);
		pricesDone(`fetch failed (${describeError(error)}), bundled table`);
	}

	await phase("Checking stack settings");
	const settingsDone = traceTimer("stack settings");
	const { config, source } = await loadConfig({
		baseUrl: deps.baseUrl,
		...(token ? { token } : {}),
	});
	settingsDone(
		`${source}${config.stack ? ", stack resolved" : ", no stack"}, publishWorkflow ${config.publishWorkflow}, publishCost ${config.publishCost}`,
	);

	// The server's day manifest (#307, ADR-0010): which dates it holds and with
	// what fingerprint. Missing (an old server) or failing (network) reads as
	// "send the whole window"; a publish that repeats a held date is correct,
	// only wasteful. The manifest also names the retention, which bounds how
	// far back the day scan reaches.
	let manifest: DayManifest | null = null;
	if (token) {
		await phase("Checking previously synced days");
		const manifestDone = traceTimer("day manifest");
		try {
			manifest = await fetchManifest(deps.baseUrl, token);
			manifestDone(
				manifest
					? `${manifest.days.length} days held, retention ${manifest.retentionDays}`
					: "server has no manifest route, whole window goes",
			);
		} catch (error) {
			manifest = null;
			manifestDone(`fetch failed (${describeError(error)}), whole window goes`);
		}
	} else {
		trace("day manifest · skipped, this machine holds no token");
	}
	const retentionDays = Math.max(
		1,
		Math.min(manifest?.retentionDays ?? MAX_DAY_WINDOW, MAX_DAY_WINDOW),
	);

	const built: BuiltPayload[] = [];
	const scanStats: Record<string, ScanStats> = {};
	// Collected per harness, extracted ONCE below (#213): local Git history is a
	// property of the machine, not of whichever harness opened the repository,
	// and the metric rows are computed across every synced harness at once.
	const workflowScans: LocalHarnessWorkflow[] = [];
	const usageScans: Map<string, UsageHarnessDay>[] = [];
	// One window start for detection AND for the snapshot scan (#101), so a
	// harness that counts as detected is exactly a harness with something in
	// the window.
	const sinceMs = windowStartMs(now, windowDays);
	// The day scan reaches the whole retention (#307): the snapshot stays a
	// 30-day block until its readers retire, while the day rows cover every
	// date the server would keep. Two scans over the same files; the second is
	// the one the days and the workflow blocks come from.
	const daysSinceMs = windowStartMs(now, retentionDays);
	// One phase per harness, so a detect that blocks the event loop (Cursor's
	// history read) shows its own name on the spinner instead of the previous
	// phase's. The historical pass repeats the same checks over a longer window
	// and reuses the reads the first pass made where an adapter memoizes them.
	const active = await adapters(sinceMs, {
		onAdapter: (adapter) =>
			phase(`Checking for ${harnessLabel(adapter.name)} history`),
	});
	trace(
		`active harnesses (${windowDays} days): ${active.map((a) => a.name).join(", ") || "none"}`,
	);
	const historical = await adapters(daysSinceMs);
	trace(
		`historical harnesses (${retentionDays} days): ${historical.map((a) => a.name).join(", ") || "none"}`,
	);
	let dayScansComplete = true;
	const sessionDatesByHarness = new Map<string, Map<string, Set<string>>>();
	for (const adapter of active) {
		const label = harnessLabel(adapter.name);
		await phase(`Scanning recent ${label} usage`);
		const scanDone = traceTimer(`scan ${adapter.name} (recent)`);
		const { aggregate, stats } = await adapter.scan({
			sinceMs,
			publishWorkflow: false,
			onProgress: (files) =>
				note(`Scanning recent ${label} usage · ${files} files`),
		});
		scanDone(describeScan(stats));
		scanStats[adapter.name] = stats;
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
	for (const adapter of historical) {
		const label = harnessLabel(adapter.name);
		await phase(`Reading historical ${label} days`);
		const scanDone = traceTimer(`scan ${adapter.name} (historical)`);
		const {
			aggregate,
			stats,
			workflow,
			workflowLocal,
			scanComplete,
			sessionDates,
		} = await adapter.scan({
			sinceMs: daysSinceMs,
			publishWorkflow: config.publishWorkflow,
			onProgress: (files) =>
				note(`Reading historical ${label} days · ${files} files`),
		});
		scanDone(
			`${describeScan(stats)}${scanComplete === false ? ", incomplete" : ""}`,
		);
		if (scanComplete === false) dayScansComplete = false;
		if (adapter.name === "grok-build" || adapter.name === "cursor")
			sessionDatesByHarness.set(adapter.name, sessionDates ?? new Map());
		workflowScans.push({ aggregate: workflow, local: workflowLocal });
		usageScans.push(
			buildUsageDays({
				harness: adapter.name,
				aggregate,
				publishCost: config.publishCost,
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
	let workflow: WorkflowExtraction | undefined;
	if (workflowScans.length > 0 && config.publishWorkflow) {
		await phase("Reading Git history");
		const gitDone = traceTimer("git history");
		workflow = deps.gitRunnerImpl
			? extractLocalWorkflow({
					harnesses: workflowScans,
					fromMs: daysSinceMs,
					toMs: now,
					run: deps.gitRunnerImpl,
				})
			: await extractLocalWorkflowAsync({
					harnesses: workflowScans,
					fromMs: daysSinceMs,
					toMs: now,
				});
		gitDone(`${workflow.days.length} days`);
	} else {
		trace(
			`git history · skipped (${config.publishWorkflow ? "no harness scanned" : "publishWorkflow off"})`,
		);
	}

	// The day rows (#307): usage and workflow joined by date, consent applied
	// BEFORE the fingerprint so the hash is over the bytes that go, then diffed
	// against the manifest. Today always resends.
	const correctionDates = new Set<string>();
	let acknowledgePublish: (() => void) | undefined;
	const acknowledgements: Array<() => void> = [];
	for (const [harness, currentDates] of sessionDatesByHarness) {
		if (!token || !config.stack) continue;
		const scope = grokCacheScope(
			harness === "grok-build" ? deps.baseUrl : `${deps.baseUrl}\0${harness}`,
			config.stack.slug,
			token,
		);
		const floor = utcDate(daysSinceMs);
		const previous = loadGrokDateHints(scope);
		const current = mapToHints(currentDates, floor);
		for (const dates of Object.values(previous))
			for (const date of dates) correctionDates.add(date);
		for (const dates of Object.values(current))
			for (const date of dates) correctionDates.add(date);
		if (Object.keys(previous).some((id) => !(id in current)))
			dayScansComplete = false;
		acknowledgements.push(() => saveGrokDateHints(scope, current));
	}
	if (acknowledgements.length)
		acknowledgePublish = () => {
			for (const acknowledge of acknowledgements) acknowledge();
		};
	const localDays: MeasuredDay[] = applyDayConsent(
		buildMeasuredDays({
			usage: mergeUsageDays(usageScans),
			...(workflow ? { workflow: workflow.days } : {}),
			from: utcDate(daysSinceMs),
			to: utcDate(now),
			includeDates: correctionDates,
		}),
		config,
	);
	const days = selectDaysToPublish({
		local: dayScansComplete ? localDays : [],
		manifest,
		todayUtc: utcDate(now),
	});

	const body = buildSyncBody(
		built,
		config,
		settings.autoSync,
		deps.trigger,
		historical.length > 0 && dayScansComplete
			? {
					aggregateVersion: MEASURED_DAYS_V1,
					utcOffsetMinutes:
						workflow?.utcOffsetMinutes ?? machineUtcOffsetMinutes(),
					days: days.send,
				}
			: undefined,
		CLI_VERSION,
	);
	await phase("Preparing review");
	const bodyJson = JSON.stringify(body);
	trace(
		`days · ${days.mode}, ${days.send.length} to send${dayScansComplete ? "" : " (a scan was incomplete, no day rows go)"}`,
	);
	trace(`body · ${bodyJson.length} bytes, ${built.length} harness payloads`);
	const keptPrivate = mergeKeptPrivate(built.map((b) => b.keptPrivate));

	const ctx = {
		body,
		keptPrivate,
		config,
		source,
		baseUrl: deps.baseUrl,
		scanStats,
		days,
		prices,
		// The real terminal, so the inventory rows break where this window ends
		// (#217). A pipe reports nothing and the preview falls back to 80.
		width: process.stdout.columns,
	};

	let blockedReason: string | null = null;
	if (historical.length === 0) {
		blockedReason = `No supported harness transcript from the last ${retentionDays} days to read.`;
	} else if (token === null) {
		blockedReason =
			"This machine is not linked. Run `npx @use-aistack/cli login` first.";
	} else if (config.stack === null) {
		blockedReason =
			source === "bundled"
				? "Could not fetch your settings from aistack, so the destination stack is unknown. Publish needs it. Check the network and preview again."
				: "This machine has no destination stack. Run `npx @use-aistack/cli sync` in an interactive terminal to choose one.";
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
		days,
		prices,
		...(acknowledgePublish ? { acknowledgePublish } : {}),
	};
}

function describeError(error: unknown): string {
	if (error instanceof Error) {
		return error.name === "TimeoutError" ? "timed out" : error.message;
	}
	return String(error);
}

function describeScan(stats: ScanStats): string {
	return `${stats.filesRead}/${stats.filesFound} files read, ${stats.filesUnreadable} unreadable`;
}
