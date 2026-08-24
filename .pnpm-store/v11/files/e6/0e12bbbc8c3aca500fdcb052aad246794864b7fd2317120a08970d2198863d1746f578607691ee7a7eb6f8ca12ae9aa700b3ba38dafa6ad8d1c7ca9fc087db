import { adminAc, userAc } from "./access/statement.mjs";
import "./access/index.mjs";
import { hasPermission } from "./has-permission.mjs";

//#region src/plugins/admin/client.ts
const adminClient = (options) => {
	const roles = {
		admin: adminAc,
		user: userAc,
		...options?.roles
	};
	return {
		id: "admin-client",
		$InferServerPlugin: {},
		getActions: () => ({ admin: { checkRolePermission: (data) => {
			return hasPermission({
				role: data.role,
				options: {
					ac: options?.ac,
					roles
				},
				permissions: data.permissions ?? data.permission
			});
		} } }),
		pathMethods: {
			"/admin/list-users": "GET",
			"/admin/stop-impersonating": "POST"
		}
	};
};

//#endregion
export { adminClient };
//# sourceMappingURL=client.mjs.map