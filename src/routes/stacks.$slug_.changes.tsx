import { useConvexAuth } from "@convex-dev/react-query";
import {
	createFileRoute,
	Link,
	useLocation,
	useNavigate,
} from "@tanstack/react-router";
import { useQuery } from "convex/react";
import { useEffect } from "react";
import { ChangesPage } from "@/features/reconcile/ChangesPage";
import { seoMeta } from "@/lib/seo";
import { api } from "../../convex/_generated/api";

/**
 * "What's changed" — the owner-only page locked by prototype #39 (variant J).
 *
 * `getForEdit` is the owner gate as well as the identity lookup: it returns null
 * for a stranger, for a signed-out visitor, and for a stack that does not exist,
 * and unlike `getBySlug` it also answers for an UNPUBLISHED stack — which an
 * owner filling in what-fors before publishing very much is.
 */
export const Route = createFileRoute("/stacks/$slug_/changes")({
	ssr: false,
	component: StackChangesPage,
	head: () => ({
		meta: seoMeta({
			title: "What's changed - AI Stack",
			description: "What your machine shows against what you have listed.",
			noindex: true,
		}),
	}),
});

function StackChangesPage() {
	const { slug } = Route.useParams();
	const navigate = useNavigate();
	const location = useLocation();
	const { isAuthenticated, isLoading: authLoading } = useConvexAuth();
	const stack = useQuery(api.stacks.getForEdit, { slug });

	useEffect(() => {
		if (authLoading || isAuthenticated) return;
		navigate({ to: "/signin", search: { redirect: location.pathname } });
	}, [authLoading, isAuthenticated, navigate, location.pathname]);

	// Keep the URL on the canonical slug, the same way the editor does.
	useEffect(() => {
		if (stack && stack.slug !== slug) {
			navigate({
				to: "/stacks/$slug/changes",
				params: { slug: stack.slug },
				replace: true,
			});
		}
	}, [stack, slug, navigate]);

	if (authLoading || stack === undefined) {
		return (
			<div className="flex min-h-screen items-center justify-center bg-bg-canvas">
				<div className="font-mono text-sm text-fg-muted">Loading...</div>
			</div>
		);
	}

	if (stack === null) {
		return (
			<div className="flex min-h-screen items-center justify-center bg-bg-canvas">
				<div className="text-center">
					<p className="font-mono text-sm text-fg-muted">
						This stack is not yours, or it does not exist.
					</p>
					<Link
						to="/stacks"
						className="mt-4 inline-block font-mono text-sm text-accent-lime hover:underline"
					>
						Back to stacks
					</Link>
				</div>
			</div>
		);
	}

	return (
		<ChangesPage
			stackId={stack._id}
			stackName={stack.name}
			stackSlug={stack.slug}
		/>
	);
}
