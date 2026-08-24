//#region src/plugins/username/client.ts
const usernameClient = () => {
	return {
		id: "username",
		$InferServerPlugin: {},
		atomListeners: [{
			matcher: (path) => path === "/sign-in/username",
			signal: "$sessionSignal"
		}]
	};
};

//#endregion
export { usernameClient };
//# sourceMappingURL=client.mjs.map