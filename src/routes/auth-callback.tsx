import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef } from "react";

export const Route = createFileRoute("/auth-callback")({
	ssr: false,
	component: AuthCallback,
});

function AuthCallback() {
	const navigate = useNavigate();
	const hasProcessed = useRef(false);

	useEffect(() => {
		if (hasProcessed.current) return;
		hasProcessed.current = true;

		setTimeout(() => {
			navigate({ to: "/" });
		}, 500);
	}, [navigate]);

	return (
		<div className="min-h-[80vh] flex items-center justify-center">
			<div className="text-center">
				<div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-400 mx-auto mb-4"></div>
				<p className="text-gray-300 text-lg">Signing you in...</p>
			</div>
		</div>
	);
}
