import { createFileRoute } from "@tanstack/react-router";
import { clientIp } from "./api.stacks.$slug";

const convexSiteUrl =
	process.env.VITE_CONVEX_SITE_URL || process.env.VITE_CONVEX_URL;

if (!convexSiteUrl) {
	throw new Error("VITE_CONVEX_SITE_URL is required for CLI proxy routes");
}

const convexOrigin = new URL(convexSiteUrl).origin;

/**
 * The shared secret that makes the client-address header trustworthy (#52).
 *
 * SERVER-ONLY, and the missing `VITE_` prefix is the reason: a `VITE_`-prefixed
 * name is inlined into the browser bundle, which would publish the secret to
 * every visitor and let anyone claim any address.
 *
 * Unset is a supported state, not a broken one — Convex then ignores the header
 * and falls back to its own rightmost hop at a much higher cap. See
 * `authStartBudget` in `convex/httpCli.ts` for why that cap must be high.
 */
const proxySecret = process.env.CLI_PROXY_SECRET;

/**
 * POST /api/cli/auth/start — a thin proxy to the Convex HTTP action.
 *
 * The body is forwarded because the CLI proposes a machine name in it (#49). An
 * older CLI sends nothing, and the Convex side treats an absent or unparseable
 * body as "no proposal" rather than an error.
 *
 * This route also carries the REAL CLIENT ADDRESS across to Convex (#52).
 * `authStart` is the abuse target on this surface — unauthenticated, one
 * `cliSessions` row per call — and it is the one CLI route where the caller has
 * no token to be charged against, so the address is the only thing left to key
 * a limit on. The header is set here unconditionally, which also overwrites any
 * copy a client tried to send.
 */
export const Route = createFileRoute("/api/cli/auth/start")({
	server: {
		handlers: {
			POST: async ({ request }) => {
				const body = await request.text();
				const headers: Record<string, string> = {
					"Content-Type": "application/json",
				};
				const ip = clientIp(request);
				// Both or neither. A claimed address with no secret beside it is
				// exactly what an attacker would send, so Convex ignores it — and
				// sending the secret alone would authenticate nothing.
				if (proxySecret && ip) {
					headers["x-aistack-client-ip"] = ip;
					headers["x-aistack-proxy-auth"] = proxySecret;
				}

				const resp = await fetch(`${convexOrigin}/api/cli/auth/start`, {
					method: "POST",
					headers,
					body,
				});
				return new Response(resp.body, {
					status: resp.status,
					headers: { "Content-Type": "application/json" },
				});
			},
		},
	},
});
