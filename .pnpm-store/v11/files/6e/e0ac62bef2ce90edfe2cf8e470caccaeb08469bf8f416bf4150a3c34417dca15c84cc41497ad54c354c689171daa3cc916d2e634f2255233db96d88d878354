import { HIDE_METADATA } from "../../utils/hide-metadata.mjs";
import { createAuthEndpoint } from "@better-auth/core/api";

//#region src/api/routes/ok.ts
const ok = createAuthEndpoint("/ok", {
	method: "GET",
	metadata: {
		...HIDE_METADATA,
		openapi: {
			description: "Check if the API is working",
			responses: { "200": {
				description: "API is working",
				content: { "application/json": { schema: {
					type: "object",
					properties: { ok: {
						type: "boolean",
						description: "Indicates if the API is working"
					} },
					required: ["ok"]
				} } }
			} }
		}
	}
}, async (ctx) => {
	return ctx.json({ ok: true });
});

//#endregion
export { ok };
//# sourceMappingURL=ok.mjs.map