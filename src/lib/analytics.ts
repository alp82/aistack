// Client-side product events (#77, map #76).
//
// Three of the seven events fire here; the other four fire server-side, because
// the browser cannot honestly observe a signup completing, a CLI storing a
// token, a first sync landing, or a machine turning auto-sync on.
//
// Nothing in the app ever READS these back. PostHog is the funnel, not a data
// source - every number the product displays comes from Convex.

import posthog from "posthog-js";

/**
 * PostHog mounts on browser idle, up to 2s late
 * (`src/integrations/posthog/provider.tsx`). An event fired before that is
 * dropped.
 *
 * The three events below all fire on user-initiated actions well after mount,
 * so this is not a live risk today. Any FUTURE client event on a callback or
 * redirect path must be checked against it - that is what this note is for.
 */
function capture(
	event: string,
	properties: Record<string, string | number | boolean | null>,
): void {
	try {
		posthog.capture(event, properties);
	} catch (error) {
		// Analytics must never break a user action.
		console.error(`[analytics] capture failed for ${event}`, error);
	}
}

/**
 * Bind the browser to a user id.
 *
 * This is what keeps the client and server halves of the funnel ONE person:
 * every server capture uses the same user id as its `distinct_id`, and
 * posthog-js aliases the pre-signup anonymous id automatically. Without it a
 * signup and its first stack look like two strangers.
 */
export function identifyUser(userId: string | null | undefined): void {
	if (!userId) return;
	try {
		posthog.identify(userId);
	} catch (error) {
		console.error("[analytics] identify failed", error);
	}
}

export function captureStackCreated(input: {
	toolCount: number;
	published: boolean;
}): void {
	capture("stack_created", input);
}

export function captureStackPublished(input: {
	toolCount: number;
	/**
	 * The stack's cost-publication preference. Absent reads as opted IN - the
	 * field only ever records a refusal - so the funnel sees `true` by default.
	 */
	publishCost: boolean;
}): void {
	capture("stack_published", input);
}

/**
 * A click through from the leaderboard.
 *
 * This is also how internal traffic from the leaderboard gets measured at all:
 * a same-origin SPA navigation sends no `Referer` header, so the view counter
 * files it as `internal` with no source page. Splitting the internal bucket by
 * source would undercount badly and read as "the leaderboard sends no traffic".
 */
export function captureLeaderboardStackClicked(input: {
	rank: number;
	stackSlug: string;
}): void {
	capture("leaderboard_stack_clicked", input);
}
