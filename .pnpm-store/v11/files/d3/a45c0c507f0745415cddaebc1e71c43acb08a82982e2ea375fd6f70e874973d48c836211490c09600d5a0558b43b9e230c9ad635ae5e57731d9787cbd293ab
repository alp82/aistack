import type { DataModelFromSchemaDefinition, Expand, GenericDatabaseReader, GenericDataModel, SchemaDefinition, TableNamesInDataModel } from "convex/server";
import type { GenericId, GenericValidator, Infer, ObjectType, OptionalProperty, PropertyValidators, Validator, VAny, VArray, VBoolean, VBytes, VFloat64, VId, VInt64, VLiteral, VNull, VObject, VOptional, VRecord, VString, VUnion } from "convex/values";
import { v } from "convex/values";
/**
 * Helper for defining a union of literals more concisely.
 *
 * e.g. `literals("a", 1, false)` is equivalent to
 * `v.union(v.literal("a"), v.literal(1), v.literal(false))`
 * To use with an array:
 * ```ts
 * const myLiterals = ["a", 1, false] as const;
 * const literalValidator = literals(...myLiterals)
 * ```
 * A similar result can be achieved with `v.union(...myLiterals.map(v.literal))`
 * however the type of each union member will be the union of literal types,
 * rather than each member being a specific literal type.
 *
 * @param args Values you want to use in a union of literals.
 * @returns A validator for the union of the literals.
 */
export declare const literals: <T extends Array<string | number | boolean | bigint>>(...args: T) => VUnion<T[number], NoInfer<{ [K in keyof T]: VLiteral<T[K]>; }>>;
/**
 * nullable define a validator that can be the value or null more consisely.
 *
 * @param x The validator to make nullable. As in, it can be the value or null.
 * @returns A new validator that can be the value or null.
 */
export declare const nullable: <V extends Validator<any, "required", any>>(x: V) => VUnion<(VNull<null, "required"> | V)["type"], [VNull<null, "required">, V], "required", (VNull<null, "required"> | V)["fieldPaths"]>;
/**
 * partial helps you define an object of optional validators more concisely.
 *
 * `partial({a: v.string(), b: v.number()})` is equivalent to
 * `{a: v.optional(v.string()), b: v.optional(v.number())}`
 *
 * @param obj The object of validators to make optional. e.g. {a: v.string()}
 * @returns A new object of validators that can be the value or undefined.
 */
export declare function partial<T extends PropertyValidators>(obj: T): {
    [K in keyof T]: VOptional<T[K]>;
};
/**
 * partial helps you define an object of optional validators more concisely.
 *
 * `partial(v.object({a: v.string(), b: v.number()}))` is equivalent to
 * `v.object({a: v.optional(v.string()), b: v.optional(v.number())})`
 *
 * @param obj The object of validators to make optional. e.g. v.object({a: v.string()})
 * @returns A new object of validators that can be the value or undefined.
 */
export declare function partial<T, V extends Record<string, GenericValidator>, O extends OptionalProperty>(obj: VObject<T, V, O>): PartialVObject<T, V, O>;
/**
 * partial helps you define a union of optional validators more concisely.
 *
 * `partial(v.union(v.object({a: v.string()}), v.object({b: v.number()})))`
 * is equivalent to
 * `v.union(v.object({a: v.optional(v.string())}), v.object({b: v.optional(v.number())}))`
 *
 * @param obj The union of validators to make optional. e.g. v.union(v.object({a: v.string()}), v.object({b: v.number()}))
 * @returns A new union of validators that can be the value or undefined.
 */
export declare function partial<T, V extends Validator<T, "required", any>[], O extends OptionalProperty>(obj: VUnion<T, V, O>): PartialVUnion<T, V, O>;
/**
 * partial helps you define a union of optional validators more concisely.
 *
 * `partial(v.union(v.object({a: v.string()}), v.object({b: v.number()})))`
 * is equivalent to
 * `v.union(v.object({a: v.optional(v.string())}), v.object({b: v.optional(v.number())}))`
 *
 * @param obj The union of validators to make optional. e.g. v.union(v.object({a: v.string()}), v.object({b: v.number()}))
 * @returns A new union of validators that can be the value or undefined.
 */
export declare function partial<Object extends VObject<any, any, any>, Union extends VUnion<any, any[], any>>(obj: Object | Union): PartialVUnion<Union["type"], Union["members"], Object["isOptional"]> | PartialVObject<Object["type"], Object["fields"], Object["isOptional"]>;
type PartialVObject<T, V extends Record<string, GenericValidator>, Optional extends OptionalProperty> = VObject<Partial<T>, {
    [K in keyof V]: VOptional<V[K]>;
}, Optional>;
type PartialUnionMembers<Members extends readonly Validator<any, "required", any>[]> = {
    [K in keyof Members]: Members[K] extends VObject<any, any, "required"> ? Members[K] extends VObject<infer MemberT, infer MemberV extends PropertyValidators, "required"> ? PartialVObject<MemberT, MemberV, "required"> : Members[K] : Members[K] extends VUnion<any, any, "required"> ? Members[K] extends VUnion<infer MemberT, infer MemberV, "required"> ? PartialVUnion<MemberT, MemberV, "required"> : Members[K] : Members[K];
};
type PartialVUnion<T, Members extends Validator<T, "required", any>[], Optional extends OptionalProperty> = VUnion<Partial<T>, PartialUnionMembers<Members>, Optional>;
/** @deprecated Use `v.string()` instead. Any string value. */
export declare const string: VString<string, "required">;
/** @deprecated Use `v.float64()` instead. JavaScript number, represented as a float64 in the database. */
export declare const number: VFloat64<number, "required">;
/** @deprecated Use `v.float64()` instead. JavaScript number, represented as a float64 in the database. */
export declare const float64: VFloat64<number, "required">;
/** @deprecated Use `v.boolean()` instead. boolean value. For typing it only as true, use `l(true)` */
export declare const boolean: VBoolean<boolean, "required">;
/** @deprecated Use `v.int64()` instead. bigint, though stored as an int64 in the database. */
export declare const biging: VInt64<bigint, "required">;
/** @deprecated Use `v.int64()` instead. bigint, though stored as an int64 in the database. */
export declare const int64: VInt64<bigint, "required">;
/** @deprecated Use `v.any()` instead. Any Convex value */
export declare const any: VAny<any, "required", string>;
/** @deprecated Use `v.null()` instead. Null value. Underscore is so it doesn't shadow the null builtin */
export declare const null_: VNull<null, "required">;
/** @deprecated Use `v.*()` instead. */
export declare const id: <TableName extends string>(tableName: TableName) => VId<GenericId<TableName>, "required">, object: <T_2 extends PropertyValidators>(fields: T_2) => VObject<Expand<{ [Property in { [Property_1 in keyof T_2]: T_2[Property_1]["isOptional"] extends "optional" ? Property_1 : never; }[keyof T_2]]?: Exclude<Infer<T_2[Property]>, undefined>; } & { [Property_1 in Exclude<keyof T_2, { [Property in keyof T_2]: T_2[Property]["isOptional"] extends "optional" ? Property : never; }[keyof T_2]>]: Infer<T_2[Property_1]>; }>, T_2, "required", { [Property_2 in keyof T_2]: Property_2 | `${Property_2 & string}.${T_2[Property_2]["fieldPaths"]}`; }[keyof T_2] & string>, array: <T_1 extends Validator<any, "required", any>>(element: T_1) => VArray<T_1["type"][], T_1, "required">, bytes: () => VBytes<ArrayBuffer, "required">, literal: <T extends string | number | bigint | boolean>(literal: T) => VLiteral<T, "required">, optional: <T_4 extends GenericValidator>(value: T_4) => VOptional<T_4>, union: <T_3 extends Validator<any, "required", any>[]>(...members: T_3) => VUnion<T_3[number]["type"], T_3, "required", T_3[number]["fieldPaths"]>;
/** @deprecated Use `v.bytes()` instead. ArrayBuffer validator. */
export declare const arrayBuffer: VBytes<ArrayBuffer, "required">;
/**
 * Utility to get the validators for fields associated with a table.
 * e.g. for systemFields("users") it would return:
 * { _id: v.id("users"), _creationTime: v.number() }
 *
 * @param tableName The table name in the schema.
 * @returns Validators for the system fields: _id and _creationTime
 */
export declare const systemFields: <TableName extends string>(tableName: TableName) => {
    _id: VId<GenericId<TableName>, "required">;
    _creationTime: VFloat64<number, "required">;
};
export type SystemFields<TableName extends string> = ReturnType<typeof systemFields<TableName>>;
/**
 * Utility to add system fields to an object with fields mapping to validators.
 * e.g. withSystemFields("users", { name: v.string() }) would return:
 * { name: v.string(), _id: v.id("users"), _creationTime: v.number() }
 *
 * @param tableName Table name in the schema.
 * @param fields The fields of the table mapped to their validators.
 * @returns The fields plus system fields _id and _creationTime.
 */
export declare const withSystemFields: <TableName extends string, T extends Record<string, GenericValidator>>(tableName: TableName, fields: T) => Expand<T & {
    _id: VId<GenericId<TableName>, "required">;
    _creationTime: VFloat64<number, "required">;
}>;
export type AddFieldsToValidator<V extends Validator<any, any, any>, Fields extends PropertyValidators> = V extends VObject<infer T, infer F, infer O> ? VObject<Expand<T & ObjectType<Fields>>, Expand<F & Fields>, O> : Validator<Expand<V["type"] & ObjectType<Fields>>, V["isOptional"], V["fieldPaths"] & {
    [Property in keyof Fields & string]: `${Property}.${Fields[Property]["fieldPaths"]}` | Property;
}[keyof Fields & string] & string>;
/**
 * Equivalent to `v.object({ ...validator, ...fields })`.
 */
export declare function addFieldsToValidator<Props extends PropertyValidators, Fields extends PropertyValidators>(validator: Props, fields: Fields): VObject<ObjectType<Props & Fields>, Props & Fields, "required">;
/**
 * Add fields to an object validator.
 * Equivalent to `v.object({ ...validator.fields, ...fields })`.
 */
export declare function addFieldsToValidator<V extends VObject<any, any, any>, Fields extends PropertyValidators>(validator: V, fields: Fields): VObject<V["type"] & ObjectType<Fields>, V["fields"] & Fields, V["isOptional"]>;
/**
 * Add fields to a union validator.
 * Equivalent to `v.union(...validator.members.map((m) => addFieldsToValidator(m, fields)))`.
 */
export declare function addFieldsToValidator<V extends VUnion<any, any[], any>, Fields extends PropertyValidators>(validator: V, fields: Fields): AddFieldsToValidator<V, Fields>;
export declare function addFieldsToValidator<V extends VObject<any, any, any> | VUnion<any, any[], any>, Fields extends PropertyValidators>(validator: V, fields: Fields): AddFieldsToValidator<V, Fields>;
export declare const doc: <Schema extends SchemaDefinition<any, boolean>, TableName extends TableNamesInDataModel<DataModelFromSchemaDefinition<Schema>>>(schema: Schema, tableName: TableName) => AddFieldsToValidator<Schema["tables"][TableName]["validator"], SystemFields<TableName>>;
/**
 * Creates a validator with a type-safe `.id(table)` and a new `.doc(table)`.
 * Can be used instead of `v` for function arugments & return validators.
 * However, it cannot be used as part of defining a schema, since it would be
 * circular.
 * ```ts
 * import schema from "./schema";
 * export const vv = typedV(schema);
 *
 * export const myQuery = query({
 *   args: { docId: vv.id("mytable") },
 *   returns: vv.doc("mytable"),
 *   handler: (ctx, args) => ctx.db.get(args.docId),
 * })
 *
 * @param schema Typically from `import schema from "./schema"`.
 * @returns A validator like `v` with type-safe `v.id` and a new `v.doc`
 */
export declare function typedV<Schema extends SchemaDefinition<any, boolean>>(schema: Schema): Omit<typeof v, "id"> & {
    id: <TableName extends TableNamesInDataModel<DataModelFromSchemaDefinition<Schema>>>(tableName: TableName) => VId<GenericId<TableName>, "required">;
    doc: <TableName extends TableNamesInDataModel<DataModelFromSchemaDefinition<Schema>>>(tableName: TableName) => AddFieldsToValidator<Schema["tables"][TableName]["validator"], SystemFields<TableName>>;
};
/**
 * A string validator that is a branded string type.
 *
 * Read more at https://stack.convex.dev/using-branded-types-in-validators
 *
 * @param _brand - A unique string literal to brand the string with
 */
export declare const brandedString: <T extends string>(_brand: T) => VString<string & {
    _: T;
}>;
/** Mark fields as deprecated with this permissive validator typed as null */
export declare const deprecated: Validator<null, "optional">;
/** A maximally permissive validator that type checks as a given validator.
 *
 * If you want to have types that match some validator but you have invalid data
 * and you want to temporarily not validate schema for this field,
 * you can use this function to cast the permissive validator.
 *
 * Example in a schema:
 * ```ts
 * export default defineSchema({
 *   myTable: defineTable({
 *    myString: pretend(v.array(v.string())),
 *   }),
 * });
 * //...in some mutation
 * ctx.db.insert("myTable", { myString: 123 as any }); // no runtime error
 * ```
 * Example in function argument validation:
 * ```ts
 * const myQuery = defineQuery({
 *   args: { myNumber: pretend(v.number()) },
 *   handler: async (ctx, args) => {
 *     // args.myNumber is typed as number, but it's not validated.
 *     const num = typeof args.myNumber === "number" ?
 *       args.myNumber : Number(args.myNumber);
 *   },
 * });
 */
export declare const pretend: <T extends GenericValidator>(_typeToImmitate: T) => T;
/** A validator that validates as optional but type checks as required.
 *
 * If you want to assume a field is set for type checking, but your data may not
 * actually have it set for all documents (e.g. when adding a new field),
 * you can use this function to allow the field to be unset at runtime.
 * This is unsafe, but can be convenient in these situations:
 *
 * 1. You are developing locally and want to add a required field and write
 *   code assuming it is set. Once you push the code & schema, you can update
 *   the data to match before running your code.
 * 2. You are going to run a migration right after pushing code, and are ok with
 *   and you don't want to edit your code to handle the field being unset,
 *   your app being in an inconsistent state until the migration completes.
 *
 * This differs from {@link pretend} in that it type checks the inner validator,
 * if the value is provided.
 *
 * Example in a schema:
 * ```ts
 * export default defineSchema({
 *   myTable: defineTable({
 *    myString: pretendRequired(v.array(v.string())),
 *   }),
 * });
 * //...in some mutation
 * ctx.db.insert("myTable", { myString: undefined }); // no runtime error
 * ```
 * Example in function argument validation:
 * ```ts
 * const myQuery = defineQuery({
 *   args: { myNumber: pretendRequired(v.number()) },
 *   handler: async (ctx, args) => {
 *     // args.myNumber is typed as number, but it might be undefined
 *     const num = args.myNumber || 0;
 *   },
 * });
 */
export declare const pretendRequired: <T extends Validator<any, "required", any>>(optionalType: T) => T;
export declare class ValidationError extends Error {
    expected: string;
    got: string;
    path?: string | undefined;
    constructor(expected: string, got: string, path?: string | undefined);
}
/**
 * Validate a value against a validator.
 *
 * WARNING: This does not validate that v.id is an ID for the given table.
 * It only validates that the ID is a string. Function `args`, `returns` and
 * schema definitions will validate that the ID is an ID for the given table.
 *
 * @param validator The validator to validate against.
 * @param value The value to validate.
 * @returns Whether the value is valid against the validator.
 */
export declare function validate<T extends Validator<any, any, any>>(validator: T, value: unknown, opts?: {
    throw?: boolean;
    db?: GenericDatabaseReader<GenericDataModel>;
    allowUnknownFields?: boolean;
    _pathPrefix?: string;
}): value is T["type"];
/**
 * Parse a value, using a Convex validator. This differs from `validate` in that
 * it strips unknown fields instead of throwing an error on them.
 *
 * @param validator - The Convex validator to parse the value against.
 * @param value - The value to parse.
 * @returns The parsed value, without fields not specified in the validator.
 */
export declare function parse<T extends Validator<any, any, any>>(validator: T, value: unknown): Infer<T>;
type NotUndefined<T> = Exclude<T, undefined>;
/**
 * A type that converts an optional validator to a required validator.
 *
 * This is the inverse of `VOptional`. It takes a validator that may be optional
 * and returns the equivalent required validator type.
 *
 * @example
 * ```ts
 * type OptionalString = VOptional<VString<string, "required">>;
 * type RequiredString = VRequired<OptionalString>; // VString<string, "required">
 * ```
 */
export type VRequired<T extends Validator<any, OptionalProperty, any>> = T extends VId<infer Type, OptionalProperty> ? VId<NotUndefined<Type>, "required"> : T extends VString<infer Type, OptionalProperty> ? VString<NotUndefined<Type>, "required"> : T extends VFloat64<infer Type, OptionalProperty> ? VFloat64<NotUndefined<Type>, "required"> : T extends VInt64<infer Type, OptionalProperty> ? VInt64<NotUndefined<Type>, "required"> : T extends VBoolean<infer Type, OptionalProperty> ? VBoolean<NotUndefined<Type>, "required"> : T extends VNull<infer Type, OptionalProperty> ? VNull<NotUndefined<Type>, "required"> : T extends VAny<infer Type, OptionalProperty> ? VAny<NotUndefined<Type>, "required"> : T extends VLiteral<infer Type, OptionalProperty> ? VLiteral<NotUndefined<Type>, "required"> : T extends VBytes<infer Type, OptionalProperty> ? VBytes<NotUndefined<Type>, "required"> : T extends VObject<infer Type, infer Fields, OptionalProperty, infer FieldPaths> ? VObject<NotUndefined<Type>, Fields, "required", FieldPaths> : T extends VArray<infer Type, infer Element, OptionalProperty> ? VArray<NotUndefined<Type>, Element, "required"> : T extends VRecord<infer Type, infer Key, infer Value, OptionalProperty, infer FieldPaths> ? VRecord<NotUndefined<Type>, Key, Value, "required", FieldPaths> : T extends VUnion<infer Type, infer Members, OptionalProperty, infer FieldPaths> ? VUnion<NotUndefined<Type>, Members, "required", FieldPaths> : never;
/**
 * Converts an optional validator to a required validator.
 *
 * This is the inverse of `v.optional()`. It takes a validator that may be optional
 * and returns the equivalent required validator.
 *
 * ```ts
 * const optionalString = v.optional(v.string());
 * const requiredString = vRequired(optionalString); // v.string()
 *
 * // Already required validators are returned as-is
 * const alreadyRequired = v.string();
 * const stillRequired = vRequired(alreadyRequired); // v.string()
 * ```
 *
 * @param validator The validator to make required.
 * @returns A required version of the validator.
 */
export declare function vRequired<T extends Validator<any, OptionalProperty, any>>(validator: T): VRequired<T>;
export {};
//# sourceMappingURL=validators.d.ts.map