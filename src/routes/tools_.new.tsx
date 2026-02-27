import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { AddToolForm } from "../components/AddToolModal";

export const Route = createFileRoute("/tools_/new")({
	ssr: false,
	component: NewToolPage,
	head: () => ({
		meta: [
			{
				title: "Add New Tool - AI Stack",
			},
		],
	}),
});

function NewToolPage() {
	const navigate = useNavigate();

	return (
		<div className="mx-6 min-h-screen bg-bg-canvas">
			{/* Grid background */}
			<div
				className="fixed inset-0 pointer-events-none z-0 opacity-10"
				style={{
					backgroundImage:
						"linear-gradient(to right, #333 1px, transparent 1px), linear-gradient(to bottom, #333 1px, transparent 1px)",
					backgroundSize: "4rem 4rem",
				}}
			/>

			<div className="relative z-10 max-w-2xl mx-auto py-24">
				<button
					type="button"
					onClick={() => navigate({ to: "/tools" })}
					className="mb-8 inline-flex items-center gap-2 font-mono text-xs font-semibold uppercase tracking-wide text-fg-muted transition-colors hover:text-accent-lime"
				>
					<ArrowLeft className="size-4" />
					Back to Tools
				</button>

				<div className="border-2 border-stroke-strong bg-bg-panel p-8 shadow-[6px_6px_0_var(--stroke-strong)]">
					<AddToolForm
						onCancel={() => navigate({ to: "/tools" })}
						onToolCreated={() => navigate({ to: "/tools" })}
					/>
				</div>
			</div>
		</div>
	)
}
