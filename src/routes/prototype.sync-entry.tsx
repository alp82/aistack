/** PROTOTYPE: the guest cold-run storyboard. Fixture only, dev builds only. */
import { createFileRoute } from "@tanstack/react-router";
import { ColdRunStoryboard } from "@/features/sync-entry/prototype/SyncEntryPrototype";

export const Route = createFileRoute("/prototype/sync-entry")({
	head: () => ({
		meta: [
			{ title: "Sync entry prototype" },
			{ name: "robots", content: "noindex" },
		],
	}),
	component: () => (import.meta.env.DEV ? <ColdRunStoryboard /> : null),
});
