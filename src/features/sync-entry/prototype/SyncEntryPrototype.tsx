/**
 * THROWAWAY PROTOTYPE: the guest cold-run storyboard, at /prototype/sync-entry.
 * The placements it explored shipped as `SyncCommand` in features/measured.
 * What is left is the open question: the approval page creating the stack.
 */
import { SYNC_CMD } from "@/features/measured/copy";
import { cn } from "@/lib/utils";

const LABEL = "font-mono text-xs font-semibold uppercase tracking-[0.15em]";

// --- The guest cold run -----------------------------------------------------

function Term({
	lines,
}: {
	lines: [tone: "in" | "out" | "ok", text: string][];
}) {
	return (
		<pre className="overflow-x-auto border border-stroke-strong bg-bg-shell p-4 font-mono text-xs leading-relaxed">
			{lines.map(([tone, text]) => (
				<div
					key={text}
					className={
						tone === "in"
							? "text-fg-primary"
							: tone === "ok"
								? "text-accent-lime"
								: "text-fg-muted"
					}
				>
					{tone === "in" ? "$ " : tone === "ok" ? "✓ " : "  "}
					{text}
				</div>
			))}
		</pre>
	);
}

function Frame({
	n,
	where,
	title,
	note,
	children,
}: {
	n: number;
	where: string;
	title: string;
	note: string;
	children: React.ReactNode;
}) {
	return (
		<li className="grid gap-4 border-t border-stroke-subtle py-8 md:grid-cols-[14rem_1fr] md:gap-10">
			<div>
				<p className={cn(LABEL, "text-accent-lime")}>
					0{n} · {where}
				</p>
				<p className="mt-2 text-lg font-bold tracking-tight text-fg-primary">
					{title}
				</p>
				<p className="mt-2 text-sm text-fg-muted">{note}</p>
			</div>
			<div className="min-w-0">{children}</div>
		</li>
	);
}

function LinkCard({ proposed }: { proposed?: boolean }) {
	return (
		<div className="border-2 border-stroke-strong bg-bg-panel p-5">
			<p className={cn(LABEL, proposed ? "text-accent-lime" : "text-fg-muted")}>
				{proposed ? "proposed" : "today"}
			</p>
			<p className="mt-3 font-bold text-fg-primary">Link this machine</p>
			<p className="mt-3 border-2 border-accent-lime bg-accent-lime/5 py-2 text-center font-mono text-xl font-black tracking-[0.3em] text-accent-lime">
				KQ7M-2XPD
			</p>
			{proposed ? (
				<>
					<p className={cn(LABEL, "mt-4 text-fg-muted")}>Your stack</p>
					<p className="mt-1.5 border border-stroke-strong bg-bg-canvas px-3 py-2 font-mono text-sm text-fg-primary">
						ada's stack
					</p>
					<p className="mt-1.5 text-xs text-fg-muted">
						Created when you link. The sync fills it in, and you can edit it
						afterward.
					</p>
					<p className="mt-4 bg-accent-lime px-3 py-2 text-center font-mono text-xs font-bold uppercase tracking-wider text-accent-lime-contrast">
						Create stack and link machine
					</p>
				</>
			) : (
				<>
					<p className="mt-4 border border-stroke-strong bg-bg-canvas p-3 font-mono text-xs leading-relaxed text-fg-muted">
						Create a stack first. Keep this page open, create one in a new tab,
						then return here to select it.
					</p>
					<p className="mt-4 bg-accent-lime px-3 py-2 text-center font-mono text-xs font-bold uppercase tracking-wider text-accent-lime-contrast opacity-40">
						Link machine
					</p>
				</>
			)}
		</div>
	);
}

export function ColdRunStoryboard() {
	return (
		<div className="min-h-screen bg-bg-canvas px-6 py-12 md:px-16">
			<div className="mx-auto max-w-4xl">
				<p className={cn(LABEL, "text-accent-lime")}>
					prototype · guest cold run
				</p>
				<h1 className="mt-2 text-3xl font-black tracking-tighter text-fg-primary">
					No account, no stack, one command
				</h1>
				<p className="mt-3 max-w-2xl text-sm text-fg-muted">
					Every guest placement promises that the command is enough. Four of
					these five frames already work. Frame 03 is the gap: today it sends
					the guest to a second tab to build a stack by hand.
				</p>
				<ol className="mt-10">
					<Frame
						n={1}
						where="terminal"
						title="Run the command"
						note="Works today. An unlinked machine starts the link flow inline."
					>
						<Term
							lines={[
								["in", SYNC_CMD],
								[
									"out",
									"This machine needs a destination stack. Linking it now.",
								],
								["out", "Opening aistack.to/cli/auth?code=KQ7M-2XPD"],
							]}
						/>
					</Frame>
					<Frame
						n={2}
						where="browser"
						title="Sign in or sign up"
						note="Works today. The redirect carries the code through sign-in."
					>
						<div className="border-2 border-stroke-strong bg-bg-panel p-5 text-sm text-fg-muted">
							/signin?redirect=/cli/auth?code=KQ7M-2XPD
						</div>
					</Frame>
					<Frame
						n={3}
						where="browser"
						title="Link the machine"
						note="The gap. The approval page should create the stack itself, with a name the guest can change, in the same click that links the machine."
					>
						<div className="grid gap-4 sm:grid-cols-2">
							<LinkCard />
							<LinkCard proposed />
						</div>
					</Frame>
					<Frame
						n={4}
						where="terminal"
						title="Scan, preview, approve"
						note="Works today. Nothing is sent before the approval."
					>
						<Term
							lines={[
								["ok", "Linked this machine to ada's stack"],
								["out", "Scanning local history"],
								["out", "412M tokens · 3 models · 61 sessions · 30 days"],
								["in", "Publish to aistack.to/@ada? (y/N) y"],
								["ok", "Published. aistack.to/@ada"],
							]}
						/>
					</Frame>
					<Frame
						n={5}
						where="browser"
						title="A stack with Stats"
						note="The stack exists with Stats and the measured models. Tools, description and projects are empty and editable."
					>
						<div className="border-2 border-stroke-strong bg-bg-panel p-5">
							<p className="font-black uppercase tracking-tight text-fg-primary">
								ada's stack
							</p>
							<p className="mt-1 font-mono text-xs text-fg-muted">
								412M tokens · last 30 days · checked just now
							</p>
						</div>
					</Frame>
				</ol>
				<div className="border-t border-stroke-subtle py-8">
					<p className={cn(LABEL, "text-fg-muted")}>open questions</p>
					<ul className="mt-3 list-disc space-y-1.5 pl-5 text-sm text-fg-secondary">
						<li>
							Is a stack that the link step creates public immediately, or
							unpublished until the owner opens it?
						</li>
						<li>
							What is the default name: the handle, or a field the guest must
							fill in?
						</li>
						<li>
							Does a stack with Stats and no listed tools pass the low-quality
							moderation rules?
						</li>
					</ul>
				</div>
			</div>
		</div>
	);
}
