import { GenericOAuthConfig, GenericOAuthOptions } from "./types.mjs";
import { Auth0Options, auth0 } from "./providers/auth0.mjs";
import { HubSpotOptions, hubspot } from "./providers/hubspot.mjs";
import { KeycloakOptions, keycloak } from "./providers/keycloak.mjs";
import { LineOptions, line } from "./providers/line.mjs";
import { MicrosoftEntraIdOptions, microsoftEntraId } from "./providers/microsoft-entra-id.mjs";
import { OktaOptions, okta } from "./providers/okta.mjs";
import { PatreonOptions, patreon } from "./providers/patreon.mjs";
import { SlackOptions, slack } from "./providers/slack.mjs";
import "./providers/index.mjs";
import { AuthContext } from "@better-auth/core";
import * as _better_auth_core_oauth21 from "@better-auth/core/oauth2";
import { OAuthProvider } from "@better-auth/core/oauth2";
import * as zod462 from "zod";
import * as better_call169 from "better-call";
import * as zod_v4_core67 from "zod/v4/core";

//#region src/plugins/generic-oauth/index.d.ts
/**
 * Base type for OAuth provider options.
 * Extracts common fields from GenericOAuthConfig and makes clientSecret required.
 */
type BaseOAuthProviderOptions = Omit<Pick<GenericOAuthConfig, "clientId" | "clientSecret" | "scopes" | "redirectURI" | "pkce" | "disableImplicitSignUp" | "disableSignUp" | "overrideUserInfo">, "clientSecret"> & {
  /** OAuth client secret (required for provider options) */
  clientSecret: string;
};
/**
 * A generic OAuth plugin that can be used to add OAuth support to any provider
 */
declare const genericOAuth: (options: GenericOAuthOptions) => {
  id: "generic-oauth";
  init: (ctx: AuthContext) => {
    context: {
      socialProviders: OAuthProvider<Record<string, any>, Partial<_better_auth_core_oauth21.ProviderOptions<any>>>[];
    };
  };
  endpoints: {
    signInWithOAuth2: better_call169.StrictEndpoint<"/sign-in/oauth2", {
      method: "POST";
      body: zod462.ZodObject<{
        providerId: zod462.ZodString;
        callbackURL: zod462.ZodOptional<zod462.ZodString>;
        errorCallbackURL: zod462.ZodOptional<zod462.ZodString>;
        newUserCallbackURL: zod462.ZodOptional<zod462.ZodString>;
        disableRedirect: zod462.ZodOptional<zod462.ZodBoolean>;
        scopes: zod462.ZodOptional<zod462.ZodArray<zod462.ZodString>>;
        requestSignUp: zod462.ZodOptional<zod462.ZodBoolean>;
        additionalData: zod462.ZodOptional<zod462.ZodRecord<zod462.ZodString, zod462.ZodAny>>;
      }, zod_v4_core67.$strip>;
      metadata: {
        openapi: {
          description: string;
          responses: {
            200: {
              description: string;
              content: {
                "application/json": {
                  schema: {
                    type: "object";
                    properties: {
                      url: {
                        type: string;
                      };
                      redirect: {
                        type: string;
                      };
                    };
                  };
                };
              };
            };
          };
        };
      };
    }, {
      url: string;
      redirect: boolean;
    }>;
    oAuth2Callback: better_call169.StrictEndpoint<"/oauth2/callback/:providerId", {
      method: "GET";
      query: zod462.ZodObject<{
        code: zod462.ZodOptional<zod462.ZodString>;
        error: zod462.ZodOptional<zod462.ZodString>;
        error_description: zod462.ZodOptional<zod462.ZodString>;
        state: zod462.ZodOptional<zod462.ZodString>;
      }, zod_v4_core67.$strip>;
      metadata: {
        allowedMediaTypes: string[];
        openapi: {
          description: string;
          responses: {
            200: {
              description: string;
              content: {
                "application/json": {
                  schema: {
                    type: "object";
                    properties: {
                      url: {
                        type: string;
                      };
                    };
                  };
                };
              };
            };
          };
        };
        scope: "server";
      };
    }, void>;
    oAuth2LinkAccount: better_call169.StrictEndpoint<"/oauth2/link", {
      method: "POST";
      body: zod462.ZodObject<{
        providerId: zod462.ZodString;
        callbackURL: zod462.ZodString;
        scopes: zod462.ZodOptional<zod462.ZodArray<zod462.ZodString>>;
        errorCallbackURL: zod462.ZodOptional<zod462.ZodString>;
      }, zod_v4_core67.$strip>;
      use: ((inputContext: better_call169.MiddlewareInputContext<better_call169.MiddlewareOptions>) => Promise<{
        session: {
          session: Record<string, any> & {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            userId: string;
            expiresAt: Date;
            token: string;
            ipAddress?: string | null | undefined;
            userAgent?: string | null | undefined;
          };
          user: Record<string, any> & {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            email: string;
            emailVerified: boolean;
            name: string;
            image?: string | null | undefined;
          };
        };
      }>)[];
      metadata: {
        openapi: {
          description: string;
          responses: {
            "200": {
              description: string;
              content: {
                "application/json": {
                  schema: {
                    type: "object";
                    properties: {
                      url: {
                        type: string;
                        format: string;
                        description: string;
                      };
                      redirect: {
                        type: string;
                        description: string;
                        enum: boolean[];
                      };
                    };
                    required: string[];
                  };
                };
              };
            };
          };
        };
      };
    }, {
      url: string;
      redirect: boolean;
    }>;
  };
  options: GenericOAuthOptions;
  $ERROR_CODES: {
    readonly INVALID_OAUTH_CONFIGURATION: "Invalid OAuth configuration";
    readonly TOKEN_URL_NOT_FOUND: "Invalid OAuth configuration. Token URL not found.";
    readonly PROVIDER_CONFIG_NOT_FOUND: "No config found for provider";
    readonly PROVIDER_ID_REQUIRED: "Provider ID is required";
    readonly INVALID_OAUTH_CONFIG: "Invalid OAuth configuration.";
    readonly SESSION_REQUIRED: "Session is required";
  };
};
//#endregion
export { Auth0Options, BaseOAuthProviderOptions, type GenericOAuthConfig, type GenericOAuthOptions, HubSpotOptions, KeycloakOptions, LineOptions, MicrosoftEntraIdOptions, OktaOptions, PatreonOptions, SlackOptions, auth0, genericOAuth, hubspot, keycloak, line, microsoftEntraId, okta, patreon, slack };
//# sourceMappingURL=index.d.mts.map