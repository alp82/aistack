/**
 * PROTOTYPE - throwaway. Gallery of every OG image, one per subpage and one per
 * dynamic page, in three design families switchable with `?variant=`.
 * Open http://localhost:3019/prototype/og-images. Development only.
 */
import { createFileRoute } from "@tanstack/react-router";
import { OgImagesPrototype } from "@/features/og/prototype/OgImagesPrototype";
import { VARIANT_KEYS } from "@/features/og/prototype/variants";

export const Route = createFileRoute("/prototype/og-images")({
	validateSearch: (search: Record<string, unknown>) => ({
		variant: (VARIANT_KEYS as readonly string[]).includes(
			String(search.variant),
		)
			? (String(search.variant) as (typeof VARIANT_KEYS)[number])
			: ("A" as const),
		id: typeof search.id === "string" ? search.id : undefined,
	}),
	head: () => ({
		meta: [
			{ title: "OG images prototype" },
			{ name: "robots", content: "noindex" },
		],
	}),
	component: Page,
});

function Page() {
	const search = Route.useSearch();
	const navigate = Route.useNavigate();
	if (!import.meta.env.DEV) return null;
	return (
		<OgImagesPrototype
			variant={search.variant}
			onVariant={(variant) =>
				navigate({ search: { ...search, variant }, replace: true })
			}
		/>
	);
}
