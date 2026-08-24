import { InferAdditionalFieldsFromPluginOptions } from "../../../db/field.mjs";
import "../../../db/index.mjs";
import { Role } from "../../access/types.mjs";
import { OrganizationOptions } from "../types.mjs";
import { InferInvitation, InferMember, InferTeam } from "../schema.mjs";
import "../../index.mjs";
import { defaultRoles } from "../access/statement.mjs";
import "../access/index.mjs";
import * as _better_auth_core56 from "@better-auth/core";
import * as _better_auth_core_db122 from "@better-auth/core/db";
import * as z from "zod";
import * as better_call869 from "better-call";

//#region src/plugins/organization/routes/crud-org.d.ts
declare const createOrganization: <O extends OrganizationOptions>(options?: O | undefined) => better_call869.StrictEndpoint<"/organization/create", {
  method: "POST";
  body: z.ZodObject<{
    name: z.ZodString;
    slug: z.ZodString;
    userId: z.ZodOptional<z.ZodCoercedString<unknown>>;
    logo: z.ZodOptional<z.ZodString>;
    metadata: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
    keepCurrentActiveOrganization: z.ZodOptional<z.ZodBoolean>;
  }, z.core.$strip>;
  use: ((inputContext: better_call869.MiddlewareInputContext<better_call869.MiddlewareOptions>) => Promise<{
    orgOptions: OrganizationOptions;
    roles: typeof defaultRoles & {
      [key: string]: Role<{}>;
    };
    getSession: (context: _better_auth_core56.GenericEndpointContext) => Promise<{
      session: _better_auth_core_db122.Session & {
        activeTeamId?: string | undefined;
        activeOrganizationId?: string | undefined;
      };
      user: _better_auth_core_db122.User;
    }>;
  }>)[];
  metadata: {
    $Infer: {
      body: InferAdditionalFieldsFromPluginOptions<"organization", O> & {
        name: string;
        slug: string;
        userId?: string | undefined;
        logo?: string | undefined;
        metadata?: Record<string, any> | undefined;
        keepCurrentActiveOrganization?: boolean | undefined;
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
                description: string;
                $ref: string;
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
  slug: string;
  createdAt: Date;
  logo?: string | null | undefined;
  metadata?: any;
} & InferAdditionalFieldsFromPluginOptions<"organization", O, false> extends infer T ? { [K in keyof T]: T[K] } : never) & {
  metadata: any;
  members: (({
    id: string;
    organizationId: string;
    userId: string;
    role: string;
    createdAt: Date;
  } & InferAdditionalFieldsFromPluginOptions<"member", O, false>) | undefined)[];
}) | null>;
declare const checkOrganizationSlug: <O extends OrganizationOptions>(options: O) => better_call869.StrictEndpoint<"/organization/check-slug", {
  method: "POST";
  body: z.ZodObject<{
    slug: z.ZodString;
  }, z.core.$strip>;
  use: (((inputContext: better_call869.MiddlewareInputContext<better_call869.MiddlewareOptions>) => Promise<{
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
    } | null;
  }>) | ((inputContext: better_call869.MiddlewareInputContext<better_call869.MiddlewareOptions>) => Promise<{
    orgOptions: OrganizationOptions;
    roles: typeof defaultRoles & {
      [key: string]: Role<{}>;
    };
    getSession: (context: _better_auth_core56.GenericEndpointContext) => Promise<{
      session: _better_auth_core_db122.Session & {
        activeTeamId?: string | undefined;
        activeOrganizationId?: string | undefined;
      };
      user: _better_auth_core_db122.User;
    }>;
  }>))[];
}, {
  status: boolean;
}>;
declare const updateOrganization: <O extends OrganizationOptions>(options?: O | undefined) => better_call869.StrictEndpoint<"/organization/update", {
  method: "POST";
  body: z.ZodObject<{
    data: z.ZodObject<{
      name: z.ZodOptional<z.ZodOptional<z.ZodString>>;
      slug: z.ZodOptional<z.ZodOptional<z.ZodString>>;
      logo: z.ZodOptional<z.ZodOptional<z.ZodString>>;
      metadata: z.ZodOptional<z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>>;
    }, z.core.$strip>;
    organizationId: z.ZodOptional<z.ZodString>;
  }, z.core.$strip>;
  requireHeaders: true;
  use: ((inputContext: better_call869.MiddlewareInputContext<better_call869.MiddlewareOptions>) => Promise<{
    orgOptions: OrganizationOptions;
    roles: typeof defaultRoles & {
      [key: string]: Role<{}>;
    };
    getSession: (context: _better_auth_core56.GenericEndpointContext) => Promise<{
      session: _better_auth_core_db122.Session & {
        activeTeamId?: string | undefined;
        activeOrganizationId?: string | undefined;
      };
      user: _better_auth_core_db122.User;
    }>;
  }>)[];
  metadata: {
    $Infer: {
      body: {
        data: {
          name?: string | undefined;
          slug?: string | undefined;
          logo?: string | undefined;
          metadata?: Record<string, any> | undefined;
        } & Partial<InferAdditionalFieldsFromPluginOptions<"organization", O>>;
        organizationId?: string | undefined;
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
                description: string;
                $ref: string;
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
  slug: string;
  createdAt: Date;
  logo?: string | null | undefined;
  metadata?: any;
} & InferAdditionalFieldsFromPluginOptions<"organization", O, false> extends infer T ? { [K in keyof T]: T[K] } : never) & {
  metadata: Record<string, any> | undefined;
}) | null>;
declare const deleteOrganization: <O extends OrganizationOptions>(options: O) => better_call869.StrictEndpoint<"/organization/delete", {
  method: "POST";
  body: z.ZodObject<{
    organizationId: z.ZodString;
  }, z.core.$strip>;
  requireHeaders: true;
  use: ((inputContext: better_call869.MiddlewareInputContext<better_call869.MiddlewareOptions>) => Promise<{
    orgOptions: OrganizationOptions;
    roles: typeof defaultRoles & {
      [key: string]: Role<{}>;
    };
    getSession: (context: _better_auth_core56.GenericEndpointContext) => Promise<{
      session: _better_auth_core_db122.Session & {
        activeTeamId?: string | undefined;
        activeOrganizationId?: string | undefined;
      };
      user: _better_auth_core_db122.User;
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
                type: "string";
                description: string;
              };
            };
          };
        };
      };
    };
  };
}, ({
  id: string;
  name: string;
  slug: string;
  createdAt: Date;
  logo?: string | null | undefined;
  metadata?: any;
} & InferAdditionalFieldsFromPluginOptions<"organization", O, false> extends infer T ? { [K in keyof T]: T[K] } : never) | null>;
declare const getFullOrganization: <O extends OrganizationOptions>(options: O) => better_call869.StrictEndpoint<"/organization/get-full-organization", {
  method: "GET";
  query: z.ZodOptional<z.ZodObject<{
    organizationId: z.ZodOptional<z.ZodString>;
    organizationSlug: z.ZodOptional<z.ZodString>;
    membersLimit: z.ZodOptional<z.ZodUnion<[z.ZodNumber, z.ZodPipe<z.ZodString, z.ZodTransform<number, string>>]>>;
  }, z.core.$strip>>;
  requireHeaders: true;
  use: (((inputContext: better_call869.MiddlewareInputContext<better_call869.MiddlewareOptions>) => Promise<{
    orgOptions: OrganizationOptions;
    roles: typeof defaultRoles & {
      [key: string]: Role<{}>;
    };
    getSession: (context: _better_auth_core56.GenericEndpointContext) => Promise<{
      session: _better_auth_core_db122.Session & {
        activeTeamId?: string | undefined;
        activeOrganizationId?: string | undefined;
      };
      user: _better_auth_core_db122.User;
    }>;
  }>) | ((inputContext: better_call869.MiddlewareInputContext<{
    use: ((inputContext: better_call869.MiddlewareInputContext<better_call869.MiddlewareOptions>) => Promise<{
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
      session: _better_auth_core_db122.Session & {
        activeTeamId?: string | undefined;
        activeOrganizationId?: string | undefined;
      };
      user: _better_auth_core_db122.User;
    };
  }>))[];
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
                description: string;
                $ref: string;
              };
            };
          };
        };
      };
    };
  };
}, (O["teams"] extends {
  enabled: true;
} ? {
  members: InferMember<O, false>[];
  invitations: InferInvitation<O, false>[];
  teams: InferTeam<O, false>[];
} & ({
  id: string;
  name: string;
  slug: string;
  createdAt: Date;
  logo?: string | null | undefined;
  metadata?: any;
} & InferAdditionalFieldsFromPluginOptions<"organization", O, false> extends infer T ? { [K in keyof T]: T[K] } : never) : {
  members: InferMember<O, false>[];
  invitations: InferInvitation<O, false>[];
} & ({
  id: string;
  name: string;
  slug: string;
  createdAt: Date;
  logo?: string | null | undefined;
  metadata?: any;
} & InferAdditionalFieldsFromPluginOptions<"organization", O, false> extends infer T_1 ? { [K in keyof T_1]: T_1[K] } : never)) | null>;
declare const setActiveOrganization: <O extends OrganizationOptions>(options: O) => better_call869.StrictEndpoint<"/organization/set-active", {
  method: "POST";
  body: z.ZodObject<{
    organizationId: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    organizationSlug: z.ZodOptional<z.ZodString>;
  }, z.core.$strip>;
  use: (((inputContext: better_call869.MiddlewareInputContext<better_call869.MiddlewareOptions>) => Promise<{
    orgOptions: OrganizationOptions;
    roles: typeof defaultRoles & {
      [key: string]: Role<{}>;
    };
    getSession: (context: _better_auth_core56.GenericEndpointContext) => Promise<{
      session: _better_auth_core_db122.Session & {
        activeTeamId?: string | undefined;
        activeOrganizationId?: string | undefined;
      };
      user: _better_auth_core_db122.User;
    }>;
  }>) | ((inputContext: better_call869.MiddlewareInputContext<{
    use: ((inputContext: better_call869.MiddlewareInputContext<better_call869.MiddlewareOptions>) => Promise<{
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
      session: _better_auth_core_db122.Session & {
        activeTeamId?: string | undefined;
        activeOrganizationId?: string | undefined;
      };
      user: _better_auth_core_db122.User;
    };
  }>))[];
  requireHeaders: true;
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
                description: string;
                $ref: string;
              };
            };
          };
        };
      };
    };
  };
}, (O["teams"] extends {
  enabled: true;
} ? {
  members: InferMember<O, false>[];
  invitations: InferInvitation<O, false>[];
  teams: InferTeam<O, false>[];
} & ({
  id: string;
  name: string;
  slug: string;
  createdAt: Date;
  logo?: string | null | undefined;
  metadata?: any;
} & InferAdditionalFieldsFromPluginOptions<"organization", O, false> extends infer T ? { [K in keyof T]: T[K] } : never) : {
  members: InferMember<O, false>[];
  invitations: InferInvitation<O, false>[];
} & ({
  id: string;
  name: string;
  slug: string;
  createdAt: Date;
  logo?: string | null | undefined;
  metadata?: any;
} & InferAdditionalFieldsFromPluginOptions<"organization", O, false> extends infer T_1 ? { [K in keyof T_1]: T_1[K] } : never)) | null>;
declare const listOrganizations: <O extends OrganizationOptions>(options: O) => better_call869.StrictEndpoint<"/organization/list", {
  method: "GET";
  use: (((inputContext: better_call869.MiddlewareInputContext<better_call869.MiddlewareOptions>) => Promise<{
    orgOptions: OrganizationOptions;
    roles: typeof defaultRoles & {
      [key: string]: Role<{}>;
    };
    getSession: (context: _better_auth_core56.GenericEndpointContext) => Promise<{
      session: _better_auth_core_db122.Session & {
        activeTeamId?: string | undefined;
        activeOrganizationId?: string | undefined;
      };
      user: _better_auth_core_db122.User;
    }>;
  }>) | ((inputContext: better_call869.MiddlewareInputContext<{
    use: ((inputContext: better_call869.MiddlewareInputContext<better_call869.MiddlewareOptions>) => Promise<{
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
      session: _better_auth_core_db122.Session & {
        activeTeamId?: string | undefined;
        activeOrganizationId?: string | undefined;
      };
      user: _better_auth_core_db122.User;
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
                type: "array";
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
}, ({
  id: string;
  name: string;
  slug: string;
  createdAt: Date;
  logo?: string | null | undefined;
  metadata?: any;
} & InferAdditionalFieldsFromPluginOptions<"organization", O, false> extends infer T ? { [K in keyof T]: T[K] } : never)[]>;
//#endregion
export { checkOrganizationSlug, createOrganization, deleteOrganization, getFullOrganization, listOrganizations, setActiveOrganization, updateOrganization };
//# sourceMappingURL=crud-org.d.mts.map