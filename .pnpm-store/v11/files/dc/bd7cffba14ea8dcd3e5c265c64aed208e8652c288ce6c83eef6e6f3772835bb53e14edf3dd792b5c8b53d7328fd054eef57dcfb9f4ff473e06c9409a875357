import type { Infer } from "convex/values";
import type { DocumentByName, GenericDataModel, GenericQueryCtx, PaginationOptions, PaginationResult, SchemaDefinition, TableNamesInDataModel } from "convex/server";
import type { BetterAuthDBSchema } from "better-auth/db";
export declare const adapterWhereValidator: import("convex/values").VObject<{
    operator?: "in" | "lt" | "lte" | "gt" | "gte" | "eq" | "not_in" | "ne" | "contains" | "starts_with" | "ends_with" | undefined;
    connector?: "AND" | "OR" | undefined;
    value: string | number | boolean | string[] | number[] | null;
    field: string;
}, {
    field: import("convex/values").VString<string, "required">;
    operator: import("convex/values").VUnion<"in" | "lt" | "lte" | "gt" | "gte" | "eq" | "not_in" | "ne" | "contains" | "starts_with" | "ends_with" | undefined, [import("convex/values").VLiteral<"lt", "required">, import("convex/values").VLiteral<"lte", "required">, import("convex/values").VLiteral<"gt", "required">, import("convex/values").VLiteral<"gte", "required">, import("convex/values").VLiteral<"eq", "required">, import("convex/values").VLiteral<"in", "required">, import("convex/values").VLiteral<"not_in", "required">, import("convex/values").VLiteral<"ne", "required">, import("convex/values").VLiteral<"contains", "required">, import("convex/values").VLiteral<"starts_with", "required">, import("convex/values").VLiteral<"ends_with", "required">], "optional", never>;
    value: import("convex/values").VUnion<string | number | boolean | string[] | number[] | null, [import("convex/values").VString<string, "required">, import("convex/values").VFloat64<number, "required">, import("convex/values").VBoolean<boolean, "required">, import("convex/values").VArray<string[], import("convex/values").VString<string, "required">, "required">, import("convex/values").VArray<number[], import("convex/values").VFloat64<number, "required">, "required">, import("convex/values").VNull<null, "required">], "required", never>;
    connector: import("convex/values").VUnion<"AND" | "OR" | undefined, [import("convex/values").VLiteral<"AND", "required">, import("convex/values").VLiteral<"OR", "required">], "optional", never>;
}, "required", "value" | "field" | "operator" | "connector">;
export declare const adapterArgsValidator: import("convex/values").VObject<{
    select?: string[] | undefined;
    limit?: number | undefined;
    offset?: number | undefined;
    sortBy?: {
        field: string;
        direction: "desc" | "asc";
    } | undefined;
    where?: {
        operator?: "in" | "lt" | "lte" | "gt" | "gte" | "eq" | "not_in" | "ne" | "contains" | "starts_with" | "ends_with" | undefined;
        connector?: "AND" | "OR" | undefined;
        value: string | number | boolean | string[] | number[] | null;
        field: string;
    }[] | undefined;
    model: string;
}, {
    model: import("convex/values").VString<string, "required">;
    where: import("convex/values").VArray<{
        operator?: "in" | "lt" | "lte" | "gt" | "gte" | "eq" | "not_in" | "ne" | "contains" | "starts_with" | "ends_with" | undefined;
        connector?: "AND" | "OR" | undefined;
        value: string | number | boolean | string[] | number[] | null;
        field: string;
    }[] | undefined, import("convex/values").VObject<{
        operator?: "in" | "lt" | "lte" | "gt" | "gte" | "eq" | "not_in" | "ne" | "contains" | "starts_with" | "ends_with" | undefined;
        connector?: "AND" | "OR" | undefined;
        value: string | number | boolean | string[] | number[] | null;
        field: string;
    }, {
        field: import("convex/values").VString<string, "required">;
        operator: import("convex/values").VUnion<"in" | "lt" | "lte" | "gt" | "gte" | "eq" | "not_in" | "ne" | "contains" | "starts_with" | "ends_with" | undefined, [import("convex/values").VLiteral<"lt", "required">, import("convex/values").VLiteral<"lte", "required">, import("convex/values").VLiteral<"gt", "required">, import("convex/values").VLiteral<"gte", "required">, import("convex/values").VLiteral<"eq", "required">, import("convex/values").VLiteral<"in", "required">, import("convex/values").VLiteral<"not_in", "required">, import("convex/values").VLiteral<"ne", "required">, import("convex/values").VLiteral<"contains", "required">, import("convex/values").VLiteral<"starts_with", "required">, import("convex/values").VLiteral<"ends_with", "required">], "optional", never>;
        value: import("convex/values").VUnion<string | number | boolean | string[] | number[] | null, [import("convex/values").VString<string, "required">, import("convex/values").VFloat64<number, "required">, import("convex/values").VBoolean<boolean, "required">, import("convex/values").VArray<string[], import("convex/values").VString<string, "required">, "required">, import("convex/values").VArray<number[], import("convex/values").VFloat64<number, "required">, "required">, import("convex/values").VNull<null, "required">], "required", never>;
        connector: import("convex/values").VUnion<"AND" | "OR" | undefined, [import("convex/values").VLiteral<"AND", "required">, import("convex/values").VLiteral<"OR", "required">], "optional", never>;
    }, "required", "value" | "field" | "operator" | "connector">, "optional">;
    sortBy: import("convex/values").VObject<{
        field: string;
        direction: "desc" | "asc";
    } | undefined, {
        field: import("convex/values").VString<string, "required">;
        direction: import("convex/values").VUnion<"desc" | "asc", [import("convex/values").VLiteral<"asc", "required">, import("convex/values").VLiteral<"desc", "required">], "required", never>;
    }, "optional", "field" | "direction">;
    select: import("convex/values").VArray<string[] | undefined, import("convex/values").VString<string, "required">, "optional">;
    limit: import("convex/values").VFloat64<number | undefined, "optional">;
    offset: import("convex/values").VFloat64<number | undefined, "optional">;
}, "required", "select" | "limit" | "model" | "offset" | "sortBy" | "where" | "sortBy.field" | "sortBy.direction">;
export declare const hasUniqueFields: (betterAuthSchema: BetterAuthDBSchema, model: string, input: Record<string, any>) => boolean;
export declare const checkUniqueFields: <Schema extends SchemaDefinition<any, any>>(ctx: GenericQueryCtx<GenericDataModel>, schema: Schema, betterAuthSchema: BetterAuthDBSchema, table: string, input: Record<string, any>, doc?: Record<string, any>) => Promise<void>;
export declare const selectFields: <T extends TableNamesInDataModel<GenericDataModel>, D extends DocumentByName<GenericDataModel, T>>(doc: D | null, select?: string[]) => Promise<D | null>;
export declare const paginate: <Doc extends DocumentByName<GenericDataModel, T>, T extends TableNamesInDataModel<GenericDataModel>>(ctx: GenericQueryCtx<GenericDataModel>, schema: SchemaDefinition<any, any>, betterAuthSchema: BetterAuthDBSchema, args: Infer<typeof adapterArgsValidator> & {
    paginationOpts: PaginationOptions;
}) => Promise<PaginationResult<Doc>>;
export declare const listOne: <Doc extends DocumentByName<GenericDataModel, T>, T extends TableNamesInDataModel<GenericDataModel>>(ctx: GenericQueryCtx<GenericDataModel>, schema: SchemaDefinition<any, any>, betterAuthSchema: BetterAuthDBSchema, args: Infer<typeof adapterArgsValidator>) => Promise<Doc | null>;
//# sourceMappingURL=adapter-utils.d.ts.map