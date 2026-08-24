import { APIError } from "better-call";

//#region src/plugins/oidc-provider/error.ts
var OIDCProviderError = class extends APIError {};
var InvalidRequest = class extends OIDCProviderError {
	constructor(error_description, error_detail) {
		super("BAD_REQUEST", {
			message: "invalid_request",
			error_description,
			error_detail
		});
	}
};

//#endregion
export { InvalidRequest };
//# sourceMappingURL=error.mjs.map