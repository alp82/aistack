import { useConvexAuth } from "@convex-dev/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery } from "convex/react";
import { useEffect, useState } from "react";
import { StackEditor } from "@/components/StackEditor";
import { Button } from "@/components/ui/button";
import { api } from "../../convex/_generated/api";

export const Route = createFileRoute("/stacks/new")({
	ssr: false,
	component: NewStackPage,
});

function NewStackPage() {
	const navigate = useNavigate();
	const { isAuthenticated, isLoading } = useConvexAuth();
	const getOrCreateCreator = useMutation(api.creators.getOrCreateForUser);
	const userStack = useQuery(api.stacks.getUserStack);
	const [creator, setCreator] = useState<{
		_id: any;
		name: string;
		slug: string;
		xHandle?: string;
	} | null>(null);
	const [loadingCreator, setLoadingCreator] = useState(true);
	const [isGuest, setIsGuest] = useState(false);

	useEffect(() => {
		if (isLoading) return;

		// Guest mode - allow creating stack without authentication
		if (!isAuthenticated) {
			setCreator({
				_id: "guest",
				name: "Guest User",
				slug: "guest",
			});
			setIsGuest(true);
			setLoadingCreator(false);
			return;
		}

		// Authenticated user - check if they already have a stack
		if (userStack !== undefined && userStack !== null) {
			window.location.href = `/stacks/${userStack.slug}/edit`;
			return;
		}

		// Create creator profile for authenticated user
		getOrCreateCreator({})
			.then((c) => {
				setCreator(c);
				setLoadingCreator(false);
			})
			.catch(() => {
				setLoadingCreator(false);
			});
	}, [isAuthenticated, isLoading, userStack, getOrCreateCreator, navigate]);

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
					<Button
						type="button"
						variant="link"
						onClick={() => navigate({ to: "/" })}
						className="text-cyan-400 hover:text-cyan-300 hover:no-underline p-0 h-auto font-normal"
					>
						← Back to home
					</Button>
				</div>
			</div>
		);
	}

	return <StackEditor mode="create" creator={creator} isGuest={isGuest} />;
}
