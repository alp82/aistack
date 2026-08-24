import { parseSetCookieHeader } from "../cookies/cookie-utils.mjs";
import "../cookies/index.mjs";
import { createAuthMiddleware } from "@better-auth/core/api";

//#region src/integrations/tanstack-start.ts
const tanstackStartCookies = () => {
	return {
		id: "tanstack-start-cookies",
		hooks: { after: [{
			matcher(ctx) {
				return true;
			},
			handler: createAuthMiddleware(async (ctx) => {
				const returned = ctx.context.responseHeaders;
				if ("_flag" in ctx && ctx._flag === "router") return;
				if (returned instanceof Headers) {
					const setCookies = returned?.get("set-cookie");
					if (!setCookies) return;
					const parsed = parseSetCookieHeader(setCookies);
					const { setCookie } = await import("@tanstack/react-start/server");
					parsed.forEach((value, key) => {
						if (!key) return;
						const opts = {
							sameSite: value.samesite,
							secure: value.secure,
							maxAge: value["max-age"],
							httpOnly: value.httponly,
							domain: value.domain,
							path: value.path
						};
						try {
							setCookie(key, decodeURIComponent(value.value), opts);
						} catch {}
					});
					return;
				}
			})
		}] }
	};
};

//#endregion
export { tanstackStartCookies };
//# sourceMappingURL=tanstack-start.mjs.map