// The bundled curated allowlist — the fallback copy for `/api/sync-config`.
//
// Wayfinder ticket #37 (map #29), decision 4 of the wire-format grilling #33.
//
// WHAT BELONGS HERE, AND WHY IT IS SHORT
// These four classes of name are user-chosen. A Skill called `acme-q3-pricing`,
// an MCP server called `internal-billing`, a subagent called `client-migration`
// — each is a real leak, and none of them is distinguishable from a public name
// by shape. So the bar for an entry is not "probably harmless": it is that the
// name identifies a PUBLIC artifact, so that publishing it reveals nothing the
// user hasn't already published themselves.
//
// Three sources meet that bar:
//   1. Claude Code's own built-in subagent types and slash commands (vendor-
//      assigned, same class as a built-in tool name).
//   2. Skills that ship with Claude Code itself.
//   3. MCP servers with a public, documented, first-party endpoint.
//
// Everything else — including the author's own `alp-river:*` plugin, which
// dominates the owner's corpus — is withheld until someone curates it in. That
// is the intended cost of decision 2, not an oversight: the owner's first
// snapshot will show a handful of names plus withheld counts.
//
// `/api/sync-config` (ticket #38) serves the AUTHORITATIVE list. This copy only
// covers the case where that endpoint can't be reached, which for an installed
// user is permanent if the plugin never auto-updates. Growing the curated list
// is server-side work; adding entries here only helps the offline case.

import type { CuratedAllowlist } from "./allowlist.js";

/** Claude Code's own subagent types. Vendor-assigned, not user-chosen. */
const BUILTIN_SUBAGENTS = [
	"(default)",
	"claude",
	"claude-code-guide",
	"Explore",
	"fork",
	"general-purpose",
	"Plan",
	"statusline-setup",
] as const;

/** Skills bundled with Claude Code. */
const BUILTIN_SKILLS = [
	"artifact-capabilities",
	"artifact-design",
	"claude-api",
	"code-review",
	"codebase-design",
	"dataviz",
	"diagnosing-bugs",
	"domain-modeling",
	"fewer-permission-prompts",
	"grilling",
	"init",
	"keybindings-help",
	"loop",
	"prototype",
	"research",
	"review",
	"run",
	"schedule",
	"security-review",
	"simplify",
	"tdd",
	"update-config",
] as const;

/** Claude Code's own slash commands. */
const BUILTIN_SLASH_COMMANDS = [
	"add-dir",
	"agents",
	"bug",
	"clear",
	"compact",
	"config",
	"context",
	"cost",
	"doctor",
	"effort",
	"exit",
	"export",
	"fast",
	"help",
	"hooks",
	"ide",
	"init",
	"login",
	"logout",
	"mcp",
	"memory",
	"model",
	"output-style",
	"permissions",
	"plugin",
	"privacy-settings",
	"release-notes",
	"resume",
	"review",
	"rewind",
	"security-review",
	"status",
	"statusline",
	"terminal-setup",
	"todos",
	"upgrade",
	"usage",
	"vim",
	"workflows",
] as const;

/**
 * MCP servers with a public first-party endpoint.
 *
 * Matched against the server segment the analyzer parses out of an
 * `mcp__<server>__<tool>` name, which is the LOCAL alias the user configured —
 * so this only fires when the user kept the conventional name. A renamed server
 * is withheld, which is the correct direction to fail.
 */
const PUBLIC_MCP_SERVERS = [
	"chrome-devtools",
	"context7",
	"deepwiki",
	"figma",
	"filesystem",
	"git",
	"github",
	"huggingface",
	"ide",
	"linear",
	"notion",
	"playwright",
	"puppeteer",
	"sentry",
	"slack",
	"stripe",
] as const;

export const BUNDLED_CURATED_ALLOWLIST: CuratedAllowlist = {
	mcpServers: PUBLIC_MCP_SERVERS,
	skills: BUILTIN_SKILLS,
	subagents: BUILTIN_SUBAGENTS,
	slashCommands: BUILTIN_SLASH_COMMANDS,
};
