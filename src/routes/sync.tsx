import {
	createFileRoute,
	Link,
	useCanGoBack,
	useNavigate,
	useRouter,
} from "@tanstack/react-router";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { CommandLine } from "@/features/measured/CommandLine";
import {
	HARNESS,
	KICKER,
	MONO_LABEL,
	SYNC_CMD,
} from "@/features/measured/copy";
import { seoMeta } from "@/lib/seo";
import { cn } from "@/lib/utils";

/**
 * The canonical "how syncing works" page (#58/#59). Every surface that teaches
 * the sync command points here — the stack page boxes, the reconcile banner,
 * the landing hero — so the full story lives in exactly one place.
 */
export const Route = createFileRoute("/sync")({
	component: SyncPage,
	head: () => ({
		meta: seoMeta({
			title: "Sync your stack - AI Stack",
			description:
				"Publish a rolling 30-day reading of what actually ran, straight from your own machine. One command, an approval gate, nothing else.",
			url: "/sync",
		}),
	}),
});

const STEPS: { title: string; body: string; cmd?: string }[] = [
	{
		title: "Sync",
		body: `Scans your local ${HARNESS} and Codex history and shows you the full summary in the terminal — every number, every name. On the first run it opens your browser to link this machine; you name it, and you can revoke it any time.`,
		cmd: SYNC_CMD,
	},
	{
		title: "Approve",
		body: "Nothing sends until you pick Publish. Cancel sends nothing. The exact bytes you approved go on the wire.",
	},
];

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
			<div className="mx-auto max-w-3xl">
				<BackButton />

				<p
					className={cn(MONO_LABEL, "mt-10 tracking-[0.25em] text-accent-lime")}
				>
					{KICKER}
				</p>
				<h1 className="mt-2 text-4xl font-black tracking-tighter text-fg-primary md:text-6xl">
					Sync your stack
				</h1>
				<p className="mt-4 max-w-xl text-fg-muted">
					A rolling 30-day reading of what actually ran, published from your own
					machine. One command, an approval gate, nothing else.
				</p>

				<div className="mt-10 space-y-8">
					{STEPS.map((s, i) => (
						<div key={s.title} className="flex gap-5">
							<span className="font-mono text-3xl font-black leading-none text-stroke-strong">
								{i + 1}
							</span>
							<div className="flex-1">
								<p className="font-mono text-sm font-semibold uppercase tracking-widest text-fg-primary">
									{s.title}
								</p>
								<p className="mt-1 max-w-lg text-sm text-fg-muted">{s.body}</p>
								{s.cmd && (
									<div className="mt-3 max-w-lg border border-stroke-strong bg-bg-panel">
										<CommandLine cmd={s.cmd} />
									</div>
								)}
							</div>
						</div>
					))}
				</div>

				<div className="mt-14 grid gap-px border border-stroke-subtle bg-stroke-subtle md:grid-cols-2">
					<div className="bg-bg-canvas p-6">
						<p className="font-mono text-xs font-semibold uppercase tracking-widest text-accent-lime">
							what publishes
						</p>
						<ul className="mt-3 space-y-1.5 text-sm text-fg-primary">
							{PUBLISHES.map((x) => (
								<li key={x}>· {x}</li>
							))}
						</ul>
					</div>
					<div className="bg-bg-canvas p-6">
						<p className="font-mono text-xs font-semibold uppercase tracking-widest text-fg-muted">
							what never leaves your machine
						</p>
						<ul className="mt-3 space-y-1.5 text-sm text-fg-muted">
							{STAYS.map((x) => (
								<li key={x}>· {x}</li>
							))}
						</ul>
					</div>
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
