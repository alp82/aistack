import { AccessControl, Statements } from "../access/types.mjs";
import { AdminOptions, InferAdminRolesFromOption, SessionWithImpersonatedBy, UserWithRole } from "./types.mjs";
import "../index.mjs";
import * as _better_auth_core21 from "@better-auth/core";
import * as _better_auth_core_db7 from "@better-auth/core/db";
import * as zod518 from "zod";
import * as better_call250 from "better-call";
import * as zod_v4_core75 from "zod/v4/core";

//#region src/plugins/admin/admin.d.ts
declare const admin: <O extends AdminOptions>(options?: O | undefined) => {
  id: "admin";
  init(): {
    options: {
      databaseHooks: {
        user: {
          create: {
            before(user: {
              id: string;
              createdAt: Date;
              updatedAt: Date;
              email: string;
              emailVerified: boolean;
              name: string;
              image?: string | null | undefined;
            } & Record<string, unknown>): Promise<{
              data: {
                id: string;
                createdAt: Date;
                updatedAt: Date;
                email: string;
                emailVerified: boolean;
                name: string;
                image?: string | null | undefined;
                role: string;
              };
            }>;
          };
        };
        session: {
          create: {
            before(session: {
              id: string;
              createdAt: Date;
              updatedAt: Date;
              userId: string;
              expiresAt: Date;
              token: string;
              ipAddress?: string | null | undefined;
              userAgent?: string | null | undefined;
            } & Record<string, unknown>, ctx: _better_auth_core21.GenericEndpointContext | null): Promise<void>;
          };
        };
      };
    };
  };
  hooks: {
    after: {
      matcher(context: _better_auth_core21.HookEndpointContext): boolean;
      handler: (inputContext: better_call250.MiddlewareInputContext<better_call250.MiddlewareOptions>) => Promise<SessionWithImpersonatedBy[] | undefined>;
    }[];
  };
  endpoints: {
    setRole: better_call250.StrictEndpoint<"/admin/set-role", {
      method: "POST";
      body: zod518.ZodObject<{
        userId: zod518.ZodCoercedString<unknown>;
        role: zod518.ZodUnion<readonly [zod518.ZodString, zod518.ZodArray<zod518.ZodString>]>;
      }, zod_v4_core75.$strip>;
      requireHeaders: true;
      use: ((inputContext: better_call250.MiddlewareInputContext<better_call250.MiddlewareOptions>) => Promise<{
        session: {
          user: UserWithRole;
          session: _better_auth_core_db7.Session;
        };
      }>)[];
      metadata: {
        openapi: {
          operationId: string;
          summary: string;
          description: string;
          responses: {
            200: {
              description: string;
              content: {
                "application/json": {
                  schema: {
                    type: "object";
                    properties: {
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
            userId: string;
            role: InferAdminRolesFromOption<O & Required<Pick<AdminOptions, "defaultRole" | "adminRoles" | "bannedUserMessage">>> | InferAdminRolesFromOption<O & Required<Pick<AdminOptions, "defaultRole" | "adminRoles" | "bannedUserMessage">>>[];
          };
        };
      };
    }, {
      user: UserWithRole;
    }>;
    getUser: better_call250.StrictEndpoint<"/admin/get-user", {
      method: "GET";
      query: zod518.ZodObject<{
        id: zod518.ZodString;
      }, zod_v4_core75.$strip>;
      use: ((inputContext: better_call250.MiddlewareInputContext<better_call250.MiddlewareOptions>) => Promise<{
        session: {
          user: UserWithRole;
          session: _better_auth_core_db7.Session;
        };
      }>)[];
      metadata: {
        openapi: {
          operationId: string;
          summary: string;
          description: string;
          responses: {
            200: {
              description: string;
              content: {
                "application/json": {
                  schema: {
                    type: "object";
                    properties: {
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
      };
    }, {
      id: string;
      createdAt: Date;
      updatedAt: Date;
      email: string;
      emailVerified: boolean;
      name: string;
      image?: string | null | undefined;
    }>;
    createUser: better_call250.StrictEndpoint<"/admin/create-user", {
      method: "POST";
      body: zod518.ZodObject<{
        email: zod518.ZodString;
        password: zod518.ZodString;
        name: zod518.ZodString;
        role: zod518.ZodOptional<zod518.ZodUnion<readonly [zod518.ZodString, zod518.ZodArray<zod518.ZodString>]>>;
        data: zod518.ZodOptional<zod518.ZodRecord<zod518.ZodString, zod518.ZodAny>>;
      }, zod_v4_core75.$strip>;
      metadata: {
        openapi: {
          operationId: string;
          summary: string;
          description: string;
          responses: {
            200: {
              description: string;
              content: {
                "application/json": {
                  schema: {
                    type: "object";
                    properties: {
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
            email: string;
            password: string;
            name: string;
            role?: InferAdminRolesFromOption<O & Required<Pick<AdminOptions, "defaultRole" | "adminRoles" | "bannedUserMessage">>> | InferAdminRolesFromOption<O & Required<Pick<AdminOptions, "defaultRole" | "adminRoles" | "bannedUserMessage">>>[] | undefined;
            data?: Record<string, any> | undefined;
          };
        };
      };
    }, {
      user: UserWithRole;
    }>;
    adminUpdateUser: better_call250.StrictEndpoint<"/admin/update-user", {
      method: "POST";
      body: zod518.ZodObject<{
        userId: zod518.ZodCoercedString<unknown>;
        data: zod518.ZodRecord<zod518.ZodAny, zod518.ZodAny>;
      }, zod_v4_core75.$strip>;
      use: ((inputContext: better_call250.MiddlewareInputContext<better_call250.MiddlewareOptions>) => Promise<{
        session: {
          user: UserWithRole;
          session: _better_auth_core_db7.Session;
        };
      }>)[];
      metadata: {
        openapi: {
          operationId: string;
          summary: string;
          description: string;
          responses: {
            200: {
              description: string;
              content: {
                "application/json": {
                  schema: {
                    type: "object";
                    properties: {
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
      };
    }, UserWithRole>;
    listUsers: better_call250.StrictEndpoint<"/admin/list-users", {
      method: "GET";
      use: ((inputContext: better_call250.MiddlewareInputContext<better_call250.MiddlewareOptions>) => Promise<{
        session: {
          user: UserWithRole;
          session: _better_auth_core_db7.Session;
        };
      }>)[];
      query: zod518.ZodObject<{
        searchValue: zod518.ZodOptional<zod518.ZodString>;
        searchField: zod518.ZodOptional<zod518.ZodEnum<{
          name: "name";
          email: "email";
        }>>;
        searchOperator: zod518.ZodOptional<zod518.ZodEnum<{
          contains: "contains";
          starts_with: "starts_with";
          ends_with: "ends_with";
        }>>;
        limit: zod518.ZodOptional<zod518.ZodUnion<[zod518.ZodString, zod518.ZodNumber]>>;
        offset: zod518.ZodOptional<zod518.ZodUnion<[zod518.ZodString, zod518.ZodNumber]>>;
        sortBy: zod518.ZodOptional<zod518.ZodString>;
        sortDirection: zod518.ZodOptional<zod518.ZodEnum<{
          asc: "asc";
          desc: "desc";
        }>>;
        filterField: zod518.ZodOptional<zod518.ZodString>;
        filterValue: zod518.ZodOptional<zod518.ZodUnion<[zod518.ZodUnion<[zod518.ZodString, zod518.ZodNumber]>, zod518.ZodBoolean]>>;
        filterOperator: zod518.ZodOptional<zod518.ZodEnum<{
          eq: "eq";
          ne: "ne";
          lt: "lt";
          lte: "lte";
          gt: "gt";
          gte: "gte";
          contains: "contains";
        }>>;
      }, zod_v4_core75.$strip>;
      metadata: {
        openapi: {
          operationId: string;
          summary: string;
          description: string;
          responses: {
            200: {
              description: string;
              content: {
                "application/json": {
                  schema: {
                    type: "object";
                    properties: {
                      users: {
                        type: string;
                        items: {
                          $ref: string;
                        };
                      };
                      total: {
                        type: string;
                      };
                      limit: {
                        type: string;
                      };
                      offset: {
                        type: string;
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
      users: UserWithRole[];
      total: number;
      limit: number | undefined;
      offset: number | undefined;
    } | {
      users: never[];
      total: number;
    }>;
    listUserSessions: better_call250.StrictEndpoint<"/admin/list-user-sessions", {
      method: "POST";
      use: ((inputContext: better_call250.MiddlewareInputContext<better_call250.MiddlewareOptions>) => Promise<{
        session: {
          user: UserWithRole;
          session: _better_auth_core_db7.Session;
        };
      }>)[];
      body: zod518.ZodObject<{
        userId: zod518.ZodCoercedString<unknown>;
      }, zod_v4_core75.$strip>;
      metadata: {
        openapi: {
          operationId: string;
          summary: string;
          description: string;
          responses: {
            200: {
              description: string;
              content: {
                "application/json": {
                  schema: {
                    type: "object";
                    properties: {
                      sessions: {
                        type: string;
                        items: {
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
      };
    }, {
      sessions: SessionWithImpersonatedBy[];
    }>;
    unbanUser: better_call250.StrictEndpoint<"/admin/unban-user", {
      method: "POST";
      body: zod518.ZodObject<{
        userId: zod518.ZodCoercedString<unknown>;
      }, zod_v4_core75.$strip>;
      use: ((inputContext: better_call250.MiddlewareInputContext<better_call250.MiddlewareOptions>) => Promise<{
        session: {
          user: UserWithRole;
          session: _better_auth_core_db7.Session;
        };
      }>)[];
      metadata: {
        openapi: {
          operationId: string;
          summary: string;
          description: string;
          responses: {
            200: {
              description: string;
              content: {
                "application/json": {
                  schema: {
                    type: "object";
                    properties: {
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
      };
    }, {
      user: {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        email: string;
        emailVerified: boolean;
        name: string;
        image?: string | null | undefined;
      } & Record<string, any>;
    }>;
    banUser: better_call250.StrictEndpoint<"/admin/ban-user", {
      method: "POST";
      body: zod518.ZodObject<{
        userId: zod518.ZodCoercedString<unknown>;
        banReason: zod518.ZodOptional<zod518.ZodString>;
        banExpiresIn: zod518.ZodOptional<zod518.ZodNumber>;
      }, zod_v4_core75.$strip>;
      use: ((inputContext: better_call250.MiddlewareInputContext<better_call250.MiddlewareOptions>) => Promise<{
        session: {
          user: UserWithRole;
          session: _better_auth_core_db7.Session;
        };
      }>)[];
      metadata: {
        openapi: {
          operationId: string;
          summary: string;
          description: string;
          responses: {
            200: {
              description: string;
              content: {
                "application/json": {
                  schema: {
                    type: "object";
                    properties: {
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
      };
    }, {
      user: {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        email: string;
        emailVerified: boolean;
        name: string;
        image?: string | null | undefined;
      } & Record<string, any>;
    }>;
    impersonateUser: better_call250.StrictEndpoint<"/admin/impersonate-user", {
      method: "POST";
      body: zod518.ZodObject<{
        userId: zod518.ZodCoercedString<unknown>;
      }, zod_v4_core75.$strip>;
      use: ((inputContext: better_call250.MiddlewareInputContext<better_call250.MiddlewareOptions>) => Promise<{
        session: {
          user: UserWithRole;
          session: _better_auth_core_db7.Session;
        };
      }>)[];
      metadata: {
        openapi: {
          operationId: string;
          summary: string;
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
      user: UserWithRole;
    }>;
    stopImpersonating: better_call250.StrictEndpoint<"/admin/stop-impersonating", {
      method: "POST";
      requireHeaders: true;
    }, {
      session: _better_auth_core_db7.Session & Record<string, any>;
      user: _better_auth_core_db7.User & Record<string, any>;
    }>;
    revokeUserSession: better_call250.StrictEndpoint<"/admin/revoke-user-session", {
      method: "POST";
      body: zod518.ZodObject<{
        sessionToken: zod518.ZodString;
      }, zod_v4_core75.$strip>;
      use: ((inputContext: better_call250.MiddlewareInputContext<better_call250.MiddlewareOptions>) => Promise<{
        session: {
          user: UserWithRole;
          session: _better_auth_core_db7.Session;
        };
      }>)[];
      metadata: {
        openapi: {
          operationId: string;
          summary: string;
          description: string;
          responses: {
            200: {
              description: string;
              content: {
                "application/json": {
                  schema: {
                    type: "object";
                    properties: {
                      success: {
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
      success: boolean;
    }>;
    revokeUserSessions: better_call250.StrictEndpoint<"/admin/revoke-user-sessions", {
      method: "POST";
      body: zod518.ZodObject<{
        userId: zod518.ZodCoercedString<unknown>;
      }, zod_v4_core75.$strip>;
      use: ((inputContext: better_call250.MiddlewareInputContext<better_call250.MiddlewareOptions>) => Promise<{
        session: {
          user: UserWithRole;
          session: _better_auth_core_db7.Session;
        };
      }>)[];
      metadata: {
        openapi: {
          operationId: string;
          summary: string;
          description: string;
          responses: {
            200: {
              description: string;
              content: {
                "application/json": {
                  schema: {
                    type: "object";
                    properties: {
                      success: {
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
      success: boolean;
    }>;
    removeUser: better_call250.StrictEndpoint<"/admin/remove-user", {
      method: "POST";
      body: zod518.ZodObject<{
        userId: zod518.ZodCoercedString<unknown>;
      }, zod_v4_core75.$strip>;
      use: ((inputContext: better_call250.MiddlewareInputContext<better_call250.MiddlewareOptions>) => Promise<{
        session: {
          user: UserWithRole;
          session: _better_auth_core_db7.Session;
        };
      }>)[];
      metadata: {
        openapi: {
          operationId: string;
          summary: string;
          description: string;
          responses: {
            200: {
              description: string;
              content: {
                "application/json": {
                  schema: {
                    type: "object";
                    properties: {
                      success: {
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
      success: boolean;
    }>;
    setUserPassword: better_call250.StrictEndpoint<"/admin/set-user-password", {
      method: "POST";
      body: zod518.ZodObject<{
        newPassword: zod518.ZodString;
        userId: zod518.ZodCoercedString<unknown>;
      }, zod_v4_core75.$strip>;
      use: ((inputContext: better_call250.MiddlewareInputContext<better_call250.MiddlewareOptions>) => Promise<{
        session: {
          user: UserWithRole;
          session: _better_auth_core_db7.Session;
        };
      }>)[];
      metadata: {
        openapi: {
          operationId: string;
          summary: string;
          description: string;
          responses: {
            200: {
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
    userHasPermission: better_call250.StrictEndpoint<"/admin/has-permission", {
      method: "POST";
      body: zod518.ZodIntersection<zod518.ZodObject<{
        userId: zod518.ZodOptional<zod518.ZodCoercedString<unknown>>;
        role: zod518.ZodOptional<zod518.ZodString>;
      }, zod_v4_core75.$strip>, zod518.ZodUnion<readonly [zod518.ZodObject<{
        permission: zod518.ZodRecord<zod518.ZodString, zod518.ZodArray<zod518.ZodString>>;
        permissions: zod518.ZodUndefined;
      }, zod_v4_core75.$strip>, zod518.ZodObject<{
        permission: zod518.ZodUndefined;
        permissions: zod518.ZodRecord<zod518.ZodString, zod518.ZodArray<zod518.ZodString>>;
      }, zod_v4_core75.$strip>]>>;
      metadata: {
        openapi: {
          description: string;
          requestBody: {
            content: {
              "application/json": {
                schema: {
                  type: "object";
                  properties: {
                    permission: {
                      type: string;
                      description: string;
                      deprecated: boolean;
                    };
                    permissions: {
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
                      error: {
                        type: string;
                      };
                      success: {
                        type: string;
                      };
                    };
                    required: string[];
                  };
                };
              };
            };
          };
        };
        $Infer: {
          body: ({
            permission: { [key in keyof (O["ac"] extends AccessControl<infer S extends Statements> ? S : {
              readonly user: readonly ["create", "list", "set-role", "ban", "impersonate", "delete", "set-password", "get", "update"];
              readonly session: readonly ["list", "revoke", "delete"];
            })]?: ((O["ac"] extends AccessControl<infer S extends Statements> ? S : {
              readonly user: readonly ["create", "list", "set-role", "ban", "impersonate", "delete", "set-password", "get", "update"];
              readonly session: readonly ["list", "revoke", "delete"];
            })[key] extends readonly unknown[] ? (O["ac"] extends AccessControl<infer S extends Statements> ? S : {
              readonly user: readonly ["create", "list", "set-role", "ban", "impersonate", "delete", "set-password", "get", "update"];
              readonly session: readonly ["list", "revoke", "delete"];
            })[key][number] : never)[] | undefined };
            permissions?: never | undefined;
          } | {
            permissions: { [key in keyof (O["ac"] extends AccessControl<infer S extends Statements> ? S : {
              readonly user: readonly ["create", "list", "set-role", "ban", "impersonate", "delete", "set-password", "get", "update"];
              readonly session: readonly ["list", "revoke", "delete"];
            })]?: ((O["ac"] extends AccessControl<infer S extends Statements> ? S : {
              readonly user: readonly ["create", "list", "set-role", "ban", "impersonate", "delete", "set-password", "get", "update"];
              readonly session: readonly ["list", "revoke", "delete"];
            })[key] extends readonly unknown[] ? (O["ac"] extends AccessControl<infer S extends Statements> ? S : {
              readonly user: readonly ["create", "list", "set-role", "ban", "impersonate", "delete", "set-password", "get", "update"];
              readonly session: readonly ["list", "revoke", "delete"];
            })[key][number] : never)[] | undefined };
            permission?: never | undefined;
          }) & {
            userId?: string | undefined;
            role?: InferAdminRolesFromOption<O> | undefined;
          };
        };
      };
    }, {
      error: null;
      success: boolean;
    }>;
  };
  $ERROR_CODES: {
    readonly FAILED_TO_CREATE_USER: "Failed to create user";
    readonly USER_ALREADY_EXISTS: "User already exists.";
    readonly USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL: "User already exists. Use another email.";
    readonly YOU_CANNOT_BAN_YOURSELF: "You cannot ban yourself";
    readonly YOU_ARE_NOT_ALLOWED_TO_CHANGE_USERS_ROLE: "You are not allowed to change users role";
    readonly YOU_ARE_NOT_ALLOWED_TO_CREATE_USERS: "You are not allowed to create users";
    readonly YOU_ARE_NOT_ALLOWED_TO_LIST_USERS: "You are not allowed to list users";
    readonly YOU_ARE_NOT_ALLOWED_TO_LIST_USERS_SESSIONS: "You are not allowed to list users sessions";
    readonly YOU_ARE_NOT_ALLOWED_TO_BAN_USERS: "You are not allowed to ban users";
    readonly YOU_ARE_NOT_ALLOWED_TO_IMPERSONATE_USERS: "You are not allowed to impersonate users";
    readonly YOU_ARE_NOT_ALLOWED_TO_REVOKE_USERS_SESSIONS: "You are not allowed to revoke users sessions";
    readonly YOU_ARE_NOT_ALLOWED_TO_DELETE_USERS: "You are not allowed to delete users";
    readonly YOU_ARE_NOT_ALLOWED_TO_SET_USERS_PASSWORD: "You are not allowed to set users password";
    readonly BANNED_USER: "You have been banned from this application";
    readonly YOU_ARE_NOT_ALLOWED_TO_GET_USER: "You are not allowed to get user";
    readonly NO_DATA_TO_UPDATE: "No data to update";
    readonly YOU_ARE_NOT_ALLOWED_TO_UPDATE_USERS: "You are not allowed to update users";
    readonly YOU_CANNOT_REMOVE_YOURSELF: "You cannot remove yourself";
    readonly YOU_ARE_NOT_ALLOWED_TO_SET_NON_EXISTENT_VALUE: "You are not allowed to set a non-existent role value";
    readonly YOU_CANNOT_IMPERSONATE_ADMINS: "You cannot impersonate admins";
    readonly INVALID_ROLE_TYPE: "Invalid role type";
  };
  schema: {
    user: {
      fields: {
        role: {
          type: "string";
          required: false;
          input: false;
        };
        banned: {
          type: "boolean";
          defaultValue: false;
          required: false;
          input: false;
        };
        banReason: {
          type: "string";
          required: false;
          input: false;
        };
        banExpires: {
          type: "date";
          required: false;
          input: false;
        };
      };
    };
    session: {
      fields: {
        impersonatedBy: {
          type: "string";
          required: false;
        };
      };
    };
  };
  options: NoInfer<O>;
};
//#endregion
export { admin };
//# sourceMappingURL=admin.d.mts.map