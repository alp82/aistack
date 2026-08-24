import { generateRandomString } from "../../crypto/random.mjs";
import "../../crypto/index.mjs";
import { setSessionCookie } from "../../cookies/index.mjs";
import { sessionMiddleware } from "../../api/routes/session.mjs";
import "../../api/index.mjs";
import { defaultKeyHasher } from "./utils.mjs";
import * as z from "zod";
import { createAuthEndpoint, createAuthMiddleware } from "@better-auth/core/api";

//#region src/plugins/one-time-token/index.ts
const verifyOneTimeTokenBodySchema = z.object({ token: z.string().meta({ description: "The token to verify. Eg: \"some-token\"" }) });
const oneTimeToken = (options) => {
	const opts = {
		storeToken: "plain",
		...options
	};
	async function storeToken(ctx, token) {
		if (opts.storeToken === "hashed") return await defaultKeyHasher(token);
		if (typeof opts.storeToken === "object" && "type" in opts.storeToken && opts.storeToken.type === "custom-hasher") return await opts.storeToken.hash(token);
		return token;
	}
	async function generateToken(c, session) {
		const token = opts?.generateToken ? await opts.generateToken(session, c) : generateRandomString(32);
		const expiresAt = new Date(Date.now() + (opts?.expiresIn ?? 3) * 60 * 1e3);
		const storedToken = await storeToken(c, token);
		await c.context.internalAdapter.createVerificationValue({
			value: session.session.token,
			identifier: `one-time-token:${storedToken}`,
			expiresAt
		});
		return token;
	}
	return {
		id: "one-time-token",
		endpoints: {
			generateOneTimeToken: createAuthEndpoint("/one-time-token/generate", {
				method: "GET",
				use: [sessionMiddleware]
			}, async (c) => {
				if (opts?.disableClientRequest && c.request) throw c.error("BAD_REQUEST", { message: "Client requests are disabled" });
				const session = c.context.session;
				const token = await generateToken(c, session);
				return c.json({ token });
			}),
			verifyOneTimeToken: createAuthEndpoint("/one-time-token/verify", {
				method: "POST",
				body: verifyOneTimeTokenBodySchema
			}, async (c) => {
				const { token } = c.body;
				const storedToken = await storeToken(c, token);
				const verificationValue = await c.context.internalAdapter.findVerificationValue(`one-time-token:${storedToken}`);
				if (!verificationValue) throw c.error("BAD_REQUEST", { message: "Invalid token" });
				await c.context.internalAdapter.deleteVerificationValue(verificationValue.id);
				if (verificationValue.expiresAt < /* @__PURE__ */ new Date()) throw c.error("BAD_REQUEST", { message: "Token expired" });
				const session = await c.context.internalAdapter.findSession(verificationValue.value);
				if (!session) throw c.error("BAD_REQUEST", { message: "Session not found" });
				if (!opts?.disableSetSessionCookie) await setSessionCookie(c, session);
				if (session.session.expiresAt < /* @__PURE__ */ new Date()) throw c.error("BAD_REQUEST", { message: "Session expired" });
				return c.json(session);
			})
		},
		hooks: { after: [{
			matcher: () => true,
			handler: createAuthMiddleware(async (ctx) => {
				if (ctx.context.newSession) {
					if (!opts?.setOttHeaderOnNewSession) return;
					const exposedHeaders = ctx.context.responseHeaders?.get("access-control-expose-headers") || "";
					const headersSet = new Set(exposedHeaders.split(",").map((header) => header.trim()).filter(Boolean));
					headersSet.add("set-ott");
					const token = await generateToken(ctx, ctx.context.newSession);
					ctx.setHeader("set-ott", token);
					ctx.setHeader("Access-Control-Expose-Headers", Array.from(headersSet).join(", "));
				}
			})
		}] },
		options
	};
};

//#endregion
export { oneTimeToken };
//# sourceMappingURL=index.mjs.map