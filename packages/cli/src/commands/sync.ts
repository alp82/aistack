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
	settleAutoSync,
} from "../autosync/optin.js";
import { runAutoSync } from "../autosync/run.js";
import { DEFAULT_FREQUENCY_HOURS, getSettings, getToken } from "../config.js";
import { loadSyncConfig } from "../harness/shared/allowlist.js";
import { stageSync } from "../sync/stage.js";
import { fmtReceivedAt } from "../sync/summary.js";
import {
	bold,
	dim,
	intro,
	lime,
	outro,
	outroCancel,
	outroError,
	yellow,
} from "../theme.js";
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
	// under the standing opt-in and always exits 0 - the hook command's `||`
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
				: await disableAutoSync();
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
		outroError(`unknown --auto value "${options.auto}" (use on or off)`);
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
	// send (#31) - refuse before scanning anything.
	if (!process.stdin.isTTY || !process.stdout.isTTY) {
		outroError("sync needs an interactive terminal. Nothing was sent.");
		process.exitCode = 1;
		return;
	}

	// An unlinked machine used to hard-block with "run login first" (#74). The
	// TTY gate above guarantees a human is present, so the device-auth browser
	// hop fits here - `sync` is the whole onboarding command.
	let token = getToken();
	if (token === null) {
		p.log.message("This machine needs a destination stack. Linking it now.");
		if (!(await performLogin({ destinationRequired: true }))) {
			outroError("login failed. Nothing was sent.");
			process.exitCode = 1;
			return;
		}
		token = getToken();
	}
	if (token === null) {
		outroError("login completed without a saved credential. Nothing was sent.");
		process.exitCode = 1;
		return;
	}

	// Resolve the destination before walking local history. A valid credential
	// can outlive its stack choice, especially when login happened before the
	// first stack was created. Relinking rotates that credential and returns to
	// this same sync, so the user never has to discover a second command.
	let loaded = await loadSyncConfig({ baseUrl: BASE_URL, token });
	if (loaded.source === "bundled") {
		outroError(
			"Could not fetch your settings from aistack, so the destination stack is unknown. Check the network and sync again.",
		);
		process.exitCode = 1;
		return;
	}
	if (loaded.config.stack === null) {
		p.log.message(
			"This machine is not linked to a destination stack. Opening aistack so you can choose one.",
		);
		if (
			!(await performLogin({
				destinationRequired: true,
				replaceToken: token,
			}))
		) {
			outroError("linking failed. Nothing was sent.");
			process.exitCode = 1;
			return;
		}
		token = getToken();
		if (token === null) {
			outroError(
				"linking completed without a saved credential. Nothing was sent.",
			);
			process.exitCode = 1;
			return;
		}
		loaded = await loadSyncConfig({ baseUrl: BASE_URL, token });
		if (loaded.source === "bundled" || loaded.config.stack === null) {
			outroError(
				"The destination stack could not be confirmed. Nothing was sent.",
			);
			process.exitCode = 1;
			return;
		}
		p.log.success(`Linked this machine to ${loaded.config.stack.name}`);
	}
	const destinationToken = token;
	const destinationConfig = loaded;

	const s = p.spinner();
	s.start("Scanning local agent transcripts");
	let staged: Awaited<ReturnType<typeof stageSync>>;
	try {
		staged = await stageSync({
			baseUrl: BASE_URL,
			getTokenImpl: () => destinationToken,
			loadConfigImpl: async () => destinationConfig,
			onProgress: (message) => s.message(message),
		});
	} catch (e) {
		s.stop("Scan failed");
		outroError(e instanceof Error ? e.message : String(e));
		process.exitCode = 1;
		return;
	}
	s.stop("Scan complete");

	// Beat one - the same full summary the MCP preview returns, verbatim,
	// printed behind the clack bar so it reads as one flow. The text is the
	// bytes' description and stays plain; the color is added here, by line
	// shape, so the MCP preview and a pipe get the same characters.
	p.log.message(staged.summary.split("\n").map(styleSummaryLine).join("\n"));

	if (staged.blockedReason !== null) {
		outroError(staged.blockedReason);
		process.exitCode = 1;
		return;
	}

	// Beat two - the same short dialog text, as a select. The enum mirrors the
	// elicitation's {publish, cancel}; publish is the initial value.
	const decision = await p.select({
		message: staged.dialog.split("\n").join(dim(" · ")),
		options: [
			{
				value: "publish",
				label: "Publish",
				hint: "no sensitive data is shared",
			},
			{ value: "cancel", label: "Cancel", hint: "nothing leaves this machine" },
		],
		initialValue: "publish",
	});

	if (p.isCancel(decision) || decision !== "publish") {
		outroCancel("nothing was sent");
		return;
	}

	s.start("Publishing");
	try {
		const res = await syncPublish(staged.token as string, staged.bodyJson);
		s.stop("Published");
		// The last thing read is the result, not a receipt (#130): the stamp is
		// human-form, and the link gets its own line under a sentence that names
		// the proof. The path stays in the terminal - no browser is opened.
		const lines = [
			`Snapshot received ${fmtReceivedAt(res.receivedAt)}`,
			"",
			"Your stack now shows what actually ran:",
			lime(res.url),
		];
		if (res.keptPrivate.refused && staged.body.keptPrivate !== undefined) {
			lines.push(
				"Note: the server refused the kept-private names because its review switch is off. They stayed on this machine.",
			);
		} else if (res.keptPrivate.stored > 0) {
			lines.push(
				`${res.keptPrivate.stored} private review name${res.keptPrivate.stored === 1 ? "" : "s"} stored at ${res.url}/changes`,
			);
		}
		if (res.keptPrivate.machineStored > 0) {
			lines.push(
				"This machine's private label was stored for the same review.",
			);
		}
		p.log.message(lines.join("\n"));
		// EVERY interactive sync settles auto-sync against the stack's own
		// answer (#103): it reconciles the missing triggers when the switch is
		// on, keeps quiet when it is off, and asks only when nobody has decided.
		// This is what completes a web-first enable, and what gives a harness
		// adopted months later its trigger.
		//
		// At most one ask per sync (#62): the auto-sync opt-in is the primary
		// ask; the connect upsell yields and waits for a later sync.
		const asked = await settleAutoSync(staged.config.autoSync);
		if (!asked) await offerConnectUpsell();
		outro("done");
	} catch (e) {
		s.stop("Publish failed");
		outroError(e instanceof Error ? e.message : String(e));
		process.exitCode = 1;
	}
}

/**
 * Colors one summary line the way `collect` colors its output: a caps section
 * header in bold with a dim count, the rule dim, the label column dim, dollars
 * lime, and a skipped-files row yellow. Every other line passes through.
 */
export function styleSummaryLine(line: string): string {
	if (line.startsWith("─")) return dim(line);
	const section = /^([A-Z][A-Z0-9 .-]+?)( \d+)?$/.exec(line);
	if (section) return `${bold(section[1] ?? "")}${dim(section[2] ?? "")}`;
	const labelled = /^([a-z-]+)( +)(.*)$/.exec(line);
	if (labelled) {
		const [, label = "", gap = "", rest = ""] = labelled;
		const body =
			label === "skipped"
				? yellow(rest)
				: rest.replace(/≈\$[\d,]+/g, (m) => lime(m));
		return `${dim(label)}${gap}${body}`;
	}
	const sub = /^( {2}[a-z]+ +)(.*)$/.exec(line);
	if (sub) return `${lime(sub[1] ?? "")}${dim(sub[2] ?? "")}`;
	if (/^ {10}\S/.test(line)) return dim(line);
	return line;
}
