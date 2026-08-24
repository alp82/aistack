import { toZodSchema } from "../../../db/to-zod.mjs";
import "../../../db/index.mjs";
import { setSessionCookie } from "../../../cookies/index.mjs";
import { getSessionFromCtx, requestOnlySessionMiddleware } from "../../../api/routes/session.mjs";
import "../../../api/index.mjs";
import { getOrgAdapter } from "../adapter.mjs";
import { orgMiddleware, orgSessionMiddleware } from "../call.mjs";
import { ORGANIZATION_ERROR_CODES } from "../error-codes.mjs";
import { hasPermission } from "../has-permission.mjs";
import * as z from "zod";
import { APIError } from "better-call";
import { createAuthEndpoint } from "@better-auth/core/api";

//#region src/plugins/organization/routes/crud-org.ts
const baseOrganizationSchema = z.object({
	name: z.string().min(1).meta({ description: "The name of the organization" }),
	slug: z.string().min(1).meta({ description: "The slug of the organization" }),
	userId: z.coerce.string().meta({ description: "The user id of the organization creator. If not provided, the current user will be used. Should only be used by admins or when called by the server. server-only. Eg: \"user-id\"" }).optional(),
	logo: z.string().meta({ description: "The logo of the organization" }).optional(),
	metadata: z.record(z.string(), z.any()).meta({ description: "The metadata of the organization" }).optional(),
	keepCurrentActiveOrganization: z.boolean().meta({ description: "Whether to keep the current active organization active after creating a new one. Eg: true" }).optional()
});
const createOrganization = (options) => {
	const additionalFieldsSchema = toZodSchema({
		fields: options?.schema?.organization?.additionalFields || {},
		isClientSide: true
	});
	return createAuthEndpoint("/organization/create", {
		method: "POST",
		body: z.object({
			...baseOrganizationSchema.shape,
			...additionalFieldsSchema.shape
		}),
		use: [orgMiddleware],
		metadata: {
			$Infer: { body: {} },
			openapi: {
				description: "Create an organization",
				responses: { "200": {
					description: "Success",
					content: { "application/json": { schema: {
						type: "object",
						description: "The organization that was created",
						$ref: "#/components/schemas/Organization"
					} } }
				} }
			}
		}
	}, async (ctx) => {
		const session = await getSessionFromCtx(ctx);
		if (!session && (ctx.request || ctx.headers)) throw new APIError("UNAUTHORIZED");
		let user = session?.user || null;
		if (!user) {
			if (!ctx.body.userId) throw new APIError("UNAUTHORIZED");
			user = await ctx.context.internalAdapter.findUserById(ctx.body.userId);
		}
		if (!user) return ctx.json(null, { status: 401 });
		const options$1 = ctx.context.orgOptions;
		const canCreateOrg = typeof options$1?.allowUserToCreateOrganization === "function" ? await options$1.allowUserToCreateOrganization(user) : options$1?.allowUserToCreateOrganization === void 0 ? true : options$1.allowUserToCreateOrganization;
		const isSystemAction = !session && ctx.body.userId;
		if (!canCreateOrg && !isSystemAction) throw new APIError("FORBIDDEN", { message: ORGANIZATION_ERROR_CODES.YOU_ARE_NOT_ALLOWED_TO_CREATE_A_NEW_ORGANIZATION });
		const adapter = getOrgAdapter(ctx.context, options$1);
		const userOrganizations = await adapter.listOrganizations(user.id);
		if (typeof options$1.organizationLimit === "number" ? userOrganizations.length >= options$1.organizationLimit : typeof options$1.organizationLimit === "function" ? await options$1.organizationLimit(user) : false) throw new APIError("FORBIDDEN", { message: ORGANIZATION_ERROR_CODES.YOU_HAVE_REACHED_THE_MAXIMUM_NUMBER_OF_ORGANIZATIONS });
		if (await adapter.findOrganizationBySlug(ctx.body.slug)) throw new APIError("BAD_REQUEST", { message: ORGANIZATION_ERROR_CODES.ORGANIZATION_ALREADY_EXISTS });
		let { keepCurrentActiveOrganization: _, userId: __, ...orgData } = ctx.body;
		if (options$1.organizationCreation?.beforeCreate) {
			const response = await options$1.organizationCreation.beforeCreate({
				organization: {
					...orgData,
					createdAt: /* @__PURE__ */ new Date()
				},
				user
			}, ctx.request);
			if (response && typeof response === "object" && "data" in response) orgData = {
				...ctx.body,
				...response.data
			};
		}
		if (options$1?.organizationHooks?.beforeCreateOrganization) {
			const response = await options$1?.organizationHooks.beforeCreateOrganization({
				organization: orgData,
				user
			});
			if (response && typeof response === "object" && "data" in response) orgData = {
				...ctx.body,
				...response.data
			};
		}
		const organization = await adapter.createOrganization({ organization: {
			...orgData,
			createdAt: /* @__PURE__ */ new Date()
		} });
		let member;
		let teamMember = null;
		let data = {
			userId: user.id,
			organizationId: organization.id,
			role: ctx.context.orgOptions.creatorRole || "owner"
		};
		if (options$1?.organizationHooks?.beforeAddMember) {
			const response = await options$1?.organizationHooks.beforeAddMember({
				member: {
					userId: user.id,
					organizationId: organization.id,
					role: ctx.context.orgOptions.creatorRole || "owner"
				},
				user,
				organization
			});
			if (response && typeof response === "object" && "data" in response) data = {
				...data,
				...response.data
			};
		}
		member = await adapter.createMember(data);
		if (options$1?.organizationHooks?.afterAddMember) await options$1?.organizationHooks.afterAddMember({
			member,
			user,
			organization
		});
		if (options$1?.teams?.enabled && options$1.teams.defaultTeam?.enabled !== false) {
			let teamData = {
				organizationId: organization.id,
				name: `${organization.name}`,
				createdAt: /* @__PURE__ */ new Date()
			};
			if (options$1?.organizationHooks?.beforeCreateTeam) {
				const response = await options$1?.organizationHooks.beforeCreateTeam({
					team: {
						organizationId: organization.id,
						name: `${organization.name}`
					},
					user,
					organization
				});
				if (response && typeof response === "object" && "data" in response) teamData = {
					...teamData,
					...response.data
				};
			}
			const defaultTeam = await options$1.teams.defaultTeam?.customCreateDefaultTeam?.(organization, ctx) || await adapter.createTeam(teamData);
			teamMember = await adapter.findOrCreateTeamMember({
				teamId: defaultTeam.id,
				userId: user.id
			});
			if (options$1?.organizationHooks?.afterCreateTeam) await options$1?.organizationHooks.afterCreateTeam({
				team: defaultTeam,
				user,
				organization
			});
		}
		if (options$1.organizationCreation?.afterCreate) await options$1.organizationCreation.afterCreate({
			organization,
			user,
			member
		}, ctx.request);
		if (options$1?.organizationHooks?.afterCreateOrganization) await options$1?.organizationHooks.afterCreateOrganization({
			organization,
			user,
			member
		});
		if (ctx.context.session && !ctx.body.keepCurrentActiveOrganization) await adapter.setActiveOrganization(ctx.context.session.session.token, organization.id, ctx);
		if (teamMember && ctx.context.session && !ctx.body.keepCurrentActiveOrganization) await adapter.setActiveTeam(ctx.context.session.session.token, teamMember.teamId, ctx);
		return ctx.json({
			...organization,
			metadata: organization.metadata && typeof organization.metadata === "string" ? JSON.parse(organization.metadata) : organization.metadata,
			members: [member]
		});
	});
};
const checkOrganizationSlugBodySchema = z.object({ slug: z.string().meta({ description: "The organization slug to check. Eg: \"my-org\"" }) });
const checkOrganizationSlug = (options) => createAuthEndpoint("/organization/check-slug", {
	method: "POST",
	body: checkOrganizationSlugBodySchema,
	use: [requestOnlySessionMiddleware, orgMiddleware]
}, async (ctx) => {
	if (!await getOrgAdapter(ctx.context, options).findOrganizationBySlug(ctx.body.slug)) return ctx.json({ status: true });
	throw new APIError("BAD_REQUEST", { message: "slug is taken" });
});
const baseUpdateOrganizationSchema = z.object({
	name: z.string().min(1).meta({ description: "The name of the organization" }).optional(),
	slug: z.string().min(1).meta({ description: "The slug of the organization" }).optional(),
	logo: z.string().meta({ description: "The logo of the organization" }).optional(),
	metadata: z.record(z.string(), z.any()).meta({ description: "The metadata of the organization" }).optional()
});
const updateOrganization = (options) => {
	const additionalFieldsSchema = toZodSchema({
		fields: options?.schema?.organization?.additionalFields || {},
		isClientSide: true
	});
	return createAuthEndpoint("/organization/update", {
		method: "POST",
		body: z.object({
			data: z.object({
				...additionalFieldsSchema.shape,
				...baseUpdateOrganizationSchema.shape
			}).partial(),
			organizationId: z.string().meta({ description: "The organization ID. Eg: \"org-id\"" }).optional()
		}),
		requireHeaders: true,
		use: [orgMiddleware],
		metadata: {
			$Infer: { body: {} },
			openapi: {
				description: "Update an organization",
				responses: { "200": {
					description: "Success",
					content: { "application/json": { schema: {
						type: "object",
						description: "The updated organization",
						$ref: "#/components/schemas/Organization"
					} } }
				} }
			}
		}
	}, async (ctx) => {
		const session = await ctx.context.getSession(ctx);
		if (!session) throw new APIError("UNAUTHORIZED", { message: "User not found" });
		const organizationId = ctx.body.organizationId || session.session.activeOrganizationId;
		if (!organizationId) throw new APIError("BAD_REQUEST", { message: ORGANIZATION_ERROR_CODES.ORGANIZATION_NOT_FOUND });
		const adapter = getOrgAdapter(ctx.context, options);
		const member = await adapter.findMemberByOrgId({
			userId: session.user.id,
			organizationId
		});
		if (!member) throw new APIError("BAD_REQUEST", { message: ORGANIZATION_ERROR_CODES.USER_IS_NOT_A_MEMBER_OF_THE_ORGANIZATION });
		if (!await hasPermission({
			permissions: { organization: ["update"] },
			role: member.role,
			options: ctx.context.orgOptions,
			organizationId
		}, ctx)) throw new APIError("FORBIDDEN", { message: ORGANIZATION_ERROR_CODES.YOU_ARE_NOT_ALLOWED_TO_UPDATE_THIS_ORGANIZATION });
		if (typeof ctx.body.data.slug === "string") {
			const existingOrganization = await adapter.findOrganizationBySlug(ctx.body.data.slug);
			if (existingOrganization && existingOrganization.id !== organizationId) throw new APIError("BAD_REQUEST", { message: ORGANIZATION_ERROR_CODES.ORGANIZATION_SLUG_ALREADY_TAKEN });
		}
		if (options?.organizationHooks?.beforeUpdateOrganization) {
			const response = await options.organizationHooks.beforeUpdateOrganization({
				organization: ctx.body.data,
				user: session.user,
				member
			});
			if (response && typeof response === "object" && "data" in response) ctx.body.data = {
				...ctx.body.data,
				...response.data
			};
		}
		const updatedOrg = await adapter.updateOrganization(organizationId, ctx.body.data);
		if (options?.organizationHooks?.afterUpdateOrganization) await options.organizationHooks.afterUpdateOrganization({
			organization: updatedOrg,
			user: session.user,
			member
		});
		return ctx.json(updatedOrg);
	});
};
const deleteOrganizationBodySchema = z.object({ organizationId: z.string().meta({ description: "The organization id to delete" }) });
const deleteOrganization = (options) => {
	return createAuthEndpoint("/organization/delete", {
		method: "POST",
		body: deleteOrganizationBodySchema,
		requireHeaders: true,
		use: [orgMiddleware],
		metadata: { openapi: {
			description: "Delete an organization",
			responses: { "200": {
				description: "Success",
				content: { "application/json": { schema: {
					type: "string",
					description: "The organization id that was deleted"
				} } }
			} }
		} }
	}, async (ctx) => {
		if (ctx.context.orgOptions.organizationDeletion?.disabled || ctx.context.orgOptions.disableOrganizationDeletion) {
			if (ctx.context.orgOptions.organizationDeletion?.disabled) ctx.context.logger.info("`organizationDeletion.disabled` is deprecated. Use `disableOrganizationDeletion` instead");
			throw new APIError("NOT_FOUND", { message: "Organization deletion is disabled" });
		}
		const session = await ctx.context.getSession(ctx);
		if (!session) throw new APIError("UNAUTHORIZED", { status: 401 });
		const organizationId = ctx.body.organizationId;
		if (!organizationId) return ctx.json(null, {
			status: 400,
			body: { message: ORGANIZATION_ERROR_CODES.ORGANIZATION_NOT_FOUND }
		});
		const adapter = getOrgAdapter(ctx.context, options);
		const member = await adapter.findMemberByOrgId({
			userId: session.user.id,
			organizationId
		});
		if (!member) throw new APIError("BAD_REQUEST", { message: ORGANIZATION_ERROR_CODES.USER_IS_NOT_A_MEMBER_OF_THE_ORGANIZATION });
		if (!await hasPermission({
			role: member.role,
			permissions: { organization: ["delete"] },
			organizationId,
			options: ctx.context.orgOptions
		}, ctx)) throw new APIError("FORBIDDEN", { message: ORGANIZATION_ERROR_CODES.YOU_ARE_NOT_ALLOWED_TO_DELETE_THIS_ORGANIZATION });
		if (organizationId === session.session.activeOrganizationId)
 /**
		* If the organization is deleted, we set the active organization to null
		*/
		await adapter.setActiveOrganization(session.session.token, null, ctx);
		const org = await adapter.findOrganizationById(organizationId);
		if (!org) throw new APIError("BAD_REQUEST");
		if (options?.organizationHooks?.beforeDeleteOrganization) await options.organizationHooks.beforeDeleteOrganization({
			organization: org,
			user: session.user
		});
		await adapter.deleteOrganization(organizationId);
		if (options?.organizationHooks?.afterDeleteOrganization) await options.organizationHooks.afterDeleteOrganization({
			organization: org,
			user: session.user
		});
		return ctx.json(org);
	});
};
const getFullOrganizationQuerySchema = z.optional(z.object({
	organizationId: z.string().meta({ description: "The organization id to get" }).optional(),
	organizationSlug: z.string().meta({ description: "The organization slug to get" }).optional(),
	membersLimit: z.number().or(z.string().transform((val) => parseInt(val))).meta({ description: "The limit of members to get. By default, it uses the membershipLimit option which defaults to 100." }).optional()
}));
const getFullOrganization = (options) => createAuthEndpoint("/organization/get-full-organization", {
	method: "GET",
	query: getFullOrganizationQuerySchema,
	requireHeaders: true,
	use: [orgMiddleware, orgSessionMiddleware],
	metadata: { openapi: {
		operationId: "getOrganization",
		description: "Get the full organization",
		responses: { "200": {
			description: "Success",
			content: { "application/json": { schema: {
				type: "object",
				description: "The organization",
				$ref: "#/components/schemas/Organization"
			} } }
		} }
	} }
}, async (ctx) => {
	const session = ctx.context.session;
	const organizationId = ctx.query?.organizationSlug || ctx.query?.organizationId || session.session.activeOrganizationId;
	if (!organizationId) return ctx.json(null, { status: 200 });
	const adapter = getOrgAdapter(ctx.context, options);
	const organization = await adapter.findFullOrganization({
		organizationId,
		isSlug: !!ctx.query?.organizationSlug,
		includeTeams: ctx.context.orgOptions.teams?.enabled,
		membersLimit: ctx.query?.membersLimit
	});
	if (!organization) throw new APIError("BAD_REQUEST", { message: ORGANIZATION_ERROR_CODES.ORGANIZATION_NOT_FOUND });
	if (!await adapter.checkMembership({
		userId: session.user.id,
		organizationId: organization.id
	})) {
		await adapter.setActiveOrganization(session.session.token, null, ctx);
		throw new APIError("FORBIDDEN", { message: ORGANIZATION_ERROR_CODES.USER_IS_NOT_A_MEMBER_OF_THE_ORGANIZATION });
	}
	return ctx.json(organization);
});
const setActiveOrganizationBodySchema = z.object({
	organizationId: z.string().meta({ description: "The organization id to set as active. It can be null to unset the active organization. Eg: \"org-id\"" }).nullable().optional(),
	organizationSlug: z.string().meta({ description: "The organization slug to set as active. It can be null to unset the active organization if organizationId is not provided. Eg: \"org-slug\"" }).optional()
});
const setActiveOrganization = (options) => {
	return createAuthEndpoint("/organization/set-active", {
		method: "POST",
		body: setActiveOrganizationBodySchema,
		use: [orgSessionMiddleware, orgMiddleware],
		requireHeaders: true,
		metadata: { openapi: {
			operationId: "setActiveOrganization",
			description: "Set the active organization",
			responses: { "200": {
				description: "Success",
				content: { "application/json": { schema: {
					type: "object",
					description: "The organization",
					$ref: "#/components/schemas/Organization"
				} } }
			} }
		} }
	}, async (ctx) => {
		const adapter = getOrgAdapter(ctx.context, options);
		const session = ctx.context.session;
		let organizationId = ctx.body.organizationId;
		let organizationSlug = ctx.body.organizationSlug;
		if (organizationId === null) {
			if (!session.session.activeOrganizationId) return ctx.json(null);
			await setSessionCookie(ctx, {
				session: await adapter.setActiveOrganization(session.session.token, null, ctx),
				user: session.user
			});
			return ctx.json(null);
		}
		if (!organizationId && !organizationSlug) {
			const sessionOrgId = session.session.activeOrganizationId;
			if (!sessionOrgId) return ctx.json(null);
			organizationId = sessionOrgId;
		}
		if (organizationSlug && !organizationId) {
			const organization$1 = await adapter.findOrganizationBySlug(organizationSlug);
			if (!organization$1) throw new APIError("BAD_REQUEST", { message: ORGANIZATION_ERROR_CODES.ORGANIZATION_NOT_FOUND });
			organizationId = organization$1.id;
		}
		if (!organizationId) throw new APIError("BAD_REQUEST", { message: ORGANIZATION_ERROR_CODES.ORGANIZATION_NOT_FOUND });
		if (!await adapter.checkMembership({
			userId: session.user.id,
			organizationId
		})) {
			await adapter.setActiveOrganization(session.session.token, null, ctx);
			throw new APIError("FORBIDDEN", { message: ORGANIZATION_ERROR_CODES.USER_IS_NOT_A_MEMBER_OF_THE_ORGANIZATION });
		}
		let organization = await adapter.findOrganizationById(organizationId);
		if (!organization) throw new APIError("BAD_REQUEST", { message: ORGANIZATION_ERROR_CODES.ORGANIZATION_NOT_FOUND });
		await setSessionCookie(ctx, {
			session: await adapter.setActiveOrganization(session.session.token, organization.id, ctx),
			user: session.user
		});
		return ctx.json(organization);
	});
};
const listOrganizations = (options) => createAuthEndpoint("/organization/list", {
	method: "GET",
	use: [orgMiddleware, orgSessionMiddleware],
	requireHeaders: true,
	metadata: { openapi: {
		description: "List all organizations",
		responses: { "200": {
			description: "Success",
			content: { "application/json": { schema: {
				type: "array",
				items: { $ref: "#/components/schemas/Organization" }
			} } }
		} }
	} }
}, async (ctx) => {
	const organizations = await getOrgAdapter(ctx.context, options).listOrganizations(ctx.context.session.user.id);
	return ctx.json(organizations);
});

//#endregion
export { checkOrganizationSlug, createOrganization, deleteOrganization, getFullOrganization, listOrganizations, setActiveOrganization, updateOrganization };
//# sourceMappingURL=crud-org.mjs.map