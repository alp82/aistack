import { stripIndent } from "common-tags";
import { ConvexHttpClient } from "convex/browser";
import { getToken } from "../utils/index.js";
import React from "react";
// Caching supported for React 19+ only
const cache = React.cache ||
    ((fn) => {
        return (...args) => fn(...args);
    });
function setupClient(options) {
    const client = new ConvexHttpClient(options.convexUrl);
    if (options.token !== undefined) {
        client.setAuth(options.token);
    }
    // @ts-expect-error - setFetchOptions is internal
    client.setFetchOptions({ cache: "no-store" });
    return client;
}
const parseConvexSiteUrl = (url) => {
    if (!url) {
        throw new Error(stripIndent `
      CONVEX_SITE_URL is not set.
      This is automatically set in the Convex backend, but must be set in the TanStack Start environment.
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
const handler = (request, opts) => {
    const requestUrl = new URL(request.url);
    const nextUrl = `${opts.convexSiteUrl}${requestUrl.pathname}${requestUrl.search}`;
    const headers = new Headers(request.headers);
    headers.set("accept-encoding", "application/json");
    headers.set("host", new URL(opts.convexSiteUrl).host);
    return fetch(nextUrl, {
        method: request.method,
        headers,
        redirect: "manual",
        body: request.body,
        // @ts-expect-error - duplex is required for streaming request bodies in modern fetch
        duplex: "half",
    });
};
export const convexBetterAuthReactStart = (opts) => {
    const siteUrl = parseConvexSiteUrl(opts.convexSiteUrl);
    const cachedGetToken = cache(async (opts) => {
        const { getRequestHeaders } = await import("@tanstack/react-start/server");
        const headers = getRequestHeaders();
        return getToken(siteUrl, headers, opts);
    });
    const callWithToken = async (fn) => {
        const token = (await cachedGetToken(opts)) ?? {};
        try {
            return await fn(token?.token);
        }
        catch (error) {
            if (!opts?.jwtCache?.enabled ||
                token.isFresh ||
                opts.jwtCache?.isAuthError(error)) {
                throw error;
            }
            const newToken = await cachedGetToken({
                ...opts,
                forceRefresh: true,
            });
            return await fn(newToken.token);
        }
    };
    return {
        getToken: async () => {
            const token = await cachedGetToken(opts);
            return token.token;
        },
        handler: (request) => handler(request, opts),
        fetchAuthQuery: async (query, ...args) => {
            return callWithToken((token) => {
                const client = setupClient({ ...opts, token });
                return client.query(query, ...args);
            });
        },
        fetchAuthMutation: async (mutation, ...args) => {
            return callWithToken((token) => {
                const client = setupClient({ ...opts, token });
                return client.mutation(mutation, ...args);
            });
        },
        fetchAuthAction: async (action, ...args) => {
            return callWithToken((token) => {
                const client = setupClient({ ...opts, token });
                return client.action(action, ...args);
            });
        },
    };
};
//# sourceMappingURL=index.js.map