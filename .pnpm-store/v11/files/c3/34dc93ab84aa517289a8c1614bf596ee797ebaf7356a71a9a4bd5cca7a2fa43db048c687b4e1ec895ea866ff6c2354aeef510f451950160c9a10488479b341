import type { ZodTypeDef } from "zod/v3";
import { z } from "zod/v3";
import type { GenericId, Infer, ObjectType, PropertyValidators, VArray, VAny, VString, VId, VUnion, VFloat64, VInt64, VBoolean, VNull, VLiteral, GenericValidator, VOptional, VObject, Validator, VRecord } from "convex/values";
import type { FunctionVisibility, GenericDataModel, GenericActionCtx, GenericQueryCtx, MutationBuilder, QueryBuilder, GenericMutationCtx, ActionBuilder, TableNamesInDataModel, DefaultFunctionArgs, ArgsArrayToObject } from "convex/server";
import type { Customization, Registration } from "./customFunctions.js";
export type ZodValidator = Record<string, z.ZodTypeAny>;
/**
 * Creates a validator for a Convex `Id`.
 *
 * - When **used within Zod**, it will only check that the ID is a string.
 * - When **converted to a Convex validator** (e.g. through {@link zodToConvex}),
 *   it will check that it's for the right table.
 *
 * @param tableName - The table that the `Id` references. i.e. `Id<tableName>`
 * @returns A Zod object representing a Convex `Id`
 */
export declare const zid: <DataModel extends GenericDataModel, TableName extends TableNamesInDataModel<DataModel> = TableNamesInDataModel<DataModel>>(tableName: TableName) => Zid<TableName>;
/**
 * Useful to get the input context type for a custom function using Zod.
 */
export type ZCustomCtx<Builder> = Builder extends CustomBuilder<any, any, infer CustomCtx, any, infer InputCtx, any, any> ? Overwrite<InputCtx, CustomCtx> : never;
/**
 * `zCustomQuery` is like {@link customQuery}, but allows validation via Zod.
 * You can define custom behavior on top of `query` or `internalQuery`
 * by passing a function that modifies the ctx and args. Or {@link NoOp} to do nothing.
 *
 * Example usage:
 * ```js
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
 * ```js
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
 * @returns A new query builder using Zod validation to define queries.
 */
export declare function zCustomQuery<CustomArgsValidator extends PropertyValidators, CustomCtx extends Record<string, any>, CustomMadeArgs extends Record<string, any>, Visibility extends FunctionVisibility, DataModel extends GenericDataModel, ExtraArgs extends Record<string, any> = object>(query: QueryBuilder<DataModel, Visibility>, customization: Customization<GenericQueryCtx<DataModel>, CustomArgsValidator, CustomCtx, CustomMadeArgs, ExtraArgs>): CustomBuilder<"query", CustomArgsValidator, CustomCtx, CustomMadeArgs, GenericQueryCtx<DataModel>, Visibility, ExtraArgs>;
/**
 * `zCustomMutation` is like {@link customMutation}, but allows validation via Zod.
 * You can define custom behavior on top of `mutation` or `internalMutation`
 * by passing a function that modifies the ctx and args. Or {@link NoOp} to do nothing.
 *
 * Example usage:
 * ```js
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
 * ```js
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
 * @returns A new mutation builder using Zod validation to define queries.
 */
export declare function zCustomMutation<CustomArgsValidator extends PropertyValidators, CustomCtx extends Record<string, any>, CustomMadeArgs extends Record<string, any>, Visibility extends FunctionVisibility, DataModel extends GenericDataModel, ExtraArgs extends Record<string, any> = object>(mutation: MutationBuilder<DataModel, Visibility>, customization: Customization<GenericMutationCtx<DataModel>, CustomArgsValidator, CustomCtx, CustomMadeArgs, ExtraArgs>): CustomBuilder<"mutation", CustomArgsValidator, CustomCtx, CustomMadeArgs, GenericMutationCtx<DataModel>, Visibility, ExtraArgs>;
/**
 * `zCustomAction` is like {@link customAction}, but allows validation via Zod.
 * You can define custom behavior on top of `action` or `internalAction`
 * by passing a function that modifies the ctx and args. Or {@link NoOp} to do nothing.
 *
 * Example usage:
 * ```js
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
 * ```js
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
 * @returns A new action builder using Zod validation to define queries.
 */
export declare function zCustomAction<CustomArgsValidator extends PropertyValidators, CustomCtx extends Record<string, any>, CustomMadeArgs extends Record<string, any>, Visibility extends FunctionVisibility, DataModel extends GenericDataModel, ExtraArgs extends Record<string, any> = object>(action: ActionBuilder<DataModel, Visibility>, customization: Customization<GenericActionCtx<DataModel>, CustomArgsValidator, CustomCtx, CustomMadeArgs, ExtraArgs>): CustomBuilder<"action", CustomArgsValidator, CustomCtx, CustomMadeArgs, GenericActionCtx<DataModel>, Visibility, ExtraArgs>;
type OneArgArray<ArgsObject extends DefaultFunctionArgs = DefaultFunctionArgs> = [
    ArgsObject
];
type NullToUndefinedOrNull<T> = T extends null ? T | undefined | void : T;
type Returns<T> = Promise<NullToUndefinedOrNull<T>> | NullToUndefinedOrNull<T>;
type ReturnValueInput<ReturnsValidator extends z.ZodTypeAny | ZodValidator | void> = [ReturnsValidator] extends [z.ZodTypeAny] ? Returns<z.input<ReturnsValidator>> : [ReturnsValidator] extends [ZodValidator] ? Returns<z.input<z.ZodObject<ReturnsValidator>>> : any;
type ReturnValueOutput<ReturnsValidator extends z.ZodTypeAny | ZodValidator | void> = [ReturnsValidator] extends [z.ZodTypeAny] ? Returns<z.output<ReturnsValidator>> : [ReturnsValidator] extends [ZodValidator] ? Returns<z.output<z.ZodObject<ReturnsValidator>>> : any;
type ArgsInput<ArgsValidator extends ZodValidator | z.ZodObject<any> | void> = [
    ArgsValidator
] extends [z.ZodObject<any>] ? [z.input<ArgsValidator>] : [ArgsValidator] extends [ZodValidator] ? [z.input<z.ZodObject<ArgsValidator>>] : OneArgArray;
type ArgsOutput<ArgsValidator extends ZodValidator | z.ZodObject<any> | void> = [
    ArgsValidator
] extends [z.ZodObject<any>] ? [z.output<ArgsValidator>] : [ArgsValidator] extends [ZodValidator] ? [z.output<z.ZodObject<ArgsValidator>>] : OneArgArray;
type Overwrite<T, U> = Omit<T, keyof U> & U;
type Expand<ObjectType extends Record<any, any>> = ObjectType extends Record<any, any> ? {
    [Key in keyof ObjectType]: ObjectType[Key];
} : never;
type ArgsForHandlerType<OneOrZeroArgs extends [] | [Record<string, any>], CustomMadeArgs extends Record<string, any>> = CustomMadeArgs extends Record<string, never> ? OneOrZeroArgs : OneOrZeroArgs extends [infer A] ? [Expand<A & CustomMadeArgs>] : [CustomMadeArgs];
/**
 * A builder that customizes a Convex function, whether or not it validates
 * arguments. If the customization requires arguments, however, the resulting
 * builder will require argument validation too.
 */
export type CustomBuilder<FuncType extends "query" | "mutation" | "action", CustomArgsValidator extends PropertyValidators, CustomCtx extends Record<string, any>, CustomMadeArgs extends Record<string, any>, InputCtx, Visibility extends FunctionVisibility, ExtraArgs extends Record<string, any>> = {
    <ArgsValidator extends ZodValidator | z.ZodObject<any> | void, ReturnsZodValidator extends z.ZodTypeAny | ZodValidator | void = void, ReturnValue extends ReturnValueInput<ReturnsZodValidator> = any>(func: ({
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
type ConvexUnionValidatorFromZod<T> = T extends z.ZodTypeAny[] ? VUnion<ConvexValidatorFromZod<T[number]>["type"], {
    [Index in keyof T]: T[Index] extends z.ZodTypeAny ? ConvexValidatorFromZod<T[Index]> : never;
}, "required", ConvexValidatorFromZod<T[number]>["fieldPaths"]> : never;
type ConvexObjectValidatorFromZod<T extends ZodValidator> = VObject<ObjectType<{
    [key in keyof T]: T[key] extends z.ZodTypeAny ? ConvexValidatorFromZod<T[key]> : never;
}>, {
    [key in keyof T]: ConvexValidatorFromZod<T[key]>;
}>;
type ConvexObjectValidatorFromZodOutput<T extends ZodValidator> = VObject<ObjectType<{
    [key in keyof T]: T[key] extends z.ZodTypeAny ? ConvexValidatorFromZodOutput<T[key]> : never;
}>, {
    [key in keyof T]: ConvexValidatorFromZodOutput<T[key]>;
}>;
type ConvexUnionValidatorFromZodOutput<T> = T extends z.ZodTypeAny[] ? VUnion<ConvexValidatorFromZodOutput<T[number]>["type"], {
    [Index in keyof T]: T[Index] extends z.ZodTypeAny ? ConvexValidatorFromZodOutput<T[Index]> : never;
}, "required", ConvexValidatorFromZodOutput<T[number]>["fieldPaths"]> : never;
/**
 * Converts a Zod validator type
 * to the corresponding Convex validator type from `convex/values`.
 *
 * ```ts
 * ConvexValidatorFromZod<z.ZodString> // → VString
 * ```
 */
export type ConvexValidatorFromZod<Z extends z.ZodTypeAny> = Z extends Zid<infer TableName> ? VId<GenericId<TableName>> : Z extends z.ZodString ? VString : Z extends z.ZodNumber ? VFloat64 : Z extends z.ZodNaN ? VFloat64 : Z extends z.ZodBigInt ? VInt64 : Z extends z.ZodBoolean ? VBoolean : Z extends z.ZodNull ? VNull : Z extends z.ZodUnknown ? VAny : Z extends z.ZodAny ? VAny : Z extends z.ZodArray<infer Inner> ? VArray<ConvexValidatorFromZod<Inner>["type"][], ConvexValidatorFromZod<Inner>> : Z extends z.ZodObject<infer ZodShape> ? ConvexObjectValidatorFromZod<ZodShape> : Z extends z.ZodUnion<infer T> ? ConvexUnionValidatorFromZod<T> : Z extends z.ZodDiscriminatedUnion<any, infer T> ? VUnion<ConvexValidatorFromZod<T[number]>["type"], {
    -readonly [Index in keyof T]: ConvexValidatorFromZod<T[Index]>;
}, "required", ConvexValidatorFromZod<T[number]>["fieldPaths"]> : Z extends z.ZodTuple<infer Inner> ? VArray<ConvexValidatorFromZod<Inner[number]>["type"][], ConvexValidatorFromZod<Inner[number]>> : Z extends z.ZodLazy<infer Inner> ? ConvexValidatorFromZod<Inner> : Z extends z.ZodLiteral<infer Literal> ? VLiteral<Literal> : Z extends z.ZodEnum<infer T> ? T extends Array<any> ? VUnion<T[number], {
    [Index in keyof T]: VLiteral<T[Index]>;
}, "required", ConvexValidatorFromZod<T[number]>["fieldPaths"]> : never : Z extends z.ZodEffects<infer Inner> ? ConvexValidatorFromZod<Inner> : Z extends z.ZodOptional<infer Inner> ? ConvexValidatorFromZod<Inner> extends GenericValidator ? VOptional<ConvexValidatorFromZod<Inner>> : never : Z extends z.ZodNullable<infer Inner> ? ConvexValidatorFromZod<Inner> extends Validator<any, "required", any> ? VUnion<null | ConvexValidatorFromZod<Inner>["type"], [
    ConvexValidatorFromZod<Inner>,
    VNull
], "required", ConvexValidatorFromZod<Inner>["fieldPaths"]> : ConvexValidatorFromZod<Inner> extends Validator<infer T, "optional", infer F> ? VUnion<null | Exclude<ConvexValidatorFromZod<Inner>["type"], undefined>, [
    Validator<T, "required", F>,
    VNull
], "optional", ConvexValidatorFromZod<Inner>["fieldPaths"]> : never : Z extends z.ZodBranded<infer Inner, infer Brand> | ZodBrandedInputAndOutput<infer Inner, infer Brand> ? Inner extends z.ZodString ? VString<string & z.BRAND<Brand>> : Inner extends z.ZodNumber ? VFloat64<number & z.BRAND<Brand>> : Inner extends z.ZodBigInt ? VInt64<bigint & z.BRAND<Brand>> : Inner extends z.ZodObject<infer ZodShape> ? VObject<ObjectType<{
    [key in keyof ZodShape]: ZodShape[key] extends z.ZodTypeAny ? ConvexValidatorFromZod<ZodShape[key]> : never;
}> & z.BRAND<Brand>, {
    [key in keyof ZodShape]: ConvexValidatorFromZod<ZodShape[key]>;
}> : ConvexValidatorFromZod<Inner> : Z extends z.ZodDefault<infer Inner> ? ConvexValidatorFromZod<Inner> extends GenericValidator ? VOptional<ConvexValidatorFromZod<Inner>> : never : Z extends z.ZodRecord<infer K, infer V> ? K extends z.ZodString | Zid<string> | z.ZodUnion<[
    (z.ZodString | Zid<string>),
    (z.ZodString | Zid<string>),
    ...(z.ZodString | Zid<string>)[]
]> ? VRecord<z.RecordType<ConvexValidatorFromZod<K>["type"], ConvexValidatorFromZod<V>["type"]>, ConvexValidatorFromZod<K>, ConvexValidatorFromZod<V>> : never : Z extends z.ZodReadonly<infer Inner> ? ConvexValidatorFromZod<Inner> : Z extends z.ZodPipeline<infer Inner, any> ? ConvexValidatorFromZod<Inner> : never;
/**
 * Turns a Zod validator into a Convex Validator.
 *
 * The Convex validator will be as close to possible to the Zod validator,
 * but might be broader than the Zod validator:
 *
 * ```js
 * zodToConvex(z.string().email()) // → v.string()
 * ```
 *
 * This function is useful when running the Zod validator _after_ running the Convex validator
 * (i.e. the Convex validator validates the input of the Zod validator). Hence, the Convex types
 * will match the _input type_ of Zod transformations:
 * ```js
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
export declare function zodToConvex<Z extends z.ZodTypeAny>(zod: Z): ConvexValidatorFromZod<Z>;
/**
 * This is the type of a Convex validator that checks the value *after* it has
 * been validated (and possibly transformed) by a Zod validator.
 *
 * The difference between {@link ConvexValidatorFromZod}
 * and `ConvexValidatorFromZodOutput` are explained in the documentation of
 * {@link zodToConvex}/{@link zodOutputToConvex}.
 */
export type ConvexValidatorFromZodOutput<Z extends z.ZodTypeAny> = Z extends Zid<infer TableName> ? VId<GenericId<TableName>> : Z extends z.ZodString ? VString : Z extends z.ZodNumber ? VFloat64 : Z extends z.ZodNaN ? VFloat64 : Z extends z.ZodBigInt ? VInt64 : Z extends z.ZodBoolean ? VBoolean : Z extends z.ZodNull ? VNull : Z extends z.ZodUnknown ? VAny : Z extends z.ZodAny ? VAny : Z extends z.ZodArray<infer Inner> ? VArray<ConvexValidatorFromZodOutput<Inner>["type"][], ConvexValidatorFromZodOutput<Inner>> : Z extends z.ZodObject<infer ZodShape> ? ConvexObjectValidatorFromZodOutput<ZodShape> : Z extends z.ZodUnion<infer T> ? ConvexUnionValidatorFromZodOutput<T> : Z extends z.ZodDiscriminatedUnion<any, infer T> ? VUnion<ConvexValidatorFromZodOutput<T[number]>["type"], {
    -readonly [Index in keyof T]: ConvexValidatorFromZodOutput<T[Index]>;
}, "required", ConvexValidatorFromZodOutput<T[number]>["fieldPaths"]> : Z extends z.ZodTuple<infer Inner> ? VArray<ConvexValidatorFromZodOutput<Inner[number]>["type"][], ConvexValidatorFromZodOutput<Inner[number]>> : Z extends z.ZodLazy<infer Inner> ? ConvexValidatorFromZodOutput<Inner> : Z extends z.ZodLiteral<infer Literal> ? VLiteral<Literal> : Z extends z.ZodEnum<infer T> ? T extends Array<any> ? VUnion<T[number], {
    [Index in keyof T]: VLiteral<T[Index]>;
}, "required", ConvexValidatorFromZodOutput<T[number]>["fieldPaths"]> : never : Z extends z.ZodOptional<infer Inner> ? ConvexValidatorFromZodOutput<Inner> extends GenericValidator ? VOptional<ConvexValidatorFromZodOutput<Inner>> : never : Z extends z.ZodNullable<infer Inner> ? ConvexValidatorFromZodOutput<Inner> extends Validator<any, "required", any> ? VUnion<null | ConvexValidatorFromZodOutput<Inner>["type"], [
    ConvexValidatorFromZodOutput<Inner>,
    VNull
], "required", ConvexValidatorFromZodOutput<Inner>["fieldPaths"]> : ConvexValidatorFromZodOutput<Inner> extends Validator<infer T, "optional", infer F> ? VUnion<null | Exclude<ConvexValidatorFromZodOutput<Inner>["type"], undefined>, [
    Validator<T, "required", F>,
    VNull
], "optional", ConvexValidatorFromZodOutput<Inner>["fieldPaths"]> : never : Z extends z.ZodBranded<infer Inner, infer Brand> | ZodBrandedInputAndOutput<infer Inner, infer Brand> ? Inner extends z.ZodString ? VString<string & z.BRAND<Brand>> : Inner extends z.ZodNumber ? VFloat64<number & z.BRAND<Brand>> : Inner extends z.ZodBigInt ? VInt64<bigint & z.BRAND<Brand>> : Inner extends z.ZodObject<infer ZodShape> ? VObject<ObjectType<{
    [key in keyof ZodShape]: ZodShape[key] extends z.ZodTypeAny ? ConvexValidatorFromZodOutput<ZodShape[key]> : never;
}> & z.BRAND<Brand>, {
    [key in keyof ZodShape]: ConvexValidatorFromZodOutput<ZodShape[key]>;
}> : ConvexValidatorFromZodOutput<Inner> : Z extends z.ZodRecord<infer K, infer V> ? K extends z.ZodString | Zid<string> | z.ZodUnion<[
    z.ZodString | Zid<string>,
    z.ZodString | Zid<string>,
    ...(z.ZodString | Zid<string>)[]
]> ? VRecord<z.RecordType<ConvexValidatorFromZodOutput<K>["type"], ConvexValidatorFromZodOutput<V>["type"]>, ConvexValidatorFromZodOutput<K>, ConvexValidatorFromZodOutput<V>> : never : Z extends z.ZodReadonly<infer Inner> ? ConvexValidatorFromZodOutput<Inner> : Z extends z.ZodDefault<infer Inner> ? ConvexValidatorFromZodOutput<Inner> : Z extends z.ZodEffects<any> ? VAny : Z extends z.ZodPipeline<z.ZodTypeAny, infer Out> ? ConvexValidatorFromZodOutput<Out> : never;
/**
 * Converts a Zod validator to a Convex validator that checks the value _after_
 * it has been validated (and possibly transformed) by the Zod validator.
 *
 * This is similar to {@link zodToConvex}, but is meant for cases where the Convex
 * validator runs _after_ the Zod validator. Thus, the Convex type refers to the
 * _output_ type of the Zod transformations:
 * ```js
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
export declare function zodOutputToConvex<Z extends z.ZodTypeAny>(zod: Z): ConvexValidatorFromZodOutput<Z>;
/**
 * Like {@link zodToConvex}, but it takes in a bare object, as expected by Convex
 * function arguments, or the argument to {@link defineTable}.
 *
 * ```js
 * zodToConvexFields({
 *   name: z.string().default("Nicolas"),
 * }) // → { name: v.optional(v.string()) }
 * ```
 *
 * @param zod Object with string keys and Zod validators as values
 * @returns Object with the same keys, but with Convex validators as values
 */
export declare function zodToConvexFields<Z extends ZodValidator>(zod: Z): { [k in keyof Z]: ConvexValidatorFromZod<Z[k]>; };
/**
 * Like {@link zodOutputToConvex}, but it takes in a bare object, as expected by
 * Convex function arguments, or the argument to {@link defineTable}.
 *
 * ```js
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
export declare function zodOutputToConvexFields<Z extends ZodValidator>(zod: Z): { [k in keyof Z]: ConvexValidatorFromZodOutput<Z[k]>; };
interface ZidDef<TableName extends string> extends ZodTypeDef {
    typeName: "ConvexId";
    tableName: TableName;
}
/**
 * A Zod validator for a Convex ID.
 */
export declare class Zid<TableName extends string> extends z.ZodType<GenericId<TableName>, ZidDef<TableName>> {
    _parse(input: z.ParseInput): z.ParseReturnType<GenericId<TableName>>;
}
/**
 * Zod helper for adding Convex system fields to a record to return.
 *
 * ```js
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
export declare const withSystemFields: <Table extends string, T extends {
    [key: string]: z.ZodTypeAny;
}>(tableName: Table, zObject: T) => T & {
    _id: Zid<Table>;
    _creationTime: z.ZodNumber;
};
/**
 * This is a copy of Zod’s `ZodBranded` which also brands the input
 * (see {@link zBrand})
 */
export declare class ZodBrandedInputAndOutput<T extends z.ZodTypeAny, B extends string | number | symbol> extends z.ZodType<T["_output"] & z.BRAND<B>, z.ZodBrandedDef<T>, T["_input"] & z.BRAND<B>> {
    _parse(input: z.ParseInput): z.ParseReturnType<any>;
    unwrap(): T;
}
/**
 * Adds a brand to a Zod validator. Used like `zBrand(z.string(), "MyBrand")`.
 * Compared to zod's `.brand`, this also brands the input type, so if you use
 * the branded validator as an argument to a function, the input type will also
 * be branded. The normal `.brand` only brands the output type, so only the type
 * returned by validation would be branded.
 *
 * @param validator A zod validator - generally a string, number, or bigint
 * @param brand A string, number, or symbol to brand the validator with
 * @returns A zod validator that brands both the input and output types.
 */
export declare function zBrand<T extends z.ZodTypeAny, B extends string | number | symbol>(validator: T, brand?: B): ZodBrandedInputAndOutput<T, B>;
/**
 * Simple type conversion from a Convex validator to a Zod validator.
 *
 * ```ts
 * ConvexToZod<typeof v.string()> // → z.ZodType<string>
 * ```
 */
export type ConvexToZod<V extends GenericValidator> = z.ZodType<Infer<V>>;
type ZodFromValidatorBase<V extends GenericValidator> = V extends VId<GenericId<infer TableName extends string>> ? Zid<TableName> : V extends VString<infer T, any> ? T extends string & {
    _: infer Brand extends string;
} ? z.ZodBranded<z.ZodString, Brand> : z.ZodString : V extends VFloat64<any, any> ? z.ZodNumber : V extends VInt64<any, any> ? z.ZodBigInt : V extends VBoolean<any, any> ? z.ZodBoolean : V extends VNull<any, any> ? z.ZodNull : V extends VLiteral<infer T, any> ? z.ZodLiteral<T> : V extends VObject<any, infer Fields, any, any> ? z.ZodObject<{
    [K in keyof Fields]: ZodValidatorFromConvex<Fields[K]>;
}, "strip"> : V extends VRecord<any, infer Key, infer Value, any, any> ? Key extends VId<GenericId<infer TableName>> ? z.ZodRecord<Zid<TableName>, ZodValidatorFromConvex<Value>> : z.ZodRecord<z.ZodString, ZodValidatorFromConvex<Value>> : V extends VArray<any, any> ? z.ZodArray<ZodValidatorFromConvex<V["element"]>> : V extends VUnion<any, [
    infer A extends GenericValidator,
    infer B extends GenericValidator,
    ...infer Rest extends GenericValidator[]
], any, any> ? z.ZodUnion<[
    ZodValidatorFromConvex<A>,
    ZodValidatorFromConvex<B>,
    ...{
        [K in keyof Rest]: ZodValidatorFromConvex<Rest[K]>;
    }
]> : z.ZodTypeAny;
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
export type ZodValidatorFromConvex<V extends GenericValidator> = V extends Validator<any, "optional", any> ? z.ZodOptional<ZodFromValidatorBase<V>> : ZodFromValidatorBase<V>;
/**
 * Turns a Convex validator into a Zod validator.
 *
 * This is useful when you want to use types you defined using Convex validators
 * with external libraries that expect to receive a Zod validator.
 *
 * ```js
 * convexToZod(v.string()) // → z.string()
 * ```
 *
 * @param convexValidator Convex validator can be any validator from "convex/values" e.g. `v.string()`
 * @returns Zod validator (e.g. `z.string()`) with inferred type matching the Convex validator
 */
export declare function convexToZod<V extends GenericValidator>(convexValidator: V): ZodValidatorFromConvex<V>;
/**
 * Like {@link convexToZod}, but it takes in a bare object, as expected by Convex
 * function arguments, or the argument to {@link defineTable}.
 *
 * ```js
 * convexToZodFields({
 *   name: v.string(),
 * }) // → { name: z.string() }
 * ```
 *
 * @param convexValidators Object with string keys and Convex validators as values
 * @returns Object with the same keys, but with Zod validators as values
 */
export declare function convexToZodFields<C extends PropertyValidators>(convexValidators: C): { [k in keyof C]: ZodValidatorFromConvex<C[k]>; };
export {};
//# sourceMappingURL=zod3.d.ts.map