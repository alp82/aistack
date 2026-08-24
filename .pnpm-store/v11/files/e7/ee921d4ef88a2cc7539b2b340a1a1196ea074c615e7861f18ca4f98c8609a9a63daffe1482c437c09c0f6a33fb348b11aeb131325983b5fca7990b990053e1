//#region src/plugins/jwt/client.ts
const jwtClient = (options) => {
	const jwksPath = options?.jwks?.jwksPath ?? "/jwks";
	return {
		id: "better-auth-client",
		$InferServerPlugin: {},
		pathMethods: { [jwksPath]: "GET" },
		getActions: ($fetch) => ({ jwks: async (fetchOptions) => {
			return await $fetch(jwksPath, {
				method: "GET",
				...fetchOptions
			});
		} })
	};
};

//#endregion
export { jwtClient };
//# sourceMappingURL=client.mjs.map