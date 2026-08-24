import { getBaseAdapter } from "./adapter-base.mjs";
import { BetterAuthError } from "@better-auth/core/error";

//#region src/db/adapter-kysely.ts
async function getAdapter(options) {
	return getBaseAdapter(options, async (opts) => {
		const { createKyselyAdapter } = await import("../adapters/kysely-adapter/index.mjs");
		const { kysely, databaseType, transaction } = await createKyselyAdapter(opts);
		if (!kysely) throw new BetterAuthError("Failed to initialize database adapter");
		const { kyselyAdapter } = await import("../adapters/kysely-adapter/index.mjs");
		return kyselyAdapter(kysely, {
			type: databaseType || "sqlite",
			debugLogs: opts.database && "debugLogs" in opts.database ? opts.database.debugLogs : false,
			transaction
		})(opts);
	});
}

//#endregion
export { getAdapter };
//# sourceMappingURL=adapter-kysely.mjs.map