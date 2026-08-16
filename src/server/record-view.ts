// The view-counting server function (#78, map #76).
//
// Everything that needs the raw client address happens HERE and stops here.
// Convex receives a hash and a bucket, never an IP and never a referrer.

import { createServerFn } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";
import { api } from "../../convex/_generated/api";
import { fetchAuthMutation } from "../lib/auth-server";
import { clientIp } from "../lib/client-ip";
import type { ReferrerBucket } from "../lib/referrer";
import {
	DAY_MS,
	hashSecret,
	isCountableRequest,
	rateKeyFor,
	visitorHashFor,
} from "../lib/view-hash";

export type ViewTargetKind = "stack" | "creator" | "aggregate";

export interface RecordViewInput {
	targetKind: ViewTargetKind;
	/** The Convex document id - never the slug, so a rename keeps its history. */
	targetId: string;
	referrerBucket: ReferrerBucket;
}

/**
 * Count one view.
 *
 * Called from a MOUNT EFFECT, never a route loader. `defaultPreload: "viewport"`
 * runs the loader for every card scrolled into view, and
 * `defaultPreloadStaleTime: 30_000` means a preloaded route that is then clicked
 * does not re-run its loader - so a loader write both invents views and misses
 * real ones. Mount is the only event that means a person is looking at the page.
 *
 * Always resolves. A failed count must never surface to the reader.
 */
export const recordView = createServerFn({ method: "POST" })
	.inputValidator((data: RecordViewInput) => data)
	.handler(async ({ data }) => {
		try {
			const request = getRequest();
			const userAgent = request.headers.get("user-agent");
			if (
				!isCountableRequest({
					userAgent,
					secPurpose: request.headers.get("sec-purpose"),
				})
			) {
				return { counted: false };
			}

			const secret = hashSecret();
			if (!secret) {
				console.error("[views] VIEW_HASH_SECRET unset - not counting views");
				return { counted: false };
			}

			const ip = clientIp(request);
			if (!ip) return { counted: false };

			const dayStartMs = Math.floor(Date.now() / DAY_MS) * DAY_MS;

			// The viewer identity is NOT passed. `fetchAuthMutation` forwards this
			// request's session, so Convex derives the viewer itself - a
			// caller-supplied `viewerUserId` would let anyone suppress a
			// competitor's views or attribute their own.
			return await fetchAuthMutation(api.views.record, {
				targetKind: data.targetKind,
				targetId: data.targetId,
				referrerBucket: data.referrerBucket,
				visitorHash: visitorHashFor({
					secret,
					ip,
					userAgent: userAgent as string,
					targetKind: data.targetKind,
					targetId: data.targetId,
					dayStartMs,
				}),
				rateKey: rateKeyFor(secret, ip),
			});
		} catch (error) {
			console.error("[views] record failed", error);
			return { counted: false };
		}
	});
