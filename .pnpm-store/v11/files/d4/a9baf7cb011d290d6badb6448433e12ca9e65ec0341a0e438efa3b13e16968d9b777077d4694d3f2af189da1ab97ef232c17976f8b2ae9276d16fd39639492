import { DeepPartial, Expand, HasRequiredKeys, LiteralNumber, LiteralUnion, OmitId, PreserveJSDoc, Prettify, PrettifyDeep, RequiredKeysOf, StripEmptyObjects, UnionToIntersection, WithoutEmpty } from "../types/helper.mjs";
import { AtomListener, BetterAuthClientOptions, BetterAuthClientPlugin, ClientAtomListener, ClientOptions, ClientStore, InferActions, InferAdditionalFromClient, InferClientAPI, InferErrorCodes, InferPluginsFromClient, InferSessionFromClient, InferUserFromClient, IsSignal, SessionQueryParams, Store } from "./types.mjs";
import { BroadcastChannel, BroadcastListener, BroadcastMessage, getGlobalBroadcastChannel, kBroadcastChannel } from "./broadcast-channel.mjs";
import { FocusListener, FocusManager, kFocusManager } from "./focus-manager.mjs";
import { OnlineListener, OnlineManager, kOnlineManager } from "./online-manager.mjs";
import { AuthQueryAtom, useAuthQuery } from "./query.mjs";
import { SessionRefreshOptions, createSessionRefreshManager } from "./session-refresh.mjs";
import { AuthClient, createAuthClient } from "./vanilla.mjs";
import { AccessControl, Role, Statements, SubArray, Subset } from "../plugins/access/types.mjs";
import { AuthorizeResponse, createAccessControl, role } from "../plugins/access/access.mjs";
import "../plugins/access/index.mjs";
import { OrganizationOptions } from "../plugins/organization/types.mjs";
import { InferInvitation, InferMember, InferOrganization, InferOrganizationRolesFromOption, InferOrganizationZodRolesFromOption, InferTeam, Invitation, InvitationInput, InvitationStatus, Member, MemberInput, Organization, OrganizationInput, OrganizationRole, OrganizationSchema, Team, TeamInput, TeamMember, TeamMemberInput, defaultRolesSchema, invitationSchema, invitationStatus, memberSchema, organizationRoleSchema, organizationSchema, roleSchema, teamMemberSchema, teamSchema } from "../plugins/organization/schema.mjs";
import { getOrgAdapter } from "../plugins/organization/adapter.mjs";
import { DynamicAccessControlEndpoints, OrganizationEndpoints, OrganizationPlugin, TeamEndpoints, organization, parseRoles } from "../plugins/organization/organization.mjs";
import "../plugins/organization/index.mjs";
import { BetterAuthOptions, BetterAuthPlugin } from "@better-auth/core";
import { DBPrimitive } from "@better-auth/core/db";
export * from "@better-auth/core/db";
export * from "nanostores";
export * from "@better-fetch/fetch";

//#region src/client/index.d.ts
declare const InferPlugin: <T extends BetterAuthPlugin>() => {
  id: "infer-server-plugin";
  $InferServerPlugin: T;
};
declare function InferAuth<O extends {
  options: BetterAuthOptions;
}>(): O["options"];
//#endregion
export { AccessControl, AtomListener, AuthClient, AuthQueryAtom, AuthorizeResponse, BetterAuthClientOptions, BetterAuthClientPlugin, BroadcastChannel, BroadcastListener, BroadcastMessage, ClientAtomListener, ClientOptions, ClientStore, type DBPrimitive, DeepPartial, DynamicAccessControlEndpoints, Expand, type FocusListener, type FocusManager, HasRequiredKeys, InferActions, InferAdditionalFromClient, InferAuth, InferClientAPI, InferErrorCodes, InferInvitation, InferMember, InferOrganization, InferOrganizationRolesFromOption, InferOrganizationZodRolesFromOption, InferPlugin, InferPluginsFromClient, InferSessionFromClient, InferTeam, InferUserFromClient, Invitation, InvitationInput, InvitationStatus, IsSignal, LiteralNumber, LiteralUnion, Member, MemberInput, OmitId, type OnlineListener, type OnlineManager, Organization, OrganizationEndpoints, OrganizationInput, OrganizationOptions, OrganizationPlugin, OrganizationRole, OrganizationSchema, PreserveJSDoc, Prettify, PrettifyDeep, RequiredKeysOf, Role, SessionQueryParams, SessionRefreshOptions, Statements, Store, StripEmptyObjects, SubArray, Subset, Team, TeamEndpoints, TeamInput, TeamMember, TeamMemberInput, type UnionToIntersection, WithoutEmpty, createAccessControl, createAuthClient, createSessionRefreshManager, defaultRolesSchema, getGlobalBroadcastChannel, getOrgAdapter, invitationSchema, invitationStatus, kBroadcastChannel, kFocusManager, kOnlineManager, memberSchema, organization, organizationRoleSchema, organizationSchema, parseRoles, role, roleSchema, teamMemberSchema, teamSchema, useAuthQuery };
//# sourceMappingURL=index.d.mts.map