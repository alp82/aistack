import { useQuery } from "convex/react";
import { useEffect } from "react";
import { api } from "../../../convex/_generated/api";
import { identifyUser } from "../../lib/analytics";

/**
 * Bind the browser to the viewer's user id, once they are authenticated.
 *
 * Renders nothing. It exists as a component only because it needs the Convex
 * auth context, and it sits INSIDE the PostHog provider so the SDK has mounted
 * by the time it fires.
 *
 * This is the join between the two halves of the funnel: client events carry
 * the anonymous id until this runs, server events always carry the user id, and
 * posthog-js aliases the two on identify.
 */
export function IdentifyUser() {
	const viewerId = useQuery(api.auth.getViewerId);

	useEffect(() => {
		identifyUser(viewerId);
	}, [viewerId]);

	return null;
}
