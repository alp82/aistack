import * as _simplewebauthn_server0 from "@simplewebauthn/server";
import { CredentialDeviceType } from "@simplewebauthn/server";
import * as better_call0 from "better-call";
import * as zod0 from "zod";
import { InferOptionSchema } from "better-auth/types";
import * as better_auth0 from "better-auth";

//#region src/schema.d.ts
declare const schema: {
  passkey: {
    fields: {
      name: {
        type: "string";
        required: false;
      };
      publicKey: {
        type: "string";
        required: true;
      };
      userId: {
        type: "string";
        references: {
          model: string;
          field: string;
        };
        required: true;
        index: true;
      };
      credentialID: {
        type: "string";
        required: true;
        index: true;
      };
      counter: {
        type: "number";
        required: true;
      };
      deviceType: {
        type: "string";
        required: true;
      };
      backedUp: {
        type: "boolean";
        required: true;
      };
      transports: {
        type: "string";
        required: false;
      };
      createdAt: {
        type: "date";
        required: false;
      };
      aaguid: {
        type: "string";
        required: false;
      };
    };
  };
};
//#endregion
//#region src/types.d.ts
/**
 * @internal
 */
interface WebAuthnChallengeValue {
  expectedChallenge: string;
  userData: {
    id: string;
  };
}
interface PasskeyOptions {
  /**
   * A unique identifier for your website. 'localhost' is okay for
   * local dev
   *
   * @default "localhost"
   */
  rpID?: string | undefined;
  /**
   * Human-readable title for your website
   *
   * @default "Better Auth"
   */
  rpName?: string | undefined;
  /**
   * The URL at which registrations and authentications should occur.
   * `http://localhost` and `http://localhost:PORT` are also valid.
   * Do NOT include any trailing /
   *
   * if this isn't provided. The client itself will
   * pass this value.
   */
  origin?: (string | string[] | null) | undefined;
  /**
   * Allow customization of the authenticatorSelection options
   * during passkey registration.
   */
  authenticatorSelection?: AuthenticatorSelectionCriteria | undefined;
  /**
   * Advanced options
   */
  advanced?: {
    /**
     * Cookie name for storing WebAuthn challenge ID during authentication flow
     *
     * @default "better-auth-passkey"
     */
    webAuthnChallengeCookie?: string;
  } | undefined;
  /**
   * Schema for the passkey model
   */
  schema?: InferOptionSchema<typeof schema> | undefined;
}
type Passkey = {
  id: string;
  name?: string | undefined;
  publicKey: string;
  userId: string;
  credentialID: string;
  counter: number;
  deviceType: CredentialDeviceType;
  backedUp: boolean;
  transports?: string | undefined;
  createdAt: Date;
  aaguid?: string | undefined;
};
//#endregion
//#region src/index.d.ts
declare const passkey: (options?: PasskeyOptions | undefined) => {
  id: "passkey";
  endpoints: {
    generatePasskeyRegistrationOptions: better_call0.StrictEndpoint<"/passkey/generate-register-options", {
      method: "GET";
      use: ((inputContext: better_call0.MiddlewareInputContext<better_call0.MiddlewareOptions>) => Promise<{
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
      query: zod0.ZodOptional<zod0.ZodObject<{
        authenticatorAttachment: zod0.ZodOptional<zod0.ZodEnum<{
          platform: "platform";
          "cross-platform": "cross-platform";
        }>>;
        name: zod0.ZodOptional<zod0.ZodString>;
      }, better_auth0.$strip>>;
      metadata: {
        openapi: {
          operationId: string;
          description: string;
          responses: {
            200: {
              description: string;
              parameters: {
                query: {
                  authenticatorAttachment: {
                    description: string;
                    required: boolean;
                  };
                  name: {
                    description: string;
                    required: boolean;
                  };
                };
              };
              content: {
                "application/json": {
                  schema: {
                    type: "object";
                    properties: {
                      challenge: {
                        type: string;
                      };
                      rp: {
                        type: string;
                        properties: {
                          name: {
                            type: string;
                          };
                          id: {
                            type: string;
                          };
                        };
                      };
                      user: {
                        type: string;
                        properties: {
                          id: {
                            type: string;
                          };
                          name: {
                            type: string;
                          };
                          displayName: {
                            type: string;
                          };
                        };
                      };
                      pubKeyCredParams: {
                        type: string;
                        items: {
                          type: string;
                          properties: {
                            type: {
                              type: string;
                            };
                            alg: {
                              type: string;
                            };
                          };
                        };
                      };
                      timeout: {
                        type: string;
                      };
                      excludeCredentials: {
                        type: string;
                        items: {
                          type: string;
                          properties: {
                            id: {
                              type: string;
                            };
                            type: {
                              type: string;
                            };
                            transports: {
                              type: string;
                              items: {
                                type: string;
                              };
                            };
                          };
                        };
                      };
                      authenticatorSelection: {
                        type: string;
                        properties: {
                          authenticatorAttachment: {
                            type: string;
                          };
                          requireResidentKey: {
                            type: string;
                          };
                          userVerification: {
                            type: string;
                          };
                        };
                      };
                      attestation: {
                        type: string;
                      };
                      extensions: {
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
    }, _simplewebauthn_server0.PublicKeyCredentialCreationOptionsJSON>;
    generatePasskeyAuthenticationOptions: better_call0.StrictEndpoint<"/passkey/generate-authenticate-options", {
      method: "GET";
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
                      challenge: {
                        type: string;
                      };
                      rp: {
                        type: string;
                        properties: {
                          name: {
                            type: string;
                          };
                          id: {
                            type: string;
                          };
                        };
                      };
                      user: {
                        type: string;
                        properties: {
                          id: {
                            type: string;
                          };
                          name: {
                            type: string;
                          };
                          displayName: {
                            type: string;
                          };
                        };
                      };
                      timeout: {
                        type: string;
                      };
                      allowCredentials: {
                        type: string;
                        items: {
                          type: string;
                          properties: {
                            id: {
                              type: string;
                            };
                            type: {
                              type: string;
                            };
                            transports: {
                              type: string;
                              items: {
                                type: string;
                              };
                            };
                          };
                        };
                      };
                      userVerification: {
                        type: string;
                      };
                      authenticatorSelection: {
                        type: string;
                        properties: {
                          authenticatorAttachment: {
                            type: string;
                          };
                          requireResidentKey: {
                            type: string;
                          };
                          userVerification: {
                            type: string;
                          };
                        };
                      };
                      extensions: {
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
    }, _simplewebauthn_server0.PublicKeyCredentialRequestOptionsJSON>;
    verifyPasskeyRegistration: better_call0.StrictEndpoint<"/passkey/verify-registration", {
      method: "POST";
      body: zod0.ZodObject<{
        response: zod0.ZodAny;
        name: zod0.ZodOptional<zod0.ZodString>;
      }, better_auth0.$strip>;
      use: ((inputContext: better_call0.MiddlewareInputContext<better_call0.MiddlewareOptions>) => Promise<{
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
                    $ref: string;
                  };
                };
              };
            };
            400: {
              description: string;
            };
          };
        };
      };
    }, Passkey | null>;
    verifyPasskeyAuthentication: better_call0.StrictEndpoint<"/passkey/verify-authentication", {
      method: "POST";
      body: zod0.ZodObject<{
        response: zod0.ZodRecord<zod0.ZodAny, zod0.ZodAny>;
      }, better_auth0.$strip>;
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
                      session: {
                        $ref: string;
                      };
                      user: {
                        $ref: string;
                      };
                    };
                  };
                };
              };
            };
          };
        };
        $Infer: {
          body: {
            response: _simplewebauthn_server0.AuthenticationResponseJSON;
          };
        };
      };
    }, {
      session: {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        userId: string;
        expiresAt: Date;
        token: string;
        ipAddress?: string | null | undefined;
        userAgent?: string | null | undefined;
      };
    }>;
    listPasskeys: better_call0.StrictEndpoint<"/passkey/list-user-passkeys", {
      method: "GET";
      use: ((inputContext: better_call0.MiddlewareInputContext<better_call0.MiddlewareOptions>) => Promise<{
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
                    type: "array";
                    items: {
                      $ref: string;
                      required: string[];
                    };
                    description: string;
                  };
                };
              };
            };
          };
        };
      };
    }, Passkey[]>;
    deletePasskey: better_call0.StrictEndpoint<"/passkey/delete-passkey", {
      method: "POST";
      body: zod0.ZodObject<{
        id: zod0.ZodString;
      }, better_auth0.$strip>;
      use: ((inputContext: better_call0.MiddlewareInputContext<better_call0.MiddlewareOptions>) => Promise<{
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
                      status: {
                        type: string;
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
      status: boolean;
    }>;
    updatePasskey: better_call0.StrictEndpoint<"/passkey/update-passkey", {
      method: "POST";
      body: zod0.ZodObject<{
        id: zod0.ZodString;
        name: zod0.ZodString;
      }, better_auth0.$strip>;
      use: ((inputContext: better_call0.MiddlewareInputContext<better_call0.MiddlewareOptions>) => Promise<{
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
                      passkey: {
                        $ref: string;
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
      passkey: Passkey;
    }>;
  };
  schema: {
    passkey: {
      fields: {
        name: {
          type: "string";
          required: false;
        };
        publicKey: {
          type: "string";
          required: true;
        };
        userId: {
          type: "string";
          references: {
            model: string;
            field: string;
          };
          required: true;
          index: true;
        };
        credentialID: {
          type: "string";
          required: true;
          index: true;
        };
        counter: {
          type: "number";
          required: true;
        };
        deviceType: {
          type: "string";
          required: true;
        };
        backedUp: {
          type: "boolean";
          required: true;
        };
        transports: {
          type: "string";
          required: false;
        };
        createdAt: {
          type: "date";
          required: false;
        };
        aaguid: {
          type: "string";
          required: false;
        };
      };
    };
  };
  $ERROR_CODES: {
    readonly CHALLENGE_NOT_FOUND: "Challenge not found";
    readonly YOU_ARE_NOT_ALLOWED_TO_REGISTER_THIS_PASSKEY: "You are not allowed to register this passkey";
    readonly FAILED_TO_VERIFY_REGISTRATION: "Failed to verify registration";
    readonly PASSKEY_NOT_FOUND: "Passkey not found";
    readonly AUTHENTICATION_FAILED: "Authentication failed";
    readonly UNABLE_TO_CREATE_SESSION: "Unable to create session";
    readonly FAILED_TO_UPDATE_PASSKEY: "Failed to update passkey";
  };
  options: PasskeyOptions | undefined;
};
//#endregion
export { WebAuthnChallengeValue as i, Passkey as n, PasskeyOptions as r, passkey as t };