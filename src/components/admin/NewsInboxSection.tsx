import { useAction, useMutation, useQuery } from "convex/react";
import { Check, Inbox, Plus, RotateCcw, Save, X } from "lucide-react";
import { useState } from "react";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import { NewsXProfilePicks, type XProfilePost } from "./NewsXProfilePicks";

type ItemState = "inbox" | "approved" | "discarded";

const STATE_LABEL: Record<ItemState, string> = {
	inbox: "Inbox",
	approved: "Stream",
	discarded: "Discarded",
};

function day(ms: number | undefined): string {
	if (!ms) return "no date";
	return new Date(ms).toISOString().slice(0, 10);
}

/**
 * Quick-add: the owner pastes a URL and the item lands in the inbox.
 *
 * The headline field is optional and stays empty in the common case. The action
 * reads the page title, and the owner can edit the headline on the card once
 * the item is in the list.
 */
function QuickAdd() {
	const quickAdd = useAction(api.news.quickAdd);
	const [url, setUrl] = useState("");
	const [headline, setHeadline] = useState("");
	const [busy, setBusy] = useState(false);
	const [message, setMessage] = useState<string | null>(null);
	const [profile, setProfile] = useState<{
		screenName: string;
		posts: XProfilePost[];
	} | null>(null);

	async function submit(e: React.FormEvent) {
		e.preventDefault();
		if (!url.trim() || busy) return;
		setBusy(true);
		setMessage(null);
		setProfile(null);
		try {
			const result = await quickAdd({
				url: url.trim(),
				headline: headline.trim() || undefined,
			});
			// An X profile link opens a pick list. Nothing is stored yet.
			if (result.kind === "profile" && result.profile) {
				setProfile(result.profile);
				setMessage(
					`@${result.profile.screenName}: ${result.profile.posts.length} recent posts. Pick the ones worth keeping.`,
				);
			} else {
				setMessage(
					result.item?.duplicate
						? `Already collected: ${result.item.headline}`
						: `Added: ${result.item?.headline}`,
				);
			}
			setUrl("");
			setHeadline("");
		} catch (error) {
			setMessage(error instanceof Error ? error.message : "Could not add that");
		} finally {
			setBusy(false);
		}
	}

	return (
		<form
			onSubmit={submit}
			className="mb-8 border-2 border-stroke-strong bg-bg-panel p-6"
		>
			<h2 className="mb-4 font-mono text-sm font-semibold uppercase tracking-wide text-fg-primary">
				Quick-add
			</h2>
			<div className="flex flex-col gap-3 sm:flex-row">
				<input
					type="url"
					value={url}
					onChange={(e) => setUrl(e.target.value)}
					placeholder="https://"
					className="flex-1 border-2 border-stroke-subtle bg-bg-canvas px-3 py-2 font-mono text-sm text-fg-primary placeholder:text-fg-muted focus:border-accent-lime focus:outline-none"
				/>
				<input
					type="text"
					value={headline}
					onChange={(e) => setHeadline(e.target.value)}
					placeholder="Headline (optional)"
					className="flex-1 border-2 border-stroke-subtle bg-bg-canvas px-3 py-2 font-mono text-sm text-fg-primary placeholder:text-fg-muted focus:border-accent-lime focus:outline-none"
				/>
				<button
					type="submit"
					disabled={busy || !url.trim()}
					className="inline-flex cursor-pointer items-center justify-center gap-2 border-2 border-accent-lime bg-accent-lime px-4 py-2 font-mono text-xs font-semibold uppercase tracking-wide text-bg-canvas transition-colors hover:opacity-80 disabled:cursor-not-allowed disabled:opacity-40"
				>
					<Plus className="size-3.5" />
					{busy ? "Reading" : "Add"}
				</button>
			</div>
			{message ? (
				<p className="mt-3 font-mono text-xs text-fg-muted">{message}</p>
			) : null}
			{profile ? (
				<NewsXProfilePicks
					screenName={profile.screenName}
					posts={profile.posts}
					onClose={() => setProfile(null)}
				/>
			) : null}
		</form>
	);
}

interface ItemCardProps {
	item: {
		_id: Id<"newsItems">;
		url: string;
		headline: string;
		summary?: string;
		publishedAt?: number;
		collectedAt: number;
		intake: string;
		licenseClass: string;
		topicId?: Id<"newsTopics">;
		sourceName: string | null;
		state: ItemState;
		hnItemId?: string;
		hnPoints?: number;
		hnComments?: number;
		xEmbed?: { statusId: string };
	};
	topics: Array<{ _id: Id<"newsTopics">; name: string }>;
}

function ItemCard({ item, topics }: ItemCardProps) {
	const updateItem = useMutation(api.news.updateItem);
	const setItemState = useMutation(api.news.setItemState);
	const createTopic = useMutation(api.news.createTopic);
	const [headline, setHeadline] = useState(item.headline);
	const [summary, setSummary] = useState(item.summary ?? "");
	const [saved, setSaved] = useState(false);

	const dirty = headline !== item.headline || summary !== (item.summary ?? "");

	async function save() {
		await updateItem({ itemId: item._id, headline, summary });
		setSaved(true);
		setTimeout(() => setSaved(false), 1500);
	}

	async function pickTopic(value: string) {
		if (value === "") {
			await updateItem({ itemId: item._id, topicId: null });
			return;
		}
		if (value === "__new") {
			const name = window.prompt("New topic name");
			if (!name?.trim()) return;
			const topicId = await createTopic({ name: name.trim() });
			await updateItem({ itemId: item._id, topicId });
			return;
		}
		await updateItem({ itemId: item._id, topicId: value as Id<"newsTopics"> });
	}

	return (
		<div className="border-2 border-stroke-strong bg-bg-panel p-5">
			<div className="mb-3 flex flex-wrap items-center gap-2 font-mono text-xs text-fg-muted">
				<span>{item.sourceName ?? "quick-add"}</span>
				<span>·</span>
				<span>{day(item.publishedAt ?? item.collectedAt)}</span>
				<span>·</span>
				<span>{item.licenseClass}</span>
				{/*
				  A Hacker News story usually points at an article, and that
				  article is the link above. The discussion is the second link,
				  so one post is one item with both (#208).
				*/}
				{item.hnItemId ? (
					<>
						<span>·</span>
						<span>{item.hnPoints ?? 0} points</span>
						<a
							href={`https://news.ycombinator.com/item?id=${item.hnItemId}`}
							target="_blank"
							rel="noopener noreferrer"
							className="border border-stroke-subtle px-2 py-1 text-fg-muted transition-colors hover:border-accent-lime hover:text-accent-lime"
						>
							{item.hnComments ?? 0} comments
						</a>
					</>
				) : null}
				{/*
				  The stored oEmbed markup is NOT rendered here. It is X-authored
				  HTML, and the inbox has no reason to run it: the post text is
				  the headline. A projection renders the official embed (#201).
				*/}
				{item.xEmbed ? (
					<>
						<span>·</span>
						<span>X post {item.xEmbed.statusId}</span>
					</>
				) : null}
				<a
					href={item.url}
					target="_blank"
					rel="noopener noreferrer"
					className="ml-auto border border-stroke-subtle px-2 py-1 text-fg-muted transition-colors hover:border-accent-lime hover:text-accent-lime"
				>
					Open
				</a>
			</div>

			<input
				type="text"
				value={headline}
				onChange={(e) => setHeadline(e.target.value)}
				className="mb-3 w-full border-2 border-stroke-subtle bg-bg-canvas px-3 py-2 font-mono text-sm font-semibold text-fg-primary focus:border-accent-lime focus:outline-none"
			/>

			<textarea
				value={summary}
				onChange={(e) => setSummary(e.target.value)}
				rows={3}
				placeholder="Summary in our own words. The drafting skill fills this in."
				className="mb-3 w-full border-2 border-stroke-subtle bg-bg-canvas px-3 py-2 font-mono text-sm text-fg-primary placeholder:text-fg-muted focus:border-accent-lime focus:outline-none"
			/>

			<div className="flex flex-wrap items-center gap-3 border-t border-stroke-subtle pt-4">
				<select
					value={item.topicId ?? ""}
					onChange={(e) => pickTopic(e.target.value)}
					className="border-2 border-stroke-subtle bg-bg-canvas px-3 py-2 font-mono text-xs text-fg-primary focus:border-accent-lime focus:outline-none"
				>
					<option value="">No topic</option>
					{topics.map((topic) => (
						<option key={topic._id} value={topic._id}>
							{topic.name}
						</option>
					))}
					<option value="__new">+ New topic</option>
				</select>

				<button
					type="button"
					onClick={save}
					disabled={!dirty}
					className="inline-flex cursor-pointer items-center gap-2 border-2 border-stroke-strong px-4 py-2 font-mono text-xs font-semibold uppercase tracking-wide text-fg-secondary transition-colors hover:border-accent-lime hover:text-accent-lime disabled:cursor-not-allowed disabled:opacity-40"
				>
					<Save className="size-3.5" />
					{saved ? "Saved" : "Save"}
				</button>

				<div className="ml-auto flex gap-3">
					{item.state !== "approved" ? (
						<button
							type="button"
							onClick={() =>
								setItemState({ itemId: item._id, state: "approved" })
							}
							className="inline-flex cursor-pointer items-center gap-2 border-2 border-accent-lime bg-accent-lime px-4 py-2 font-mono text-xs font-semibold uppercase tracking-wide text-bg-canvas transition-colors hover:opacity-80"
						>
							<Check className="size-3.5" />
							Approve
						</button>
					) : null}
					{item.state !== "inbox" ? (
						<button
							type="button"
							onClick={() => setItemState({ itemId: item._id, state: "inbox" })}
							className="inline-flex cursor-pointer items-center gap-2 border-2 border-stroke-strong px-4 py-2 font-mono text-xs font-semibold uppercase tracking-wide text-fg-secondary transition-colors hover:border-accent-lime hover:text-accent-lime"
						>
							<RotateCcw className="size-3.5" />
							To inbox
						</button>
					) : null}
					{item.state !== "discarded" ? (
						<button
							type="button"
							onClick={() =>
								setItemState({ itemId: item._id, state: "discarded" })
							}
							className="inline-flex cursor-pointer items-center gap-2 border-2 border-stroke-strong px-4 py-2 font-mono text-xs font-semibold uppercase tracking-wide text-fg-secondary transition-colors hover:border-red-400 hover:text-red-400"
						>
							<X className="size-3.5" />
							Discard
						</button>
					) : null}
				</div>
			</div>
		</div>
	);
}

export function NewsInboxSection() {
	const [state, setState] = useState<ItemState>("inbox");
	const items = useQuery(api.news.listItems, { state });
	const topics = useQuery(api.news.listTopics);
	const counts = useQuery(api.news.countItems);

	return (
		<>
			<QuickAdd />

			<div className="mb-6 flex flex-wrap items-center gap-2">
				{(["inbox", "approved", "discarded"] as const).map((value) => (
					<button
						key={value}
						type="button"
						onClick={() => setState(value)}
						className={`border-2 px-4 py-2 font-mono text-xs font-semibold uppercase tracking-wide transition-colors ${
							state === value
								? "border-accent-lime text-accent-lime"
								: "border-stroke-subtle text-fg-muted hover:text-fg-primary"
						}`}
					>
						{STATE_LABEL[value]}
						{counts ? ` (${counts[value]})` : ""}
					</button>
				))}
			</div>

			{items === undefined ? (
				<p className="font-mono text-sm text-fg-muted">Loading...</p>
			) : !items || items.length === 0 ? (
				<div className="border-2 border-dashed border-stroke-subtle px-4 py-12 text-center">
					<Inbox className="mx-auto mb-3 size-8 text-fg-muted" />
					<p className="font-mono text-sm text-fg-muted">
						Nothing in {STATE_LABEL[state].toLowerCase()}.
					</p>
				</div>
			) : (
				<div className="space-y-5">
					{items.map((item) => (
						<ItemCard key={item._id} item={item} topics={topics ?? []} />
					))}
				</div>
			)}
		</>
	);
}
