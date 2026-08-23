/**
 * The admin inbox, rebuilt to the source digest the prototype settled (#235,
 * #238). The demo is `prototypes/news-inbox/index.html`.
 *
 * The shape follows from volume. One week of the 14 proved feeds held 194
 * items, and one aggregator served 100 of them. So the inbox groups the week by
 * source, biggest group first, and every group starts closed. A firehose is one
 * closed box with a count next to it, and it never buries the next source.
 *
 * A group is a BROWSING box, not a batch. The owner hand-picks a few items per
 * issue, so approve and discard sit on every row and nothing acts on a whole
 * group at once. Editing opens on a tap, below the row, and stays out of the
 * triage path.
 */
import { useAction, useMutation, useQuery } from "convex/react";
import {
	Check,
	ChevronDown,
	ChevronRight,
	Inbox,
	Plus,
	RotateCcw,
	Save,
	X,
} from "lucide-react";
import { useState } from "react";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";

type ItemState = "inbox" | "approved" | "discarded";

const STATE_LABEL: Record<ItemState, string> = {
	inbox: "Inbox",
	approved: "Stream",
	discarded: "Discarded",
};

/** How many rows an open group shows before the owner asks for more. */
const GROUP_PAGE = 20;

const DAY = 24 * 60 * 60 * 1000;

/** A short date. Today shows the time, because that is what tells rows apart. */
function when(ms: number | undefined): string {
	if (!ms) return "no date";
	const date = new Date(ms);
	if (Date.now() - ms < DAY) {
		return date.toISOString().slice(11, 16);
	}
	return date.toISOString().slice(0, 10);
}

/** How long a source has been failing, from its last good poll. */
function since(ms: number | undefined): string {
	if (!ms) return "ever";
	const hours = Math.round((Date.now() - ms) / (60 * 60 * 1000));
	if (hours < 1) return "under an hour";
	if (hours < 48) return `${hours}h`;
	return `${Math.round(hours / 24)}d`;
}

interface ItemRow {
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
}

interface Topic {
	_id: Id<"newsTopics">;
	name: string;
}

/**
 * Quick-add: a sticky bar that takes a URL and nothing else.
 *
 * The action reads the page title, so a headline field would only ask the owner
 * to type what the page already says. Topic and summary wait for the row
 * editor, where the item is already in front of them.
 */
function QuickAddBar() {
	const quickAdd = useAction(api.news.quickAdd);
	const [url, setUrl] = useState("");
	const [busy, setBusy] = useState(false);
	const [message, setMessage] = useState<string | null>(null);

	async function submit(e: React.FormEvent) {
		e.preventDefault();
		if (!url.trim() || busy) return;
		setBusy(true);
		setMessage(null);
		try {
			const result = await quickAdd({ url: url.trim() });
			setMessage(
				result.duplicate
					? `Already collected: ${result.headline}`
					: `Added: ${result.headline}`,
			);
			setUrl("");
		} catch (error) {
			setMessage(error instanceof Error ? error.message : "Could not add that");
		} finally {
			setBusy(false);
		}
	}

	return (
		<div className="sticky top-0 z-20 -mx-4 mb-4 border-b-2 border-stroke-strong bg-bg-canvas px-4 py-3 sm:-mx-6 sm:px-6">
			<form onSubmit={submit} className="flex gap-2">
				<input
					type="url"
					value={url}
					onChange={(e) => setUrl(e.target.value)}
					placeholder="Paste a link"
					aria-label="Paste a link"
					className="min-w-0 flex-1 border-2 border-stroke-subtle bg-bg-panel px-3 py-2 font-mono text-sm text-fg-primary placeholder:text-fg-muted focus:border-accent-lime focus:outline-none"
				/>
				<button
					type="submit"
					disabled={busy || !url.trim()}
					className="inline-flex shrink-0 cursor-pointer items-center justify-center gap-2 border-2 border-accent-lime bg-accent-lime px-4 py-2 font-mono text-xs font-semibold uppercase tracking-wide text-bg-canvas transition-colors hover:opacity-80 disabled:cursor-not-allowed disabled:opacity-40"
				>
					<Plus className="size-3.5" />
					{busy ? "Reading" : "Add"}
				</button>
			</form>
			{message ? (
				<p className="mt-2 font-mono text-xs text-fg-muted">{message}</p>
			) : null}
		</div>
	);
}

/**
 * A failing source, as ONE red line.
 *
 * The banner carries the name, the error, the age and a retry. Everything else
 * about the source, including the URL and the poll history, stays on the
 * Sources view: this line exists to say the inbox is missing items, not to
 * become a second source editor.
 */
function FailureBanners() {
	const sources = useQuery(api.news.listSources);
	const pollSourceNow = useAction(api.news.pollSourceNow);
	const [busyId, setBusyId] = useState<string | null>(null);
	const [result, setResult] = useState<Record<string, string>>({});

	const failing = (sources ?? []).filter(
		(source) => source.enabled && source.consecutiveFailures > 0,
	);
	if (failing.length === 0) return null;

	async function retry(sourceId: Id<"newsSources">) {
		setBusyId(sourceId);
		try {
			const report = await pollSourceNow({ sourceId });
			setResult((prev) => ({
				...prev,
				[sourceId]: report.error
					? `Still failing: ${report.error}`
					: `Read it: ${report.added} new items`,
			}));
		} catch (error) {
			setResult((prev) => ({
				...prev,
				[sourceId]: error instanceof Error ? error.message : "The retry failed",
			}));
		} finally {
			setBusyId(null);
		}
	}

	return (
		<div className="mb-4 space-y-2">
			{failing.map((source) => (
				<div
					key={source._id}
					className="flex flex-wrap items-center gap-x-3 gap-y-2 border-2 border-red-400 bg-red-400/10 px-3 py-2 font-mono text-xs text-fg-primary"
				>
					<span className="font-semibold text-red-400">{source.name}</span>
					<span className="min-w-0 break-all text-fg-secondary">
						{source.lastError ?? "poll failed"}
					</span>
					<span className="text-fg-muted">
						failing for {since(source.lastOkAt)} · {source.consecutiveFailures}{" "}
						polls
					</span>
					{result[source._id] ? (
						<span className="text-fg-muted">{result[source._id]}</span>
					) : null}
					<button
						type="button"
						onClick={() => retry(source._id)}
						disabled={busyId === source._id}
						className="ml-auto shrink-0 cursor-pointer border-2 border-red-400 px-3 py-1 font-semibold uppercase tracking-wide text-red-400 transition-colors hover:bg-red-400 hover:text-bg-canvas disabled:cursor-not-allowed disabled:opacity-40"
					>
						{busyId === source._id ? "Reading" : "Retry"}
					</button>
				</div>
			))}
		</div>
	);
}

/** The verdict buttons. Every state offers the two moves it is not already in. */
function Verdicts({ item }: { item: ItemRow }) {
	const setItemState = useMutation(api.news.setItemState);
	const move = (state: ItemState) => setItemState({ itemId: item._id, state });

	return (
		<span className="flex shrink-0 gap-1.5">
			{item.state !== "approved" ? (
				<button
					type="button"
					onClick={() => move("approved")}
					aria-label={`Approve ${item.headline}`}
					className="inline-flex size-8 cursor-pointer items-center justify-center border-2 border-stroke-subtle text-fg-secondary transition-colors hover:border-accent-lime hover:text-accent-lime"
				>
					<Check className="size-4" />
				</button>
			) : null}
			{item.state !== "inbox" ? (
				<button
					type="button"
					onClick={() => move("inbox")}
					aria-label={`Return ${item.headline} to the inbox`}
					className="inline-flex size-8 cursor-pointer items-center justify-center border-2 border-stroke-subtle text-fg-secondary transition-colors hover:border-accent-lime hover:text-accent-lime"
				>
					<RotateCcw className="size-4" />
				</button>
			) : null}
			{item.state !== "discarded" ? (
				<button
					type="button"
					onClick={() => move("discarded")}
					aria-label={`Discard ${item.headline}`}
					className="inline-flex size-8 cursor-pointer items-center justify-center border-2 border-stroke-subtle text-fg-secondary transition-colors hover:border-red-400 hover:text-red-400"
				>
					<X className="size-4" />
				</button>
			) : null}
		</span>
	);
}

/** The editor, which opens under a row on a tap and never blocks a verdict. */
function ItemEditor({ item, topics }: { item: ItemRow; topics: Topic[] }) {
	const updateItem = useMutation(api.news.updateItem);
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
		<div className="border-t-2 border-stroke-subtle bg-bg-canvas p-3">
			<div className="mb-3 flex flex-wrap items-center gap-2 font-mono text-xs text-fg-muted">
				<span className="border border-stroke-subtle px-2 py-0.5">
					{item.licenseClass}
				</span>
				<span>{item.intake}</span>
				<a
					href={item.url}
					target="_blank"
					rel="noopener noreferrer"
					className="border border-stroke-subtle px-2 py-0.5 transition-colors hover:border-accent-lime hover:text-accent-lime"
				>
					Open link
				</a>
			</div>

			<input
				type="text"
				value={headline}
				onChange={(e) => setHeadline(e.target.value)}
				aria-label="Headline"
				className="mb-2 w-full border-2 border-stroke-subtle bg-bg-panel px-3 py-2 font-mono text-sm font-semibold text-fg-primary focus:border-accent-lime focus:outline-none"
			/>
			<textarea
				value={summary}
				onChange={(e) => setSummary(e.target.value)}
				rows={3}
				aria-label="Summary"
				placeholder="Summary in our own words. The drafting skill fills this in."
				className="mb-2 w-full border-2 border-stroke-subtle bg-bg-panel px-3 py-2 font-mono text-sm text-fg-primary placeholder:text-fg-muted focus:border-accent-lime focus:outline-none"
			/>
			<div className="flex flex-wrap items-center gap-3">
				<select
					value={item.topicId ?? ""}
					onChange={(e) => pickTopic(e.target.value)}
					aria-label="Topic"
					className="border-2 border-stroke-subtle bg-bg-panel px-3 py-2 font-mono text-xs text-fg-primary focus:border-accent-lime focus:outline-none"
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
			</div>
		</div>
	);
}

/** One triage row: the verdict first, and the editor behind a tap. */
function ItemRowView({
	item,
	topics,
	showSource,
}: {
	item: ItemRow;
	topics: Topic[];
	showSource: boolean;
}) {
	const [open, setOpen] = useState(false);

	return (
		<div className="border-t border-stroke-subtle first:border-t-0">
			<div className="flex items-center gap-3 px-3 py-2">
				<button
					type="button"
					onClick={() => setOpen(!open)}
					className="min-w-0 flex-1 cursor-pointer text-left"
				>
					<span
						className={`block text-sm text-fg-primary ${open ? "font-semibold" : "truncate"}`}
					>
						{item.headline}
					</span>
					<span className="block font-mono text-xs text-fg-muted">
						{showSource ? `${item.sourceName ?? "Pasted by you"} · ` : ""}
						{when(item.publishedAt ?? item.collectedAt)}
						{item.summary ? " · drafted" : ""}
					</span>
				</button>
				<Verdicts item={item} />
			</div>
			{open ? <ItemEditor item={item} topics={topics} /> : null}
		</div>
	);
}

interface GroupSummary {
	key: string;
	sourceId: Id<"newsSources"> | null;
	name: string;
	licenseClass: string;
	count: number;
}

/** The rows of one open group, and the button that asks for the next page. */
function GroupRows({
	rows,
	total,
	topics,
	onMore,
}: {
	rows: ItemRow[];
	total: number;
	topics: Topic[];
	onMore: () => void;
}) {
	return (
		<>
			{rows.map((item) => (
				<ItemRowView
					key={item._id}
					item={item}
					topics={topics}
					showSource={false}
				/>
			))}
			{total > rows.length ? (
				<button
					type="button"
					onClick={onMore}
					className="w-full cursor-pointer border-t border-stroke-subtle px-3 py-2 font-mono text-xs font-semibold uppercase tracking-wide text-fg-muted transition-colors hover:text-accent-lime"
				>
					Show {Math.min(GROUP_PAGE, total - rows.length)} more of {total}
				</button>
			) : null}
		</>
	);
}

/** One source, as a closed box with a count. It opens to browse, not to batch. */
function SourceGroup({
	group,
	topics,
}: {
	group: GroupSummary;
	topics: Topic[];
}) {
	const [open, setOpen] = useState(false);
	const [limit, setLimit] = useState(GROUP_PAGE);
	const items = useQuery(
		api.news.listGroupItems,
		open ? { key: group.key, limit } : "skip",
	);

	return (
		<div className="border-2 border-stroke-strong bg-bg-panel">
			<button
				type="button"
				onClick={() => setOpen(!open)}
				className="flex w-full cursor-pointer items-center gap-3 px-3 py-3 text-left"
			>
				{open ? (
					<ChevronDown className="size-4 shrink-0 text-fg-muted" />
				) : (
					<ChevronRight className="size-4 shrink-0 text-fg-muted" />
				)}
				<span className="min-w-0 flex-1">
					<span className="block truncate font-mono text-sm font-semibold text-fg-primary">
						{group.name}
					</span>
					<span className="block font-mono text-xs text-fg-muted">
						{group.licenseClass}
					</span>
				</span>
				<span
					className={`shrink-0 border-2 px-3 py-1 font-mono text-sm font-semibold ${
						group.count >= 30
							? "border-accent-lime text-accent-lime"
							: "border-stroke-subtle text-fg-secondary"
					}`}
				>
					{group.count}
				</span>
			</button>

			{open ? (
				<div className="border-t-2 border-stroke-subtle">
					{items === undefined ? (
						<p className="px-3 py-3 font-mono text-xs text-fg-muted">
							Loading...
						</p>
					) : (
						<GroupRows
							rows={(items ?? []) as ItemRow[]}
							total={group.count}
							topics={topics}
							onMore={() => setLimit(limit + GROUP_PAGE)}
						/>
					)}
				</div>
			) : null}
		</div>
	);
}

/** The digest itself: the inbox grouped by source, biggest group first. */
function SourceDigest({ topics }: { topics: Topic[] }) {
	const groups = useQuery(api.news.inboxGroups);
	const sources = useQuery(api.news.listSources);

	if (groups === undefined) {
		return <p className="font-mono text-sm text-fg-muted">Loading...</p>;
	}
	if (!groups || groups.length === 0) {
		return (
			<div className="border-2 border-dashed border-stroke-subtle px-4 py-12 text-center">
				<Inbox className="mx-auto mb-3 size-8 text-fg-muted" />
				<p className="font-mono text-sm text-fg-muted">The inbox is clear.</p>
			</div>
		);
	}

	const loud = new Set(groups.map((group) => group.name));
	const quiet = (sources ?? []).filter(
		(source) =>
			source.enabled &&
			source.consecutiveFailures === 0 &&
			!loud.has(source.name),
	);

	return (
		<div className="space-y-2">
			{groups.map((group) => (
				<SourceGroup key={group.key} group={group} topics={topics} />
			))}
			{quiet.length > 0 ? (
				<p className="pt-2 font-mono text-xs text-fg-muted">
					Quiet: {quiet.map((source) => source.name).join(", ")}. No failure, no
					items.
				</p>
			) : null}
		</div>
	);
}

/**
 * The stream and the discard pile, as a flat list, newest first.
 *
 * Only the inbox is grouped. These two views are read to check what a verdict
 * did, and grouping a read would hide the newest row behind a box.
 */
function FlatList({ state, topics }: { state: ItemState; topics: Topic[] }) {
	const items = useQuery(api.news.listItems, { state });

	if (items === undefined) {
		return <p className="font-mono text-sm text-fg-muted">Loading...</p>;
	}
	if (!items || items.length === 0) {
		return (
			<div className="border-2 border-dashed border-stroke-subtle px-4 py-12 text-center">
				<Inbox className="mx-auto mb-3 size-8 text-fg-muted" />
				<p className="font-mono text-sm text-fg-muted">
					Nothing in {STATE_LABEL[state].toLowerCase()}.
				</p>
			</div>
		);
	}

	return (
		<div className="border-2 border-stroke-strong bg-bg-panel">
			{(items as ItemRow[]).map((item) => (
				<ItemRowView key={item._id} item={item} topics={topics} showSource />
			))}
		</div>
	);
}

export function NewsInboxSection() {
	const [state, setState] = useState<ItemState>("inbox");
	const topics = useQuery(api.news.listTopics);
	const counts = useQuery(api.news.countItems);

	return (
		<>
			<QuickAddBar />
			<FailureBanners />

			<div className="mb-4 flex flex-wrap items-center gap-2">
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

			{state === "inbox" ? (
				<SourceDigest topics={topics ?? []} />
			) : (
				<FlatList state={state} topics={topics ?? []} />
			)}
		</>
	);
}
