//#region src/utils/shim.ts
const shimContext = (originalObject, newContext) => {
	const shimmedObj = {};
	for (const [key, value] of Object.entries(originalObject)) {
		shimmedObj[key] = (ctx) => {
			return value({
				...ctx,
				context: {
					...newContext,
					...ctx.context
				}
			});
		};
		shimmedObj[key].path = value.path;
		shimmedObj[key].method = value.method;
		shimmedObj[key].options = value.options;
		shimmedObj[key].headers = value.headers;
	}
	return shimmedObj;
};

//#endregion
export { shimContext };
//# sourceMappingURL=shim.mjs.map