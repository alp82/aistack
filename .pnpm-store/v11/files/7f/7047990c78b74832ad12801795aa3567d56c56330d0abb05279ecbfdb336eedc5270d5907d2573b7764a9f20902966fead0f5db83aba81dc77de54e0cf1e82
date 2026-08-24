//#region src/plugins/last-login-method/client.d.ts
/**
 * Configuration for the client-side last login method plugin
 */
interface LastLoginMethodClientConfig {
  /**
   * Name of the cookie to read the last login method from
   * @default "better-auth.last_used_login_method"
   */
  cookieName?: string | undefined;
}
/**
 * Client-side plugin to retrieve the last used login method
 */
declare const lastLoginMethodClient: (config?: LastLoginMethodClientConfig) => {
  id: "last-login-method-client";
  getActions(): {
    /**
     * Get the last used login method from cookies
     * @returns The last used login method or null if not found
     */
    getLastUsedLoginMethod: () => string | null;
    /**
     * Clear the last used login method cookie
     * This sets the cookie with an expiration date in the past
     */
    clearLastUsedLoginMethod: () => void;
    /**
     * Check if a specific login method was the last used
     * @param method The method to check
     * @returns True if the method was the last used, false otherwise
     */
    isLastUsedLoginMethod: (method: string) => boolean;
  };
};
//#endregion
export { LastLoginMethodClientConfig, lastLoginMethodClient };
//# sourceMappingURL=client.d.mts.map