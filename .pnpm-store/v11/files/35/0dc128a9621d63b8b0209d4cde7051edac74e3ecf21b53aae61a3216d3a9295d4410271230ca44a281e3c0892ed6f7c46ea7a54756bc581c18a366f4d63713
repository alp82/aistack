import { JWKOptions, JWSAlgorithms, Jwk, JwtOptions } from "./types.mjs";
import { getJwtToken, signJWT } from "./sign.mjs";
import { createJwk, generateExportedKeyPair, toExpJWT } from "./utils.mjs";
import { verifyJWT } from "./verify.mjs";
import * as _better_auth_core6 from "@better-auth/core";
import * as z from "zod";
import * as better_call151 from "better-call";
import { JSONWebKeySet, JWTPayload } from "jose";

//#region src/plugins/jwt/index.d.ts
declare const jwt: <O extends JwtOptions>(options?: O) => {
  id: "jwt";
  options: NoInfer<O>;
  endpoints: {
    getJwks: better_call151.StrictEndpoint<string, {
      method: "GET";
      metadata: {
        openapi: {
          operationId: string;
          description: string;
          responses: {
            "200": {
              description: string;
              content: {
                "application/json": {
                  schema: {
                    type: "object";
                    properties: {
                      keys: {
                        type: string;
                        description: string;
                        items: {
                          type: string;
                          properties: {
                            kid: {
                              type: string;
                              description: string;
                            };
                            kty: {
                              type: string;
                              description: string;
                            };
                            alg: {
                              type: string;
                              description: string;
                            };
                            use: {
                              type: string;
                              description: string;
                              enum: string[];
                              nullable: boolean;
                            };
                            n: {
                              type: string;
                              description: string;
                              nullable: boolean;
                            };
                            e: {
                              type: string;
                              description: string;
                              nullable: boolean;
                            };
                            crv: {
                              type: string;
                              description: string;
                              nullable: boolean;
                            };
                            x: {
                              type: string;
                              description: string;
                              nullable: boolean;
                            };
                            y: {
                              type: string;
                              description: string;
                              nullable: boolean;
                            };
                          };
                          required: string[];
                        };
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
    }, JSONWebKeySet>;
    getToken: better_call151.StrictEndpoint<"/token", {
      method: "GET";
      requireHeaders: true;
      use: ((inputContext: better_call151.MiddlewareInputContext<better_call151.MiddlewareOptions>) => Promise<{
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
          operationId: string;
          description: string;
          responses: {
            200: {
              description: string;
              content: {
                "application/json": {
                  schema: {
                    type: "object";
                    properties: {
                      token: {
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
      token: string;
    }>;
    signJWT: better_call151.StrictEndpoint<string, {
      method: "POST";
      metadata: {
        $Infer: {
          body: {
            payload: JWTPayload;
            overrideOptions?: JwtOptions | undefined;
          };
        };
      };
      body: z.ZodObject<{
        payload: z.ZodRecord<z.ZodString, z.ZodAny>;
        overrideOptions: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
      }, z.core.$strip>;
    }, {
      token: string;
    }>;
    verifyJWT: better_call151.StrictEndpoint<string, {
      method: "POST";
      metadata: {
        $Infer: {
          body: {
            token: string;
            issuer?: string;
          };
          response: {
            payload: {
              sub: string;
              aud: string;
              [key: string]: any;
            } | null;
          };
        };
      };
      body: z.ZodObject<{
        token: z.ZodString;
        issuer: z.ZodOptional<z.ZodString>;
      }, z.core.$strip>;
    }, {
      payload: (JWTPayload & Required<Pick<JWTPayload, "sub" | "aud">>) | null;
    }>;
  };
  hooks: {
    after: {
      matcher(context: _better_auth_core6.HookEndpointContext): boolean;
      handler: (inputContext: better_call151.MiddlewareInputContext<better_call151.MiddlewareOptions>) => Promise<void>;
    }[];
  };
  schema: {
    jwks: {
      fields: {
        publicKey: {
          type: "string";
          required: true;
        };
        privateKey: {
          type: "string";
          required: true;
        };
        createdAt: {
          type: "date";
          required: true;
        };
        expiresAt: {
          type: "date";
          required: false;
        };
      };
    };
  };
};
//#endregion
export { JWKOptions, JWSAlgorithms, Jwk, JwtOptions, createJwk, generateExportedKeyPair, getJwtToken, jwt, signJWT, toExpJWT, verifyJWT };
//# sourceMappingURL=index.d.mts.map