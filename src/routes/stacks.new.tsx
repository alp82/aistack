import { useConvexAuth } from "@convex-dev/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMutation } from "convex/react";
import { useEffect, useRef, useState } from "react";
import { StackEditor } from "@/components/StackEditor";
import { Button } from "@/components/ui/button";
import { api } from "../../convex/_generated/api";
import { authClient } from "@/lib/auth-client";
import { seoMeta } from "@/lib/seo";

export const Route = createFileRoute("/stacks/new")({
	ssr: false,
	component: NewStackPage,
	head: () => ({
		meta: seoMeta({
			title: "Create Your AI Stack - AI Stack",
			description:
				"Build and share your AI stack. Show the world what tools you use to ship.",
			noindex: true,
		}),
	}),
});

function NewStackPage() {
	const navigate = useNavigate();
	const { isAuthenticated, isLoading } = useConvexAuth();
	const session = authClient.useSession();
	const getOrCreateCreator = useMutation(api.creators.getOrCreateForUser);
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
	const [isGuest, setIsGuest] = useState(false);
	const hasResolvedRef = useRef(false);

	// Get user's Google profile image as default
	const userImageUrl = session.data?.user?.image ?? undefined;

	useEffect(() => {
		if (isLoading) return;

		// Guest mode - allow creating stack without authentication
		if (!isAuthenticated) {
			setCreator({
				_id: "guest",
				name: "My AI Stack",
				slug: "guest",
			});
			setIsGuest(true);
			setLoadingCreator(false);
			return;
		}

		// Create creator profile for authenticated user. Creators can own any
		// number of stacks now — no "already has a stack" redirect.
		getOrCreateCreator({ imageUrl: userImageUrl })
			.then((c) => {
				setCreator(c);
				setLoadingCreator(false);
			})
			.catch(() => {
				setLoadingCreator(false);
			});
	}, [isAuthenticated, isLoading, getOrCreateCreator, navigate]);

	if (creator) {
		hasResolvedRef.current = true;
	}

	if ((isLoading || loadingCreator) && !hasResolvedRef.current) {
		return (
			<div className="flex min-h-screen items-center justify-center bg-bg-canvas">
				<div className="font-mono text-sm text-fg-muted">Loading...</div>
			</div>
		);
	}

	if (!creator) {
		return (
			<div className="flex min-h-screen items-center justify-center bg-bg-canvas">
				<div className="text-center">
					<h1 className="mb-4 text-2xl font-bold text-fg-primary">
						Could not create your profile
					</h1>
					<Button
						type="button"
						variant="link"
						onClick={() => navigate({ to: "/" })}
						className="font-mono text-sm text-accent-lime hover:text-accent-lime-strong hover:no-underline p-0 h-auto font-normal"
					>
						← Back to home
					</Button>
				</div>
			</div>
		);
	}

	return (
		<StackEditor
			// Re-key by identity (stable "guest" or creator id) so the editor
			// reinitializes with the right auth-scoped draft when the signed-in
			// identity actually changes — transient auth isLoading flips don't
			// change creator, so this can't reintroduce the refocus-remount bug.
			key={creator._id}
			mode="create"
			actor={creator}
			guestSession={isGuest}
		/>
	);
}
