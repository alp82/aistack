import { Check, EyeOff } from "lucide-react";
import { cn } from "@/lib/utils";
import { KEPT_PRIVATE } from "./copy";
import { MONO_LABEL, PBtn } from "./parts";
import type { KeptPrivateName, KeptPrivateRun } from "./useKeptPrivate";

/**
 * The third secondary view - wayfinder #51, building the grilling #48.
 *
 * It sits beside `Added` and `Hidden`, which already live OUTSIDE the progress
 * meter. That is what makes room for it: these names are not work the meter is
 * counting down, and putting them inside it would swamp the one number the page
 * is built around.
 *
 * The whole view exists because of one property #44 made true and #48 had to
 * pay for: a kept-private name never crosses the wire, so ticking names on the
 * web is not a placement decision - it is a decision to upload the names the
 * owner has not agreed to publish. The switch is the price, and it is rendered
 * first, above the names, so it is read before it matters.
 */
function Row({
	row,
	run,
	ticked,
}: {
	row: KeptPrivateName;
	run: KeptPrivateRun;
	ticked: boolean;
}) {
	return (
		<div className="flex items-center gap-3 px-4 py-3">
			<span className="min-w-0 flex-1 truncate font-mono text-sm text-fg-primary">
				{row.name}
			</span>
			{row.count !== undefined && (
				<span className="shrink-0 font-mono text-[11px] text-fg-muted">
					{row.count}x
				</span>
			)}
			{ticked && (
				<span className="shrink-0 font-mono text-[11px] text-accent-lime">
					{KEPT_PRIVATE.TICKED}
				</span>
			)}
			{row.published ? (
				<PBtn tone="danger" onClick={() => void run.keepPrivate([row])}>
					<EyeOff className="size-3" /> {KEPT_PRIVATE.KEEP_PRIVATE}
				</PBtn>
			) : (
				<PBtn tone="ghost" onClick={() => void run.publish([row])}>
					<Check className="size-3" /> {KEPT_PRIVATE.PUBLISH}
				</PBtn>
			)}
		</div>
	);
}

function Switch({ run }: { run: KeptPrivateRun }) {
	return (
		<label className="mb-8 flex cursor-pointer items-start gap-3 border border-stroke-strong bg-bg-panel/40 p-4">
			<input
				type="checkbox"
				checked={run.reviewEnabled}
				onChange={(e) => void run.toggleReview(e.target.checked)}
				className="mt-0.5 size-4 shrink-0 cursor-pointer accent-accent-lime"
			/>
			<span className="min-w-0">
				<span className="block text-sm font-semibold text-fg-primary">
					{KEPT_PRIVATE.SWITCH}
				</span>
				<span className="mt-1 block text-sm text-fg-secondary">
					{KEPT_PRIVATE.SWITCH_HELP}
				</span>
			</span>
		</label>
	);
}

export function KeptPrivatePane({
	run,
	hasSnapshot,
}: {
	run: KeptPrivateRun;
	hasSnapshot: boolean;
}) {
	const empty = run.groups.length === 0;

	// Loading is not "nothing kept private" (#46 recorded the same trap on the
	// public display): a list that has not arrived and a list that is empty look
	// identical, and one of them tells the owner to go and sync for no reason.
	if (run.loading) {
		return (
			<p className="border border-stroke-subtle p-6 font-mono text-sm text-fg-muted">
				Loading...
			</p>
		);
	}

	return (
		<div>
			<Switch run={run} />

			{run.error && (
				<p className="mb-6 border border-destructive/40 bg-destructive/5 px-4 py-3 font-mono text-xs text-destructive">
					{run.error}
				</p>
			)}

			{empty ? (
				<p className="border border-stroke-subtle p-6 text-sm text-fg-secondary">
					{/* A never-synced stack is not an empty page (#43) - it has an
					    instruction, not a verdict. */}
					{hasSnapshot ? KEPT_PRIVATE.EMPTY : KEPT_PRIVATE.NEVER_SYNCED}
				</p>
			) : (
				<div className="space-y-6">
					{run.groups.map((group) => {
						const unpublished = group.names.filter((n) => !n.published);
						return (
							<div
								key={group.group ?? "__standalone"}
								className="border border-stroke-subtle divide-y divide-stroke-subtle"
							>
								{group.group !== null && (
									<div className="flex items-center justify-between gap-3 bg-bg-panel/40 px-4 py-2">
										<span className={cn(MONO_LABEL, "text-fg-secondary")}>
											{group.group}
										</span>
										{unpublished.length > 0 && (
											<PBtn
												tone="ghost"
												onClick={() => void run.publish(unpublished)}
											>
												{KEPT_PRIVATE.PUBLISH_ALL}
											</PBtn>
										)}
									</div>
								)}
								{group.names.map((row) => (
									<Row
										key={`${row.category}:${row.name}`}
										row={row}
										run={run}
										ticked={run.justTicked.includes(
											`${row.category}:${row.name}`,
										)}
									/>
								))}
							</div>
						);
					})}
				</div>
			)}
		</div>
	);
}
