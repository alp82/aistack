/**
 * PROTOTYPE (#95) — `/prototype/chart-palette`.
 *
 * Throwaway route. It answers one question: does this browser resolve a
 * `var()` written into an SVG paint attribute, which is how every mark on this
 * site gets its color?
 *
 * The route server-renders on purpose. The first HTML has to carry the marks,
 * because that is where the question bites: the server cannot know the theme,
 * so the paint has to stay a property the CSS resolves after the fact.
 *
 * Public and unauthenticated, so the same URL opens in Chrome, Firefox and
 * Safari with nothing to sign in to. Delete this file when #95 is decided.
 */

import { createFileRoute } from "@tanstack/react-router";
import { PaletteCheck } from "@/features/charts/prototype/PaletteCheck";
import { seoMeta } from "@/lib/seo";

export const Route = createFileRoute("/prototype/chart-palette")({
	component: PaletteCheck,
	head: () => ({
		meta: seoMeta({
			title: "Chart palette check - AI Stack",
			description: "Does this browser resolve var() in an SVG paint attribute?",
			noindex: true,
		}),
	}),
});
