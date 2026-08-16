import {
	createFileRoute,
	Link,
	useCanGoBack,
	useNavigate,
	useRouter,
} from "@tanstack/react-router";
import { ArrowLeft, ArrowRight, Check, Copy } from "lucide-react";
import { type ReactNode, useState } from "react";
import { AutoSyncNote } from "@/features/measured/AutoSyncNote";
import { KICKER, MONO_LABEL, SYNC_CMD } from "@/features/measured/copy";
import { seoMeta } from "@/lib/seo";
import { cn } from "@/lib/utils";

/**
 * The canonical "how syncing works" page (#58/#59). Every surface that teaches
 * the sync command points here - the stack page boxes, the reconcile banner,
 * the landing hero - so the full story lives in exactly one place.
 *
 * Command-sheet layout (the 2026-08 layout prototype, variant B, on the
 * proto/sync-command-sheet branch): the command is the typographic hero, set
 * larger than the headline, and every explanation folds into a closed
 * disclosure row so nothing competes with it until the reader asks.
 */
export const Route = createFileRoute("/sync")({
	component: SyncPage,
	head: () => ({
		meta: seoMeta({
			title: "Show what actually ran - AI Stack",
			description:
				"Publish the sessions, models, tokens, and cost behind your stack, straight from your own machine. One command with an approval gate.",
			url: "/sync",
		}),
	}),
});

// Copy locked by #130 (docs/prototypes/sync-path-2026-08.md), redistributed
// into the folds by the command-sheet redesign. Cancel is the safety line
// under the ask, never the ask. The harness list lives in the "what it reads"
// fold and nowhere else.
const PUBLISHES = [
	"models and their token shares",
	"sessions, active days, cache hits",
	"cost at API prices (optional)",
	"the rolling 30-day window",
	"tool and skill names you have approved",
];

const STAYS = [
	"prompts and transcripts",
	"file paths and repo names",
	"names you have not approved",
	"anything, when you cancel",
];

function SyncPage() {
	return (
		<div className="min-h-screen bg-bg-canvas px-6 py-12 md:px-16 md:py-16">
			<div className="mx-auto max-w-2xl">
				<BackButton />

				<p
					className={cn(MONO_LABEL, "mt-14 tracking-[0.25em] text-accent-lime")}
				>
					{KICKER}
				</p>
				<h1 className="mt-2 text-2xl font-black tracking-tighter text-fg-primary md:text-3xl">
					Show what actually ran
				</h1>
				<p className="mt-3 text-sm text-fg-muted">
					Publish the sessions, models, tokens, and cost behind your stack,
					straight from your own machine.
				</p>

				<CommandHero />

				{/* One fold per question. The boundary (#130) leads: what the tool
				    READS comes before what it sends. The page never names the chat
				    apps: the boundary sentence carries the fact. */}
				<div className="mt-14 border-t border-stroke-subtle">
					<Fold label="what it reads">
						<p>
							aistack reads files your agents already wrote on this machine.
							That is all it reads. Claude Code, Codex, opencode and pi-mono
							write those files.
						</p>
						<p className="mt-2">
							On the first run it opens your browser to link this machine. You
							name the machine and can revoke it any time.
						</p>
					</Fold>
					<Fold label="what publishes">
						<ul className="space-y-1.5">
							{PUBLISHES.map((x) => (
								<li key={x}>· {x}</li>
							))}
						</ul>
					</Fold>
					<Fold label="what never leaves your machine">
						<ul className="space-y-1.5">
							{STAYS.map((x) => (
								<li key={x}>· {x}</li>
							))}
						</ul>
						<p className="mt-3">
							Cancel sends nothing, and you keep the reading you just saw. The
							exact bytes you approved go on the wire.
						</p>
					</Fold>
					{/* The switch itself lives in the owner box on a stack page (#104).
					    This fold names it and points at it. It never repeats it. */}
					<Fold label="publish on a schedule">
						<AutoSyncNote />
					</Fold>
				</div>

				<Link
					to="/settings/machines"
					className="mt-10 inline-flex items-center gap-2 font-mono text-xs uppercase tracking-widest text-fg-muted hover:text-accent-lime"
				>
					manage linked machines <ArrowRight size={12} />
				</Link>
			</div>
		</div>
	);
}

/**
 * The hero: the one command the site teaches, set larger than the headline.
 * The reassurance line beside the copy button is the whole approval story in
 * miniature; the folds below carry the detail.
 */
function CommandHero() {
	const [copied, setCopied] = useState(false);

	return (
		<div className="mt-14 md:mt-20">
			<div className="border-y-2 border-accent-lime py-8 md:py-10">
				<div className="flex items-baseline gap-4">
					<span className="select-none font-mono text-xl text-fg-muted md:text-2xl">
						$
					</span>
					<code className="min-w-0 flex-1 break-all font-mono text-xl font-bold leading-snug text-fg-primary md:text-3xl">
						{SYNC_CMD}
					</code>
				</div>
				<div className="mt-6 flex flex-wrap items-center gap-4">
					<button
						type="button"
						aria-label={`Copy ${SYNC_CMD}`}
						onClick={() => {
							navigator.clipboard.writeText(SYNC_CMD);
							setCopied(true);
							setTimeout(() => setCopied(false), 1500);
						}}
						className="inline-flex cursor-pointer items-center gap-2 bg-accent-lime px-5 py-2.5 font-mono text-xs font-semibold uppercase tracking-widest text-bg-canvas transition-opacity hover:opacity-85"
					>
						{copied ? <Check size={14} /> : <Copy size={14} />}
						{/* The idle label stays in the grid invisibly so the button
						    keeps its width when the shorter "copied" swaps in. */}
						<span className="inline-grid text-center">
							<span className="invisible col-start-1 row-start-1" aria-hidden>
								copy command
							</span>
							<span className="col-start-1 row-start-1">
								{copied ? "copied" : "copy command"}
							</span>
						</span>
					</button>
					<p className="text-xs text-fg-muted">
						Prints everything first. Nothing sends until you pick Publish.
					</p>
				</div>
			</div>
		</div>
	);
}

/** One closed-by-default disclosure row. Native details, no script. */
function Fold({ label, children }: { label: string; children: ReactNode }) {
	return (
		<details className="group border-b border-stroke-subtle">
			<summary className="flex cursor-pointer list-none items-center justify-between py-4 [&::-webkit-details-marker]:hidden">
				<span className="font-mono text-xs font-semibold uppercase tracking-widest text-fg-primary group-open:text-accent-lime">
					{label}
				</span>
				<span className="font-mono text-sm text-fg-muted">
					<span className="group-open:hidden">+</span>
					<span className="hidden group-open:inline">−</span>
				</span>
			</summary>
			<div className="pb-5 text-sm text-fg-muted">{children}</div>
		</details>
	);
}

/**
 * Return the reader to the page they came from (owner request in the #58
 * round). Opened directly there is no "from", so it falls back to home.
 */
function BackButton() {
	const router = useRouter();
	const navigate = useNavigate();
	const canGoBack = useCanGoBack();

	return (
		<button
			type="button"
			onClick={() =>
				canGoBack ? router.history.back() : navigate({ to: "/" })
			}
			className={cn(
				MONO_LABEL,
				"inline-flex cursor-pointer items-center gap-2 text-fg-muted transition-colors hover:text-accent-lime",
			)}
		>
			<ArrowLeft className="size-3" />
			back
		</button>
	);
}
