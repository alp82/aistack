const require_rolldown_runtime = require('./_virtual/rolldown_runtime.cjs');
const require_error = require('./error.cjs');
let __better_fetch_fetch = require("@better-fetch/fetch");

//#region src/client.ts
const createClient = (options) => {
	const fetch = (0, __better_fetch_fetch.createFetch)(options);
	return async (path, ...options$1) => {
		return await fetch(path, { ...options$1[0] });
	};
};

//#endregion
exports.APIError = require_error.APIError;
exports.BetterCallError = require_error.BetterCallError;
exports.ValidationError = require_error.ValidationError;
exports.createClient = createClient;
exports.hideInternalStackFrames = require_error.hideInternalStackFrames;
exports.makeErrorForHideStackFrame = require_error.makeErrorForHideStackFrame;
exports.statusCodes = require_error.statusCodes;
//# sourceMappingURL=client.cjs.map