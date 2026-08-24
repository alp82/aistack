import { resolveCertOrKey } from "./_chunks/_utils2.mjs";
function mtls(options = {}) {
	return (server) => {
		if (server.runtime !== "node") throw new Error(`[srvx] mtls() requires srvx's Node.js adapter (import { serve } from "srvx/node"). The "${server.runtime}" server cannot request or expose client certificates.`);
		if ("Bun" in globalThis) throw new Error("[srvx] mtls() is not available on Bun: Bun does not expose the peer certificate to node:http(s) request handlers. See https://github.com/oven-sh/bun/issues/16254");
		if (server.options.protocol === "http" || !server.options.tls?.cert || !server.options.tls?.key) throw new Error("[srvx] mtls() requires an HTTPS server: set `tls.cert` and `tls.key`. Mutual TLS cannot run over plain HTTP.");
		let ca;
		if (options.ca !== void 0) ca = (Array.isArray(options.ca) ? options.ca : [options.ca]).map((entry) => {
			const resolved = resolveCertOrKey(entry);
			if (!resolved) throw new TypeError("mtls() `ca` entries must be non-empty PEM strings or file paths.");
			return resolved;
		});
		server.options.node = {
			...server.options.node,
			...ca ? { ca } : {},
			requestCert: options.requestCert ?? true,
			...options.rejectUnauthorized === void 0 ? {} : { rejectUnauthorized: options.rejectUnauthorized }
		};
		server.options.middleware.unshift((request, next) => {
			const socket = request.runtime?.node?.req?.socket;
			if (socket && typeof socket.getPeerCertificate === "function") request.tls = {
				peerCertificate: socket.getPeerCertificate(),
				authorized: socket.authorized,
				authorizationError: socket.authorizationError ?? void 0,
				protocol: socket.getProtocol?.() ?? void 0,
				cipher: socket.getCipher?.()
			};
			return next();
		});
	};
}
export { mtls };
