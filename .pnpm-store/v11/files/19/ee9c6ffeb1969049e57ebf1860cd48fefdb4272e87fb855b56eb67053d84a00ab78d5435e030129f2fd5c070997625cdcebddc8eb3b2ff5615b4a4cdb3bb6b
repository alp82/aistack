//#region src/plugins/jwt/adapter.ts
const getJwksAdapter = (adapter, options) => {
	return {
		getAllKeys: async (ctx) => {
			if (options?.adapter?.getJwks) return await options.adapter.getJwks(ctx);
			return await adapter.findMany({ model: "jwks" });
		},
		getLatestKey: async (ctx) => {
			if (options?.adapter?.getJwks) return (await options.adapter.getJwks(ctx))?.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())[0];
			return (await adapter.findMany({ model: "jwks" }))?.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())[0];
		},
		createJwk: async (ctx, webKey) => {
			if (options?.adapter?.createJwk) return await options.adapter.createJwk(webKey, ctx);
			return await adapter.create({
				model: "jwks",
				data: {
					...webKey,
					createdAt: /* @__PURE__ */ new Date()
				}
			});
		}
	};
};

//#endregion
export { getJwksAdapter };
//# sourceMappingURL=adapter.mjs.map