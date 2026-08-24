import { InferAdditionalFieldsFromPluginOptions } from "../../../db/field.mjs";
import "../../../db/index.mjs";
import { PrettifyDeep } from "../../../types/helper.mjs";
import { Role } from "../../access/types.mjs";
import { OrganizationOptions } from "../types.mjs";
import { teamSchema } from "../schema.mjs";
import "../../index.mjs";
import { defaultRoles } from "../access/statement.mjs";
import "../access/index.mjs";
import * as _better_auth_core33 from "@better-auth/core";
import * as _better_auth_core_db34 from "@better-auth/core/db";
import * as z from "zod";
import * as better_call727 from "better-call";

//#region src/plugins/organization/routes/crud-team.d.ts
declare const teamBaseSchema: z.ZodObject<{
  name: z.ZodString;
  organizationId: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
declare const createTeam: <O extends OrganizationOptions>(options: O) => better_call727.StrictEndpoint<"/organization/create-team", {
  method: "POST";
  body: z.ZodObject<{
    name: z.ZodString;
    organizationId: z.ZodOptional<z.ZodString>;
  }, z.core.$strip>;
  use: ((inputContext: better_call727.MiddlewareInputContext<better_call727.MiddlewareOptions>) => Promise<{
    orgOptions: OrganizationOptions;
    roles: typeof defaultRoles & {
      [key: string]: Role<{}>;
    };
    getSession: (context: _better_auth_core33.GenericEndpointContext) => Promise<{
      session: _better_auth_core_db34.Session & {
        activeTeamId?: string | undefined;
        activeOrganizationId?: string | undefined;
      };
      user: _better_auth_core_db34.User;
    }>;
  }>)[];
  metadata: {
    $Infer: {
      body: z.infer<typeof teamBaseSchema> & InferAdditionalFieldsFromPluginOptions<"team", O>;
    };
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
                  id: {
                    type: string;
                    description: string;
                  };
                  name: {
                    type: string;
                    description: string;
                  };
                  organizationId: {
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
          };
        };
      };
    };
  };
}, {
  id: string;
  name: string;
  organizationId: string;
  createdAt: Date;
  updatedAt?: Date | undefined;
} & InferAdditionalFieldsFromPluginOptions<"team", O, false> extends infer T ? { [K in keyof T]: T[K] } : never>;
declare const removeTeam: <O extends OrganizationOptions>(options: O) => better_call727.StrictEndpoint<"/organization/remove-team", {
  method: "POST";
  body: z.ZodObject<{
    teamId: z.ZodString;
    organizationId: z.ZodOptional<z.ZodString>;
  }, z.core.$strip>;
  use: ((inputContext: better_call727.MiddlewareInputContext<better_call727.MiddlewareOptions>) => Promise<{
    orgOptions: OrganizationOptions;
    roles: typeof defaultRoles & {
      [key: string]: Role<{}>;
    };
    getSession: (context: _better_auth_core33.GenericEndpointContext) => Promise<{
      session: _better_auth_core_db34.Session & {
        activeTeamId?: string | undefined;
        activeOrganizationId?: string | undefined;
      };
      user: _better_auth_core_db34.User;
    }>;
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
                  message: {
                    type: string;
                    description: string;
                    enum: string[];
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
  message: string;
} | null>;
declare const updateTeam: <O extends OrganizationOptions>(options: O) => better_call727.StrictEndpoint<"/organization/update-team", {
  method: "POST";
  body: z.ZodObject<{
    teamId: z.ZodString;
    data: z.ZodObject<{
      id: z.ZodOptional<z.ZodDefault<z.ZodString>>;
      name: z.ZodOptional<z.ZodString>;
      organizationId: z.ZodOptional<z.ZodString>;
      createdAt: z.ZodOptional<z.ZodDate>;
      updatedAt: z.ZodOptional<z.ZodOptional<z.ZodDate>>;
    }, z.core.$strip>;
  }, z.core.$strip>;
  requireHeaders: true;
  use: (((inputContext: better_call727.MiddlewareInputContext<better_call727.MiddlewareOptions>) => Promise<{
    orgOptions: OrganizationOptions;
    roles: typeof defaultRoles & {
      [key: string]: Role<{}>;
    };
    getSession: (context: _better_auth_core33.GenericEndpointContext) => Promise<{
      session: _better_auth_core_db34.Session & {
        activeTeamId?: string | undefined;
        activeOrganizationId?: string | undefined;
      };
      user: _better_auth_core_db34.User;
    }>;
  }>) | ((inputContext: better_call727.MiddlewareInputContext<{
    use: ((inputContext: better_call727.MiddlewareInputContext<better_call727.MiddlewareOptions>) => Promise<{
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
  }>) => Promise<{
    session: {
      session: _better_auth_core_db34.Session & {
        activeTeamId?: string | undefined;
        activeOrganizationId?: string | undefined;
      };
      user: _better_auth_core_db34.User;
    };
  }>))[];
  metadata: {
    $Infer: {
      body: {
        teamId: string;
        data: Partial<PrettifyDeep<Omit<z.infer<typeof teamSchema>, "id" | "createdAt" | "updatedAt">> & InferAdditionalFieldsFromPluginOptions<"team", O>>;
      };
    };
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
                  id: {
                    type: string;
                    description: string;
                  };
                  name: {
                    type: string;
                    description: string;
                  };
                  organizationId: {
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
          };
        };
      };
    };
  };
}, (({
  id: string;
  name: string;
  organizationId: string;
  createdAt: Date;
  updatedAt?: Date | undefined;
} & InferAdditionalFieldsFromPluginOptions<"team", O, false> extends infer T ? { [K in keyof T]: T[K] } : never) & InferAdditionalFieldsFromPluginOptions<"team", O, true>) | null>;
declare const listOrganizationTeams: <O extends OrganizationOptions>(options: O) => better_call727.StrictEndpoint<"/organization/list-teams", {
  method: "GET";
  query: z.ZodOptional<z.ZodObject<{
    organizationId: z.ZodOptional<z.ZodString>;
  }, z.core.$strip>>;
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
                  type: string;
                  properties: {
                    id: {
                      type: string;
                      description: string;
                    };
                    name: {
                      type: string;
                      description: string;
                    };
                    organizationId: {
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
                description: string;
              };
            };
          };
        };
      };
    };
  };
  requireHeaders: true;
  use: (((inputContext: better_call727.MiddlewareInputContext<better_call727.MiddlewareOptions>) => Promise<{
    orgOptions: OrganizationOptions;
    roles: typeof defaultRoles & {
      [key: string]: Role<{}>;
    };
    getSession: (context: _better_auth_core33.GenericEndpointContext) => Promise<{
      session: _better_auth_core_db34.Session & {
        activeTeamId?: string | undefined;
        activeOrganizationId?: string | undefined;
      };
      user: _better_auth_core_db34.User;
    }>;
  }>) | ((inputContext: better_call727.MiddlewareInputContext<{
    use: ((inputContext: better_call727.MiddlewareInputContext<better_call727.MiddlewareOptions>) => Promise<{
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
  }>) => Promise<{
    session: {
      session: _better_auth_core_db34.Session & {
        activeTeamId?: string | undefined;
        activeOrganizationId?: string | undefined;
      };
      user: _better_auth_core_db34.User;
    };
  }>))[];
}, ({
  id: string;
  name: string;
  organizationId: string;
  createdAt: Date;
  updatedAt?: Date | undefined;
} & InferAdditionalFieldsFromPluginOptions<"team", O, false> extends infer T ? { [K in keyof T]: T[K] } : never)[]>;
declare const setActiveTeam: <O extends OrganizationOptions>(options: O) => better_call727.StrictEndpoint<"/organization/set-active-team", {
  method: "POST";
  body: z.ZodObject<{
    teamId: z.ZodOptional<z.ZodNullable<z.ZodString>>;
  }, z.core.$strip>;
  requireHeaders: true;
  use: (((inputContext: better_call727.MiddlewareInputContext<better_call727.MiddlewareOptions>) => Promise<{
    orgOptions: OrganizationOptions;
    roles: typeof defaultRoles & {
      [key: string]: Role<{}>;
    };
    getSession: (context: _better_auth_core33.GenericEndpointContext) => Promise<{
      session: _better_auth_core_db34.Session & {
        activeTeamId?: string | undefined;
        activeOrganizationId?: string | undefined;
      };
      user: _better_auth_core_db34.User;
    }>;
  }>) | ((inputContext: better_call727.MiddlewareInputContext<{
    use: ((inputContext: better_call727.MiddlewareInputContext<better_call727.MiddlewareOptions>) => Promise<{
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
  }>) => Promise<{
    session: {
      session: _better_auth_core_db34.Session & {
        activeTeamId?: string | undefined;
        activeOrganizationId?: string | undefined;
      };
      user: _better_auth_core_db34.User;
    };
  }>))[];
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
                description: string;
                $ref: string;
              };
            };
          };
        };
      };
    };
  };
}, {
  id: string;
  name: string;
  organizationId: string;
  createdAt: Date;
  updatedAt?: Date | undefined;
} | null>;
declare const listUserTeams: <O extends OrganizationOptions>(options: O) => better_call727.StrictEndpoint<"/organization/list-user-teams", {
  method: "GET";
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
                  type: string;
                  description: string;
                  $ref: string;
                };
                description: string;
              };
            };
          };
        };
      };
    };
  };
  requireHeaders: true;
  use: (((inputContext: better_call727.MiddlewareInputContext<better_call727.MiddlewareOptions>) => Promise<{
    orgOptions: OrganizationOptions;
    roles: typeof defaultRoles & {
      [key: string]: Role<{}>;
    };
    getSession: (context: _better_auth_core33.GenericEndpointContext) => Promise<{
      session: _better_auth_core_db34.Session & {
        activeTeamId?: string | undefined;
        activeOrganizationId?: string | undefined;
      };
      user: _better_auth_core_db34.User;
    }>;
  }>) | ((inputContext: better_call727.MiddlewareInputContext<{
    use: ((inputContext: better_call727.MiddlewareInputContext<better_call727.MiddlewareOptions>) => Promise<{
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
  }>) => Promise<{
    session: {
      session: _better_auth_core_db34.Session & {
        activeTeamId?: string | undefined;
        activeOrganizationId?: string | undefined;
      };
      user: _better_auth_core_db34.User;
    };
  }>))[];
}, {
  id: string;
  name: string;
  organizationId: string;
  createdAt: Date;
  updatedAt?: Date | undefined;
}[]>;
declare const listTeamMembers: <O extends OrganizationOptions>(options: O) => better_call727.StrictEndpoint<"/organization/list-team-members", {
  method: "GET";
  query: z.ZodOptional<z.ZodObject<{
    teamId: z.ZodOptional<z.ZodString>;
  }, z.core.$strip>>;
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
                  type: string;
                  description: string;
                  properties: {
                    id: {
                      type: string;
                      description: string;
                    };
                    userId: {
                      type: string;
                      description: string;
                    };
                    teamId: {
                      type: string;
                      description: string;
                    };
                    createdAt: {
                      type: string;
                      format: string;
                      description: string;
                    };
                  };
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
  requireHeaders: true;
  use: (((inputContext: better_call727.MiddlewareInputContext<better_call727.MiddlewareOptions>) => Promise<{
    orgOptions: OrganizationOptions;
    roles: typeof defaultRoles & {
      [key: string]: Role<{}>;
    };
    getSession: (context: _better_auth_core33.GenericEndpointContext) => Promise<{
      session: _better_auth_core_db34.Session & {
        activeTeamId?: string | undefined;
        activeOrganizationId?: string | undefined;
      };
      user: _better_auth_core_db34.User;
    }>;
  }>) | ((inputContext: better_call727.MiddlewareInputContext<{
    use: ((inputContext: better_call727.MiddlewareInputContext<better_call727.MiddlewareOptions>) => Promise<{
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
  }>) => Promise<{
    session: {
      session: _better_auth_core_db34.Session & {
        activeTeamId?: string | undefined;
        activeOrganizationId?: string | undefined;
      };
      user: _better_auth_core_db34.User;
    };
  }>))[];
}, {
  id: string;
  teamId: string;
  userId: string;
  createdAt: Date;
}[]>;
declare const addTeamMember: <O extends OrganizationOptions>(options: O) => better_call727.StrictEndpoint<"/organization/add-team-member", {
  method: "POST";
  body: z.ZodObject<{
    teamId: z.ZodString;
    userId: z.ZodCoercedString<unknown>;
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
                description: string;
                properties: {
                  id: {
                    type: string;
                    description: string;
                  };
                  userId: {
                    type: string;
                    description: string;
                  };
                  teamId: {
                    type: string;
                    description: string;
                  };
                  createdAt: {
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
  requireHeaders: true;
  use: (((inputContext: better_call727.MiddlewareInputContext<better_call727.MiddlewareOptions>) => Promise<{
    orgOptions: OrganizationOptions;
    roles: typeof defaultRoles & {
      [key: string]: Role<{}>;
    };
    getSession: (context: _better_auth_core33.GenericEndpointContext) => Promise<{
      session: _better_auth_core_db34.Session & {
        activeTeamId?: string | undefined;
        activeOrganizationId?: string | undefined;
      };
      user: _better_auth_core_db34.User;
    }>;
  }>) | ((inputContext: better_call727.MiddlewareInputContext<{
    use: ((inputContext: better_call727.MiddlewareInputContext<better_call727.MiddlewareOptions>) => Promise<{
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
  }>) => Promise<{
    session: {
      session: _better_auth_core_db34.Session & {
        activeTeamId?: string | undefined;
        activeOrganizationId?: string | undefined;
      };
      user: _better_auth_core_db34.User;
    };
  }>))[];
}, {
  id: string;
  teamId: string;
  userId: string;
  createdAt: Date;
}>;
declare const removeTeamMember: <O extends OrganizationOptions>(options: O) => better_call727.StrictEndpoint<"/organization/remove-team-member", {
  method: "POST";
  body: z.ZodObject<{
    teamId: z.ZodString;
    userId: z.ZodCoercedString<unknown>;
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
                  message: {
                    type: string;
                    description: string;
                    enum: string[];
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
  requireHeaders: true;
  use: (((inputContext: better_call727.MiddlewareInputContext<better_call727.MiddlewareOptions>) => Promise<{
    orgOptions: OrganizationOptions;
    roles: typeof defaultRoles & {
      [key: string]: Role<{}>;
    };
    getSession: (context: _better_auth_core33.GenericEndpointContext) => Promise<{
      session: _better_auth_core_db34.Session & {
        activeTeamId?: string | undefined;
        activeOrganizationId?: string | undefined;
      };
      user: _better_auth_core_db34.User;
    }>;
  }>) | ((inputContext: better_call727.MiddlewareInputContext<{
    use: ((inputContext: better_call727.MiddlewareInputContext<better_call727.MiddlewareOptions>) => Promise<{
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
  }>) => Promise<{
    session: {
      session: _better_auth_core_db34.Session & {
        activeTeamId?: string | undefined;
        activeOrganizationId?: string | undefined;
      };
      user: _better_auth_core_db34.User;
    };
  }>))[];
}, {
  message: string;
}>;
//#endregion
export { addTeamMember, createTeam, listOrganizationTeams, listTeamMembers, listUserTeams, removeTeam, removeTeamMember, setActiveTeam, updateTeam };
//# sourceMappingURL=crud-team.d.mts.map