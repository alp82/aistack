import type { LocalSessionData } from "./evidence.js";
export const AT = Date.UTC(2026, 8, 10, 12);
export const session = (
	overrides: Partial<LocalSessionData> = {},
): LocalSessionData => ({
	id: "local-session",
	canonicalWorkspacePath: "/synthetic/project",
	timestamp: new Date(AT).toISOString(),
	createdAtSource: "composer-metadata",
	resolutionState: "complete",
	messages: [
		{
			id: "user",
			role: "user",
			contentLength: 8,
			timestamp: new Date(AT).toISOString(),
			timestampSource: "composer-created-at",
		},
		{
			id: "reply",
			role: "assistant",
			contentLength: 8,
			model: "claude-sonnet-4-6",
			timestamp: new Date(AT + 1000).toISOString(),
			timestampSource: "composer-timing",
		},
	],
	...overrides,
});
