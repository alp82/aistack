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

import { isDisplaySafeName } from "./analyzer.js";
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

/** The five inventory classes the payload carries. */
export const NAME_CATEGORIES = [
	"builtinTools",
	"mcpServers",
	"skills",
	"subagents",
	"slashCommands",
] as const;

export type NameCategory = (typeof NAME_CATEGORIES)[number];

/**
 * Names this stack's owner has explicitly ticked for publication (#42
 * decision 1), served per-stack by the authenticated half of `/api/sync-config`.
 *
 * The curated list is a convenience default, not the coverage mechanism: every
 * user-chosen name class is unbounded and unenumerable, so a hand-curated list
 * can only ever be a rounding error against the real population. Coverage comes
 * from here — from the person who knows which of their names are secret.
 *
 * `builtinTools` is included for symmetry even though that class is
 * vendor-assigned: a built-in this version of the client has never heard of is
 * kept private like anything else, and the owner can tick it.
 */
export type OptInNames = Record<NameCategory, readonly string[]>;

export const EMPTY_OPT_INS: OptInNames = {
	builtinTools: [],
	mcpServers: [],
	skills: [],
	subagents: [],
	slashCommands: [],
};

export type SyncConfig = {
	allowlist: CuratedAllowlist;
	/**
	 * Stack-level cost preference (decision 11). When false the payload omits
	 * cost entirely rather than zeroing it — see payload.ts.
	 */
	publishCost: boolean;
	/** Per-stack ticked names, unioned into the allowlist before filtering. */
	optIns: OptInNames;
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
	// Empty for the same reason, and it is the load-bearing half of #42
	// decision 2: a failed config fetch reverts every ticked name to
	// kept-private. Losing the network publishes LESS, never more.
	optIns: EMPTY_OPT_INS,
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

/**
 * Opt-ins are read against a LOOSER bar than the curated list.
 *
 * A curated entry is ours and conventional, so the tight charset costs nothing.
 * An opt-in is the user's own name — `(default)`, an accented word, a CJK skill
 * — and dropping it here would silently un-tick a decision they made at the
 * gate. The bar that survives is the one that matters for a string we print and
 * store: no control characters, no bidi overrides, bounded length.
 */
function readOptInList(v: unknown): string[] {
	if (!Array.isArray(v)) return [];
	const out: string[] = [];
	for (const item of v) {
		if (typeof item === "string" && isDisplaySafeName(item)) out.push(item);
	}
	return out;
}

function readOptIns(v: unknown): OptInNames {
	if (typeof v !== "object" || v === null || Array.isArray(v))
		return EMPTY_OPT_INS;
	const obj = v as Record<string, unknown>;
	return {
		builtinTools: readOptInList(obj.builtinTools),
		mcpServers: readOptInList(obj.mcpServers),
		skills: readOptInList(obj.skills),
		subagents: readOptInList(obj.subagents),
		slashCommands: readOptInList(obj.slashCommands),
	};
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
		// Absent means "no stack resolved" — an anonymous fetch, or a token bound
		// to nothing. Both fail closed to publishing no user-chosen names.
		optIns: readOptIns(obj.optIns),
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

/**
 * One observed name that will NOT publish, as the approve gate needs to render
 * it: the raw string, how often it ran, and the plugin it came from.
 *
 * Local only — this never enters the payload. It exists because the gate offers
 * every kept-private name as an explicit, default-off tick (#42 decision 1), and
 * it cannot offer what the analyzer does not hand back.
 */
export type KeptPrivateAtom = {
	name: string;
	count: number;
	/** Plugin prefix, for the gate's grouped bulk tick. `null` when standalone. */
	group: string | null;
};

export type FilteredAtoms = {
	/** Publishable names, ordered by count descending. */
	allowed: Atom[];
	/** The rest, with everything the gate needs to offer them as ticks. */
	keptPrivate: KeptPrivateAtom[];
	/** How many DISTINCT names were kept private. */
	withheld: number;
};

/**
 * A server an MCP plugin provides is observed as `plugin_<plugin>_<server>`.
 *
 * That whole string is GENERATED by Claude Code — the user typed none of it —
 * which is a different class from a hand-edited `.mcp.json` alias. Strip the
 * wrapper before matching (#42 decision 5).
 *
 * The split takes the FIRST underscore-free segment as the plugin name. A plugin
 * whose own name carries an underscore therefore splits wrong, the inner segment
 * matches nothing, and the raw name stays kept private — the same direction
 * every other miss fails in.
 */
const PLUGIN_MCP_RE = /^plugin_([^_]+)_(.+)$/;

/** `plugin:artifact` is the convention for a plugin's skills and subagents. */
const PLUGIN_PREFIX_RE = /^([^:\s]+):(.+)$/;

/**
 * The plugin a name came from, for the gate's grouped bulk tick.
 *
 * Grouping is a UI affordance only. What the gate STORES is every name in the
 * group, expanded (#42 decision 3): a stored `alp-river:*` would be a standing
 * grant to names that do not exist yet, and nobody can consent to a name they
 * have not thought of.
 */
export function pluginGroup(name: string): string | null {
	return (
		PLUGIN_MCP_RE.exec(name)?.[1] ?? PLUGIN_PREFIX_RE.exec(name)?.[1] ?? null
	);
}

export type FilterSets = {
	/** Curated list UNION this stack's opt-ins. A match here publishes verbatim. */
	publishable: ReadonlySet<string>;
	/**
	 * The curated list alone — the only target normalization may match.
	 *
	 * This is what makes the normalization safe to state in one line:
	 * normalization can only ever emit a string that is already curated. The
	 * blast radius of a bug in it is an already-vetted set, by construction.
	 */
	curated: ReadonlySet<string>;
};

/**
 * Resolve the name an atom would publish under, or `null` to keep it private.
 *
 * Raw match first, so a name the owner ticked publishes exactly as they saw it
 * at the gate. Only an unmatched name is normalized, and only against the
 * curated list.
 */
function publishedName(name: string, sets: FilterSets): string | null {
	if (sets.publishable.has(name)) return name;
	const inner = PLUGIN_MCP_RE.exec(name)?.[2];
	if (inner && sets.curated.has(inner)) return inner;
	return null;
}

/**
 * Split observed atoms into what publishes and what stays on the machine.
 *
 * The withheld figure counts distinct names, not calls: it answers "how much of
 * my inventory is not shown", which is the honesty question, without leaking
 * how heavily any single kept-private thing is used.
 *
 * Counts are merged by PUBLISHED name, because normalization can map two
 * observed names onto one — a plugin-provided `chrome-devtools` and a directly
 * configured one both publish as `chrome-devtools`, and two rows with the same
 * name would double-count that server in the rendered inventory.
 */
export function filterAtoms(
	atoms: readonly Atom[],
	sets: FilterSets,
): FilteredAtoms {
	const merged = new Map<string, number>();
	const keptPrivate: KeptPrivateAtom[] = [];
	for (const atom of atoms) {
		const published = publishedName(atom.name, sets);
		if (published === null) {
			keptPrivate.push({
				name: atom.name,
				count: atom.count,
				group: pluginGroup(atom.name),
			});
			continue;
		}
		merged.set(published, (merged.get(published) ?? 0) + atom.count);
	}
	const allowed = [...merged].map(([name, count]) => ({ name, count }));
	allowed.sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
	keptPrivate.sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
	return { allowed, keptPrivate, withheld: keptPrivate.length };
}
