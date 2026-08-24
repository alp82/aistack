import { getRequest, setResponse } from "./adapters/node/request.mjs";

//#region src/adapters/node/index.ts
function toNodeHandler(handler) {
	return async (req, res) => {
		return setResponse(res, await handler(getRequest({
			base: `${req.headers["x-forwarded-proto"] || (req.socket.encrypted ? "https" : "http")}://${req.headers[":authority"] || req.headers.host}`,
			request: req
		})));
	};
}

//#endregion
export { getRequest, setResponse, toNodeHandler };
//# sourceMappingURL=node.mjs.map