// Fail-closed name filtering for the measured layer.
//
// Wayfinder ticket #37 (map #29), decisions 2-4 of the wire-format grilling #33.
//
// THE INVERSION THIS FILE EXISTS TO PERFORM
// The prototype's `toolCalls` map was a catch-all: anything that wasn't an
// `mcp__*` tool, a Skill, or an Agent fell THROUGH into it, and from there into
// the payload. That is denylist-shaped — a tool name nobody anticipated
// publishes by default. Here a name publishes only if it matches a known list,
// and everything else is withheld and published as a per-category count.
//
// Two classes of name, two mechanisms:
//   - Built-in Claude Code tool names are VENDOR-assigned and enumerable, so
//     they match a hardcoded literal set (BUILTIN_TOOLS below).
//   - MCP servers / Skills / subagents / slash commands are USER-chosen and can
//     carry a client name, a project codename, or an internal system's name.
//     They match a curated list fetched from aistack, with the bundled copy
//     below as the fallback.
//
// Model ids are exempt from all of this — see decision 3 and payload.ts.
//
// WHY FETCHED AND NOT ONLY BUNDLED (decision 4)
// Third-party marketplace plugin auto-update defaults to OFF, and a
// `plugin.json` whose `version` isn't bumped ships nothing. A bundled-only list
// is, for an installed user, frozen forever — a Skill that becomes public next
// month would never publish. The filtering itself still runs client-side:
// fail-closed only means something if it happens before the send.

import { BUNDLED_CURATED_ALLOWLIST } from "./bundled-allowlist.js";

/**
 * Every built-in tool Claude Code can emit as a `tool_use` block name.
 *
 * Deliberately a literal set and not a pattern: a pattern is a denylist wearing
 * a hat. Grounded in the observed corpus (22 distinct names across 235,961
 * records) plus the documented tool surface, including tools that are deferred
 * or unavailable in most sessions — an unknown-but-real built-in withheld as a
 * count is a small loss; an unknown-and-user-named tool published verbatim is
 * the leak this whole file prevents.
 *
 * `Task` is the pre-rename spelling of `Agent`; the analyzer folds it into
 * `Agent` at ingest, so it is here only to make the set self-documenting.
 */
export const BUILTIN_TOOLS: ReadonlySet<string> = new Set([
	"Agent",
	"Artifact",
	"AskUserQuestion",
	"Bash",
	"BashOutput",
	"CronCreate",
	"CronDelete",
	"CronList",
	"DesignSync",
	"Edit",
	"EndConversation",
	"EnterPlanMode",
	"EnterWorktree",
	"ExitPlanMode",
	"ExitWorktree",
	"Glob",
	"Grep",
	"KillBash",
	"KillShell",
	"ListMcpResourcesTool",
	"LS",
	"Monitor",
	"MultiEdit",
	"NotebookEdit",
	"NotebookRead",
	"PushNotification",
	"Read",
	"ReadMcpResourceDirTool",
	"ReadMcpResourceTool",
	"RemoteTrigger",
	"ReportFindings",
	"ScheduleWakeup",
	"SendMessage",
	"SendUserFile",
	"Skill",
	"SlashCommand",
	"Task",
	"TaskCreate",
	"TaskGet",
	"TaskList",
	"TaskOutput",
	"TaskStop",
	"TaskUpdate",
	"TodoWrite",
	"ToolSearch",
	"WebFetch",
	"WebSearch",
	"Workflow",
	"Write",
]);

/** The four user-chosen atom classes that need the curated list. */
export type CuratedAllowlist = {
	mcpServers: readonly string[];
	skills: readonly string[];
	subagents: readonly string[];
	slashCommands: readonly string[];
};

export type SyncConfig = {
	allowlist: CuratedAllowlist;
	/**
	 * Stack-level cost preference (decision 11). When false the payload omits
	 * cost entirely rather than zeroing it — see payload.ts.
	 */
	publishCost: boolean;
};

/**
 * Used when `/api/sync-config` can't be reached.
 *
 * `publishCost: false` is deliberate. The toggle is a stack-level preference we
 * do not hold locally, and the fail-closed default for a preference we can't
 * read is the one that transmits less. A user whose fetch failed sees cost
 * missing from the gate and can retry; the reverse — publishing cost the stack
 * had opted out of — is not recoverable, because the snapshot is immutable.
 */
export const BUNDLED_SYNC_CONFIG: SyncConfig = {
	allowlist: BUNDLED_CURATED_ALLOWLIST,
	publishCost: false,
};

// ---------------------------------------------------------------------------
// Fetch
// ---------------------------------------------------------------------------

const SYNC_CONFIG_PATH = "/api/sync-config";
const FETCH_TIMEOUT_MS = 5_000;

export type SyncConfigSource = "fetched" | "bundled";

export type LoadedSyncConfig = {
	config: SyncConfig;
	source: SyncConfigSource;
	/** Present when the fetch failed and the bundled copy was used. */
	error?: string;
};

/**
 * A name arriving from the network is no more trusted than one from a
 * transcript. Names are matched by exact equality, so a hostile list can widen
 * what publishes but can never smuggle a wildcard — and the approve gate
 * renders every name that will publish, which is what defuses that residual
 * trust (decision 4). Charset and length are still bounded so a pathological
 * entry can't reach a terminal or a database column.
 */
const CURATED_NAME_RE = /^[A-Za-z0-9][A-Za-z0-9 ._:@/-]{0,63}$/;

function readNameList(v: unknown): string[] {
	if (!Array.isArray(v)) return [];
	const out: string[] = [];
	for (const item of v) {
		if (typeof item === "string" && CURATED_NAME_RE.test(item)) out.push(item);
	}
	return out;
}

function readSyncConfig(raw: unknown): SyncConfig | null {
	if (typeof raw !== "object" || raw === null || Array.isArray(raw))
		return null;
	const obj = raw as Record<string, unknown>;
	const listRaw = obj.allowlist;
	if (typeof listRaw !== "object" || listRaw === null) return null;
	const list = listRaw as Record<string, unknown>;
	return {
		allowlist: {
			mcpServers: readNameList(list.mcpServers),
			skills: readNameList(list.skills),
			subagents: readNameList(list.subagents),
			slashCommands: readNameList(list.slashCommands),
		},
		// Anything other than an explicit `true` fails closed.
		publishCost: obj.publishCost === true,
	};
}

/**
 * Fetch the curated allowlist and the cost preference, falling back to the
 * bundled copy on any failure. Never throws — an unreachable aistack must not
 * prevent a local analysis from running, it must only narrow what could publish.
 */
export async function loadSyncConfig(opts: {
	baseUrl: string;
	fetchImpl?: typeof fetch;
	timeoutMs?: number;
}): Promise<LoadedSyncConfig> {
	const doFetch = opts.fetchImpl ?? fetch;
	try {
		const res = await doFetch(`${opts.baseUrl}${SYNC_CONFIG_PATH}`, {
			signal: AbortSignal.timeout(opts.timeoutMs ?? FETCH_TIMEOUT_MS),
			headers: { Accept: "application/json" },
		});
		if (!res.ok) {
			return {
				config: BUNDLED_SYNC_CONFIG,
				source: "bundled",
				error: `sync-config returned ${res.status}`,
			};
		}
		const parsed = readSyncConfig(await res.json());
		if (!parsed) {
			return {
				config: BUNDLED_SYNC_CONFIG,
				source: "bundled",
				error: "sync-config response was not the expected shape",
			};
		}
		return { config: parsed, source: "fetched" };
	} catch (err) {
		return {
			config: BUNDLED_SYNC_CONFIG,
			source: "bundled",
			error: err instanceof Error ? err.message : "sync-config fetch failed",
		};
	}
}

// ---------------------------------------------------------------------------
// Filtering
// ---------------------------------------------------------------------------

export type Atom = { name: string; count: number };

export type FilteredAtoms = {
	/** Allowlisted names, ordered by count descending. */
	allowed: Atom[];
	/** How many DISTINCT names were withheld. */
	withheld: number;
};

/**
 * Split observed atoms into the allowlisted ones and a count of the rest.
 *
 * The withheld figure counts distinct names, not calls: it answers "how much of
 * my inventory is not shown", which is the honesty question, without leaking
 * how heavily any single withheld thing is used.
 */
export function filterAtoms(
	atoms: readonly Atom[],
	allowed: ReadonlySet<string>,
): FilteredAtoms {
	const kept: Atom[] = [];
	let withheld = 0;
	for (const atom of atoms) {
		if (allowed.has(atom.name)) kept.push(atom);
		else withheld++;
	}
	kept.sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
	return { allowed: kept, withheld };
}
