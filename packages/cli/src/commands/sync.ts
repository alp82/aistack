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
import { stageSync } from "../sync/stage.js";
import { dim, intro, lime, outro, outroCancel, outroError } from "../theme.js";
import { offerConnectUpsell } from "./connect.js";

export async function syncCommand(): Promise<void> {
	intro("sync");

	// The whole premise of this channel is a human at a terminal. A pipe or a
	// model-launched Bash call has no TTY, and a gate that cannot ask must not
	// send (#31) — refuse before scanning anything.
	if (!process.stdin.isTTY || !process.stdout.isTTY) {
		outroError("sync needs an interactive terminal — nothing was sent");
		process.exitCode = 1;
		return;
	}

	const s = p.spinner();
	s.start("Scanning local Claude Code transcripts");
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
		await offerConnectUpsell();
		outro("done");
	} catch (e) {
		s.stop("Publish failed");
		outroError(e instanceof Error ? e.message : String(e));
		process.exitCode = 1;
	}
}
