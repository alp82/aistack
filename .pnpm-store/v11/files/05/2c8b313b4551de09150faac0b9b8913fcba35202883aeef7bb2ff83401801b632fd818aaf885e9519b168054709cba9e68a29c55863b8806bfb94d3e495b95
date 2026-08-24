import { createApiKey } from "./create-api-key.mjs";
import { deleteAllExpiredApiKeysEndpoint } from "./delete-all-expired-api-keys.mjs";
import { deleteApiKey } from "./delete-api-key.mjs";
import { getApiKey } from "./get-api-key.mjs";
import { listApiKeys } from "./list-api-keys.mjs";
import { updateApiKey } from "./update-api-key.mjs";
import { verifyApiKey } from "./verify-api-key.mjs";
import { API_KEY_TABLE_NAME } from "../index.mjs";

//#region src/plugins/api-key/routes/index.ts
let lastChecked = null;
async function deleteAllExpiredApiKeys(ctx, byPassLastCheckTime = false) {
	if (lastChecked && !byPassLastCheckTime) {
		if ((/* @__PURE__ */ new Date()).getTime() - lastChecked.getTime() < 1e4) return;
	}
	lastChecked = /* @__PURE__ */ new Date();
	await ctx.adapter.deleteMany({
		model: API_KEY_TABLE_NAME,
		where: [{
			field: "expiresAt",
			operator: "lt",
			value: /* @__PURE__ */ new Date()
		}, {
			field: "expiresAt",
			operator: "ne",
			value: null
		}]
	}).catch((error) => {
		ctx.logger.error(`Failed to delete expired API keys:`, error);
	});
}
function createApiKeyRoutes({ keyGenerator, opts, schema }) {
	return {
		createApiKey: createApiKey({
			keyGenerator,
			opts,
			schema,
			deleteAllExpiredApiKeys
		}),
		verifyApiKey: verifyApiKey({
			opts,
			schema,
			deleteAllExpiredApiKeys
		}),
		getApiKey: getApiKey({
			opts,
			schema,
			deleteAllExpiredApiKeys
		}),
		updateApiKey: updateApiKey({
			opts,
			schema,
			deleteAllExpiredApiKeys
		}),
		deleteApiKey: deleteApiKey({
			opts,
			schema,
			deleteAllExpiredApiKeys
		}),
		listApiKeys: listApiKeys({
			opts,
			schema,
			deleteAllExpiredApiKeys
		}),
		deleteAllExpiredApiKeys: deleteAllExpiredApiKeysEndpoint({ deleteAllExpiredApiKeys })
	};
}

//#endregion
export { createApiKeyRoutes, deleteAllExpiredApiKeys };
//# sourceMappingURL=index.mjs.map