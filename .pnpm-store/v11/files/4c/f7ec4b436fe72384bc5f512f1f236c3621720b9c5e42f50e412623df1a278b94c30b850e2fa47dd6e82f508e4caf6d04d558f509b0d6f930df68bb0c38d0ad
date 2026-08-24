import type { QueryBuilder, MutationBuilder, WithoutSystemFields, DocumentByName, RegisteredMutation, RegisteredQuery, FunctionVisibility, PaginationResult, SchemaDefinition, GenericSchema, TableNamesInDataModel, DataModelFromSchemaDefinition } from "convex/server";
import { paginationOptsValidator } from "convex/server";
import type { GenericId, Infer, Validator } from "convex/values";
/**
 * Create CRUD operations for a table.
 * You can expose these operations in your API. For example, in convex/users.ts:
 *
 * ```ts
 * // in convex/users.ts
 * import { crud } from "convex-helpers/server/crud";
 * import schema from "./schema";
 *
 * export const { create, read, update, destroy } = crud(schema, "users");
 * ```
 *
 * Then you can access the functions like `internal.users.create` from actions.
 *
 * To expose these functions publicly, you can pass in custom query and
 * mutation arguments. Be careful what you expose publicly: you wouldn't want
 * any client to be able to delete users, for example.
 *
 * @param schema Your project's schema.
 * @param table The table name to create CRUD operations for.
 * @param query The query to use - use internalQuery or query from
 * "./convex/_generated/server" or a customQuery.
 * @param mutation The mutation to use - use internalMutation or mutation from
 * "./convex/_generated/server" or a customMutation.
 * @returns An object with create, read, update, and delete functions.
 * You must export these functions at the top level of your file to use them.
 */
export declare function crud<Schema extends GenericSchema, TableName extends TableNamesInDataModel<DataModelFromSchemaDefinition<SchemaDefinition<Schema, any>>>, QueryVisibility extends FunctionVisibility = "internal", MutationVisibility extends FunctionVisibility = "internal">(schema: SchemaDefinition<Schema, any>, table: TableName, query?: QueryBuilder<DataModelFromSchemaDefinition<SchemaDefinition<Schema, any>>, QueryVisibility>, mutation?: MutationBuilder<DataModelFromSchemaDefinition<SchemaDefinition<Schema, any>>, MutationVisibility>): {
    create: RegisteredMutation<MutationVisibility, WithoutSystemFields<DocumentByName<{ [TableName_1 in keyof Schema & string]: Schema[TableName_1] extends import("convex/server").TableDefinition<infer DocumentType extends Validator<any, any, any>, infer Indexes extends import("convex/server").GenericTableIndexes, infer SearchIndexes extends import("convex/server").GenericTableSearchIndexes, infer VectorIndexes extends import("convex/server").GenericTableVectorIndexes> ? {
        document: import("convex/server").Expand<import("convex/server").IdField<TableName_1> & import("convex/server").Expand<import("convex/server").SystemFields & DocumentType["type"]>>;
        fieldPaths: keyof import("convex/server").IdField<TableName_2> | ("_creationTime" | DocumentType["fieldPaths"]);
        indexes: import("convex/server").Expand<Indexes & import("convex/server").SystemIndexes>;
        searchIndexes: SearchIndexes;
        vectorIndexes: VectorIndexes;
    } : never; } | import("convex/server").Expand<{ [TableName_1 in keyof Schema & string]: Schema[TableName_1] extends import("convex/server").TableDefinition<infer DocumentType extends Validator<any, any, any>, infer Indexes extends import("convex/server").GenericTableIndexes, infer SearchIndexes extends import("convex/server").GenericTableSearchIndexes, infer VectorIndexes extends import("convex/server").GenericTableVectorIndexes> ? {
        document: import("convex/server").Expand<import("convex/server").IdField<TableName_1> & import("convex/server").Expand<import("convex/server").SystemFields & DocumentType["type"]>>;
        fieldPaths: keyof import("convex/server").IdField<TableName_2> | ("_creationTime" | DocumentType["fieldPaths"]);
        indexes: import("convex/server").Expand<Indexes & import("convex/server").SystemIndexes>;
        searchIndexes: SearchIndexes;
        vectorIndexes: VectorIndexes;
    } : never; } & import("convex/server").AnyDataModel>, TableName>>, Promise<DocumentByName<{ [TableName_1 in keyof Schema & string]: Schema[TableName_1] extends import("convex/server").TableDefinition<infer DocumentType extends Validator<any, any, any>, infer Indexes extends import("convex/server").GenericTableIndexes, infer SearchIndexes extends import("convex/server").GenericTableSearchIndexes, infer VectorIndexes extends import("convex/server").GenericTableVectorIndexes> ? {
        document: import("convex/server").Expand<import("convex/server").IdField<TableName_1> & import("convex/server").Expand<import("convex/server").SystemFields & DocumentType["type"]>>;
        fieldPaths: keyof import("convex/server").IdField<TableName_2> | ("_creationTime" | DocumentType["fieldPaths"]);
        indexes: import("convex/server").Expand<Indexes & import("convex/server").SystemIndexes>;
        searchIndexes: SearchIndexes;
        vectorIndexes: VectorIndexes;
    } : never; } | import("convex/server").Expand<{ [TableName_1 in keyof Schema & string]: Schema[TableName_1] extends import("convex/server").TableDefinition<infer DocumentType extends Validator<any, any, any>, infer Indexes extends import("convex/server").GenericTableIndexes, infer SearchIndexes extends import("convex/server").GenericTableSearchIndexes, infer VectorIndexes extends import("convex/server").GenericTableVectorIndexes> ? {
        document: import("convex/server").Expand<import("convex/server").IdField<TableName_1> & import("convex/server").Expand<import("convex/server").SystemFields & DocumentType["type"]>>;
        fieldPaths: keyof import("convex/server").IdField<TableName_2> | ("_creationTime" | DocumentType["fieldPaths"]);
        indexes: import("convex/server").Expand<Indexes & import("convex/server").SystemIndexes>;
        searchIndexes: SearchIndexes;
        vectorIndexes: VectorIndexes;
    } : never; } & import("convex/server").AnyDataModel>, TableName>>>;
    read: RegisteredQuery<QueryVisibility, {
        id: GenericId<TableName>;
    }, Promise<DocumentByName<{ [TableName_1 in keyof Schema & string]: Schema[TableName_1] extends import("convex/server").TableDefinition<infer DocumentType extends Validator<any, any, any>, infer Indexes extends import("convex/server").GenericTableIndexes, infer SearchIndexes extends import("convex/server").GenericTableSearchIndexes, infer VectorIndexes extends import("convex/server").GenericTableVectorIndexes> ? {
        document: import("convex/server").Expand<import("convex/server").IdField<TableName_1> & import("convex/server").Expand<import("convex/server").SystemFields & DocumentType["type"]>>;
        fieldPaths: keyof import("convex/server").IdField<TableName_2> | ("_creationTime" | DocumentType["fieldPaths"]);
        indexes: import("convex/server").Expand<Indexes & import("convex/server").SystemIndexes>;
        searchIndexes: SearchIndexes;
        vectorIndexes: VectorIndexes;
    } : never; } | import("convex/server").Expand<{ [TableName_1 in keyof Schema & string]: Schema[TableName_1] extends import("convex/server").TableDefinition<infer DocumentType extends Validator<any, any, any>, infer Indexes extends import("convex/server").GenericTableIndexes, infer SearchIndexes extends import("convex/server").GenericTableSearchIndexes, infer VectorIndexes extends import("convex/server").GenericTableVectorIndexes> ? {
        document: import("convex/server").Expand<import("convex/server").IdField<TableName_1> & import("convex/server").Expand<import("convex/server").SystemFields & DocumentType["type"]>>;
        fieldPaths: keyof import("convex/server").IdField<TableName_2> | ("_creationTime" | DocumentType["fieldPaths"]);
        indexes: import("convex/server").Expand<Indexes & import("convex/server").SystemIndexes>;
        searchIndexes: SearchIndexes;
        vectorIndexes: VectorIndexes;
    } : never; } & import("convex/server").AnyDataModel>, TableName> | null>>;
    paginate: RegisteredQuery<QueryVisibility, {
        paginationOpts: Infer<typeof paginationOptsValidator>;
    }, Promise<PaginationResult<DocumentByName<{ [TableName_1 in keyof Schema & string]: Schema[TableName_1] extends import("convex/server").TableDefinition<infer DocumentType extends Validator<any, any, any>, infer Indexes extends import("convex/server").GenericTableIndexes, infer SearchIndexes extends import("convex/server").GenericTableSearchIndexes, infer VectorIndexes extends import("convex/server").GenericTableVectorIndexes> ? {
        document: import("convex/server").Expand<import("convex/server").IdField<TableName_1> & import("convex/server").Expand<import("convex/server").SystemFields & DocumentType["type"]>>;
        fieldPaths: keyof import("convex/server").IdField<TableName_2> | ("_creationTime" | DocumentType["fieldPaths"]);
        indexes: import("convex/server").Expand<Indexes & import("convex/server").SystemIndexes>;
        searchIndexes: SearchIndexes;
        vectorIndexes: VectorIndexes;
    } : never; } | import("convex/server").Expand<{ [TableName_1 in keyof Schema & string]: Schema[TableName_1] extends import("convex/server").TableDefinition<infer DocumentType extends Validator<any, any, any>, infer Indexes extends import("convex/server").GenericTableIndexes, infer SearchIndexes extends import("convex/server").GenericTableSearchIndexes, infer VectorIndexes extends import("convex/server").GenericTableVectorIndexes> ? {
        document: import("convex/server").Expand<import("convex/server").IdField<TableName_1> & import("convex/server").Expand<import("convex/server").SystemFields & DocumentType["type"]>>;
        fieldPaths: keyof import("convex/server").IdField<TableName_2> | ("_creationTime" | DocumentType["fieldPaths"]);
        indexes: import("convex/server").Expand<Indexes & import("convex/server").SystemIndexes>;
        searchIndexes: SearchIndexes;
        vectorIndexes: VectorIndexes;
    } : never; } & import("convex/server").AnyDataModel>, TableName>>>>;
    update: RegisteredMutation<MutationVisibility, {
        id: GenericId<TableName>;
        patch: Partial<WithoutSystemFields<DocumentByName<{ [TableName_1 in keyof Schema & string]: Schema[TableName_1] extends import("convex/server").TableDefinition<infer DocumentType extends Validator<any, any, any>, infer Indexes extends import("convex/server").GenericTableIndexes, infer SearchIndexes extends import("convex/server").GenericTableSearchIndexes, infer VectorIndexes extends import("convex/server").GenericTableVectorIndexes> ? {
            document: import("convex/server").Expand<import("convex/server").IdField<TableName_1> & import("convex/server").Expand<import("convex/server").SystemFields & DocumentType["type"]>>;
            fieldPaths: keyof import("convex/server").IdField<TableName_2> | ("_creationTime" | DocumentType["fieldPaths"]);
            indexes: import("convex/server").Expand<Indexes & import("convex/server").SystemIndexes>;
            searchIndexes: SearchIndexes;
            vectorIndexes: VectorIndexes;
        } : never; } | import("convex/server").Expand<{ [TableName_1 in keyof Schema & string]: Schema[TableName_1] extends import("convex/server").TableDefinition<infer DocumentType extends Validator<any, any, any>, infer Indexes extends import("convex/server").GenericTableIndexes, infer SearchIndexes extends import("convex/server").GenericTableSearchIndexes, infer VectorIndexes extends import("convex/server").GenericTableVectorIndexes> ? {
            document: import("convex/server").Expand<import("convex/server").IdField<TableName_1> & import("convex/server").Expand<import("convex/server").SystemFields & DocumentType["type"]>>;
            fieldPaths: keyof import("convex/server").IdField<TableName_2> | ("_creationTime" | DocumentType["fieldPaths"]);
            indexes: import("convex/server").Expand<Indexes & import("convex/server").SystemIndexes>;
            searchIndexes: SearchIndexes;
            vectorIndexes: VectorIndexes;
        } : never; } & import("convex/server").AnyDataModel>, TableName>>>;
    }, Promise<void>>;
    destroy: RegisteredMutation<MutationVisibility, {
        id: GenericId<TableName>;
    }, Promise<null | DocumentByName<{ [TableName_1 in keyof Schema & string]: Schema[TableName_1] extends import("convex/server").TableDefinition<infer DocumentType extends Validator<any, any, any>, infer Indexes extends import("convex/server").GenericTableIndexes, infer SearchIndexes extends import("convex/server").GenericTableSearchIndexes, infer VectorIndexes extends import("convex/server").GenericTableVectorIndexes> ? {
        document: import("convex/server").Expand<import("convex/server").IdField<TableName_1> & import("convex/server").Expand<import("convex/server").SystemFields & DocumentType["type"]>>;
        fieldPaths: keyof import("convex/server").IdField<TableName_2> | ("_creationTime" | DocumentType["fieldPaths"]);
        indexes: import("convex/server").Expand<Indexes & import("convex/server").SystemIndexes>;
        searchIndexes: SearchIndexes;
        vectorIndexes: VectorIndexes;
    } : never; } | import("convex/server").Expand<{ [TableName_1 in keyof Schema & string]: Schema[TableName_1] extends import("convex/server").TableDefinition<infer DocumentType extends Validator<any, any, any>, infer Indexes extends import("convex/server").GenericTableIndexes, infer SearchIndexes extends import("convex/server").GenericTableSearchIndexes, infer VectorIndexes extends import("convex/server").GenericTableVectorIndexes> ? {
        document: import("convex/server").Expand<import("convex/server").IdField<TableName_1> & import("convex/server").Expand<import("convex/server").SystemFields & DocumentType["type"]>>;
        fieldPaths: keyof import("convex/server").IdField<TableName_2> | ("_creationTime" | DocumentType["fieldPaths"]);
        indexes: import("convex/server").Expand<Indexes & import("convex/server").SystemIndexes>;
        searchIndexes: SearchIndexes;
        vectorIndexes: VectorIndexes;
    } : never; } & import("convex/server").AnyDataModel>, TableName>>>;
};
//# sourceMappingURL=crud.d.ts.map