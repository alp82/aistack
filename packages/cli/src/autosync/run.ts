// `sync --auto` - the silent background run (#62, map #60).
//
// The tenets from map #29 hold: passive analysis, never passive publish. TWO
// gates let this path publish, and either one closes it:
//
//   1. The machine's own flag (`autoSync.enabled` in
//      ~/.config/aistack/settings.json). Local, free, and checked first.
//   2. The STACK's permission, read from `/api/sync-config` (#102, #103). The
//      owner holds this one, from any machine and from the web switch, so a
//      revoke reaches a machine whose hooks are still live.
//
// No prompts, no upsells, no email, no dialogs. This path also never installs
// or removes a hook - the interactive sync owns that (`reconcileAutoSync`).
// The escalation ladder is: one log line per run → the next interactive sync
// reports the last result → after 3 consecutive failures, one visible
// systemMessage line.
//
// This function never sets a nonzero exit code. The hook command falls back to
// the npx cache on `||`, and a nonzero exit from a mere sync failure would
// fire that fallback and run the whole sync twice.

import {
	appendFileSync,
	mkdirSync,
	readFileSync,
	writeFileSync,
} from "node:fs";
import { homedir } from "node:os";
import { dirname, join } from "node:path";
import { syncPublish } from "../api.js";
import {
	type AutoSyncState,
	DEFAULT_FREQUENCY_HOURS,
	getSettings,
	getToken,
	saveSettings,
} from "../config.js";
import { loadSyncConfig } from "../harness/shared/allowlist.js";
import { stageSync } from "../sync/stage.js";

export const SYNC_LOG_FILE = join(homedir(), ".config", "aistack", "sync.log");

/** The log stays small: newest 200 lines, older lines fall off. */
export const SYNC_LOG_MAX_LINES = 200;

/** The one-line fix, named in the escalation message and nowhere vaguer. */
const FIX_COMMAND = "npx @use-aistack/cli sync";

export type AutoSyncDeps = {
	baseUrl: string;
	now?: () => number;
	settingsFile?: string;
	logFile?: string;
	stageImpl?: typeof stageSync;
	publishImpl?: typeof syncPublish;
	getTokenImpl?: () => string | null;
	loadConfigImpl?: typeof loadSyncConfig;
	/** Where the systemMessage JSON goes. Defaults to stdout. */
	emit?: (line: string) => void;
};

/** What the next interactive sync says when the stack has taken the permission away. */
export const REVOKED_RESULT = "off - auto-sync is switched off for this stack";

export function appendLogLine(file: string, line: string): void {
	mkdirSync(dirname(file), { recursive: true });
	appendFileSync(file, `${line}\n`);
	const lines = readFileSync(file, "utf-8").split("\n").filter(Boolean);
	if (lines.length > SYNC_LOG_MAX_LINES) {
		writeFileSync(file, `${lines.slice(-SYNC_LOG_MAX_LINES).join("\n")}\n`);
	}
}

export async function runAutoSync(deps: AutoSyncDeps): Promise<void> {
	const now = (deps.now ?? Date.now)();
	const settingsFile = deps.settingsFile;
	const logFile = deps.logFile ?? SYNC_LOG_FILE;
	const emit =
		deps.emit ?? ((line: string) => process.stdout.write(`${line}\n`));
	const stamp = new Date(now).toISOString();

	const settings = getSettings(settingsFile);
	const config = settings.autoSync;

	// The hard gate. A hook left behind after a revoke publishes nothing.
	if (config?.enabled !== true) {
		appendLogLine(logFile, `${stamp} skipped - auto-sync is not enabled`);
		return;
	}

	// The freshness gate keys on the last ATTEMPT, not the last success. A
	// broken setup then retries once per frequency window, not once per
	// session start, and still reaches the 3-failure escalation.
	const frequencyHours = config.frequencyHours || DEFAULT_FREQUENCY_HOURS;
	const state: AutoSyncState = settings.autoSyncState ?? {};
	const lastRunAt = state.lastRunAt ?? 0;
	if (now - lastRunAt < frequencyHours * 3_600_000) return;

	const stage = deps.stageImpl ?? stageSync;
	const publish = deps.publishImpl ?? syncPublish;
	const loadConfig = deps.loadConfigImpl ?? loadSyncConfig;
	const token = (deps.getTokenImpl ?? getToken)();

	let failure: string | null = null;
	let url: string | undefined;
	let revoked = false;
	try {
		// The permission the STACK holds (#102/#103), read BEFORE the scan. The
		// run needs the network to publish anyway, so asking first costs nothing
		// and spares a revoked machine a full walk of its own history.
		const loaded = await loadConfig({
			baseUrl: deps.baseUrl,
			...(token ? { token } : {}),
		});
		if (loaded.config.autoSync?.enabled === false) {
			// EXPLICIT OFF ONLY. An absent flag still publishes, because that
			// publish is what seeds the stack from this machine (#102).
			revoked = true;
		} else {
			const staged = await stage({
				baseUrl: deps.baseUrl,
				now: () => now,
				trigger: "auto",
				// The same body the gate above read, so the permission and the
				// destination cannot come from two different fetches.
				loadConfigImpl: async () => loaded,
				getTokenImpl: () => token,
			});
			if (staged.blockedReason !== null) {
				failure = staged.blockedReason;
			} else {
				const res = await publish(staged.token as string, staged.bodyJson);
				url = res.url;
			}
		}
	} catch (e) {
		failure = e instanceof Error ? e.message : String(e);
	}

	// A revoke is not a failure: the streak, the warning and the last success
	// all stay as they were. Only the attempt is stamped, so the machine asks
	// once per frequency window instead of once per session start.
	if (revoked) {
		saveSettings(
			{
				autoSyncState: { ...state, lastRunAt: now, lastResult: REVOKED_RESULT },
			},
			settingsFile,
		);
		appendLogLine(logFile, `${stamp} skipped - ${REVOKED_RESULT}`);
		return;
	}

	if (failure === null) {
		saveSettings(
			{
				autoSyncState: {
					lastRunAt: now,
					lastSuccessAt: now,
					lastResult: `ok - published at ${stamp}`,
					consecutiveFailures: 0,
					failureWarned: false,
				},
			},
			settingsFile,
		);
		appendLogLine(logFile, `${stamp} ok - published${url ? ` ${url}` : ""}`);
		return;
	}

	const consecutiveFailures = (state.consecutiveFailures ?? 0) + 1;
	const shouldWarn = consecutiveFailures >= 3 && state.failureWarned !== true;
	saveSettings(
		{
			autoSyncState: {
				...state,
				lastRunAt: now,
				lastResult: `failed at ${stamp} - ${failure}`,
				consecutiveFailures,
				failureWarned: state.failureWarned === true || shouldWarn,
			},
		},
		settingsFile,
	);
	appendLogLine(
		logFile,
		`${stamp} fail (${consecutiveFailures} in a row) - ${failure}`,
	);

	// One visible line, once per failure streak. SessionStart hook JSON:
	// Claude Code shows `systemMessage` to the user when the async hook lands.
	if (shouldWarn) {
		emit(
			JSON.stringify({
				systemMessage: `aistack auto-sync failed ${consecutiveFailures} times in a row (${failure}). Run \`${FIX_COMMAND}\` in a terminal to fix it, or \`${FIX_COMMAND} --auto off\` to stop these runs.`,
			}),
		);
	}
}
