/**
 * A helper to run migrations over all documents in a table.
 *
 * This helper allows you to:
 *
 * - Define a function to migrate one document, and run that function over
 *  all documents in a table, in batch.
 * - Run migrations manually from the CLI or dashboard.
 * - Run migrations directly from a function.
 * - Run many migrations in series from a function or CLI / dashboard.
 * - Get the status of a migration.
 * - Resume a migration from where it left off. E.g. if you read too much data
 *   in a batch you can start it over with a smaller batch size.
 * - Cancel an in-progress migration.
 * - Run a dry run to see what the migration would do without committing.
 * - Start a migration from an explicit cursor.
 *
## Usage:

In `convex/schema.ts` (if you want persistence):

```ts
// In convex/schema.ts
import { migrationsTable } from "convex-helpers/server/migrations";
export default defineSchema({
  migrations: migrationsTable,
  // other tables...
});
```

You can pick any table name for this, but it should match `migrationTable` used below.

In `convex/migrations.ts` (or wherever you want to define them):

```ts
import { makeMigration } from "convex-helpers/server/migrations";
import { internalMutation } from "./_generated/server";

const migration = makeMigration(internalMutation, {
  migrationTable: "migrations",
});

export const myMigration = migration({
  table: "users",
  migrateOne: async (ctx, doc) => {
    await ctx.db.patch(doc._id, { newField: "value" });
  },
});
```

To run from the CLI / dashboard:
You can run this manually from the CLI or dashboard:

```sh
# Start or resume a migration. No-ops if it's already done:
npx convex run migrations:myMigration '{fn: "migrations:myMigration"}'
```

Or call it directly within a function:

```ts
import { startMigration } from "convex-helpers/server/migrations";

//... within a mutation or action
await startMigration(ctx, internal.migrations.myMigration, {
  startCursor: null, // optional override
  batchSize: 10, // optional override
});
```

Or define many to run in series (skips already completed migrations / rows):

```ts
import { startMigrationsSerially } from "convex-helpers/server/migrations";
import { internalMutation } from "./_generated/server";

export default internalMutation(async (ctx) => {
  await startMigrationsSerially(ctx, [
    internal.migrations.myMigration,
    internal.migrations.myOtherMigration,
    //...
  ]);
});
```

If this default export is in `convex/migrations.ts` you can run:

```sh
npx convex run migrations --prod
```
 *
 * Ideas for the future:
 * - Allow scheduling multiple batches at once. Maybe partition by time.
 */
import type { DocumentByInfo, DocumentByName, FunctionReference, GenericDatabaseReader, GenericDataModel, GenericMutationCtx, MutationBuilder, NamedTableInfo, OrderedQuery, QueryInitializer, RegisteredMutation, Scheduler, TableNamesInDataModel } from "convex/server";
import type { GenericId, ObjectType } from "convex/values";
import type { ErrorMessage } from "../index.js";
export declare const DEFAULT_BATCH_SIZE = 100;
declare const migrationsFields: {
    name: import("convex/values").VString<string, "required">;
    table: import("convex/values").VString<string, "required">;
    cursor: import("convex/values").VUnion<string | null, [import("convex/values").VString<string, "required">, import("convex/values").VNull<null, "required">], "required", never>;
    isDone: import("convex/values").VBoolean<boolean, "required">;
    workerId: import("convex/values").VId<GenericId<"_scheduled_functions"> | undefined, "optional">;
    processed: import("convex/values").VFloat64<number, "required">;
    latestStart: import("convex/values").VFloat64<number, "required">;
    latestEnd: import("convex/values").VFloat64<number | undefined, "optional">;
};
type MigrationMetadata = ObjectType<typeof migrationsFields>;
type MigrationMetadataDoc<TableName extends string> = MigrationMetadata & {
    _id: GenericId<TableName>;
    _creationTime: number;
};
export declare const migrationsTable: import("convex/server").TableDefinition<import("convex/values").VObject<{
    workerId?: GenericId<"_scheduled_functions"> | undefined;
    latestEnd?: number | undefined;
    cursor: string | null;
    isDone: boolean;
    name: string;
    table: string;
    processed: number;
    latestStart: number;
}, {
    name: import("convex/values").VString<string, "required">;
    table: import("convex/values").VString<string, "required">;
    cursor: import("convex/values").VUnion<string | null, [import("convex/values").VString<string, "required">, import("convex/values").VNull<null, "required">], "required", never>;
    isDone: import("convex/values").VBoolean<boolean, "required">;
    workerId: import("convex/values").VId<GenericId<"_scheduled_functions"> | undefined, "optional">;
    processed: import("convex/values").VFloat64<number, "required">;
    latestStart: import("convex/values").VFloat64<number, "required">;
    latestEnd: import("convex/values").VFloat64<number | undefined, "optional">;
}, "required", "cursor" | "isDone" | "name" | "table" | "workerId" | "processed" | "latestStart" | "latestEnd">, {
    name: ["name", "_creationTime"];
}, {}, {}>;
declare const migrationArgs: {
    fn: import("convex/values").VString<string, "required">;
    cursor: import("convex/values").VUnion<string | null | undefined, [import("convex/values").VString<string, "required">, import("convex/values").VNull<null, "required">], "optional", never>;
    batchSize: import("convex/values").VFloat64<number | undefined, "optional">;
    next: import("convex/values").VArray<string[] | undefined, import("convex/values").VString<string, "required">, "optional">;
    dryRun: import("convex/values").VBoolean<boolean | undefined, "optional">;
};
type MigrationArgs = ObjectType<typeof migrationArgs>;
type MigrationTableNames<DataModel extends GenericDataModel> = {
    [K in TableNamesInDataModel<DataModel>]: DocumentByInfo<NamedTableInfo<DataModel, K>> extends MigrationMetadata ? K : ErrorMessage<"Add migrationsTable to your schema">;
}[TableNamesInDataModel<DataModel>];
/**
 * Makes the migration wrapper, with types for your own tables.
 *
 * It will keep track of migration state if you specify a migration table.
 * If you don't specify a table, it will not check for active migrations.
 * e.g. in your schema:
 * ```ts
 * import { migrationsTable } from "convex-helpers/server/migrations";
 * export default defineSchema({
 *  migrations: migrationsTable,
 *  // other tables...
 * })
 * ```
 * And in convex/migrations.ts for example:
 * ```ts
 * import { makeMigration } from "convex-helpers/server/migrations";
 * import { internalMutation } from "./_generated/server";
 * const migration = makeMigration(internalMutation, {
 *   migrationTable: "migrations",
 * });
 *
 * export const myMigration = migration({
 *  table: "users",
 *  migrateOne: async (ctx, doc) => {
 *    await ctx.db.patch(doc._id, { newField: "value" });
 *  }
 * });
 * ```
 * @param internalMutation - The internal mutation to use for the migration.
 * @param opts - For stateful migrations, set migrationTable.
 * @param opts.migrationTable - The name of the table you added to your schema,
 *   importing the migrationTable from this file.
 */
export declare function makeMigration<DataModel extends GenericDataModel, MigrationTable extends MigrationTableNames<DataModel>>(internalMutation: MutationBuilder<DataModel, "internal">, opts?: {
    migrationTable?: MigrationTable;
    defaultBatchSize?: number;
}): <TableName extends TableNamesInDataModel<DataModel>>({ table, migrateOne, customRange, batchSize: functionDefaultBatchSize, }: {
    table: TableName;
    migrateOne: (ctx: GenericMutationCtx<DataModel>, doc: DocumentByName<DataModel, TableName>) => void | Partial<DocumentByName<DataModel, TableName>> | Promise<Partial<DocumentByName<DataModel, TableName>> | void>;
    customRange?: (q: QueryInitializer<NamedTableInfo<DataModel, TableName>>) => OrderedQuery<NamedTableInfo<DataModel, TableName>>;
    batchSize?: number;
}) => RegisteredMutation<"internal", MigrationArgs, Promise<MigrationMetadataDoc<MigrationTable>>>;
/**
 * Start a migration from a server function via a function reference.
 *
 * Overrides any options you passed in, such as resetting the cursor.
 * If it's already in progress, it will no-op.
 * If you run a migration that had previously failed which was part of a series,
 * it will not resume the series.
 * To resume a series, call the series again: {@link startMigrationsSerially}.
 *
 * Note: It's up to you to determine if it's safe to run a migration while
 * others are in progress. It won't run multiple instance of the same migration
 * but it currently allows running multiple migrations on the same table.
 *
 * @param ctx ctx from an action or mutation. It only uses the scheduler.
 * @param fnRef The migration function to run. Like internal.migrations.foo.
 * @param opts Options to start the migration.
 * @param opts.startCursor The cursor to start from.
 *   null: start from the beginning.
 *   undefined: start or resume from where it failed. If done, it won't restart.
 * @param opts.batchSize The number of documents to process in a batch.
 * @param opts.dryRun If true, it will run a batch and then throw an error.
 *   It's helpful to see what it would do without committing the transaction.
 */
export declare function startMigration(ctx: {
    scheduler: Scheduler;
}, fnRef: FunctionReference<"mutation", "internal", MigrationArgs>, opts?: {
    startCursor?: string | null;
    batchSize?: number;
    dryRun?: boolean;
}): Promise<void>;
/**
 * Start a series of migrations, running one a time. Each call starts a series.
 *
 * If a migration has previously completed it will skip it.
 * If a migration had partial progress, it will resume from where it left off.
 * If a migration is already in progress when attempted, it will no-op.
 * If a migration fails or is canceled, it will stop executing and NOT execute
 * any subsequent migrations in the series. Call the series again to retry.
 *
 * This is useful to run as an post-deploy script where you specify all the
 * live migrations that should be run.
 *
 * Note: if you start multiple serial migrations, the behavior is:
 * - If they don't overlap on functions, they will happily run in parallel.
 * - If they have a function in common and one completes before the other
 *   attempts it, the second will just skip it.
 * - If they have a function in common and one is in progress, the second will
 *   no-op and not run any further migrations in its series.
 *
 * To stop a migration in progress, see {@link cancelMigration}.
 *
 * @param ctx ctx from an action or mutation. Only needs the scheduler.
 * @param fnRefs The migrations to run in order. Like [internal.migrations.foo].
 */
export declare function startMigrationsSerially(ctx: {
    scheduler: Scheduler;
}, fnRefs: FunctionReference<"mutation", "internal", MigrationArgs>[]): Promise<void>;
export type MigrationStatus<TableName extends string> = (MigrationMetadataDoc<TableName> | {
    name: string;
    status: "not found";
    workerId: undefined;
    isDone: false;
}) & {
    workerStatus?: "pending" | "inProgress" | "success" | "failed" | "canceled" | undefined;
    batchSize?: any;
    next?: any;
};
/**
 * Get the status of a migration or all migrations.
 * @param ctx Context from a mutation or query. Only needs the db.
 * @param migrationTable Where the migration state is stored.
 *   Should match the argument to {@link makeMigration}, if set.
 * @param migrations The migrations to get the status of. Defaults to all.
 * @returns The status of the migrations, in the order of the input.
 */
export declare function getStatus<DataModel extends GenericDataModel, MigrationTable extends MigrationTableNames<DataModel>>(ctx: {
    db: GenericDatabaseReader<DataModel>;
}, { migrationTable, migrations, limit, }: {
    migrationTable: MigrationTable;
    migrations?: FunctionReference<"mutation", "internal", MigrationArgs>[];
    limit?: number;
}): Promise<MigrationStatus<MigrationTable>[]>;
/**
 * Cancels a migration if it's in progress.
 * You can resume it later by calling the migration without an explicit cursor.
 * If the migration had "next" migrations, e.g. from startMigrationsSerially,
 * they will not run. To resume, call the series again or manually pass "next".
 * @param ctx Context from a query or mutation. Only needs the db and scheduler.
 * @param migrationId Migration to cancel. Get from status or logs.
 * @returns The status of the migration after attempting to cancel it.
 */
export declare function cancelMigration<DataModel extends GenericDataModel>(ctx: {
    db: GenericDatabaseReader<DataModel>;
    scheduler: Scheduler;
}, migrationTable: MigrationTableNames<DataModel>, migration: FunctionReference<"mutation", "internal", MigrationArgs> | string): Promise<{
    workerId?: GenericId<"_scheduled_functions"> | undefined;
    latestEnd?: number | undefined;
    cursor: string | null;
    isDone: boolean;
    name: string;
    table: string;
    processed: number;
    latestStart: number;
} | {
    workerStatus: string;
    workerId?: GenericId<"_scheduled_functions"> | undefined;
    latestEnd?: number | undefined;
    cursor: string | null;
    isDone: boolean;
    name: string;
    table: string;
    processed: number;
    latestStart: number;
}>;
export {};
//# sourceMappingURL=migrations.d.ts.map