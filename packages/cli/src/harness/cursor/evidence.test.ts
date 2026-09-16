import { describe, expect, it } from "vitest";
import { apiContribution } from "./account.js";
import {
	localContributions,
	messageTimes,
	reconcile,
	slimSession,
	tokenEvidence,
} from "./evidence.js";

import { AT, session } from "./fixtures.js";

describe("Cursor evidence", () => {
	it("dates untimed messages from a large account history without overflowing", () => {
		const s = session({ createdAtSource: "epoch-unknown" });
		s.messages = s.messages.map((m) => ({ ...m, timestampSource: "unknown" }));
		const api = Array.from({ length: 308_140 }, (_, i) => ({
			session: s.id,
			tsMs: AT + (i % 2 === 0 ? 3000 : 0),
			model: "auto",
			buckets: {},
			source: "api" as const,
		}));
		expect(messageTimes(s, api)).toEqual([AT + 1000, AT + 2000]);
	});

	it("keeps explicit zero and records context/dry-run provenance without inventing output", () => {
		expect(
			tokenEvidence({
				tokenCount: { inputTokens: 0, outputTokens: 0 },
				contextWindowStatusAtCreation: { tokensUsed: 500 },
			}),
		).toMatchObject({
			input: 0,
			output: 0,
			inputSource: "reported",
			outputSource: "reported",
		});
		expect(
			tokenEvidence({ contextWindowStatusAtCreation: { tokensUsed: 500 } }),
		).toMatchObject({ input: 500, output: undefined, inputSource: "context" });
		expect(
			tokenEvidence({
				promptDryRunInfo: JSON.stringify({
					fullConversationTokenCount: { numTokens: 400 },
				}),
			}),
		).toMatchObject({ input: 400, inputSource: "dry-run" });
	});
	it("estimates missing output independently and never adds text to a recorded bucket", () => {
		const s = session();
		const context = new Map([
			[
				"reply",
				tokenEvidence({ contextWindowStatusAtCreation: { tokensUsed: 1000 } }),
			],
		]);
		expect(
			localContributions({ session: s, tokens: context })[0].buckets,
		).toMatchObject({ input: 1000, output: 2, outputSource: "text" });
		context.set(
			"reply",
			tokenEvidence({ tokenCount: { inputTokens: 100, outputTokens: 0 } }),
		);
		expect(
			localContributions({ session: s, tokens: context })[0].buckets,
		).toMatchObject({ input: 100, output: 0 });
	});
	it("replaces the overlapping conversation/day with API totals and keeps other conversations", () => {
		const local = localContributions({ session: session(), tokens: new Map() });
		const other = localContributions({
			session: session({ id: "other" }),
			tokens: new Map(),
		});
		const api = apiContribution({
			conversationId: "local-session",
			timestamp: AT,
			model: "auto",
			tokenUsage: { inputTokens: 800 },
		});
		if (!api) throw new Error("Expected fixture contribution");
		expect(reconcile([...local, ...other], [api])).toEqual([...other, api]);
		expect(api.buckets.output).toBeUndefined();
		expect(api.model).toBe("auto");
	});
	it("excludes absent, cloud and background-composer identities", () => {
		for (const event of [
			{},
			{ conversationId: "x", cloudAgentId: "cloud" },
			{ conversationId: "bc-x" },
		])
			expect(apiContribution(event)).toBeNull();
	});
	it("interpolates untimed records between real anchors across UTC midnight", () => {
		const s = session({
			createdAtSource: "epoch-unknown",
			metadata: undefined,
		});
		s.messages = [
			s.messages[0],
			{ ...s.messages[1], id: "middle", timestampSource: "inferred-previous" },
			s.messages[1],
		];
		s.messages[0].timestamp = "2026-09-09T23:59:58Z";
		s.messages[2].timestamp = "2026-09-10T00:00:02Z";
		expect(messageTimes(s)).toEqual([
			Date.parse("2026-09-09T23:59:58Z"),
			Date.parse("2026-09-10T00:00:00Z"),
			Date.parse("2026-09-10T00:00:02Z"),
		]);
	});
	it("never uses mtime or scan time for an undated transcript", () => {
		const s = session({ createdAtSource: "epoch-unknown" });
		s.messages = s.messages.map((m) => ({ ...m, timestampSource: "unknown" }));
		expect(messageTimes(s)).toEqual([null, null]);
		expect(localContributions({ session: s, tokens: new Map() })).toEqual([]);
		s.createdAtSource = "store-meta";
		expect(messageTimes(s)).toEqual([AT, AT]);
	});
});

describe("slimSession", () => {
	it("keeps what the scan reads and drops text, thinking, results and file bodies", () => {
		const slim = slimSession({
			id: "s",
			workspace: "/p",
			canonicalWorkspacePath: "/p",
			timestamp: new Date(AT).toISOString(),
			createdAtSource: "composer-metadata",
			lastUpdatedAtSource: "composer-metadata",
			resolutionState: "complete",
			messageCount: 2,
			metadata: { cursorVersion: "1.0", lastModified: "2026-09-10T12:00:01Z" },
			usage: { totalInputTokens: 5 },
			messages: [
				{
					id: "u",
					role: "user",
					content: "x".repeat(4000),
					timestamp: new Date(AT).toISOString(),
					timestampSource: "composer-created-at",
				},
				{
					id: "a",
					identityOrigin: "composer-native",
					parentMessageId: "u",
					isSidechain: true,
					role: "assistant",
					content: "y".repeat(9),
					thinking: "z".repeat(4000),
					model: "claude-sonnet-4-6",
					timestamp: new Date(AT + 1000).toISOString(),
					timestampSource: "composer-timing",
					metadata: { corrupted: true, bubbleType: 2 },
					toolCalls: [
						{
							id: "t",
							identityOrigin: "source-native",
							name: "write_file",
							status: "completed",
							params: { path: "a.ts", contents: "w".repeat(4000) },
							result: "r".repeat(4000),
						},
						{
							name: "run_terminal_cmd",
							status: "completed",
							params: { command: "pnpm test", explanation: "long" },
						},
					],
				},
			],
		});
		expect(slim).toEqual({
			id: "s",
			timestamp: new Date(AT).toISOString(),
			createdAtSource: "composer-metadata",
			lastUpdatedAtSource: "composer-metadata",
			resolutionState: "complete",
			canonicalWorkspacePath: "/p",
			metadata: { cursorVersion: "1.0", lastModified: "2026-09-10T12:00:01Z" },
			messages: [
				{
					id: "u",
					role: "user",
					contentLength: 4000,
					timestamp: new Date(AT).toISOString(),
					timestampSource: "composer-created-at",
				},
				{
					id: "a",
					identityOrigin: "composer-native",
					parentMessageId: "u",
					isSidechain: true,
					role: "assistant",
					contentLength: 9,
					model: "claude-sonnet-4-6",
					timestamp: new Date(AT + 1000).toISOString(),
					timestampSource: "composer-timing",
					metadata: { corrupted: true },
					toolCalls: [
						{ id: "t", identityOrigin: "source-native", name: "write_file" },
						{ name: "run_terminal_cmd", params: { command: "pnpm test" } },
					],
				},
			],
		});
		expect(JSON.stringify(slim).length).toBeLessThan(1000);
		expect(
			localContributions({ session: slim, tokens: new Map() }).map(
				(c) => c.buckets,
			),
		).toEqual([
			{ input: 1000, inputSource: "text", output: 3, outputSource: "text" },
		]);
	});
});
