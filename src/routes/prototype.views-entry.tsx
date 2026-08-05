/**
 * PROTOTYPE (#98) — `/prototype/views-entry`.
 *
 * Throwaway route. The real profile page, rendered on fixtures, with three
 * different owner-only view affordances in its owner region.
 *
 * The axis that matters most is "Seen as". Flip it to Visitor and the private
 * region has to disappear completely, because this page is public and the
 * number is not. That flip is the test each variant has to pass.
 *
 * Delete this file when #98 is decided.
 */

import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { PrototypeSwitcher } from "@/components/PrototypeSwitcher";
import {
	ProfilePage,
	type ProfileStackCard,
} from "@/features/profile/ProfilePage";
import {
	ENTRIES,
	ENTRY_LABELS,
	EntryE1,
	EntryE2,
	EntryE3,
	EntryE4,
	type EntryKey,
} from "@/features/profile/prototype/EntryVariants";
import {
	DATA_STATE_LABELS,
	DATA_STATES,
	type DataState,
	fixture,
} from "@/features/settings/prototype/fixtures";

type Seen = "owner" | "visitor";

type Search = { entry: EntryKey; data: DataState; as: Seen };

export const Route = createFileRoute("/prototype/views-entry")({
	component: PrototypeViewsEntry,
	validateSearch: (search: Record<string, unknown>): Search => ({
		entry: ENTRIES.includes(search.entry as EntryKey)
			? (search.entry as EntryKey)
			: "E4",
		data: DATA_STATES.includes(search.data as DataState)
			? (search.data as DataState)
			: "thin",
		as: search.as === "visitor" ? "visitor" : "owner",
	}),
});

const PROFILE = {
	name: "Jules Okonkwo",
	handle: "jules",
	bio: "Terminal-first. Two harnesses, one budget, and a lot of opinions about diff review.",
	personalPages: [{ name: "julesok.dev", url: "https://julesok.dev" }],
	verified: true,
	joinedAt: Date.parse("2026-02-11T00:00:00Z"),
};

const PUBLISHED: ProfileStackCard[] = [
	{
		_id: "s1",
		name: "Terminal-first daily driver",
		slug: "terminal-first-daily-driver",
		oneLiner:
			"Claude Code in a tmux split, with a cheap model on the review pass.",
		published: true,
		updatedAt: Date.parse("2026-08-02T00:00:00Z"),
		fixedTotal: { currency: "USD", amount: 20000, period: "month" },
		hasUsageComponent: true,
		toolCount: 7,
		modelCount: 3,
		upvoteCount: 12,
	},
	{
		_id: "s2",
		name: "Cheap research rig",
		slug: "cheap-research-rig",
		oneLiner: "Reading and summarizing, nothing that writes to a repo.",
		published: true,
		updatedAt: Date.parse("2026-07-19T00:00:00Z"),
		fixedTotal: { currency: "USD", amount: 4000, period: "month" },
		hasUsageComponent: false,
		toolCount: 4,
		modelCount: 2,
		upvoteCount: 3,
	},
];

const DRAFTS: ProfileStackCard[] = [
	{
		_id: "s3",
		name: "Docs-heavy writing setup",
		slug: "docs-heavy-writing-setup",
		oneLiner: "Still deciding whether the editor plugin earns its seat.",
		published: false,
		updatedAt: Date.parse("2026-08-04T00:00:00Z"),
		hasUsageComponent: false,
		toolCount: 3,
		modelCount: 1,
		upvoteCount: 0,
	},
];

function PrototypeViewsEntry() {
	const { entry, data: state, as } = Route.useSearch();
	const navigate = useNavigate({ from: Route.fullPath });
	const data = fixture(state, Date.now());
	const isOwner = as === "owner";

	const slot =
		entry === "E1" ? (
			<EntryE1 />
		) : entry === "E2" ? (
			<EntryE2 data={data} />
		) : entry === "E3" ? (
			<EntryE3 data={data} />
		) : (
			<EntryE4 data={data} />
		);

	return (
		<>
			<div className="pb-24">
				<ProfilePage
					profile={PROFILE}
					stacks={PUBLISHED}
					ownProfile={isOwner ? { isOwner: true, draftStacks: DRAFTS } : null}
					ownerViewsSlot={slot}
				/>
			</div>
			<PrototypeSwitcher
				axes={[
					{
						name: "Entry",
						keys: ENTRIES,
						labels: ENTRY_LABELS,
						current: entry,
						arrowKeys: true,
						onPick: (k) =>
							navigate({
								search: { entry: k as EntryKey, data: state, as },
							}),
					},
					{
						name: "Seen as",
						keys: ["owner", "visitor"],
						labels: { owner: "Owner", visitor: "Visitor" },
						current: as,
						onPick: (k) =>
							navigate({ search: { entry, data: state, as: k as Seen } }),
					},
					{
						name: "Data",
						keys: DATA_STATES,
						labels: DATA_STATE_LABELS,
						current: state,
						onPick: (k) =>
							navigate({ search: { entry, data: k as DataState, as } }),
					},
				]}
			/>
		</>
	);
}
