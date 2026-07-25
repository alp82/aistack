// Record builders shared across the transcript tests.
//
// Deliberately loose about shape: the analyzer treats every field as untrusted
// external JSON, so a fixture that can only produce well-formed records would
// never exercise the narrowing paths that matter.

export type UsageFixture = {
	input_tokens?: number;
	output_tokens?: number;
	cache_read_input_tokens?: number;
	cache_creation_input_tokens?: number;
	cache_creation?: {
		ephemeral_5m_input_tokens?: number;
		ephemeral_1h_input_tokens?: number;
	};
	speed?: string;
	iterations?: unknown[];
	server_tool_use?: {
		web_search_requests?: number;
		web_fetch_requests?: number;
	};
};

export type AssistantOptions = {
	id?: string | null;
	requestId?: string | null;
	model?: string;
	timestamp?: string;
	sessionId?: string;
	version?: string;
	isSidechain?: boolean;
	usage?: UsageFixture;
	content?: unknown[];
};

let seq = 0;

export function assistant(
	opts: AssistantOptions = {},
): Record<string, unknown> {
	seq++;
	const rec: Record<string, unknown> = {
		type: "assistant",
		timestamp: opts.timestamp ?? "2026-07-20T12:00:00.000Z",
		sessionId: opts.sessionId ?? "sess-1",
		message: {
			...(opts.id === null ? {} : { id: opts.id ?? `msg_${seq}` }),
			model: opts.model ?? "claude-opus-5",
			usage: opts.usage ?? { input_tokens: 10, output_tokens: 20 },
			content: opts.content ?? [],
		},
	};
	if (opts.requestId !== null) rec.requestId = opts.requestId ?? `req_${seq}`;
	if (opts.version !== undefined) rec.version = opts.version;
	if (opts.isSidechain) rec.isSidechain = true;
	return rec;
}

export function toolUse(
	name: string,
	input: Record<string, unknown> = {},
	id?: string,
): Record<string, unknown> {
	seq++;
	return { type: "tool_use", id: id ?? `toolu_${seq}`, name, input };
}

export function slashCommand(
	name: string,
	timestamp = "2026-07-20T12:00:00.000Z",
): Record<string, unknown> {
	return {
		type: "user",
		timestamp,
		sessionId: "sess-1",
		message: {
			role: "user",
			content: [
				{
					type: "text",
					text: `<command-message>x</command-message>\n<command-name>/${name}</command-name>`,
				},
			],
		},
	};
}
