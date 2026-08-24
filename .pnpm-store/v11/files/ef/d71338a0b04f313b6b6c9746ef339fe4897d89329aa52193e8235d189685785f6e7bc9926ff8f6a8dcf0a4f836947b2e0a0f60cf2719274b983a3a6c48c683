//#region src/plugins/anonymous/client.ts
const anonymousClient = () => {
	return {
		id: "anonymous",
		$InferServerPlugin: {},
		pathMethods: { "/sign-in/anonymous": "POST" },
		atomListeners: [{
			matcher: (path) => path === "/sign-in/anonymous",
			signal: "$sessionSignal"
		}]
	};
};

//#endregion
export { anonymousClient };
//# sourceMappingURL=client.mjs.map