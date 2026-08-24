import { OAuthAccessToken, OIDCMetadata, OIDCOptions } from "../oidc-provider/types.mjs";
import "../oidc-provider/index.mjs";
import { BetterAuthOptions, GenericEndpointContext } from "@better-auth/core";
import * as z from "zod";
import * as better_call295 from "better-call";

//#region src/plugins/mcp/index.d.ts
interface MCPOptions {
  loginPage: string;
  resource?: string | undefined;
  oidcConfig?: OIDCOptions | undefined;
}
declare const getMCPProviderMetadata: (ctx: GenericEndpointContext, options?: OIDCOptions | undefined) => OIDCMetadata;
declare const getMCPProtectedResourceMetadata: (ctx: GenericEndpointContext, options?: MCPOptions | undefined) => {
  resource: string;
  authorization_servers: string[];
  jwks_uri: string;
  scopes_supported: string[];
  bearer_methods_supported: string[];
  resource_signing_alg_values_supported: string[];
};
declare const mcp: (options: MCPOptions) => {
  id: "mcp";
  hooks: {
    after: {
      matcher(): true;
      handler: (inputContext: better_call295.MiddlewareInputContext<better_call295.MiddlewareOptions>) => Promise<void>;
    }[];
  };
  endpoints: {
    oAuthConsent: better_call295.StrictEndpoint<"/oauth2/consent", {
      method: "POST";
      operationId: string;
      body: z.ZodObject<{
        accept: z.ZodBoolean;
        consent_code: z.ZodOptional<z.ZodNullable<z.ZodOptional<z.ZodString>>>;
      }, z.core.$strip>;
      use: ((inputContext: better_call295.MiddlewareInputContext<better_call295.MiddlewareOptions>) => Promise<{
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
          requestBody: {
            required: boolean;
            content: {
              "application/json": {
                schema: {
                  type: "object";
                  properties: {
                    accept: {
                      type: string;
                      description: string;
                    };
                    consent_code: {
                      type: string;
                      description: string;
                    };
                  };
                  required: string[];
                };
              };
            };
          };
          responses: {
            "200": {
              description: string;
              content: {
                "application/json": {
                  schema: {
                    type: "object";
                    properties: {
                      redirectURI: {
                        type: string;
                        format: string;
                        description: string;
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
      redirectURI: string;
    }>;
    getMcpOAuthConfig: better_call295.StrictEndpoint<"/.well-known/oauth-authorization-server", {
      method: "GET";
      metadata: {
        readonly scope: "server";
      };
    }, OIDCMetadata | null>;
    getMCPProtectedResource: better_call295.StrictEndpoint<"/.well-known/oauth-protected-resource", {
      method: "GET";
      metadata: {
        readonly scope: "server";
      };
    }, {
      resource: string;
      authorization_servers: string[];
      jwks_uri: string;
      scopes_supported: string[];
      bearer_methods_supported: string[];
      resource_signing_alg_values_supported: string[];
    }>;
    mcpOAuthAuthorize: better_call295.StrictEndpoint<"/mcp/authorize", {
      method: "GET";
      query: z.ZodRecord<z.ZodString, z.ZodAny>;
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
                    additionalProperties: boolean;
                    description: string;
                  };
                };
              };
            };
          };
        };
      };
    }, void>;
    mcpOAuthToken: better_call295.StrictEndpoint<"/mcp/token", {
      method: "POST";
      body: z.ZodRecord<z.ZodAny, z.ZodAny>;
      metadata: {
        allowedMediaTypes: string[];
        scope: "server";
      };
    }, {
      access_token: string;
      token_type: string;
      expires_in: number;
      refresh_token: string;
      scope: string;
    } | {
      access_token: string;
      token_type: string;
      expires_in: number;
      refresh_token: string | undefined;
      scope: string;
      id_token: string | undefined;
    }>;
    registerMcpClient: better_call295.StrictEndpoint<"/mcp/register", {
      method: "POST";
      body: z.ZodObject<{
        redirect_uris: z.ZodArray<z.ZodString>;
        token_endpoint_auth_method: z.ZodOptional<z.ZodDefault<z.ZodEnum<{
          none: "none";
          client_secret_basic: "client_secret_basic";
          client_secret_post: "client_secret_post";
        }>>>;
        grant_types: z.ZodOptional<z.ZodDefault<z.ZodArray<z.ZodEnum<{
          password: "password";
          authorization_code: "authorization_code";
          refresh_token: "refresh_token";
          implicit: "implicit";
          client_credentials: "client_credentials";
          "urn:ietf:params:oauth:grant-type:jwt-bearer": "urn:ietf:params:oauth:grant-type:jwt-bearer";
          "urn:ietf:params:oauth:grant-type:saml2-bearer": "urn:ietf:params:oauth:grant-type:saml2-bearer";
        }>>>>;
        response_types: z.ZodOptional<z.ZodDefault<z.ZodArray<z.ZodEnum<{
          token: "token";
          code: "code";
        }>>>>;
        client_name: z.ZodOptional<z.ZodString>;
        client_uri: z.ZodOptional<z.ZodString>;
        logo_uri: z.ZodOptional<z.ZodString>;
        scope: z.ZodOptional<z.ZodString>;
        contacts: z.ZodOptional<z.ZodArray<z.ZodString>>;
        tos_uri: z.ZodOptional<z.ZodString>;
        policy_uri: z.ZodOptional<z.ZodString>;
        jwks_uri: z.ZodOptional<z.ZodString>;
        jwks: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
        metadata: z.ZodOptional<z.ZodRecord<z.ZodAny, z.ZodAny>>;
        software_id: z.ZodOptional<z.ZodString>;
        software_version: z.ZodOptional<z.ZodString>;
        software_statement: z.ZodOptional<z.ZodString>;
      }, z.core.$strip>;
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
                      name: {
                        type: string;
                        description: string;
                      };
                      icon: {
                        type: string;
                        nullable: boolean;
                        description: string;
                      };
                      metadata: {
                        type: string;
                        additionalProperties: boolean;
                        nullable: boolean;
                        description: string;
                      };
                      clientId: {
                        type: string;
                        description: string;
                      };
                      clientSecret: {
                        type: string;
                        description: string;
                      };
                      redirectUrls: {
                        type: string;
                        items: {
                          type: string;
                          format: string;
                        };
                        description: string;
                      };
                      type: {
                        type: string;
                        description: string;
                        enum: string[];
                      };
                      authenticationScheme: {
                        type: string;
                        description: string;
                        enum: string[];
                      };
                      disabled: {
                        type: string;
                        description: string;
                        enum: boolean[];
                      };
                      userId: {
                        type: string;
                        nullable: boolean;
                        description: string;
                      };
                      createdAt: {
                        type: string;
                        format: string;
                        description: string;
                      };
                      updatedAt: {
                        type: string;
                        format: string;
                        description: string;
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
    }, Response>;
    getMcpSession: better_call295.StrictEndpoint<"/mcp/get-session", {
      method: "GET";
      requireHeaders: true;
    }, OAuthAccessToken | null>;
  };
  schema: {
    oauthApplication: {
      modelName: string;
      fields: {
        name: {
          type: "string";
        };
        icon: {
          type: "string";
          required: false;
        };
        metadata: {
          type: "string";
          required: false;
        };
        clientId: {
          type: "string";
          unique: true;
        };
        clientSecret: {
          type: "string";
          required: false;
        };
        redirectUrls: {
          type: "string";
        };
        type: {
          type: "string";
        };
        disabled: {
          type: "boolean";
          required: false;
          defaultValue: false;
        };
        userId: {
          type: "string";
          required: false;
          references: {
            model: string;
            field: string;
            onDelete: "cascade";
          };
          index: true;
        };
        createdAt: {
          type: "date";
        };
        updatedAt: {
          type: "date";
        };
      };
    };
    oauthAccessToken: {
      modelName: string;
      fields: {
        accessToken: {
          type: "string";
          unique: true;
        };
        refreshToken: {
          type: "string";
          unique: true;
        };
        accessTokenExpiresAt: {
          type: "date";
        };
        refreshTokenExpiresAt: {
          type: "date";
        };
        clientId: {
          type: "string";
          references: {
            model: string;
            field: string;
            onDelete: "cascade";
          };
          index: true;
        };
        userId: {
          type: "string";
          required: false;
          references: {
            model: string;
            field: string;
            onDelete: "cascade";
          };
          index: true;
        };
        scopes: {
          type: "string";
        };
        createdAt: {
          type: "date";
        };
        updatedAt: {
          type: "date";
        };
      };
    };
    oauthConsent: {
      modelName: string;
      fields: {
        clientId: {
          type: "string";
          references: {
            model: string;
            field: string;
            onDelete: "cascade";
          };
          index: true;
        };
        userId: {
          type: "string";
          references: {
            model: string;
            field: string;
            onDelete: "cascade";
          };
          index: true;
        };
        scopes: {
          type: "string";
        };
        createdAt: {
          type: "date";
        };
        updatedAt: {
          type: "date";
        };
        consentGiven: {
          type: "boolean";
        };
      };
    };
  };
  options: MCPOptions;
};
declare const withMcpAuth: <Auth extends {
  api: {
    getMcpSession: (...args: any) => Promise<OAuthAccessToken | null>;
  };
  options: BetterAuthOptions;
}>(auth: Auth, handler: (req: Request, session: OAuthAccessToken) => Response | Promise<Response>) => (req: Request) => Promise<Response>;
declare const oAuthDiscoveryMetadata: <Auth extends {
  api: {
    getMcpOAuthConfig: (...args: any) => any;
  };
}>(auth: Auth) => (request: Request) => Promise<Response>;
declare const oAuthProtectedResourceMetadata: <Auth extends {
  api: {
    getMCPProtectedResource: (...args: any) => any;
  };
}>(auth: Auth) => (request: Request) => Promise<Response>;
//#endregion
export { getMCPProtectedResourceMetadata, getMCPProviderMetadata, mcp, oAuthDiscoveryMetadata, oAuthProtectedResourceMetadata, withMcpAuth };
//# sourceMappingURL=index.d.mts.map