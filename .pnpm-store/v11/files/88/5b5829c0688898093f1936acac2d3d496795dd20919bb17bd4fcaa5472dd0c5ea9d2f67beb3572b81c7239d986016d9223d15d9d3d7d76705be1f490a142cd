import { sessionMiddleware } from "../../api/routes/session.mjs";
import "../../api/index.mjs";
import { createAuthMiddleware } from "@better-auth/core/api";

//#region src/plugins/organization/call.ts
const orgMiddleware = createAuthMiddleware(async () => {
	return {};
});
/**
* The middleware forces the endpoint to require a valid session by utilizing the `sessionMiddleware`.
* It also appends additional types to the session type regarding organizations.
*/
const orgSessionMiddleware = createAuthMiddleware({ use: [sessionMiddleware] }, async (ctx) => {
	return { session: ctx.context.session };
});

//#endregion
export { orgMiddleware, orgSessionMiddleware };
//# sourceMappingURL=call.mjs.map