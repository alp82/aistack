import { getBaseAdapter } from "../db/adapter-base.mjs";
import "../db/index.mjs";
import { createAuthContext } from "./create-context.mjs";
import { BetterAuthError } from "@better-auth/core/error";

//#region src/context/init-minimal.ts
const initMinimal = async (options) => {
	const adapter = await getBaseAdapter(options, async () => {
		throw new BetterAuthError("Direct database connection requires Kysely. Please use `better-auth` instead of `better-auth/minimal`, or provide an adapter (drizzleAdapter, prismaAdapter, etc.)");
	});
	const getDatabaseType = (_database) => "unknown";
	const ctx = await createAuthContext(adapter, options, getDatabaseType);
	ctx.runMigrations = async function() {
		throw new BetterAuthError("Migrations are not supported in 'better-auth/minimal'. Please use 'better-auth' for migration support.");
	};
	return ctx;
};

//#endregion
export { initMinimal };
//# sourceMappingURL=init-minimal.mjs.map