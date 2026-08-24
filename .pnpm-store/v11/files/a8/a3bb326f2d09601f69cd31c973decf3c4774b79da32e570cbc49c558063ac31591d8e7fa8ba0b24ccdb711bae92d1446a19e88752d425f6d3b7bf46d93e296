import { toZodSchema } from "../../../db/to-zod.mjs";
import "../../../db/index.mjs";
import { APIError } from "../../../api/index.mjs";
import { orgSessionMiddleware } from "../call.mjs";
import { ORGANIZATION_ERROR_CODES } from "../error-codes.mjs";
import { hasPermission } from "../has-permission.mjs";
import * as z from "zod";
import { createAuthEndpoint } from "@better-auth/core/api";

//#region src/plugins/organization/routes/crud-access-control.ts
const normalizeRoleName = (role) => role.toLowerCase();
const DEFAULT_MAXIMUM_ROLES_PER_ORGANIZATION = Number.POSITIVE_INFINITY;
const getAdditionalFields = (options, shouldBePartial = false) => {
	let additionalFields = options?.schema?.organizationRole?.additionalFields || {};
	if (shouldBePartial) for (const key in additionalFields) additionalFields[key].required = false;
	return {
		additionalFieldsSchema: toZodSchema({
			fields: additionalFields,
			isClientSide: true
		}),
		$AdditionalFields: {},
		$ReturnAdditionalFields: {}
	};
};
const baseCreateOrgRoleSchema = z.object({
	organizationId: z.string().optional().meta({ description: "The id of the organization to create the role in. If not provided, the user's active organization will be used." }),
	role: z.string().meta({ description: "The name of the role to create" }),
	permission: z.record(z.string(), z.array(z.string())).meta({ description: "The permission to assign to the role" })
});
const createOrgRole = (options) => {
	const { additionalFieldsSchema, $AdditionalFields, $ReturnAdditionalFields } = getAdditionalFields(options, false);
	return createAuthEndpoint("/organization/create-role", {
		method: "POST",
		body: baseCreateOrgRoleSchema.safeExtend({ additionalFields: z.object({ ...additionalFieldsSchema.shape }).optional() }),
		metadata: { $Infer: { body: {} } },
		requireHeaders: true,
		use: [orgSessionMiddleware]
	}, async (ctx) => {
		const { session, user } = ctx.context.session;
		let roleName = ctx.body.role;
		const permission = ctx.body.permission;
		const additionalFields = ctx.body.additionalFields;
		const ac = options.ac;
		if (!ac) {
			ctx.context.logger.error(`[Dynamic Access Control] The organization plugin is missing a pre-defined ac instance.`, `\nPlease refer to the documentation here: https://better-auth.com/docs/plugins/organization#dynamic-access-control`);
			throw new APIError("NOT_IMPLEMENTED", { message: ORGANIZATION_ERROR_CODES.MISSING_AC_INSTANCE });
		}
		const organizationId = ctx.body.organizationId ?? session.activeOrganizationId;
		if (!organizationId) {
			ctx.context.logger.error(`[Dynamic Access Control] The session is missing an active organization id to create a role. Either set an active org id, or pass an organizationId in the request body.`);
			throw new APIError("BAD_REQUEST", { message: ORGANIZATION_ERROR_CODES.YOU_MUST_BE_IN_AN_ORGANIZATION_TO_CREATE_A_ROLE });
		}
		roleName = normalizeRoleName(roleName);
		await checkIfRoleNameIsTakenByPreDefinedRole({
			role: roleName,
			organizationId,
			options,
			ctx
		});
		const member = await ctx.context.adapter.findOne({
			model: "member",
			where: [{
				field: "organizationId",
				value: organizationId,
				operator: "eq",
				connector: "AND"
			}, {
				field: "userId",
				value: user.id,
				operator: "eq",
				connector: "AND"
			}]
		});
		if (!member) {
			ctx.context.logger.error(`[Dynamic Access Control] The user is not a member of the organization to create a role.`, {
				userId: user.id,
				organizationId
			});
			throw new APIError("FORBIDDEN", { message: ORGANIZATION_ERROR_CODES.YOU_ARE_NOT_A_MEMBER_OF_THIS_ORGANIZATION });
		}
		if (!await hasPermission({
			options,
			organizationId,
			permissions: { ac: ["create"] },
			role: member.role
		}, ctx)) {
			ctx.context.logger.error(`[Dynamic Access Control] The user is not permitted to create a role. If this is unexpected, please make sure the role associated to that member has the "ac" resource with the "create" permission.`, {
				userId: user.id,
				organizationId,
				role: member.role
			});
			throw new APIError("FORBIDDEN", { message: ORGANIZATION_ERROR_CODES.YOU_ARE_NOT_ALLOWED_TO_CREATE_A_ROLE });
		}
		const maximumRolesPerOrganization = typeof options.dynamicAccessControl?.maximumRolesPerOrganization === "function" ? await options.dynamicAccessControl.maximumRolesPerOrganization(organizationId) : options.dynamicAccessControl?.maximumRolesPerOrganization ?? DEFAULT_MAXIMUM_ROLES_PER_ORGANIZATION;
		const rolesInDB = await ctx.context.adapter.count({
			model: "organizationRole",
			where: [{
				field: "organizationId",
				value: organizationId,
				operator: "eq",
				connector: "AND"
			}]
		});
		if (rolesInDB >= maximumRolesPerOrganization) {
			ctx.context.logger.error(`[Dynamic Access Control] Failed to create a new role, the organization has too many roles. Maximum allowed roles is ${maximumRolesPerOrganization}.`, {
				organizationId,
				maximumRolesPerOrganization,
				rolesInDB
			});
			throw new APIError("BAD_REQUEST", { message: ORGANIZATION_ERROR_CODES.TOO_MANY_ROLES });
		}
		await checkForInvalidResources({
			ac,
			ctx,
			permission
		});
		await checkIfMemberHasPermission({
			ctx,
			member,
			options,
			organizationId,
			permissionRequired: permission,
			user,
			action: "create"
		});
		await checkIfRoleNameIsTakenByRoleInDB({
			ctx,
			organizationId,
			role: roleName
		});
		const newRole = ac.newRole(permission);
		const data = {
			...await ctx.context.adapter.create({
				model: "organizationRole",
				data: {
					createdAt: /* @__PURE__ */ new Date(),
					organizationId,
					permission: JSON.stringify(permission),
					role: roleName,
					...additionalFields
				}
			}),
			permission
		};
		return ctx.json({
			success: true,
			roleData: data,
			statements: newRole.statements
		});
	});
};
const deleteOrgRoleBodySchema = z.object({ organizationId: z.string().optional().meta({ description: "The id of the organization to create the role in. If not provided, the user's active organization will be used." }) }).and(z.union([z.object({ roleName: z.string().nonempty().meta({ description: "The name of the role to delete" }) }), z.object({ roleId: z.string().nonempty().meta({ description: "The id of the role to delete" }) })]));
const deleteOrgRole = (options) => {
	return createAuthEndpoint("/organization/delete-role", {
		method: "POST",
		body: deleteOrgRoleBodySchema,
		requireHeaders: true,
		use: [orgSessionMiddleware],
		metadata: { $Infer: { body: {} } }
	}, async (ctx) => {
		const { session, user } = ctx.context.session;
		const organizationId = ctx.body.organizationId ?? session.activeOrganizationId;
		if (!organizationId) {
			ctx.context.logger.error(`[Dynamic Access Control] The session is missing an active organization id to delete a role. Either set an active org id, or pass an organizationId in the request body.`);
			throw new APIError("BAD_REQUEST", { message: ORGANIZATION_ERROR_CODES.NO_ACTIVE_ORGANIZATION });
		}
		const member = await ctx.context.adapter.findOne({
			model: "member",
			where: [{
				field: "organizationId",
				value: organizationId,
				operator: "eq",
				connector: "AND"
			}, {
				field: "userId",
				value: user.id,
				operator: "eq",
				connector: "AND"
			}]
		});
		if (!member) {
			ctx.context.logger.error(`[Dynamic Access Control] The user is not a member of the organization to delete a role.`, {
				userId: user.id,
				organizationId
			});
			throw new APIError("FORBIDDEN", { message: ORGANIZATION_ERROR_CODES.YOU_ARE_NOT_A_MEMBER_OF_THIS_ORGANIZATION });
		}
		if (!await hasPermission({
			options,
			organizationId,
			permissions: { ac: ["delete"] },
			role: member.role
		}, ctx)) {
			ctx.context.logger.error(`[Dynamic Access Control] The user is not permitted to delete a role. If this is unexpected, please make sure the role associated to that member has the "ac" resource with the "delete" permission.`, {
				userId: user.id,
				organizationId,
				role: member.role
			});
			throw new APIError("FORBIDDEN", { message: ORGANIZATION_ERROR_CODES.YOU_ARE_NOT_ALLOWED_TO_DELETE_A_ROLE });
		}
		if (ctx.body.roleName) {
			const roleName = ctx.body.roleName;
			const defaultRoles = options.roles ? Object.keys(options.roles) : [
				"owner",
				"admin",
				"member"
			];
			if (defaultRoles.includes(roleName)) {
				ctx.context.logger.error(`[Dynamic Access Control] Cannot delete a pre-defined role.`, {
					roleName,
					organizationId,
					defaultRoles
				});
				throw new APIError("BAD_REQUEST", { message: ORGANIZATION_ERROR_CODES.CANNOT_DELETE_A_PRE_DEFINED_ROLE });
			}
		}
		let condition;
		if (ctx.body.roleName) condition = {
			field: "role",
			value: ctx.body.roleName,
			operator: "eq",
			connector: "AND"
		};
		else if (ctx.body.roleId) condition = {
			field: "id",
			value: ctx.body.roleId,
			operator: "eq",
			connector: "AND"
		};
		else {
			ctx.context.logger.error(`[Dynamic Access Control] The role name/id is not provided in the request body.`);
			throw new APIError("BAD_REQUEST", { message: ORGANIZATION_ERROR_CODES.ROLE_NOT_FOUND });
		}
		const existingRoleInDB = await ctx.context.adapter.findOne({
			model: "organizationRole",
			where: [{
				field: "organizationId",
				value: organizationId,
				operator: "eq",
				connector: "AND"
			}, condition]
		});
		if (!existingRoleInDB) {
			ctx.context.logger.error(`[Dynamic Access Control] The role name/id does not exist in the database.`, {
				..."roleName" in ctx.body ? { roleName: ctx.body.roleName } : { roleId: ctx.body.roleId },
				organizationId
			});
			throw new APIError("BAD_REQUEST", { message: ORGANIZATION_ERROR_CODES.ROLE_NOT_FOUND });
		}
		existingRoleInDB.permission = JSON.parse(existingRoleInDB.permission);
		await ctx.context.adapter.delete({
			model: "organizationRole",
			where: [{
				field: "organizationId",
				value: organizationId,
				operator: "eq",
				connector: "AND"
			}, condition]
		});
		return ctx.json({ success: true });
	});
};
const listOrgRolesQuerySchema = z.object({ organizationId: z.string().optional().meta({ description: "The id of the organization to list roles for. If not provided, the user's active organization will be used." }) }).optional();
const listOrgRoles = (options) => {
	const { $ReturnAdditionalFields } = getAdditionalFields(options, false);
	return createAuthEndpoint("/organization/list-roles", {
		method: "GET",
		requireHeaders: true,
		use: [orgSessionMiddleware],
		query: listOrgRolesQuerySchema
	}, async (ctx) => {
		const { session, user } = ctx.context.session;
		const organizationId = ctx.query?.organizationId ?? session.activeOrganizationId;
		if (!organizationId) {
			ctx.context.logger.error(`[Dynamic Access Control] The session is missing an active organization id to list roles. Either set an active org id, or pass an organizationId in the request query.`);
			throw new APIError("BAD_REQUEST", { message: ORGANIZATION_ERROR_CODES.NO_ACTIVE_ORGANIZATION });
		}
		const member = await ctx.context.adapter.findOne({
			model: "member",
			where: [{
				field: "organizationId",
				value: organizationId,
				operator: "eq",
				connector: "AND"
			}, {
				field: "userId",
				value: user.id,
				operator: "eq",
				connector: "AND"
			}]
		});
		if (!member) {
			ctx.context.logger.error(`[Dynamic Access Control] The user is not a member of the organization to list roles.`, {
				userId: user.id,
				organizationId
			});
			throw new APIError("FORBIDDEN", { message: ORGANIZATION_ERROR_CODES.YOU_ARE_NOT_A_MEMBER_OF_THIS_ORGANIZATION });
		}
		if (!await hasPermission({
			options,
			organizationId,
			permissions: { ac: ["read"] },
			role: member.role
		}, ctx)) {
			ctx.context.logger.error(`[Dynamic Access Control] The user is not permitted to list roles.`, {
				userId: user.id,
				organizationId,
				role: member.role
			});
			throw new APIError("FORBIDDEN", { message: ORGANIZATION_ERROR_CODES.YOU_ARE_NOT_ALLOWED_TO_LIST_A_ROLE });
		}
		let roles = await ctx.context.adapter.findMany({
			model: "organizationRole",
			where: [{
				field: "organizationId",
				value: organizationId,
				operator: "eq",
				connector: "AND"
			}]
		});
		roles = roles.map((x) => ({
			...x,
			permission: JSON.parse(x.permission)
		}));
		return ctx.json(roles);
	});
};
const getOrgRoleQuerySchema = z.object({ organizationId: z.string().optional().meta({ description: "The id of the organization to read a role for. If not provided, the user's active organization will be used." }) }).and(z.union([z.object({ roleName: z.string().nonempty().meta({ description: "The name of the role to read" }) }), z.object({ roleId: z.string().nonempty().meta({ description: "The id of the role to read" }) })])).optional();
const getOrgRole = (options) => {
	const { $ReturnAdditionalFields } = getAdditionalFields(options, false);
	return createAuthEndpoint("/organization/get-role", {
		method: "GET",
		requireHeaders: true,
		use: [orgSessionMiddleware],
		query: getOrgRoleQuerySchema,
		metadata: { $Infer: { query: {} } }
	}, async (ctx) => {
		const { session, user } = ctx.context.session;
		const organizationId = ctx.query?.organizationId ?? session.activeOrganizationId;
		if (!organizationId) {
			ctx.context.logger.error(`[Dynamic Access Control] The session is missing an active organization id to read a role. Either set an active org id, or pass an organizationId in the request query.`);
			throw new APIError("BAD_REQUEST", { message: ORGANIZATION_ERROR_CODES.NO_ACTIVE_ORGANIZATION });
		}
		const member = await ctx.context.adapter.findOne({
			model: "member",
			where: [{
				field: "organizationId",
				value: organizationId,
				operator: "eq",
				connector: "AND"
			}, {
				field: "userId",
				value: user.id,
				operator: "eq",
				connector: "AND"
			}]
		});
		if (!member) {
			ctx.context.logger.error(`[Dynamic Access Control] The user is not a member of the organization to read a role.`, {
				userId: user.id,
				organizationId
			});
			throw new APIError("FORBIDDEN", { message: ORGANIZATION_ERROR_CODES.YOU_ARE_NOT_A_MEMBER_OF_THIS_ORGANIZATION });
		}
		if (!await hasPermission({
			options,
			organizationId,
			permissions: { ac: ["read"] },
			role: member.role
		}, ctx)) {
			ctx.context.logger.error(`[Dynamic Access Control] The user is not permitted to read a role.`, {
				userId: user.id,
				organizationId,
				role: member.role
			});
			throw new APIError("FORBIDDEN", { message: ORGANIZATION_ERROR_CODES.YOU_ARE_NOT_ALLOWED_TO_READ_A_ROLE });
		}
		let condition;
		if (ctx.query.roleName) condition = {
			field: "role",
			value: ctx.query.roleName,
			operator: "eq",
			connector: "AND"
		};
		else if (ctx.query.roleId) condition = {
			field: "id",
			value: ctx.query.roleId,
			operator: "eq",
			connector: "AND"
		};
		else {
			ctx.context.logger.error(`[Dynamic Access Control] The role name/id is not provided in the request query.`);
			throw new APIError("BAD_REQUEST", { message: ORGANIZATION_ERROR_CODES.ROLE_NOT_FOUND });
		}
		let role = await ctx.context.adapter.findOne({
			model: "organizationRole",
			where: [{
				field: "organizationId",
				value: organizationId,
				operator: "eq",
				connector: "AND"
			}, condition]
		});
		if (!role) {
			ctx.context.logger.error(`[Dynamic Access Control] The role name/id does not exist in the database.`, {
				..."roleName" in ctx.query ? { roleName: ctx.query.roleName } : { roleId: ctx.query.roleId },
				organizationId
			});
			throw new APIError("BAD_REQUEST", { message: ORGANIZATION_ERROR_CODES.ROLE_NOT_FOUND });
		}
		role.permission = JSON.parse(role.permission);
		return ctx.json(role);
	});
};
const roleNameOrIdSchema = z.union([z.object({ roleName: z.string().nonempty().meta({ description: "The name of the role to update" }) }), z.object({ roleId: z.string().nonempty().meta({ description: "The id of the role to update" }) })]);
const updateOrgRole = (options) => {
	const { additionalFieldsSchema, $AdditionalFields, $ReturnAdditionalFields } = getAdditionalFields(options, true);
	return createAuthEndpoint("/organization/update-role", {
		method: "POST",
		body: z.object({
			organizationId: z.string().optional().meta({ description: "The id of the organization to update the role in. If not provided, the user's active organization will be used." }),
			data: z.object({
				permission: z.record(z.string(), z.array(z.string())).optional().meta({ description: "The permission to update the role with" }),
				roleName: z.string().optional().meta({ description: "The name of the role to update" }),
				...additionalFieldsSchema.shape
			})
		}).and(roleNameOrIdSchema),
		metadata: { $Infer: { body: {} } },
		requireHeaders: true,
		use: [orgSessionMiddleware]
	}, async (ctx) => {
		const { session, user } = ctx.context.session;
		const ac = options.ac;
		if (!ac) {
			ctx.context.logger.error(`[Dynamic Access Control] The organization plugin is missing a pre-defined ac instance.`, `\nPlease refer to the documentation here: https://better-auth.com/docs/plugins/organization#dynamic-access-control`);
			throw new APIError("NOT_IMPLEMENTED", { message: ORGANIZATION_ERROR_CODES.MISSING_AC_INSTANCE });
		}
		const organizationId = ctx.body.organizationId ?? session.activeOrganizationId;
		if (!organizationId) {
			ctx.context.logger.error(`[Dynamic Access Control] The session is missing an active organization id to update a role. Either set an active org id, or pass an organizationId in the request body.`);
			throw new APIError("BAD_REQUEST", { message: ORGANIZATION_ERROR_CODES.NO_ACTIVE_ORGANIZATION });
		}
		const member = await ctx.context.adapter.findOne({
			model: "member",
			where: [{
				field: "organizationId",
				value: organizationId,
				operator: "eq",
				connector: "AND"
			}, {
				field: "userId",
				value: user.id,
				operator: "eq",
				connector: "AND"
			}]
		});
		if (!member) {
			ctx.context.logger.error(`[Dynamic Access Control] The user is not a member of the organization to update a role.`, {
				userId: user.id,
				organizationId
			});
			throw new APIError("FORBIDDEN", { message: ORGANIZATION_ERROR_CODES.YOU_ARE_NOT_A_MEMBER_OF_THIS_ORGANIZATION });
		}
		if (!await hasPermission({
			options,
			organizationId,
			role: member.role,
			permissions: { ac: ["update"] }
		}, ctx)) {
			ctx.context.logger.error(`[Dynamic Access Control] The user is not permitted to update a role.`);
			throw new APIError("FORBIDDEN", { message: ORGANIZATION_ERROR_CODES.YOU_ARE_NOT_ALLOWED_TO_UPDATE_A_ROLE });
		}
		let condition;
		if (ctx.body.roleName) condition = {
			field: "role",
			value: ctx.body.roleName,
			operator: "eq",
			connector: "AND"
		};
		else if (ctx.body.roleId) condition = {
			field: "id",
			value: ctx.body.roleId,
			operator: "eq",
			connector: "AND"
		};
		else {
			ctx.context.logger.error(`[Dynamic Access Control] The role name/id is not provided in the request body.`);
			throw new APIError("BAD_REQUEST", { message: ORGANIZATION_ERROR_CODES.ROLE_NOT_FOUND });
		}
		let role = await ctx.context.adapter.findOne({
			model: "organizationRole",
			where: [{
				field: "organizationId",
				value: organizationId,
				operator: "eq",
				connector: "AND"
			}, condition]
		});
		if (!role) {
			ctx.context.logger.error(`[Dynamic Access Control] The role name/id does not exist in the database.`, {
				..."roleName" in ctx.body ? { roleName: ctx.body.roleName } : { roleId: ctx.body.roleId },
				organizationId
			});
			throw new APIError("BAD_REQUEST", { message: ORGANIZATION_ERROR_CODES.ROLE_NOT_FOUND });
		}
		role.permission = role.permission ? JSON.parse(role.permission) : void 0;
		const { permission: _, roleName: __, ...additionalFields } = ctx.body.data;
		let updateData = { ...additionalFields };
		if (ctx.body.data.permission) {
			let newPermission = ctx.body.data.permission;
			await checkForInvalidResources({
				ac,
				ctx,
				permission: newPermission
			});
			await checkIfMemberHasPermission({
				ctx,
				member,
				options,
				organizationId,
				permissionRequired: newPermission,
				user,
				action: "update"
			});
			updateData.permission = newPermission;
		}
		if (ctx.body.data.roleName) {
			let newRoleName = ctx.body.data.roleName;
			newRoleName = normalizeRoleName(newRoleName);
			await checkIfRoleNameIsTakenByPreDefinedRole({
				role: newRoleName,
				organizationId,
				options,
				ctx
			});
			await checkIfRoleNameIsTakenByRoleInDB({
				role: newRoleName,
				organizationId,
				ctx
			});
			updateData.role = newRoleName;
		}
		const update = {
			...updateData,
			...updateData.permission ? { permission: JSON.stringify(updateData.permission) } : {}
		};
		await ctx.context.adapter.update({
			model: "organizationRole",
			where: [{
				field: "organizationId",
				value: organizationId,
				operator: "eq",
				connector: "AND"
			}, condition],
			update
		});
		return ctx.json({
			success: true,
			roleData: {
				...role,
				...update,
				permission: updateData.permission || role.permission || null
			}
		});
	});
};
async function checkForInvalidResources({ ac, ctx, permission }) {
	const validResources = Object.keys(ac.statements);
	const providedResources = Object.keys(permission);
	if (providedResources.some((r) => !validResources.includes(r))) {
		ctx.context.logger.error(`[Dynamic Access Control] The provided permission includes an invalid resource.`, {
			providedResources,
			validResources
		});
		throw new APIError("BAD_REQUEST", { message: ORGANIZATION_ERROR_CODES.INVALID_RESOURCE });
	}
}
async function checkIfMemberHasPermission({ ctx, permissionRequired: permission, options, organizationId, member, user, action }) {
	const hasNecessaryPermissions = [];
	const permissionEntries = Object.entries(permission);
	for await (const [resource, permissions] of permissionEntries) for await (const perm of permissions) hasNecessaryPermissions.push({
		resource: { [resource]: [perm] },
		hasPermission: await hasPermission({
			options,
			organizationId,
			permissions: { [resource]: [perm] },
			useMemoryCache: true,
			role: member.role
		}, ctx)
	});
	const missingPermissions = hasNecessaryPermissions.filter((x) => x.hasPermission === false).map((x) => {
		const key = Object.keys(x.resource)[0];
		return `${key}:${x.resource[key][0]}`;
	});
	if (missingPermissions.length > 0) {
		ctx.context.logger.error(`[Dynamic Access Control] The user is missing permissions necessary to ${action} a role with those set of permissions.\n`, {
			userId: user.id,
			organizationId,
			role: member.role,
			missingPermissions
		});
		let errorMessage;
		if (action === "create") errorMessage = ORGANIZATION_ERROR_CODES.YOU_ARE_NOT_ALLOWED_TO_CREATE_A_ROLE;
		else if (action === "update") errorMessage = ORGANIZATION_ERROR_CODES.YOU_ARE_NOT_ALLOWED_TO_UPDATE_A_ROLE;
		else if (action === "delete") errorMessage = ORGANIZATION_ERROR_CODES.YOU_ARE_NOT_ALLOWED_TO_DELETE_A_ROLE;
		else if (action === "read") errorMessage = ORGANIZATION_ERROR_CODES.YOU_ARE_NOT_ALLOWED_TO_READ_A_ROLE;
		else if (action === "list") errorMessage = ORGANIZATION_ERROR_CODES.YOU_ARE_NOT_ALLOWED_TO_LIST_A_ROLE;
		else errorMessage = ORGANIZATION_ERROR_CODES.YOU_ARE_NOT_ALLOWED_TO_GET_A_ROLE;
		throw new APIError("FORBIDDEN", {
			message: errorMessage,
			missingPermissions
		});
	}
}
async function checkIfRoleNameIsTakenByPreDefinedRole({ options, organizationId, role, ctx }) {
	const defaultRoles = options.roles ? Object.keys(options.roles) : [
		"owner",
		"admin",
		"member"
	];
	if (defaultRoles.includes(role)) {
		ctx.context.logger.error(`[Dynamic Access Control] The role name "${role}" is already taken by a pre-defined role.`, {
			role,
			organizationId,
			defaultRoles
		});
		throw new APIError("BAD_REQUEST", { message: ORGANIZATION_ERROR_CODES.ROLE_NAME_IS_ALREADY_TAKEN });
	}
}
async function checkIfRoleNameIsTakenByRoleInDB({ organizationId, role, ctx }) {
	if (await ctx.context.adapter.findOne({
		model: "organizationRole",
		where: [{
			field: "organizationId",
			value: organizationId,
			operator: "eq",
			connector: "AND"
		}, {
			field: "role",
			value: role,
			operator: "eq",
			connector: "AND"
		}]
	})) {
		ctx.context.logger.error(`[Dynamic Access Control] The role name "${role}" is already taken by a role in the database.`, {
			role,
			organizationId
		});
		throw new APIError("BAD_REQUEST", { message: ORGANIZATION_ERROR_CODES.ROLE_NAME_IS_ALREADY_TAKEN });
	}
}

//#endregion
export { createOrgRole, deleteOrgRole, getOrgRole, listOrgRoles, updateOrgRole };
//# sourceMappingURL=crud-access-control.mjs.map