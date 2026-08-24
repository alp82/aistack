//#region src/plugins/email-otp/client.ts
const emailOTPClient = () => {
	return {
		id: "email-otp",
		$InferServerPlugin: {},
		atomListeners: [{
			matcher: (path) => path === "/email-otp/verify-email" || path === "/sign-in/email-otp",
			signal: "$sessionSignal"
		}]
	};
};

//#endregion
export { emailOTPClient };
//# sourceMappingURL=client.mjs.map