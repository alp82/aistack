function isTrustedProxy(trustProxy, remoteAddress) {
	if (trustProxy === void 0 || trustProxy === false) return false;
	if (trustProxy === true) return true;
	if (trustProxy === "loopback") return isLoopbackAddress(remoteAddress);
	if (remoteAddress === void 0) return false;
	if (trustProxy.includes(remoteAddress)) return true;
	const mapped = ipv4FromMapped(remoteAddress);
	return mapped !== void 0 && trustProxy.includes(mapped);
}
function ipv4FromMapped(address) {
	return address.startsWith("::ffff:") && address.includes(".") ? address.slice(7) : void 0;
}
function isLoopbackAddress(address) {
	return !!address && (address === "::1" || address.startsWith("127.") || address.startsWith("::ffff:127."));
}
const HOST_RE = /^(\[(?:[A-Fa-f0-9:.]+)\]|(?:[A-Za-z0-9_-]+\.)*[A-Za-z0-9_-]+|(?:\d{1,3}\.){3}\d{1,3})(:\d{1,5})?$/;
function forwardedHostHasPort(host) {
	const bracket = host.lastIndexOf("]");
	return bracket === -1 ? host.includes(":") : host.indexOf(":", bracket) !== -1;
}
function firstForwardedValue(value) {
	if (!value) return;
	return (Array.isArray(value) ? value[0] : value).split(",")[0].trim() || void 0;
}
const trustProxyPlugin = (server) => {
	const trustProxy = server.options.trustProxy;
	if (trustProxy === void 0 || trustProxy === false) return;
	server.options.middleware.unshift((request, next) => {
		applyTrustedProxy(request, trustProxy);
		return next();
	});
};
function applyTrustedProxy(request, trustProxy) {
	if (!isTrustedProxy(trustProxy, request.ip)) return;
	const headers = request.headers;
	const forwardedProto = firstForwardedValue(headers.get("x-forwarded-proto"));
	const forwardedHost = firstForwardedValue(headers.get("x-forwarded-host"));
	if (forwardedProto || forwardedHost) {
		const url = new URL(request.url);
		if (forwardedProto === "https" || forwardedProto === "http") url.protocol = `${forwardedProto}:`;
		if (forwardedHost && HOST_RE.test(forwardedHost)) {
			url.host = forwardedHost;
			if (url.port && !forwardedHostHasPort(forwardedHost)) url.port = "";
		}
		Object.defineProperty(request, "url", {
			value: url.href,
			enumerable: true,
			configurable: true
		});
	}
	const forwardedFor = firstForwardedValue(headers.get("x-forwarded-for"));
	if (forwardedFor) Object.defineProperty(request, "ip", {
		value: forwardedFor,
		enumerable: true,
		configurable: true
	});
}
export { HOST_RE, firstForwardedValue, isTrustedProxy, trustProxyPlugin };
