// The send channel and its gate - wayfinder ticket #41 (map #29).
//
// The properties under test are the spike's (#35): consent is collected by an
// ENUM elicitation raised inside the call; every non-accept outcome resolves
// to "nothing was sent"; the model's arguments count for nothing; and the
// bytes sent are byte-identical to the bytes staged at preview time.

import { describe, expect, test, vi } from "vitest";
import type { SyncPublishResult } from "../api.js";
import type {
	KeptPrivateAtom,
	NameCategory,
} from "../harness/shared/allowlist.js";
import type { SyncBody } from "../harness/shared/payload.js";
import { createSyncServer, STAGE_TTL_MS } from "./server.js";
import { type StagedSend, stageId } from "./stage.js";

const NOW = 1_753_800_000_000;

const EMPTY_KEPT: Record<NameCategory, KeptPrivateAtom[]> = {
	builtinTools: [],
	mcpServers: [],
	skills: [],
	subagents: [],
	slashCommands: [],
};

function makeStaged(over: Partial<StagedSend> = {}): StagedSend {
	const body = { payload: { marker: "exact-bytes" } } as unknown as SyncBody;
	const bodyJson = JSON.stringify(body);
	return {
		id: stageId(bodyJson),
		bodyJson,
		body,
		keptPrivate: EMPTY_KEPT,
		summary: "SUMMARY",
		dialog: "Publish to aistack? 1 tokens · 30 days",
		config: {
			allowlist: {
				mcpServers: [],
				skills: [],
				subagents: [],
				slashCommands: [],
			},
			publishCost: true,
			autoSync: null,
			optIns: EMPTY_KEPT as never,
			reviewKeptPrivate: false,
			stack: { name: "S", slug: "s" },
		},
		token: "tok_1",
		stagedAt: NOW,
		blockedReason: null,
		...over,
	};
}

const PUBLISH_OK: SyncPublishResult = {
	receivedAt: NOW + 5_000,
	stackSlug: "s",
	url: "https://aistack.to/stacks/s",
	keptPrivate: { stored: 0, refused: false },
};

function makeServer(opts: {
	staged?: StagedSend;
	publishResult?: SyncPublishResult;
	publishError?: Error;
	now?: () => number;
	elicitTimeoutMs?: number;
}) {
	const sent: Array<Record<string, unknown>> = [];
	const publishImpl = vi.fn(async () => {
		if (opts.publishError) throw opts.publishError;
		return opts.publishResult ?? PUBLISH_OK;
	});
	const stageImpl = vi.fn(async () => opts.staged ?? makeStaged());
	const server = createSyncServer(
		{
			baseUrl: "https://aistack.to",
			stageImpl,
			publishImpl,
			now: opts.now ?? (() => NOW),
			elicitTimeoutMs: opts.elicitTimeoutMs,
		},
		(msg) => sent.push(msg as Record<string, unknown>),
	);
	return { server, sent, publishImpl, stageImpl };
}

const tick = () => new Promise((r) => setTimeout(r, 0));

function init(server: { handle: (m: never) => void }, withElicitation = true) {
	server.handle({
		jsonrpc: "2.0",
		id: 0,
		method: "initialize",
		params: {
			protocolVersion: "2025-06-18",
			capabilities: withElicitation ? { elicitation: {} } : {},
		},
	} as never);
}

async function preview(s: ReturnType<typeof makeServer>) {
	s.server.handle({
		jsonrpc: "2.0",
		id: 1,
		method: "tools/call",
		params: { name: "sync_preview" },
	} as never);
	await tick();
	const reply = s.sent.find((m) => m.id === 1) as {
		result: { content: Array<{ text: string }> };
	};
	return reply.result.content[0].text;
}

function callPublish(s: ReturnType<typeof makeServer>, previewId: string) {
	s.server.handle({
		jsonrpc: "2.0",
		id: 2,
		method: "tools/call",
		params: { name: "sync_publish", arguments: { preview_id: previewId } },
	} as never);
}

function elicitationRequest(s: ReturnType<typeof makeServer>) {
	return s.sent.find((m) => m.method === "elicitation/create") as
		| { id: string; params: { message: string; requestedSchema: never } }
		| undefined;
}

function answerElicitation(s: ReturnType<typeof makeServer>, result: unknown) {
	const req = elicitationRequest(s);
	if (!req) throw new Error("no elicitation was raised");
	s.server.handle({ jsonrpc: "2.0", id: req.id, result } as never);
}

function publishResultText(s: ReturnType<typeof makeServer>): string {
	const reply = s.sent.find((m) => m.id === 2) as {
		result: { content: Array<{ text: string }> };
	};
	return reply.result.content[0].text;
}

describe("protocol basics", () => {
	test("initialize answers and tools/list names both tools", () => {
		const s = makeServer({});
		init(s.server);
		s.server.handle({ jsonrpc: "2.0", id: 5, method: "tools/list" } as never);
		const reply = s.sent.find((m) => m.id === 5) as {
			result: { tools: Array<{ name: string }> };
		};
		expect(reply.result.tools.map((t) => t.name)).toEqual([
			"sync_preview",
			"sync_publish",
		]);
	});

	test("preview returns the summary and the stage id", async () => {
		const s = makeServer({});
		init(s.server);
		const text = await preview(s);
		expect(text).toContain("SUMMARY");
		expect(text).toContain(`preview id: ${makeStaged().id}`);
	});

	test("a blocked preview names the reason instead of an id", async () => {
		const s = makeServer({
			staged: makeStaged({ blockedReason: "This machine is not linked." }),
		});
		init(s.server);
		const text = await preview(s);
		expect(text).toContain("publish unavailable: This machine is not linked.");
		expect(text).not.toContain("preview id:");
	});
});

describe("the gate - consent path", () => {
	test("accept + publish sends the EXACT staged bytes with the staged token", async () => {
		const staged = makeStaged();
		const s = makeServer({ staged });
		init(s.server);
		await preview(s);
		callPublish(s, staged.id);

		const req = elicitationRequest(s);
		expect(req?.params.message).toBe(staged.dialog);
		// Enum, never boolean - the boolean widget is dead (#35, 1G).
		expect(JSON.stringify(req?.params.requestedSchema)).toContain(
			'"enum":["publish","cancel"]',
		);

		answerElicitation(s, {
			action: "accept",
			content: { decision: "publish" },
		});
		await tick();
		expect(s.publishImpl).toHaveBeenCalledWith("tok_1", staged.bodyJson);
		expect(publishResultText(s)).toContain("Published.");
		// The stage is consumed: a second publish must re-preview.
		expect(s.server.staged()).toBeNull();
	});

	test("kept-private refusal is reported truthfully (#51)", async () => {
		const body = {
			payload: { marker: "x" },
			keptPrivate: EMPTY_KEPT,
		} as unknown as SyncBody;
		const bodyJson = JSON.stringify(body);
		const staged = makeStaged({ id: stageId(bodyJson), body, bodyJson });
		const s = makeServer({
			staged,
			publishResult: {
				...PUBLISH_OK,
				keptPrivate: { stored: 0, refused: true },
			},
		});
		init(s.server);
		await preview(s);
		callPublish(s, staged.id);
		answerElicitation(s, {
			action: "accept",
			content: { decision: "publish" },
		});
		await tick();
		expect(publishResultText(s)).toContain("refused the kept-private names");
		expect(publishResultText(s)).toContain("stayed on this machine");
	});
});

describe("the gate - every other outcome sends nothing", () => {
	async function expectNothingSent(
		s: ReturnType<typeof makeServer>,
		fragment: string,
	) {
		await tick();
		expect(s.publishImpl).not.toHaveBeenCalled();
		expect(publishResultText(s)).toContain(fragment);
	}

	test("decline", async () => {
		const staged = makeStaged();
		const s = makeServer({ staged });
		init(s.server);
		await preview(s);
		callPublish(s, staged.id);
		answerElicitation(s, { action: "decline" });
		await expectNothingSent(s, "Not published");
	});

	test("accept with decision=cancel - the widget's other answer", async () => {
		const staged = makeStaged();
		const s = makeServer({ staged });
		init(s.server);
		await preview(s);
		callPublish(s, staged.id);
		answerElicitation(s, { action: "accept", content: { decision: "cancel" } });
		await expectNothingSent(s, "Not published");
	});

	test("timeout resolves as cancel, like the headless auto-cancel (#35)", async () => {
		const staged = makeStaged();
		const s = makeServer({ staged, elicitTimeoutMs: 5 });
		init(s.server);
		await preview(s);
		callPublish(s, staged.id);
		await new Promise((r) => setTimeout(r, 20));
		await expectNothingSent(s, "timed out");
	});

	test("a client that never declared elicitation is refused BEFORE any dialog", async () => {
		const staged = makeStaged();
		const s = makeServer({ staged });
		init(s.server, false);
		await preview(s);
		callPublish(s, staged.id);
		expect(elicitationRequest(s)).toBeUndefined();
		await expectNothingSent(s, "elicitation capability");
	});

	test("publish without a preview is refused", async () => {
		const s = makeServer({});
		init(s.server);
		callPublish(s, "anything");
		await expectNothingSent(s, "nothing is staged");
	});

	test("a wrong preview id is refused - the model cannot name other bytes", async () => {
		const staged = makeStaged();
		const s = makeServer({ staged });
		init(s.server);
		await preview(s);
		callPublish(s, "ffffffffffff");
		expect(elicitationRequest(s)).toBeUndefined();
		await expectNothingSent(s, "does not match");
	});

	test("a stale stage is refused and cleared", async () => {
		const staged = makeStaged();
		let t = NOW;
		const s = makeServer({ staged, now: () => t });
		init(s.server);
		await preview(s);
		t = NOW + STAGE_TTL_MS + 1;
		callPublish(s, staged.id);
		await expectNothingSent(s, "older than 10 minutes");
		expect(s.server.staged()).toBeNull();
	});

	test("a blocked stage is refused at publish too", async () => {
		const staged = makeStaged({ blockedReason: "no destination" });
		const s = makeServer({ staged });
		init(s.server);
		await preview(s);
		callPublish(s, staged.id);
		await expectNothingSent(s, "no destination");
	});

	test("a publish failure after consent is reported, not swallowed", async () => {
		const staged = makeStaged();
		const s = makeServer({
			staged,
			publishError: new Error("Sync failed: 400"),
		});
		init(s.server);
		await preview(s);
		callPublish(s, staged.id);
		answerElicitation(s, {
			action: "accept",
			content: { decision: "publish" },
		});
		await tick();
		expect(publishResultText(s)).toContain("Publish failed after consent");
	});
});
