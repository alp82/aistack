import { InferAdditionalFieldsFromPluginOptions } from "../../db/field.mjs";
import "../../db/index.mjs";
import { Prettify } from "../../types/helper.mjs";
import { BetterAuthOptions as BetterAuthOptions$1 } from "../../types/index.mjs";
import { AuthQueryAtom } from "../../client/query.mjs";
import { AccessControl, Role, Statements } from "../access/types.mjs";
import "../access/index.mjs";
import { OrganizationOptions } from "./types.mjs";
import { InferInvitation, InferMember, InferOrganization, InferOrganizationRolesFromOption, InferOrganizationZodRolesFromOption, InferTeam, Invitation, InvitationInput, InvitationStatus, Member, MemberInput, Organization, OrganizationInput, OrganizationRole, OrganizationSchema, Team, TeamInput, TeamMember, TeamMemberInput, defaultRolesSchema, invitationSchema, invitationStatus, memberSchema, organizationRoleSchema, organizationSchema, roleSchema, teamMemberSchema, teamSchema } from "./schema.mjs";
import "../index.mjs";
import { OrganizationPlugin } from "./organization.mjs";
import "./index.mjs";
import "../../client/index.mjs";
import { HasPermissionBaseInput } from "./permission.mjs";
import * as _better_auth_core29 from "@better-auth/core";
import { DBFieldAttribute } from "@better-auth/core/db";
import * as nanostores4 from "nanostores";
import * as _better_fetch_fetch100 from "@better-fetch/fetch";

//#region src/plugins/organization/client.d.ts
/**
 * Using the same `hasPermissionFn` function, but without the need for a `ctx` parameter or the `organizationId` parameter.
 */
declare const clientSideHasPermission: (input: HasPermissionBaseInput) => boolean;
interface OrganizationClientOptions {
  ac?: AccessControl | undefined;
  roles?: { [key in string]: Role } | undefined;
  teams?: {
    enabled: boolean;
  } | undefined;
  schema?: {
    organization?: {
      additionalFields?: {
        [key: string]: DBFieldAttribute;
      };
    };
    member?: {
      additionalFields?: {
        [key: string]: DBFieldAttribute;
      };
    };
    invitation?: {
      additionalFields?: {
        [key: string]: DBFieldAttribute;
      };
    };
    team?: {
      additionalFields?: {
        [key: string]: DBFieldAttribute;
      };
    };
    organizationRole?: {
      additionalFields?: {
        [key: string]: DBFieldAttribute;
      };
    };
  } | undefined;
  dynamicAccessControl?: {
    enabled: boolean;
  } | undefined;
}
declare const organizationClient: <CO extends OrganizationClientOptions>(options?: CO | undefined) => {
  id: "organization";
  $InferServerPlugin: OrganizationPlugin<{
    ac: CO["ac"] extends AccessControl ? CO["ac"] : AccessControl<{
      readonly organization: readonly ["update", "delete"];
      readonly member: readonly ["create", "update", "delete"];
      readonly invitation: readonly ["create", "cancel"];
      readonly team: readonly ["create", "update", "delete"];
      readonly ac: readonly ["create", "read", "update", "delete"];
    }>;
    roles: CO["roles"] extends Record<string, Role> ? CO["roles"] : {
      admin: Role;
      member: Role;
      owner: Role;
    };
    teams: {
      enabled: CO["teams"] extends {
        enabled: true;
      } ? true : false;
    };
    schema: CO["schema"];
    dynamicAccessControl: {
      enabled: CO["dynamicAccessControl"] extends {
        enabled: true;
      } ? true : false;
    };
  }>;
  getActions: ($fetch: _better_fetch_fetch100.BetterFetch, _$store: _better_auth_core29.ClientStore, co: _better_auth_core29.BetterAuthClientOptions | undefined) => {
    $Infer: {
      ActiveOrganization: CO["teams"] extends {
        enabled: true;
      } ? {
        members: InferMember<CO, false>[];
        invitations: InferInvitation<CO>[];
        teams: InferTeam<CO, false>[];
      } & ({
        id: string;
        name: string;
        slug: string;
        createdAt: Date;
        logo?: string | null | undefined;
        metadata?: any;
      } & InferAdditionalFieldsFromPluginOptions<"organization", CO, false> extends infer T ? { [K in keyof T]: T[K] } : never) : {
        members: InferMember<CO, false>[];
        invitations: InferInvitation<CO, false>[];
      } & ({
        id: string;
        name: string;
        slug: string;
        createdAt: Date;
        logo?: string | null | undefined;
        metadata?: any;
      } & InferAdditionalFieldsFromPluginOptions<"organization", CO, false> extends infer T_1 ? { [K in keyof T_1]: T_1[K] } : never);
      Organization: InferOrganization<CO, false>;
      Invitation: InferInvitation<CO, false>;
      Member: InferMember<CO, false>;
      Team: InferTeam<CO, false>;
    };
    organization: {
      checkRolePermission: <R extends (CO extends {
        roles: any;
      } ? keyof CO["roles"] : "admin" | "member" | "owner")>(data: ({
        /**
         * @deprecated Use `permissions` instead
         */
        permission: { [key in keyof (CO["ac"] extends AccessControl<infer S extends Statements> ? S : {
          readonly organization: readonly ["update", "delete"];
          readonly member: readonly ["create", "update", "delete"];
          readonly invitation: readonly ["create", "cancel"];
          readonly team: readonly ["create", "update", "delete"];
          readonly ac: readonly ["create", "read", "update", "delete"];
        })]?: ((CO["ac"] extends AccessControl<infer S extends Statements> ? S : {
          readonly organization: readonly ["update", "delete"];
          readonly member: readonly ["create", "update", "delete"];
          readonly invitation: readonly ["create", "cancel"];
          readonly team: readonly ["create", "update", "delete"];
          readonly ac: readonly ["create", "read", "update", "delete"];
        })[key] extends readonly unknown[] ? (CO["ac"] extends AccessControl<infer S extends Statements> ? S : {
          readonly organization: readonly ["update", "delete"];
          readonly member: readonly ["create", "update", "delete"];
          readonly invitation: readonly ["create", "cancel"];
          readonly team: readonly ["create", "update", "delete"];
          readonly ac: readonly ["create", "read", "update", "delete"];
        })[key][number] : never)[] | undefined };
        permissions?: never | undefined;
      } | {
        permissions: { [key in keyof (CO["ac"] extends AccessControl<infer S extends Statements> ? S : {
          readonly organization: readonly ["update", "delete"];
          readonly member: readonly ["create", "update", "delete"];
          readonly invitation: readonly ["create", "cancel"];
          readonly team: readonly ["create", "update", "delete"];
          readonly ac: readonly ["create", "read", "update", "delete"];
        })]?: ((CO["ac"] extends AccessControl<infer S extends Statements> ? S : {
          readonly organization: readonly ["update", "delete"];
          readonly member: readonly ["create", "update", "delete"];
          readonly invitation: readonly ["create", "cancel"];
          readonly team: readonly ["create", "update", "delete"];
          readonly ac: readonly ["create", "read", "update", "delete"];
        })[key] extends readonly unknown[] ? (CO["ac"] extends AccessControl<infer S extends Statements> ? S : {
          readonly organization: readonly ["update", "delete"];
          readonly member: readonly ["create", "update", "delete"];
          readonly invitation: readonly ["create", "cancel"];
          readonly team: readonly ["create", "update", "delete"];
          readonly ac: readonly ["create", "read", "update", "delete"];
        })[key][number] : never)[] | undefined };
        permission?: never | undefined;
      }) & {
        role: R;
      }) => boolean;
    };
  };
  getAtoms: ($fetch: _better_fetch_fetch100.BetterFetch) => {
    $listOrg: nanostores4.PreinitializedWritableAtom<boolean> & object;
    $activeOrgSignal: nanostores4.PreinitializedWritableAtom<boolean> & object;
    $activeMemberSignal: nanostores4.PreinitializedWritableAtom<boolean> & object;
    $activeMemberRoleSignal: nanostores4.PreinitializedWritableAtom<boolean> & object;
    activeOrganization: AuthQueryAtom<Prettify<({
      id: string;
      name: string;
      slug: string;
      createdAt: Date;
      logo?: string | null | undefined;
      metadata?: any;
    } & InferAdditionalFieldsFromPluginOptions<"organization", CO, false> extends infer T ? { [K in keyof T]: T[K] } : never) & {
      members: InferMember<CO, false>[];
      invitations: InferInvitation<CO, false>[];
    }>>;
    listOrganizations: AuthQueryAtom<({
      id: string;
      name: string;
      slug: string;
      createdAt: Date;
      logo?: string | null | undefined;
      metadata?: any;
    } & InferAdditionalFieldsFromPluginOptions<"organization", CO, false> extends infer T_1 ? { [K in keyof T_1]: T_1[K] } : never)[]>;
    activeMember: AuthQueryAtom<{
      id: string;
      organizationId: string;
      userId: string;
      role: string;
      createdAt: Date;
    }>;
    activeMemberRole: AuthQueryAtom<{
      role: string;
    }>;
  };
  pathMethods: {
    "/organization/get-full-organization": "GET";
    "/organization/list-user-teams": "GET";
  };
  atomListeners: ({
    matcher(path: string): path is "/organization/create" | "/organization/update" | "/organization/delete";
    signal: "$listOrg";
  } | {
    matcher(path: string): boolean;
    signal: "$activeOrgSignal";
  } | {
    matcher(path: string): boolean;
    signal: "$sessionSignal";
  } | {
    matcher(path: string): boolean;
    signal: "$activeMemberSignal";
  } | {
    matcher(path: string): boolean;
    signal: "$activeMemberRoleSignal";
  })[];
};
declare const inferOrgAdditionalFields: <O extends {
  options: BetterAuthOptions$1;
}, S extends OrganizationOptions["schema"] = undefined>(schema?: S | undefined) => undefined extends S ? O extends Object ? O extends {
  session?: {
    fields?: {
      activeOrganizationId?: string;
      activeTeamId?: string;
    };
  };
  organization?: {
    modelName?: string;
    fields?: { [key in keyof Omit<Organization, "id">]?: string };
    additionalFields?: { [key in string]: DBFieldAttribute };
  };
  member?: {
    modelName?: string;
    fields?: { [key in keyof Omit<Member, "id">]?: string };
    additionalFields?: { [key in string]: DBFieldAttribute };
  };
  invitation?: {
    modelName?: string;
    fields?: { [key in keyof Omit<Invitation, "id">]?: string };
    additionalFields?: { [key in string]: DBFieldAttribute };
  };
  team?: {
    modelName?: string;
    fields?: { [key in keyof Omit<Team, "id">]?: string };
    additionalFields?: { [key in string]: DBFieldAttribute };
  };
  teamMember?: {
    modelName?: string;
    fields?: { [key in keyof Omit<TeamMember, "id">]?: string };
  };
  organizationRole?: {
    modelName?: string;
    fields?: { [key in keyof Omit<OrganizationRole, "id">]?: string };
    additionalFields?: { [key in string]: DBFieldAttribute };
  };
} ? O : ((O extends {
  options: any;
} ? O : {
  options: {
    plugins: [];
  };
})["options"]["plugins"][number] extends infer T ? T extends (O extends {
  options: any;
} ? O : {
  options: {
    plugins: [];
  };
})["options"]["plugins"][number] ? T extends {
  id: "organization";
} ? T : never : never : never) extends {
  options: {
    schema: infer S_1;
  };
} ? S_1 extends {
  session?: {
    fields?: {
      activeOrganizationId?: string;
      activeTeamId?: string;
    };
  };
  organization?: {
    modelName?: string;
    fields?: { [key in keyof Omit<Organization, "id">]?: string };
    additionalFields?: { [key in string]: DBFieldAttribute };
  };
  member?: {
    modelName?: string;
    fields?: { [key in keyof Omit<Member, "id">]?: string };
    additionalFields?: { [key in string]: DBFieldAttribute };
  };
  invitation?: {
    modelName?: string;
    fields?: { [key in keyof Omit<Invitation, "id">]?: string };
    additionalFields?: { [key in string]: DBFieldAttribute };
  };
  team?: {
    modelName?: string;
    fields?: { [key in keyof Omit<Team, "id">]?: string };
    additionalFields?: { [key in string]: DBFieldAttribute };
  };
  teamMember?: {
    modelName?: string;
    fields?: { [key in keyof Omit<TeamMember, "id">]?: string };
  };
  organizationRole?: {
    modelName?: string;
    fields?: { [key in keyof Omit<OrganizationRole, "id">]?: string };
    additionalFields?: { [key in string]: DBFieldAttribute };
  };
} | undefined ? { [K in keyof S_1]: S_1[K] extends {
  additionalFields: infer _AF;
} ? S_1[K] : undefined } : undefined : undefined : undefined : S;
//#endregion
export { clientSideHasPermission, inferOrgAdditionalFields, organizationClient };
//# sourceMappingURL=client.d.mts.map