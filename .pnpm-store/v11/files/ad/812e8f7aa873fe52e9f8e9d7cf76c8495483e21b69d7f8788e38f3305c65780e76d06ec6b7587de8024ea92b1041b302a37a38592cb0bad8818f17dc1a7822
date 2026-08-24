//#region src/plugins/multi-session/client.ts
const multiSessionClient = () => {
	return {
		id: "multi-session",
		$InferServerPlugin: {},
		atomListeners: [{
			matcher(path) {
				return path === "/multi-session/set-active";
			},
			signal: "$sessionSignal"
		}]
	};
};

//#endregion
export { multiSessionClient };
//# sourceMappingURL=client.mjs.map