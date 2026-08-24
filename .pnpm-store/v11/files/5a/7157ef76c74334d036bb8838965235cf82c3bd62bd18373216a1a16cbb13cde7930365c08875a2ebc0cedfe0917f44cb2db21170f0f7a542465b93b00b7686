import { APIError } from "../../api/index.mjs";
import { defaultRoles } from "./access/statement.mjs";
import "./access/index.mjs";
import { cacheAllRoles, hasPermissionFn } from "./permission.mjs";
import * as z from "zod";

//#region src/plugins/organization/has-permission.ts
const hasPermission = async (input, ctx) => {
	let acRoles = { ...input.options.roles || defaultRoles };
	if (ctx && input.organizationId && input.options.dynamicAccessControl?.enabled && input.options.ac && !input.useMemoryCache) {
		const roles = await ctx.context.adapter.findMany({
			model: "organizationRole",
			where: [{
				field: "organizationId",
				value: input.organizationId
			}]
		});
		for (const { role, permission: permissionsString } of roles) {
			if (role in acRoles) continue;
			const result = z.record(z.string(), z.array(z.string())).safeParse(JSON.parse(permissionsString));
			if (!result.success) {
				ctx.context.logger.error("[hasPermission] Invalid permissions for role " + role, { permissions: JSON.parse(permissionsString) });
				throw new APIError("INTERNAL_SERVER_ERROR", { message: "Invalid permissions for role " + role });
			}
			acRoles[role] = input.options.ac.newRole(result.data);
		}
	}
	if (input.useMemoryCache) acRoles = cacheAllRoles.get(input.organizationId) || acRoles;
	cacheAllRoles.set(input.organizationId, acRoles);
	return hasPermissionFn(input, acRoles);
};

//#endregion
export { hasPermission };
//# sourceMappingURL=has-permission.mjs.map