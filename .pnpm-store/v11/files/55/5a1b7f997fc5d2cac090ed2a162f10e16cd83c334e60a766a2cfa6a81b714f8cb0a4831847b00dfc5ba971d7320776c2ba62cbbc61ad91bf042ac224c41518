import { NodeWorkerEnvRunner } from "./node-worker-runner.mjs";
import { fileURLToPath } from "node:url";
import { randomBytes } from "node:crypto";
let _warned = false;
function warnIfVercelOidcTokenInvalid(token) {
	const result = _checkVercelOidcToken(token);
	if (_warned) return result;
	if (result.status === "missing") {
		_warned = true;
		console.warn(`\x1B[90m[env-runner]\x1B[39m \x1B[33mVERCEL_OIDC_TOKEN\x1B[39m is not set. Run \x1B[36mvercel env pull\x1B[39m to pull the latest environment variables.`);
	} else if (result.status === "expired") {
		_warned = true;
		console.warn(`\x1B[90m[env-runner]\x1B[39m \x1B[33mVERCEL_OIDC_TOKEN\x1B[39m expired at ${result.expiresAt.toISOString()}. Run \x1B[36mvercel env pull\x1B[39m to pull a fresh OIDC token.`);
	} else if (result.status === "invalid") {
		_warned = true;
		console.warn(`\x1B[90m[env-runner]\x1B[39m \x1B[33mVERCEL_OIDC_TOKEN\x1B[39m is malformed (not a valid JWT). Run \x1B[36mvercel env pull\x1B[39m to pull a valid OIDC token.`);
	}
	return result;
}
function _checkVercelOidcToken(token = process.env.VERCEL_OIDC_TOKEN) {
	if (!token) return { status: "missing" };
	const parts = token.split(".");
	if (parts.length !== 3) return { status: "invalid" };
	let payload;
	try {
		const json = Buffer.from(parts[1], "base64url").toString("utf8");
		payload = JSON.parse(json);
	} catch {
		return { status: "invalid" };
	}
	if (!payload || typeof payload !== "object") return { status: "invalid" };
	const exp = payload.exp;
	if (typeof exp !== "number" || !Number.isFinite(exp)) return { status: "invalid" };
	const expiresAt = /* @__PURE__ */ new Date(exp * 1e3);
	if (expiresAt.getTime() <= Date.now()) return {
		status: "expired",
		expiresAt
	};
	return {
		status: "valid",
		expiresAt
	};
}
let _defaultEntry;
const _podId = Math.random().toString(32).slice(-5);
function generateVercelId() {
	const timestamp = Date.now().toString(36);
	const random = randomBytes(6).toString("hex");
	return `dev1::${_podId}-${timestamp}-${random}`;
}
var VercelEnvRunner = class extends NodeWorkerEnvRunner {
	constructor(opts) {
		_defaultEntry ||= fileURLToPath(import.meta.resolve("env-runner/runners/vercel/worker"));
		super({
			...opts,
			workerEntry: opts.workerEntry || _defaultEntry
		});
		warnIfVercelOidcTokenInvalid();
	}
	async fetch(input, init) {
		input = this._resolveFetchInput(input);
		const headers = new Headers(input instanceof Request ? input.headers : init?.headers);
		const requestId = generateVercelId();
		if (this._address && this._address.port != null && !headers.has("x-vercel-deployment-url")) {
			const host = this._address.host || "127.0.0.1";
			headers.set("x-vercel-deployment-url", `http://${host}:${this._address.port}`);
		}
		if (!headers.has("x-vercel-id")) headers.set("x-vercel-id", requestId);
		const clientIp = headers.get("x-forwarded-for")?.split(",")[0]?.trim() || headers.get("x-real-ip") || "127.0.0.1";
		if (!headers.has("x-vercel-forwarded-for")) headers.set("x-vercel-forwarded-for", clientIp);
		if (!headers.has("x-forwarded-for")) headers.set("x-forwarded-for", clientIp);
		if (!headers.has("x-real-ip")) headers.set("x-real-ip", clientIp);
		try {
			const url = new URL(input instanceof Request ? input.url : input.toString());
			if (!headers.has("x-forwarded-proto")) headers.set("x-forwarded-proto", url.protocol.replace(":", ""));
			if (!headers.has("x-forwarded-host")) headers.set("x-forwarded-host", headers.get("host") || url.host);
		} catch {}
		const res = await super.fetch(input, {
			...init,
			headers
		});
		const resHeaders = new Headers(res.headers);
		if (!resHeaders.has("server")) resHeaders.set("server", "Vercel");
		if (!resHeaders.has("x-vercel-id")) resHeaders.set("x-vercel-id", requestId);
		if (!resHeaders.has("x-vercel-cache")) resHeaders.set("x-vercel-cache", "MISS");
		return new Response(res.body, {
			status: res.status,
			statusText: res.statusText,
			headers: resHeaders
		});
	}
	_runtimeType() {
		return "vercel";
	}
};
export { VercelEnvRunner };
