import { existsSync, mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { getSettings, saveSettings } from "../config.js";
import {
	BUNDLED_SYNC_CONFIG,
	type LoadedSyncConfig,
	type SyncConfig,
} from "../harness/index.js";
import type { StagedSend } from "../sync/stage.js";
import {
	codexAutoSyncHookInstalled,
	installCodexAutoSyncHook,
} from "./codexHook.js";
import { autoSyncHookInstalled, installAutoSyncHook } from "./hook.js";
import { appendLogLine, runAutoSync, SYNC_LOG_MAX_LINES } from "./run.js";

/**
 * The silent background run - wayfinder #62 (map #60).
 *
 * The properties these tests pin: no opt-in means no publish (the hard gate),
 * a fresh run exits without work, every real run leaves one log line, and the
 * escalation fires once per failure streak.
 */

let dir: string;
let settingsFile: string;
let logFile: string;

const NOW = 1_800_000_000_000;
const HOUR = 3_600_000;

beforeEach(() => {
	dir = mkdtempSync(join(tmpdir(), "aistack-auto-"));
	settingsFile = join(dir, "settings.json");
	logFile = join(dir, "sync.log");
});

afterEach(() => {
	rmSync(dir, { recursive: true, force: true });
});

function stagedOk(): StagedSend {
	return {
		id: "abc",
		bodyJson: '{"x":1}',
		body: {} as StagedSend["body"],
		keptPrivate: {} as StagedSend["keptPrivate"],
		summary: "",
		dialog: "",
		config: {} as StagedSend["config"],
		token: "tok",
		stagedAt: NOW,
		blockedReason: null,
	};
}

function publishOk() {
	return Promise.resolve({
		receivedAt: NOW,
		url: "https://aistack.to/s/me",
		stackSlug: "me",
		keptPrivate: { stored: 0, machineStored: 0, refused: false },
	});
}

/** The stack's permission, as `/api/sync-config` answers it (#102). */
function serverConfig(autoSync: SyncConfig["autoSync"]): LoadedSyncConfig {
	return {
		config: { ...BUNDLED_SYNC_CONFIG, autoSync },
		source: "fetched",
	};
}

function deps(over: Partial<Parameters<typeof runAutoSync>[0]> = {}) {
	return {
		baseUrl: "https://aistack.to",
		now: () => NOW,
		settingsFile,
		logFile,
		emit: vi.fn(),
		getTokenImpl: () => "tok",
		// No stack has ever set the flag - the state a local opt-in still seeds.
		loadConfigImpl: vi.fn(async () => serverConfig(null)),
		stageImpl: vi.fn(async () => stagedOk()),
		publishImpl: vi.fn(publishOk),
		...over,
	};
}

function logLines(): string[] {
	return existsSync(logFile)
		? readFileSync(logFile, "utf-8").split("\n").filter(Boolean)
		: [];
}

describe("the opt-in gate", () => {
	test("no settings at all: nothing is staged, nothing published", async () => {
		const d = deps();
		await runAutoSync(d);
		expect(d.stageImpl).not.toHaveBeenCalled();
		expect(d.publishImpl).not.toHaveBeenCalled();
		expect(logLines()[0]).toContain("not enabled");
	});

	test("enabled: false blocks the same way", async () => {
		saveSettings(
			{ autoSync: { enabled: false, frequencyHours: 24 } },
			settingsFile,
		);
		const d = deps();
		await runAutoSync(d);
		expect(d.publishImpl).not.toHaveBeenCalled();
	});
});

/**
 * The server-side gate (#103). The stack owns the permission now, so a hook
 * that outlives a web revoke is a trigger with nothing to trigger.
 */
describe("the server gate", () => {
	beforeEach(() => {
		saveSettings(
			{ autoSync: { enabled: true, frequencyHours: 24 } },
			settingsFile,
		);
	});

	test("the stack says off: nothing is scanned and nothing is published", async () => {
		const d = deps({
			loadConfigImpl: vi.fn(async () =>
				serverConfig({ enabled: false, frequencyHours: 24 }),
			),
		});
		await runAutoSync(d);
		expect(d.stageImpl).not.toHaveBeenCalled();
		expect(d.publishImpl).not.toHaveBeenCalled();
		expect(logLines()[0]).toContain("off");
	});

	test("a revoke is not a failure, so it never reaches the escalation", async () => {
		saveSettings(
			{
				autoSync: { enabled: true, frequencyHours: 24 },
				autoSyncState: { consecutiveFailures: 2 },
			},
			settingsFile,
		);
		const d = deps({
			loadConfigImpl: vi.fn(async () =>
				serverConfig({ enabled: false, frequencyHours: 24 }),
			),
		});
		await runAutoSync(d);
		expect(d.emit).not.toHaveBeenCalled();
		expect(getSettings(settingsFile).autoSyncState?.consecutiveFailures).toBe(
			2,
		);
		// The attempt is stamped, so a revoked machine asks once per window and
		// not once per session start.
		expect(getSettings(settingsFile).autoSyncState?.lastRunAt).toBe(NOW);
	});

	test("the stack says on: it publishes", async () => {
		const d = deps({
			loadConfigImpl: vi.fn(async () =>
				serverConfig({ enabled: true, frequencyHours: 24 }),
			),
		});
		await runAutoSync(d);
		expect(d.publishImpl).toHaveBeenCalledOnce();
	});

	test("the stack cadence converges onto the machine after a migration", async () => {
		const d = deps({
			loadConfigImpl: vi.fn(async () =>
				serverConfig({ enabled: true, frequencyHours: 6 }),
			),
		});
		await runAutoSync(d);
		expect(getSettings(settingsFile).autoSync).toEqual({
			enabled: true,
			frequencyHours: 6,
		});
	});

	// #102's first fact for this ticket: the seed only lands on a sync that
	// publishes, so ABSENT must publish. Only an explicit off exits silently.
	test("no stack has decided: it publishes, because that publish is the seed", async () => {
		const d = deps({ loadConfigImpl: vi.fn(async () => serverConfig(null)) });
		await runAutoSync(d);
		expect(d.publishImpl).toHaveBeenCalledOnce();
	});

	test("the config is fetched once and handed to the stage", async () => {
		// One fetch per run: the gate reads the same body the stage builds from,
		// so the permission and the destination cannot disagree.
		const loaded = serverConfig({ enabled: true, frequencyHours: 24 });
		const d = deps({ loadConfigImpl: vi.fn(async () => loaded) });
		await runAutoSync(d);
		expect(d.loadConfigImpl).toHaveBeenCalledOnce();
		const stageArgs = vi.mocked(d.stageImpl).mock.calls[0][0];
		expect(await stageArgs.loadConfigImpl?.({ baseUrl: "x" })).toBe(loaded);
	});

	test("the background run stamps its sync auto", async () => {
		const d = deps();
		await runAutoSync(d);
		expect(vi.mocked(d.stageImpl).mock.calls[0][0].trigger).toBe("auto");
	});
});

/**
 * #103's done-bar, on a real filesystem: a web-side revoke stops a machine
 * with LIVE HOOKS from publishing. This is the state the old design could not
 * reach - the hooks are on disk, the local flag says yes, and the machine still
 * publishes nothing, because the stack is what decides.
 */
describe("the done-bar: a revoke reaches a machine with live hooks", () => {
	test("hooks installed, local flag on, stack off - nothing is published", async () => {
		const claudeSettings = join(dir, "claude-settings.json");
		const codexHooks = join(dir, "codex-hooks.json");
		expect(installAutoSyncHook(claudeSettings).ok).toBe(true);
		expect(installCodexAutoSyncHook(codexHooks).ok).toBe(true);
		expect(autoSyncHookInstalled(claudeSettings)).toBe(true);
		expect(codexAutoSyncHookInstalled(codexHooks)).toBe(true);

		saveSettings(
			{ autoSync: { enabled: true, frequencyHours: 24 } },
			settingsFile,
		);
		const d = deps({
			loadConfigImpl: vi.fn(async () =>
				serverConfig({ enabled: false, frequencyHours: 24 }),
			),
		});
		await runAutoSync(d);

		expect(d.publishImpl).not.toHaveBeenCalled();
		// The hooks are untouched. They are dumb triggers, and the revoke does
		// not depend on reaching them - `--auto` never edits a hook file.
		expect(autoSyncHookInstalled(claudeSettings)).toBe(true);
		expect(codexAutoSyncHookInstalled(codexHooks)).toBe(true);
	});
});

describe("the freshness gate", () => {
	test("a run inside the frequency window exits with no work and no log line", async () => {
		saveSettings(
			{
				autoSync: { enabled: true, frequencyHours: 24 },
				autoSyncState: { lastRunAt: NOW - 2 * HOUR },
			},
			settingsFile,
		);
		const d = deps();
		await runAutoSync(d);
		expect(d.stageImpl).not.toHaveBeenCalled();
		expect(logLines()).toHaveLength(0);
	});

	test("a run past the window proceeds", async () => {
		saveSettings(
			{
				autoSync: { enabled: true, frequencyHours: 24 },
				autoSyncState: { lastRunAt: NOW - 25 * HOUR },
			},
			settingsFile,
		);
		const d = deps();
		await runAutoSync(d);
		expect(d.publishImpl).toHaveBeenCalledOnce();
	});

	test("the window keys on the last attempt, so failures also back off", async () => {
		saveSettings(
			{
				autoSync: { enabled: true, frequencyHours: 24 },
				autoSyncState: { lastRunAt: NOW - 2 * HOUR, consecutiveFailures: 1 },
			},
			settingsFile,
		);
		const d = deps({
			stageImpl: vi.fn(async () => ({
				...stagedOk(),
				blockedReason: "not linked",
			})),
		});
		await runAutoSync(d);
		expect(d.stageImpl).not.toHaveBeenCalled();
	});
});

describe("a successful run", () => {
	beforeEach(() => {
		saveSettings(
			{ autoSync: { enabled: true, frequencyHours: 24 } },
			settingsFile,
		);
	});

	test("publishes the staged bytes and logs one ok line", async () => {
		const d = deps();
		await runAutoSync(d);
		expect(d.publishImpl).toHaveBeenCalledWith("tok", '{"x":1}');
		const lines = logLines();
		expect(lines).toHaveLength(1);
		expect(lines[0]).toContain("ok - published");
	});

	test("records state and resets the failure streak", async () => {
		saveSettings(
			{ autoSyncState: { consecutiveFailures: 2, failureWarned: true } },
			settingsFile,
		);
		await runAutoSync(deps());
		const state = getSettings(settingsFile).autoSyncState;
		expect(state?.lastRunAt).toBe(NOW);
		expect(state?.lastSuccessAt).toBe(NOW);
		expect(state?.consecutiveFailures).toBe(0);
		expect(state?.failureWarned).toBe(false);
		expect(state?.lastResult).toContain("ok");
	});
});

describe("a failing run", () => {
	beforeEach(() => {
		saveSettings(
			{ autoSync: { enabled: true, frequencyHours: 24 } },
			settingsFile,
		);
	});

	test("a blockedReason counts as a failure and is logged", async () => {
		const d = deps({
			stageImpl: vi.fn(async () => ({
				...stagedOk(),
				blockedReason: "This machine is not linked.",
			})),
		});
		await runAutoSync(d);
		expect(d.publishImpl).not.toHaveBeenCalled();
		expect(logLines()[0]).toContain("not linked");
		expect(getSettings(settingsFile).autoSyncState?.consecutiveFailures).toBe(
			1,
		);
	});

	test("a thrown publish error is caught, logged, and counted", async () => {
		const d = deps({
			publishImpl: vi.fn(() => Promise.reject(new Error("HTTP 500"))),
		});
		await runAutoSync(d);
		expect(logLines()[0]).toContain("HTTP 500");
		expect(getSettings(settingsFile).autoSyncState?.lastResult).toContain(
			"HTTP 500",
		);
	});

	test("failures 1 and 2 stay silent, failure 3 emits one systemMessage", async () => {
		const d = deps({
			publishImpl: vi.fn(() => Promise.reject(new Error("HTTP 500"))),
		});
		for (let i = 0; i < 3; i++) {
			saveSettings(
				{
					autoSyncState: {
						...getSettings(settingsFile).autoSyncState,
						lastRunAt: 0,
					},
				},
				settingsFile,
			);
			await runAutoSync(d);
		}
		expect(d.emit).toHaveBeenCalledOnce();
		const payload = JSON.parse(
			(d.emit as ReturnType<typeof vi.fn>).mock.calls[0][0],
		);
		expect(payload.systemMessage).toContain("3 times");
		expect(payload.systemMessage).toContain("npx @use-aistack/cli sync");
	});

	test("failure 4 does not repeat the warning", async () => {
		saveSettings(
			{
				autoSyncState: {
					consecutiveFailures: 3,
					failureWarned: true,
					lastRunAt: 0,
				},
			},
			settingsFile,
		);
		const d = deps({
			publishImpl: vi.fn(() => Promise.reject(new Error("HTTP 500"))),
		});
		await runAutoSync(d);
		expect(d.emit).not.toHaveBeenCalled();
		expect(getSettings(settingsFile).autoSyncState?.consecutiveFailures).toBe(
			4,
		);
	});
});

describe("appendLogLine", () => {
	test("caps the log at the newest lines", () => {
		for (let i = 0; i < SYNC_LOG_MAX_LINES + 50; i++) {
			appendLogLine(logFile, `line ${i}`);
		}
		const lines = logLines();
		expect(lines).toHaveLength(SYNC_LOG_MAX_LINES);
		expect(lines[0]).toBe("line 50");
		expect(lines[lines.length - 1]).toBe(`line ${SYNC_LOG_MAX_LINES + 49}`);
	});
});
