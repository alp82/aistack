import { createFileRoute } from "@tanstack/react-router";
import {
	MOBILE_VARIANT_KEYS,
	type MobileVariantKey,
	StatsMobilePrototype,
} from "@/features/usage/prototype/StatsMobilePrototype";

const DEFAULT_SLUG = "alpers-coding-stack-unw0sl";

/** PROTOTYPE - throwaway (#465, map #462). Dev only. */
export const Route = createFileRoute("/prototype/stats-mobile")({
	validateSearch: (search: Record<string, unknown>) => ({
		variant: (MOBILE_VARIANT_KEYS as string[]).includes(String(search.variant))
			? (String(search.variant) as MobileVariantKey)
			: ("A" as MobileVariantKey),
		slug:
			typeof search.slug === "string" && search.slug !== ""
				? search.slug
				: DEFAULT_SLUG,
	}),
	head: () => ({
		meta: [
			{ title: "Stats mobile prototype" },
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
		<StatsMobilePrototype
			{...search}
			onChange={(next) =>
				navigate({ search: { ...search, ...next }, replace: true })
			}
		/>
	);
}
