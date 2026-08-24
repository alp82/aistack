import { AdditionalUserFieldsInput, InferUser } from "../../types/models.mjs";
import "../../types/index.mjs";
import { BetterAuthOptions } from "@better-auth/core";
import * as z from "zod";
import * as better_call966 from "better-call";

//#region src/api/routes/sign-up.d.ts
declare const signUpEmail: <O extends BetterAuthOptions>() => better_call966.StrictEndpoint<"/sign-up/email", {
  method: "POST";
  operationId: string;
  use: ((inputContext: better_call966.MiddlewareInputContext<better_call966.MiddlewareOptions>) => Promise<void>)[];
  body: z.ZodIntersection<z.ZodObject<{
    name: z.ZodString;
    email: z.ZodEmail;
    password: z.ZodString;
    image: z.ZodOptional<z.ZodString>;
    callbackURL: z.ZodOptional<z.ZodString>;
    rememberMe: z.ZodOptional<z.ZodBoolean>;
  }, z.core.$strip>, z.ZodRecord<z.ZodString, z.ZodAny>>;
  metadata: {
    allowedMediaTypes: string[];
    $Infer: {
      body: {
        name: string;
        email: string;
        password: string;
        image?: string | undefined;
        callbackURL?: string | undefined;
        rememberMe?: boolean | undefined;
      } & AdditionalUserFieldsInput<O>;
      returned: {
        token: string | null;
        user: InferUser<O>;
      };
    };
    openapi: {
      operationId: string;
      description: string;
      requestBody: {
        content: {
          "application/json": {
            schema: {
              type: "object";
              properties: {
                name: {
                  type: string;
                  description: string;
                };
                email: {
                  type: string;
                  description: string;
                };
                password: {
                  type: string;
                  description: string;
                };
                image: {
                  type: string;
                  description: string;
                };
                callbackURL: {
                  type: string;
                  description: string;
                };
                rememberMe: {
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
                  token: {
                    type: string;
                    nullable: boolean;
                    description: string;
                  };
                  user: {
                    type: string;
                    properties: {
                      id: {
                        type: string;
                        description: string;
                      };
                      email: {
                        type: string;
                        format: string;
                        description: string;
                      };
                      name: {
                        type: string;
                        description: string;
                      };
                      image: {
                        type: string;
                        format: string;
                        nullable: boolean;
                        description: string;
                      };
                      emailVerified: {
                        type: string;
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
                required: string[];
              };
            };
          };
        };
        "422": {
          description: string;
          content: {
            "application/json": {
              schema: {
                type: "object";
                properties: {
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
  token: null;
  user: InferUser<O>;
} | {
  token: string;
  user: InferUser<O>;
}>;
//#endregion
export { signUpEmail };
//# sourceMappingURL=sign-up.d.mts.map