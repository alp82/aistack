import { isDevelopment, isTest } from "@better-auth/core/env";
import * as z from "zod";

//#region src/utils/get-request-ip.ts
const LOCALHOST_IP = "127.0.0.1";
function getIp(req, options) {
	if (options.advanced?.ipAddress?.disableIpTracking) return null;
	const headers = "headers" in req ? req.headers : req;
	const ipHeaders = options.advanced?.ipAddress?.ipAddressHeaders || ["x-forwarded-for"];
	for (const key of ipHeaders) {
		const value = "get" in headers ? headers.get(key) : headers[key];
		if (typeof value === "string") {
			const ip = value.split(",")[0].trim();
			if (isValidIP(ip)) return ip;
		}
	}
	if (isTest() || isDevelopment()) return LOCALHOST_IP;
	return null;
}
function isValidIP(ip) {
	if (z.ipv4().safeParse(ip).success) return true;
	if (z.ipv6().safeParse(ip).success) return true;
	return false;
}

//#endregion
export { getIp };
//# sourceMappingURL=get-request-ip.mjs.map