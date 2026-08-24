import { useAuthQuery } from "../../client/query.mjs";
import "../../client/index.mjs";
import { adminAc, defaultRoles, memberAc, ownerAc } from "./access/statement.mjs";
import "./access/index.mjs";
import { hasPermissionFn } from "./permission.mjs";
import { atom } from "nanostores";

//#region src/plugins/organization/client.ts
/**
* Using the same `hasPermissionFn` function, but without the need for a `ctx` parameter or the `organizationId` parameter.
*/
const clientSideHasPermission = (input) => {
	return hasPermissionFn(input, input.options.roles || defaultRoles);
};
const organizationClient = (options) => {
	const $listOrg = atom(false);
	const $activeOrgSignal = atom(false);
	const $activeMemberSignal = atom(false);
	const $activeMemberRoleSignal = atom(false);
	const roles = {
		admin: adminAc,
		member: memberAc,
		owner: ownerAc,
		...options?.roles
	};
	return {
		id: "organization",
		$InferServerPlugin: {},
		getActions: ($fetch, _$store, co) => ({
			$Infer: {
				ActiveOrganization: {},
				Organization: {},
				Invitation: {},
				Member: {},
				Team: {}
			},
			organization: { checkRolePermission: (data) => {
				return clientSideHasPermission({
					role: data.role,
					options: {
						ac: options?.ac,
						roles
					},
					permissions: data.permissions ?? data.permission
				});
			} }
		}),
		getAtoms: ($fetch) => {
			const listOrganizations = useAuthQuery($listOrg, "/organization/list", $fetch, { method: "GET" });
			return {
				$listOrg,
				$activeOrgSignal,
				$activeMemberSignal,
				$activeMemberRoleSignal,
				activeOrganization: useAuthQuery([$activeOrgSignal], "/organization/get-full-organization", $fetch, () => ({ method: "GET" })),
				listOrganizations,
				activeMember: useAuthQuery([$activeMemberSignal], "/organization/get-active-member", $fetch, { method: "GET" }),
				activeMemberRole: useAuthQuery([$activeMemberRoleSignal], "/organization/get-active-member-role", $fetch, { method: "GET" })
			};
		},
		pathMethods: {
			"/organization/get-full-organization": "GET",
			"/organization/list-user-teams": "GET"
		},
		atomListeners: [
			{
				matcher(path) {
					return path === "/organization/create" || path === "/organization/delete" || path === "/organization/update";
				},
				signal: "$listOrg"
			},
			{
				matcher(path) {
					return path.startsWith("/organization");
				},
				signal: "$activeOrgSignal"
			},
			{
				matcher(path) {
					return path.startsWith("/organization/set-active");
				},
				signal: "$sessionSignal"
			},
			{
				matcher(path) {
					return path.includes("/organization/update-member-role");
				},
				signal: "$activeMemberSignal"
			},
			{
				matcher(path) {
					return path.includes("/organization/update-member-role");
				},
				signal: "$activeMemberRoleSignal"
			}
		]
	};
};
const inferOrgAdditionalFields = (schema) => {
	return {};
};

//#endregion
export { clientSideHasPermission, inferOrgAdditionalFields, organizationClient };
//# sourceMappingURL=client.mjs.map