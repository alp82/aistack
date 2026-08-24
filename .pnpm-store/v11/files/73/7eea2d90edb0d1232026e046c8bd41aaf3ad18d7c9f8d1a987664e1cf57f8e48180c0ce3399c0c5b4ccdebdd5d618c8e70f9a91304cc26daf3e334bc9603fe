import { User } from "../../types/models.mjs";
import "../../types/index.mjs";
import { GenericEndpointContext } from "@better-auth/core";
import * as z from "zod";
import * as better_call970 from "better-call";

//#region src/api/routes/email-verification.d.ts
declare function createEmailVerificationToken(secret: string, email: string,
/**
 * The email to update from
 */
updateTo?: string | undefined,
/**
 * The time in seconds for the token to expire
 */
expiresIn?: number,
/**
 * Extra payload to include in the token
 */
extraPayload?: Record<string, any>): Promise<string>;
/**
 * A function to send a verification email to the user
 */
declare function sendVerificationEmailFn(ctx: GenericEndpointContext, user: User): Promise<void>;
declare const sendVerificationEmail: better_call970.StrictEndpoint<"/send-verification-email", {
  method: "POST";
  operationId: string;
  body: z.ZodObject<{
    email: z.ZodEmail;
    callbackURL: z.ZodOptional<z.ZodString>;
  }, z.core.$strip>;
  metadata: {
    openapi: {
      operationId: string;
      description: string;
      requestBody: {
        content: {
          "application/json": {
            schema: {
              type: "object";
              properties: {
                email: {
                  type: string;
                  description: string;
                  example: string;
                };
                callbackURL: {
                  type: string;
                  description: string;
                  example: string;
                  nullable: boolean;
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
                  status: {
                    type: string;
                    description: string;
                    example: boolean;
                  };
                };
              };
            };
          };
        };
        "400": {
          description: string;
          content: {
            "application/json": {
              schema: {
                type: "object";
                properties: {
                  message: {
                    type: string;
                    description: string;
                    example: string;
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
  status: boolean;
}>;
declare const verifyEmail: better_call970.StrictEndpoint<"/verify-email", {
  method: "GET";
  operationId: string;
  query: z.ZodObject<{
    token: z.ZodString;
    callbackURL: z.ZodOptional<z.ZodString>;
  }, z.core.$strip>;
  use: ((inputContext: better_call970.MiddlewareInputContext<better_call970.MiddlewareOptions>) => Promise<void>)[];
  metadata: {
    openapi: {
      description: string;
      parameters: ({
        name: string;
        in: "query";
        description: string;
        required: true;
        schema: {
          type: "string";
        };
      } | {
        name: string;
        in: "query";
        description: string;
        required: false;
        schema: {
          type: "string";
        };
      })[];
      responses: {
        "200": {
          description: string;
          content: {
            "application/json": {
              schema: {
                type: "object";
                properties: {
                  user: {
                    type: string;
                    $ref: string;
                  };
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
}, void | {
  status: boolean;
}>;
//#endregion
export { createEmailVerificationToken, sendVerificationEmail, sendVerificationEmailFn, verifyEmail };
//# sourceMappingURL=email-verification.d.mts.map