import * as z from "zod";

//#region src/plugins/device-authorization/schema.ts
const schema = { deviceCode: { fields: {
	deviceCode: {
		type: "string",
		required: true
	},
	userCode: {
		type: "string",
		required: true
	},
	userId: {
		type: "string",
		required: false
	},
	expiresAt: {
		type: "date",
		required: true
	},
	status: {
		type: "string",
		required: true
	},
	lastPolledAt: {
		type: "date",
		required: false
	},
	pollingInterval: {
		type: "number",
		required: false
	},
	clientId: {
		type: "string",
		required: false
	},
	scope: {
		type: "string",
		required: false
	}
} } };
z.object({
	id: z.string(),
	deviceCode: z.string(),
	userCode: z.string(),
	userId: z.string().optional(),
	expiresAt: z.date(),
	status: z.string(),
	lastPolledAt: z.date().optional(),
	pollingInterval: z.number().optional(),
	clientId: z.string().optional(),
	scope: z.string().optional()
});

//#endregion
export { schema };
//# sourceMappingURL=schema.mjs.map