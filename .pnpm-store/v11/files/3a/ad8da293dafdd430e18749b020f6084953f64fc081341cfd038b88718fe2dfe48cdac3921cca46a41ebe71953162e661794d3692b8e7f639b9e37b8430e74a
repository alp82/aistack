//#region src/plugins/siwe/schema.ts
const schema = { walletAddress: { fields: {
	userId: {
		type: "string",
		references: {
			model: "user",
			field: "id"
		},
		required: true,
		index: true
	},
	address: {
		type: "string",
		required: true
	},
	chainId: {
		type: "number",
		required: true
	},
	isPrimary: {
		type: "boolean",
		defaultValue: false
	},
	createdAt: {
		type: "date",
		required: true
	}
} } };

//#endregion
export { schema };
//# sourceMappingURL=schema.mjs.map