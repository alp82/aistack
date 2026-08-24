import { generateId } from "../../utils/index.mjs";
import * as z from "zod";

//#region src/plugins/organization/schema.ts
const roleSchema = z.string();
const invitationStatus = z.enum([
	"pending",
	"accepted",
	"rejected",
	"canceled"
]).default("pending");
const organizationSchema = z.object({
	id: z.string().default(generateId),
	name: z.string(),
	slug: z.string(),
	logo: z.string().nullish().optional(),
	metadata: z.record(z.string(), z.unknown()).or(z.string().transform((v) => JSON.parse(v))).optional(),
	createdAt: z.date()
});
const memberSchema = z.object({
	id: z.string().default(generateId),
	organizationId: z.string(),
	userId: z.coerce.string(),
	role: roleSchema,
	createdAt: z.date().default(() => /* @__PURE__ */ new Date())
});
const invitationSchema = z.object({
	id: z.string().default(generateId),
	organizationId: z.string(),
	email: z.string(),
	role: roleSchema,
	status: invitationStatus,
	teamId: z.string().nullish(),
	inviterId: z.string(),
	expiresAt: z.date(),
	createdAt: z.date().default(() => /* @__PURE__ */ new Date())
});
const teamSchema = z.object({
	id: z.string().default(generateId),
	name: z.string().min(1),
	organizationId: z.string(),
	createdAt: z.date(),
	updatedAt: z.date().optional()
});
const teamMemberSchema = z.object({
	id: z.string().default(generateId),
	teamId: z.string(),
	userId: z.string(),
	createdAt: z.date().default(() => /* @__PURE__ */ new Date())
});
const organizationRoleSchema = z.object({
	id: z.string().default(generateId),
	organizationId: z.string(),
	role: z.string(),
	permission: z.record(z.string(), z.array(z.string())),
	createdAt: z.date().default(() => /* @__PURE__ */ new Date()),
	updatedAt: z.date().optional()
});
const defaultRoles = [
	"admin",
	"member",
	"owner"
];
const defaultRolesSchema = z.union([z.enum(defaultRoles), z.array(z.enum(defaultRoles))]);

//#endregion
export { teamSchema };
//# sourceMappingURL=schema.mjs.map