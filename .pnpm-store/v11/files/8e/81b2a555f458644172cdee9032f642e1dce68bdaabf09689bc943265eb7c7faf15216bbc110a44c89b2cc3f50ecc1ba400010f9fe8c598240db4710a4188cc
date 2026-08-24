//#region src/plugins/phone-number/client.ts
const phoneNumberClient = () => {
	return {
		id: "phoneNumber",
		$InferServerPlugin: {},
		atomListeners: [{
			matcher(path) {
				return path === "/phone-number/update" || path === "/phone-number/verify" || path === "/sign-in/phone-number";
			},
			signal: "$sessionSignal"
		}]
	};
};

//#endregion
export { phoneNumberClient };
//# sourceMappingURL=client.mjs.map