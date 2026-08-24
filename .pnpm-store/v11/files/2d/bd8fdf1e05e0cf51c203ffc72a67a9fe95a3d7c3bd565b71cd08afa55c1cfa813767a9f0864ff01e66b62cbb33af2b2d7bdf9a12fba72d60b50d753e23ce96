import { createAuthMiddleware } from "@better-auth/core/api";

//#region src/plugins/last-login-method/index.ts
/**
* Plugin to track the last used login method
*/
const lastLoginMethod = (userConfig) => {
	const paths = [
		"/callback/:id",
		"/oauth2/callback/:providerId",
		"/sign-in/email",
		"/sign-up/email"
	];
	const defaultResolveMethod = (ctx) => {
		if (paths.includes(ctx.path)) return ctx.params?.id || ctx.params?.providerId || ctx.path.split("/").pop();
		if (ctx.path.includes("siwe")) return "siwe";
		if (ctx.path.includes("/passkey/verify-authentication")) return "passkey";
		return null;
	};
	const config = {
		cookieName: "better-auth.last_used_login_method",
		maxAge: 3600 * 24 * 30,
		...userConfig
	};
	return {
		id: "last-login-method",
		init(ctx) {
			return { options: { databaseHooks: {
				user: { create: { async before(user, context) {
					if (!config.storeInDatabase) return;
					if (!context) return;
					const lastUsedLoginMethod = config.customResolveMethod?.(context) ?? defaultResolveMethod(context);
					if (lastUsedLoginMethod) return { data: {
						...user,
						lastLoginMethod: lastUsedLoginMethod
					} };
				} } },
				session: { create: { async after(session, context) {
					if (!config.storeInDatabase) return;
					if (!context) return;
					const lastUsedLoginMethod = config.customResolveMethod?.(context) ?? defaultResolveMethod(context);
					if (lastUsedLoginMethod && session?.userId) try {
						await ctx.internalAdapter.updateUser(session.userId, { lastLoginMethod: lastUsedLoginMethod });
					} catch (error) {
						ctx.logger.error("Failed to update lastLoginMethod", error);
					}
				} } }
			} } };
		},
		hooks: { after: [{
			matcher() {
				return true;
			},
			handler: createAuthMiddleware(async (ctx) => {
				const lastUsedLoginMethod = config.customResolveMethod?.(ctx) ?? defaultResolveMethod(ctx);
				if (lastUsedLoginMethod) {
					const setCookie = ctx.context.responseHeaders?.get("set-cookie");
					const sessionTokenName = ctx.context.authCookies.sessionToken.name;
					if (setCookie && setCookie.includes(sessionTokenName)) {
						const cookieAttributes = {
							...ctx.context.authCookies.sessionToken.options,
							maxAge: config.maxAge,
							httpOnly: false
						};
						ctx.setCookie(config.cookieName, lastUsedLoginMethod, cookieAttributes);
					}
				}
			})
		}] },
		schema: config.storeInDatabase ? { user: { fields: { lastLoginMethod: {
			type: "string",
			input: false,
			required: false,
			fieldName: config.schema?.user?.lastLoginMethod || "lastLoginMethod"
		} } } } : void 0,
		options: userConfig
	};
};

//#endregion
export { lastLoginMethod };
//# sourceMappingURL=index.mjs.map