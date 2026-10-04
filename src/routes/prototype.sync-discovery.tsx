/** PROTOTYPE: cross-page before/after gallery. No product changes or mutations. */
import { createFileRoute } from "@tanstack/react-router";
import { SyncDiscoveryPrototype } from "@/features/measured/prototype/SyncDiscoveryPrototype";

export const Route = createFileRoute("/prototype/sync-discovery")({
	validateSearch: (s: Record<string, unknown>) => ({
		variant:
			s.variant === "A" || s.variant === "B" || s.variant === "C"
				? s.variant
				: ("D" as "A" | "B" | "C" | "D"),
		audience:
			s.audience === "member" ? ("member" as const) : ("guest" as const),
		mobile: s.mobile === true || s.mobile === "true",
	}),
	head: () => ({
		meta: [
			{ title: "Sync discovery prototype" },
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
		<SyncDiscoveryPrototype
			{...search}
			onChange={(next) =>
				navigate({ search: { ...search, ...next }, replace: true })
			}
		/>
	);
}
