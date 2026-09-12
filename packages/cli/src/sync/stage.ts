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
import { HARNESS_ADAPTERS, harnessLabel } from "../harness/index.js";
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
import type { HarnessAdapter, HarnessScan } from "../harness/types.js";
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

/**
 * One unit of stage work, as the terminal sees it. `id` is stable per step
 * (`prices`, `settings`, `manifest`, `harness:<name>`, `git`, `review`);
 * `label` is what to print. A `progress` carries the count done so far and the
 * total when the step knows it.
 */
export type StageEvent =
	| {
			kind: "step";
			id: string;
			label: string;
			state: "waiting" | "running" | "done" | "skipped" | "failed";
			note?: string;
	  }
	| {
			kind: "progress";
			id: string;
			done: number;
			total?: number;
			unit: string;
			note?: string;
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
	/** Override the candidate adapters (every harness this build can read). Tests only. */
	adaptersImpl?: () =>
		| readonly HarnessAdapter[]
		| Promise<readonly HarnessAdapter[]>;
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
	 * Structured progress for the interactive terminal (#420). Steps run
	 * concurrently, so a listener gets one `step` per unit of work and redraws
	 * a board; nothing here is awaited, and a step that blocks the event loop
	 * (a synchronous SQLite walk) stalls only its own row's updates.
	 */
	onEvent?: (event: StageEvent) => void;
};

export function stageId(bodyJson: string): string {
	return createHash("sha256").update(bodyJson).digest("hex").slice(0, 12);
}

export async function stageSync(deps: StageDeps): Promise<StagedSend> {
	const now = (deps.now ?? Date.now)();
	const token = (deps.getTokenImpl ?? getToken)();
	const loadConfig = deps.loadConfigImpl ?? loadSyncConfig;
	const adapters = deps.adaptersImpl ?? (() => HARNESS_ADAPTERS);
	const windowDays = deps.windowDays ?? DEFAULT_WINDOW_DAYS;
	const projectWorkspaceId =
		deps.getProjectWorkspaceIdImpl ?? getProjectWorkspaceId;
	const fetchManifest = deps.fetchManifestImpl ?? fetchDayManifest;
	const fetchPrices = deps.fetchPricesImpl ?? fetchPriceTable;
	const emit = (event: StageEvent) => deps.onEvent?.(event);
	const step = (
		id: string,
		label: string,
		state: "waiting" | "running" | "done" | "skipped" | "failed",
		note?: string,
	) => {
		if (state !== "waiting")
			trace(`${label} · ${state}${note ? ` · ${note}` : ""}`);
		emit({ kind: "step", id, label, state, ...(note ? { note } : {}) });
	};

	// The three startup reads are independent, so they go out together (#420).
	// The price table must be active before any adapter prices a response
	// (#336): the adapters call the module-level pricing functions, which read
	// whichever pricer is active. Served rows win per key; the bundled constants
	// fill what the server does not hold. Unreachable reads as bundled, and the
	// gate says which one it was.
	let prices: PriceTableUsed = {
		id: BUNDLED_PRICE_TABLE_ID,
		origin: "bundled",
	};
	step("prices", "Prices", "running");
	step("settings", "Stack settings", "running");
	if (token) step("manifest", "Synced days", "running");
	const readPrices = async () => {
		const done = traceTimer("prices");
		try {
			const table = await fetchPrices(deps.baseUrl);
			if (table) {
				setActivePricer(layeredPricer(table));
				prices = { id: table.id, origin: "served" };
				done(`served ${table.id}`);
				step("prices", "Prices", "done", "current");
			} else {
				setActivePricer(null);
				done("server has no price route, bundled table");
				step("prices", "Prices", "done", "bundled table");
			}
		} catch (error) {
			setActivePricer(null);
			done(`fetch failed (${describeError(error)}), bundled table`);
			step("prices", "Prices", "done", "unreachable, bundled table");
		}
	};
	const readSettings = async () => {
		const done = traceTimer("stack settings");
		const loaded = await loadConfig({
			baseUrl: deps.baseUrl,
			...(token ? { token } : {}),
		});
		done(
			`${loaded.source}${loaded.config.stack ? ", stack resolved" : ", no stack"}, publishWorkflow ${loaded.config.publishWorkflow}, publishCost ${loaded.config.publishCost}`,
		);
		step(
			"settings",
			"Stack settings",
			"done",
			loaded.source === "fetched"
				? (loaded.config.stack?.name ?? "no stack")
				: "unreachable",
		);
		return loaded;
	};
	// The server's day manifest (#307, ADR-0010): which dates it holds and with
	// what fingerprint. Missing (an old server) or failing (network) reads as
	// "send the whole window"; a publish that repeats a held date is correct,
	// only wasteful. The manifest also names the retention, which bounds how
	// far back the day scan reaches.
	const readManifest = async (): Promise<DayManifest | null> => {
		if (!token) {
			trace("day manifest · skipped, this machine holds no token");
			return null;
		}
		const done = traceTimer("day manifest");
		try {
			const manifest = await fetchManifest(deps.baseUrl, token);
			done(
				manifest
					? `${manifest.days.length} days held, retention ${manifest.retentionDays}`
					: "server has no manifest route, whole window goes",
			);
			step(
				"manifest",
				"Synced days",
				"done",
				manifest ? `${manifest.days.length} held` : "none",
			);
			return manifest;
		} catch (error) {
			done(`fetch failed (${describeError(error)}), whole window goes`);
			step("manifest", "Synced days", "done", "unreachable, whole window");
			return null;
		}
	};
	const [, { config, source }, manifest] = await Promise.all([
		readPrices(),
		readSettings(),
		readManifest(),
	]);
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
	// Every harness is checked and scanned at once (#420): the adapters are
	// independent, the transcript readers are asynchronous, and Cursor's
	// synchronous SQLite walk runs in a worker thread, so the board keeps
	// drawing while the slowest one works. Results are assembled afterwards in
	// registration order, which is display order at the gate.
	const candidates = await adapters();
	for (const adapter of candidates)
		step(`harness:${adapter.name}`, harnessLabel(adapter.name), "waiting");
	const readings = await Promise.all(
		candidates.map((adapter) => readHarness(adapter)),
	);
	async function readHarness(adapter: HarnessAdapter): Promise<HarnessReading> {
		const id = `harness:${adapter.name}`;
		const label = harnessLabel(adapter.name);
		const started = performance.now();
		const elapsed = () =>
			`${((performance.now() - started) / 1000).toFixed(1)} s`;
		step(id, label, "running", "checking history");
		const detectDone = traceTimer(`detect ${adapter.name}`);
		const active = await adapter.detect({ sinceMs });
		const historical =
			active || (await adapter.detect({ sinceMs: daysSinceMs }));
		detectDone(
			active
				? "found"
				: historical
					? "found (older than the window)"
					: "nothing in window",
		);
		const reading: HarnessReading = { adapter, active, historical };
		if (!historical) {
			step(id, label, "skipped", "nothing in window");
			return reading;
		}
		let seen = 0;
		const progress = (phase: string) => (files: number, total?: number) => {
			seen = files;
			emit({
				kind: "progress",
				id,
				done: files,
				...(total !== undefined ? { total } : {}),
				unit: "files",
				note: phase,
			});
		};
		if (active) {
			step(id, label, "running", "recent usage");
			const scanDone = traceTimer(`scan ${adapter.name} (recent)`);
			reading.recent = await adapter.scan({
				sinceMs,
				publishWorkflow: false,
				onProgress: progress("recent usage"),
			});
			scanDone(describeScan(reading.recent.stats));
		}
		step(id, label, "running", "history");
		const scanDone = traceTimer(`scan ${adapter.name} (historical)`);
		reading.history = await adapter.scan({
			sinceMs: daysSinceMs,
			publishWorkflow: config.publishWorkflow,
			onProgress: progress("history"),
		});
		scanDone(
			`${describeScan(reading.history.stats)}${reading.history.scanComplete === false ? ", incomplete" : ""}`,
		);
		const files = Math.max(seen, reading.history.stats.filesRead);
		step(
			id,
			label,
			"done",
			`${files} ${files === 1 ? "file" : "files"} · ${elapsed()}`,
		);
		return reading;
	}
	const active = readings.filter((r) => r.active).map((r) => r.adapter);
	const historical = readings.filter((r) => r.historical).map((r) => r.adapter);
	trace(
		`active harnesses (${windowDays} days): ${active.map((a) => a.name).join(", ") || "none"}`,
	);
	trace(
		`historical harnesses (${retentionDays} days): ${historical.map((a) => a.name).join(", ") || "none"}`,
	);
	let dayScansComplete = true;
	const sessionDatesByHarness = new Map<string, Map<string, Set<string>>>();
	for (const { adapter, recent } of readings) {
		if (!recent) continue;
		const { aggregate, stats } = recent;
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
	for (const { adapter, history } of readings) {
		if (!history) continue;
		const { aggregate, workflow, workflowLocal, scanComplete, sessionDates } =
			history;
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
		step("git", "Git history", "running");
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
		step("git", "Git history", "done", `${workflow.days.length} days`);
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
	step("review", "Review", "running");
	const bodyJson = JSON.stringify(body);
	trace(
		`days · ${days.mode}, ${days.send.length} to send${dayScansComplete ? "" : " (a scan was incomplete, no day rows go)"}`,
	);
	trace(`body · ${bodyJson.length} bytes, ${built.length} harness payloads`);
	step("review", "Review", "done", `${days.send.length} days to send`);
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

type HarnessReading = {
	adapter: HarnessAdapter;
	/** Wrote a transcript inside the snapshot window (#101). */
	active: boolean;
	/** Wrote a transcript inside the retention the day rows cover (#307). */
	historical: boolean;
	recent?: HarnessScan;
	history?: HarnessScan;
};

function describeError(error: unknown): string {
	if (error instanceof Error) {
		return error.name === "TimeoutError" ? "timed out" : error.message;
	}
	return String(error);
}

function describeScan(stats: ScanStats): string {
	return `${stats.filesRead}/${stats.filesFound} files read, ${stats.filesUnreadable} unreadable`;
}
