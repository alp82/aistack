import {
	buildPlaybook,
	type PlaybookReceipt,
	type PlaybookTrack,
	type WorkflowReading,
} from "@aistack/workflow-rules";
import { cn } from "@/lib/utils";
import {
	BODY_KICKERS,
	fmtMinutes,
	fmtNumber,
	fmtPercent,
	harnessLabelOf,
	MONO_LABEL,
	NO_CAUSE_CLAIMED,
	PHASE_ORDER,
	PHASE_PAINT,
	type WorkflowView,
} from "./copy";
import { BodyFootnote, BodyKicker, Legend, type Segment, Strip } from "./parts";

/**
 * The phase playbook: two measured shipping tracks plus receipt cards.
 *
 * Wayfinder ticket #215 (map #200). CONTEXT.md defines the playbook and the
 * receipt card; `playbook-rules/v1` computes both, and this renders them.
 *
 * THE TRACKS ARE A MEASURED SPLIT, NOT AN INTENT. Nothing recorded what a
 * session was for, so the rule splits on the median measured session and both
 * track names say exactly that. A reader who wants "quick fix" versus "feature
 * work" is reading a claim no rule computed.
 *
 * THE UNKNOWN BUCKET NEVER HIDES. It wears its own neutral paint in every strip
 * and prints as a share with its rule id, because "the unknown bucket ships as
 * a real number on the page, not as an embarrassment to hide" (spec).
 */
export function Playbook({ view }: { view: WorkflowView }) {
	const reading = view.section as WorkflowReading;
	const playbook = buildPlaybook(reading);
	const gated = view.section.harnesses.filter(
		(harness) => harness.phase === undefined,
	);

	return (
		<div>
			<BodyKicker>{BODY_KICKERS["phase-playbook"]}</BodyKicker>

			{playbook ? (
				<>
					<div className="grid gap-6 md:grid-cols-2">
						{playbook.tracks.map((track) => (
							<Track key={track.id} track={track} />
						))}
					</div>
					<Legend segments={phaseSegments(playbook.tracks[1])} />

					{playbook.receipts.length > 0 && (
						<div className="mt-6 grid gap-4 md:grid-cols-2">
							{playbook.receipts.map((receipt) => (
								<Receipt key={receipt.id} receipt={receipt} />
							))}
						</div>
					)}

					<BodyFootnote>
						{playbook.sessions} sessions split at the median measured session,{" "}
						{fmtMinutes(playbook.splitMinutes)} · {playbook.ruleVersion} ·{" "}
						{view.phaseRuleVersions.join(" · ")}
					</BodyFootnote>
				</>
			) : (
				<p className="text-sm text-fg-secondary">
					Not enough sessions in this window for a median. The phase mix above
					still holds.
				</p>
			)}

			{gated.length > 0 && (
				<BodyFootnote>
					held back by the playbook gate:{" "}
					{gated.map((harness) => harnessLabelOf(harness.harness)).join(" · ")}{" "}
					· a harness ships its playbook only when the rules leave 20% or less
					of its measured time unclassified
				</BodyFootnote>
			)}
		</div>
	);
}

function phaseSegments(track: PlaybookTrack): Segment[] {
	return PHASE_ORDER.filter((phase) => track.phaseShare[phase] > 0).map(
		(phase) => ({
			key: phase,
			value: track.phaseShare[phase],
			paint: PHASE_PAINT[phase],
			label: phase,
		}),
	);
}

function Track({ track }: { track: PlaybookTrack }) {
	return (
		<div className="border border-stroke-subtle p-4">
			<div className="flex flex-wrap items-baseline justify-between gap-x-4">
				<h4 className="text-base font-bold text-fg-primary">{track.label}</h4>
				<p className={cn(MONO_LABEL, "text-fg-muted")}>
					{track.sessions} sessions
				</p>
			</div>
			<p className="mt-1 font-mono text-[11px] text-fg-muted">{track.scope}</p>

			<Strip className="mt-4" height="h-4" segments={phaseSegments(track)} />

			<p className="mt-3 font-mono text-xs text-fg-secondary">
				median{" "}
				<b className="text-fg-primary">{fmtMinutes(track.medianMinutes)}</b> ·
				review rounds{" "}
				<b className="text-fg-primary">{fmtNumber(track.medianReviewRounds)}</b>{" "}
				· merged{" "}
				<b className="text-fg-primary">{fmtPercent(track.mergedShare)}</b>
			</p>
		</div>
	);
}

/**
 * One receipt card: a habit, both sides of it, and one median figure.
 *
 * The head names the two sides and claims no direction, and the footnote says
 * the rest. Which side is larger is the reading's answer.
 */
function Receipt({ receipt }: { receipt: PlaybookReceipt }) {
	const widest = Math.max(...receipt.sides.map((side) => side.value), 0);
	return (
		<div className="flex flex-col border border-stroke-subtle p-4">
			<p className="text-sm font-bold leading-snug text-fg-primary">
				{receipt.head}
			</p>
			<div className="mt-3 grid gap-2">
				{receipt.sides.map((side) => (
					<div key={side.label} className="flex items-center gap-3">
						<span className="w-36 shrink-0 text-xs text-fg-secondary">
							{side.label}
						</span>
						<span className="h-3 flex-1 bg-bg-panel">
							<span
								className="block h-full"
								style={{
									width: `${widest > 0 ? Math.max(2, (side.value / widest) * 100) : 2}%`,
									background: PHASE_PAINT.verify,
								}}
							/>
						</span>
						<span className="w-12 shrink-0 text-right font-mono text-sm font-bold text-fg-primary">
							{fmtNumber(side.value)}
						</span>
					</div>
				))}
			</div>
			<p className={cn(MONO_LABEL, "mt-auto pt-3 text-fg-muted")}>
				{receipt.unit} · {NO_CAUSE_CLAIMED}
			</p>
		</div>
	);
}
