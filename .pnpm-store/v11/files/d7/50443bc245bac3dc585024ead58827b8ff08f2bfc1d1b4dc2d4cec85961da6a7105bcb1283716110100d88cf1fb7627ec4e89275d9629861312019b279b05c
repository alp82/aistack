import { Session, User } from "../types/models.mjs";
import "../types/index.mjs";
import { HOST_COOKIE_PREFIX, SECURE_COOKIE_PREFIX, parseSetCookieHeader, setCookieToHeader, stripSecureCookiePrefix } from "./cookie-utils.mjs";
import { createSessionStore, getChunkedCookie } from "./session-store.mjs";
import { BetterAuthCookies, BetterAuthOptions, GenericEndpointContext } from "@better-auth/core";
import { CookieOptions } from "better-call";

//#region src/cookies/index.d.ts
declare function createCookieGetter(options: BetterAuthOptions): (cookieName: string, overrideAttributes?: Partial<CookieOptions>) => {
  name: string;
  attributes: CookieOptions;
};
declare function getCookies(options: BetterAuthOptions): {
  sessionToken: {
    name: string;
    options: CookieOptions;
  };
  /**
   * This cookie is used to store the session data in the cookie
   * This is useful for when you want to cache the session in the cookie
   */
  sessionData: {
    name: string;
    options: CookieOptions;
  };
  dontRememberToken: {
    name: string;
    options: CookieOptions;
  };
  accountData: {
    name: string;
    options: CookieOptions;
  };
};
declare function setCookieCache(ctx: GenericEndpointContext, session: {
  session: Session & Record<string, any>;
  user: User;
}, dontRememberMe: boolean): Promise<void>;
declare function setSessionCookie(ctx: GenericEndpointContext, session: {
  session: Session & Record<string, any>;
  user: User;
}, dontRememberMe?: boolean | undefined, overrides?: Partial<CookieOptions> | undefined): Promise<void>;
declare function deleteSessionCookie(ctx: GenericEndpointContext, skipDontRememberMe?: boolean | undefined): void;
declare function parseCookies(cookieHeader: string): Map<string, string>;
type EligibleCookies = (string & {}) | (keyof BetterAuthCookies & {});
declare const getSessionCookie: (request: Request | Headers, config?: {
  cookiePrefix?: string;
  cookieName?: string;
  path?: string;
} | undefined) => string | null;
declare const getCookieCache: <S extends {
  session: Session & Record<string, any>;
  user: User & Record<string, any>;
  updatedAt: number;
  version?: string;
}>(request: Request | Headers, config?: {
  cookiePrefix?: string;
  cookieName?: string;
  isSecure?: boolean;
  secret?: string;
  strategy?: "compact" | "jwt" | "jwe";
  version?: string | ((session: Session & Record<string, any>, user: User & Record<string, any>) => string) | ((session: Session & Record<string, any>, user: User & Record<string, any>) => Promise<string>);
} | undefined) => Promise<S | null>;
//#endregion
export { EligibleCookies, HOST_COOKIE_PREFIX, SECURE_COOKIE_PREFIX, createCookieGetter, createSessionStore, deleteSessionCookie, getChunkedCookie, getCookieCache, getCookies, getSessionCookie, parseCookies, parseSetCookieHeader, setCookieCache, setCookieToHeader, setSessionCookie, stripSecureCookiePrefix };
//# sourceMappingURL=index.d.mts.map