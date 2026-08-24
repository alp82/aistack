import type { QueryBuilder, MutationBuilder, GenericDataModel, WithoutSystemFields, DocumentByName, RegisteredMutation, RegisteredQuery, FunctionVisibility, PaginationResult } from "convex/server";
import { paginationOptsValidator } from "convex/server";
import type { GenericId, Infer, ObjectType, Validator } from "convex/values";
import type { Expand } from "./index.js";
/**
 * Define a table with system fields _id and _creationTime. This also returns
 * helpers for working with the table in validators. See:
 * https://stack.convex.dev/argument-validation-without-repetition#table-helper-for-schema-definition--validation
 *
 * @param name The table name. This should also be used in defineSchema.
 * @param fields Table fields, as you'd pass to defineTable.
 * @returns Object of shape: {
 *   table: from defineTable,
 *   withSystemFields: Input fields with _id and _creationTime,
 *   withoutSystemFields: The fields passed in,
 *   doc: a validator for the table doc as a v.object(). This is useful when
 *     defining arguments to actions where you're passing whole documents.
 * }
 */
export declare function Table<T extends Record<string, Validator<any, any, any>>, TableName extends string>(name: TableName, fields: T): {
    name: TableName;
    table: import("convex/server").TableDefinition<import("convex/values").VObject<import("convex/server").Expand<{ [Property_1 in { [Property in keyof T]: T[Property]["isOptional"] extends "optional" ? Property : never; }[keyof T]]?: Exclude<Infer<T[Property_1]>, undefined> | undefined; } & { [Property_2 in Exclude<keyof T, { [Property in keyof T]: T[Property]["isOptional"] extends "optional" ? Property : never; }[keyof T]>]: Infer<T[Property_2]>; }>, T, "required", { [Property_3 in keyof T]: Property_3 | `${Property_3 & string}.${T[Property_3]["fieldPaths"]}`; }[keyof T] & string>, {}, {}, {}>;
    doc: import("convex/values").VObject<import("convex/server").Expand<{ [Property_5 in (Expand<T & {
        _id: import("convex/values").VId<GenericId<TableName>, "required">;
        _creationTime: import("convex/values").VFloat64<number, "required">;
    }> extends infer T_1 extends Record<string, import("convex/values").GenericValidator> ? { [Property_4 in keyof T_1]: T_1[Property_4]["isOptional"] extends "optional" ? Property_4 : never; } : never)[keyof Expand<T & {
        _id: import("convex/values").VId<GenericId<TableName>, "required">;
        _creationTime: import("convex/values").VFloat64<number, "required">;
    }>]]?: Exclude<Infer<Expand<T & {
        _id: import("convex/values").VId<GenericId<TableName>, "required">;
        _creationTime: import("convex/values").VFloat64<number, "required">;
    }>[Property_5]>, undefined> | undefined; } & { [Property_1_1 in Exclude<keyof Expand<T & {
        _id: import("convex/values").VId<GenericId<TableName>, "required">;
        _creationTime: import("convex/values").VFloat64<number, "required">;
    }>, (Expand<T & {
        _id: import("convex/values").VId<GenericId<TableName>, "required">;
        _creationTime: import("convex/values").VFloat64<number, "required">;
    }> extends infer T_2 extends Record<string, import("convex/values").GenericValidator> ? { [Property_4 in keyof T_2]: T_2[Property_4]["isOptional"] extends "optional" ? Property_4 : never; } : never)[keyof Expand<T & {
        _id: import("convex/values").VId<GenericId<TableName>, "required">;
        _creationTime: import("convex/values").VFloat64<number, "required">;
    }>]>]: Infer<Expand<T & {
        _id: import("convex/values").VId<GenericId<TableName>, "required">;
        _creationTime: import("convex/values").VFloat64<number, "required">;
    }>[Property_1_1]>; }>, Expand<T & {
        _id: import("convex/values").VId<GenericId<TableName>, "required">;
        _creationTime: import("convex/values").VFloat64<number, "required">;
    }>, "required", (Expand<T & {
        _id: import("convex/values").VId<GenericId<TableName>, "required">;
        _creationTime: import("convex/values").VFloat64<number, "required">;
    }> extends infer T_3 extends import("convex/values").PropertyValidators ? { [Property_2_1 in keyof T_3]: Property_2_1 | `${Property_2_1 & string}.${T_3[Property_2_1]["fieldPaths"]}`; } : never)[keyof Expand<T & {
        _id: import("convex/values").VId<GenericId<TableName>, "required">;
        _creationTime: import("convex/values").VFloat64<number, "required">;
    }>] & string>;
    withoutSystemFields: T;
    withSystemFields: Expand<T & {
        _id: import("convex/values").VId<GenericId<TableName>, "required">;
        _creationTime: import("convex/values").VFloat64<number, "required">;
    }>;
    systemFields: {
        _id: import("convex/values").VId<GenericId<TableName>, "required">;
        _creationTime: import("convex/values").VFloat64<number, "required">;
    };
    _id: import("convex/values").VId<GenericId<TableName>, "required">;
};
/**
 * @deprecated Use `missingEnvVariableError`
 */
export declare function missingEnvVariableUrl(envVarName: string, whereToGet: string): string;
/**
 * @param envVarName - The missing environment variable, e.g. OPENAI_API_KEY
 * @param whereToGet - Where to get it, e.g. "https://platform.openai.com/account/api-keys"
 * @returns A string with instructions on how to set the environment variable.
 */
export declare function missingEnvVariableError(envVarName: string, whereToGet: string): string;
/**
 * Get the deployment name from the CONVEX_CLOUD_URL environment variable.
 * @returns The deployment name, like "screaming-lemur-123"
 */
export declare function deploymentName(): string | undefined;
/**
 * Create CRUD operations for a table.
 * You can expose these operations in your API. For example, in convex/users.ts:
 *
 * ```ts
 * // in convex/users.ts
 * import { crud } from "convex-helpers/server";
 * import { query, mutation } from "./convex/_generated/server";
 *
 * const Users = Table("users", {
 *  name: v.string(),
 *  ///...
 * });
 *
 * export const { create, read, paginate, update, destroy } =
 *   crud(Users, query, mutation);
 * ```
 *
 * Then from a client, you can access `api.users.create`.
 *
 * @deprecated Use `import { crud } from "convex-helpers/server/crud";` instead.
 * @param table The table to create CRUD operations for.
 * Of type returned from Table() in "convex-helpers/server".
 * @param query The query to use - use internalQuery or query from
 * "./convex/_generated/server" or a customQuery.
 * @param mutation The mutation to use - use internalMutation or mutation from
 * "./convex/_generated/server" or a customMutation.
 * @returns An object with create, read, update, and delete functions.
 */
export declare function crud<Fields extends Record<string, Validator<any, any, any>>, TableName extends string, DataModel extends GenericDataModel, QueryVisibility extends FunctionVisibility, MutationVisibility extends FunctionVisibility>(table: {
    name: TableName;
    _id: Validator<GenericId<TableName>>;
    withoutSystemFields: Fields;
}, query: QueryBuilder<DataModel, QueryVisibility>, mutation: MutationBuilder<DataModel, MutationVisibility>): {
    create: RegisteredMutation<MutationVisibility, ObjectType<Fields>, Promise<DocumentByName<DataModel, TableName>>>;
    read: RegisteredQuery<QueryVisibility, {
        id: GenericId<TableName>;
    }, Promise<DocumentByName<DataModel, TableName> | null>>;
    paginate: RegisteredQuery<QueryVisibility, {
        paginationOpts: Infer<typeof paginationOptsValidator>;
    }, Promise<PaginationResult<DocumentByName<DataModel, TableName>>>>;
    update: RegisteredMutation<MutationVisibility, {
        id: GenericId<TableName>;
        patch: Partial<WithoutSystemFields<DocumentByName<DataModel, TableName>>>;
    }, Promise<void>>;
    destroy: RegisteredMutation<MutationVisibility, {
        id: GenericId<TableName>;
    }, Promise<null | DocumentByName<DataModel, TableName>>>;
};
//# sourceMappingURL=server.d.ts.map