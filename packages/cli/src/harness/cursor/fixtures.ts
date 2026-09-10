import type { Session } from "cursor-history";
export const AT = Date.UTC(2026, 8, 10, 12);
export const session = (overrides: Partial<Session> = {}): Session => ({
	id: "local-session",
	workspace: "/synthetic/project",
	canonicalWorkspacePath: "/synthetic/project",
	timestamp: new Date(AT).toISOString(),
	createdAtSource: "composer-metadata",
	resolutionState: "complete",
	messageCount: 2,
	messages: [
		{
			id: "user",
			role: "user",
			content: "12345678",
			timestamp: new Date(AT).toISOString(),
			timestampSource: "composer-created-at",
		},
		{
			id: "reply",
			role: "assistant",
			content: "abcdefgh",
			model: "claude-sonnet-4-6",
			timestamp: new Date(AT + 1000).toISOString(),
			timestampSource: "composer-timing",
		},
	],
	...overrides,
});
