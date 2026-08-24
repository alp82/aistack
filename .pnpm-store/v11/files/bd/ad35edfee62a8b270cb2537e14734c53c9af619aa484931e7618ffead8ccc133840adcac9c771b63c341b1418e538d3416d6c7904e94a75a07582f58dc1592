//#region src/plugins/two-factor/schema.ts
const schema = {
	user: { fields: { twoFactorEnabled: {
		type: "boolean",
		required: false,
		defaultValue: false,
		input: false
	} } },
	twoFactor: { fields: {
		secret: {
			type: "string",
			required: true,
			returned: false,
			index: true
		},
		backupCodes: {
			type: "string",
			required: true,
			returned: false
		},
		userId: {
			type: "string",
			required: true,
			returned: false,
			references: {
				model: "user",
				field: "id"
			},
			index: true
		}
	} }
};

//#endregion
export { schema };
//# sourceMappingURL=schema.mjs.map