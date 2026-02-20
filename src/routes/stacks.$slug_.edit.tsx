import { createFileRoute, Link, useNavigate, useLocation } from "@tanstack/react-router";
import { useConvexAuth } from "@convex-dev/react-query";
import { useMutation, useQuery } from "convex/react";
import { useEffect, useState } from "react";
import { api } from "../../convex/_generated/api";
import { StackEditor } from "@/components/StackEditor";

export const Route = createFileRoute("/stacks/$slug_/edit")({
	ssr: false,
	component: EditStackPage,
});

function EditStackPage() {
	const { slug } = Route.useParams();
	const navigate = useNavigate();
	const location = useLocation();
	const { isAuthenticated, isLoading: authLoading } = useConvexAuth();
	const getOrCreateCreator = useMutation(api.creators.getOrCreateForUser);
	const stackData = useQuery(api.stacks.getForEdit, { slug });

	const [creator, setCreator] = useState<{
		_id: any;
		name: string;
		slug: string;
		xHandle?: string;
	} | null>(null);
	const [loadingCreator, setLoadingCreator] = useState(true);

	useEffect(() => {
		if (authLoading) return;
		if (!isAuthenticated) {
			navigate({ to: "/signin", search: { redirect: location.pathname } });
			return
		}

		getOrCreateCreator({})
			.then((c) => {
				setCreator(c);
				setLoadingCreator(false);
			})
			.catch(() => {
				setLoadingCreator(false);
			})
	}, [isAuthenticated, authLoading, getOrCreateCreator, navigate]);

	if (authLoading || loadingCreator || stackData === undefined) {
		return (
			<div className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800 flex items-center justify-center">
				<div className="text-gray-400">Loading...</div>
			</div>
		)
	}

	if (stackData === null || !creator) {
		return (
			<div className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800 flex items-center justify-center">
				<div className="text-center">
					<h1 className="text-2xl font-bold text-white mb-4">
						Stack not found or not authorized
					</h1>
					<Link
						to="/"
						className="text-cyan-400 hover:text-cyan-300"
					>
						← Back to home
					</Link>
				</div>
			</div>
		)
	}

	return (
		<StackEditor
			mode="edit"
			actor={creator}
			initialValue={{
				_id: stackData._id,
				slug: stackData.slug,
				oneLiner: stackData.oneLiner,
				description: stackData.description,
				stackUrl: stackData.stackUrl,
				prompts: stackData.prompts ?? [],
				rules: stackData.rules ?? [],
				skills: stackData.skills ?? [],
				mcps: stackData.mcps ?? [],
				models: stackData.models ?? [],
				resources: stackData.resources,
				teamSize: stackData.teamSize,
				published: stackData.published,
				toolSubscriptions: stackData.toolSubscriptions.map((t) => ({
					toolId: t.toolId,
					toolName: t.toolName,
					toolSlug: t.toolSlug,
					toolCategory: t.toolCategory,
					toolIconUrl: t.toolIconUrl,
					tierId: t.tierId,
					kind: t.kind,
					primaryUsageLabel: t.primaryUsageLabel,
					price: t.price,
					priceKind: t.priceKind,
					bundleSlug: t.bundleSlug,
					notes: t.notes,
				})),
				bundleSubscriptions: stackData.bundleSubscriptions.map((b) => ({
					bundleId: b.bundleId,
					bundleName: b.bundleName,
					bundleSlug: b.bundleSlug,
					tierId: b.tierId,
					tierName: b.tierName,
					notes: b.notes,
				})),
			}}
		/>
	)
}
