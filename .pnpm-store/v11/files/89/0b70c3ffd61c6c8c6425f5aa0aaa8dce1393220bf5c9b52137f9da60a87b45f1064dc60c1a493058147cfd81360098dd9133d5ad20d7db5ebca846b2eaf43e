import { getDate } from "../../../utils/date.mjs";
import { toZodSchema } from "../../../db/to-zod.mjs";
import "../../../db/index.mjs";
import { setSessionCookie } from "../../../cookies/index.mjs";
import { getSessionFromCtx } from "../../../api/routes/session.mjs";
import "../../../api/routes/index.mjs";
import { defaultRoles } from "../access/statement.mjs";
import { getOrgAdapter } from "../adapter.mjs";
import { orgMiddleware, orgSessionMiddleware } from "../call.mjs";
import { ORGANIZATION_ERROR_CODES } from "../error-codes.mjs";
import { hasPermission } from "../has-permission.mjs";
import { parseRoles } from "../organization.mjs";
import { BASE_ERROR_CODES } from "@better-auth/core/error";
import * as z from "zod";
import { APIError } from "better-call";
import { createAuthEndpoint } from "@better-auth/core/api";

//#region src/plugins/organization/routes/crud-invites.ts
const baseInvitationSchema = z.object({
	email: z.string().meta({ description: "The email address of the user to invite" }),
	role: z.union([z.string().meta({ description: "The role to assign to the user" }), z.array(z.string().meta({ description: "The roles to assign to the user" }))]).meta({ description: "The role(s) to assign to the user. It can be `admin`, `member`, owner. Eg: \"member\"" }),
	organizationId: z.string().meta({ description: "The organization ID to invite the user to" }).optional(),
	resend: z.boolean().meta({ description: "Resend the invitation email, if the user is already invited. Eg: true" }).optional(),
	teamId: z.union([z.string().meta({ description: "The team ID to invite the user to" }).optional(), z.array(z.string()).meta({ description: "The team IDs to invite the user to" }).optional()])
});
const createInvitation = (option) => {
	const additionalFieldsSchema = toZodSchema({
		fields: option?.schema?.invitation?.additionalFields || {},
		isClientSide: true
	});
	return createAuthEndpoint("/organization/invite-member", {
		method: "POST",
		requireHeaders: true,
		use: [orgMiddleware, orgSessionMiddleware],
		body: z.object({
			...baseInvitationSchema.shape,
			...additionalFieldsSchema.shape
		}),
		metadata: {
			$Infer: { body: {} },
			openapi: {
				operationId: "createOrganizationInvitation",
				description: "Create an invitation to an organization",
				responses: { "200": {
					description: "Success",
					content: { "application/json": { schema: {
						type: "object",
						properties: {
							id: { type: "string" },
							email: { type: "string" },
							role: { type: "string" },
							organizationId: { type: "string" },
							inviterId: { type: "string" },
							status: { type: "string" },
							expiresAt: { type: "string" },
							createdAt: { type: "string" }
						},
						required: [
							"id",
							"email",
							"role",
							"organizationId",
							"inviterId",
							"status",
							"expiresAt",
							"createdAt"
						]
					} } }
				} }
			}
		}
	}, async (ctx) => {
		const session = ctx.context.session;
		const organizationId = ctx.body.organizationId || session.session.activeOrganizationId;
		if (!organizationId) throw new APIError("BAD_REQUEST", { message: ORGANIZATION_ERROR_CODES.ORGANIZATION_NOT_FOUND });
		const email = ctx.body.email.toLowerCase();
		if (!z.email().safeParse(email).success) throw new APIError("BAD_REQUEST", { message: BASE_ERROR_CODES.INVALID_EMAIL });
		const adapter = getOrgAdapter(ctx.context, option);
		const member = await adapter.findMemberByOrgId({
			userId: session.user.id,
			organizationId
		});
		if (!member) throw new APIError("BAD_REQUEST", { message: ORGANIZATION_ERROR_CODES.MEMBER_NOT_FOUND });
		if (!await hasPermission({
			role: member.role,
			options: ctx.context.orgOptions,
			permissions: { invitation: ["create"] },
			organizationId
		}, ctx)) throw new APIError("FORBIDDEN", { message: ORGANIZATION_ERROR_CODES.YOU_ARE_NOT_ALLOWED_TO_INVITE_USERS_TO_THIS_ORGANIZATION });
		const creatorRole = ctx.context.orgOptions.creatorRole || "owner";
		const roles = parseRoles(ctx.body.role);
		const rolesArray = roles.split(",").map((r) => r.trim()).filter(Boolean);
		const defaults = Object.keys(defaultRoles);
		const customRoles = Object.keys(ctx.context.orgOptions.roles || {});
		const validStaticRoles = new Set([...defaults, ...customRoles]);
		const unknownRoles = rolesArray.filter((role) => !validStaticRoles.has(role));
		if (unknownRoles.length > 0) if (ctx.context.orgOptions.dynamicAccessControl?.enabled) {
			const foundRoleNames = (await ctx.context.adapter.findMany({
				model: "organizationRole",
				where: [{
					field: "organizationId",
					value: organizationId
				}, {
					field: "role",
					value: unknownRoles,
					operator: "in"
				}]
			})).map((r) => r.role);
			const stillInvalid = unknownRoles.filter((r) => !foundRoleNames.includes(r));
			if (stillInvalid.length > 0) throw new APIError("BAD_REQUEST", { message: `${ORGANIZATION_ERROR_CODES.ROLE_NOT_FOUND}: ${stillInvalid.join(", ")}` });
		} else throw new APIError("BAD_REQUEST", { message: `${ORGANIZATION_ERROR_CODES.ROLE_NOT_FOUND}: ${unknownRoles.join(", ")}` });
		if (member.role !== creatorRole && roles.split(",").includes(creatorRole)) throw new APIError("FORBIDDEN", { message: ORGANIZATION_ERROR_CODES.YOU_ARE_NOT_ALLOWED_TO_INVITE_USER_WITH_THIS_ROLE });
		if (await adapter.findMemberByEmail({
			email,
			organizationId
		})) throw new APIError("BAD_REQUEST", { message: ORGANIZATION_ERROR_CODES.USER_IS_ALREADY_A_MEMBER_OF_THIS_ORGANIZATION });
		const alreadyInvited = await adapter.findPendingInvitation({
			email,
			organizationId
		});
		if (alreadyInvited.length && !ctx.body.resend) throw new APIError("BAD_REQUEST", { message: ORGANIZATION_ERROR_CODES.USER_IS_ALREADY_INVITED_TO_THIS_ORGANIZATION });
		const organization = await adapter.findOrganizationById(organizationId);
		if (!organization) throw new APIError("BAD_REQUEST", { message: ORGANIZATION_ERROR_CODES.ORGANIZATION_NOT_FOUND });
		if (alreadyInvited.length && ctx.body.resend) {
			const existingInvitation = alreadyInvited[0];
			const newExpiresAt = getDate(ctx.context.orgOptions.invitationExpiresIn || 3600 * 48, "sec");
			await ctx.context.adapter.update({
				model: "invitation",
				where: [{
					field: "id",
					value: existingInvitation.id
				}],
				update: { expiresAt: newExpiresAt }
			});
			const updatedInvitation = {
				...existingInvitation,
				expiresAt: newExpiresAt
			};
			if (ctx.context.orgOptions.sendInvitationEmail) await ctx.context.runInBackgroundOrAwait(ctx.context.orgOptions.sendInvitationEmail({
				id: updatedInvitation.id,
				role: updatedInvitation.role,
				email: updatedInvitation.email.toLowerCase(),
				organization,
				inviter: {
					...member,
					user: session.user
				},
				invitation: updatedInvitation
			}, ctx.request));
			return ctx.json(updatedInvitation);
		}
		if (alreadyInvited.length && ctx.context.orgOptions.cancelPendingInvitationsOnReInvite) await adapter.updateInvitation({
			invitationId: alreadyInvited[0].id,
			status: "canceled"
		});
		const invitationLimit = typeof ctx.context.orgOptions.invitationLimit === "function" ? await ctx.context.orgOptions.invitationLimit({
			user: session.user,
			organization,
			member
		}, ctx.context) : ctx.context.orgOptions.invitationLimit ?? 100;
		if ((await adapter.findPendingInvitations({ organizationId })).length >= invitationLimit) throw new APIError("FORBIDDEN", { message: ORGANIZATION_ERROR_CODES.INVITATION_LIMIT_REACHED });
		if (ctx.context.orgOptions.teams && ctx.context.orgOptions.teams.enabled && typeof ctx.context.orgOptions.teams.maximumMembersPerTeam !== "undefined" && "teamId" in ctx.body && ctx.body.teamId) {
			const teamIds$1 = typeof ctx.body.teamId === "string" ? [ctx.body.teamId] : ctx.body.teamId;
			for (const teamId of teamIds$1) {
				const team = await adapter.findTeamById({
					teamId,
					organizationId,
					includeTeamMembers: true
				});
				if (!team) throw new APIError("BAD_REQUEST", { message: ORGANIZATION_ERROR_CODES.TEAM_NOT_FOUND });
				const maximumMembersPerTeam = typeof ctx.context.orgOptions.teams.maximumMembersPerTeam === "function" ? await ctx.context.orgOptions.teams.maximumMembersPerTeam({
					teamId,
					session,
					organizationId
				}) : ctx.context.orgOptions.teams.maximumMembersPerTeam;
				if (team.members.length >= maximumMembersPerTeam) throw new APIError("FORBIDDEN", { message: ORGANIZATION_ERROR_CODES.TEAM_MEMBER_LIMIT_REACHED });
			}
		}
		const teamIds = "teamId" in ctx.body ? typeof ctx.body.teamId === "string" ? [ctx.body.teamId] : ctx.body.teamId ?? [] : [];
		const { email: _, role: __, organizationId: ___, resend: ____, ...additionalFields } = ctx.body;
		let invitationData = {
			role: roles,
			email,
			organizationId,
			teamIds,
			...additionalFields ? additionalFields : {}
		};
		if (option?.organizationHooks?.beforeCreateInvitation) {
			const response = await option?.organizationHooks.beforeCreateInvitation({
				invitation: {
					...invitationData,
					inviterId: session.user.id,
					teamId: teamIds.length > 0 ? teamIds[0] : void 0
				},
				inviter: session.user,
				organization
			});
			if (response && typeof response === "object" && "data" in response) invitationData = {
				...invitationData,
				...response.data
			};
		}
		const invitation = await adapter.createInvitation({
			invitation: invitationData,
			user: session.user
		});
		if (ctx.context.orgOptions.sendInvitationEmail) await ctx.context.runInBackgroundOrAwait(ctx.context.orgOptions.sendInvitationEmail({
			id: invitation.id,
			role: invitation.role,
			email: invitation.email.toLowerCase(),
			organization,
			inviter: {
				...member,
				user: session.user
			},
			invitation
		}, ctx.request));
		if (option?.organizationHooks?.afterCreateInvitation) await option?.organizationHooks.afterCreateInvitation({
			invitation,
			inviter: session.user,
			organization
		});
		return ctx.json(invitation);
	});
};
const acceptInvitationBodySchema = z.object({ invitationId: z.string().meta({ description: "The ID of the invitation to accept" }) });
const acceptInvitation = (options) => createAuthEndpoint("/organization/accept-invitation", {
	method: "POST",
	body: acceptInvitationBodySchema,
	requireHeaders: true,
	use: [orgMiddleware, orgSessionMiddleware],
	metadata: { openapi: {
		description: "Accept an invitation to an organization",
		responses: { "200": {
			description: "Success",
			content: { "application/json": { schema: {
				type: "object",
				properties: {
					invitation: { type: "object" },
					member: { type: "object" }
				}
			} } }
		} }
	} }
}, async (ctx) => {
	const session = ctx.context.session;
	const adapter = getOrgAdapter(ctx.context, options);
	const invitation = await adapter.findInvitationById(ctx.body.invitationId);
	if (!invitation || invitation.expiresAt < /* @__PURE__ */ new Date() || invitation.status !== "pending") throw new APIError("BAD_REQUEST", { message: ORGANIZATION_ERROR_CODES.INVITATION_NOT_FOUND });
	if (invitation.email.toLowerCase() !== session.user.email.toLowerCase()) throw new APIError("FORBIDDEN", { message: ORGANIZATION_ERROR_CODES.YOU_ARE_NOT_THE_RECIPIENT_OF_THE_INVITATION });
	if (ctx.context.orgOptions.requireEmailVerificationOnInvitation && !session.user.emailVerified) throw new APIError("FORBIDDEN", { message: ORGANIZATION_ERROR_CODES.EMAIL_VERIFICATION_REQUIRED_BEFORE_ACCEPTING_OR_REJECTING_INVITATION });
	const membershipLimit = ctx.context.orgOptions?.membershipLimit || 100;
	if (await adapter.countMembers({ organizationId: invitation.organizationId }) >= membershipLimit) throw new APIError("FORBIDDEN", { message: ORGANIZATION_ERROR_CODES.ORGANIZATION_MEMBERSHIP_LIMIT_REACHED });
	const organization = await adapter.findOrganizationById(invitation.organizationId);
	if (!organization) throw new APIError("BAD_REQUEST", { message: ORGANIZATION_ERROR_CODES.ORGANIZATION_NOT_FOUND });
	if (options?.organizationHooks?.beforeAcceptInvitation) await options?.organizationHooks.beforeAcceptInvitation({
		invitation,
		user: session.user,
		organization
	});
	const acceptedI = await adapter.updateInvitation({
		invitationId: ctx.body.invitationId,
		status: "accepted"
	});
	if (!acceptedI) throw new APIError("BAD_REQUEST", { message: ORGANIZATION_ERROR_CODES.FAILED_TO_RETRIEVE_INVITATION });
	if (ctx.context.orgOptions.teams && ctx.context.orgOptions.teams.enabled && "teamId" in acceptedI && acceptedI.teamId) {
		const teamIds = acceptedI.teamId.split(",");
		const onlyOne = teamIds.length === 1;
		for (const teamId of teamIds) {
			await adapter.findOrCreateTeamMember({
				teamId,
				userId: session.user.id
			});
			if (typeof ctx.context.orgOptions.teams.maximumMembersPerTeam !== "undefined") {
				if (await adapter.countTeamMembers({ teamId }) >= (typeof ctx.context.orgOptions.teams.maximumMembersPerTeam === "function" ? await ctx.context.orgOptions.teams.maximumMembersPerTeam({
					teamId,
					session,
					organizationId: invitation.organizationId
				}) : ctx.context.orgOptions.teams.maximumMembersPerTeam)) throw new APIError("FORBIDDEN", { message: ORGANIZATION_ERROR_CODES.TEAM_MEMBER_LIMIT_REACHED });
			}
		}
		if (onlyOne) {
			const teamId = teamIds[0];
			await setSessionCookie(ctx, {
				session: await adapter.setActiveTeam(session.session.token, teamId, ctx),
				user: session.user
			});
		}
	}
	const member = await adapter.createMember({
		organizationId: invitation.organizationId,
		userId: session.user.id,
		role: invitation.role,
		createdAt: /* @__PURE__ */ new Date()
	});
	await adapter.setActiveOrganization(session.session.token, invitation.organizationId, ctx);
	if (!acceptedI) return ctx.json(null, {
		status: 400,
		body: { message: ORGANIZATION_ERROR_CODES.INVITATION_NOT_FOUND }
	});
	if (options?.organizationHooks?.afterAcceptInvitation) await options?.organizationHooks.afterAcceptInvitation({
		invitation: acceptedI,
		member,
		user: session.user,
		organization
	});
	return ctx.json({
		invitation: acceptedI,
		member
	});
});
const rejectInvitationBodySchema = z.object({ invitationId: z.string().meta({ description: "The ID of the invitation to reject" }) });
const rejectInvitation = (options) => createAuthEndpoint("/organization/reject-invitation", {
	method: "POST",
	body: rejectInvitationBodySchema,
	requireHeaders: true,
	use: [orgMiddleware, orgSessionMiddleware],
	metadata: { openapi: {
		description: "Reject an invitation to an organization",
		responses: { "200": {
			description: "Success",
			content: { "application/json": { schema: {
				type: "object",
				properties: {
					invitation: { type: "object" },
					member: {
						type: "object",
						nullable: true
					}
				}
			} } }
		} }
	} }
}, async (ctx) => {
	const session = ctx.context.session;
	const adapter = getOrgAdapter(ctx.context, ctx.context.orgOptions);
	const invitation = await adapter.findInvitationById(ctx.body.invitationId);
	if (!invitation || invitation.expiresAt < /* @__PURE__ */ new Date() || invitation.status !== "pending") throw new APIError("BAD_REQUEST", { message: "Invitation not found!" });
	if (invitation.email.toLowerCase() !== session.user.email.toLowerCase()) throw new APIError("FORBIDDEN", { message: ORGANIZATION_ERROR_CODES.YOU_ARE_NOT_THE_RECIPIENT_OF_THE_INVITATION });
	if (ctx.context.orgOptions.requireEmailVerificationOnInvitation && !session.user.emailVerified) throw new APIError("FORBIDDEN", { message: ORGANIZATION_ERROR_CODES.EMAIL_VERIFICATION_REQUIRED_BEFORE_ACCEPTING_OR_REJECTING_INVITATION });
	const organization = await adapter.findOrganizationById(invitation.organizationId);
	if (!organization) throw new APIError("BAD_REQUEST", { message: ORGANIZATION_ERROR_CODES.ORGANIZATION_NOT_FOUND });
	if (options?.organizationHooks?.beforeRejectInvitation) await options?.organizationHooks.beforeRejectInvitation({
		invitation,
		user: session.user,
		organization
	});
	const rejectedI = await adapter.updateInvitation({
		invitationId: ctx.body.invitationId,
		status: "rejected"
	});
	if (options?.organizationHooks?.afterRejectInvitation) await options?.organizationHooks.afterRejectInvitation({
		invitation: rejectedI || invitation,
		user: session.user,
		organization
	});
	return ctx.json({
		invitation: rejectedI,
		member: null
	});
});
const cancelInvitationBodySchema = z.object({ invitationId: z.string().meta({ description: "The ID of the invitation to cancel" }) });
const cancelInvitation = (options) => createAuthEndpoint("/organization/cancel-invitation", {
	method: "POST",
	body: cancelInvitationBodySchema,
	requireHeaders: true,
	use: [orgMiddleware, orgSessionMiddleware],
	openapi: {
		operationId: "cancelOrganizationInvitation",
		description: "Cancel an invitation to an organization",
		responses: { "200": {
			description: "Success",
			content: { "application/json": { schema: {
				type: "object",
				properties: { invitation: { type: "object" } }
			} } }
		} }
	}
}, async (ctx) => {
	const session = ctx.context.session;
	const adapter = getOrgAdapter(ctx.context, options);
	const invitation = await adapter.findInvitationById(ctx.body.invitationId);
	if (!invitation) throw new APIError("BAD_REQUEST", { message: ORGANIZATION_ERROR_CODES.INVITATION_NOT_FOUND });
	const member = await adapter.findMemberByOrgId({
		userId: session.user.id,
		organizationId: invitation.organizationId
	});
	if (!member) throw new APIError("BAD_REQUEST", { message: ORGANIZATION_ERROR_CODES.MEMBER_NOT_FOUND });
	if (!await hasPermission({
		role: member.role,
		options: ctx.context.orgOptions,
		permissions: { invitation: ["cancel"] },
		organizationId: invitation.organizationId
	}, ctx)) throw new APIError("FORBIDDEN", { message: ORGANIZATION_ERROR_CODES.YOU_ARE_NOT_ALLOWED_TO_CANCEL_THIS_INVITATION });
	const organization = await adapter.findOrganizationById(invitation.organizationId);
	if (!organization) throw new APIError("BAD_REQUEST", { message: ORGANIZATION_ERROR_CODES.ORGANIZATION_NOT_FOUND });
	if (options?.organizationHooks?.beforeCancelInvitation) await options?.organizationHooks.beforeCancelInvitation({
		invitation,
		cancelledBy: session.user,
		organization
	});
	const canceledI = await adapter.updateInvitation({
		invitationId: ctx.body.invitationId,
		status: "canceled"
	});
	if (options?.organizationHooks?.afterCancelInvitation) await options?.organizationHooks.afterCancelInvitation({
		invitation: canceledI || invitation,
		cancelledBy: session.user,
		organization
	});
	return ctx.json(canceledI);
});
const getInvitationQuerySchema = z.object({ id: z.string().meta({ description: "The ID of the invitation to get" }) });
const getInvitation = (options) => createAuthEndpoint("/organization/get-invitation", {
	method: "GET",
	use: [orgMiddleware],
	requireHeaders: true,
	query: getInvitationQuerySchema,
	metadata: { openapi: {
		description: "Get an invitation by ID",
		responses: { "200": {
			description: "Success",
			content: { "application/json": { schema: {
				type: "object",
				properties: {
					id: { type: "string" },
					email: { type: "string" },
					role: { type: "string" },
					organizationId: { type: "string" },
					inviterId: { type: "string" },
					status: { type: "string" },
					expiresAt: { type: "string" },
					organizationName: { type: "string" },
					organizationSlug: { type: "string" },
					inviterEmail: { type: "string" }
				},
				required: [
					"id",
					"email",
					"role",
					"organizationId",
					"inviterId",
					"status",
					"expiresAt",
					"organizationName",
					"organizationSlug",
					"inviterEmail"
				]
			} } }
		} }
	} }
}, async (ctx) => {
	const session = await getSessionFromCtx(ctx);
	if (!session) throw new APIError("UNAUTHORIZED", { message: "Not authenticated" });
	const adapter = getOrgAdapter(ctx.context, options);
	const invitation = await adapter.findInvitationById(ctx.query.id);
	if (!invitation || invitation.status !== "pending" || invitation.expiresAt < /* @__PURE__ */ new Date()) throw new APIError("BAD_REQUEST", { message: "Invitation not found!" });
	if (invitation.email.toLowerCase() !== session.user.email.toLowerCase()) throw new APIError("FORBIDDEN", { message: ORGANIZATION_ERROR_CODES.YOU_ARE_NOT_THE_RECIPIENT_OF_THE_INVITATION });
	const organization = await adapter.findOrganizationById(invitation.organizationId);
	if (!organization) throw new APIError("BAD_REQUEST", { message: ORGANIZATION_ERROR_CODES.ORGANIZATION_NOT_FOUND });
	const member = await adapter.findMemberByOrgId({
		userId: invitation.inviterId,
		organizationId: invitation.organizationId
	});
	if (!member) throw new APIError("BAD_REQUEST", { message: ORGANIZATION_ERROR_CODES.INVITER_IS_NO_LONGER_A_MEMBER_OF_THE_ORGANIZATION });
	return ctx.json({
		...invitation,
		organizationName: organization.name,
		organizationSlug: organization.slug,
		inviterEmail: member.user.email
	});
});
const listInvitationQuerySchema = z.object({ organizationId: z.string().meta({ description: "The ID of the organization to list invitations for" }).optional() }).optional();
const listInvitations = (options) => createAuthEndpoint("/organization/list-invitations", {
	method: "GET",
	requireHeaders: true,
	use: [orgMiddleware, orgSessionMiddleware],
	query: listInvitationQuerySchema
}, async (ctx) => {
	const session = await getSessionFromCtx(ctx);
	if (!session) throw new APIError("UNAUTHORIZED", { message: "Not authenticated" });
	const orgId = ctx.query?.organizationId || session.session.activeOrganizationId;
	if (!orgId) throw new APIError("BAD_REQUEST", { message: "Organization ID is required" });
	const adapter = getOrgAdapter(ctx.context, options);
	if (!await adapter.findMemberByOrgId({
		userId: session.user.id,
		organizationId: orgId
	})) throw new APIError("FORBIDDEN", { message: "You are not a member of this organization" });
	const invitations = await adapter.listInvitations({ organizationId: orgId });
	return ctx.json(invitations);
});
/**
* List all invitations a user has received
*/
const listUserInvitations = (options) => createAuthEndpoint("/organization/list-user-invitations", {
	method: "GET",
	use: [orgMiddleware],
	query: z.object({ email: z.string().meta({ description: "The email of the user to list invitations for. This only works for server side API calls." }).optional() }).optional(),
	metadata: { openapi: {
		description: "List all invitations a user has received",
		responses: { "200": {
			description: "Success",
			content: { "application/json": { schema: {
				type: "array",
				items: {
					type: "object",
					properties: {
						id: { type: "string" },
						email: { type: "string" },
						role: { type: "string" },
						organizationId: { type: "string" },
						organizationName: { type: "string" },
						inviterId: {
							type: "string",
							description: "The ID of the user who created the invitation"
						},
						teamId: {
							type: "string",
							description: "The ID of the team associated with the invitation",
							nullable: true
						},
						status: { type: "string" },
						expiresAt: { type: "string" },
						createdAt: { type: "string" }
					},
					required: [
						"id",
						"email",
						"role",
						"organizationId",
						"organizationName",
						"inviterId",
						"status",
						"expiresAt",
						"createdAt"
					]
				}
			} } }
		} }
	} }
}, async (ctx) => {
	const session = await getSessionFromCtx(ctx);
	if (ctx.request && ctx.query?.email) throw new APIError("BAD_REQUEST", { message: "User email cannot be passed for client side API calls." });
	const userEmail = session?.user.email || ctx.query?.email;
	if (!userEmail) throw new APIError("BAD_REQUEST", { message: "Missing session headers, or email query parameter." });
	const invitations = await getOrgAdapter(ctx.context, options).listUserInvitations(userEmail);
	return ctx.json(invitations);
});

//#endregion
export { acceptInvitation, cancelInvitation, createInvitation, getInvitation, listInvitations, listUserInvitations, rejectInvitation };
//# sourceMappingURL=crud-invites.mjs.map