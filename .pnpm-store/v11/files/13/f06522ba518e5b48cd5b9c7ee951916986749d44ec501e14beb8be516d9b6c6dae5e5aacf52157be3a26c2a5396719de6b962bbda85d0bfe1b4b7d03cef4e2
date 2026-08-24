import type { DocumentByName, GenericDatabaseWriter, GenericDataModel, GenericMutationCtx, NamedTableInfo, QueryInitializer, TableNamesInDataModel, WithOptionalSystemFields, WithoutSystemFields } from "convex/server";
import type { GenericId } from "convex/values";
/**
 * This function will be called when a document in the table changes.
 */
export type Trigger<Ctx, DataModel extends GenericDataModel, TableName extends TableNamesInDataModel<DataModel>> = (ctx: Ctx & {
    innerDb: GenericDatabaseWriter<DataModel>;
}, change: Change<DataModel, TableName>) => Promise<void>;
export type Change<DataModel extends GenericDataModel, TableName extends TableNamesInDataModel<DataModel>> = {
    id: GenericId<TableName>;
} & ({
    operation: "insert";
    oldDoc: null;
    newDoc: DocumentByName<DataModel, TableName>;
} | {
    operation: "update";
    oldDoc: DocumentByName<DataModel, TableName>;
    newDoc: DocumentByName<DataModel, TableName>;
} | {
    operation: "delete";
    oldDoc: DocumentByName<DataModel, TableName>;
    newDoc: null;
});
/**
 * Construct Triggers to register functions that run whenever a table changes.
 * Sample usage:
 *
 * ```
 * import { mutation as rawMutation } from "./_generated/server";
 * import { DataModel } from "./_generated/dataModel";
 * import { Triggers } from "convex-helpers/server/triggers";
 * import { customCtx, customMutation } from "convex-helpers/server/customFunctions";
 *
 * const triggers = new Triggers<DataModel>();
 * triggers.register("myTableName", async (ctx, change) => {
 *   console.log("Table changed", change);
 * });
 *
 * // Use `mutation` to define all mutations, and the triggers will get called.
 * export const mutation = customMutation(rawMutation, customCtx(triggers.wrapDB));
 * ```
 */
export declare class Triggers<DataModel extends GenericDataModel, Ctx extends {
    db: GenericDatabaseWriter<DataModel>;
} = GenericMutationCtx<DataModel>> {
    registered: {
        [TableName in TableNamesInDataModel<DataModel>]?: Trigger<Ctx, DataModel, TableName>[];
    };
    register<TableName extends TableNamesInDataModel<DataModel>>(tableName: TableName, trigger: Trigger<Ctx, DataModel, TableName>): void;
    wrapDB: <C extends Ctx>(ctx: C) => C;
}
/** @deprecated use writerWithTriggers instead */
export declare class DatabaseWriterWithTriggers<DataModel extends GenericDataModel, Ctx extends {
    db: GenericDatabaseWriter<DataModel>;
} = GenericMutationCtx<DataModel>> implements GenericDatabaseWriter<DataModel> {
    writer: GenericDatabaseWriter<DataModel>;
    constructor(ctx: Ctx, innerDb: GenericDatabaseWriter<DataModel>, triggers: Triggers<DataModel, Ctx>, isWithinTrigger?: boolean);
    delete<TableName extends TableNamesInDataModel<DataModel>>(table: NonUnion<TableName>, id: GenericId<TableName>): Promise<void>;
    delete(id: GenericId<TableNamesInDataModel<DataModel>>): Promise<void>;
    get<TableName extends TableNamesInDataModel<DataModel>>(table: NonUnion<TableName>, id: GenericId<TableName>): Promise<DocumentByName<DataModel, TableName> | null>;
    get<TableName extends TableNamesInDataModel<DataModel>>(id: GenericId<TableName>): Promise<DocumentByName<DataModel, TableName> | null>;
    insert<TableName extends TableNamesInDataModel<DataModel>>(table: TableName, value: WithoutSystemFields<DocumentByName<DataModel, TableName>>): Promise<GenericId<TableName>>;
    patch<TableName extends TableNamesInDataModel<DataModel>>(table: NonUnion<TableName>, id: GenericId<TableName>, value: PatchValue<DocumentByName<DataModel, TableName>>): Promise<void>;
    patch<TableName extends TableNamesInDataModel<DataModel>>(id: GenericId<TableName>, value: PatchValue<DocumentByName<DataModel, TableName>>): Promise<void>;
    query<TableName extends TableNamesInDataModel<DataModel>>(tableName: TableName): QueryInitializer<NamedTableInfo<DataModel, TableName>>;
    normalizeId<TableName extends TableNamesInDataModel<DataModel>>(tableName: TableName, id: string): GenericId<TableName> | null;
    replace<TableName extends TableNamesInDataModel<DataModel>>(table: NonUnion<TableName>, id: GenericId<TableName>, value: WithOptionalSystemFields<DocumentByName<DataModel, TableName>>): Promise<void>;
    replace<TableName extends TableNamesInDataModel<DataModel>>(id: GenericId<TableName>, value: WithOptionalSystemFields<DocumentByName<DataModel, TableName>>): Promise<void>;
    system: GenericDatabaseWriter<DataModel>["system"];
}
export declare function writerWithTriggers<DataModel extends GenericDataModel, Ctx extends {
    db: GenericDatabaseWriter<DataModel>;
} = GenericMutationCtx<DataModel>>(ctx: Ctx, innerDb: GenericDatabaseWriter<DataModel>, triggers: Triggers<DataModel, Ctx>, isWithinTrigger?: boolean): GenericDatabaseWriter<DataModel>;
/**
 * This prevents TypeScript from inferring that the generic `TableName` type is
 * a union type when `table` and `id` disagree.
 */
type NonUnion<T> = T extends never ? never : T;
/**
 * This is like Partial, but it also allows undefined to be passed to optional
 * fields when `exactOptionalPropertyTypes` is enabled in the tsconfig.
 */
type PatchValue<T> = {
    [P in keyof T]?: undefined extends T[P] ? T[P] | undefined : T[P];
};
export {};
//# sourceMappingURL=triggers.d.ts.map