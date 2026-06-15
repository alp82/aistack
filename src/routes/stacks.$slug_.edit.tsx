import { useConvexAuth } from "@convex-dev/react-query";
import {
	createFileRoute,
	Link,
	useLocation,
	useNavigate,
} from "@tanstack/react-router";
import { useMutation, useQuery } from "convex/react";
import { useEffect, useState } from "react";
import { StackEditor } from "@/components/StackEditor";
import type { ModelSubscriptionEntry } from "@/features/stack-editor/types";
import { authClient } from "@/lib/auth-client";
import { seoMeta } from "@/lib/seo";
import { api } from "../../convex/_generated/api";

export const Route = createFileRoute("/stacks/$slug_/edit")({
	ssr: false,
	component: EditStackPage,
	head: () => ({
		meta: seoMeta({
			title: "Edit Stack - AI Stack",
			description: "Edit your AI stack on AI Stack.",
			noindex: true,
		}),
	}),
});

function EditStackPage() {
	const { slug } = Route.useParams();
	const navigate = useNavigate();
	const location = useLocation();
	const { isAuthenticated, isLoading: authLoading } = useConvexAuth();
	const session = authClient.useSession();
	const getOrCreateCreator = useMutation(api.creators.getOrCreateForUser);
	const stackData = useQuery(api.stacks.getForEdit, { slug });
	// getForEdit returns the raw avatar storage id (never a URL — the public
	// resolvers do that). Resolve it here for the editor's avatar preview.
	const avatarUrl = useQuery(
		api.iconStorage.getUrl,
		stackData?.avatarStorageId
			? { storageId: stackData.avatarStorageId }
			: "skip",
	);

	// Get user's Google profile image as default
	const userImageUrl = session.data?.user?.image ?? undefined;

	const [creator, setCreator] = useState<{
		_id: any;
		name: string;
		slug: string;
		xHandle?: string;
		avatarUrl?: string;
		personalPages?: Array<{ name: string; url: string }>;
		projectPages?: Array<{ name: string; url: string }>;
	} | null>(null);
	const [loadingCreator, setLoadingCreator] = useState(true);

	useEffect(() => {
		if (authLoading) return;
		if (!isAuthenticated) {
			navigate({ to: "/signin", search: { redirect: location.pathname } });
			return;
		}

		getOrCreateCreator({ imageUrl: userImageUrl })
			.then((c) => {
				setCreator(c);
				setLoadingCreator(false);
			})
			.catch(() => {
				setLoadingCreator(false);
			});
	}, [isAuthenticated, authLoading, getOrCreateCreator, navigate]);

	// Redirect to canonical slug if URL slug prefix is stale/wrong
	useEffect(() => {
		if (stackData && stackData.slug !== slug) {
			navigate({
				to: "/stacks/$slug/edit",
				params: { slug: stackData.slug },
				replace: true,
			});
		}
	}, [stackData, slug, navigate]);

	if (authLoading || loadingCreator || stackData === undefined) {
		return (
			<div className="flex min-h-screen items-center justify-center bg-bg-canvas">
				<div className="font-mono text-sm text-fg-muted">Loading...</div>
			</div>
		);
	}

	if (stackData === null || !creator) {
		return (
			<div className="flex min-h-screen items-center justify-center bg-bg-canvas">
				<div className="text-center">
					<h1 className="mb-4 text-2xl font-bold text-fg-primary">
						Stack not found or not authorized
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
		<StackEditor
			mode="edit"
			actor={creator}
			defaultAvatarUrl={userImageUrl}
			initialValue={{
				_id: stackData._id,
				name: stackData.name,
				slug: stackData.slug,
				oneLiner: stackData.oneLiner,
				description: stackData.description,
				resources: stackData.resources ?? [],
				teamSize: stackData.teamSize,
				published: stackData.published,
				avatarStorageId: stackData.avatarStorageId,
				avatarUrl: avatarUrl ?? undefined,
				personalPageUrl: stackData.personalPageUrl,
				toolSubscriptions: stackData.toolSubscriptions.map((t) => ({
					toolSlug: t.toolSlug,
					toolName: t.toolName,
					toolCategories: t.toolCategories,
					toolIconUrl: t.toolIconUrl,
					tierId: t.tierId,
					kind: t.kind,
					primaryUsageLabel: t.primaryUsageLabel,
					price: t.price,
					priceKind: t.priceKind,
					bundleSlug: t.bundleSlug,
					description: t.description,
				})),
				bundleSubscriptions: stackData.bundleSubscriptions.map((b) => ({
					bundleSlug: b.bundleSlug,
					bundleName: b.bundleName,
					tierId: b.tierId,
					tierName: b.tierName,
					price: b.price,
					description: b.description,
				})),
				modelSubscriptions: stackData.modelSubscriptions.map((m) => ({
					modelSlug: m.modelSlug,
					modelName: m.modelName,
					modelProvider: m.modelProvider,
					modelCategory:
						m.modelCategory as ModelSubscriptionEntry["modelCategory"],
					modelIconUrl: m.modelIconUrl,
					role: m.role,
				})),
			}}
		/>
	);
}
