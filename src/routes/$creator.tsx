import { convexQuery } from "@convex-dev/react-query";
import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useQuery } from "convex/react";
import { ProfilePage } from "@/features/profile/ProfilePage";
import { seoMeta } from "@/lib/seo";
import { useRecordView } from "@/lib/useRecordView";
import { api } from "../../convex/_generated/api";

/**
 * Public creator profile at `/@<handle>` (e.g. /@alper-ortac). The dynamic
 * `$creator` param must carry the leading `@` — any other single-segment
 * path 404s, so profile URLs can't shadow future root routes.
 */
export const Route = createFileRoute("/$creator")({
	beforeLoad: ({ params }) => {
		if (!params.creator.startsWith("@")) throw notFound();
	},
	loader: async ({ context, params }) => {
		const handle = params.creator.slice(1);
		// Auth-independent query — safe to seed the SSR cache (owner state
		// lives in the client-only getOwnProfileView, per the stacks.$slug
		// precedent).
		const data = await context.queryClient.ensureQueryData(
			convexQuery(api.creators.getByHandle, { handle }),
		);
		return { data };
	},
	head: ({ loaderData }) => {
		const profile = loaderData?.data?.profile;
		if (!profile) {
			return {
				meta: seoMeta({
					title: "Profile - AI Stack",
					description: "Creator profile on AI Stack.",
					noindex: true,
				}),
			};
		}
		return {
			meta: seoMeta({
				title: `${profile.name} (@${profile.handle}) - AI Stack`,
				description:
					profile.bio ??
					`${profile.name}'s AI stacks — the tools, costs, and workflows they run.`,
				url: `/@${profile.handle}`,
			}),
		};
	},
	component: CreatorProfileRoute,
});

function CreatorProfileRoute() {
	const { creator } = Route.useParams();
	const handle = creator.slice(1);
	const data = useQuery(api.creators.getByHandle, { handle });
	// Client-only owner query — never part of the SSR payload, so the shared
	// cache can't seed with an owner view.
	const ownProfile = useQuery(api.creators.getOwnProfileView, { handle });
	// Deduped daily visitors (#78). Before the early returns below, because a
	// hook cannot be called conditionally.
	useRecordView("creator", data?.profile._id);

	if (data === undefined) {
		return (
			<div className="flex min-h-screen items-center justify-center bg-bg-canvas">
				<div className="font-mono text-sm text-fg-muted">
					Loading profile...
				</div>
			</div>
		);
	}

	if (data === null) {
		return (
			<div className="flex min-h-screen items-center justify-center bg-bg-canvas">
				<div className="text-center">
					<h1 className="mb-4 text-2xl font-bold text-fg-primary">
						Profile not found
					</h1>
					<Link
						to="/"
						className="font-mono text-sm text-accent-lime hover:text-accent-lime-strong"
					>
						← Back to home
					</Link>
				</div>
			</div>
		);
	}

	return (
		<ProfilePage
			profile={data.profile}
			stacks={data.stacks}
			ownProfile={ownProfile ?? null}
		/>
	);
}
