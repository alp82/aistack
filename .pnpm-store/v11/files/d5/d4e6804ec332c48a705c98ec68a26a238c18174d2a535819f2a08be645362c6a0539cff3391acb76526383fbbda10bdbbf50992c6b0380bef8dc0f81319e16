import { InferAdditionalFieldsFromPluginOptions } from "../../../db/field.mjs";
import "../../../db/index.mjs";
import { Role } from "../../access/types.mjs";
import { OrganizationOptions } from "../types.mjs";
import { InferOrganizationRolesFromOption } from "../schema.mjs";
import "../../index.mjs";
import { defaultRoles } from "../access/statement.mjs";
import "../access/index.mjs";
import * as _better_auth_core42 from "@better-auth/core";
import { LiteralString } from "@better-auth/core";
import * as _better_auth_core_db66 from "@better-auth/core/db";
import * as z from "zod";
import * as better_call775 from "better-call";

//#region src/plugins/organization/routes/crud-members.d.ts
declare const addMember: <O extends OrganizationOptions>(option: O) => better_call775.StrictEndpoint<string, {
  method: "POST";
  body: z.ZodObject<{
    userId: z.ZodCoercedString<unknown>;
    role: z.ZodUnion<readonly [z.ZodString, z.ZodArray<z.ZodString>]>;
    organizationId: z.ZodOptional<z.ZodString>;
    teamId: z.ZodOptional<z.ZodString>;
  }, z.core.$strip>;
  use: ((inputContext: better_call775.MiddlewareInputContext<better_call775.MiddlewareOptions>) => Promise<{
    orgOptions: OrganizationOptions;
    roles: typeof defaultRoles & {
      [key: string]: Role<{}>;
    };
    getSession: (context: _better_auth_core42.GenericEndpointContext) => Promise<{
      session: _better_auth_core_db66.Session & {
        activeTeamId?: string | undefined;
        activeOrganizationId?: string | undefined;
      };
      user: _better_auth_core_db66.User;
    }>;
  }>)[];
  metadata: {
    $Infer: {
      body: {
        userId: string;
        role: InferOrganizationRolesFromOption<O> | InferOrganizationRolesFromOption<O>[];
        organizationId?: string | undefined;
      } & (O extends {
        teams: {
          enabled: true;
        };
      } ? {
        teamId?: string | undefined;
      } : {}) & InferAdditionalFieldsFromPluginOptions<"member", O>;
    };
    openapi: {
      operationId: string;
      description: string;
    };
  };
}, ({
  id: string;
  organizationId: string;
  userId: string;
  role: string;
  createdAt: Date;
} & InferAdditionalFieldsFromPluginOptions<"member", O, false>) | null>;
declare const removeMember: <O extends OrganizationOptions>(options: O) => better_call775.StrictEndpoint<"/organization/remove-member", {
  method: "POST";
  body: z.ZodObject<{
    memberIdOrEmail: z.ZodString;
    organizationId: z.ZodOptional<z.ZodString>;
  }, z.core.$strip>;
  requireHeaders: true;
  use: (((inputContext: better_call775.MiddlewareInputContext<better_call775.MiddlewareOptions>) => Promise<{
    orgOptions: OrganizationOptions;
    roles: typeof defaultRoles & {
      [key: string]: Role<{}>;
    };
    getSession: (context: _better_auth_core42.GenericEndpointContext) => Promise<{
      session: _better_auth_core_db66.Session & {
        activeTeamId?: string | undefined;
        activeOrganizationId?: string | undefined;
      };
      user: _better_auth_core_db66.User;
    }>;
  }>) | ((inputContext: better_call775.MiddlewareInputContext<{
    use: ((inputContext: better_call775.MiddlewareInputContext<better_call775.MiddlewareOptions>) => Promise<{
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
      session: _better_auth_core_db66.Session & {
        activeTeamId?: string | undefined;
        activeOrganizationId?: string | undefined;
      };
      user: _better_auth_core_db66.User;
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
                properties: {
                  member: {
                    type: string;
                    properties: {
                      id: {
                        type: string;
                      };
                      userId: {
                        type: string;
                      };
                      organizationId: {
                        type: string;
                      };
                      role: {
                        type: string;
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
  member: (O["teams"] extends {
    enabled: true;
  } ? {
    id: string;
    organizationId: string;
    role: InferOrganizationRolesFromOption<O>;
    createdAt: Date;
    userId: string;
    teamId?: string | undefined;
    user: {
      id: string;
      email: string;
      name: string;
      image?: string | undefined;
    };
  } : {
    id: string;
    organizationId: string;
    role: InferOrganizationRolesFromOption<O>;
    createdAt: Date;
    userId: string;
    user: {
      id: string;
      email: string;
      name: string;
      image?: string | undefined;
    };
  }) & InferAdditionalFieldsFromPluginOptions<"member", O, false> extends infer T ? { [K in keyof T]: T[K] } : never;
} | null>;
declare const updateMemberRole: <O extends OrganizationOptions>(option: O) => better_call775.StrictEndpoint<"/organization/update-member-role", {
  method: "POST";
  body: z.ZodObject<{
    role: z.ZodUnion<readonly [z.ZodString, z.ZodArray<z.ZodString>]>;
    memberId: z.ZodString;
    organizationId: z.ZodOptional<z.ZodString>;
  }, z.core.$strip>;
  use: (((inputContext: better_call775.MiddlewareInputContext<better_call775.MiddlewareOptions>) => Promise<{
    orgOptions: OrganizationOptions;
    roles: typeof defaultRoles & {
      [key: string]: Role<{}>;
    };
    getSession: (context: _better_auth_core42.GenericEndpointContext) => Promise<{
      session: _better_auth_core_db66.Session & {
        activeTeamId?: string | undefined;
        activeOrganizationId?: string | undefined;
      };
      user: _better_auth_core_db66.User;
    }>;
  }>) | ((inputContext: better_call775.MiddlewareInputContext<{
    use: ((inputContext: better_call775.MiddlewareInputContext<better_call775.MiddlewareOptions>) => Promise<{
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
      session: _better_auth_core_db66.Session & {
        activeTeamId?: string | undefined;
        activeOrganizationId?: string | undefined;
      };
      user: _better_auth_core_db66.User;
    };
  }>))[];
  requireHeaders: true;
  metadata: {
    $Infer: {
      body: {
        role: InferOrganizationRolesFromOption<O> | InferOrganizationRolesFromOption<O>[] | LiteralString | LiteralString[];
        memberId: string;
        /**
         * If not provided, the active organization will be used
         */
        organizationId?: string | undefined;
      };
    };
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
                  member: {
                    type: string;
                    properties: {
                      id: {
                        type: string;
                      };
                      userId: {
                        type: string;
                      };
                      organizationId: {
                        type: string;
                      };
                      role: {
                        type: string;
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
  id: string;
  organizationId: string;
  role: "member" | "admin" | "owner";
  createdAt: Date;
  userId: string;
  user: {
    id: string;
    email: string;
    name: string;
    image?: string | undefined;
  };
}>;
declare const getActiveMember: <O extends OrganizationOptions>(options: O) => better_call775.StrictEndpoint<"/organization/get-active-member", {
  method: "GET";
  use: (((inputContext: better_call775.MiddlewareInputContext<better_call775.MiddlewareOptions>) => Promise<{
    orgOptions: OrganizationOptions;
    roles: typeof defaultRoles & {
      [key: string]: Role<{}>;
    };
    getSession: (context: _better_auth_core42.GenericEndpointContext) => Promise<{
      session: _better_auth_core_db66.Session & {
        activeTeamId?: string | undefined;
        activeOrganizationId?: string | undefined;
      };
      user: _better_auth_core_db66.User;
    }>;
  }>) | ((inputContext: better_call775.MiddlewareInputContext<{
    use: ((inputContext: better_call775.MiddlewareInputContext<better_call775.MiddlewareOptions>) => Promise<{
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
      session: _better_auth_core_db66.Session & {
        activeTeamId?: string | undefined;
        activeOrganizationId?: string | undefined;
      };
      user: _better_auth_core_db66.User;
    };
  }>))[];
  requireHeaders: true;
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
                  id: {
                    type: string;
                  };
                  userId: {
                    type: string;
                  };
                  organizationId: {
                    type: string;
                  };
                  role: {
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
}, (Omit<((O["teams"] extends {
  enabled: true;
} ? {
  id: string;
  organizationId: string;
  role: InferOrganizationRolesFromOption<O>;
  createdAt: Date;
  userId: string;
  teamId?: string | undefined;
  user: {
    id: string;
    email: string;
    name: string;
    image?: string | undefined;
  };
} : {
  id: string;
  organizationId: string;
  role: InferOrganizationRolesFromOption<O>;
  createdAt: Date;
  userId: string;
  user: {
    id: string;
    email: string;
    name: string;
    image?: string | undefined;
  };
}) & InferAdditionalFieldsFromPluginOptions<"member", O, false> extends infer T ? { [K in keyof T]: T[K] } : never) & {
  user: _better_auth_core_db66.User;
}, "user"> & {
  user: {
    id: string;
    name: string;
    email: string;
    image: string | undefined;
  };
}) | null>;
declare const leaveOrganization: <O extends OrganizationOptions>(options: O) => better_call775.StrictEndpoint<"/organization/leave", {
  method: "POST";
  body: z.ZodObject<{
    organizationId: z.ZodString;
  }, z.core.$strip>;
  requireHeaders: true;
  use: (((inputContext: better_call775.MiddlewareInputContext<better_call775.MiddlewareOptions>) => Promise<{
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
  }>) | ((inputContext: better_call775.MiddlewareInputContext<better_call775.MiddlewareOptions>) => Promise<{
    orgOptions: OrganizationOptions;
    roles: typeof defaultRoles & {
      [key: string]: Role<{}>;
    };
    getSession: (context: _better_auth_core42.GenericEndpointContext) => Promise<{
      session: _better_auth_core_db66.Session & {
        activeTeamId?: string | undefined;
        activeOrganizationId?: string | undefined;
      };
      user: _better_auth_core_db66.User;
    }>;
  }>))[];
}, Omit<((O["teams"] extends {
  enabled: true;
} ? {
  id: string;
  organizationId: string;
  role: InferOrganizationRolesFromOption<O>;
  createdAt: Date;
  userId: string;
  teamId?: string | undefined;
  user: {
    id: string;
    email: string;
    name: string;
    image?: string | undefined;
  };
} : {
  id: string;
  organizationId: string;
  role: InferOrganizationRolesFromOption<O>;
  createdAt: Date;
  userId: string;
  user: {
    id: string;
    email: string;
    name: string;
    image?: string | undefined;
  };
}) & InferAdditionalFieldsFromPluginOptions<"member", O, false> extends infer T ? { [K in keyof T]: T[K] } : never) & {
  user: _better_auth_core_db66.User;
}, "user"> & {
  user: {
    id: string;
    name: string;
    email: string;
    image: string | undefined;
  };
}>;
declare const listMembers: <O extends OrganizationOptions>(options: O) => better_call775.StrictEndpoint<"/organization/list-members", {
  method: "GET";
  query: z.ZodOptional<z.ZodObject<{
    limit: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodNumber]>>;
    offset: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodNumber]>>;
    sortBy: z.ZodOptional<z.ZodString>;
    sortDirection: z.ZodOptional<z.ZodEnum<{
      asc: "asc";
      desc: "desc";
    }>>;
    filterField: z.ZodOptional<z.ZodString>;
    filterValue: z.ZodOptional<z.ZodUnion<[z.ZodUnion<[z.ZodString, z.ZodNumber]>, z.ZodBoolean]>>;
    filterOperator: z.ZodOptional<z.ZodEnum<{
      eq: "eq";
      ne: "ne";
      lt: "lt";
      lte: "lte";
      gt: "gt";
      gte: "gte";
      contains: "contains";
    }>>;
    organizationId: z.ZodOptional<z.ZodString>;
    organizationSlug: z.ZodOptional<z.ZodString>;
  }, z.core.$strip>>;
  requireHeaders: true;
  use: (((inputContext: better_call775.MiddlewareInputContext<better_call775.MiddlewareOptions>) => Promise<{
    orgOptions: OrganizationOptions;
    roles: typeof defaultRoles & {
      [key: string]: Role<{}>;
    };
    getSession: (context: _better_auth_core42.GenericEndpointContext) => Promise<{
      session: _better_auth_core_db66.Session & {
        activeTeamId?: string | undefined;
        activeOrganizationId?: string | undefined;
      };
      user: _better_auth_core_db66.User;
    }>;
  }>) | ((inputContext: better_call775.MiddlewareInputContext<{
    use: ((inputContext: better_call775.MiddlewareInputContext<better_call775.MiddlewareOptions>) => Promise<{
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
      session: _better_auth_core_db66.Session & {
        activeTeamId?: string | undefined;
        activeOrganizationId?: string | undefined;
      };
      user: _better_auth_core_db66.User;
    };
  }>))[];
}, {
  members: (((O["teams"] extends {
    enabled: true;
  } ? {
    id: string;
    organizationId: string;
    role: InferOrganizationRolesFromOption<O>;
    createdAt: Date;
    userId: string;
    teamId?: string | undefined;
    user: {
      id: string;
      email: string;
      name: string;
      image?: string | undefined;
    };
  } : {
    id: string;
    organizationId: string;
    role: InferOrganizationRolesFromOption<O>;
    createdAt: Date;
    userId: string;
    user: {
      id: string;
      email: string;
      name: string;
      image?: string | undefined;
    };
  }) & InferAdditionalFieldsFromPluginOptions<"member", O, false> extends infer T ? { [K in keyof T]: T[K] } : never) & {
    user: {
      id: string;
      name: string;
      email: string;
      image: string | null | undefined;
    };
  })[];
  total: number;
}>;
declare const getActiveMemberRole: <O extends OrganizationOptions>(options: O) => better_call775.StrictEndpoint<"/organization/get-active-member-role", {
  method: "GET";
  query: z.ZodOptional<z.ZodObject<{
    userId: z.ZodOptional<z.ZodString>;
    organizationId: z.ZodOptional<z.ZodString>;
    organizationSlug: z.ZodOptional<z.ZodString>;
  }, z.core.$strip>>;
  requireHeaders: true;
  use: (((inputContext: better_call775.MiddlewareInputContext<better_call775.MiddlewareOptions>) => Promise<{
    orgOptions: OrganizationOptions;
    roles: typeof defaultRoles & {
      [key: string]: Role<{}>;
    };
    getSession: (context: _better_auth_core42.GenericEndpointContext) => Promise<{
      session: _better_auth_core_db66.Session & {
        activeTeamId?: string | undefined;
        activeOrganizationId?: string | undefined;
      };
      user: _better_auth_core_db66.User;
    }>;
  }>) | ((inputContext: better_call775.MiddlewareInputContext<{
    use: ((inputContext: better_call775.MiddlewareInputContext<better_call775.MiddlewareOptions>) => Promise<{
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
      session: _better_auth_core_db66.Session & {
        activeTeamId?: string | undefined;
        activeOrganizationId?: string | undefined;
      };
      user: _better_auth_core_db66.User;
    };
  }>))[];
}, {
  role: (((O["teams"] extends {
    enabled: true;
  } ? {
    id: string;
    organizationId: string;
    role: InferOrganizationRolesFromOption<O>;
    createdAt: Date;
    userId: string;
    teamId?: string | undefined;
    user: {
      id: string;
      email: string;
      name: string;
      image?: string | undefined;
    };
  } : {
    id: string;
    organizationId: string;
    role: InferOrganizationRolesFromOption<O>;
    createdAt: Date;
    userId: string;
    user: {
      id: string;
      email: string;
      name: string;
      image?: string | undefined;
    };
  }) & InferAdditionalFieldsFromPluginOptions<"member", O, false> extends infer T ? { [K in keyof T]: T[K] } : never) & {
    user: _better_auth_core_db66.User;
  })["role"];
}>;
//#endregion
export { addMember, getActiveMember, getActiveMemberRole, leaveOrganization, listMembers, removeMember, updateMemberRole };
//# sourceMappingURL=crud-members.d.mts.map