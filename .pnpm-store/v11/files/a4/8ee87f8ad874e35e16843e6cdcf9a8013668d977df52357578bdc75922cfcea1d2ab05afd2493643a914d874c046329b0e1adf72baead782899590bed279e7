import { GenericEndpointContext } from "@better-auth/core";
import "zod";
import { CookieOptions } from "better-call";

//#region src/cookies/session-store.d.ts
interface Cookie {
  name: string;
  value: string;
  options: CookieOptions;
}
declare const createSessionStore: (cookieName: string, cookieOptions: CookieOptions, ctx: GenericEndpointContext) => {
  /**
   * Get the full session data by joining all chunks
   */
  getValue(): string;
  /**
   * Check if there are existing chunks
   */
  hasChunks(): boolean;
  /**
   * Chunk a cookie value and return all cookies to set (including cleanup cookies)
   */
  chunk(value: string, options?: Partial<CookieOptions>): Cookie[];
  /**
   * Get cookies to clean up all chunks
   */
  clean(): Cookie[];
  /**
   * Set all cookies in the context
   */
  setCookies(cookies: Cookie[]): void;
};
declare function getChunkedCookie(ctx: GenericEndpointContext, cookieName: string): string | null;
//#endregion
export { createSessionStore, getChunkedCookie };
//# sourceMappingURL=session-store.d.mts.map