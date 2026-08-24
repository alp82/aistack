import { AuthContext, BetterAuthOptions, InternalAdapter } from "@better-auth/core";
import { InternalLogger } from "@better-auth/core/env";
import { DBAdapter } from "@better-auth/core/db/adapter";

//#region src/db/internal-adapter.d.ts
declare const createInternalAdapter: (adapter: DBAdapter<BetterAuthOptions>, ctx: {
  options: Omit<BetterAuthOptions, "logger">;
  logger: InternalLogger;
  hooks: Exclude<BetterAuthOptions["databaseHooks"], undefined>[];
  generateId: AuthContext["generateId"];
}) => InternalAdapter;
//#endregion
export { createInternalAdapter };
//# sourceMappingURL=internal-adapter.d.mts.map