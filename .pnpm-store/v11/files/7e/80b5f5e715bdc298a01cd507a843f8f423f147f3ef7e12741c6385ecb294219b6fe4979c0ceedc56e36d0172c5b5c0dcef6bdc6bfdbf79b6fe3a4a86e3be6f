import { stripIndent } from "common-tags";
import { fetchAction, fetchMutation, fetchQuery, preloadQuery, } from "convex/nextjs";
import React from "react";
import { getToken } from "../utils/index.js";
// Caching supported for React 19+ only
const cache = React.cache ||
    ((fn) => {
        return (...args) => fn(...args);
    });
const parseConvexSiteUrl = (url) => {
    if (!url) {
        throw new Error(stripIndent `
      CONVEX_SITE_URL is not set.
      This is automatically set in the Convex backend, but must be set in the Next.js environment.
      For local development, this can be set in the .env.local file.
    `);
    }
    if (url.endsWith(".convex.cloud")) {
        throw new Error(stripIndent `
      CONVEX_SITE_URL should be set to your Convex Site URL, which ends in .convex.site.
      Currently set to ${url}.
    `);
    }
    return url;
};
const handler = (request, siteUrl) => {
    const requestUrl = new URL(request.url);
    const nextUrl = `${siteUrl}${requestUrl.pathname}${requestUrl.search}`;
    const newRequest = new Request(nextUrl, request);
    newRequest.headers.set("accept-encoding", "application/json");
    newRequest.headers.set("host", new URL(siteUrl).host);
    return fetch(newRequest, { method: request.method, redirect: "manual" });
};
const nextJsHandler = (siteUrl) => ({
    GET: (request) => handler(request, siteUrl),
    POST: (request) => handler(request, siteUrl),
});
const getArgsAndOptions = (args, token) => {
    return [args[0], { token }];
};
export const convexBetterAuthNextJs = (opts) => {
    const siteUrl = parseConvexSiteUrl(opts.convexSiteUrl);
    const cachedGetToken = cache(async ({ forceRefresh } = {}) => {
        const headers = await (await import("next/headers.js")).headers();
        return getToken(siteUrl, headers, { ...opts, forceRefresh });
    });
    const callWithToken = async (fn) => {
        const token = await cachedGetToken();
        try {
            return await fn(token?.token);
        }
        catch (error) {
            if (!opts?.jwtCache?.enabled ||
                token.isFresh ||
                opts.jwtCache.isAuthError(error)) {
                throw error;
            }
            const newToken = await cachedGetToken({ forceRefresh: true });
            return await fn(newToken.token);
        }
    };
    return {
        getToken: async () => {
            const token = await cachedGetToken();
            return token.token;
        },
        handler: nextJsHandler(siteUrl),
        isAuthenticated: async () => {
            const token = await cachedGetToken();
            return !!token.token;
        },
        preloadAuthQuery: async (query, ...args) => {
            return callWithToken((token) => {
                const argsAndOptions = getArgsAndOptions(args, token);
                return preloadQuery(query, ...argsAndOptions);
            });
        },
        fetchAuthQuery: async (query, ...args) => {
            return callWithToken((token) => {
                const argsAndOptions = getArgsAndOptions(args, token);
                return fetchQuery(query, ...argsAndOptions);
            });
        },
        fetchAuthMutation: async (mutation, ...args) => {
            return callWithToken((token) => {
                const argsAndOptions = getArgsAndOptions(args, token);
                return fetchMutation(mutation, ...argsAndOptions);
            });
        },
        fetchAuthAction: async (action, ...args) => {
            return callWithToken((token) => {
                const argsAndOptions = getArgsAndOptions(args, token);
                return fetchAction(action, ...argsAndOptions);
            });
        },
    };
};
//# sourceMappingURL=index.js.map