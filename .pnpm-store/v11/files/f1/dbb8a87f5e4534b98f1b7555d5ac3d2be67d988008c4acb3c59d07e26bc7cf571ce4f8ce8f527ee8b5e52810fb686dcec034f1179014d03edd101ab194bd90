import { RequestHeaderMap, RequestHeaderName, ResponseHeaderMap, ResponseHeaderName, TypedHeaders } from 'fetchdts';
import { CookieSerializeOptions } from 'cookie-es';
import { Session, SessionConfig, SessionData, SessionManager, SessionUpdate } from './session.js';
import { StandardSchemaV1 } from '@standard-schema/spec';
import { RequestHandler } from './request-handler.js';
export type { ResponseHeaderName, RequestHeaderName };
export declare function requestHandler<TRegister = unknown>(handler: RequestHandler<TRegister>): (request: Request, requestOpts: any) => Promise<Response> | Response;
export declare function getRequest(): Request;
export declare function getRequestHeaders(): TypedHeaders<RequestHeaderMap>;
export declare function getRequestHeader(name: RequestHeaderName): string | undefined;
export declare function getRequestIP(opts?: {
    /**
     * Use the X-Forwarded-For HTTP header set by proxies.
     *
     * Note: Make sure that this header can be trusted (your application running behind a CDN or reverse proxy) before enabling.
     */
    xForwardedFor?: boolean;
}): string | undefined;
/**
 * Get the request hostname.
 *
 * If `xForwardedHost` is `true`, it will use the `x-forwarded-host` header if it exists.
 *
 * If no host header is found, it will default to "localhost".
 */
export declare function getRequestHost(opts?: {
    xForwardedHost?: boolean;
}): string;
/**
 * Get the full incoming request URL.
 *
 * If `xForwardedHost` is `true`, it will use the `x-forwarded-host` header if it exists.
 *
 * If `xForwardedProto` is `false`, it will not use the `x-forwarded-proto` header.
 */
export declare function getRequestUrl(opts?: {
    xForwardedHost?: boolean;
    xForwardedProto?: boolean;
}): URL;
/**
 * Get the request protocol.
 *
 * If `x-forwarded-proto` header is set to "https", it will return "https". You can disable this behavior by setting `xForwardedProto` to `false`.
 *
 * If protocol cannot be determined, it will default to "http".
 */
export declare function getRequestProtocol(opts?: {
    xForwardedProto?: boolean;
}): 'http' | 'https' | (string & {});
export declare function setResponseHeaders(headers: TypedHeaders<ResponseHeaderMap>): void;
export declare function getResponseHeaders(): TypedHeaders<ResponseHeaderMap>;
export declare function getResponseHeader(name: ResponseHeaderName): string | undefined;
export declare function setResponseHeader(name: ResponseHeaderName, value: string | Array<string>): void;
export declare function removeResponseHeader(name: ResponseHeaderName): void;
export declare function clearResponseHeaders(headerNames?: Array<ResponseHeaderName>): void;
export declare function getResponseStatus(): number;
export declare function setResponseStatus(code?: number, text?: string): void;
/**
 * Parse the request to get HTTP Cookie header string and return an object of all cookie name-value pairs.
 * @returns Object of cookie name-value pairs
 * ```ts
 * const cookies = getCookies()
 * ```
 */
export declare function getCookies(): Record<string, string>;
/**
 * Get a cookie value by name.
 * @param name Name of the cookie to get
 * @returns {*} Value of the cookie (String or undefined)
 * ```ts
 * const authorization = getCookie('Authorization')
 * ```
 */
export declare function getCookie(name: string): string | undefined;
/**
 * Set a cookie value by name.
 * @param name Name of the cookie to set
 * @param value Value of the cookie to set
 * @param options {CookieSerializeOptions} Options for serializing the cookie
 * ```ts
 * setCookie('Authorization', '1234567')
 * ```
 */
export declare function setCookie(name: string, value: string, options?: CookieSerializeOptions): void;
/**
 * Remove a cookie by name.
 * @param name Name of the cookie to delete
 * @param serializeOptions {CookieSerializeOptions} Cookie options
 * ```ts
 * deleteCookie('SessionId')
 * ```
 */
export declare function deleteCookie(name: string, options?: CookieSerializeOptions): void;
/**
 * Create a session manager for the current request.
 */
export declare function useSession<TSessionData extends SessionData = SessionData>(config: SessionConfig): Promise<SessionManager<TSessionData>>;
/**
 * Get the session for the current request
 */
export declare function getSession<TSessionData extends SessionData = SessionData>(config: SessionConfig): Promise<Session<TSessionData>>;
/**
 * Update the session data for the current request.
 */
export declare function updateSession<TSessionData extends SessionData = SessionData>(config: SessionConfig, update?: SessionUpdate<TSessionData>): Promise<Session<TSessionData>>;
/**
 * Encrypt and sign the session data for the current request.
 */
export declare function sealSession(config: SessionConfig): Promise<string>;
/**
 * Decrypt and verify the session data for the current request.
 */
export declare function unsealSession(config: SessionConfig, sealed: string): Promise<Partial<Session>>;
/**
 * Clear the session data for the current request.
 */
export declare function clearSession(config: Partial<SessionConfig>): Promise<void>;
export declare function getResponse(): {
    status?: number;
    statusText?: string;
    get headers(): Headers;
};
export declare function getValidatedQuery<TSchema extends StandardSchemaV1>(schema: StandardSchemaV1): Promise<StandardSchemaV1.InferOutput<TSchema>>;
