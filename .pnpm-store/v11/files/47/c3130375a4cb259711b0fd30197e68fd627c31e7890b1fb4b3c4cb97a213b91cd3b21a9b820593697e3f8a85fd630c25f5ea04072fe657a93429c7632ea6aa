import type { ClientStore } from "better-auth";
import type { BetterFetchOption } from "@better-fetch/fetch";
import type { crossDomain } from "./index.js";
interface CookieAttributes {
    value: string;
    expires?: Date;
    "max-age"?: number;
    domain?: string;
    path?: string;
    secure?: boolean;
    httpOnly?: boolean;
    sameSite?: "Strict" | "Lax" | "None";
}
export declare function parseSetCookieHeader(header: string): Map<string, CookieAttributes>;
export declare function getSetCookie(header: string, prevCookie?: string): string;
export declare function getCookie(cookie: string): string;
export declare const crossDomainClient: (opts?: {
    storage?: {
        setItem: (key: string, value: string) => any;
        getItem: (key: string) => string | null;
    };
    storagePrefix?: string;
    disableCache?: boolean;
}) => {
    id: "cross-domain";
    $InferServerPlugin: ReturnType<typeof crossDomain>;
    getActions(_: import("@better-fetch/fetch").BetterFetch, $store: ClientStore): {
        /**
         * Get the stored cookie.
         *
         * You can use this to get the cookie stored in the device and use it in your fetch
         * requests.
         *
         * @example
         * ```ts
         * const cookie = client.getCookie();
         * fetch("https://api.example.com", {
         * 	headers: {
         * 		cookie,
         * 	},
         * });
         */
        getCookie: () => string;
        /**
         * Notify the session signal.
         *
         * This is used to trigger an update in useSession, generally when a new session
         * token is set.
         *
         * @example
         * ```ts
         * client.notifySessionSignal();
         * ```
         */
        updateSession: () => void;
        /**
         * Get the stored session data.
         *
         * @example
         * ```ts
         * const sessionData = client.getSessionData();
         * ```
         */
        getSessionData: () => any;
    };
    fetchPlugins: {
        id: string;
        name: string;
        hooks: {
            onSuccess(context: import("@better-fetch/fetch").SuccessContext<any>): Promise<void>;
        };
        init(url: string, options: ({
            method?: string | undefined;
            headers?: (HeadersInit & (HeadersInit | {
                accept: "application/json" | "text/plain" | "application/octet-stream";
                "content-type": "application/json" | "text/plain" | "application/x-www-form-urlencoded" | "multipart/form-data" | "application/octet-stream";
                authorization: "Bearer" | "Basic";
            })) | undefined;
            redirect?: RequestRedirect | undefined;
            cache?: RequestCache | undefined;
            credentials?: RequestCredentials | undefined;
            integrity?: string | undefined;
            keepalive?: boolean | undefined;
            mode?: RequestMode | undefined;
            priority?: RequestPriority | undefined;
            referrer?: string | undefined;
            referrerPolicy?: ReferrerPolicy | undefined;
            signal?: (AbortSignal | null) | undefined;
            window?: null | undefined;
            onRequest?: (<T extends Record<string, any>>(context: import("@better-fetch/fetch").RequestContext<T>) => Promise<import("@better-fetch/fetch").RequestContext | void> | import("@better-fetch/fetch").RequestContext | void) | undefined;
            onResponse?: ((context: import("@better-fetch/fetch").ResponseContext) => Promise<Response | void | import("@better-fetch/fetch").ResponseContext> | Response | import("@better-fetch/fetch").ResponseContext | void) | undefined;
            onSuccess?: ((context: import("@better-fetch/fetch").SuccessContext<any>) => Promise<void> | void) | undefined;
            onError?: ((context: import("@better-fetch/fetch").ErrorContext) => Promise<void> | void) | undefined;
            onRetry?: ((response: import("@better-fetch/fetch").ResponseContext) => Promise<void> | void) | undefined;
            hookOptions?: {
                cloneResponse?: boolean;
            } | undefined;
            timeout?: number | undefined;
            customFetchImpl?: import("@better-fetch/fetch").FetchEsque | undefined;
            plugins?: import("@better-fetch/fetch").BetterFetchPlugin[] | undefined;
            baseURL?: string | undefined;
            throw?: boolean | undefined;
            auth?: ({
                type: "Bearer";
                token: string | Promise<string | undefined> | (() => string | Promise<string | undefined> | undefined) | undefined;
            } | {
                type: "Basic";
                username: string | (() => string | undefined) | undefined;
                password: string | (() => string | undefined) | undefined;
            } | {
                type: "Custom";
                prefix: string | (() => string | undefined) | undefined;
                value: string | (() => string | undefined) | undefined;
            }) | undefined;
            body?: any;
            query?: any;
            params?: any;
            duplex?: "full" | "half" | undefined;
            jsonParser?: ((text: string) => Promise<any> | any) | undefined;
            retry?: import("@better-fetch/fetch").RetryOptions | undefined;
            retryAttempt?: number | undefined;
            output?: (import("@better-fetch/fetch").StandardSchemaV1 | typeof Blob | typeof File) | undefined;
            errorSchema?: import("@better-fetch/fetch").StandardSchemaV1 | undefined;
            disableValidation?: boolean | undefined;
        } & Record<string, any>) | undefined): Promise<{
            url: string;
            options: BetterFetchOption;
        }>;
    }[];
};
export {};
//# sourceMappingURL=client.d.ts.map