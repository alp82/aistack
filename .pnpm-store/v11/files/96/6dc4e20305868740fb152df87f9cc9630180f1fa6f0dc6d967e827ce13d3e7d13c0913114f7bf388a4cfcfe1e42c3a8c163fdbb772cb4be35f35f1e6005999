import { ConvexError, v } from "convex/values";
import * as zCore from "zod/v4/core";
import * as z from "zod/v4";
import { pick } from "../index.js";
import { NoOp } from "./customFunctions.js";
import { addFieldsToValidator, vRequired, } from "../validators.js";
// #region Convex function definition with Zod
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
export function zCustomQuery(query, customization) {
    return customFnBuilder(query, customization);
}
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
export function zCustomMutation(mutation, customization) {
    return customFnBuilder(mutation, customization);
}
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
export function zCustomAction(action, customization) {
    return customFnBuilder(action, customization);
}
// #endregion
// #region Convex IDs
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
export const zid = (tableName) => {
    const result = z.custom((val) => typeof val === "string");
    _zidRegistry.add(result, { tableName });
    return result;
};
// #endregion
// #region Zod → Convex
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
export function zodToConvex(validator) {
    const visited = new WeakSet();
    function zodToConvexInner(validator) {
        // Circular validator definitions are not supported by Convex validators,
        // so we use v.any() when there is a cycle.
        if (visited.has(validator)) {
            return v.any();
        }
        visited.add(validator);
        const result = validator instanceof zCore.$ZodDefault
            ? v.optional(zodToConvexInner(validator._zod.def.innerType))
            : validator instanceof zCore.$ZodPipe
                ? zodToConvexInner(validator._zod.def.in)
                : zodToConvexCommon(validator, zodToConvexInner);
        // After returning, we remove the validator from the visited set because
        // we only want to detect circular types, not cases where part of a type
        // is reused (e.g. `v.object({ field1: mySchema, field2: mySchema })`).
        visited.delete(validator);
        return result;
    }
    // `as any` because ConvexValidatorFromZod is defined from the behavior of zodToConvex.
    // We assume the type is correct to simplify the life of the compiler.
    return zodToConvexInner(validator);
}
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
export function zodOutputToConvex(validator) {
    const visited = new WeakSet();
    function zodOutputToConvexInner(validator) {
        // Circular validator definitions are not supported by Convex validators,
        // so we use v.any() when there is a cycle.
        if (visited.has(validator)) {
            return v.any();
        }
        visited.add(validator);
        const result = validator instanceof zCore.$ZodDefault
            ? zodOutputToConvexInner(validator._zod.def.innerType)
            : validator instanceof zCore.$ZodPipe
                ? zodOutputToConvexInner(validator._zod.def.out)
                : validator instanceof zCore.$ZodTransform
                    ? v.any()
                    : zodToConvexCommon(validator, zodOutputToConvexInner);
        // After returning, we remove the validator from the visited set because
        // we only want to detect circular types, not cases where part of a type
        // is reused (e.g. `v.object({ field1: mySchema, field2: mySchema })`).
        visited.delete(validator);
        return result;
    }
    // `as any` because ConvexValidatorFromZodOutput is defined from the behavior of zodOutputToConvex.
    // We assume the type is correct to simplify the life of the compiler.
    return zodOutputToConvexInner(validator);
}
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
export function zodToConvexFields(fields) {
    return Object.fromEntries(Object.entries(fields).map(([k, v]) => [k, zodToConvex(v)]));
}
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
export function zodOutputToConvexFields(fields) {
    return Object.fromEntries(Object.entries(fields).map(([k, v]) => [k, zodOutputToConvex(v)]));
}
// #endregion
// #region Convex → Zod
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
export function convexToZod(convexValidator) {
    const isOptional = convexValidator.isOptional === "optional";
    let zodValidator;
    const { kind } = convexValidator;
    switch (kind) {
        case "id":
            convexValidator;
            zodValidator = zid(convexValidator.tableName);
            break;
        case "string":
            zodValidator = z.string();
            break;
        case "float64":
            zodValidator = z.number();
            break;
        case "int64":
            zodValidator = z.bigint();
            break;
        case "boolean":
            zodValidator = z.boolean();
            break;
        case "null":
            zodValidator = z.null();
            break;
        case "any":
            zodValidator = z.any();
            break;
        case "array": {
            convexValidator;
            zodValidator = z.array(convexToZod(convexValidator.element));
            break;
        }
        case "object": {
            convexValidator;
            zodValidator = z.object(convexToZodFields(convexValidator.fields));
            break;
        }
        case "union": {
            convexValidator;
            if (convexValidator.members.length === 0) {
                zodValidator = z.never();
                break;
            }
            if (convexValidator.members.length === 1) {
                zodValidator = convexToZod(convexValidator.members[0]);
                break;
            }
            const memberValidators = convexValidator.members.map((member) => convexToZod(member));
            zodValidator = z.union([...memberValidators]);
            break;
        }
        case "literal": {
            const literalValidator = convexValidator;
            zodValidator = z.literal(literalValidator.value);
            break;
        }
        case "record": {
            convexValidator;
            zodValidator = z.record(convexToZod(convexValidator.key), convexToZod(convexValidator.value));
            break;
        }
        case "bytes":
            throw new Error("v.bytes() is not supported");
        default:
            kind;
            throw new Error(`Unknown convex validator type: ${kind}`);
    }
    return isOptional
        ? z.optional(zodValidator)
        : zodValidator;
}
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
export function convexToZodFields(convexValidators) {
    return Object.fromEntries(Object.entries(convexValidators).map(([k, v]) => [k, convexToZod(v)]));
}
// #endregion
// #region Utils
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
export function withSystemFields(tableName, zObject) {
    return { ...zObject, _id: zid(tableName), _creationTime: z.number() };
}
function customFnBuilder(builder, customization) {
    // Most of the code in here is identical to customFnBuilder in zod3.ts.
    // If making changes, please keep zod3.ts in sync.
    // Looking forward to when input / args / ... are optional
    const customInput = customization.input ?? NoOp.input;
    const inputArgs = customization.args ?? NoOp.args;
    return function customBuilder(fn) {
        const { args, handler = fn, skipConvexValidation = false, returns: maybeObject, ...extra } = fn;
        const returns = maybeObject && !(maybeObject instanceof zCore.$ZodType)
            ? z.object(maybeObject)
            : maybeObject;
        const returnValidator = returns && !skipConvexValidation
            ? { returns: zodOutputToConvex(returns) }
            : null;
        if (args) {
            let argsValidator = args;
            if (argsValidator instanceof zCore.$ZodType) {
                if (argsValidator instanceof zCore.$ZodObject) {
                    argsValidator = argsValidator._zod.def.shape;
                }
                else {
                    throw new Error("Unsupported zod type as args validator: " +
                        argsValidator.constructor.name);
                }
            }
            const convexValidator = zodToConvexFields(argsValidator);
            return builder({
                args: skipConvexValidation
                    ? undefined
                    : addFieldsToValidator(convexValidator, inputArgs),
                ...returnValidator,
                handler: async (ctx, allArgs) => {
                    const added = await customInput(ctx, pick(allArgs, Object.keys(inputArgs)), extra);
                    const rawArgs = pick(allArgs, Object.keys(argsValidator));
                    const parsed = await z.object(argsValidator).safeParseAsync(rawArgs);
                    if (!parsed.success) {
                        throw new ConvexError({
                            ZodError: JSON.parse(JSON.stringify(parsed.error.issues, null, 2)),
                        });
                    }
                    const args = parsed.data;
                    const finalCtx = { ...ctx, ...added.ctx };
                    const finalArgs = { ...args, ...added.args };
                    const ret = await handler(finalCtx, finalArgs);
                    // We don't catch the error here. It's a developer error and we
                    // don't want to risk exposing the unexpected value to the client.
                    const result = returns
                        ? await returns.parseAsync(ret === undefined ? null : ret)
                        : ret;
                    if (added.onSuccess) {
                        await added.onSuccess({ ctx, args, result });
                    }
                    return result;
                },
            });
        }
        if (skipConvexValidation && Object.keys(inputArgs).length > 0) {
            throw new Error("If you're using a custom function with arguments for the input " +
                "customization, you cannot skip convex validation.");
        }
        return builder({
            ...returnValidator,
            handler: async (ctx, args) => {
                const added = await customInput(ctx, args, extra);
                const finalCtx = { ...ctx, ...added.ctx };
                const finalArgs = { ...args, ...added.args };
                const ret = await handler(finalCtx, finalArgs);
                // We don't catch the error here. It's a developer error and we
                // don't want to risk exposing the unexpected value to the client.
                const result = returns
                    ? await returns.parseAsync(ret === undefined ? null : ret)
                    : ret;
                if (added.onSuccess) {
                    await added.onSuccess({ ctx, args, result });
                }
                return result;
            },
        });
    };
}
function zodToConvexCommon(validator, toConvex) {
    // Check for zid (Convex ID) validators
    const idTableName = _zidRegistry.get(validator);
    if (idTableName !== undefined) {
        return v.id(idTableName.tableName);
    }
    if (validator instanceof zCore.$ZodString) {
        return v.string();
    }
    if (validator instanceof zCore.$ZodNumber ||
        validator instanceof zCore.$ZodNaN) {
        return v.number();
    }
    if (validator instanceof zCore.$ZodBigInt) {
        return v.int64();
    }
    if (validator instanceof zCore.$ZodBoolean) {
        return v.boolean();
    }
    if (validator instanceof zCore.$ZodNull) {
        return v.null();
    }
    if (validator instanceof zCore.$ZodAny ||
        validator instanceof zCore.$ZodUnknown) {
        return v.any();
    }
    if (validator instanceof zCore.$ZodArray) {
        const inner = toConvex(validator._zod.def.element);
        if (inner.isOptional === "optional") {
            throw new Error("Arrays of optional values are not supported");
        }
        return v.array(inner);
    }
    if (validator instanceof zCore.$ZodObject) {
        return v.object(Object.fromEntries(Object.entries(validator._zod.def.shape).map(([k, v]) => [
            k,
            toConvex(v),
        ])));
    }
    if (validator instanceof zCore.$ZodUnion) {
        return v.union(...validator._zod.def.options.map(toConvex));
    }
    if (validator instanceof zCore.$ZodNever) {
        return v.union();
    }
    if (validator instanceof zCore.$ZodTuple) {
        const { items, rest } = validator._zod.def;
        return v.array(v.union(...[
            ...items,
            // + rest if set
            ...(rest !== null ? [rest] : []),
        ].map(toConvex)));
    }
    if (validator instanceof zCore.$ZodLiteral) {
        const { values } = validator._zod.def;
        if (values.length === 1) {
            return convexToZodLiteral(values[0]);
        }
        return v.union(...values.map(convexToZodLiteral));
    }
    if (validator instanceof zCore.$ZodEnum) {
        return v.union(...Object.entries(validator._zod.def.entries)
            .filter(([key, value]) => key === value || isNaN(Number(key)))
            .map(([_key, value]) => v.literal(value)));
    }
    if (validator instanceof zCore.$ZodOptional) {
        return v.optional(toConvex(validator._zod.def.innerType));
    }
    if (validator instanceof zCore.$ZodNonOptional) {
        return vRequired(toConvex(validator._zod.def.innerType));
    }
    if (validator instanceof zCore.$ZodNullable) {
        const inner = toConvex(validator._zod.def.innerType);
        // Invert z.optional().nullable() → v.optional(v.nullable())
        if (inner.isOptional === "optional") {
            return v.optional(v.union(vRequired(inner), v.null()));
        }
        return v.union(inner, v.null());
    }
    if (validator instanceof zCore.$ZodRecord) {
        const { keyType, valueType } = validator._zod.def;
        const isPartial = keyType._zod.values === undefined;
        // Convert value type, stripping optional
        const valueValidator = toConvex(valueType);
        // Convert key type
        const keyValidator = toConvex(keyType);
        // key = string literals?
        // If so, not supported by v.record() → use v.object() instead
        const stringLiterals = extractStringLiterals(keyValidator);
        if (stringLiterals !== null) {
            const fieldValue = isPartial || valueValidator.isOptional === "optional"
                ? v.optional(valueValidator)
                : vRequired(valueValidator);
            const fields = {};
            for (const literal of stringLiterals) {
                fields[literal] = fieldValue;
            }
            return v.object(fields);
        }
        return v.record(isValidRecordKey(keyValidator) ? keyValidator : v.string(), vRequired(valueValidator));
    }
    if (validator instanceof zCore.$ZodReadonly) {
        return toConvex(validator._zod.def.innerType);
    }
    if (validator instanceof zCore.$ZodLazy) {
        return toConvex(validator._zod.def.getter());
    }
    if (validator instanceof zCore.$ZodTemplateLiteral) {
        return v.string();
    }
    if (validator instanceof zCore.$ZodCustom ||
        validator instanceof zCore.$ZodIntersection) {
        return v.any();
    }
    if (validator instanceof zCore.$ZodCatch) {
        return toConvex(validator._zod.def.innerType);
    }
    if (validator instanceof zCore.$ZodDate ||
        validator instanceof zCore.$ZodSymbol ||
        validator instanceof zCore.$ZodMap ||
        validator instanceof zCore.$ZodSet ||
        validator instanceof zCore.$ZodPromise ||
        validator instanceof zCore.$ZodFile ||
        validator instanceof zCore.$ZodFunction ||
        validator instanceof zCore.$ZodVoid ||
        validator instanceof zCore.$ZodUndefined) {
        throw new Error(`Validator ${validator.constructor.name} is not supported in Convex`);
    }
    // Unsupported type
    return v.any();
}
function convexToZodLiteral(literal) {
    if (literal === undefined) {
        throw new Error("undefined is not a valid Convex value");
    }
    if (literal === null) {
        return v.null();
    }
    return v.literal(literal);
}
function extractStringLiterals(validator) {
    if (validator.kind === "literal") {
        const literalValidator = validator;
        if (typeof literalValidator.value === "string") {
            return [literalValidator.value];
        }
        return null;
    }
    if (validator.kind === "union") {
        const unionValidator = validator;
        const literals = [];
        for (const member of unionValidator.members) {
            const memberLiterals = extractStringLiterals(member);
            if (memberLiterals === null) {
                return null; // Not all members are string literals
            }
            literals.push(...memberLiterals);
        }
        return literals;
    }
    return null; // Not a literal or union of literals
}
function isValidRecordKey(validator) {
    if (validator.kind === "string" || validator.kind === "id") {
        return true;
    }
    if (validator.kind === "union") {
        const unionValidator = validator;
        return unionValidator.members.every(isValidRecordKey);
    }
    return false;
}
// #endregion
// #region Implementation: zid
/** Stores the table names for each `Zid` instance that is created. */
const _zidRegistry = zCore.registry();
// #endregion
