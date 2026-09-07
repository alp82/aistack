import { ChevronDown } from "lucide-react";
import { type KeyboardEvent, type ReactNode, useRef } from "react";
import { cn } from "@/lib/utils";
import { ContextBody, ContextSummary } from "./ContextRow";
import type { ContextReading } from "./context";
import { EMPTY_TOPIC, type RangeId } from "./copy";
import { LeadCard, ScanRow } from "./grid";
import type { Group, Item } from "./items";

/** The id the Context row answers to in the open-topic state. */
export const CONTEXT_TOPIC = "context";

/**
 * The five topics under the top block (#356, prototype v37 "feature"): one
 * row per topic in fixed order, each a one-line summary (the label in the
 * accent, up to three figures) over the first picture its rows draw, as a
 * watermark.
 *
 * EXCLUSIVE: zero or one topic is open. Opening a topic closes the other, and
 * the open topic closes on a second click. The open one expands to the
 * topic's lead chart on the left (`LeadCard`) and one scan line per remaining
 * item on the right (`ScanRow`).
 *
 * THE CONTEXT ROW LEADS (#359). When the server hands a context reading, it
 * prints as the first row, before Time, in the same shape as the topics and in
 * the same exclusive set; the section opens it by default. Its body is the
 * per-harness grid, not a lead and scan rows. No reading, no row.
 *
 * NOTHING PRINTS TWICE ON THE ACCESSIBLE TREE. The summary row is the
 * heading's name; the watermark behind it (`watermark(group)`, one picture per
 * topic) is decorative and hidden, so it adds no second figure. The lead is
 * the topic's named lead item (`group.lead`) or, failing that, the first item
 * with a body; whichever it is, that item appears on one side only.
 */
export function UsageAccordion({
	groups,
	items,
	value,
	onChange,
	range,
	watermark,
	context = null,
}: {
	groups: readonly Group[];
	items: (group: Group) => Item[];
	value: string | null;
	onChange: (id: string | null) => void;
	range: RangeId;
	watermark: (group: Group) => ReactNode;
	/** The Context row's reading (#359). Null prints no row. */
	context?: ContextReading;
}) {
	const buttons = useRef<(HTMLButtonElement | null)[]>([]);
	const offset = context ? 1 : 0;
	const count = groups.length + offset;

	const onKeyDown = (
		event: KeyboardEvent<HTMLButtonElement>,
		index: number,
	) => {
		const target = topicKeyTarget(event.key, index, count);
		if (target === null) return;
		event.preventDefault();
		buttons.current[target]?.focus();
	};

	const rowProps = (id: string, index: number) => ({
		id,
		index,
		open: value === id,
		onToggle: () => onChange(value === id ? null : id),
		onKeyDown,
		buttonRef: (node: HTMLButtonElement | null) => {
			buttons.current[index] = node;
		},
	});

	return (
		<div className="mt-9 border-t border-stroke-subtle">
			{context && (
				<TopicRow
					{...rowProps(CONTEXT_TOPIC, 0)}
					label="Context"
					summary={<ContextSummary context={context} />}
					watermark={null}
				>
					<ContextBody context={context} />
				</TopicRow>
			)}
			{groups.map((group, index) => {
				const rows = items(group);
				// The named lead leads. Without it in this range, the first item with
				// a body stands in; without that, the first row.
				const featured =
					rows.find((item) => item.id === group.lead) ??
					rows.find((item) => item.body !== null) ??
					rows[0];
				const scan = featured ? rows.filter((item) => item !== featured) : rows;
				return (
					<TopicRow
						key={group.id}
						{...rowProps(group.id, index + offset)}
						label={group.label}
						watermark={watermark(group)}
						summary={rows.slice(0, 3).map((item) => (
							<span key={item.id}>
								<b className="font-mono text-fg-primary">{item.figure}</b>{" "}
								{item.name.toLowerCase()}
							</span>
						))}
					>
						{!featured ? (
							<p className="font-mono text-xs text-fg-muted">{EMPTY_TOPIC}</p>
						) : (
							<div className="grid gap-x-9 gap-y-6 md:grid-cols-[minmax(0,23rem)_1fr]">
								<LeadCard it={featured} range={range} />
								<div className="border-t border-stroke-subtle">
									{scan.map((item) => (
										<ScanRow key={item.id} it={item} range={range} />
									))}
								</div>
							</div>
						)}
					</TopicRow>
				);
			})}
		</div>
	);
}

/**
 * One row of the accordion: the label column, the summary line and the
 * chevron in a button inside a heading, over the body as a labelled region
 * when open. The Context row and the five topics share this one shape.
 */
function TopicRow({
	id,
	index,
	label,
	summary,
	watermark,
	open,
	onToggle,
	onKeyDown,
	buttonRef,
	children,
}: {
	id: string;
	index: number;
	label: string;
	summary: ReactNode;
	watermark: ReactNode;
	open: boolean;
	onToggle: () => void;
	onKeyDown: (event: KeyboardEvent<HTMLButtonElement>, index: number) => void;
	buttonRef: (node: HTMLButtonElement | null) => void;
	children: ReactNode;
}) {
	const buttonId = `usage-topic-${id}`;
	const panelId = `usage-panel-${id}`;
	return (
		<div className="border-b border-stroke-subtle">
			<h3 className="relative m-0">
				{watermark && (
					<span
						aria-hidden="true"
						data-testid="usage-watermark"
						className="pointer-events-none absolute inset-x-0 inset-y-1.5 overflow-hidden opacity-[0.22] [&>*]:h-full"
					>
						{watermark}
					</span>
				)}
				<button
					ref={buttonRef}
					type="button"
					id={buttonId}
					aria-expanded={open}
					aria-controls={panelId}
					data-testid="usage-topic"
					onClick={onToggle}
					onKeyDown={(event) => onKeyDown(event, index)}
					className="relative flex min-h-16 w-full cursor-pointer items-center gap-4 px-1 py-4 text-left transition-colors hover:bg-bg-panel/50 md:gap-5"
				>
					<span className="w-16 shrink-0 font-mono text-[11px] font-bold uppercase tracking-[0.14em] text-accent-lime md:w-20 md:text-xs">
						{label}
					</span>
					<span
						data-testid="usage-summary"
						className="flex min-w-0 flex-1 flex-wrap gap-x-4 gap-y-1 text-[13px] text-fg-secondary md:text-sm"
					>
						{summary}
					</span>
					<ChevronDown
						aria-hidden="true"
						className={cn(
							"size-4 shrink-0 text-fg-muted transition-transform",
							open && "rotate-180",
						)}
					/>
				</button>
			</h3>
			{/* A named section is a region: the heading's button labels it. */}
			{open && (
				<section
					id={panelId}
					aria-labelledby={buttonId}
					className="pb-7 pl-1 pt-2 md:pl-24"
				>
					{children}
				</section>
			)}
		</div>
	);
}

/**
 * Where the arrow keys move focus between the topic buttons: down and up wrap
 * around, Home and End jump to the ends. Any other key is not the accordion's
 * business and returns null. Enter and Space toggle the button natively.
 */
export function topicKeyTarget(
	key: string,
	index: number,
	count: number,
): number | null {
	if (count === 0) return null;
	switch (key) {
		case "ArrowDown":
			return (index + 1) % count;
		case "ArrowUp":
			return (index - 1 + count) % count;
		case "Home":
			return 0;
		case "End":
			return count - 1;
		default:
			return null;
	}
}
