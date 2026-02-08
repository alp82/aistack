import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useConvexAuth } from "@convex-dev/react-query";
import { useMutation } from "convex/react";
import { useEffect, useState } from "react";
import { api } from "../../convex/_generated/api";
import { StackEditor } from "@/components/StackEditor";

export const Route = createFileRoute("/stacks/new")({
	ssr: false,
	component: NewStackPage,
});

function NewStackPage() {
	const navigate = useNavigate();
	const { isAuthenticated, isLoading } = useConvexAuth();
	const getOrCreateCreator = useMutation(api.creators.getOrCreateForUser);
	const [creator, setCreator] = useState<{
		_id: any;
		name: string;
		slug: string;
		xHandle?: string;
	} | null>(null);
	const [loadingCreator, setLoadingCreator] = useState(true);

	useEffect(() => {
		if (isLoading) return;
		if (!isAuthenticated) {
			navigate({ to: "/login" });
			return;
		}

		getOrCreateCreator({})
			.then((c) => {
				setCreator(c);
				setLoadingCreator(false);
			})
			.catch(() => {
				setLoadingCreator(false);
			});
	}, [isAuthenticated, isLoading, getOrCreateCreator, navigate]);

	if (isLoading || loadingCreator) {
		return (
			<div className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800 flex items-center justify-center">
				<div className="text-gray-400">Loading...</div>
			</div>
		);
	}

	if (!creator) {
		return (
			<div className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800 flex items-center justify-center">
				<div className="text-center">
					<h1 className="text-2xl font-bold text-white mb-4">
						Could not create your profile
					</h1>
					<button
						type="button"
						onClick={() => navigate({ to: "/" })}
						className="text-cyan-400 hover:text-cyan-300"
					>
						← Back to home
					</button>
				</div>
			</div>
		);
	}

	return <StackEditor mode="create" creator={creator} />;
}
