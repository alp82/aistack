import { createFileRoute } from "@tanstack/react-router";
import { ConvexHttpClient } from "convex/browser";
import { ImageResponse } from "@takumi-rs/image-response";

import { api } from "../../convex/_generated/api";
import { StackOgImage } from "@/components/og/StackOgImage";

const convex = new ConvexHttpClient(process.env.VITE_CONVEX_URL!);

export const Route = createFileRoute("/api/og/stack/$slug")({
	server: {
		handlers: {
			GET: async ({ params }) => {
				const { slug } = params;

				const stack = await convex.query(api.stacks.getBySlug, { slug });

				if (!stack) {
					return new Response("Stack not found", { status: 404 });
				}

				const categories = [
					...new Set(stack.tools.flatMap((tool) => tool.categories)),
				].slice(0, 2);

				return new ImageResponse(
					<StackOgImage
						name={stack.name}
						oneLiner={stack.oneLiner}
						creator={stack.creator}
						fixedTotal={stack.fixedTotal}
						hasUsageComponent={stack.hasUsageComponent}
						teamSize={stack.teamSize}
						tools={stack.tools.map((t) => ({
							name: t.name,
							iconUrl: t.iconUrl,
						}))}
						categories={categories}
					/>,
					{
						width: 1200,
						height: 630,
						headers: {
							"Cache-Control": "public, max-age=86400, stale-while-revalidate=604800",
						},
					}
				);
			},
		},
	},
});
