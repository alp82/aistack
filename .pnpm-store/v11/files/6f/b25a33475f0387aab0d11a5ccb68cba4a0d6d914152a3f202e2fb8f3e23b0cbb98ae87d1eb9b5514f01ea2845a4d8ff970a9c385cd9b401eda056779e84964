import * as z from "zod";
import * as better_call919 from "better-call";

//#region src/api/routes/reset-password.d.ts
declare const requestPasswordReset: better_call919.StrictEndpoint<"/request-password-reset", {
  method: "POST";
  body: z.ZodObject<{
    email: z.ZodEmail;
    redirectTo: z.ZodOptional<z.ZodString>;
  }, z.core.$strip>;
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
                  status: {
                    type: string;
                  };
                  message: {
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
  status: boolean;
  message: string;
}>;
declare const requestPasswordResetCallback: better_call919.StrictEndpoint<"/reset-password/:token", {
  method: "GET";
  operationId: string;
  query: z.ZodObject<{
    callbackURL: z.ZodString;
  }, z.core.$strip>;
  use: ((inputContext: better_call919.MiddlewareInputContext<better_call919.MiddlewareOptions>) => Promise<void>)[];
  metadata: {
    openapi: {
      operationId: string;
      description: string;
      parameters: ({
        name: string;
        in: "path";
        required: true;
        description: string;
        schema: {
          type: "string";
        };
      } | {
        name: string;
        in: "query";
        required: true;
        description: string;
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
}, never>;
declare const resetPassword: better_call919.StrictEndpoint<"/reset-password", {
  method: "POST";
  operationId: string;
  query: z.ZodOptional<z.ZodObject<{
    token: z.ZodOptional<z.ZodString>;
  }, z.core.$strip>>;
  body: z.ZodObject<{
    newPassword: z.ZodString;
    token: z.ZodOptional<z.ZodString>;
  }, z.core.$strip>;
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
                  status: {
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
  status: boolean;
}>;
//#endregion
export { requestPasswordReset, requestPasswordResetCallback, resetPassword };
//# sourceMappingURL=reset-password.d.mts.map