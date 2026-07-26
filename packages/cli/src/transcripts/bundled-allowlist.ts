// The bundled curated allowlist — the fallback copy for `/api/sync-config`.
//
// Wayfinder ticket #37 (map #29), decision 4 of the wire-format grilling #33.
//
// WHAT BELONGS HERE, AND WHY IT IS SHORT
// These four classes of name are user-chosen. A Skill called `acme-q3-pricing`,
// an MCP server called `internal-billing`, a subagent called `client-migration`
// — each is a real leak, and none of them is distinguishable from a public name
// by shape.
//
// THE BAR (grilling #42): a name qualifies if the STRING carries no private
// information no matter who typed it. That is a property of the string, not of
// the user and not of the artifact.
//
// The bar is deliberately NOT "the name identifies a public artifact, so
// publishing it reveals nothing the user hasn't already published". That was the
// original wording and it is wrong: `stripe` is on this list, and publishing it
// plainly does reveal something the user never published — that they use Stripe.
// It cannot be the harm, because revealing what you use is the entire product.
// The harm is narrower: strings drawn from the user's private vocabulary, which
// leak a relationship (an employer, a client, a codename) rather than a
// preference. `stripe` and `filesystem` are safe even for someone who named
// their own server that by coincidence.
//
// Three sources meet that bar:
//   1. Claude Code's own built-in subagent types and slash commands (vendor-
//      assigned, same class as a built-in tool name).
//   2. Skills that ship with Claude Code itself.
//   3. MCP servers with a public, documented, first-party endpoint.
//
// WHY THIS LIST DOES NOT NEED TO BE LONG (#42 decision 1)
// It is no longer the only road to publishing a name. The approve gate offers
// every kept-private name as an explicit, default-off tick, and the tick set
// comes back down with the rest of the sync config. This list only exists to
// spare a user from ticking boxes nobody would think twice about — so it can
// stay strict, and every user-chosen name goes through the person who knows
// whether it is a secret.
//
// The author's own `alp-river:*` plugin is deliberately NOT seeded, even though
// it is genuinely published. This list is GLOBAL: seeding it would publish those
// names for every user who installs the plugin without any of them ticking
// anything, and an author adding their own names to the default everyone else
// inherits is what would make the list untrustworthy for every other entry.
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
 * is kept private, which is the correct direction to fail.
 *
 * ONE normalization applies first (#42 decision 5): a server provided by a
 * plugin is observed as `plugin_<plugin>_<server>`, a string Claude Code
 * generates rather than one the user typed. Strip that wrapper before matching,
 * and publish the NORMALIZED name. The safety property is that normalization can
 * only ever emit a string already on this list — a non-matching inner segment
 * emits nothing and the raw name falls through to the gate's review list — so a
 * bug here is bounded by an already-vetted set. If the upstream convention
 * changes, matching reverts to keeping names private: a fail-safe regression.
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
