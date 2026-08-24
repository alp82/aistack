import { v } from "convex/values";
// Validator for session IDs.
export const vSessionId = v.string();
export const SessionIdArg = { sessionId: vSessionId };
export function runSessionFunctions(ctx, sessionId) {
    return {
        runSessionQuery(fn, ...args) {
            const argsWithSession = { ...(args[0] ?? {}), sessionId };
            return ctx.runQuery(fn, argsWithSession);
        },
        runSessionMutation(fn, ...args) {
            const argsWithSession = { ...(args[0] ?? {}), sessionId };
            return ctx.runMutation(fn, argsWithSession);
        },
        runSessionAction(fn, ...args) {
            const argsWithSession = { ...(args[0] ?? {}), sessionId };
            return ctx.runAction(fn, argsWithSession);
        },
    };
}
