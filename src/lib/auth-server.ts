import { convexBetterAuthReactStart } from "@convex-dev/better-auth/react-start";

function requiredEnv(name: "VITE_CONVEX_URL" | "VITE_CONVEX_SITE_URL") {
	const value = process.env[name];
	if (!value) {
		throw new Error(`${name} is required`);
	}
	return value;
}

export const {
	handler,
	getToken,
	fetchAuthQuery,
	fetchAuthMutation,
	fetchAuthAction,
} = convexBetterAuthReactStart({
	convexUrl: requiredEnv("VITE_CONVEX_URL"),
	convexSiteUrl: requiredEnv("VITE_CONVEX_SITE_URL"),
});
