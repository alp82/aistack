import { sessionMiddleware } from "../../../api/routes/session.mjs";
import { APIError } from "../../../api/index.mjs";
import { deleteApiKey, getApiKeyById } from "../adapter.mjs";
import { API_KEY_TABLE_NAME, ERROR_CODES } from "../index.mjs";
import * as z from "zod";
import { createAuthEndpoint } from "@better-auth/core/api";

//#region src/plugins/api-key/routes/delete-api-key.ts
const deleteApiKeyBodySchema = z.object({ keyId: z.string().meta({ description: "The id of the Api Key" }) });
function deleteApiKey$1({ opts, schema, deleteAllExpiredApiKeys }) {
	return createAuthEndpoint("/api-key/delete", {
		method: "POST",
		body: deleteApiKeyBodySchema,
		use: [sessionMiddleware],
		metadata: { openapi: {
			description: "Delete an existing API key",
			requestBody: { content: { "application/json": { schema: {
				type: "object",
				properties: { keyId: {
					type: "string",
					description: "The id of the API key to delete"
				} },
				required: ["keyId"]
			} } } },
			responses: { "200": {
				description: "API key deleted successfully",
				content: { "application/json": { schema: {
					type: "object",
					properties: { success: {
						type: "boolean",
						description: "Indicates if the API key was successfully deleted"
					} },
					required: ["success"]
				} } }
			} }
		} }
	}, async (ctx) => {
		const { keyId } = ctx.body;
		const session = ctx.context.session;
		if (session.user.banned === true) throw new APIError("UNAUTHORIZED", { message: ERROR_CODES.USER_BANNED });
		let apiKey = null;
		apiKey = await getApiKeyById(ctx, keyId, opts);
		if (!apiKey || apiKey.userId !== session.user.id) throw new APIError("NOT_FOUND", { message: ERROR_CODES.KEY_NOT_FOUND });
		try {
			if (opts.storage === "secondary-storage" && opts.fallbackToDatabase) {
				await deleteApiKey(ctx, apiKey, opts);
				await ctx.context.adapter.delete({
					model: API_KEY_TABLE_NAME,
					where: [{
						field: "id",
						value: apiKey.id
					}]
				});
			} else if (opts.storage === "database") await ctx.context.adapter.delete({
				model: API_KEY_TABLE_NAME,
				where: [{
					field: "id",
					value: apiKey.id
				}]
			});
			else await deleteApiKey(ctx, apiKey, opts);
		} catch (error) {
			throw new APIError("INTERNAL_SERVER_ERROR", { message: error?.message });
		}
		deleteAllExpiredApiKeys(ctx.context);
		return ctx.json({ success: true });
	});
}

//#endregion
export { deleteApiKey$1 as deleteApiKey };
//# sourceMappingURL=delete-api-key.mjs.map