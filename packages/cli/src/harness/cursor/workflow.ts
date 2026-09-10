import path from "node:path";
import { normalizeModel } from "@aistack/pricing";
import type { Message } from "cursor-history";
import { detectMcpServers } from "../../mcp.js";
import type { HarnessWorkflowReducer } from "../../workflow/reducer.js";
import { type Aggregate, asStr, bump } from "../shared/aggregate.js";
import {
	type Contribution,
	type LocalSession,
	messageTimes,
} from "./evidence.js";

/** Native names stay in inventory; only the reducer sees these established equivalents. */
const TOOLS: Record<string, string> = {
	read_file: "Read",
	read_file_v2: "Read",
	list_dir: "Glob",
	glob_file_search: "Glob",
	grep: "Grep",
	search: "Grep",
	codebase_search: "Grep",
	edit_file: "Edit",
	edit_file_v2: "Edit",
	search_replace: "Edit",
	write: "Write",
	write_file: "Write",
	delete_file: "Edit",
	run_terminal_cmd: "Bash",
	run_terminal_command: "Bash",
	execute_command: "Bash",
	web_search: "WebSearch",
	web_fetch: "WebFetch",
	ask_question: "ask_question",
	todo_write: "TodoWrite",
	task: "Task",
	skill: "Skill",
};
export const CURSOR_BUILTIN_TOOLS: ReadonlySet<string> = new Set(
	Object.keys(TOOLS),
);

/** Project retained history without treating an accumulated turn as a Context call. */
export function projectHistory(options: {
	locals: LocalSession[];
	api: Contribution[];
	usage: Contribution[];
	aggregate: Aggregate;
	workflow?: HarnessWorkflowReducer;
	sinceMs: number;
	now: number;
}): void {
	const { locals, api, usage, aggregate, workflow, sinceMs, now } = options;
	const nativeOwners = new Map<string, string>();
	for (const { session } of locals)
		for (const message of session.messages)
			if (
				message.id &&
				message.identityOrigin === "composer-native" &&
				!message.isSidechain &&
				!nativeOwners.has(message.id)
			)
				nativeOwners.set(message.id, session.id);
	const seenMessages = new Set<string>();
	const seenTools = new Set<string>();
	const configuredServers = new Map<string, string[]>();
	const scopes = new Map<
		string,
		{ session: string; sidechain?: boolean; parentSession?: string }
	>();
	const inWindow = (t: number | null): t is number =>
		t !== null && t >= sinceMs && t <= now;
	for (const { session } of locals) {
		const projectWorkspace =
			session.canonicalWorkspacePath &&
			path.isAbsolute(session.canonicalWorkspacePath)
				? session.canonicalWorkspacePath
				: undefined;
		const times = messageTimes(session, api);
		const scopeOf = (message: Message) => {
			// A sidechain bit establishes routing. Only an actual parent reference establishes fan-out.
			const parent =
				message.parentMessageId && nativeOwners.get(message.parentMessageId);
			return message.isSidechain
				? {
						session: `${session.id}:sidechain`,
						sidechain: true,
						...(parent ? { parentSession: parent } : {}),
					}
				: { session: session.id };
		};
		for (const [index, message] of session.messages.entries()) {
			const identity =
				message.identityOrigin === "composer-native" && message.id
					? `native:${message.id}`
					: `${session.id}:${message.id ?? index}`;
			if (seenMessages.has(identity)) continue;
			seenMessages.add(identity);
			const tsMs = times[index];
			const scope = scopeOf(message);
			if (message.id) scopes.set(`${session.id}:${message.id}`, scope);
			if (tsMs !== null && !inWindow(tsMs)) continue;
			const common = { ...scope, projectWorkspace, tsMs: tsMs ?? 0 };
			if (message.role === "user") {
				if (inWindow(tsMs))
					workflow?.ingest({
						...common,
						type: "response",
						responseId: `anchor:${message.id ?? index}`,
					});
				continue;
			}
			let questionBack = false;
			for (const [toolIndex, call] of (message.toolCalls ?? []).entries()) {
				const id =
					call.identityOrigin === "source-native" && call.id
						? `native:${call.id}`
						: `${identity}:${call.id ?? toolIndex}`;
				if (seenTools.has(id)) continue;
				seenTools.add(id);
				bump(aggregate.toolCalls, call.name);
				const tool = TOOLS[call.name] ?? call.name;
				const arg =
					asStr(call.params?.command) ??
					asStr(call.params?.cmd) ??
					asStr(call.params?.skill) ??
					asStr(call.params?.subagent_type) ??
					"";
				if (tool === "WebSearch") aggregate.webSearchRequests++;
				if (tool === "WebFetch") aggregate.webFetchRequests++;
				if (tool === "Skill" && arg) bump(aggregate.skillCalls, arg);
				if (tool === "Task") bump(aggregate.subagentCalls, arg || "(unknown)");
				const mcp = /^mcp__(.+?)__(.+)$/.exec(call.name);
				let server = mcp?.[1];
				if (!server && call.name.startsWith("mcp_")) {
					const directory = projectWorkspace ?? process.cwd();
					let names = configuredServers.get(directory);
					if (!names) {
						names = detectMcpServers(directory)
							.filter((r) => r.group === "cursor")
							.map((r) => r.name)
							.sort((a, b) => b.length - a.length);
						configuredServers.set(directory, names);
					}
					server = names.find((name) => call.name.startsWith(`mcp_${name}_`));
				}
				if (server) {
					bump(aggregate.mcpServerCalls, server);
					bump(aggregate.mcpToolCalls, call.name);
				}
				questionBack ||= tool === "ask_question";
				if (inWindow(tsMs))
					workflow?.ingest({
						...common,
						type: "event",
						tool,
						arg,
						batchId: id,
					});
			}
			if (inWindow(tsMs))
				workflow?.ingest({
					...common,
					type: "turn",
					turnId: message.id ?? `assistant:${index}`,
					questionBack,
				});
		}
	}
	if (!workflow) return;
	const projects = new Map(
		locals.map(({ session }) => [session.id, session.canonicalWorkspacePath]),
	);
	for (const [index, row] of usage.entries()) {
		if (!inWindow(row.tsMs)) continue;
		const project = projects.get(row.session);
		const scope =
			row.id && row.source === "local"
				? scopes.get(`${row.session}:${row.id}`)
				: undefined;
		workflow.ingest({
			...(scope ?? {
				session: row.sidechain ? `${row.session}:sidechain` : row.session,
				sidechain: row.sidechain,
			}),
			...(project && path.isAbsolute(project)
				? { projectWorkspace: project }
				: {}),
			type: "response",
			tsMs: row.tsMs,
			responseId: `${row.source}:${row.id ?? index}`,
			model: normalizeModel(row.model),
			routingTokens:
				(row.buckets.input ?? 0) +
				(row.buckets.output ?? 0) +
				(row.buckets.cacheRead ?? 0) +
				(row.buckets.cacheWrite ?? 0),
		});
	}
}
