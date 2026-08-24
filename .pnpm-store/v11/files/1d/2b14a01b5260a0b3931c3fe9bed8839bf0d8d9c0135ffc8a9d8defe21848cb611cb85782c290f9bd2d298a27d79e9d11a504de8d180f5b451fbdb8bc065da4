const require_request = require('./adapters/node/request.cjs');

//#region src/adapters/node/index.ts
function toNodeHandler(handler) {
	return async (req, res) => {
		return require_request.setResponse(res, await handler(require_request.getRequest({
			base: `${req.headers["x-forwarded-proto"] || (req.socket.encrypted ? "https" : "http")}://${req.headers[":authority"] || req.headers.host}`,
			request: req
		})));
	};
}

//#endregion
exports.getRequest = require_request.getRequest;
exports.setResponse = require_request.setResponse;
exports.toNodeHandler = toNodeHandler;
//# sourceMappingURL=node.cjs.map