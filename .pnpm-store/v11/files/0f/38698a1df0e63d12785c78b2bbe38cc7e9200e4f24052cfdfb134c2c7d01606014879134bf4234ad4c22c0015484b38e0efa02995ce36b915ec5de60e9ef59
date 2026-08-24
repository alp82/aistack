import { createAuthEndpoint } from "@better-auth/core/api";

//#region src/plugins/api-key/routes/delete-all-expired-api-keys.ts
function deleteAllExpiredApiKeysEndpoint({ deleteAllExpiredApiKeys }) {
	return createAuthEndpoint({ method: "POST" }, async (ctx) => {
		try {
			await deleteAllExpiredApiKeys(ctx.context, true);
		} catch (error) {
			ctx.context.logger.error("[API KEY PLUGIN] Failed to delete expired API keys:", error);
			return ctx.json({
				success: false,
				error
			});
		}
		return ctx.json({
			success: true,
			error: null
		});
	});
}

//#endregion
export { deleteAllExpiredApiKeysEndpoint };
//# sourceMappingURL=delete-all-expired-api-keys.mjs.map