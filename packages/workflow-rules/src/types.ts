// Shared vocabulary for the measured workflow surface's rule core.
//
// Wayfinder ticket #214 (map #200). Terms follow CONTEXT.md's "Workflow
// surface" section. This package holds the DETERMINISTIC rules only - no I/O,
// no harness-specific file reading (that is ticket #219's local reducers) and
// no server-side fit ranking or rotation state (that is ticket #218).

/** Matches the four `*_HARNESS_NAME` constants in packages/cli/src/harness/*\/adapter.ts. */
export type HarnessName = "claude-code" | "codex" | "opencode" | "pi-mono";

export const HARNESS_NAMES: readonly HarnessName[] = [
	"claude-code",
	"codex",
	"opencode",
	"pi-mono",
];

/**
 * Display label for a coverage tag. Mirrors `harnessLabel` in
 * packages/cli/src/harness/index.ts - kept as a small local copy rather than
 * an import so this package stays dependency-free of the CLI (the web app
 * imports it too, see #217).
 */
export function harnessLabel(name: HarnessName): string {
	switch (name) {
		case "claude-code":
			return "Claude Code";
		case "codex":
			return "Codex";
		case "opencode":
			return "opencode";
		case "pi-mono":
			return "Pi";
	}
}

/**
 * The public phase set (spec: docs/specs/workflow-surface.md, "Phases").
 * Scout is reading and searching before the change, handoff is the exchange
 * at a blocking human gate. `unknown` is a visible fifth bucket, never hidden.
 */
export type PhaseId = "scout" | "build" | "verify" | "handoff" | "unknown";

export const PHASES: readonly PhaseId[] = [
	"scout",
	"build",
	"verify",
	"handoff",
	"unknown",
];

/**
 * One recorded tool call, already reduced to the three fields a phase rule
 * needs: when it happened, which tool fired, and its sanitized argument (a
 * skill or subagent name, or a shell command string). Producing this tuple
 * from a harness's own transcript format is the harness reducer's job
 * (ticket #219) - this package only classifies it.
 */
export type HarnessEvent = readonly [tsMs: number, tool: string, arg: string];
