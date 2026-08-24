import { getSessionFromCtx } from "../../api/routes/session.mjs";
import "../../api/index.mjs";
import { defaultRoles } from "./access/statement.mjs";
import "./access/index.mjs";
import { getOrgAdapter } from "./adapter.mjs";
import { shimContext } from "../../utils/shim.mjs";
import { orgSessionMiddleware } from "./call.mjs";
import { ORGANIZATION_ERROR_CODES } from "./error-codes.mjs";
import { hasPermission } from "./has-permission.mjs";
import { createOrgRole, deleteOrgRole, getOrgRole, listOrgRoles, updateOrgRole } from "./routes/crud-access-control.mjs";
import { acceptInvitation, cancelInvitation, createInvitation, getInvitation, listInvitations, listUserInvitations, rejectInvitation } from "./routes/crud-invites.mjs";
import { addMember, getActiveMember, getActiveMemberRole, leaveOrganization, listMembers, removeMember, updateMemberRole } from "./routes/crud-members.mjs";
import { checkOrganizationSlug, createOrganization, deleteOrganization, getFullOrganization, listOrganizations, setActiveOrganization, updateOrganization } from "./routes/crud-org.mjs";
import { addTeamMember, createTeam, listOrganizationTeams, listTeamMembers, listUserTeams, removeTeam, removeTeamMember, setActiveTeam, updateTeam } from "./routes/crud-team.mjs";
import * as z from "zod";
import { APIError } from "better-call";
import { createAuthEndpoint } from "@better-auth/core/api";

//#region src/plugins/organization/organization.ts
function parseRoles(roles) {
	return Array.isArray(roles) ? roles.join(",") : roles;
}
const createHasPermissionBodySchema = z.object({ organizationId: z.string().optional() }).and(z.union([z.object({
	permission: z.record(z.string(), z.array(z.string())),
	permissions: z.undefined()
}), z.object({
	permission: z.undefined(),
	permissions: z.record(z.string(), z.array(z.string()))
})]));
const createHasPermission = (options) => {
	return createAuthEndpoint("/organization/has-permission", {
		method: "POST",
		requireHeaders: true,
		body: createHasPermissionBodySchema,
		use: [orgSessionMiddleware],
		metadata: {
			$Infer: { body: {} },
			openapi: {
				description: "Check if the user has permission",
				requestBody: { content: { "application/json": { schema: {
					type: "object",
					properties: {
						permission: {
							type: "object",
							description: "The permission to check",
							deprecated: true
						},
						permissions: {
							type: "object",
							description: "The permission to check"
						}
					},
					required: ["permissions"]
				} } } },
				responses: { "200": {
					description: "Success",
					content: { "application/json": { schema: {
						type: "object",
						properties: {
							error: { type: "string" },
							success: { type: "boolean" }
						},
						required: ["success"]
					} } }
				} }
			}
		}
	}, async (ctx) => {
		const activeOrganizationId = ctx.body.organizationId || ctx.context.session.session.activeOrganizationId;
		if (!activeOrganizationId) throw new APIError("BAD_REQUEST", { message: ORGANIZATION_ERROR_CODES.NO_ACTIVE_ORGANIZATION });
		const member = await getOrgAdapter(ctx.context, options).findMemberByOrgId({
			userId: ctx.context.session.user.id,
			organizationId: activeOrganizationId
		});
		if (!member) throw new APIError("UNAUTHORIZED", { message: ORGANIZATION_ERROR_CODES.USER_IS_NOT_A_MEMBER_OF_THE_ORGANIZATION });
		const result = await hasPermission({
			role: member.role,
			options: options || {},
			permissions: ctx.body.permissions ?? ctx.body.permission,
			organizationId: activeOrganizationId
		}, ctx);
		return ctx.json({
			error: null,
			success: result
		});
	});
};
function organization(options) {
	let endpoints = {
		createOrganization: createOrganization(options),
		updateOrganization: updateOrganization(options),
		deleteOrganization: deleteOrganization(options),
		setActiveOrganization: setActiveOrganization(options),
		getFullOrganization: getFullOrganization(options),
		listOrganizations: listOrganizations(options),
		createInvitation: createInvitation(options),
		cancelInvitation: cancelInvitation(options),
		acceptInvitation: acceptInvitation(options),
		getInvitation: getInvitation(options),
		rejectInvitation: rejectInvitation(options),
		listInvitations: listInvitations(options),
		getActiveMember: getActiveMember(options),
		checkOrganizationSlug: checkOrganizationSlug(options),
		addMember: addMember(options),
		removeMember: removeMember(options),
		updateMemberRole: updateMemberRole(options),
		leaveOrganization: leaveOrganization(options),
		listUserInvitations: listUserInvitations(options),
		listMembers: listMembers(options),
		getActiveMemberRole: getActiveMemberRole(options)
	};
	const teamSupport = options?.teams?.enabled;
	const teamEndpoints = {
		createTeam: createTeam(options),
		listOrganizationTeams: listOrganizationTeams(options),
		removeTeam: removeTeam(options),
		updateTeam: updateTeam(options),
		setActiveTeam: setActiveTeam(options),
		listUserTeams: listUserTeams(options),
		listTeamMembers: listTeamMembers(options),
		addTeamMember: addTeamMember(options),
		removeTeamMember: removeTeamMember(options)
	};
	if (teamSupport) endpoints = {
		...endpoints,
		...teamEndpoints
	};
	const dynamicAccessControlEndpoints = {
		createOrgRole: createOrgRole(options),
		deleteOrgRole: deleteOrgRole(options),
		listOrgRoles: listOrgRoles(options),
		getOrgRole: getOrgRole(options),
		updateOrgRole: updateOrgRole(options)
	};
	if (options?.dynamicAccessControl?.enabled) endpoints = {
		...endpoints,
		...dynamicAccessControlEndpoints
	};
	const roles = {
		...defaultRoles,
		...options?.roles
	};
	const teamSchema = teamSupport ? {
		team: {
			modelName: options?.schema?.team?.modelName,
			fields: {
				name: {
					type: "string",
					required: true,
					fieldName: options?.schema?.team?.fields?.name
				},
				organizationId: {
					type: "string",
					required: true,
					references: {
						model: "organization",
						field: "id"
					},
					fieldName: options?.schema?.team?.fields?.organizationId,
					index: true
				},
				createdAt: {
					type: "date",
					required: true,
					fieldName: options?.schema?.team?.fields?.createdAt
				},
				updatedAt: {
					type: "date",
					required: false,
					fieldName: options?.schema?.team?.fields?.updatedAt,
					onUpdate: () => /* @__PURE__ */ new Date()
				},
				...options?.schema?.team?.additionalFields || {}
			}
		},
		teamMember: {
			modelName: options?.schema?.teamMember?.modelName,
			fields: {
				teamId: {
					type: "string",
					required: true,
					references: {
						model: "team",
						field: "id"
					},
					fieldName: options?.schema?.teamMember?.fields?.teamId,
					index: true
				},
				userId: {
					type: "string",
					required: true,
					references: {
						model: "user",
						field: "id"
					},
					fieldName: options?.schema?.teamMember?.fields?.userId,
					index: true
				},
				createdAt: {
					type: "date",
					required: false,
					fieldName: options?.schema?.teamMember?.fields?.createdAt
				}
			}
		}
	} : {};
	const organizationRoleSchema = options?.dynamicAccessControl?.enabled ? { organizationRole: {
		fields: {
			organizationId: {
				type: "string",
				required: true,
				references: {
					model: "organization",
					field: "id"
				},
				fieldName: options?.schema?.organizationRole?.fields?.organizationId,
				index: true
			},
			role: {
				type: "string",
				required: true,
				fieldName: options?.schema?.organizationRole?.fields?.role,
				index: true
			},
			permission: {
				type: "string",
				required: true,
				fieldName: options?.schema?.organizationRole?.fields?.permission
			},
			createdAt: {
				type: "date",
				required: true,
				defaultValue: () => /* @__PURE__ */ new Date(),
				fieldName: options?.schema?.organizationRole?.fields?.createdAt
			},
			updatedAt: {
				type: "date",
				required: false,
				fieldName: options?.schema?.organizationRole?.fields?.updatedAt,
				onUpdate: () => /* @__PURE__ */ new Date()
			},
			...options?.schema?.organizationRole?.additionalFields || {}
		},
		modelName: options?.schema?.organizationRole?.modelName
	} } : {};
	const schema = {
		organization: {
			modelName: options?.schema?.organization?.modelName,
			fields: {
				name: {
					type: "string",
					required: true,
					sortable: true,
					fieldName: options?.schema?.organization?.fields?.name
				},
				slug: {
					type: "string",
					required: true,
					unique: true,
					sortable: true,
					fieldName: options?.schema?.organization?.fields?.slug,
					index: true
				},
				logo: {
					type: "string",
					required: false,
					fieldName: options?.schema?.organization?.fields?.logo
				},
				createdAt: {
					type: "date",
					required: true,
					fieldName: options?.schema?.organization?.fields?.createdAt
				},
				metadata: {
					type: "string",
					required: false,
					fieldName: options?.schema?.organization?.fields?.metadata
				},
				...options?.schema?.organization?.additionalFields || {}
			}
		},
		...organizationRoleSchema,
		...teamSchema,
		member: {
			modelName: options?.schema?.member?.modelName,
			fields: {
				organizationId: {
					type: "string",
					required: true,
					references: {
						model: "organization",
						field: "id"
					},
					fieldName: options?.schema?.member?.fields?.organizationId,
					index: true
				},
				userId: {
					type: "string",
					required: true,
					fieldName: options?.schema?.member?.fields?.userId,
					references: {
						model: "user",
						field: "id"
					},
					index: true
				},
				role: {
					type: "string",
					required: true,
					sortable: true,
					defaultValue: "member",
					fieldName: options?.schema?.member?.fields?.role
				},
				createdAt: {
					type: "date",
					required: true,
					fieldName: options?.schema?.member?.fields?.createdAt
				},
				...options?.schema?.member?.additionalFields || {}
			}
		},
		invitation: {
			modelName: options?.schema?.invitation?.modelName,
			fields: {
				organizationId: {
					type: "string",
					required: true,
					references: {
						model: "organization",
						field: "id"
					},
					fieldName: options?.schema?.invitation?.fields?.organizationId,
					index: true
				},
				email: {
					type: "string",
					required: true,
					sortable: true,
					fieldName: options?.schema?.invitation?.fields?.email,
					index: true
				},
				role: {
					type: "string",
					required: false,
					sortable: true,
					fieldName: options?.schema?.invitation?.fields?.role
				},
				...teamSupport ? { teamId: {
					type: "string",
					required: false,
					sortable: true,
					fieldName: options?.schema?.invitation?.fields?.teamId
				} } : {},
				status: {
					type: "string",
					required: true,
					sortable: true,
					defaultValue: "pending",
					fieldName: options?.schema?.invitation?.fields?.status
				},
				expiresAt: {
					type: "date",
					required: true,
					fieldName: options?.schema?.invitation?.fields?.expiresAt
				},
				createdAt: {
					type: "date",
					required: true,
					fieldName: options?.schema?.invitation?.fields?.createdAt,
					defaultValue: () => /* @__PURE__ */ new Date()
				},
				inviterId: {
					type: "string",
					references: {
						model: "user",
						field: "id"
					},
					fieldName: options?.schema?.invitation?.fields?.inviterId,
					required: true
				},
				...options?.schema?.invitation?.additionalFields || {}
			}
		}
	};
	return {
		id: "organization",
		endpoints: {
			...shimContext(endpoints, {
				orgOptions: options || {},
				roles,
				getSession: async (context) => {
					return await getSessionFromCtx(context);
				}
			}),
			hasPermission: createHasPermission(options)
		},
		schema: {
			...schema,
			session: { fields: {
				activeOrganizationId: {
					type: "string",
					required: false,
					fieldName: options?.schema?.session?.fields?.activeOrganizationId
				},
				...teamSupport ? { activeTeamId: {
					type: "string",
					required: false,
					fieldName: options?.schema?.session?.fields?.activeTeamId
				} } : {}
			} }
		},
		$Infer: {
			Organization: {},
			Invitation: {},
			Member: {},
			Team: teamSupport ? {} : {},
			TeamMember: teamSupport ? {} : {},
			ActiveOrganization: {}
		},
		$ERROR_CODES: ORGANIZATION_ERROR_CODES,
		options
	};
}

//#endregion
export { organization, parseRoles };
//# sourceMappingURL=organization.mjs.map