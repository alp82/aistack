import { betterFetch } from "@better-fetch/fetch";
import { getSessionCookie } from "better-auth/cookies";
import { JWT_COOKIE_NAME } from "../plugins/convex/index.js";
import * as jose from "jose";
export const isQueryCtx = (ctx) => {
    return "db" in ctx;
};
export const isMutationCtx = (ctx) => {
    return "db" in ctx && "scheduler" in ctx;
};
export const isActionCtx = (ctx) => {
    return "runAction" in ctx;
};
export const isRunMutationCtx = (ctx) => {
    return "runMutation" in ctx;
};
export const requireQueryCtx = (ctx) => {
    if (!isQueryCtx(ctx)) {
        throw new Error("Query context required");
    }
    return ctx;
};
export const requireMutationCtx = (ctx) => {
    if (!isMutationCtx(ctx)) {
        throw new Error("Mutation context required");
    }
    return ctx;
};
export const requireActionCtx = (ctx) => {
    if (!isActionCtx(ctx)) {
        throw new Error("Action context required");
    }
    return ctx;
};
export const requireRunMutationCtx = (ctx) => {
    if (!isRunMutationCtx(ctx)) {
        throw new Error("Mutation or action context required");
    }
    return ctx;
};
export const getToken = async (siteUrl, headers, opts) => {
    const fetchToken = async () => {
        const { data } = await betterFetch("/api/auth/convex/token", {
            baseURL: siteUrl,
            headers,
        });
        return { isFresh: true, token: data?.token };
    };
    if (!opts?.jwtCache?.enabled || opts.forceRefresh) {
        return await fetchToken();
    }
    const token = getSessionCookie(new Headers(headers), {
        cookieName: JWT_COOKIE_NAME,
        cookiePrefix: opts?.cookiePrefix,
    });
    if (!token) {
        return await fetchToken();
    }
    try {
        const claims = jose.decodeJwt(token);
        const exp = claims?.exp;
        const now = Math.floor(new Date().getTime() / 1000);
        const isExpired = exp
            ? now > exp + (opts?.jwtCache?.expirationToleranceSeconds ?? 60)
            : true;
        if (!isExpired) {
            return { isFresh: false, token };
        }
    }
    catch (error) {
        // eslint-disable-next-line no-console
        console.error("Error decoding JWT", error);
    }
    return await fetchToken();
};
export const parseJwks = (providerConfig) => {
    const staticJwksString = "jwks" in providerConfig && providerConfig.jwks?.startsWith("data:text/")
        ? atob(providerConfig.jwks.split("base64,")[1])
        : undefined;
    if (!staticJwksString) {
        return;
    }
    const parsed = JSON.parse(staticJwksString?.slice(1, -1).replaceAll(/[\s\\]/g, "") || "{}");
    const staticJwks = {
        ...parsed,
        privateKey: `"${parsed.privateKey}"`,
        publicKey: `"${parsed.publicKey}"`,
    };
    return staticJwks;
};
//# sourceMappingURL=index.js.map