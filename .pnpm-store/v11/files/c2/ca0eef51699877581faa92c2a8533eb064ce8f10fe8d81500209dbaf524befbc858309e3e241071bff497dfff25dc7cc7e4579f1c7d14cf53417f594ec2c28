import type { FieldTypeFromFieldPath, TableNamesInDataModel, GenericDataModel, GenericDatabaseReader, DocumentByName, SystemTableNames, NamedIndex, NamedTableInfo, IndexNames, FieldPaths } from "convex/server";
import type { GenericId } from "convex/values";
/**
 * Gets a document by its ID. Throws if not found.
 * @param ctx The database reader to use to get the document.
 * @param id The id of the document to get.
 * @returns The document with the given ID.
 */
export declare function getOrThrow<DataModel extends GenericDataModel, Table extends TableNamesInDataModel<DataModel>>(ctx: {
    db: GenericDatabaseReader<DataModel>;
}, id: GenericId<Table>): Promise<DocumentByName<DataModel, Table>>;
/**
 * getAll returns a list of Documents (or null) for the `Id`s passed in.
 *
 * Nulls are returned for documents not found.
 * @param db A DatabaseReader, usually passed from a mutation or query ctx.
 * @param ids An list (or other iterable) of Ids pointing to a table.
 * @returns The Documents referenced by the Ids, in order. `null` if not found.
 */
export declare function getAll<DataModel extends GenericDataModel, TableName extends TableNamesInDataModel<DataModel>>(db: GenericDatabaseReader<DataModel>, ids: Iterable<GenericId<TableName>> | Promise<Iterable<GenericId<TableName>>>): Promise<(DocumentByName<DataModel, TableName> | null)[]>;
/**
 * getAllOrThrow returns a list of Documents for the `Id`s passed in.
 *
 * It throws if any documents are not found (null).
 * @param db A DatabaseReader, usually passed from a mutation or query ctx.
 * @param ids An list (or other iterable) of Ids pointing to a table.
 * @returns The Documents referenced by the Ids, in order. `null` if not found.
 */
export declare function getAllOrThrow<DataModel extends GenericDataModel, TableName extends TableNamesInDataModel<DataModel>>(db: GenericDatabaseReader<DataModel>, ids: Iterable<GenericId<TableName>> | Promise<Iterable<GenericId<TableName>>>): Promise<DocumentByName<DataModel, TableName>[]>;
type UserIndexes<DataModel extends GenericDataModel, TableName extends TableNamesInDataModel<DataModel>> = Exclude<IndexNames<NamedTableInfo<DataModel, TableName>>, "by_creation_time"> & string;
type TablesWithLookups<DataModel extends GenericDataModel> = {
    [T in TableNamesInDataModel<DataModel>]: UserIndexes<DataModel, T> extends never ? never : T;
}[TableNamesInDataModel<DataModel>];
type FirstIndexField<DataModel extends GenericDataModel, TableName extends TableNamesInDataModel<DataModel>, IndexName extends IndexNames<NamedTableInfo<DataModel, TableName>>> = NamedIndex<NamedTableInfo<DataModel, TableName>, IndexName>[0];
type TypeOfFirstIndexField<DataModel extends GenericDataModel, TableName extends TableNamesInDataModel<DataModel>, IndexName extends IndexNames<NamedTableInfo<DataModel, TableName>>> = IndexName extends IndexNames<NamedTableInfo<DataModel, TableName>> ? FieldTypeFromFieldPath<DocumentByName<DataModel, TableName>, NamedIndex<NamedTableInfo<DataModel, TableName>, IndexName>[0]> : never;
type LookupFieldPaths<DataModel extends GenericDataModel, TableName extends TableNamesInDataModel<DataModel>> = {
    [IndexName in UserIndexes<DataModel, TableName>]: FirstIndexField<DataModel, TableName, IndexName>;
}[UserIndexes<DataModel, TableName>];
type FieldIfDoesntMatchIndex<DataModel extends GenericDataModel, TableName extends TableNamesInDataModel<DataModel>, IndexName extends UserIndexes<DataModel, TableName>> = FirstIndexField<DataModel, TableName, IndexName> extends IndexName ? IndexName extends `by_${infer _}` ? never : [FirstIndexField<DataModel, TableName, IndexName>?] : `by_${FirstIndexField<DataModel, TableName, IndexName>}` extends IndexName ? [FirstIndexField<DataModel, TableName, IndexName>?] : [FirstIndexField<DataModel, TableName, IndexName>];
/**
 * Get a document matching the given value for a specified field.
 *
 * `null` if not found.
 * Useful for fetching a document with a one-to-one relationship via backref.
 * Requires the table to have an index on the field named the same as the field.
 * e.g. `defineTable({ fieldA: v.string() }).index("fieldA", ["fieldA"])`
 *
 * Getting 'string' is not assignable to parameter of type 'never'?
 * Make sure your index is named after your field.
 *
 * @param db DatabaseReader, passed in from the function ctx
 * @param table The table to fetch the target document from.
 * @param index The index on that table to look up the specified value by.
 * @param value The value to look up the document by, often an ID.
 * @param field The field on that table that should match the specified value.
 *   Optional if the index is named after the field.
 * @returns The document matching the value, or null if none found.
 */
export declare function getOneFrom<DataModel extends GenericDataModel, TableName extends TablesWithLookups<DataModel>, IndexName extends UserIndexes<DataModel, TableName>>(db: GenericDatabaseReader<DataModel>, table: TableName, index: IndexName, value: TypeOfFirstIndexField<DataModel, TableName, IndexName>, ...fieldArg: FieldIfDoesntMatchIndex<DataModel, TableName, IndexName>): Promise<DocumentByName<DataModel, TableName> | null>;
/**
 * Get a document matching the given value for a specified field.
 *
 * Throws if not found.
 * Useful for fetching a document with a one-to-one relationship via backref.
 * Requires the table to have an index on the field named the same as the field.
 * e.g. `defineTable({ fieldA: v.string() }).index("fieldA", ["fieldA"])`
 *
 * Getting 'string' is not assignable to parameter of type 'never'?
 * Make sure your index is named after your field.
 *
 * @param db DatabaseReader, passed in from the function ctx
 * @param table The table to fetch the target document from.
 * @param index The index on that table to look up the specified value by.
 * @param value The value to look up the document by, often an ID.
 * @param field The field on that table that should match the specified value.
 *   Optional if the index is named after the field.
 * @returns The document matching the value. Throws if not found.
 */
export declare function getOneFromOrThrow<DataModel extends GenericDataModel, TableName extends TablesWithLookups<DataModel>, IndexName extends UserIndexes<DataModel, TableName>>(db: GenericDatabaseReader<DataModel>, table: TableName, index: IndexName, value: TypeOfFirstIndexField<DataModel, TableName, IndexName>, ...fieldArg: FieldIfDoesntMatchIndex<DataModel, TableName, IndexName>): Promise<DocumentByName<DataModel, TableName>>;
/**
 * Get a list of documents matching the given value for a specified field.
 *
 * Useful for fetching many documents related to a given value via backrefs.
 * Requires the table to have an index on the field named the same as the field.
 * e.g. `defineTable({ fieldA: v.string() }).index("fieldA", ["fieldA"])`
 *
 * Getting 'string' is not assignable to parameter of type 'never'?
 * Make sure your index is named after your field.
 *
 * @param db DatabaseReader, passed in from the function ctx
 * @param table The table to fetch the target document from.
 * @param index The index on that table to look up the specified value by.
 * @param value The value to look up the document by, often an ID.
 * @param field The field on that table that should match the specified value.
 *   Optional if the index is named after the field.
 * @returns The documents matching the value, if any.
 */
export declare function getManyFrom<DataModel extends GenericDataModel, TableName extends TablesWithLookups<DataModel>, IndexName extends UserIndexes<DataModel, TableName>>(db: GenericDatabaseReader<DataModel>, table: TableName, index: IndexName, value: TypeOfFirstIndexField<DataModel, TableName, IndexName>, ...fieldArg: FieldIfDoesntMatchIndex<DataModel, TableName, IndexName>): Promise<DocumentByName<DataModel, TableName>[]>;
type IdFilePaths<DataModel extends GenericDataModel, InTableName extends TableNamesInDataModel<DataModel>, TableName extends TableNamesInDataModel<DataModel> | SystemTableNames> = {
    [FieldName in FieldPaths<NamedTableInfo<DataModel, InTableName>>]: FieldTypeFromFieldPath<DocumentByName<DataModel, InTableName>, FieldName> extends GenericId<TableName> ? FieldName extends "_id" ? never : FieldName : never;
}[FieldPaths<NamedTableInfo<DataModel, InTableName>>];
type LookupAndIdFilePaths<DataModel extends GenericDataModel, TableName extends TablesWithLookups<DataModel>> = {
    [FieldPath in IdFilePaths<DataModel, TableName, TableNamesInDataModel<DataModel> | SystemTableNames>]: LookupFieldPaths<DataModel, TableName> extends FieldPath ? never : true;
}[IdFilePaths<DataModel, TableName, TableNamesInDataModel<DataModel> | SystemTableNames>];
type JoinTables<DataModel extends GenericDataModel> = {
    [TableName in TablesWithLookups<DataModel>]: LookupAndIdFilePaths<DataModel, TableName> extends never ? never : TableName;
}[TablesWithLookups<DataModel>];
/**
 * Get related documents by using a join table.
 *
 * Any missing documents referenced by the join table will be null.
 * It will find all join table entries matching a value, then look up all the
 * documents pointed to by the join table entries. Useful for many-to-many
 * relationships.
 *
 * Requires your join table to have an index on the fromField named the same as
 * the fromField, and another field that is an Id type.
 * e.g. `defineTable({ a: v.string(), b: v.id("users") }).index("a", ["a"])`
 *
 * Getting 'string' is not assignable to parameter of type 'never'?
 * Make sure your index is named after your field.
 *
 * @param db DatabaseReader, passed in from the function ctx
 * @param table The table to fetch the target document from.
 * @param toField The ID field on the table pointing at target documents.
 * @param index The index on the join table to look up the specified value by.
 * @param value The value to look up the documents in join table by.
 * @param field The field on the join table to match the specified value.
 *   Optional if the index is named after the field.
 * @returns The documents targeted by matching documents in the table, if any.
 */
export declare function getManyVia<DataModel extends GenericDataModel, JoinTableName extends JoinTables<DataModel>, ToField extends IdFilePaths<DataModel, JoinTableName, TableNamesInDataModel<DataModel> | SystemTableNames>, IndexName extends UserIndexes<DataModel, JoinTableName>, TargetTableName extends FieldTypeFromFieldPath<DocumentByName<DataModel, JoinTableName>, ToField> extends GenericId<infer TargetTableName> ? TargetTableName : never>(db: GenericDatabaseReader<DataModel>, table: JoinTableName, toField: ToField, index: IndexName, value: TypeOfFirstIndexField<DataModel, JoinTableName, IndexName>, ...fieldArg: FieldIfDoesntMatchIndex<DataModel, JoinTableName, IndexName>): Promise<(DocumentByName<DataModel, TargetTableName> | null)[]>;
/**
 * Get related documents by using a join table.
 *
 * Throws an error if any documents referenced by the join table are missing.
 * It will find all join table entries matching a value, then look up all the
 * documents pointed to by the join table entries. Useful for many-to-many
 * relationships.
 *
 * Requires your join table to have an index on the fromField named the same as
 * the fromField, and another field that is an Id type.
 * e.g. `defineTable({ a: v.string(), b: v.id("users") }).index("a", ["a"])`
 *
 * Getting 'string' is not assignable to parameter of type 'never'?
 * Make sure your index is named after your field.
 *
 * @param db DatabaseReader, passed in from the function ctx
 * @param table The table to fetch the target document from.
 * @param toField The ID field on the table pointing at target documents.
 * @param index The index on the join table to look up the specified value by.
 * @param value The value to look up the documents in join table by.
 * @param field The field on the join table to match the specified value.
 *   Optional if the index is named after the field.
 * @returns The documents targeted by matching documents in the table, if any.
 */
export declare function getManyViaOrThrow<DataModel extends GenericDataModel, JoinTableName extends JoinTables<DataModel>, ToField extends IdFilePaths<DataModel, JoinTableName, TableNamesInDataModel<DataModel> | SystemTableNames>, IndexName extends UserIndexes<DataModel, JoinTableName>, TargetTableName extends FieldTypeFromFieldPath<DocumentByName<DataModel, JoinTableName>, ToField> extends GenericId<infer TargetTableName> ? TargetTableName : never>(db: GenericDatabaseReader<DataModel>, table: JoinTableName, toField: ToField, index: IndexName, value: TypeOfFirstIndexField<DataModel, JoinTableName, IndexName>, ...fieldArg: FieldIfDoesntMatchIndex<DataModel, JoinTableName, IndexName>): Promise<DocumentByName<DataModel, TargetTableName>[]>;
export {};
//# sourceMappingURL=relationships.d.ts.map