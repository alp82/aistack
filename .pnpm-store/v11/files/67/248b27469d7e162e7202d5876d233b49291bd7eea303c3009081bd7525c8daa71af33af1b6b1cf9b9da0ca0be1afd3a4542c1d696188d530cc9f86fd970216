import { AdditionalUserFieldsInput } from "../../types/models.mjs";
import "../../types/index.mjs";
import { BetterAuthOptions } from "@better-auth/core";
import * as z from "zod";
import * as better_call901 from "better-call";

//#region src/api/routes/update-user.d.ts
declare const updateUser: <O extends BetterAuthOptions>() => better_call901.StrictEndpoint<"/update-user", {
  method: "POST";
  operationId: string;
  body: z.ZodRecord<z.ZodString, z.ZodAny>;
  use: ((inputContext: better_call901.MiddlewareInputContext<better_call901.MiddlewareOptions>) => Promise<{
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
    $Infer: {
      body: Partial<AdditionalUserFieldsInput<O>> & {
        name?: string | undefined;
        image?: string | undefined | null;
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
                image: {
                  type: string;
                  description: string;
                  nullable: boolean;
                };
              };
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
                  user: {
                    type: string;
                    $ref: string;
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
declare const changePassword: better_call901.StrictEndpoint<"/change-password", {
  method: "POST";
  operationId: string;
  body: z.ZodObject<{
    newPassword: z.ZodString;
    currentPassword: z.ZodString;
    revokeOtherSessions: z.ZodOptional<z.ZodBoolean>;
  }, z.core.$strip>;
  use: ((inputContext: better_call901.MiddlewareInputContext<better_call901.MiddlewareOptions>) => Promise<{
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
      };
    };
  };
}, {
  token: string | null;
  user: {
    id: string;
    email: string;
    name: string;
    image: string | null | undefined;
    emailVerified: boolean;
    createdAt: Date;
    updatedAt: Date;
  };
}>;
declare const setPassword: better_call901.StrictEndpoint<string, {
  method: "POST";
  body: z.ZodObject<{
    newPassword: z.ZodString;
  }, z.core.$strip>;
  use: ((inputContext: better_call901.MiddlewareInputContext<better_call901.MiddlewareOptions>) => Promise<{
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
}, {
  status: boolean;
}>;
declare const deleteUser: better_call901.StrictEndpoint<"/delete-user", {
  method: "POST";
  use: ((inputContext: better_call901.MiddlewareInputContext<better_call901.MiddlewareOptions>) => Promise<{
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
  body: z.ZodObject<{
    callbackURL: z.ZodOptional<z.ZodString>;
    password: z.ZodOptional<z.ZodString>;
    token: z.ZodOptional<z.ZodString>;
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
                callbackURL: {
                  type: string;
                  description: string;
                };
                password: {
                  type: string;
                  description: string;
                };
                token: {
                  type: string;
                  description: string;
                };
              };
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
                  success: {
                    type: string;
                    description: string;
                  };
                  message: {
                    type: string;
                    enum: string[];
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
  success: boolean;
  message: string;
}>;
declare const deleteUserCallback: better_call901.StrictEndpoint<"/delete-user/callback", {
  method: "GET";
  query: z.ZodObject<{
    token: z.ZodString;
    callbackURL: z.ZodOptional<z.ZodString>;
  }, z.core.$strip>;
  use: ((inputContext: better_call901.MiddlewareInputContext<better_call901.MiddlewareOptions>) => Promise<void>)[];
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
                  success: {
                    type: string;
                    description: string;
                  };
                  message: {
                    type: string;
                    enum: string[];
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
  success: boolean;
  message: string;
}>;
declare const changeEmail: better_call901.StrictEndpoint<"/change-email", {
  method: "POST";
  body: z.ZodObject<{
    newEmail: z.ZodEmail;
    callbackURL: z.ZodOptional<z.ZodString>;
  }, z.core.$strip>;
  use: ((inputContext: better_call901.MiddlewareInputContext<better_call901.MiddlewareOptions>) => Promise<{
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
                  message: {
                    type: string;
                    enum: string[];
                    description: string;
                    nullable: boolean;
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
  status: boolean;
}>;
//#endregion
export { changeEmail, changePassword, deleteUser, deleteUserCallback, setPassword, updateUser };
//# sourceMappingURL=update-user.d.mts.map