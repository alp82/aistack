import { KyselyDatabaseType } from "../adapters/kysely-adapter/types.mjs";
import { BetterAuthOptions } from "@better-auth/core";
import { DBFieldAttribute, DBFieldType } from "@better-auth/core/db";

//#region src/db/get-migration.d.ts
declare function matchType(columnDataType: string, fieldType: DBFieldType, dbType: KyselyDatabaseType): boolean;
declare function getMigrations(config: BetterAuthOptions): Promise<{
  toBeCreated: {
    table: string;
    fields: Record<string, DBFieldAttribute>;
    order: number;
  }[];
  toBeAdded: {
    table: string;
    fields: Record<string, DBFieldAttribute>;
    order: number;
  }[];
  runMigrations: () => Promise<void>;
  compileMigrations: () => Promise<string>;
}>;
//#endregion
export { getMigrations, matchType };
//# sourceMappingURL=get-migration.d.mts.map