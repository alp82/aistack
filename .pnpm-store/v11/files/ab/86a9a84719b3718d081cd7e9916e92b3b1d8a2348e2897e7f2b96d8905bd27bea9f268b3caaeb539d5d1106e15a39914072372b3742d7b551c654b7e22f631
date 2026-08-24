import { i as WebAuthnChallengeValue, n as Passkey, r as PasskeyOptions, t as passkey } from "./index-DneB0hsm.mjs";
import * as better_auth_client0 from "better-auth/client";
import * as nanostores0 from "nanostores";
import { atom } from "nanostores";
import { ClientFetchOption, ClientStore } from "@better-auth/core";
import { BetterFetch } from "@better-fetch/fetch";
import { Session, User } from "better-auth/types";
export * from "@simplewebauthn/server";

//#region src/client.d.ts
declare const getPasskeyActions: ($fetch: BetterFetch, {
  $listPasskeys,
  $store
}: {
  $listPasskeys: ReturnType<typeof atom<any>>;
  $store: ClientStore;
}) => {
  signIn: {
    /**
     * Sign in with a registered passkey
     */
    passkey: (opts?: {
      autoFill?: boolean;
      fetchOptions?: ClientFetchOption;
    } | undefined, options?: ClientFetchOption | undefined) => Promise<{
      data: null;
      error: {
        message?: string | undefined;
        status: number;
        statusText: string;
      };
    } | {
      data: {
        session: Session;
        user: User;
      };
      error: null;
    } | {
      data: null;
      error: {
        code: string;
        message: string;
        status: number;
        statusText: string;
      };
    }>;
  };
  passkey: {
    /**
     * Add a passkey to the user account
     */
    addPasskey: (opts?: {
      fetchOptions?: ClientFetchOption;
      /**
       * The name of the passkey. This is used to
       * identify the passkey in the UI.
       */
      name?: string;
      /**
       * The type of attachment for the passkey. Defaults to both
       * platform and cross-platform allowed, with platform preferred.
       */
      authenticatorAttachment?: "platform" | "cross-platform";
      /**
       * Try to silently create a passkey with the password manager that the user just signed
       * in with.
       * @default false
       */
      useAutoRegister?: boolean;
    } | undefined, fetchOpts?: ClientFetchOption | undefined) => Promise<{
      data: null;
      error: {
        message?: string | undefined;
        status: number;
        statusText: string;
      };
    } | {
      data: Passkey;
      error: null;
    } | {
      data: null;
      error: {
        code: string;
        message: string;
        status: number;
        statusText: string;
      };
    }>;
  };
  /**
   * Inferred Internal Types
   */
  $Infer: {
    Passkey: Passkey;
  };
};
declare const passkeyClient: () => {
  id: "passkey";
  $InferServerPlugin: ReturnType<typeof passkey>;
  getActions: ($fetch: BetterFetch, $store: ClientStore) => {
    signIn: {
      /**
       * Sign in with a registered passkey
       */
      passkey: (opts?: {
        autoFill?: boolean;
        fetchOptions?: ClientFetchOption;
      } | undefined, options?: ClientFetchOption | undefined) => Promise<{
        data: null;
        error: {
          message?: string | undefined;
          status: number;
          statusText: string;
        };
      } | {
        data: {
          session: Session;
          user: User;
        };
        error: null;
      } | {
        data: null;
        error: {
          code: string;
          message: string;
          status: number;
          statusText: string;
        };
      }>;
    };
    passkey: {
      /**
       * Add a passkey to the user account
       */
      addPasskey: (opts?: {
        fetchOptions?: ClientFetchOption;
        /**
         * The name of the passkey. This is used to
         * identify the passkey in the UI.
         */
        name?: string;
        /**
         * The type of attachment for the passkey. Defaults to both
         * platform and cross-platform allowed, with platform preferred.
         */
        authenticatorAttachment?: "platform" | "cross-platform";
        /**
         * Try to silently create a passkey with the password manager that the user just signed
         * in with.
         * @default false
         */
        useAutoRegister?: boolean;
      } | undefined, fetchOpts?: ClientFetchOption | undefined) => Promise<{
        data: null;
        error: {
          message?: string | undefined;
          status: number;
          statusText: string;
        };
      } | {
        data: Passkey;
        error: null;
      } | {
        data: null;
        error: {
          code: string;
          message: string;
          status: number;
          statusText: string;
        };
      }>;
    };
    /**
     * Inferred Internal Types
     */
    $Infer: {
      Passkey: Passkey;
    };
  };
  getAtoms($fetch: BetterFetch): {
    listPasskeys: better_auth_client0.AuthQueryAtom<Passkey[]>;
    $listPasskeys: nanostores0.PreinitializedWritableAtom<any> & object;
  };
  pathMethods: {
    "/passkey/register": "POST";
    "/passkey/authenticate": "POST";
  };
  atomListeners: ({
    matcher(path: string): path is "/passkey/delete-passkey" | "/passkey/update-passkey" | "/passkey/verify-registration" | "/sign-out";
    signal: "$listPasskeys";
  } | {
    matcher: (path: string) => path is "/passkey/verify-authentication";
    signal: "$sessionSignal";
  })[];
};
//#endregion
export { Passkey, PasskeyOptions, WebAuthnChallengeValue, getPasskeyActions, passkeyClient };