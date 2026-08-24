import { describe, expect, it } from "vitest";
import {
	chainSegments,
	classifyEvent,
	deriveSessionPhases,
	HANDOFF_MARKERS,
	PHASE_RULES_V1,
	unknownShare,
} from "./phaseRules.js";
import type { HarnessEvent } from "./types.js";

const classify = (tool: string, arg = "") =>
	classifyEvent(tool, arg, null, PHASE_RULES_V1);

describe("classifyEvent: tool identity markers", () => {
	it("files a read tool as scout", () => {
		expect(classify("Read").phase).toBe("scout");
		expect(classify("Grep").phase).toBe("scout");
	});

	it("files an edit tool as build", () => {
		expect(classify("Edit").phase).toBe("build");
		expect(classify("Write").phase).toBe("build");
	});

	it("files a review skill as verify", () => {
		expect(classify("Skill", "security-review").phase).toBe("verify");
		expect(classify("skill", "code-review").phase).toBe("verify");
	});

	it("files a plain skill load as scout", () => {
		expect(classify("Skill", "some-other-skill").phase).toBe("scout");
	});

	it("files forge as build and crossfire as verify, bare or plugin-namespaced", () => {
		expect(classify("Skill", "forge").phase).toBe("build");
		expect(classify("Skill", "myplugin:forge").phase).toBe("build");
		expect(classify("Skill", "crossfire").phase).toBe("verify");
		expect(classify("Skill", "forge:crossfire").phase).toBe("verify");
	});

	it("files a scout agent as scout, other agents as unknown", () => {
		expect(classify("Agent", "Explore").phase).toBe("scout");
		expect(classify("Task", "research").phase).toBe("scout");
		expect(classify("Agent", "general-purpose").phase).toBe("unknown");
	});
});

describe("classifyEvent: handoff", () => {
	it("classifies each adapter's own blocking-ask spelling", () => {
		expect(classify("AskUserQuestion").phase).toBe("handoff");
		expect(classify("ExitPlanMode").phase).toBe("handoff");
		expect(classify("request_user_input").phase).toBe("handoff");
		expect(classify("question").phase).toBe("handoff");
		expect(classify("mcp__curia__ask_human").phase).toBe("handoff");
	});

	it("classifies the handoff-surface tools as handoff", () => {
		expect(classify("mcp__curia__open_pull_request").phase).toBe("handoff");
		expect(classify("mcp__curia__publish_preview").phase).toBe("handoff");
		expect(classify("mcp__curia__report_result").phase).toBe("handoff");
	});

	it("keeps handoff markers separate per harness", () => {
		expect(HANDOFF_MARKERS["claude-code"]).toContain("AskUserQuestion");
		expect(HANDOFF_MARKERS.codex).not.toContain("AskUserQuestion");
		expect(HANDOFF_MARKERS.codex).toContain("request_user_input");
		expect(HANDOFF_MARKERS.opencode).toEqual(["question"]);
		expect(HANDOFF_MARKERS["pi-mono"]).toEqual([]);
	});

	it("does not apply another adapter's handoff marker", () => {
		const result = deriveSessionPhases(
			[[0, "AskUserQuestion", ""]],
			PHASE_RULES_V1,
			"codex",
		);
		expect(result.phaseEvents.handoff).toBe(0);
		expect(result.phaseEvents.unknown).toBe(1);
	});
});

describe("classifyEvent: chain-segment shell commands", () => {
	it("splits a chained command and lets the strongest segment win", () => {
		// scout (cat) then build (git commit): build wins.
		expect(classify("Bash", "cat file.ts && git commit -m x").phase).toBe(
			"build",
		);
		// build (git add) then verify (pnpm test): verify wins.
		expect(classify("Bash", "git add -A && pnpm test").phase).toBe("verify");
	});

	it("strips a leading env assignment and a bare cd before matching", () => {
		expect(classify("Bash", "cd /repo && FOO=1 pnpm test").phase).toBe(
			"verify",
		);
	});

	it("normalizes git -C <path> the same as git <cmd>", () => {
		expect(classify("Bash", "git -C /repo log").phase).toBe("scout");
	});

	it("uses heads measured off real history, not the originally guessed ones", () => {
		// #196: npx vitest, node --test, npx tsc, npx biome, npm test were the
		// missing heads that put verify at 0% under the first draft.
		for (const cmd of [
			"npx vitest",
			"node --test",
			"npx tsc",
			"npx biome",
			"npm test",
		]) {
			expect(classify("Bash", cmd).phase).toBe("verify");
		}
	});

	it("classifies exec_command the same as Bash (Codex's shell spelling)", () => {
		expect(classify("exec_command", "pnpm test").phase).toBe("verify");
	});
});

describe("classifyEvent: dual-use commands read the flag, not just the head", () => {
	it("files sed -n as scout and sed -i as build", () => {
		expect(classify("Bash", "sed -n '1,5p' file.ts").phase).toBe("scout");
		expect(classify("Bash", "sed -i 's/a/b/' file.ts").phase).toBe("build");
	});

	it("files a redirecting echo as build and a plain echo as scout", () => {
		expect(classify("Bash", "echo hi").phase).toBe("scout");
		expect(classify("Bash", "echo hi >> out.txt").phase).toBe("build");
	});

	it("files cat as scout unless it redirects or heredocs", () => {
		expect(classify("Bash", "cat file.ts").phase).toBe("scout");
		expect(classify("Bash", "cat > file.ts <<'EOF'").phase).toBe("build");
	});
});

describe("classifyEvent: plan bookkeeping inherits the previous phase", () => {
	it("inherits build after an edit, and unknown with no prior phase", () => {
		const afterBuild = classifyEvent("TaskUpdate", "", "build");
		expect(afterBuild.phase).toBe("build");
		expect(afterBuild.ruleId).toBe("inherit.bookkeeping");

		const fresh = classifyEvent("TaskUpdate", "", null);
		expect(fresh.phase).toBe("unknown");
	});
});

describe("classifyEvent: unknown fallback", () => {
	it("files an unrecognized shell command as unknown", () => {
		expect(classify("Bash", "python3 script.py").phase).toBe("unknown");
	});

	it("files an unrecognized tool as unknown", () => {
		expect(classify("mcp__some_server__call", "").phase).toBe("unknown");
	});
});

describe("chainSegments", () => {
	it("splits on &&, ||, ; and |", () => {
		expect(chainSegments("a && b || c ; d | e")).toEqual([
			"a",
			"b",
			"c",
			"d",
			"e",
		]);
	});
});

describe("deriveSessionPhases", () => {
	it("attributes each event the gap to the next, capped, plus a fixed tail", () => {
		const events: HarnessEvent[] = [
			[0, "Read", ""],
			[10_000, "Edit", ""], // 10s gap owned by the Read event
		];
		const d = deriveSessionPhases(events);
		expect(d.phaseSec.scout).toBe(10);
		expect(d.phaseSec.build).toBe(60); // tail
		expect(d.phaseEvents).toEqual({
			scout: 1,
			build: 1,
			verify: 0,
			handoff: 0,
			unknown: 0,
		});
	});

	it("caps a long gap at 5 minutes and books the rest as idle", () => {
		const events: HarnessEvent[] = [
			[0, "Read", ""],
			[20 * 60_000, "Edit", ""], // 20 minute gap
		];
		const d = deriveSessionPhases(events);
		expect(d.phaseSec.scout).toBe(300);
		expect(d.idleSec).toBe(20 * 60 - 300);
		expect(d.waitingSec).toBe(0);
	});

	it("books the overflow after a blocking handoff call as waiting, not idle", () => {
		const events: HarnessEvent[] = [
			[0, "AskUserQuestion", ""],
			[20 * 60_000, "Edit", ""],
		];
		const d = deriveSessionPhases(events);
		expect(d.phaseSec.handoff).toBe(300);
		expect(d.waitingSec).toBe(20 * 60 - 300);
		expect(d.idleSec).toBe(0);
	});

	it("buckets unknown time by residual family", () => {
		const events: HarnessEvent[] = [
			[0, "Bash", "python3 script.py"],
			[1_000, "mcp__some_server__call", ""],
			[2_000, "Agent", "general-purpose"],
			[3_000, "Read", ""],
		];
		const d = deriveSessionPhases(events);
		expect(d.residualSec["interpreter run"]).toBe(1);
		expect(d.residualSec["mcp server"]).toBe(1);
		expect(d.residualSec.delegation).toBe(1);
		expect(d.residualSec["other harness tool"]).toBeUndefined();
	});

	it("tallies which rule fired how often", () => {
		const events: HarnessEvent[] = [
			[0, "Read", ""],
			[1_000, "Read", ""],
			[2_000, "Edit", ""],
		];
		const d = deriveSessionPhases(events);
		expect(d.ruleTally["scout.read-tool"]).toBe(2);
		expect(d.ruleTally["build.edit-tool"]).toBe(1);
	});

	it("returns unknownShare 0 for an event-free session", () => {
		expect(unknownShare(deriveSessionPhases([]))).toBe(0);
	});

	it("computes unknownShare over the full phase mix", () => {
		const events: HarnessEvent[] = [
			[0, "Read", ""], // scout, owns 10s
			[10_000, "python3 x.py", ""], // wrong tool name on purpose - unknown.tool, owns 10s (tail on 1-event? no, 2 more events follow)
			[20_000, "Edit", ""], // build, owns tail 60s
		];
		const d = deriveSessionPhases(events);
		const share = unknownShare(d);
		expect(share).toBeCloseTo(d.phaseSec.unknown / 80, 5);
	});
});
