import {
	type LeadPart,
	type LeadSentence,
	renderLeadSentences,
} from "@aistack/workflow-rules";
import { useState } from "react";
import { cn } from "@/lib/utils";
import {
	MEASURED_TIME_NOTE,
	MONO_LABEL,
	PHASE_GLOSSARY,
	PHASE_PAINT,
	type WorkflowView,
} from "./copy";
import { namedPhaseMix } from "./derive";
import { Legend } from "./parts";

/**
 * The deterministic template lead: `lead-templates/v1`, wording locked in #220,
 * with the phase mix under it as a stacked bar (#284).
 *
 * THIS COMPONENT OWNS THE MARKUP AND NOTHING ELSE. The words and the numbers
 * come from `renderLeadSentences`, which returns typed parts precisely so that
 * "which part the reader sees highlighted" stays a styling decision here rather
 * than a baked string there. The lead withholds itself below 20 sessions and
 * when no harness passed the playbook gate; both floors live in the rule, so an
 * empty list is the answer and this renders nothing.
 *
 * TWO `?` MARKERS, NO MORE (#220). One on the first phase name, opening one
 * card that defines all four phases. One on "measured time", which a reader
 * would otherwise take for wall-clock time.
 *
 * NO RULE ID (#277). The unknown share still prints as a number; the code part
 * that named its rule is dropped here, because nothing about rules prints.
 */
export function Lead({ view }: { view: WorkflowView }) {
	const [open, setOpen] = useState<"phases" | "measured-time" | null>(null);
	const sentences = renderLeadSentences(view.lead);
	if (sentences.length === 0) return null;

	const toggle = (card: "phases" | "measured-time") =>
		setOpen((held) => (held === card ? null : card));

	return (
		<div className="mb-7 max-w-3xl">
			{sentences.map((sentence) => (
				<LeadLine
					key={sentence.id}
					sentence={sentence}
					open={open}
					onToggle={toggle}
				/>
			))}
			{open === "phases" && <PhaseCard onClose={() => setOpen(null)} />}
			{open === "measured-time" && (
				<NoteCard text={MEASURED_TIME_NOTE} onClose={() => setOpen(null)} />
			)}
			<PhaseBar view={view} />
		</div>
	);
}

/** The four named phases rescaled to 100, each segment labeled where it has room. */
function PhaseBar({ view }: { view: WorkflowView }) {
	const mix = namedPhaseMix(view);
	if (mix.length === 0) return null;
	return (
		<div className="mt-4">
			<div
				role="img"
				aria-label="measured time by phase"
				className="flex h-7 w-full gap-0.5"
			>
				{mix.map((entry) => (
					<span
						key={entry.phase}
						className="relative block"
						style={{
							flexGrow: Math.max(entry.share, 0.004),
							flexBasis: 0,
							background: PHASE_PAINT[entry.phase],
						}}
					>
						{entry.share > 0.09 && (
							<span
								className={cn(
									"absolute top-1/2 left-2 -translate-y-1/2 whitespace-nowrap font-mono text-[11px] font-bold",
									entry.phase === "scout" ? "text-fg-primary" : "text-bg-shell",
								)}
							>
								{entry.phase} {Math.round(entry.share * 100)}%
							</span>
						)}
					</span>
				))}
			</div>
			<Legend
				entries={mix.map((entry) => ({
					key: entry.phase,
					paint: PHASE_PAINT[entry.phase],
					label: `${entry.phase} ${Math.round(entry.share * 100)}%`,
				}))}
			/>
		</div>
	);
}

const LINE_CLASS: Record<string, string> = {
	scope: cn(MONO_LABEL, "text-fg-muted"),
	"phase-mix": "mt-3 text-xl leading-relaxed text-fg-primary md:text-2xl",
	stats: "mt-4 font-mono text-xs text-fg-secondary md:text-sm",
	"unknown-share": "mt-3 font-mono text-[11px] text-fg-muted",
};

function LeadLine({
	sentence,
	open,
	onToggle,
}: {
	sentence: LeadSentence;
	open: string | null;
	onToggle: (card: "phases" | "measured-time") => void;
}) {
	// The phase name is the FIRST value part of the mix sentence in both of its
	// forms, the ranked one and the even-split one. Keying on the position keeps
	// this renderer out of the business of parsing the template's words.
	let phaseMarkerUsed = sentence.id !== "phase-mix";
	let timeMarkerUsed = sentence.id !== "phase-mix";
	const parts = withoutRuleId(sentence.parts);

	return (
		<p className={LINE_CLASS[sentence.id] ?? "text-fg-primary"}>
			{parts.map((part, index) => {
				const key = `${sentence.id}-${index}`;
				if (part.kind === "value" && !phaseMarkerUsed) {
					phaseMarkerUsed = true;
					return (
						<span key={key}>
							<Value part={part} />
							<Marker
								label="What the phases mean"
								open={open === "phases"}
								onClick={() => onToggle("phases")}
							/>
						</span>
					);
				}
				if (part.kind === "text" && !timeMarkerUsed) {
					const at = part.text.indexOf("measured time");
					if (at >= 0) {
						timeMarkerUsed = true;
						const end = at + "measured time".length;
						return (
							<span key={key}>
								{part.text.slice(0, end)}
								<Marker
									label="What measured time means"
									open={open === "measured-time"}
									onClick={() => onToggle("measured-time")}
								/>
								{part.text.slice(end)}
							</span>
						);
					}
				}
				if (part.kind === "value") return <Value key={key} part={part} />;
				return <span key={key}>{part.text}</span>;
			})}
		</p>
	);
}

/** The sentence without its code parts, and without the separator that led into one. */
function withoutRuleId(parts: readonly LeadPart[]): LeadPart[] {
	const kept: LeadPart[] = [];
	parts.forEach((part, index) => {
		if (part.kind === "code") return;
		const next = parts[index + 1];
		if (part.kind === "text" && next?.kind === "code") {
			const trimmed = part.text.replace(/\s*·\s*$/, "");
			if (trimmed) kept.push({ kind: "text", text: trimmed });
			return;
		}
		kept.push(part);
	});
	return kept;
}

function Value({ part }: { part: LeadPart }) {
	return <span className="font-bold text-fg-primary">{part.text}</span>;
}

function Marker({
	label,
	open,
	onClick,
}: {
	label: string;
	open: boolean;
	onClick: () => void;
}) {
	return (
		<button
			type="button"
			onClick={onClick}
			aria-label={label}
			aria-expanded={open}
			className={cn(
				"ml-0.5 align-super font-mono text-[10px] leading-none",
				open ? "text-accent-lime" : "text-fg-muted hover:text-accent-lime",
			)}
		>
			?
		</button>
	);
}

function PhaseCard({ onClose }: { onClose: () => void }) {
	return (
		<NoteShell onClose={onClose}>
			<dl className="grid gap-2">
				{PHASE_GLOSSARY.map((entry) => (
					<div key={entry.phase} className="flex items-baseline gap-3">
						<span
							aria-hidden="true"
							className="mt-1 size-2 shrink-0 self-start"
							style={{ background: PHASE_PAINT[entry.phase] }}
						/>
						<dt className={cn(MONO_LABEL, "w-20 shrink-0 text-fg-primary")}>
							{entry.phase}
						</dt>
						<dd className="text-sm text-fg-secondary">{entry.text}</dd>
					</div>
				))}
			</dl>
		</NoteShell>
	);
}

function NoteCard({ text, onClose }: { text: string; onClose: () => void }) {
	return (
		<NoteShell onClose={onClose}>
			<p className="text-sm text-fg-secondary">{text}</p>
		</NoteShell>
	);
}

function NoteShell({
	children,
	onClose,
}: {
	children: React.ReactNode;
	onClose: () => void;
}) {
	return (
		<div className="mt-4 border border-stroke-subtle bg-bg-panel/50 p-4">
			{children}
			<button
				type="button"
				onClick={onClose}
				className={cn(MONO_LABEL, "mt-3 text-fg-muted hover:text-accent-lime")}
			>
				close
			</button>
		</div>
	);
}
