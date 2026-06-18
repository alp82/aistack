import { ImageResponse } from "@takumi-rs/image-response";
import { createFileRoute } from "@tanstack/react-router";
import { ConvexHttpClient } from "convex/browser";
import { StackOgImage } from "@/components/og/StackOgImage";
import { ogAccentFor } from "@/features/stack-view/accentPresets";
import { orderToolsForDisplay } from "@/lib/pricing";
import { api } from "../../convex/_generated/api";

const convexUrl = process.env.VITE_CONVEX_URL;

if (!convexUrl) {
	throw new Error("VITE_CONVEX_URL is required for stack OG image generation");
}

const convex = new ConvexHttpClient(convexUrl);

export const Route = createFileRoute("/api/og/stack/$slug")({
	server: {
		handlers: {
			GET: async ({ params, request }) => {
				try {
					const stack = await convex.query(api.stacks.getBySlug, {
						slug: params.slug,
					});

					if (!stack) {
						return new Response("Stack not found", { status: 404 });
					}

					// Optional ?accent=<preset-key> override lets previews/tests render the
					// card in any accent; unknown/missing keys fall back to the stack's own.
					const accentOverride = new URL(request.url).searchParams.get(
						"accent",
					);
					const ogAccent = ogAccentFor(accentOverride ?? stack.accentPreset);

					return new ImageResponse(
						<StackOgImage
							name={stack.name}
							oneLiner={stack.oneLiner}
							creator={stack.creator}
							fixedTotal={stack.fixedTotal}
							hasUsageComponent={stack.hasUsageComponent}
							teamSize={stack.teamSize}
							tools={orderToolsForDisplay(stack.tools)
								.slice(0, 6)
								.map((tool) => ({
									name: tool.name,
									iconUrl: tool.iconUrl,
								}))}
							accent={ogAccent}
						/>,
						{
							width: 1200,
							height: 630,
							headers: {
								"Cache-Control":
									"public, max-age=3600, stale-while-revalidate=86400",
							},
						},
					);
				} catch (error) {
					console.error("Failed to render stack OG image", error);
					return new Response("Failed to render stack OG image", {
						status: 500,
					});
				}
			},
		},
	},
});
