import { Auth } from "../types/auth.mjs";
import "../types/index.mjs";
import { BetterAuthOptions } from "@better-auth/core";

//#region src/auth/auth.d.ts

/**
 * Better Auth initializer for full mode (with Kysely)
 *
 * @example
 * ```ts
 * import { betterAuth } from "better-auth";
 *
 * const auth = betterAuth({
 * 	database: new PostgresDialect({ connection: process.env.DATABASE_URL }),
 * });
 * ```
 *
 * For minimal mode (without Kysely), import from `better-auth/minimal` instead
 * @example
 * ```ts
 * import { betterAuth } from "better-auth/minimal";
 *
 * const auth = betterAuth({
 *	  database: drizzleAdapter(db, { provider: "pg" }),
 * });
 */
declare const betterAuth: <Options extends BetterAuthOptions>(options: Options & Record<never, never>) => Auth<Options>;
//#endregion
export { betterAuth };
//# sourceMappingURL=auth.d.mts.map