//#region src/cookies/cookie-utils.d.ts
interface CookieAttributes {
  value: string;
  "max-age"?: number | undefined;
  expires?: Date | undefined;
  domain?: string | undefined;
  path?: string | undefined;
  secure?: boolean | undefined;
  httponly?: boolean | undefined;
  samesite?: ("strict" | "lax" | "none") | undefined;
  [key: string]: any;
}
declare const SECURE_COOKIE_PREFIX = "__Secure-";
declare const HOST_COOKIE_PREFIX = "__Host-";
/**
 * Remove __Secure- or __Host- prefix from cookie name.
 */
declare function stripSecureCookiePrefix(cookieName: string): string;
declare function parseSetCookieHeader(setCookie: string): Map<string, CookieAttributes>;
declare function setCookieToHeader(headers: Headers): (context: {
  response: Response;
}) => void;
//#endregion
export { HOST_COOKIE_PREFIX, SECURE_COOKIE_PREFIX, parseSetCookieHeader, setCookieToHeader, stripSecureCookiePrefix };
//# sourceMappingURL=cookie-utils.d.mts.map