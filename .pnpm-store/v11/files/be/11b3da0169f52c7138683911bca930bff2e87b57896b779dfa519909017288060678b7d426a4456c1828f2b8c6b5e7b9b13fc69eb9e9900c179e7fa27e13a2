import * as _better_auth_core28 from "@better-auth/core";
import { ClientFetchOption } from "@better-auth/core";
import * as _better_fetch_fetch97 from "@better-fetch/fetch";

//#region src/plugins/one-tap/client.d.ts
declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: any) => void;
          prompt: (callback?: (notification: any) => void) => void;
        };
      };
    } | undefined;
    googleScriptInitialized?: boolean | undefined;
  }
}
interface GoogleOneTapOptions {
  /**
   * Google client ID
   */
  clientId: string;
  /**
   * Auto select the account if the user is already signed in
   */
  autoSelect?: boolean | undefined;
  /**
   * Cancel the flow when the user taps outside the prompt
   */
  cancelOnTapOutside?: boolean | undefined;
  /**
   * The mode to use for the Google One Tap flow
   *
   * popup: Use a popup window
   * redirect: Redirect the user to the Google One Tap flow
   *
   * @default "popup"
   */
  uxMode?: ("popup" | "redirect") | undefined;
  /**
   * The context to use for the Google One Tap flow.
   *
   * @see {@link https://developers.google.com/identity/gsi/web/reference/js-reference}
   * @default "signin"
   */
  context?: ("signin" | "signup" | "use") | undefined;
  /**
   * Additional configuration options to pass to the Google One Tap API.
   */
  additionalOptions?: Record<string, any> | undefined;
  /**
   * Configuration options for the prompt and exponential backoff behavior.
   */
  promptOptions?: {
    /**
     * Base delay (in milliseconds) for exponential backoff.
     * @default 1000
     */
    baseDelay?: number;
    /**
     * Maximum number of prompt attempts before calling onPromptNotification.
     * @default 5
     */
    maxAttempts?: number;
    /**
     * Whether to support FedCM (Federated Credential Management) support.
     *
     * @see {@link https://developer.chrome.com/docs/identity/fedcm/overview}
     * @default true
     */
    fedCM?: boolean | undefined;
  } | undefined;
}
interface GoogleOneTapActionOptions extends Omit<GoogleOneTapOptions, "clientId" | "promptOptions"> {
  fetchOptions?: ClientFetchOption | undefined;
  /**
   * Callback URL.
   */
  callbackURL?: string | undefined;
  /**
   * Optional callback that receives the prompt notification if (or when) the prompt is dismissed or skipped.
   * This lets you render an alternative UI (e.g. a Google Sign-In button) to restart the process.
   */
  onPromptNotification?: ((notification?: any | undefined) => void) | undefined;
  nonce?: string | undefined;
}
declare const oneTapClient: (options: GoogleOneTapOptions) => {
  id: "one-tap";
  fetchPlugins: {
    id: string;
    name: string;
    hooks: {
      onResponse(ctx: _better_fetch_fetch97.ResponseContext): Promise<void>;
    };
  }[];
  getActions: ($fetch: _better_fetch_fetch97.BetterFetch, _: _better_auth_core28.ClientStore) => {
    oneTap: (opts?: GoogleOneTapActionOptions | undefined, fetchOptions?: ClientFetchOption | undefined) => Promise<void>;
  };
  getAtoms($fetch: _better_fetch_fetch97.BetterFetch): {};
};
//#endregion
export { GoogleOneTapActionOptions, GoogleOneTapOptions, oneTapClient };
//# sourceMappingURL=client.d.mts.map