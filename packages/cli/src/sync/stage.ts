// Stage one send: scan → build → derive the gate's text from the exact bytes.
//
// Wayfinder ticket #41 (map #29). The staged `bodyJson` string IS what a
// publish transmits — the summary and the dialog are derived from it and from
// nothing else, so the user can never approve a sentence about different bytes
// (#35's binding constraint). The publish tool takes only the stage id; it can
// name WHICH staged send to release, never what is in it.

import { createHash } from "node:crypto";
import { getToken } from "../config.js";
import {
	type KeptPrivateAtom,
	type LoadedSyncConfig,
	loadSyncConfig,
	type NameCategory,
	type SyncConfig,
} from "../transcripts/allowlist.js";
import { createAggregate } from "../transcripts/analyzer.js";
import { DEFAULT_WINDOW_DAYS } from "../transcripts/index.js";
import {
	buildPayload,
	buildSyncBody,
	type SyncBody,
} from "../transcripts/payload.js";
import { type ScanStats, scan, windowStartMs } from "../transcripts/scan.js";
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
	loadConfigImpl?: (opts: {
		baseUrl: string;
		token?: string;
	}) => Promise<LoadedSyncConfig>;
	scanImpl?: typeof scan;
	windowDays?: number;
};

export function stageId(bodyJson: string): string {
	return createHash("sha256").update(bodyJson).digest("hex").slice(0, 12);
}

export async function stageSync(deps: StageDeps): Promise<StagedSend> {
	const now = (deps.now ?? Date.now)();
	const token = (deps.getTokenImpl ?? getToken)();
	const loadConfig = deps.loadConfigImpl ?? loadSyncConfig;
	const doScan = deps.scanImpl ?? scan;
	const windowDays = deps.windowDays ?? DEFAULT_WINDOW_DAYS;

	const { config, source } = await loadConfig({
		baseUrl: deps.baseUrl,
		...(token ? { token } : {}),
	});

	const aggregate = createAggregate();
	const stats: ScanStats = await doScan(aggregate, {
		sinceMs: windowStartMs(now, windowDays),
	});

	const built = buildPayload({
		aggregate,
		stats,
		syncConfig: config,
		now,
		windowDays,
	});
	const body = buildSyncBody(built, config);
	const bodyJson = JSON.stringify(body);

	const ctx = {
		body,
		keptPrivate: built.keptPrivate,
		config,
		source,
		baseUrl: deps.baseUrl,
	};

	let blockedReason: string | null = null;
	if (token === null) {
		blockedReason =
			"This machine is not linked. Run `npx @use-aistack/cli login` first.";
	} else if (config.stack === null) {
		blockedReason =
			source === "bundled"
				? "Could not fetch your settings from aistack, so the destination stack is unknown. Publish needs it. Check the network and preview again."
				: "The token resolves no destination stack. Run `npx @use-aistack/cli login` again to re-link this machine.";
	}

	return {
		id: stageId(bodyJson),
		bodyJson,
		body,
		keptPrivate: built.keptPrivate,
		summary: buildGateSummary(ctx),
		dialog: buildGateDialog(ctx),
		config,
		token,
		stagedAt: now,
		blockedReason,
	};
}
