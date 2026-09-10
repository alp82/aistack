import { describe, expect, it } from "vitest";
import { apiContribution } from "./account.js";
import {
	localContributions,
	messageTimes,
	reconcile,
	tokenEvidence,
} from "./evidence.js";

import { AT, session } from "./fixtures.js";

describe("Cursor evidence", () => {
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
