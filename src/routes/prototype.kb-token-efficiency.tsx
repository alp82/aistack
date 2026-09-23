import { createFileRoute } from "@tanstack/react-router";
import {
	TokenEfficiencyTopicPrototype,
	VARIANT_KEYS,
	type VariantKey,
} from "@/features/news/prototype/TokenEfficiencyTopicPrototype";

/** PROTOTYPE - throwaway. The "Token efficiency" knowledge base topic. Dev only. */
export const Route = createFileRoute("/prototype/kb-token-efficiency")({
	validateSearch: (search: Record<string, unknown>) => ({
		variant: (VARIANT_KEYS as string[]).includes(String(search.variant))
			? (String(search.variant) as VariantKey)
			: ("A" as VariantKey),
	}),
	head: () => ({
		meta: [
			{ title: "Token efficiency topic prototype" },
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
		<TokenEfficiencyTopicPrototype
			variant={search.variant}
			onChange={(next) =>
				navigate({ search: { ...search, ...next }, replace: true })
			}
		/>
	);
}
