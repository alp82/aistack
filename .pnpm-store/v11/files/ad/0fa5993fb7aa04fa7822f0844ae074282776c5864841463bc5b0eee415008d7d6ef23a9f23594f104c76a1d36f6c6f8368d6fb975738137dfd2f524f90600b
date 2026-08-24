import { omit, pick } from "../index.js";
import { addFieldsToValidator } from "../validators.js";
/**
 * A helper for defining a custom function that modifies the ctx and args, to
 * be used with customQuery, customMutation, etc.
 *
 * This is helpful to avoid specifying the Customization type explicitly.
 *
 * e.g.
 * ```ts
 * const myCustomization = customCtxAndArgs({
 *   args: { sessionId: v.id("sessions") },
 *   input: async (ctx, args) => {
 *     const user = await getUserOrNull(ctx);
 *     const session = await db.get(sessionId);
 *     const db = wrapDatabaseReader({ user }, ctx.db, rlsRules);
 *     return { ctx: { db, user, session }, args: {} };
 *   },
 * });
 *
 * const myQueryBuilder = customQuery(query, myCustomization);
 * ```
 * If the required args are not returned, they will not be provided for the
 * modified function. All returned ctx and args will show up in the type
 * signature for the modified function. To remove something from `ctx`, you
 * can return it as `undefined`.
 */
export function customCtxAndArgs(objectWithArgsAndInput) {
    // This is already the right type. This function just helps you define it.
    return objectWithArgsAndInput;
}
/**
 * A helper for defining a Customization when your mod doesn't need to add or remove
 * anything from args.
 * @param modifyCtx A function that defines how to modify the ctx.
 * @returns A ctx delta to be applied to the original ctx.
 */
export function customCtx(modifyCtx) {
    return {
        args: {},
        input: async (ctx, _, extra) => ({
            ctx: await modifyCtx(ctx, extra),
            args: {},
        }),
    };
}
/**
 * A Customization that doesn't add or remove any context or args.
 */
export const NoOp = {
    args: {},
    input() {
        return { args: {}, ctx: {} };
    },
};
/**
 * customQuery helps define custom behavior on top of `query` or `internalQuery`
 * by passing a function that modifies the ctx and args.
 *
 * Example usage:
 * ```js
 * const myQueryBuilder = customQuery(query, {
 *   args: { sessionId: v.id("sessions") },
 *   input: async (ctx, args) => {
 *     const user = await getUserOrNull(ctx);
 *     const session = await db.get(sessionId);
 *     const db = wrapDatabaseReader({ user }, ctx.db, rlsRules);
 *     return {
 *       ctx: { db, user, session },
 *       args: {},
 *       onSuccess: ({ result }) => {
 *         // Optional callback that runs after the function executes
 *         // Has access to resources created during input processing
 *         console.log(`Query for ${user.name} returned:`, result);
 *       }
 *     };
 *   },
 * });
 *
 * // Using the custom builder
 * export const getSomeData = myQueryBuilder({
 *   args: { someArg: v.string() },
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
 * const myInternalQuery = customQuery(
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
 *   args: {},
 *   handler: async (ctx, args) => {
 *     return ctx.user;
 *   },
 * });
 *
 * @param query The query to be modified. Usually `query` or `internalQuery`
 *   from `_generated/server`.
 * @param customization The modifier to be applied to the query, changing ctx and args.
 * @returns A new query builder to define queries with modified ctx and args.
 */
export function customQuery(query, customization) {
    return customFnBuilder(query, customization);
}
/**
 * customMutation helps define custom behavior on top of `mutation`
 * or `internalMutation` by passing a function that modifies the ctx and args.
 *
 * Example usage:
 * ```js
 * const myMutationBuilder = customMutation(mutation, {
 *   args: { sessionId: v.id("sessions") },
 *   input: async (ctx, args) => {
 *     const user = await getUserOrNull(ctx);
 *     const session = await db.get(sessionId);
 *     const db = wrapDatabaseReader({ user }, ctx.db, rlsRules);
 *     return {
 *       ctx: { db, user, session },
 *       args: {},
 *       onSuccess: ({ result }) => {
 *         // Optional callback that runs after the function executes
 *         // Has access to resources created during input processing
 *         console.log(`User ${user.name} returned:`, result);
 *       }
 *     };
 *   },
 * });
 *
 * // Using the custom builder
 * export const setSomeData = myMutationBuilder({
 *   args: { someArg: v.string() },
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
 * const myUserMutation = customMutation(
 *   mutation,
 *   customCtx(async (ctx) => {
 *     return {
 *       // Throws an exception if the user isn't logged in
 *       user: await getUserByTokenIdentifier(ctx),
 *     };
 *   })
 * );
 *
 * // Using it
 * export const setMyName = myUserMutation({
 *   args: { name: v.string() },
 *   handler: async (ctx, args) => {
 *     await ctx.db.patch(ctx.user._id, { name: args.name });
 *   },
 * });
 *
 * @param mutation The mutation to be modified. Usually `mutation` or `internalMutation`
 *   from `_generated/server`.
 * @param customization The modifier to be applied to the mutation, changing ctx and args.
 * @returns A new mutation builder to define queries with modified ctx and args.
 */
export function customMutation(mutation, customization) {
    return customFnBuilder(mutation, customization);
}
/**
 * customAction helps define custom behavior on top of `action`
 * or `internalAction` by passing a function that modifies the ctx and args.
 *
 * Example usage:
 * ```js
 * const myActionBuilder = customAction(action, {
 *   args: { secretKey: v.string() },
 *   input: async (ctx, args) => {
 *     // Very basic authorization, e.g. from trusted backends.
 *     if (args.secretKey !== process.env.SECRET_KEY) {
 *       throw new Error("Invalid secret key");
 *     }
 *     const user = await ctx.runQuery(internal.users.getUser, {});
 *     // Create resources that can be used in the onSuccess callback
 *     const logger = createLogger();
 *     return {
 *       ctx: { user },
 *       args: {},
 *       onSuccess: ({ result }) => {
 *         // Optional callback that runs after the function executes
 *         // Has access to resources created during input processing
 *         logger.info(`Action for user ${user.name} returned:`, result);
 *       }
 *     };
 *   },
 * });
 *
 * // Using the custom builder
 * export const runSomeAction = myActionBuilder({
 *   args: { someArg: v.string() },
 *   handler: async (ctx, args) => {
 *     const { user, scheduler } = ctx;
 *     const { someArg } = args;
 *     // ...
 *   }
 * });
 * ```
 *
 * Simple usage only modifying ctx:
 * ```js
 * const myUserAction = customAction(
 *   internalAction,
 *   customCtx(async (ctx) => {
 *     return {
 *       // Throws an exception if the user isn't logged in
 *       user: await ctx.runQuery(internal.users.getUser, {});
 *     };
 *   })
 * );
 *
 * // Using it
 * export const sendUserEmail = myUserAction({
 *   args: { subject: v.string(), body: v.string() },
 *   handler: async (ctx, args) => {
 *     await sendEmail(ctx.user.email, args.subject, args.body);
 *   },
 * });
 *
 * @param action The action to be modified. Usually `action` or `internalAction`
 *   from `_generated/server`.
 * @param customization The modifier to be applied to the action, changing ctx and args.
 * @returns A new action builder to define queries with modified ctx and args.
 */
export function customAction(action, customization) {
    return customFnBuilder(action, customization);
}
function customFnBuilder(builder, customization) {
    // Looking forward to when input / args / ... are optional
    const customInput = customization.input ?? NoOp.input;
    const inputArgs = customization.args ?? NoOp.args;
    return function customBuilder(fn) {
        // N.B.: This is fine if it's a function
        const { args, handler = fn, returns, ...extra } = fn;
        if (args) {
            return builder({
                args: addFieldsToValidator(args, inputArgs),
                returns,
                handler: async (ctx, allArgs) => {
                    const added = await customInput(ctx, pick(allArgs, Object.keys(inputArgs)), extra);
                    const args = omit(allArgs, Object.keys(inputArgs));
                    const finalCtx = { ...ctx, ...added.ctx };
                    const finalArgs = { ...args, ...added.args };
                    const result = await handler(finalCtx, finalArgs);
                    if (added.onSuccess) {
                        await added.onSuccess({ ctx, args, result });
                    }
                    return result;
                },
            });
        }
        if (Object.keys(inputArgs).length > 0) {
            throw new Error("If you're using a custom function with arguments for the input " +
                "customization, you must declare the arguments for the function too.");
        }
        return builder({
            returns: fn.returns,
            handler: async (ctx, args) => {
                const added = await customInput(ctx, args, extra);
                const finalCtx = { ...ctx, ...added.ctx };
                const finalArgs = { ...args, ...added.args };
                const result = await handler(finalCtx, finalArgs);
                if (added.onSuccess) {
                    await added.onSuccess({ ctx, args, result });
                }
                return result;
            },
        });
    };
}
