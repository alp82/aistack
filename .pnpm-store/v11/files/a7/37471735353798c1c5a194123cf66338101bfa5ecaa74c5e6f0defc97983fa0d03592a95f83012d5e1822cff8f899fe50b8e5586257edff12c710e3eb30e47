import { init } from "../context/init.mjs";
import { createBetterAuth } from "./base.mjs";

//#region src/auth/auth.ts
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
const betterAuth = (options) => {
	return createBetterAuth(options, init);
};

//#endregion
export { betterAuth };
//# sourceMappingURL=auth.mjs.map