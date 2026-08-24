import { KyselyDatabaseType } from "./types.mjs";
import { BetterAuthOptions } from "@better-auth/core";
import { Kysely } from "kysely";

//#region src/adapters/kysely-adapter/dialect.d.ts
declare function getKyselyDatabaseType(db: BetterAuthOptions["database"]): KyselyDatabaseType | null;
declare const createKyselyAdapter: (config: BetterAuthOptions) => Promise<{
  kysely: Kysely<any>;
  databaseType: "postgres" | "mysql" | "sqlite" | "mssql";
  transaction: boolean | undefined;
} | {
  kysely: Kysely<any> | null;
  databaseType: KyselyDatabaseType | null;
  transaction: undefined;
}>;
//#endregion
export { createKyselyAdapter, getKyselyDatabaseType };
//# sourceMappingURL=dialect.d.mts.map