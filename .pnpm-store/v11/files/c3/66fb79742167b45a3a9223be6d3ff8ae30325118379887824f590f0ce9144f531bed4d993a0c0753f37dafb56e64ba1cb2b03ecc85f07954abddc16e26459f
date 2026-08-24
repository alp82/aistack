import { AccessControl, Statements } from "../access/types.mjs";
import "../access/index.mjs";
import { OrganizationOptions } from "./types.mjs";
import { InferInvitation, InferMember, InferOrganization, InferTeam, OrganizationSchema, Team, TeamMember } from "./schema.mjs";
import "../index.mjs";
import { ORGANIZATION_ERROR_CODES } from "./error-codes.mjs";
import { createOrgRole, deleteOrgRole, getOrgRole, listOrgRoles, updateOrgRole } from "./routes/crud-access-control.mjs";
import { acceptInvitation, cancelInvitation, createInvitation, getInvitation, listInvitations, listUserInvitations, rejectInvitation } from "./routes/crud-invites.mjs";
import { addMember, getActiveMember, getActiveMemberRole, leaveOrganization, listMembers, removeMember, updateMemberRole } from "./routes/crud-members.mjs";
import { checkOrganizationSlug, createOrganization, deleteOrganization, getFullOrganization, listOrganizations, setActiveOrganization, updateOrganization } from "./routes/crud-org.mjs";
import { addTeamMember, createTeam, listOrganizationTeams, listTeamMembers, listUserTeams, removeTeam, removeTeamMember, setActiveTeam, updateTeam } from "./routes/crud-team.mjs";
import * as _better_auth_core_db23 from "@better-auth/core/db";
import * as z from "zod";
import * as better_call291 from "better-call";

//#region src/plugins/organization/organization.d.ts
declare function parseRoles(roles: string | string[]): string;
type DynamicAccessControlEndpoints<O extends OrganizationOptions> = {
  createOrgRole: ReturnType<typeof createOrgRole<O>>;
  deleteOrgRole: ReturnType<typeof deleteOrgRole<O>>;
  listOrgRoles: ReturnType<typeof listOrgRoles<O>>;
  getOrgRole: ReturnType<typeof getOrgRole<O>>;
  updateOrgRole: ReturnType<typeof updateOrgRole<O>>;
};
type TeamEndpoints<O extends OrganizationOptions> = {
  createTeam: ReturnType<typeof createTeam<O>>;
  listOrganizationTeams: ReturnType<typeof listOrganizationTeams<O>>;
  removeTeam: ReturnType<typeof removeTeam<O>>;
  updateTeam: ReturnType<typeof updateTeam<O>>;
  setActiveTeam: ReturnType<typeof setActiveTeam<O>>;
  listUserTeams: ReturnType<typeof listUserTeams<O>>;
  listTeamMembers: ReturnType<typeof listTeamMembers<O>>;
  addTeamMember: ReturnType<typeof addTeamMember<O>>;
  removeTeamMember: ReturnType<typeof removeTeamMember<O>>;
};
type OrganizationEndpoints<O extends OrganizationOptions> = {
  createOrganization: ReturnType<typeof createOrganization<O>>;
  updateOrganization: ReturnType<typeof updateOrganization<O>>;
  deleteOrganization: ReturnType<typeof deleteOrganization<O>>;
  setActiveOrganization: ReturnType<typeof setActiveOrganization<O>>;
  getFullOrganization: ReturnType<typeof getFullOrganization<O>>;
  listOrganizations: ReturnType<typeof listOrganizations<O>>;
  createInvitation: ReturnType<typeof createInvitation<O>>;
  cancelInvitation: ReturnType<typeof cancelInvitation<O>>;
  acceptInvitation: ReturnType<typeof acceptInvitation<O>>;
  getInvitation: ReturnType<typeof getInvitation<O>>;
  rejectInvitation: ReturnType<typeof rejectInvitation<O>>;
  listInvitations: ReturnType<typeof listInvitations<O>>;
  getActiveMember: ReturnType<typeof getActiveMember<O>>;
  checkOrganizationSlug: ReturnType<typeof checkOrganizationSlug<O>>;
  addMember: ReturnType<typeof addMember<O>>;
  removeMember: ReturnType<typeof removeMember<O>>;
  updateMemberRole: ReturnType<typeof updateMemberRole<O>>;
  leaveOrganization: ReturnType<typeof leaveOrganization<O>>;
  listUserInvitations: ReturnType<typeof listUserInvitations<O>>;
  listMembers: ReturnType<typeof listMembers<O>>;
  getActiveMemberRole: ReturnType<typeof getActiveMemberRole<O>>;
  hasPermission: ReturnType<typeof createHasPermission<O>>;
};
declare const createHasPermission: <O extends OrganizationOptions>(options: O) => better_call291.StrictEndpoint<"/organization/has-permission", {
  method: "POST";
  requireHeaders: true;
  body: z.ZodIntersection<z.ZodObject<{
    organizationId: z.ZodOptional<z.ZodString>;
  }, z.core.$strip>, z.ZodUnion<readonly [z.ZodObject<{
    permission: z.ZodRecord<z.ZodString, z.ZodArray<z.ZodString>>;
    permissions: z.ZodUndefined;
  }, z.core.$strip>, z.ZodObject<{
    permission: z.ZodUndefined;
    permissions: z.ZodRecord<z.ZodString, z.ZodArray<z.ZodString>>;
  }, z.core.$strip>]>>;
  use: ((inputContext: better_call291.MiddlewareInputContext<{
    use: ((inputContext: better_call291.MiddlewareInputContext<better_call291.MiddlewareOptions>) => Promise<{
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
      session: _better_auth_core_db23.Session & {
        activeTeamId?: string | undefined;
        activeOrganizationId?: string | undefined;
      };
      user: _better_auth_core_db23.User;
    };
  }>)[];
  metadata: {
    $Infer: {
      body: ({
        /**
         * @deprecated Use `permissions` instead
         */
        permission: { [key in keyof (O["ac"] extends AccessControl<infer S extends Statements> ? S : {
          readonly organization: readonly ["update", "delete"];
          readonly member: readonly ["create", "update", "delete"];
          readonly invitation: readonly ["create", "cancel"];
          readonly team: readonly ["create", "update", "delete"];
          readonly ac: readonly ["create", "read", "update", "delete"];
        })]?: ((O["ac"] extends AccessControl<infer S extends Statements> ? S : {
          readonly organization: readonly ["update", "delete"];
          readonly member: readonly ["create", "update", "delete"];
          readonly invitation: readonly ["create", "cancel"];
          readonly team: readonly ["create", "update", "delete"];
          readonly ac: readonly ["create", "read", "update", "delete"];
        })[key] extends readonly unknown[] ? (O["ac"] extends AccessControl<infer S extends Statements> ? S : {
          readonly organization: readonly ["update", "delete"];
          readonly member: readonly ["create", "update", "delete"];
          readonly invitation: readonly ["create", "cancel"];
          readonly team: readonly ["create", "update", "delete"];
          readonly ac: readonly ["create", "read", "update", "delete"];
        })[key][number] : never)[] | undefined };
        permissions?: never | undefined;
      } | {
        permissions: { [key in keyof (O["ac"] extends AccessControl<infer S extends Statements> ? S : {
          readonly organization: readonly ["update", "delete"];
          readonly member: readonly ["create", "update", "delete"];
          readonly invitation: readonly ["create", "cancel"];
          readonly team: readonly ["create", "update", "delete"];
          readonly ac: readonly ["create", "read", "update", "delete"];
        })]?: ((O["ac"] extends AccessControl<infer S extends Statements> ? S : {
          readonly organization: readonly ["update", "delete"];
          readonly member: readonly ["create", "update", "delete"];
          readonly invitation: readonly ["create", "cancel"];
          readonly team: readonly ["create", "update", "delete"];
          readonly ac: readonly ["create", "read", "update", "delete"];
        })[key] extends readonly unknown[] ? (O["ac"] extends AccessControl<infer S extends Statements> ? S : {
          readonly organization: readonly ["update", "delete"];
          readonly member: readonly ["create", "update", "delete"];
          readonly invitation: readonly ["create", "cancel"];
          readonly team: readonly ["create", "update", "delete"];
          readonly ac: readonly ["create", "read", "update", "delete"];
        })[key][number] : never)[] | undefined };
        permission?: never | undefined;
      }) & {
        organizationId?: string | undefined;
      };
    };
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
  };
}, {
  error: null;
  success: boolean;
}>;
type OrganizationPlugin<O extends OrganizationOptions> = {
  id: "organization";
  endpoints: OrganizationEndpoints<O> & (O extends {
    teams: {
      enabled: true;
    };
  } ? TeamEndpoints<O> : {}) & (O extends {
    dynamicAccessControl: {
      enabled: true;
    };
  } ? DynamicAccessControlEndpoints<O> : {});
  schema: OrganizationSchema<O>;
  $Infer: {
    Organization: InferOrganization<O>;
    Invitation: InferInvitation<O>;
    Member: InferMember<O>;
    Team: O["teams"] extends {
      enabled: true;
    } ? Team : any;
    TeamMember: O["teams"] extends {
      enabled: true;
    } ? TeamMember : any;
    ActiveOrganization: O["teams"] extends {
      enabled: true;
    } ? {
      members: InferMember<O, false>[];
      invitations: InferInvitation<O, false>[];
      teams: InferTeam<O, false>[];
    } & InferOrganization<O, false> : {
      members: InferMember<O, false>[];
      invitations: InferInvitation<O, false>[];
    } & InferOrganization<O, false>;
  };
  $ERROR_CODES: typeof ORGANIZATION_ERROR_CODES;
  options: NoInfer<O>;
};
/**
 * Organization plugin for Better Auth. Organization allows you to create teams, members,
 * and manage access control for your users.
 *
 * @example
 * ```ts
 * const auth = betterAuth({
 *  plugins: [
 *    organization({
 *      allowUserToCreateOrganization: true,
 *    }),
 *  ],
 * });
 * ```
 */
declare function organization<O extends OrganizationOptions & {
  teams: {
    enabled: true;
  };
}>(options?: O | undefined): {
  id: "organization";
  endpoints: OrganizationEndpoints<O> & TeamEndpoints<O>;
  schema: OrganizationSchema<O>;
  $Infer: {
    Organization: InferOrganization<O>;
    Invitation: InferInvitation<O>;
    Member: InferMember<O>;
    Team: O["teams"] extends {
      enabled: true;
    } ? Team : unknown;
    TeamMember: O["teams"] extends {
      enabled: true;
    } ? TeamMember : unknown;
    ActiveOrganization: O["teams"] extends {
      enabled: true;
    } ? {
      members: InferMember<O, false>[];
      invitations: InferInvitation<O, false>[];
      teams: InferTeam<O, false>[];
    } & InferOrganization<O, false> : {
      members: InferMember<O, false>[];
      invitations: InferInvitation<O, false>[];
    } & InferOrganization<O, false>;
  };
  $ERROR_CODES: typeof ORGANIZATION_ERROR_CODES;
  options: NoInfer<O>;
};
declare function organization<O extends OrganizationOptions & {
  teams: {
    enabled: true;
  };
  dynamicAccessControl: {
    enabled: true;
  };
}>(options?: O | undefined): {
  id: "organization";
  endpoints: OrganizationEndpoints<O> & TeamEndpoints<O> & DynamicAccessControlEndpoints<O>;
  schema: OrganizationSchema<O>;
  $Infer: {
    Organization: InferOrganization<O>;
    Invitation: InferInvitation<O>;
    Member: InferMember<O>;
    Team: O["teams"] extends {
      enabled: true;
    } ? Team : any;
    TeamMember: O["teams"] extends {
      enabled: true;
    } ? TeamMember : any;
    ActiveOrganization: O["teams"] extends {
      enabled: true;
    } ? {
      members: InferMember<O, false>[];
      invitations: InferInvitation<O, false>[];
      teams: InferTeam<O, false>[];
    } & InferOrganization<O, false> : {
      members: InferMember<O, false>[];
      invitations: InferInvitation<O, false>[];
    } & InferOrganization<O, false>;
  };
  $ERROR_CODES: typeof ORGANIZATION_ERROR_CODES;
  options: NoInfer<O>;
};
declare function organization<O extends OrganizationOptions & {
  dynamicAccessControl: {
    enabled: true;
  };
}>(options?: O | undefined): {
  id: "organization";
  endpoints: OrganizationEndpoints<O> & DynamicAccessControlEndpoints<O>;
  schema: OrganizationSchema<O>;
  $Infer: {
    Organization: InferOrganization<O>;
    Invitation: InferInvitation<O>;
    Member: InferMember<O>;
    Team: O["teams"] extends {
      enabled: true;
    } ? Team : any;
    TeamMember: O["teams"] extends {
      enabled: true;
    } ? TeamMember : any;
    ActiveOrganization: O["teams"] extends {
      enabled: true;
    } ? {
      members: InferMember<O, false>[];
      invitations: InferInvitation<O, false>[];
      teams: InferTeam<O, false>[];
    } & InferOrganization<O, false> : {
      members: InferMember<O, false>[];
      invitations: InferInvitation<O, false>[];
    } & InferOrganization<O, false>;
  };
  $ERROR_CODES: typeof ORGANIZATION_ERROR_CODES;
  options: NoInfer<O>;
};
declare function organization<O extends OrganizationOptions>(options?: O | undefined): {
  id: "organization";
  endpoints: OrganizationEndpoints<O>;
  schema: OrganizationSchema<O>;
  $Infer: {
    Organization: InferOrganization<O>;
    Invitation: InferInvitation<O>;
    Member: InferMember<O>;
    Team: O["teams"] extends {
      enabled: true;
    } ? Team : any;
    TeamMember: O["teams"] extends {
      enabled: true;
    } ? TeamMember : any;
    ActiveOrganization: O["teams"] extends {
      enabled: true;
    } ? {
      members: InferMember<O, false>[];
      invitations: InferInvitation<O, false>[];
      teams: InferTeam<O, false>[];
    } & InferOrganization<O, false> : {
      members: InferMember<O, false>[];
      invitations: InferInvitation<O, false>[];
    } & InferOrganization<O, false>;
  };
  $ERROR_CODES: typeof ORGANIZATION_ERROR_CODES;
  options: NoInfer<O>;
};
//#endregion
export { DynamicAccessControlEndpoints, OrganizationEndpoints, OrganizationPlugin, TeamEndpoints, organization, parseRoles };
//# sourceMappingURL=organization.d.mts.map