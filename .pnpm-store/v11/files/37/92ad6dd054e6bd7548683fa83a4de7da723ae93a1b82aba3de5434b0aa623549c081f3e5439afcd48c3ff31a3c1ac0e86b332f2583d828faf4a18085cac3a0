import type { GenericId, GenericValidator, ObjectType, OptionalProperty, PropertyValidators, Validator, VAny, VArray, VBoolean, VBytes, VFloat64, VId, VInt64, VLiteral, VNull, VObject, VOptional, VRecord, VString, VUnion } from "convex/values";
import * as zCore from "zod/v4/core";
import * as z from "zod/v4";
import type { ActionBuilder, ArgsArrayToObject, DefaultFunctionArgs, FunctionVisibility, GenericActionCtx, GenericDataModel, GenericMutationCtx, GenericQueryCtx, MutationBuilder, QueryBuilder, TableNamesInDataModel } from "convex/server";
import { type Expand } from "../index.js";
import type { Customization, Registration } from "./customFunctions.js";
import { type VRequired } from "../validators.js";
/**
 * zCustomQuery is like customQuery, but allows validation via zod.
 * You can define custom behavior on top of `query` or `internalQuery`
 * by passing a function that modifies the ctx and args. Or NoOp to do nothing.
 *
 * Example usage:
 * ```ts
 * const myQueryBuilder = zCustomQuery(query, {
 *   args: { sessionId: v.id("sessions") },
 *   input: async (ctx, args) => {
 *     const user = await getUserOrNull(ctx);
 *     const session = await db.get(sessionId);
 *     const db = wrapDatabaseReader({ user }, ctx.db, rlsRules);
 *     return { ctx: { db, user, session }, args: {} };
 *   },
 * });
 *
 * // Using the custom builder
 * export const getSomeData = myQueryBuilder({
 *   args: { someArg: z.string() },
 *   handler: async (ctx, args) => {
 *     const { db, user, session, scheduler } = ctx;
 *     const { someArg } = args;
 *     // ...
 *   }
 * });
 * ```
 *
 * Simple usage only modifying ctx:
 * ```ts
 * const myInternalQuery = zCustomQuery(
 *   internalQuery,
 *   customCtx(async (ctx) => {
 *     return {
 *       // Throws an exception if the user isn't logged in
 *       user: await getUserByTokenIdentifier(ctx),
 *     };
 *   })
 * );
 *
 * // Using it
 * export const getUser = myInternalQuery({
 *   args: { email: z.string().email() },
 *   handler: async (ctx, args) => {
 *     console.log(args.email);
 *     return ctx.user;
 *   },
 * });
 *
 * @param query The query to be modified. Usually `query` or `internalQuery`
 *   from `_generated/server`.
 * @param customization The customization to be applied to the query, changing ctx and args.
 * @returns A new query builder using zod validation to define queries.
 */
export declare function zCustomQuery<CustomArgsValidator extends PropertyValidators, CustomCtx extends Record<string, any>, CustomMadeArgs extends Record<string, any>, Visibility extends FunctionVisibility, DataModel extends GenericDataModel, ExtraArgs extends Record<string, any> = object>(query: QueryBuilder<DataModel, Visibility>, customization: Customization<GenericQueryCtx<DataModel>, CustomArgsValidator, CustomCtx, CustomMadeArgs, ExtraArgs>): CustomBuilder<"query", CustomArgsValidator, CustomCtx, CustomMadeArgs, GenericQueryCtx<DataModel>, Visibility, ExtraArgs>;
/**
 * zCustomMutation is like customMutation, but allows validation via zod.
 * You can define custom behavior on top of `mutation` or `internalMutation`
 * by passing a function that modifies the ctx and args. Or NoOp to do nothing.
 *
 * Example usage:
 * ```ts
 * const myMutationBuilder = zCustomMutation(mutation, {
 *   args: { sessionId: v.id("sessions") },
 *   input: async (ctx, args) => {
 *     const user = await getUserOrNull(ctx);
 *     const session = await db.get(sessionId);
 *     const db = wrapDatabaseReader({ user }, ctx.db, rlsRules);
 *     return { ctx: { db, user, session }, args: {} };
 *   },
 * });
 *
 * // Using the custom builder
 * export const getSomeData = myMutationBuilder({
 *   args: { someArg: z.string() },
 *   handler: async (ctx, args) => {
 *     const { db, user, session, scheduler } = ctx;
 *     const { someArg } = args;
 *     // ...
 *   }
 * });
 * ```
 *
 * Simple usage only modifying ctx:
 * ```ts
 * const myInternalMutation = zCustomMutation(
 *   internalMutation,
 *   customCtx(async (ctx) => {
 *     return {
 *       // Throws an exception if the user isn't logged in
 *       user: await getUserByTokenIdentifier(ctx),
 *     };
 *   })
 * );
 *
 * // Using it
 * export const getUser = myInternalMutation({
 *   args: { email: z.string().email() },
 *   handler: async (ctx, args) => {
 *     console.log(args.email);
 *     return ctx.user;
 *   },
 * });
 *
 * @param mutation The mutation to be modified. Usually `mutation` or `internalMutation`
 *   from `_generated/server`.
 * @param customization The customization to be applied to the mutation, changing ctx and args.
 * @returns A new mutation builder using zod validation to define queries.
 */
export declare function zCustomMutation<CustomArgsValidator extends PropertyValidators, CustomCtx extends Record<string, any>, CustomMadeArgs extends Record<string, any>, Visibility extends FunctionVisibility, DataModel extends GenericDataModel, ExtraArgs extends Record<string, any> = object>(mutation: MutationBuilder<DataModel, Visibility>, customization: Customization<GenericMutationCtx<DataModel>, CustomArgsValidator, CustomCtx, CustomMadeArgs, ExtraArgs>): CustomBuilder<"mutation", CustomArgsValidator, CustomCtx, CustomMadeArgs, GenericMutationCtx<DataModel>, Visibility, ExtraArgs>;
/**
 * zCustomAction is like customAction, but allows validation via zod.
 * You can define custom behavior on top of `action` or `internalAction`
 * by passing a function that modifies the ctx and args. Or NoOp to do nothing.
 *
 * Example usage:
 * ```ts
 * const myActionBuilder = zCustomAction(action, {
 *   args: { sessionId: v.id("sessions") },
 *   input: async (ctx, args) => {
 *     const user = await getUserOrNull(ctx);
 *     const session = await db.get(sessionId);
 *     const db = wrapDatabaseReader({ user }, ctx.db, rlsRules);
 *     return { ctx: { db, user, session }, args: {} };
 *   },
 * });
 *
 * // Using the custom builder
 * export const getSomeData = myActionBuilder({
 *   args: { someArg: z.string() },
 *   handler: async (ctx, args) => {
 *     const { db, user, session, scheduler } = ctx;
 *     const { someArg } = args;
 *     // ...
 *   }
 * });
 * ```
 *
 * Simple usage only modifying ctx:
 * ```ts
 * const myInternalAction = zCustomAction(
 *   internalAction,
 *   customCtx(async (ctx) => {
 *     return {
 *       // Throws an exception if the user isn't logged in
 *       user: await getUserByTokenIdentifier(ctx),
 *     };
 *   })
 * );
 *
 * // Using it
 * export const getUser = myInternalAction({
 *   args: { email: z.string().email() },
 *   handler: async (ctx, args) => {
 *     console.log(args.email);
 *     return ctx.user;
 *   },
 * });
 *
 * @param action The action to be modified. Usually `action` or `internalAction`
 *   from `_generated/server`.
 * @param customization The customization to be applied to the action, changing ctx and args.
 * @returns A new action builder using zod validation to define queries.
 */
export declare function zCustomAction<CustomArgsValidator extends PropertyValidators, CustomCtx extends Record<string, any>, CustomMadeArgs extends Record<string, any>, Visibility extends FunctionVisibility, DataModel extends GenericDataModel, ExtraArgs extends Record<string, any> = object>(action: ActionBuilder<DataModel, Visibility>, customization: Customization<GenericActionCtx<DataModel>, CustomArgsValidator, CustomCtx, CustomMadeArgs, ExtraArgs>): CustomBuilder<"action", CustomArgsValidator, CustomCtx, CustomMadeArgs, GenericActionCtx<DataModel>, Visibility, ExtraArgs>;
/**
 * Creates a validator for a Convex `Id`.
 *
 * - When **used within Zod**, it will only check that the ID is a string.
 * - When **converted to a Convex validator** (e.g. through {@link zodToConvex}),
 *   it will check that it's for the right table.
 *
 * @param tableName - The table that the `Id` references. i.e. `Id<tableName>`
 * @returns A Zod schema representing a Convex `Id`
 */
export declare const zid: <DataModel extends GenericDataModel, TableName extends TableNamesInDataModel<DataModel> = TableNamesInDataModel<DataModel>>(tableName: TableName) => Zid<TableName>;
/** The type of Convex validators in Zod */
export type Zid<TableName extends string> = z.ZodCustom<GenericId<TableName>> & zCore.$ZodRecordKey;
/**
 * Useful to get the input context type for a custom function using Zod.
 */
export type ZCustomCtx<Builder> = Builder extends CustomBuilder<any, any, infer CustomCtx, any, infer InputCtx, any, any> ? Overwrite<InputCtx, CustomCtx> : never;
/**
 * Turns a Zod or Zod Mini validator into a Convex validator.
 *
 * The Convex validator will be as close to possible to the Zod validator,
 * but might be broader than the Zod validator:
 *
 * ```ts
 * zodToConvex(z.string().email()) // → v.string()
 * ```
 *
 * This function is useful when running the Zod validator _after_ running the Convex validator
 * (i.e. the Convex validator validates the input of the Zod validator). Hence, the Convex types
 * will match the _input type_ of Zod transformations:
 * ```ts
 * zodToConvex(z.object({
 *   name: z.string().default("Nicolas"),
 * })) // → v.object({ name: v.optional(v.string()) })
 *
 * zodToConvex(z.object({
 *   name: z.string().transform(s => s.length)
 * })) // → v.object({ name: v.string() })
 * ````
 *
 * This function is useful for:
 * * **Validating function arguments with Zod**: through {@link zCustomQuery},
 *   {@link zCustomMutation} and {@link zCustomAction}, you can define the argument validation logic
 *   using Zod validators instead of Convex validators. `zodToConvex` will generate a Convex validator
 *   from your Zod validator. This will allow you to:
 *     - validate at run time that Convex IDs are from the right table (using {@link zid})
 *     - allow some features of Convex to understand the expected shape of the arguments
 *       (e.g. argument validation/prefilling in the function runner on the Convex dashboard)
 *     - still run the full Zod validation when the function runs
 *       (which is useful for more advanced Zod validators like `z.string().email()`)
 * * **Validating data after reading it from the database**: if you want to write your DB schema
 *   with Zod, you can run Zod whenever you read from the database to check that the data
 *   still matches the schema. Note that this approach won’t ensure that the data stored in the DB
 *   matches the Zod schema; see
 *   https://stack.convex.dev/typescript-zod-function-validation#can-i-use-zod-to-define-my-database-types-too
 *   for more details.
 *
 * Note that some values might be valid in Zod but not in Convex,
 * in the same way that valid JavaScript values might not be valid
 * Convex values for the corresponding Convex type.
 * (see the limits of Convex data types on https://docs.convex.dev/database/types).
 *
 * ```
 * ┌─────────────────────────────────────┬─────────────────────────────────────┐
 * │          **zodToConvex**            │          zodOutputToConvex          │
 * ├─────────────────────────────────────┼─────────────────────────────────────┤
 * │ For when the Zod validator runs     │ For when the Zod validator runs     │
 * │ _after_ the Convex validator        │ _before_ the Convex validator       │
 * ├─────────────────────────────────────┼─────────────────────────────────────┤
 * │ Convex types use the _input types_  │ Convex types use the _return types_ │
 * │ of Zod transformations              │ of Zod transformations              │
 * ├─────────────────────────────────────┼─────────────────────────────────────┤
 * │ The Convex validator can be less    │ The Convex validator can be less    │
 * │ strict (i.e. some inputs might be   │ strict (i.e. the type in Convex can │
 * │ accepted by Convex then rejected    │ be less precise than the type in    │
 * │ by Zod)                             │ the Zod output)                     │
 * ├─────────────────────────────────────┼─────────────────────────────────────┤
 * │ When using Zod schemas              │ When using Zod schemas              │
 * │ for function definitions:           │ for function definitions:           │
 * │ used for _arguments_                │ used for _return values_            │
 * ├─────────────────────────────────────┼─────────────────────────────────────┤
 * │ When validating contents of the     │ When validating contents of the     │
 * │ database with a Zod schema:         │ database with a Zod schema:         │
 * │ used to validate data               │ used to validate data               │
 * │ _after reading_                     │ _before writing_                    │
 * └─────────────────────────────────────┴─────────────────────────────────────┘
 * ```
 *
 * @param zod Zod validator can be a Zod object, or a Zod type like `z.string()`
 * @returns Convex Validator (e.g. `v.string()` from "convex/values")
 * @throws If there is no equivalent Convex validator for the value (e.g. `z.date()`)
 */
export declare function zodToConvex<Z extends zCore.$ZodType>(validator: Z): ConvexValidatorFromZod<Z, "required">;
/**
 * Converts a Zod or Zod Mini validator to a Convex validator that checks the value _after_
 * it has been validated (and possibly transformed) by the Zod validator.
 *
 * This is similar to {@link zodToConvex}, but is meant for cases where the Convex
 * validator runs _after_ the Zod validator. Thus, the Convex type refers to the
 * _output_ type of the Zod transformations:
 * ```ts
 * zodOutputToConvex(z.object({
 *   name: z.string().default("Nicolas"),
 * })) // → v.object({ name: v.string() })
 *
 * zodOutputToConvex(z.object({
 *   name: z.string().transform(s => s.length)
 * })) // → v.object({ name: v.number() })
 * ````
 *
 * This function can be useful for:
 * - **Validating function return values with Zod**: through {@link zCustomQuery},
 *   {@link zCustomMutation} and {@link zCustomAction}, you can define the `returns` property
 *   of a function using Zod validators instead of Convex validators.
 * - **Validating data after reading it from the database**: if you want to write your DB schema
 *   Zod validators, you can run Zod whenever you write to the database to ensure your data matches
 *   the expected format. Note that this approach won’t ensure that the data stored in the DB
 *   isn’t modified manually in a way that doesn’t match your Zod schema; see
 *   https://stack.convex.dev/typescript-zod-function-validation#can-i-use-zod-to-define-my-database-types-too
 *   for more details.
 *
 * ```
 * ┌─────────────────────────────────────┬─────────────────────────────────────┐
 * │            zodToConvex              │        **zodOutputToConvex**        │
 * ├─────────────────────────────────────┼─────────────────────────────────────┤
 * │ For when the Zod validator runs     │ For when the Zod validator runs     │
 * │ _after_ the Convex validator        │ _before_ the Convex validator       │
 * ├─────────────────────────────────────┼─────────────────────────────────────┤
 * │ Convex types use the _input types_  │ Convex types use the _return types_ │
 * │ of Zod transformations              │ of Zod transformations              │
 * ├─────────────────────────────────────┼─────────────────────────────────────┤
 * │ The Convex validator can be less    │ The Convex validator can be less    │
 * │ strict (i.e. some inputs might be   │ strict (i.e. the type in Convex can │
 * │ accepted by Convex then rejected    │ be less precise than the type in    │
 * │ by Zod)                             │ the Zod output)                     │
 * ├─────────────────────────────────────┼─────────────────────────────────────┤
 * │ When using Zod schemas              │ When using Zod schemas              │
 * │ for function definitions:           │ for function definitions:           │
 * │ used for _arguments_                │ used for _return values_            │
 * ├─────────────────────────────────────┼─────────────────────────────────────┤
 * │ When validating contents of the     │ When validating contents of the     │
 * │ database with a Zod schema:         │ database with a Zod schema:         │
 * │ used to validate data               │ used to validate data               │
 * │ _after reading_                     │ _before writing_                    │
 * └─────────────────────────────────────┴─────────────────────────────────────┘
 * ```
 *
 * @param z The zod validator
 * @returns Convex Validator (e.g. `v.string()` from "convex/values")
 * @throws If there is no equivalent Convex validator for the value (e.g. `z.date()`)
 */
export declare function zodOutputToConvex<Z extends zCore.$ZodType>(validator: Z): ConvexValidatorFromZodOutput<Z, "required">;
type ZodFields = Record<string, zCore.$ZodType>;
/**
 * Like {@link zodToConvex}, but it takes in a bare object, as expected by Convex
 * function arguments, or the argument to {@link defineTable}.
 *
 * ```ts
 * zodToConvexFields({
 *   name: z.string().default("Nicolas"),
 * }) // → { name: v.optional(v.string()) }
 * ```
 *
 * @param fields Object with string keys and Zod validators as values
 * @returns Object with the same keys, but with Convex validators as values
 */
export declare function zodToConvexFields<Fields extends ZodFields>(fields: Fields): { [k in keyof Fields]: Fields[k] extends zCore.$ZodType ? ConvexValidatorFromZod<Fields[k], "required"> : never; };
/**
 * Like {@link zodOutputToConvex}, but it takes in a bare object, as expected by
 * Convex function arguments, or the argument to {@link defineTable}.
 *
 * ```ts
 * zodOutputToConvexFields({
 *   name: z.string().default("Nicolas"),
 * }) // → { name: v.string() }
 * ```
 *
 * This is different from {@link zodToConvexFields} because it generates the
 * Convex validator for the output of the Zod validator, not the input;
 * see the documentation of {@link zodToConvex} and {@link zodOutputToConvex}
 * for more details.
 *
 * @param zod Object with string keys and Zod validators as values
 * @returns Object with the same keys, but with Convex validators as values
 */
export declare function zodOutputToConvexFields<Fields extends ZodFields>(fields: Fields): { [k in keyof Fields]: ConvexValidatorFromZodOutput<Fields[k], "required">; };
/**
 * Turns a Convex validator into a Zod validator.
 *
 * This is useful when you want to use types you defined using Convex validators
 * with external libraries that expect to receive a Zod validator.
 *
 * ```ts
 * convexToZod(v.string()) // → z.string()
 * ```
 *
 * This function returns Zod validators, not Zod Mini validators.
 *
 * @param convexValidator Convex validator can be any validator from "convex/values" e.g. `v.string()`
 * @returns Zod validator (e.g. `z.string()`) with inferred type matching the Convex validator
 */
export declare function convexToZod<V extends GenericValidator>(convexValidator: V): ZodValidatorFromConvex<V>;
/**
 * Like {@link convexToZod}, but it takes in a bare object, as expected by Convex
 * function arguments, or the argument to {@link defineTable}.
 *
 * ```ts
 * convexToZodFields({
 *   name: v.string(),
 * }) // → { name: z.string() }
 * ```
 *
 * @param convexValidators Object with string keys and Convex validators as values
 * @returns Object with the same keys, but with Zod validators as values
 */
export declare function convexToZodFields<C extends PropertyValidators>(convexValidators: C): { [k in keyof C]: ZodValidatorFromConvex<C[k]>; };
/**
 * Zod helper for adding Convex system fields to a record to return.
 *
 * ```ts
 * withSystemFields("users", {
 *   name: z.string(),
 * })
 * // → {
 * //   name: z.string(),
 * //   _id: zid("users"),
 * //   _creationTime: z.number(),
 * // }
 * ```
 *
 * @param tableName - The table where records are from, i.e. Doc<tableName>
 * @param zObject - Validators for the user-defined fields on the document.
 * @returns Zod shape for use with `z.object(shape)` that includes system fields.
 */
export declare function withSystemFields<Table extends string, T extends {
    [key: string]: zCore.$ZodType;
}>(tableName: Table, zObject: T): T & {
    _id: Zid<Table>;
    _creationTime: z.ZodNumber;
};
/**
 * A builder that customizes a Convex function, whether or not it validates
 * arguments. If the customization requires arguments, however, the resulting
 * builder will require argument validation too.
 */
export type CustomBuilder<FuncType extends "query" | "mutation" | "action", CustomArgsValidator extends PropertyValidators, CustomCtx extends Record<string, any>, CustomMadeArgs extends Record<string, any>, InputCtx, Visibility extends FunctionVisibility, ExtraArgs extends Record<string, any>> = {
    <ArgsValidator extends ZodFields | zCore.$ZodObject<any> | void, ReturnsZodValidator extends zCore.$ZodType | ZodFields | void = void, ReturnValue extends ReturnValueInput<ReturnsZodValidator> = any>(func: ({
        /**
         * Specify the arguments to the function as a Zod validator.
         */
        args?: ArgsValidator;
        handler: (ctx: Overwrite<InputCtx, CustomCtx>, ...args: ArgsForHandlerType<ArgsOutput<ArgsValidator>, CustomMadeArgs>) => ReturnValue;
        /**
         * Validates the value returned by the function.
         * Note: you can't pass an object directly without wrapping it
         * in `z.object()`.
         */
        returns?: ReturnsZodValidator;
        /**
         * If true, the function will not be validated by Convex,
         * in case you're seeing performance issues with validating twice.
         */
        skipConvexValidation?: boolean;
    } & {
        [key in keyof ExtraArgs as key extends "args" | "handler" | "skipConvexValidation" | "returns" ? never : key]: ExtraArgs[key];
    }) | {
        (ctx: Overwrite<InputCtx, CustomCtx>, ...args: ArgsForHandlerType<ArgsOutput<ArgsValidator>, CustomMadeArgs>): ReturnValue;
    }): Registration<FuncType, Visibility, ArgsArrayToObject<CustomArgsValidator extends Record<string, never> ? ArgsInput<ArgsValidator> : ArgsInput<ArgsValidator> extends [infer A] ? [Expand<A & ObjectType<CustomArgsValidator>>] : [ObjectType<CustomArgsValidator>]>, ReturnsZodValidator extends void ? ReturnValue : ReturnValueOutput<ReturnsZodValidator>>;
};
type ArgsForHandlerType<OneOrZeroArgs extends [] | [Record<string, any>], CustomMadeArgs extends Record<string, any>> = CustomMadeArgs extends Record<string, never> ? OneOrZeroArgs : OneOrZeroArgs extends [infer A] ? [Expand<A & CustomMadeArgs>] : [CustomMadeArgs];
type NullToUndefinedOrNull<T> = T extends null ? T | undefined | void : T;
type Returns<T> = Promise<NullToUndefinedOrNull<T>> | NullToUndefinedOrNull<T>;
type ReturnValueInput<ReturnsValidator extends zCore.$ZodType | ZodFields | void> = [ReturnsValidator] extends [zCore.$ZodType] ? Returns<zCore.input<ReturnsValidator>> : [ReturnsValidator] extends [ZodFields] ? Returns<zCore.input<zCore.$ZodObject<ReturnsValidator>>> : any;
type ReturnValueOutput<ReturnsValidator extends zCore.$ZodType | ZodFields | void> = [ReturnsValidator] extends [zCore.$ZodType] ? Returns<zCore.output<ReturnsValidator>> : [ReturnsValidator] extends [ZodFields] ? Returns<zCore.output<zCore.$ZodObject<ReturnsValidator, zCore.$strict>>> : any;
type ArgsInput<ArgsValidator extends ZodFields | zCore.$ZodObject<any> | void> = [
    ArgsValidator
] extends [zCore.$ZodObject<any>] ? [zCore.input<ArgsValidator>] : ArgsValidator extends Record<string, never> ? [
    {}
] : [ArgsValidator] extends [Record<string, z.ZodTypeAny>] ? [zCore.input<zCore.$ZodObject<ArgsValidator, zCore.$strict>>] : OneArgArray;
type ArgsOutput<ArgsValidator extends ZodFields | zCore.$ZodObject<any> | void> = [ArgsValidator] extends [zCore.$ZodObject<any>] ? [zCore.output<ArgsValidator>] : [ArgsValidator] extends [ZodFields] ? [zCore.output<zCore.$ZodObject<ArgsValidator, zCore.$strict>>] : OneArgArray;
type Overwrite<T, U> = Omit<T, keyof U> & U;
type OneArgArray<ArgsObject extends DefaultFunctionArgs = DefaultFunctionArgs> = [
    ArgsObject
];
/**
 * Return type of {@link zodToConvex}.
 */
export type ConvexValidatorFromZod<Z extends zCore.$ZodType, IsOptional extends "required" | "optional"> = IsUnknownOrAny<Z> extends true ? GenericValidator : Z extends zCore.$ZodDefault<infer Inner extends zCore.$ZodType> ? VOptional<ConvexValidatorFromZod<Inner, "optional">> : Z extends zCore.$ZodPipe<infer Input extends zCore.$ZodType, infer _Output extends zCore.$ZodType> ? ConvexValidatorFromZod<Input, IsOptional> : ConvexValidatorFromZodCommon<Z, IsOptional>;
/**
 * Return type of {@link zodOutputToConvex}.
 */
export type ConvexValidatorFromZodOutput<Z extends zCore.$ZodType, IsOptional extends "required" | "optional"> = IsUnknownOrAny<Z> extends true ? GenericValidator : Z extends zCore.$ZodDefault<infer Inner extends zCore.$ZodType> ? VRequired<ConvexValidatorFromZod<Inner, "required">> : Z extends zCore.$ZodPipe<infer _Input extends zCore.$ZodType, infer Output extends zCore.$ZodType> ? ConvexValidatorFromZod<Output, IsOptional> : ConvexValidatorFromZodCommon<Z, IsOptional>;
type ConvexValidatorFromZodCommon<Z extends zCore.$ZodType, IsOptional extends "required" | "optional"> = Z extends Zid<infer TableName> ? VId<GenericId<TableName>> : Z extends zCore.$ZodString ? VString<zCore.infer<Z>, IsOptional> : Z extends zCore.$ZodNumber ? VFloat64<zCore.infer<Z>, IsOptional> : Z extends zCore.$ZodNaN ? VFloat64<zCore.infer<Z>, IsOptional> : Z extends zCore.$ZodBigInt ? VInt64<zCore.infer<Z>, IsOptional> : Z extends zCore.$ZodBoolean ? VBoolean<zCore.infer<Z>, IsOptional> : Z extends zCore.$ZodNull ? VNull<zCore.infer<Z>, IsOptional> : Z extends zCore.$ZodUnknown ? VAny<any, "required"> : Z extends zCore.$ZodAny ? VAny<zCore.infer<Z>, "required"> : Z extends zCore.$ZodArray<infer Inner extends zCore.$ZodType> ? ConvexValidatorFromZod<Inner, "required"> extends GenericValidator ? VArray<ConvexValidatorFromZod<Inner, "required">["type"][], ConvexValidatorFromZod<Inner, "required">, IsOptional> : never : Z extends zCore.$ZodObject<infer Fields extends Readonly<zCore.$ZodShape>> ? VObject<zCore.infer<Z>, ConvexObjectFromZodShape<Fields>, IsOptional> : Z extends zCore.$ZodNever ? VUnion<never, [], IsOptional, never> : Z extends zCore.$ZodUnion<infer T extends readonly zCore.$ZodType[]> ? ConvexUnionValidatorFromZod<T> : Z extends zCore.$ZodTuple<infer Inner extends readonly zCore.$ZodType[], infer Rest extends null | zCore.$ZodType> ? VArray<null extends Rest ? Array<ConvexValidatorFromZod<Inner[number], "required">["type"]> : Array<ConvexValidatorFromZod<Inner[number], "required">["type"] | zCore.infer<Rest>>, null extends Rest ? ConvexUnionValidatorFromZod<Inner> : ConvexUnionValidatorFromZod<[
    ...Inner,
    Rest extends zCore.$ZodType ? Rest : never
]>, IsOptional> : Z extends zCore.$ZodLiteral<infer Literal extends zCore.util.Literal> ? ConvexLiteralFromZod<Literal, IsOptional> : Z extends zCore.$ZodEnum<infer EnumContents extends zCore.util.EnumLike> ? VUnion<zCore.infer<Z>, keyof EnumContents extends string ? {
    [K in keyof EnumContents]: VLiteral<EnumContents[K], "required">;
}[keyof EnumContents][] : never, IsOptional> : Z extends zCore.$ZodOptional<infer Inner extends zCore.$ZodType> ? VOptional<ConvexValidatorFromZod<Inner, "optional">> : Z extends zCore.$ZodNonOptional<infer Inner extends zCore.$ZodType> ? VRequired<ConvexValidatorFromZod<Inner, "required">> : Z extends zCore.$ZodNullable<infer Inner extends zCore.$ZodType> ? ConvexValidatorFromZod<Inner, IsOptional> extends Validator<any, "optional", any> ? VUnion<ConvexValidatorFromZod<Inner, IsOptional>["type"] | null | undefined, [
    VRequired<ConvexValidatorFromZod<Inner, IsOptional>>,
    VNull
], "optional", ConvexValidatorFromZod<Inner, IsOptional>["fieldPaths"]> : VUnion<ConvexValidatorFromZod<Inner, IsOptional>["type"] | null, [
    VRequired<ConvexValidatorFromZod<Inner, IsOptional>>,
    VNull
], IsOptional, ConvexValidatorFromZod<Inner, IsOptional>["fieldPaths"]> : Z extends zCore.$ZodBranded<infer Inner extends zCore.$ZodType, infer Brand> ? Inner extends zCore.$ZodString ? VString<string & zCore.$brand<Brand>, IsOptional> : Inner extends zCore.$ZodNumber ? VFloat64<number & zCore.$brand<Brand>, IsOptional> : Inner extends zCore.$ZodBigInt ? VInt64<bigint & zCore.$brand<Brand>, IsOptional> : Inner extends zCore.$ZodObject<infer Fields extends Readonly<zCore.$ZodShape>> ? VObject<zCore.infer<Inner> & zCore.$brand<Brand>, ConvexObjectFromZodShape<Fields>, IsOptional> : ConvexValidatorFromZod<Inner, IsOptional> : Z extends zCore.$ZodRecord<infer Key extends zCore.$ZodRecordKey, infer Value extends zCore.$ZodType> ? ConvexValidatorFromZodRecord<Key, Value, IsOptional> : Z extends zCore.$ZodReadonly<infer Inner extends zCore.$ZodType> ? ConvexValidatorFromZod<Inner, IsOptional> : Z extends zCore.$ZodLazy<infer Inner extends zCore.$ZodType> ? ConvexValidatorFromZod<Inner, IsOptional> : Z extends zCore.$ZodTemplateLiteral<infer Template extends string> ? VString<Template, IsOptional> : Z extends zCore.$ZodCatch<infer T extends zCore.$ZodType> ? ConvexValidatorFromZod<T, IsOptional> : Z extends zCore.$ZodTransform<any, any> ? VAny<any, "required"> : Z extends zCore.$ZodCustom<any> ? VAny<any, "required"> : Z extends zCore.$ZodIntersection<any> ? VAny<any, "required"> : IsConvexUnencodableType<Z> extends true ? never : GenericValidator;
type ConvexUnionValidatorFromZod<T extends readonly zCore.$ZodType[]> = VUnion<ConvexValidatorFromZod<T[number], "required">["type"], T extends readonly [
    infer Head extends zCore.$ZodType,
    ...infer Tail extends zCore.$ZodType[]
] ? [
    VRequired<ConvexValidatorFromZod<Head, "required">>,
    ...ConvexUnionValidatorFromZodMembers<Tail>
] : T extends readonly [] ? [] : Validator<any, "required", any>[], "required", ConvexValidatorFromZod<T[number], "required">["fieldPaths"]>;
type ConvexUnionValidatorFromZodMembers<T extends readonly zCore.$ZodType[]> = T extends readonly [
    infer Head extends zCore.$ZodType,
    ...infer Tail extends zCore.$ZodType[]
] ? [
    VRequired<ConvexValidatorFromZod<Head, "required">>,
    ...ConvexUnionValidatorFromZodMembers<Tail>
] : T extends readonly [] ? [] : Validator<any, "required", any>[];
type ConvexObjectFromZodShape<Fields extends Readonly<zCore.$ZodShape>> = Fields extends infer F ? {
    [K in keyof F]: F[K] extends zCore.$ZodType ? ConvexValidatorFromZod<F[K], "required"> : Validator<any, "required", any>;
} : never;
type ConvexObjectValidatorFromRecord<Key extends string, Value extends zCore.$ZodType, IsOptional extends "required" | "optional", IsPartial extends "partial" | "full"> = VObject<IsPartial extends "partial" ? {
    [K in Key]?: zCore.infer<Value>;
} : MakeUndefinedPropertiesOptional<{
    [K in Key]: zCore.infer<Value>;
}>, IsPartial extends "partial" ? {
    [K in Key]: VOptional<ConvexValidatorFromZod<Value, "required">>;
} : {
    [K in Key]: ConvexValidatorFromZod<Value, "required">;
}, IsOptional>;
type MakeUndefinedPropertiesOptional<Obj extends object> = Expand<{
    [K in keyof Obj as undefined extends Obj[K] ? never : K]: Obj[K];
} & {
    [K in keyof Obj as undefined extends Obj[K] ? K : never]?: Obj[K];
}>;
type ConvexValidatorFromZodRecord<Key extends zCore.$ZodRecordKey, Value extends zCore.$ZodType, IsOptional extends "required" | "optional"> = Key extends zCore.$ZodString | Zid<any> | zCore.$ZodUnion<infer _Ids extends readonly Zid<any>[]> ? VRecord<Record<zCore.infer<Key>, NotUndefined<zCore.infer<Value>>>, VRequired<ConvexValidatorFromZod<Key, "required">>, VRequired<ConvexValidatorFromZod<Value, "required">>, IsOptional> : Key extends zCore.$ZodLiteral<infer Literal extends string> ? ConvexObjectValidatorFromRecord<Literal, Value, IsOptional, Key extends zCore.$partial ? "partial" : "full"> : Key extends zCore.$ZodUnion<infer Literals extends readonly zCore.$ZodLiteral[]> ? ConvexObjectValidatorFromRecord<zCore.infer<Literals[number]> extends string ? zCore.infer<Literals[number]> : never, Value, IsOptional, Key extends zCore.$partial ? "partial" : "full"> : VRecord<Record<string, NotUndefined<zCore.infer<Value>>>, VString<string, "required">, VRequired<ConvexValidatorFromZod<Value, "required">>, IsOptional>;
type IsConvexUnencodableType<Z extends zCore.$ZodType> = Z extends zCore.$ZodDate | zCore.$ZodSymbol | zCore.$ZodMap | zCore.$ZodSet | zCore.$ZodPromise | zCore.$ZodFile | zCore.$ZodFunction | zCore.$ZodUndefined | zCore.$ZodVoid ? true : false;
type IsUnion<T, U extends T = T> = T extends unknown ? [U] extends [T] ? false : true : false;
type ConvexLiteralFromZod<Literal extends zCore.util.Literal, IsOptional extends "required" | "optional"> = undefined extends Literal ? never : [
    Literal
] extends [null] ? VNull<null, IsOptional> : IsUnion<Literal> extends true ? VUnion<Literal, Array<Literal extends unknown ? ConvexLiteralFromZod<Literal, "required"> : never>, IsOptional, never> : VLiteral<Literal, IsOptional>;
type IsUnknownOrAny<T> = 0 extends 1 & T ? true : unknown extends T ? true : false;
/**
 * Better type conversion from a Convex validator to a Zod validator
 * where the output is not a generic ZodType but it's more specific.
 *
 * This allows you to use methods specific to the Zod type (e.g. `.email()` for `z.ZodString`).
 *
 * ```ts
 * ZodValidatorFromConvex<typeof v.string()> // → z.ZodString
 * ```
 */
export type ZodValidatorFromConvex<V extends GenericValidator> = V extends Validator<any, "optional", any> ? z.ZodOptional<ZodFromValidatorBase<VRequired<V>>> : ZodFromValidatorBase<V>;
export type ZodFromValidatorBase<V extends GenericValidator> = V extends VId<infer Type> ? Zid<TableNameFromType<NotUndefined<Type>>> : V extends VString<infer T> ? BrandIfBranded<T, z.ZodString> : V extends VFloat64<infer T> ? BrandIfBranded<T, z.ZodNumber> : V extends VInt64<any> ? z.ZodBigInt : V extends VBoolean<any> ? z.ZodBoolean : V extends VNull<any> ? z.ZodNull : V extends VArray<any, infer Element> ? Element extends VArray<any, any> ? z.ZodArray<zCore.SomeType> : z.ZodArray<ZodFromValidatorBase<Element>> : V extends VObject<any, infer Fields extends Record<string, GenericValidator>> ? z.ZodObject<ZodShapeFromConvexObject<Fields>, zCore.$strict> : V extends VBytes<any, any> ? never : V extends VLiteral<infer T extends zCore.util.Literal, OptionalProperty> ? z.ZodLiteral<NotUndefined<T>> : V extends VRecord<any, infer Key, infer Value, OptionalProperty, any> ? z.ZodRecord<ZodFromStringValidator<Key>, ZodFromValidatorBase<Value>> : V extends VUnion<any, [], OptionalProperty, any> ? z.ZodNever : V extends VUnion<any, [
    infer I extends GenericValidator
], OptionalProperty, any> ? ZodValidatorFromConvex<I> : V extends VUnion<any, [
    infer A extends GenericValidator,
    ...infer Rest extends GenericValidator[]
], OptionalProperty, any> ? z.ZodUnion<readonly [
    ZodValidatorFromConvex<A>,
    ...{
        [K in keyof Rest]: ZodValidatorFromConvex<Rest[K]>;
    }
]> : V extends VAny<any, OptionalProperty, any> ? z.ZodAny : never;
type BrandIfBranded<InnerType, Validator extends zCore.SomeType> = InnerType extends zCore.$brand<infer Brand> ? zCore.$ZodBranded<Validator, Brand> : Validator;
type StringValidator = Validator<string, "required", any>;
type ZodFromStringValidator<V extends StringValidator> = V extends VId<GenericId<infer TableName extends string>> ? Zid<TableName> : V extends VString<infer T, any> ? BrandIfBranded<T, z.ZodString> : V extends VLiteral<infer Literal extends string> ? z.ZodLiteral<Literal> : V extends VUnion<any, [], any, any> ? z.ZodNever : V extends VUnion<any, [infer I extends GenericValidator], any, any> ? ZodFromStringValidator<I> : V extends VUnion<any, [
    infer A extends GenericValidator,
    ...infer Rest extends GenericValidator[]
], any, any> ? z.ZodUnion<readonly [
    ZodFromStringValidator<A>,
    ...{
        [K in keyof Rest]: ZodFromStringValidator<Rest[K]>;
    }
]> : never;
type ZodShapeFromConvexObject<Fields extends Record<string, GenericValidator>> = Fields extends infer F ? {
    [K in keyof F]: F[K] extends GenericValidator ? ZodValidatorFromConvex<F[K]> : never;
} : never;
type NotUndefined<T> = Exclude<T, undefined>;
type TableNameFromType<T> = T extends GenericId<infer TableName> ? TableName : string;
export {};
//# sourceMappingURL=zod4.d.ts.map