export const HARNESS_LABELS: Record<string, string> = {
	"claude-code": "Claude Code",
	codex: "Codex",
	cursor: "Cursor",
	"grok-build": "Grok Build",
	opencode: "opencode",
	"pi-mono": "Pi",
};

/** The display name of a harness id, the same one every row on the page uses. */
export function harnessLabel(name: string): string {
	return HARNESS_LABELS[name] ?? name;
}
