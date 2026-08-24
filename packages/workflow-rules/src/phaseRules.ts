// The versioned phase classifier: `phase-rules/v1`.
//
// Wayfinder ticket #214 (map #200), the shipping rule set proven in ticket
// #196 (`prototypes/phase-extraction/extract.mjs`, PR #197) and specced in
// docs/specs/workflow-surface.md ("Phases"). Ported here as the production
// rule core - the harness reducers (ticket #219) call `classifyEvent` and
// `deriveSessionPhases` over their own reduced event lists; this file makes
// no assumption about how those events were read off disk.
//
// First match wins. A rule-set bump reclassifies old sessions from local raw
// records at the next sync (spec); a session whose raw records are gone
// keeps its old aggregate tagged with the rule id it was computed under.

import type { HarnessEvent, HarnessName, PhaseId } from "./types.js";
import { PHASES } from "./types.js";

export const PHASE_RULES_V1 = "phase-rules/v1";

/**
 * The gate a harness's playbook must clear to ship (owner decision, #196,
 * 2026-08-22): 20% or less of a harness's measured time left unclassified.
 * Per harness, so one unreadable harness (opencode measured 28%) holds back
 * only its own playbook.
 */
export const UNKNOWN_GATE = 0.2;

export type PhaseClassification = { ruleId: string; phase: PhaseId };

/**
 * Handoff markers are per adapter, not one global list (#196): Claude Code
 * records `AskUserQuestion` and `ExitPlanMode`, Codex records
 * `request_user_input`, opencode records `question`. Pi records no tool
 * calls at all, so it has none to name.
 */
export const HANDOFF_MARKERS: Record<HarnessName, readonly string[]> = {
	"claude-code": [
		"AskUserQuestion",
		"ExitPlanMode",
		"mcp__curia__ask_human",
		"mcp__curia__request_review",
	],
	codex: ["request_user_input"],
	opencode: ["question"],
	"pi-mono": [],
};

/** Every handoff marker across every adapter, for classifying an event whose harness isn't known yet. */
const ALL_HANDOFF_MARKERS = new Set(
	Object.values(HANDOFF_MARKERS).flat() as string[],
);

/**
 * Tools that surface a handoff's result rather than opening one - the curia
 * MCP layer sits above every harness, so these spellings don't vary by adapter.
 */
const HANDOFF_SURFACE_TOOLS = [
	"mcp__curia__open_pull_request",
	"mcp__curia__publish_preview",
	"mcp__curia__report_result",
	"mcp__curia__notify",
];

const SCOUT_TOOLS = [
	"Read",
	"Grep",
	"Glob",
	"WebFetch",
	"WebSearch",
	"ToolSearch",
	// cross-harness spellings of the same read/search tools
	"read",
	"grep",
	"glob",
	"list",
	"ls",
	"webfetch",
	"websearch",
	"web_search",
	"tool_search",
	"codebase_search",
	"find",
];

const EDIT_TOOLS = [
	"Edit",
	"Write",
	"NotebookEdit",
	// cross-harness spellings
	"edit",
	"write",
	"patch",
	"multiedit",
	"apply_patch",
];

const REVIEW_SKILLS = ["code-review", "security-review", "review"];
const SCOUT_AGENTS = ["Explore", "Plan", "research"];
const SHELL_TOOLS = ["Bash", "bash", "shell", "local_shell", "exec_command"];
const SKILL_TOOLS = ["Skill", "skill"];
const AGENT_TOOLS = ["Agent", "Task", "task", "agent"];

/**
 * A todo/task tool carries no information about the work itself - the
 * neighbor data decided this (#196): against a base rate of scout 72% / build
 * 23%, `TaskCreate` sits at build 1%, `TaskStop` at 4%, `Monitor` at 7%.
 * Filing the whole family as build added 4 points on the strength of tools
 * that build nothing, so it inherits the phase of the event before it.
 */
const BOOKKEEPING_TOOLS = [
	"TaskCreate",
	"TaskUpdate",
	"TaskStop",
	"TaskOutput",
	"todowrite",
	"TodoWrite",
	"Monitor",
	"SendUserFile",
	"SendMessage",
	"ListAgents",
];

function isShell(tool: string): boolean {
	return SHELL_TOOLS.includes(tool);
}

const skillLeaf = (arg: string): string => arg.split(":").pop() ?? arg;

// ---------------------------------------------------------------------------
// Chain-segment command matching (#196, structural defect 1: 85% of recorded
// shell commands hold a chain or a pipe, so a whole-string prefix match reads
// only the first command and misses the rest).
// ---------------------------------------------------------------------------

/** Splits a shell command into its `&&`/`||`/`;`/`|` segments, normalized. */
export function chainSegments(arg: string): string[] {
	return arg
		.split(/(?:&&|\|\||;|\|)/)
		.map((s) =>
			s
				.trim()
				.replace(/^(?:\w+=\S*\s+)+/, "")
				.replace(/^(?:cd\s+\S+\s*)$/, "")
				// `git -C <path> log` is the same rule as `git log`. 650 real uses
				// matched nothing before this normalization (#196).
				.replace(/^git\s+-C\s+\S+\s+/, "git "),
		)
		.filter(Boolean);
}

function cmdIs(seg: string, heads: readonly string[]): boolean {
	for (const h of heads) if (seg === h || seg.startsWith(`${h} `)) return true;
	return false;
}

// Head lists measured off the owner's real history, not guessed (#196,
// structural defect 2: the first draft's guessed heads left verify at 0%
// across 464 sessions).
const TEST_HEADS = [
	"pnpm test",
	"vitest",
	"tsc",
	"biome",
	"pnpm build",
	"pnpm lint",
	"pnpm typecheck",
	"npm test",
	"npm run test",
	"pnpm vitest",
	"npx vitest",
	"npx tsc",
	"npx biome",
	"pnpm exec",
	"pytest",
	"cargo test",
	"go test",
	"node --test",
	"make test",
	"pnpm check",
	"npm run build",
	"npm run lint",
];
const PUBLISH_HEADS = [
	"git push",
	"gh pr create",
	"gh pr merge",
	"npm publish",
	"pnpm publish",
	"gh release",
];
const CHANGE_HEADS = [
	"git add",
	"git commit",
	"mkdir",
	"cp",
	"mv",
	"rm",
	"touch",
	"sed",
	"pnpm add",
	"npm install",
	"git checkout",
	"git restore",
	"git stash",
	"git mv",
	"git rm",
	"git rebase",
	"git merge",
	"git cherry-pick",
	"git init",
	"git branch",
	"git worktree",
	"pnpm install",
	"pnpm remove",
	"npm i",
	"npm ci",
	"yarn add",
	"chmod",
	"ln",
	"tee",
	"echo",
	"printf",
	"npx convex",
	"pnpm convex",
	"pnpm dlx",
	"npx create",
];
const READ_HEADS = [
	"ls",
	"cat",
	"head",
	"tail",
	"wc",
	"grep",
	"rg",
	"find",
	"git log",
	"git show",
	"git diff",
	"git status",
	"gh issue view",
	"gh issue list",
	"gh pr view",
	"gh pr list",
	"curl",
	"pwd",
	"which",
	"whoami",
	"echo $",
	"env",
	"printenv",
	"node --version",
	"node -v",
	"pnpm --version",
	"df",
	"du",
	"ps",
	"top",
	"file",
	"stat",
	"tree",
	"jq",
	"sort",
	"uniq",
	"cut",
	"awk",
	"diff",
	"gh api",
	"gh run",
	"gh workflow",
	"gh search",
	"gh issue",
	"gh pr",
	"git remote",
	"git fetch",
	"git ls-files",
	"git blame",
	"git describe",
	"git rev-parse",
	"sqlite3",
	"date",
	"uname",
	"man",
	"history",
	"type",
	"nl",
	"strings",
	"pgrep",
	"basename",
	"dirname",
	"realpath",
];

/**
 * Flag-aware rules for dual-use commands (#196, structural defect 3): the
 * head alone files these wrong. 2,374 of 2,733 `sed` calls are `sed -n`, a
 * read filed as a change; only 199 of 7,758 `echo` calls redirect to a file.
 * These run BEFORE the head lists.
 */
const DUAL_USE_RULES: ReadonlyArray<{
	id: string;
	match: RegExp;
	build: RegExp;
}> = [
	{ id: "sed", match: /^sed\b/, build: /^sed\s+(-[a-zA-Z]*i|--in-place)\b/ },
	{ id: "echo", match: /^(echo|printf)\b/, build: />>?\s*\S/ },
	{ id: "cat", match: /^cat\b/, build: /^cat\s*(>>?\s*\S|<<)/ },
];

function dualUse(seg: string): PhaseId | null {
	for (const rule of DUAL_USE_RULES) {
		if (!rule.match.test(seg)) continue;
		return rule.build.test(seg) ? "build" : "scout";
	}
	return null;
}

const CHAIN_PHASE_RANK: Record<PhaseId, number> = {
	verify: 4,
	handoff: 3,
	build: 2,
	scout: 1,
	unknown: 0,
};

/**
 * Classifies a full shell command by splitting it into chain segments,
 * classifying each, and letting the strongest phase in the chain win -
 * ordered verify, handoff, build, scout (spec, rule family 2).
 */
function classifyShellChain(arg: string): PhaseId | null {
	let best: PhaseId | null = null;
	for (const seg of chainSegments(arg)) {
		let p = dualUse(seg);
		if (!p) {
			if (cmdIs(seg, TEST_HEADS)) p = "verify";
			else if (cmdIs(seg, PUBLISH_HEADS)) p = "handoff";
			else if (cmdIs(seg, CHANGE_HEADS)) p = "build";
			else if (cmdIs(seg, READ_HEADS)) p = "scout";
		}
		if (p && (!best || CHAIN_PHASE_RANK[p] > CHAIN_PHASE_RANK[best])) best = p;
	}
	return best;
}

// ---------------------------------------------------------------------------
// The rule table. First match wins. A rule with `phase: null` derives its
// phase from `test`'s return value instead of a fixed id.
// ---------------------------------------------------------------------------

type Rule = {
	id: string;
	/** `null` means the phase comes from `test`'s return value. `"@prev"` means "inherit". */
	phase: PhaseId | "@prev" | null;
	test: (tool: string, arg: string) => PhaseId | boolean;
};

const RULES_V1: readonly Rule[] = [
	{
		id: "handoff.surface",
		phase: "handoff",
		test: (t) => HANDOFF_SURFACE_TOOLS.includes(t),
	},
	{
		id: "verify.review-skill",
		phase: "verify",
		test: (t, a) => SKILL_TOOLS.includes(t) && REVIEW_SKILLS.includes(a),
	},
	// Forge stage markers (#166 round 3): named rules where the harness records
	// the skill call, matched on the last path segment so the
	// plugin-namespaced spelling `forge:crossfire` counts too.
	{
		id: "verify.crossfire-skill",
		phase: "verify",
		test: (t, a) => SKILL_TOOLS.includes(t) && skillLeaf(a) === "crossfire",
	},
	{
		id: "build.forge-skill",
		phase: "build",
		test: (t, a) => SKILL_TOOLS.includes(t) && skillLeaf(a) === "forge",
	},
	{
		id: "build.edit-tool",
		phase: "build",
		test: (t) => EDIT_TOOLS.includes(t),
	},
	{
		id: "scout.read-tool",
		phase: "scout",
		test: (t) => SCOUT_TOOLS.includes(t),
	},
	{
		id: "scout.skill-load",
		phase: "scout",
		test: (t) => SKILL_TOOLS.includes(t),
	},
	{
		id: "scout.scout-agent",
		phase: "scout",
		test: (t, a) => AGENT_TOOLS.includes(t) && SCOUT_AGENTS.includes(a),
	},
	// Plan bookkeeping inherits the phase of the event before it (#196).
	// `phase: null` here means "look at prevPhase", signaled via the
	// sentinel below rather than a boolean/PhaseId return.
	{
		id: "inherit.bookkeeping",
		phase: "@prev",
		test: (t) => BOOKKEEPING_TOOLS.includes(t),
	},
	{
		id: "chain-cmd",
		phase: null,
		test: (t, a) => (isShell(t) ? (classifyShellChain(a) ?? false) : false),
	},
	{ id: "unknown.shell", phase: "unknown", test: (t) => isShell(t) },
	{
		id: "unknown.agent",
		phase: "unknown",
		test: (t) => AGENT_TOOLS.includes(t),
	},
	{ id: "unknown.tool", phase: "unknown", test: () => true },
];

const RULE_SETS: Record<string, readonly Rule[]> = {
	[PHASE_RULES_V1]: RULES_V1,
};

/**
 * Classifies one event under the named rule set. `prevPhase` resolves plan
 * bookkeeping's inherited phase (`null` before the first non-bookkeeping
 * event of a session, which classifies as `unknown`).
 */
export function classifyEvent(
	tool: string,
	arg: string,
	prevPhase: PhaseId | null,
	ruleSet: string = PHASE_RULES_V1,
	harness?: HarnessName,
): PhaseClassification {
	const handoffMarkers = harness
		? new Set(HANDOFF_MARKERS[harness])
		: ALL_HANDOFF_MARKERS;
	if (handoffMarkers.has(tool)) {
		return { ruleId: "handoff.blocking-call", phase: "handoff" };
	}
	const rules = RULE_SETS[ruleSet];
	if (!rules) throw new Error(`unknown phase rule set: ${ruleSet}`);
	for (const rule of rules) {
		const res = rule.test(tool, arg);
		if (res === false) continue;
		if (rule.phase === null) {
			// `chain-cmd`: the phase IS the result.
			return { ruleId: `${rule.id}.${res}`, phase: res as PhaseId };
		}
		if (rule.phase === "@prev") {
			return { ruleId: rule.id, phase: prevPhase ?? "unknown" };
		}
		return { ruleId: rule.id, phase: rule.phase };
	}
	return { ruleId: "unknown.tool", phase: "unknown" };
}

// ---------------------------------------------------------------------------
// Session time attribution: each event owns the gap to the next event,
// capped at 5 minutes. The tail (after the last event) is capped at 60s.
// The wait at a blocking handoff call renders as a striped waiting slice.
// ---------------------------------------------------------------------------

const CAP_SEC = 300;
const TAIL_SEC = 60;

/** Residual families for the unknown bucket, weighed by time before any rule is proposed for them (#196). */
export type ResidualFamily =
	| "mcp server"
	| "harness bookkeeping"
	| "delegation"
	| "other harness tool"
	| "interpreter run"
	| "remote or container"
	| "shell construct"
	| "other shell command";

const INTERPRETER_HEADS = [
	"python3",
	"python",
	"node",
	"bun",
	"deno",
	"ruby",
	"perl",
	"php",
	"tsx",
];
const REMOTE_HEADS = ["ssh", "tmux", "docker", "scp", "rsync", "kubectl"];

function residualFamily(tool: string, arg: string): ResidualFamily {
	if (tool.startsWith("mcp__") || /chrome-devtools/.test(tool))
		return "mcp server";
	if (BOOKKEEPING_TOOLS.includes(tool)) return "harness bookkeeping";
	if (AGENT_TOOLS.includes(tool)) return "delegation";
	if (!isShell(tool)) return "other harness tool";
	const seg = chainSegments(arg)[0] ?? arg;
	const head = (seg.trim().split(/\s+/)[0] ?? "").split("/").pop() ?? "";
	if (INTERPRETER_HEADS.includes(head)) return "interpreter run";
	if (REMOTE_HEADS.includes(head)) return "remote or container";
	if (/^(for|while|until|if|timeout|sleep|true|bash|sh|zsh)$/.test(head))
		return "shell construct";
	return "other shell command";
}

export type SessionPhaseDerivation = {
	/** Seconds of measured time per phase, including the visible `unknown` bucket. */
	phaseSec: Record<PhaseId, number>;
	/** Event counts per phase. */
	phaseEvents: Record<PhaseId, number>;
	/** Seconds spent waiting at a blocking handoff call (a striped slice, spec). */
	waitingSec: number;
	/** Seconds spent idle between events for any other reason, above the cap. */
	idleSec: number;
	/** Rule id -> event count, for auditing which rule fired how often. */
	ruleTally: Record<string, number>;
	/** Unknown seconds by residual family, for weighing the next rule proposal. */
	residualSec: Partial<Record<ResidualFamily, number>>;
	ruleSet: string;
};

function emptyPhaseRecord(): Record<PhaseId, number> {
	return { scout: 0, build: 0, verify: 0, handoff: 0, unknown: 0 };
}

/**
 * Derives one session's phase mix from its raw events. Each event owns the
 * gap to the next event (capped at 5 minutes); the last event owns a fixed
 * 60s tail. A gap following a blocking handoff call counts as waiting rather
 * than idle.
 */
export function deriveSessionPhases(
	events: readonly HarnessEvent[],
	ruleSet: string = PHASE_RULES_V1,
	harness?: HarnessName,
): SessionPhaseDerivation {
	const phaseSec = emptyPhaseRecord();
	const phaseEvents = emptyPhaseRecord();
	const ruleTally: Record<string, number> = {};
	const residualSec: Partial<Record<ResidualFamily, number>> = {};
	let waitingSec = 0;
	let idleSec = 0;
	let prevPhase: PhaseId | null = null;

	for (let i = 0; i < events.length; i++) {
		const event = events[i];
		if (!event) continue;
		const [ts, tool, arg] = event;
		const next = events[i + 1];
		const gapSec = next ? (next[0] - ts) / 1000 : TAIL_SEC;
		const ownSec = Math.min(gapSec, CAP_SEC);

		const { ruleId, phase } = classifyEvent(
			tool,
			arg,
			prevPhase,
			ruleSet,
			harness,
		);
		if (phase !== "unknown") prevPhase = phase;
		ruleTally[ruleId] = (ruleTally[ruleId] ?? 0) + 1;
		phaseSec[phase] += ownSec;
		phaseEvents[phase] += 1;

		if (phase === "unknown") {
			const family = residualFamily(tool, arg);
			residualSec[family] = (residualSec[family] ?? 0) + ownSec;
		}

		const overflow = gapSec - ownSec;
		if (overflow > 0) {
			const handoffMarkers = harness
				? new Set(HANDOFF_MARKERS[harness])
				: ALL_HANDOFF_MARKERS;
			if (handoffMarkers.has(tool)) waitingSec += overflow;
			else idleSec += overflow;
		}
	}

	return {
		phaseSec,
		phaseEvents,
		waitingSec,
		idleSec,
		ruleTally,
		residualSec,
		ruleSet,
	};
}

/** Share of a session's measured (non-unknown) attribution that landed in `unknown`, 0..1. */
export function unknownShare(derivation: SessionPhaseDerivation): number {
	const total = PHASES.reduce((sum, p) => sum + derivation.phaseSec[p], 0);
	return total > 0 ? derivation.phaseSec.unknown / total : 0;
}
