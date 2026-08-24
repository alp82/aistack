//#region src/plugins/last-login-method/client.ts
function getCookieValue(name) {
	if (typeof document === "undefined") return null;
	const cookie = document.cookie.split("; ").find((row) => row.startsWith(`${name}=`));
	return cookie ? cookie.split("=")[1] : null;
}
/**
* Client-side plugin to retrieve the last used login method
*/
const lastLoginMethodClient = (config = {}) => {
	const cookieName = config.cookieName || "better-auth.last_used_login_method";
	return {
		id: "last-login-method-client",
		getActions() {
			return {
				getLastUsedLoginMethod: () => {
					return getCookieValue(cookieName);
				},
				clearLastUsedLoginMethod: () => {
					if (typeof document !== "undefined") document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
				},
				isLastUsedLoginMethod: (method) => {
					return getCookieValue(cookieName) === method;
				}
			};
		}
	};
};

//#endregion
export { lastLoginMethodClient };
//# sourceMappingURL=client.mjs.map