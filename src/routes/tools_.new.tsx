import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { AddToolForm } from "../components/AddToolModal";
import { GridBackground } from "../components/GridBackground";
import { PageHeader } from "../components/PageHeader";

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
			<GridBackground />

			<div className="relative z-10 max-w-content mx-auto py-24">
				<PageHeader
					label="TOOLS"
					title={<>AI TOOLS FOR <br />YOUR STACK</>}
					description="A curated selection of high-performance AI tools you can use to build your product. Validated by real shipping capability."
					action={{
						label: "Back to Tools",
						icon: <ArrowLeft size={18} />,
						onClick: () => navigate({ to: "/tools" }),
					}}
				/>

				<div className="mt-12 border-2 border-stroke-strong bg-bg-panel p-8 shadow-[6px_6px_0_var(--stroke-strong)]">
					<AddToolForm
						onCancel={() => navigate({ to: "/tools" })}
						onToolCreated={() => navigate({ to: "/tools" })}
					/>
				</div>
			</div>
		</div>
	)
}
