import { KyselyDatabaseType } from "./types.mjs";
import { BetterAuthOptions } from "@better-auth/core";
import { Kysely } from "kysely";
import { DBAdapter, DBAdapterDebugLogOption } from "@better-auth/core/db/adapter";

//#region src/adapters/kysely-adapter/kysely-adapter.d.ts
interface KyselyAdapterConfig {
  /**
   * Database type.
   */
  type?: KyselyDatabaseType | undefined;
  /**
   * Enable debug logs for the adapter
   *
   * @default false
   */
  debugLogs?: DBAdapterDebugLogOption | undefined;
  /**
   * Use plural for table names.
   *
   * @default false
   */
  usePlural?: boolean | undefined;
  /**
   * Whether to execute multiple operations in a transaction.
   *
   * If the database doesn't support transactions,
   * set this to `false` and operations will be executed sequentially.
   * @default false
   */
  transaction?: boolean | undefined;
}
declare const kyselyAdapter: (db: Kysely<any>, config?: KyselyAdapterConfig | undefined) => (options: BetterAuthOptions) => DBAdapter<BetterAuthOptions>;
//#endregion
export { kyselyAdapter };
//# sourceMappingURL=kysely-adapter.d.mts.map