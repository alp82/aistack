/**
 * PROTOTYPE - throwaway. Renders any OG card in any family:
 *   /api/og/prototype/<card>?variant=A|B|C&id=<slug or handle>
 * Development only. The real endpoints will be per page, not one switch.
 */
import { ImageResponse } from "@takumi-rs/image-response";
import { createFileRoute } from "@tanstack/react-router";
import { ConvexHttpClient } from "convex/browser";
import { isCardKey, loadCard } from "@/features/og/prototype/cards";
import {
	renderVariant,
	VARIANT_KEYS,
	type VariantKey,
} from "@/features/og/prototype/variants";

export const Route = createFileRoute("/api/og/prototype/$card")({
	server: {
		handlers: {
			GET: async ({ params, request }) => {
				if (process.env.NODE_ENV === "production") {
					return new Response("Not found", { status: 404 });
				}
				const convexUrl = process.env.VITE_CONVEX_URL;
				if (!convexUrl)
					return new Response("No VITE_CONVEX_URL", { status: 500 });
				if (!isCardKey(params.card)) {
					return new Response("Unknown card", { status: 404 });
				}
				const url = new URL(request.url);
				const v = url.searchParams.get("variant") ?? "A";
				const variant: VariantKey = (
					VARIANT_KEYS as readonly string[]
				).includes(v)
					? (v as VariantKey)
					: "A";
				try {
					const card = await loadCard(
						new ConvexHttpClient(convexUrl),
						params.card,
						url.searchParams.get("id") ?? undefined,
					);
					const bannerUrl = new URL("/banners/aistack.png", url.origin).href;
					return new ImageResponse(renderVariant(variant, card, bannerUrl), {
						width: 1200,
						height: 630,
						headers: { "Cache-Control": "no-store" },
					});
				} catch (error) {
					console.error("OG prototype render failed", error);
					return new Response(String(error), { status: 500 });
				}
			},
		},
	},
});
