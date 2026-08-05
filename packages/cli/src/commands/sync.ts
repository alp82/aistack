// The documented default sync surface (#56, built by #55/#57).
//
// The MCP-free channel: a human types `aistack sync` in their own terminal,
// so a real TTY exists and the gate can be a @clack/prompts select. Same
// staged-bytes property as the MCP server (#41): the summary and the confirm
// derive from the exact serialized `bodyJson`, and that string goes on the
// wire byte-identical. One gate policy, two renderings.
//
// Fail-closed: ctrl-C, ESC, EOF, and a missing TTY all resolve to "nothing
// was sent" before any network call.

import * as p from "@clack/prompts";
import { BASE_URL, syncPublish } from "../api.js";
import {
	CODEX_TRUST_INSTRUCTION,
	codexAutoSyncHookInstalled,
	codexHookTrusted,
} from "../autosync/codexHook.js";
import {
	disableAutoSync,
	enableAutoSync,
	offerAutoSyncOptIn,
} from "../autosync/optin.js";
import { runAutoSync } from "../autosync/run.js";
import { DEFAULT_FREQUENCY_HOURS, getSettings, getToken } from "../config.js";
import { stageSync } from "../sync/stage.js";
import { dim, intro, lime, outro, outroCancel, outroError } from "../theme.js";
import { offerConnectUpsell } from "./connect.js";
import { performLogin } from "./login.js";

export interface SyncOptions {
	/** `--auto` → true, `--auto on` → "on", `--auto off` → "off". */
	auto?: boolean | string;
	/** `--every <hours>`, applied with `--auto on`. */
	every?: string;
}

export async function syncCommand(options: SyncOptions = {}): Promise<void> {
	// The silent path (#62): no TTY, no prompts, no upsells. Publishes only
	// under the standing opt-in and always exits 0 — the hook command's `||`
	// offline fallback must never fire on a mere sync failure.
	if (options.auto === true) {
		await runAutoSync({ baseUrl: BASE_URL });
		return;
	}

	if (options.auto === "on" || options.auto === "off") {
		intro("sync");
		const result =
			options.auto === "on"
				? await enableAutoSync(
						options.every
							? Number.parseInt(options.every, 10) || DEFAULT_FREQUENCY_HOURS
							: DEFAULT_FREQUENCY_HOURS,
					)
				: disableAutoSync();
		if (result.ok) {
			p.log.success(result.message);
			outro("done");
		} else {
			outroError(result.message);
			process.exitCode = 1;
		}
		return;
	}
	if (options.auto !== undefined) {
		intro("sync");
		outroError(`unknown --auto value "${options.auto}" — use on or off`);
		process.exitCode = 1;
		return;
	}

	intro("sync");

	// The interactive surface is where a silent failure becomes visible (#62):
	// report the last auto-sync outcome, whatever it was.
	const lastAuto = getSettings().autoSyncState?.lastResult;
	if (lastAuto !== undefined) {
		p.log.message(dim(`auto-sync: ${lastAuto}`));
	}

	// The Codex hook does not run until the user trusts it via /hooks (#65 §6).
	// Repeat the one-time instruction while the hook is installed but the trust
	// hash is verifiably absent; an unreadable config stays silent.
	if (codexAutoSyncHookInstalled() && codexHookTrusted() === false) {
		p.log.warn(CODEX_TRUST_INSTRUCTION);
	}

	// The whole premise of this channel is a human at a terminal. A pipe or a
	// model-launched Bash call has no TTY, and a gate that cannot ask must not
	// send (#31) — refuse before scanning anything.
	if (!process.stdin.isTTY || !process.stdout.isTTY) {
		outroError("sync needs an interactive terminal — nothing was sent");
		process.exitCode = 1;
		return;
	}

	// An unlinked machine used to hard-block with "run login first" (#74). The
	// TTY gate above guarantees a human is present, so the device-auth browser
	// hop fits here — `sync` is the whole onboarding command.
	if (getToken() === null) {
		p.log.message(
			"This machine is not linked to an aistack account yet — linking it first.",
		);
		if (!(await performLogin())) {
			outroError("login failed — nothing was sent");
			process.exitCode = 1;
			return;
		}
	}

	const s = p.spinner();
	s.start("Scanning local agent transcripts");
	let staged: Awaited<ReturnType<typeof stageSync>>;
	try {
		staged = await stageSync({ baseUrl: BASE_URL });
	} catch (e) {
		s.stop("Scan failed");
		outroError(e instanceof Error ? e.message : String(e));
		process.exitCode = 1;
		return;
	}
	s.stop("Scan complete");

	// Beat one — the same full summary the MCP preview returns, verbatim,
	// printed behind the clack bar so it reads as one flow.
	p.log.message(staged.summary.split("\n").join("\n"));

	if (staged.blockedReason !== null) {
		outroError(staged.blockedReason);
		process.exitCode = 1;
		return;
	}

	// Beat two — the same short dialog text, as a select. The enum mirrors the
	// elicitation's {publish, cancel}; cancel is the initial value, so Enter
	// alone publishes nothing.
	const decision = await p.select({
		message: staged.dialog.split("\n").join(dim(" · ")),
		options: [
			{ value: "cancel", label: "Cancel", hint: "nothing leaves this machine" },
			{ value: "publish", label: "Publish" },
		],
		initialValue: "cancel",
	});

	if (p.isCancel(decision) || decision !== "publish") {
		outroCancel("nothing was sent");
		return;
	}

	s.start("Publishing");
	try {
		const res = await syncPublish(staged.token as string, staged.bodyJson);
		s.stop("Published");
		const lines = [
			`Snapshot received at ${new Date(res.receivedAt).toISOString()}`,
			lime(res.url),
		];
		if (res.keptPrivate.refused && staged.body.keptPrivate !== undefined) {
			lines.push(
				"Note: the kept-private names were refused by the server — the review switch is off there now. They stayed on this machine.",
			);
		} else if (res.keptPrivate.stored > 0) {
			lines.push(
				`${res.keptPrivate.stored} kept-private names went up for your review at ${res.url}/changes`,
			);
		}
		p.log.message(lines.join("\n"));
		// At most one ask per sync (#62): the auto-sync opt-in is the primary
		// ask; the connect upsell yields and waits for a later sync.
		const asked = await offerAutoSyncOptIn();
		if (!asked) await offerConnectUpsell();
		outro("done");
	} catch (e) {
		s.stop("Publish failed");
		outroError(e instanceof Error ? e.message : String(e));
		process.exitCode = 1;
	}
}
