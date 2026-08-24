import { getKyselyDatabaseType } from "../adapters/kysely-adapter/dialect.mjs";
import { getAdapter } from "../db/adapter-kysely.mjs";
import { getMigrations } from "../db/get-migration.mjs";
import { createAuthContext } from "./create-context.mjs";
import { BetterAuthError } from "@better-auth/core/error";

//#region src/context/init.ts
const init = async (options) => {
	const adapter = await getAdapter(options);
	const getDatabaseType = (database) => getKyselyDatabaseType(database) || "unknown";
	const ctx = await createAuthContext(adapter, options, getDatabaseType);
	ctx.runMigrations = async function() {
		if (!options.database || "updateMany" in options.database) throw new BetterAuthError("Database is not provided or it's an adapter. Migrations are only supported with a database instance.");
		const { runMigrations } = await getMigrations(options);
		await runMigrations();
	};
	return ctx;
};

//#endregion
export { init };
//# sourceMappingURL=init.mjs.map