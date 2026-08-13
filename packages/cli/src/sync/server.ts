// The local stdio MCP server — the send channel picked by the spike #35.
//
// Wayfinder ticket #41 (map #29). Two tools, two beats:
//
//   sync_preview  — scans locally, stages the exact send bytes, returns the
//                   full summary as ordinary transcript output (beat one).
//   sync_publish  — takes the stage id, raises a SHORT `elicitation/create`
//                   with an ENUM field (beat two), and sends only on
//                   `decision: "publish"`.
//
// Why elicitation and not `requiresUserInteraction`: the spike showed the
// permission dialog can be silenced forever with one click and writes a grant
// broader than the sentence shown, while an elicitation is raised INSIDE the
// call — there is no string a model can spell to route around it, and no
// "don't ask again" exists for it. The enum widget is the working one; the
// boolean widget is dead in 2.1.220 and must never ship.
//
// Fail-closed, by construction: ESC, a timeout, a headless auto-cancel, an
// error reply, or a client that never declared the elicitation capability all
// resolve to "nothing was sent". The model's arguments count for nothing —
// the only path to a send runs through the user's own keystrokes.
//
// Hand-rolled JSON-RPC over stdio, zero dependencies, structured so tests can
// drive `handle()` directly and capture every outbound frame.

import { type SyncPublishResult, syncPublish } from "../api.js";
import { type StageDeps, type StagedSend, stageSync } from "./stage.js";
import { fmtReceivedAt } from "./summary.js";

const SERVER_NAME = "aistack";
const SERVER_VERSION = "0.3.0";

/** How long a staged preview stays publishable. Stale bytes must re-preview. */
export const STAGE_TTL_MS = 10 * 60 * 1000;

/**
 * How long the gate waits for the human. Deliberately WELL past the harness's
 * own 120 s tool timeout (#35, 1H measured 92 s for a one-line answer): the
 * server must never be the first to give up. On expiry it resolves as cancel.
 */
export const ELICIT_TIMEOUT_MS = 10 * 60 * 1000;

const PREVIEW_TOOL = {
	name: "sync_preview",
	description:
		"Scan local agent transcripts (Claude Code, Codex) and stage a measured-usage snapshot for aistack. " +
		"Returns the full preview of exactly what would publish. " +
		"Show the returned text to the user VERBATIM — it is the review surface. Nothing is sent.",
	inputSchema: { type: "object", properties: {} },
	annotations: {
		title: "aistack — preview sync (sends nothing)",
		readOnlyHint: true,
		openWorldHint: true,
	},
};

const PUBLISH_TOOL = {
	name: "sync_publish",
	description:
		"Publish the staged aistack snapshot named by preview_id. " +
		"Asks the user for confirmation during the call; only their explicit choice sends anything. " +
		"Call sync_preview first and show its output.",
	inputSchema: {
		type: "object",
		properties: {
			preview_id: {
				type: "string",
				description: "The `preview id` line from sync_preview's output.",
			},
		},
		required: ["preview_id"],
	},
	annotations: {
		title: "aistack — publish measured usage (asks the user first)",
		destructiveHint: false,
		openWorldHint: true,
	},
};

type JsonRpcMessage = {
	jsonrpc?: string;
	id?: string | number;
	method?: string;
	params?: Record<string, unknown> | undefined;
	result?: unknown;
	error?: unknown;
};

export type SyncServerDeps = {
	baseUrl: string;
	stageImpl?: (deps: StageDeps) => Promise<StagedSend>;
	publishImpl?: (token: string, bodyJson: string) => Promise<SyncPublishResult>;
	now?: () => number;
	elicitTimeoutMs?: number;
	/** Diagnostics only. NEVER stdout — that would corrupt the protocol. */
	log?: (line: string) => void;
};

export type SyncServer = {
	handle: (msg: JsonRpcMessage) => void;
	/** Test seam: the staged send, if any. */
	staged: () => StagedSend | null;
};

const textResult = (text: string, isError = false) => ({
	content: [{ type: "text", text }],
	...(isError ? { isError: true } : {}),
});

export function createSyncServer(
	deps: SyncServerDeps,
	send: (msg: JsonRpcMessage) => void,
): SyncServer {
	const now = deps.now ?? Date.now;
	const stage = deps.stageImpl ?? stageSync;
	const publish = deps.publishImpl ?? syncPublish;
	const log = deps.log ?? (() => {});
	const elicitTimeoutMs = deps.elicitTimeoutMs ?? ELICIT_TIMEOUT_MS;

	let clientSupportsElicitation = false;
	let staged: StagedSend | null = null;
	let nextRequestId = 1;
	const pending = new Map<string, (reply: JsonRpcMessage | null) => void>();

	const ok = (id: string | number | undefined, result: unknown) =>
		send({ jsonrpc: "2.0", id, result });
	const err = (
		id: string | number | undefined,
		code: number,
		message: string,
	) => send({ jsonrpc: "2.0", id, error: { code, message } });

	/** Ask the client something; `null` reply means the gate timed out. */
	const request = (
		method: string,
		params: Record<string, unknown>,
		onReply: (reply: JsonRpcMessage | null) => void,
	) => {
		const id = `aistack-${nextRequestId++}`;
		pending.set(id, onReply);
		send({ jsonrpc: "2.0", id, method, params });
		const timer = setTimeout(() => {
			if (pending.delete(id)) onReply(null);
		}, elicitTimeoutMs);
		(timer as { unref?: () => void }).unref?.();
	};

	const runPreview = async (id: string | number | undefined) => {
		try {
			staged = await stage({ baseUrl: deps.baseUrl, now });
		} catch (e) {
			staged = null;
			const message = e instanceof Error ? e.message : String(e);
			return ok(id, textResult(`Preview failed: ${message}`, true));
		}
		const lines = [staged.summary, ""];
		if (staged.blockedReason === null) {
			lines.push(`preview id: ${staged.id}`);
			lines.push(
				"To publish, call sync_publish with this preview id. The user confirms in a dialog during that call.",
			);
		} else {
			lines.push(`publish unavailable: ${staged.blockedReason}`);
		}
		return ok(id, textResult(lines.join("\n")));
	};

	const runPublish = (
		id: string | number | undefined,
		args: Record<string, unknown> | undefined,
	) => {
		// Every refusal below is fail-closed: no dialog was shown, nothing sent.
		if (!clientSupportsElicitation) {
			return ok(
				id,
				textResult(
					"Not published: this Claude Code version did not declare the elicitation capability, " +
						"so the approve dialog cannot be shown. The gate never degrades silently — " +
						"update Claude Code and try again.",
					true,
				),
			);
		}
		const previewId = args?.preview_id;
		if (staged === null) {
			return ok(
				id,
				textResult(
					"Not published: nothing is staged. Run sync_preview first and show its output to the user.",
					true,
				),
			);
		}
		if (typeof previewId !== "string" || previewId !== staged.id) {
			return ok(
				id,
				textResult(
					"Not published: preview_id does not match the staged preview. Run sync_preview again.",
					true,
				),
			);
		}
		if (staged.blockedReason !== null) {
			return ok(id, textResult(`Not published: ${staged.blockedReason}`, true));
		}
		if (now() - staged.stagedAt > STAGE_TTL_MS) {
			staged = null;
			return ok(
				id,
				textResult(
					"Not published: the staged preview is older than 10 minutes. Run sync_preview again so the user reviews current bytes.",
					true,
				),
			);
		}

		const approvedStage = staged;
		log(`elicitation raised for stage ${approvedStage.id}`);
		request(
			"elicitation/create",
			{
				message: approvedStage.dialog,
				requestedSchema: {
					type: "object",
					properties: {
						decision: {
							type: "string",
							// The enum widget is the one that works (#35, 1G). Never a boolean.
							enum: ["publish", "cancel"],
							description: "Publish the snapshot described above?",
						},
					},
					required: ["decision"],
				},
			},
			(reply) => {
				const result = reply?.result as
					| { action?: string; content?: { decision?: string } }
					| undefined;
				const approved =
					result?.action === "accept" &&
					result?.content?.decision === "publish";
				if (!approved) {
					const outcome =
						reply === null ? "timed out" : (result?.action ?? "error");
					log(`elicitation resolved without consent: ${outcome}`);
					return ok(
						id,
						textResult(
							`Not published: the confirmation was not accepted (${outcome}). Nothing left this machine.`,
						),
					);
				}
				log(`consent received, sending stage ${approvedStage.id}`);
				publish(approvedStage.token as string, approvedStage.bodyJson).then(
					(res) => {
						if (staged?.id === approvedStage.id) staged = null;
						// Same ending as the terminal channel (#130): the result last,
						// the stamp in human form.
						const lines = [
							`Published. Snapshot received ${fmtReceivedAt(res.receivedAt)}.`,
							"",
							"Your stack now shows what actually ran:",
							res.url,
						];
						const kp = approvedStage.body.keptPrivate;
						if (res.keptPrivate.refused && kp !== undefined) {
							lines.push(
								"Note: the kept-private names were refused by the server — the review switch is off there now. They stayed on this machine.",
							);
						} else if (res.keptPrivate.stored > 0) {
							lines.push(
								`${res.keptPrivate.stored} kept-private names went up for your review at ${res.url}/changes`,
							);
						}
						ok(id, textResult(lines.join("\n")));
					},
					(e) => {
						const message = e instanceof Error ? e.message : String(e);
						ok(
							id,
							textResult(`Publish failed after consent: ${message}`, true),
						);
					},
				);
			},
		);
	};

	const handle = (msg: JsonRpcMessage) => {
		const { id, method, params } = msg;

		// A reply to something we asked, not a new request.
		if (method === undefined && id !== undefined && pending.has(String(id))) {
			const onReply = pending.get(String(id));
			pending.delete(String(id));
			onReply?.(msg);
			return;
		}

		switch (method) {
			case "initialize": {
				const capabilities =
					(params?.capabilities as Record<string, unknown> | undefined) ?? {};
				clientSupportsElicitation = "elicitation" in capabilities;
				log(
					`initialize: elicitation ${clientSupportsElicitation ? "declared" : "ABSENT"}`,
				);
				return ok(id, {
					protocolVersion:
						(params?.protocolVersion as string | undefined) ?? "2025-06-18",
					capabilities: { tools: { listChanged: false } },
					serverInfo: { name: SERVER_NAME, version: SERVER_VERSION },
				});
			}

			case "ping":
				return ok(id, {});

			case "tools/list":
				return ok(id, { tools: [PREVIEW_TOOL, PUBLISH_TOOL] });

			case "tools/call": {
				const name = params?.name;
				const args = params?.arguments as Record<string, unknown> | undefined;
				if (name === "sync_preview") return void runPreview(id);
				if (name === "sync_publish") return runPublish(id, args);
				return err(id, -32602, `Unknown tool: ${String(name)}`);
			}

			default:
				if (method?.startsWith("notifications/")) return;
				if (method !== undefined)
					return err(id, -32601, `Method not found: ${method}`);
		}
	};

	return { handle, staged: () => staged };
}

/** Wire the server to real stdio. Never returns; the harness owns the process. */
export function runStdioSyncServer(deps: SyncServerDeps): void {
	const server = createSyncServer(deps, (msg) => {
		process.stdout.write(`${JSON.stringify(msg)}\n`);
	});
	let buffer = "";
	process.stdin.setEncoding("utf8");
	process.stdin.on("data", (chunk: string) => {
		buffer += chunk;
		let nl = buffer.indexOf("\n");
		while (nl !== -1) {
			const line = buffer.slice(0, nl).trim();
			buffer = buffer.slice(nl + 1);
			if (line) {
				try {
					server.handle(JSON.parse(line));
				} catch (e) {
					deps.log?.(`parse error: ${String(e)}`);
				}
			}
			nl = buffer.indexOf("\n");
		}
	});
}
