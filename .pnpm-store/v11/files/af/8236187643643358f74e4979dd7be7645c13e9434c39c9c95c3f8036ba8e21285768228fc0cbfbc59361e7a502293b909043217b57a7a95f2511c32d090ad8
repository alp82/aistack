import { APIError, BetterCallError, ValidationError, hideInternalStackFrames, makeErrorForHideStackFrame, statusCodes } from "./error.mjs";
import { createFetch } from "@better-fetch/fetch";

//#region src/client.ts
const createClient = (options) => {
	const fetch = createFetch(options);
	return async (path, ...options$1) => {
		return await fetch(path, { ...options$1[0] });
	};
};

//#endregion
export { APIError, BetterCallError, ValidationError, createClient, hideInternalStackFrames, makeErrorForHideStackFrame, statusCodes };
//# sourceMappingURL=client.mjs.map