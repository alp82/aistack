// @vitest-environment node

import sharp from "sharp";
import { describe, expect, test, vi } from "vitest";
import type { DiscordAnswer } from "../../../../convex/discordStats";
import { discordStatsSvg } from "../../charts/discordStatsSvg";
import {
	handleDiscordRender,
	loadRenderIcons,
	RENDER_BODY_LIMIT,
	renderSignature,
	renderStatsPng,
} from "./render";
import type { RenderAnswer, RenderRequest } from "./renderContract";

// Compile-time drift check: the Convex contract must remain valid renderer input.
const acceptsProjection = (answer: DiscordAnswer): RenderAnswer => answer;
void acceptsProjection;
function sampleAnswer(): RenderAnswer {
	const usage = {
		dates: ["2026-09-12"],
		activeDays: 1,
		sessions: 3,
		projects: 1,
		totalTokens: 100000,
		cacheHitShare: 0.5,
		subagentShare: 0,
		models: [
			{
				id: "gpt",
				catalogSlug: "gpt",
				catalogName:
					"A very long real catalog model name that should fit safely",
				tokens: { input: 50000, output: 50000, cacheWrite: 0, cacheRead: 0 },
				totalTokens: 100000,
				tokenShare: 1,
				usd: 2,
				estimated: true,
				pricingTables: ["modelPrices/22-abc"],
			},
		],
		harnesses: [
			{ harness: "codex", sessions: 3, totalTokens: 100000, tokenShare: 1 },
		],
		cost: {
			usd: 2,
			estimated: true,
			pricedShare: 0.8,
			pricingTables: ["modelPrices/22-abc"],
		},
		excludedTokens: { unpriced: 20000, synthetic: 0 },
	};
	const rows = Array.from({ length: 8 }, (_, i) => ({
		id: String(i),
		name: `Real tool ${i}`,
		iconUrl: null,
		monthlyUSD: i ? 0 : 20,
		state: i ? ("sponsored" as const) : ("paid" as const),
	}));
	return {
		identity: {
			creatorId: "creator",
			stackId: "stack",
			handle: "a-creator-with-a-long-name-that-must-fit",
			name: "Creator",
			avatarUrl: null,
			profileUrl: "https://aistack.to/@alice",
			stackName: "Stack",
			stackUrl: "https://aistack.to/s/stack",
		},
		range: {
			endDate: "2026-09-12",
			days: 7,
			current: { from: "2026-09-06", to: "2026-09-12" },
			previous: { from: "2026-08-30", to: "2026-09-05" },
		},
		current: {
			usage,
			context: [
				{
					harness: "codex",
					window: 200000,
					calls: 100,
					medianCall: 64000,
					p90Call: 120000,
					harnessTokens: 12000,
					instructionsTokens: 8000,
					usualChat: 44000,
					longChat: 100000,
					compactions: 1,
				},
			],
			modelIds: ["gpt"],
			hasMoreModels: false,
		},
		previous: { usage: null, context: [], modelIds: [], hasMoreModels: false },
		subscriptions: {
			monthlyUSD: 20,
			rows,
			preview: rows.slice(0, 5),
			hasMore: true,
		},
		icons: [{ kind: "harness", id: "codex", name: "Codex", iconUrl: null }],
		selectedContextHarness: "codex",
		selectedTokenHarness: "codex",
		publishCost: true,
		publishWorkflow: true,
	};
}
const payload = (
	command: RenderRequest["command"] = "tokens",
	comparison = false,
): RenderRequest => ({
	version: 1,
	command,
	full: false,
	subject: sampleAnswer(),
	comparison: comparison ? sampleAnswer() : null,
});
const secret = "test-secret-with-at-least-thirty-two-characters",
	timestamp = "1789171200000";
function request(
	body: string,
	signature = renderSignature(secret, timestamp, body),
	time = timestamp,
) {
	return new Request("http://localhost/api/discord/render", {
		method: "POST",
		headers: {
			"content-type": "application/json",
			"x-aistack-render-timestamp": time,
			"x-aistack-render-signature": signature,
		},
		body,
	});
}
const options = { secret, now: Number(timestamp), iconOrigins: [] };
describe("production Discord renderer", () => {
	test.each(["tokens", "harness", "cost", "context", "compare"] as const)(
		"rasterizes %s and person comparison",
		async (command) => {
			for (const comparison of [false, true]) {
				const p = payload(command, comparison);
				const png = await renderStatsPng(p);
				const info = await sharp(png).metadata();
				expect(info.format).toBe("png");
				expect(info.width).toBe(960);
				expect(info.height).toBeGreaterThan(400);
			}
		},
	);
	test("shows citations, coverage, estimates and removes withheld costs", () => {
		const p = payload("compare", true);
		let svg = discordStatsSvg(p).svg;
		expect(svg).toContain("modelPrices/22-abc");
		expect(svg).toContain("80.0% of tokens priced");
		expect(svg).toContain("estimate / lower bound");
		p.subject.publishCost = false;
		if (p.comparison) p.comparison.publishCost = false;
		svg = discordStatsSvg(p).svg;
		expect(svg).not.toContain("$2.00");
		expect(svg).not.toContain("modelPrices/22-abc");
	});
	test("fills five subscriptions and full list preserves sponsored and included states", async () => {
		const p = payload("cost");
		p.subject.subscriptions.rows[1].state = "included";
		let svg = discordStatsSvg(p).svg;
		expect(svg).toContain("Real tool 4");
		expect(svg).not.toContain("Real tool 5");
		expect(svg).toContain("included");
		expect(svg).toContain("sponsored");
		p.full = true;
		svg = discordStatsSvg(p).svg;
		expect(svg).toContain("Real tool 7");
		expect((await renderStatsPng(p)).length).toBeGreaterThan(1000);
	});
	test("context honors selected harness, actual window and evidence flags", async () => {
		const p = payload("context", true);
		p.subject.current.context.push({
			...p.subject.current.context[0],
			harness: "claude-code",
			window: 1000000,
			medianCall: 0,
			p90Call: 0,
			breakdownAvailable: false,
			retainedCallsOnly: true,
		});
		p.subject.selectedContextHarness = "claude-code";
		let svg = discordStatsSvg(p).svg;
		expect(svg).toContain("1M window");
		expect(svg).toContain("Breakdown");
		expect(svg).toContain("Retained calls only");
		expect(svg).toContain("n/a");
		await renderStatsPng(p);
		p.subject.current.context[1].window = null;
		svg = discordStatsSvg(p).svg;
		expect(svg).toContain("Window occupancy: n/a");
		p.subject.publishWorkflow = false;
		svg = discordStatsSvg(p).svg;
		expect(svg).not.toContain("Retained calls only");
	});
	test("missing and recorded zero stay distinct with no infinite delta", async () => {
		const p = payload();
		if (p.subject.current.usage) p.subject.current.usage.totalTokens = 0;
		let svg = discordStatsSvg(p).svg;
		expect(svg).toContain(">0</text>");
		expect(svg).toContain("n/a vs previous period");
		p.subject.current.usage = null;
		svg = discordStatsSvg(p).svg;
		expect(svg).toContain(">n/a</text>");
		expect(svg).not.toContain("Infinity");
		await renderStatsPng(p);
	});
	test("authenticates raw bytes and rejects expiry, forged body, schema and limits before rasterizing", async () => {
		const body = JSON.stringify(payload()),
			render = vi.fn(renderStatsPng);
		expect(
			(await handleDiscordRender(request(body), { ...options, render })).status,
		).toBe(200);
		const calls = render.mock.calls.length;
		expect(
			(
				await handleDiscordRender(request(body, "0".repeat(64)), {
					...options,
					render,
				})
			).status,
		).toBe(401);
		expect(
			(
				await handleDiscordRender(request(body), {
					...options,
					now: Number(timestamp) + 60001,
					render,
				})
			).status,
		).toBe(401);
		expect(
			(
				await handleDiscordRender(
					request(`${body} `, renderSignature(secret, timestamp, body)),
					{ ...options, render },
				)
			).status,
		).toBe(401);
		expect(
			(await handleDiscordRender(request("{}"), { ...options, render })).status,
		).toBe(400);
		expect(
			(
				await handleDiscordRender(request("x".repeat(RENDER_BODY_LIMIT + 1)), {
					...options,
					render,
				})
			).status,
		).toBe(413);
		expect(render.mock.calls.length).toBe(calls);
		const response = await handleDiscordRender(request(body), {
			...options,
			render: async () => {
				throw new Error("internal");
			},
		});
		expect(response.status).toBe(500);
		expect(await response.text()).not.toContain("internal");
		expect(response.headers.get("cache-control")).toBe("no-store");
	});
	test("bounds concurrent work and releases slots on failure", async () => {
		let done!: () => void;
		const wait = new Promise<void>((r) => {
			done = r;
		});
		const render = async () => {
			await wait;
			throw new Error("failed");
		};
		const body = JSON.stringify(payload());
		const first = handleDiscordRender(request(body), { ...options, render }),
			second = handleDiscordRender(request(body), { ...options, render });
		await new Promise((r) => setTimeout(r, 10));
		expect((await handleDiscordRender(request(body), options)).status).toBe(
			503,
		);
		done();
		await Promise.all([first, second]);
		expect((await handleDiscordRender(request(body), options)).status).toBe(
			200,
		);
	});
	test("loads real allowed icons and falls back on failures without following redirects", async () => {
		const p = payload("harness");
		p.subject.icons[0].iconUrl = "https://storage.example/icon";
		p.subject.subscriptions.rows[0].iconUrl = "http://127.0.0.1/private";
		const png = await sharp({
			create: { width: 4, height: 4, channels: 3, background: "#ff0000" },
		})
			.png()
			.toBuffer();
		const fetcher = vi.fn(
			async (_input: string | URL | Request, _init?: RequestInit) =>
				new Response(new Uint8Array(png)),
		);
		const images = await loadRenderIcons(
			p,
			["https://storage.example"],
			fetcher,
		);
		expect(fetcher).toHaveBeenCalledTimes(1);
		expect(fetcher.mock.calls[0][1]?.redirect).toBe("error");
		expect(images.size).toBe(1);
		expect(discordStatsSvg(p, images).svg).toContain("data:image/png;base64,");
		const broken = await loadRenderIcons(
			p,
			["https://storage.example"],
			async () => new Response("bad"),
		);
		expect(broken.size).toBe(0);
	});
});
