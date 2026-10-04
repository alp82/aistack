/**
 * THROWAWAY: Where should sync be discoverable for guests and owners?
 * Three original approaches plus the selected A/C mix, variant D.
 * Cross-page gallery is intentional: compare all touchpoints in one place.
 * Before panels are condensed reconstructions of current components, not screenshots.
 * Fixture state only. Verdict pending owner review. Run: pnpm prototype:sync.
 */
import { ArrowLeft, ArrowRight, Check, Copy, Terminal, X } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";
import { SYNC_CMD } from "../copy";
import "./sync-discovery.prototype.css";

type Variant = "A" | "B" | "C" | "D";
type Audience = "guest" | "member";
type Props = {
	variant: Variant;
	audience: Audience;
	mobile: boolean;
	onChange: (
		next: Partial<Pick<Props, "variant" | "audience" | "mobile">>,
	) => void;
};
const variants = {
	A: "Inline command",
	B: "Guided setup",
	C: "Shared sync panel",
	D: "Selected A/C mix",
};
const variantKeys: Variant[] = ["A", "B", "C", "D"];
const locations = [
	"Header",
	"Homepage",
	"Own profile",
	"First sync",
	"Repeat sync",
	"Public Stats",
	"Sync guide",
];
const notes = [
	"An entry point on every page, visible on mobile. Profile remains accessible from the avatar.",
	"Explain the result and the next action within the first screen. Browse stays available.",
	"Use the profile as a reliable place to start. Show the first-sync task above the stack list.",
	"Bring the first-sync invitation above Stats and owner tools. An existing stack is assumed here.",
	"Expose the last sync and the refresh action. Offer automation after the first successful sync.",
	"Invite readers while they are looking at someone else's results. The invitation belongs to the reader.",
	"Keep the first-run sequence visible. Explain account and stack setup before sending guests to a terminal.",
];

export function SyncDiscoveryPrototype({
	variant,
	audience,
	mobile,
	onChange,
}: Props) {
	const [panel, setPanel] = useState<{
		audience: Audience;
		repeat?: boolean;
	} | null>(null);
	const [action, setAction] = useState("No action yet");
	const open = (who: Audience = audience, repeat = false) => {
		setPanel({ audience: who, repeat });
		setAction(
			`Opened sync instructions: ${who}${repeat ? ", repeat sync" : ""}`,
		);
	};
	useEffect(() => {
		const key = (e: KeyboardEvent) => {
			if (
				!(e.target instanceof Element) ||
				e.target.closest("input, textarea, select, [contenteditable], dialog")
			)
				return;
			if (e.key !== "ArrowLeft" && e.key !== "ArrowRight") return;
			e.preventDefault();
			const keys = variantKeys;
			onChange({
				variant:
					keys[
						(keys.indexOf(variant) +
							(e.key === "ArrowRight" ? 1 : keys.length - 1)) %
							keys.length
					],
			});
		};
		window.addEventListener("keydown", key);
		return () => window.removeEventListener("keydown", key);
	}, [variant, onChange]);
	const change = (v: Variant) => {
		onChange({ variant: v });
		setAction(`Viewing ${v}: ${variants[v]}`);
	};
	return (
		<main className="sync-prototype">
			<div className="sp-intro">
				<p className="sp-eyebrow">Design study / throwaway / local only</p>
				<h1>Make sync easy to find.</h1>
				<p>
					Seven locations. Current placement on the left, proposed placement on
					the right. D combines the chosen placements with a refined homepage.
					The original A, B and C remain available for comparison.
				</p>
				<div className="sp-controls">
					<label>
						Visitor{" "}
						<select
							value={audience}
							onChange={(e) =>
								onChange({ audience: e.target.value as Audience })
							}
						>
							<option value="guest">Guest / no account</option>
							<option value="member">Signed in / has stack</option>
						</select>
					</label>
					<label>
						<input
							type="checkbox"
							checked={mobile}
							onChange={(e) => onChange({ mobile: e.target.checked })}
						/>{" "}
						Narrow preview (375px)
					</label>
				</div>
				<div className="sp-approaches">
					{(Object.keys(variants) as Variant[]).map((v) => (
						<button
							type="button"
							key={v}
							aria-pressed={v === variant}
							onClick={() => change(v)}
						>
							<b>
								{v} / {variants[v]}
							</b>
							<span>
								{v === "D"
									? "Inline commands for owners, compact invitations for visitors."
									: v === "A"
										? "Teach the command directly at the point of need."
										: v === "B"
											? "Show progress and one next step before the terminal."
											: "Keep pages compact; put the full journey in a panel."}
							</span>
						</button>
					))}
				</div>
				<nav className="sp-jumps" aria-label="Prototype locations">
					{locations.map((name, i) => (
						<a key={name} href={`#sync-location-${i}`}>
							{String(i + 1).padStart(2, "0")} {name}
						</a>
					))}
				</nav>
				<p className="sp-fixture">
					Reconstructed previews, not screenshots. All people and readings are
					fixtures. Owner previews always simulate an owner, regardless of the
					visitor selector. No account, stack, or sync is created.
				</p>
			</div>
			{locations.map((location, index) => (
				<section
					key={location}
					id={`sync-location-${index}`}
					className="sp-location"
				>
					<div className="sp-location-title">
						<span className="sp-eyebrow">0{index + 1}</span>
						<h2>{location}</h2>
						<p>{notes[index]}</p>
					</div>
					<div
						className={`sp-comparison ${mobile ? "sp-narrow" : ""} ${index === 1 && variant === "D" ? "sp-home-comparison" : ""}`}
					>
						{[false, true].map((after) => (
							<div key={String(after)} className="sp-column">
								<div className="sp-caption">
									<b>{after ? `After / ${variant}` : "Before / current"}</b>
									<span>
										{index >= 2 && index <= 4
											? "Owner · has stack"
											: audience === "guest"
												? "Guest"
												: "Signed in"}
									</span>
								</div>
								<div className="sp-screen">
									<Preview
										index={index}
										after={after}
										variant={variant}
										audience={audience}
										open={open}
										report={setAction}
									/>
								</div>
							</div>
						))}
					</div>
				</section>
			))}
			<div className="sp-verdict">
				<p className="sp-eyebrow">Question for review</p>
				<h2>Where does sync feel obvious without taking over?</h2>
				<p>
					Selected direction: inline commands on owner surfaces; a shared panel
					for global navigation and public invitations. The homepage keeps
					discovery in the headline and sync as its primary action. Review its
					hierarchy and spacing before implementation.
				</p>
			</div>
			<div className="sp-switcher">
				<button
					type="button"
					aria-label="Previous variant"
					onClick={() =>
						change(
							variantKeys[
								(variantKeys.indexOf(variant) + variantKeys.length - 1) %
									variantKeys.length
							],
						)
					}
				>
					<ArrowLeft size={18} />
				</button>
				<div>
					<b>
						{variant} / {variants[variant]}
					</b>
					<small>
						{audience} · {mobile ? "375px" : "fluid"} · fixture data
					</small>
					<small aria-live="polite">{action}</small>
				</div>
				<button
					type="button"
					aria-label="Next variant"
					onClick={() =>
						change(
							variantKeys[
								(variantKeys.indexOf(variant) + 1) % variantKeys.length
							],
						)
					}
				>
					<ArrowRight size={18} />
				</button>
			</div>
			{panel && (
				<SyncPanel
					audience={panel.audience}
					repeat={panel.repeat}
					close={() => setPanel(null)}
					report={setAction}
				/>
			)}
		</main>
	);
}

function Command({ report }: { report: (message: string) => void }) {
	const [copied, setCopied] = useState(false);
	return (
		<div className="sp-command">
			<code>{SYNC_CMD}</code>
			<button
				type="button"
				aria-label="Copy sync command"
				onClick={async () => {
					await navigator.clipboard.writeText(SYNC_CMD);
					setCopied(true);
					report("Copied command. Run it yourself in a terminal.");
				}}
			>
				{copied ? <Check size={15} /> : <Copy size={15} />}{" "}
				{copied ? "Copied" : "Copy"}
			</button>
		</div>
	);
}
function CTA({
	children,
	onClick,
	quiet = false,
}: {
	children: React.ReactNode;
	onClick: () => void;
	quiet?: boolean;
}) {
	return (
		<button
			type="button"
			className={quiet ? "sp-link" : "sp-button"}
			onClick={onClick}
		>
			{children}
			<ArrowRight size={14} />
		</button>
	);
}
function Offer({
	variant,
	audience,
	report,
	open,
	compact = false,
}: {
	variant: Variant;
	audience: Audience;
	report: (m: string) => void;
	open: (who?: Audience, repeat?: boolean) => void;
	compact?: boolean;
}) {
	if (variant === "C")
		return (
			<div className="sp-launcher">
				<Terminal size={24} />
				<div>
					<b>
						{compact
							? "Add your first sync"
							: "See your AI usage on your stack"}
					</b>
					<p>Models, tokens and sessions from your coding agents.</p>
				</div>
				<CTA onClick={() => open(audience)}>Set up sync</CTA>
			</div>
		);
	if (variant === "B")
		return (
			<div className="sp-setup">
				<p className="sp-eyebrow">Your first sync</p>
				<h3>
					{audience === "guest"
						? "Your usage, in three steps."
						: "Your stack is ready for its first sync."}
				</h3>
				<ol className="sp-steps">
					<li className={audience === "member" ? "sp-done" : ""}>
						<span>{audience === "member" ? "✓" : "1"}</span>
						<div>
							<b>Create your stack</b>
							<small>
								{audience === "member"
									? "Done. Your stack exists."
									: "Sign in and give it a name."}
							</small>
						</div>
					</li>
					<li>
						<span>2</span>
						<div>
							<b>Run the sync command</b>
							<small>On the computer where you use your coding agents.</small>
						</div>
					</li>
					<li>
						<span>3</span>
						<div>
							<b>Review and publish</b>
							<small>Choose what appears on your stack.</small>
						</div>
					</li>
				</ol>
				<CTA onClick={() => open(audience)}>
					{audience === "guest"
						? "Create a stack to start"
						: "Get sync command"}
				</CTA>
			</div>
		);
	return (
		<div className="sp-offer">
			<p className="sp-eyebrow">Sync your stack</p>
			<h3>
				{compact
					? "Add your models, tokens and sessions."
					: "See your AI usage on your stack."}
			</h3>
			<p>Read usage from the coding agents on your machine.</p>
			<Command report={report} />
			<p className="sp-small">
				Run in your terminal. Review the summary before you publish.
			</p>
			{audience === "guest" && (
				<p className="sp-small">
					First time? You need an account and a stack before linking your
					machine.
				</p>
			)}
			<CTA quiet onClick={() => open(audience)}>
				{audience === "guest" ? "Get started / how it works" : "How it works"}
			</CTA>
		</div>
	);
}

function Preview({
	index,
	after,
	variant: selectedVariant,
	audience,
	open,
	report,
}: {
	index: number;
	after: boolean;
	variant: Variant;
	audience: Audience;
	open: (who?: Audience, repeat?: boolean) => void;
	report: (m: string) => void;
}) {
	const variant =
		selectedVariant === "D"
			? index === 0 || index === 5
				? "C"
				: "A"
			: selectedVariant;
	if (index === 1 && after && selectedVariant === "D") {
		return <SelectedHomepage audience={audience} open={open} report={report} />;
	}
	const beforeClick = (name: string) =>
		report(`Current UI: ${name}. Navigation is simulated in this gallery.`);
	const offer = (who: Audience = audience, compact = false) => (
		<Offer
			variant={variant}
			audience={who}
			compact={compact}
			open={open}
			report={report}
		/>
	);
	if (index === 0)
		return (
			<>
				<div className="sp-header">
					<strong>
						<i /> AI STACK
					</strong>
					<div className="sp-nav">Stacks &nbsp; Tools &nbsp; Leaderboard</div>
					{after ? (
						<CTA onClick={() => open()}>Sync your stack</CTA>
					) : (
						<CTA
							onClick={() =>
								beforeClick(
									audience === "guest"
										? "Share Stack opens the editor"
										: "Profile opens your profile",
								)
							}
						>
							{audience === "guest" ? "Share Stack" : "Profile"}
						</CTA>
					)}
					<span className="sp-avatar">{audience === "guest" ? "↗" : "JD"}</span>
				</div>
				<div className="sp-page-context">
					<p className="sp-eyebrow">Browsing / tools</p>
					<h3>Find your next tool.</h3>
					<div className="sp-tool-list">
						<span>Claude Code</span>
						<span>Codex</span>
						<span>opencode</span>
					</div>
				</div>
			</>
		);
	if (index === 1)
		return (
			<>
				<div className={`sp-home ${after ? "sp-home-after" : ""}`}>
					<p className="sp-eyebrow">For builders</p>
					<h2>
						SEE WHAT
						<br />
						BUILDERS
						<br />
						<em>USE TO SHIP.</em>
					</h2>
					<p>
						Explore the setups builders actually work in, synced straight from
						their machines.
					</p>
					{after ? (
						offer()
					) : (
						<div className="sp-actions">
							<CTA
								onClick={() =>
									beforeClick("Share Your Stack opens /stacks/new")
								}
							>
								Share Your Stack
							</CTA>
							<CTA quiet onClick={() => beforeClick("Browse opens /stacks")}>
								Browse
							</CTA>
						</div>
					)}
					{after && (
						<CTA quiet onClick={() => beforeClick("Browse opens /stacks")}>
							Browse stacks
						</CTA>
					)}
				</div>
				<div className="sp-pulse">
					<span className="sp-eyebrow">The last 24 hours</span>
					<strong>182M tokens</strong>
					{!after && <CTA onClick={() => open()}>add your tokens</CTA>}
				</div>
			</>
		);
	if (index === 2)
		return (
			<div className="sp-body">
				<p className="sp-eyebrow">Your profile</p>
				<div className="sp-identity">
					<span className="sp-avatar sp-avatar-large">JD</span>
					<div>
						<h2>Jamie Dev</h2>
						<p>@jamie · Building useful things with AI</p>
					</div>
				</div>
				{after && offer("member", true)}
				<h3 className="sp-section-heading">Your stacks</h3>
				<div className="sp-stack-card">
					<b>Jamie's coding stack</b>
					<p>Claude Code · Codex · Cursor</p>
					<span className="sp-small">Updated yesterday</span>
					<CTA quiet onClick={() => beforeClick("Open your stack")}>
						View stack
					</CTA>
				</div>
				{!after && (
					<p className="sp-small sp-annotation">
						No first-sync instruction at this point in the profile.
					</p>
				)}
			</div>
		);
	if (index === 3 || index === 4)
		return (
			<div className="sp-body">
				<p className="sp-eyebrow">@jamie / your stack</p>
				<h2>Jamie's coding stack</h2>
				<p>My everyday setup for building web apps.</p>
				<div className="sp-tool-list">
					<span>Claude Code</span>
					<span>Codex</span>
					<span>Cursor</span>
				</div>
				{after ? (
					index === 3 ? (
						offer("member", true)
					) : (
						<Repeat variant={variant} open={open} report={report} />
					)
				) : (
					<details className="sp-owner-tools">
						<summary>
							Owner tools {index === 4 && "· Updated 3 days ago"}
						</summary>
						<p>Auto-sync</p>
						<Command report={report} />
						<p className="sp-small">Manage suggestions and stack views.</p>
					</details>
				)}
				<div className="sp-section-heading">
					Stats <span className="sp-small">Last 30 days</span>
				</div>
				{index === 4 ? (
					<Stats />
				) : after ? (
					<p className="sp-small">Your first sync will fill this section.</p>
				) : (
					<div className="sp-old-empty">
						<h3>Your stack has not been measured yet.</h3>
						<p>
							One command reads your Claude Code history on your machine, shows
							you the full summary first, and publishes only what you approve.
						</p>
						<Command report={report} />
						<CTA quiet onClick={() => open("member")}>
							how syncing works
						</CTA>
					</div>
				)}
			</div>
		);
	if (index === 5)
		return (
			<div className="sp-body">
				<p className="sp-eyebrow">@morgan / public stack</p>
				<h2>Morgan's coding stack</h2>
				<div className="sp-section-heading">
					Stats <span className="sp-small">Last 30 days</span>
				</div>
				<Stats />
				{after ? (
					variant === "A" ? (
						<div className="sp-public-offer">
							<h3>Get these stats for your stack.</h3>
							<Command report={report} />
							<CTA quiet onClick={() => open()}>
								How to sync your stack
							</CTA>
						</div>
					) : variant === "B" ? (
						<div className="sp-public-offer">
							<p className="sp-eyebrow">Your turn</p>
							<h3>What does your AI usage look like?</h3>
							<p>Create your stack, run a sync, review your results.</p>
							<CTA onClick={() => open()}>
								{audience === "guest"
									? "Start your first sync"
									: "Sync your stack"}
							</CTA>
						</div>
					) : (
						<div className="sp-launcher">
							<Terminal size={22} />
							<b>Get these stats for your stack.</b>
							<CTA onClick={() => open()}>Sync yours</CTA>
						</div>
					)
				) : (
					<div className="sp-old-empty">
						<h3>Share your own stack</h3>
						<CTA
							onClick={() => beforeClick("Create your stack opens /stacks/new")}
						>
							Create your stack
						</CTA>
					</div>
				)}
			</div>
		);
	return (
		<div className="sp-body sp-guide">
			<p className="sp-eyebrow">{"// sync"}</p>
			<h2>{after ? "Sync your stack" : "Show what actually ran"}</h2>
			<p>
				Publish the sessions, models and tokens behind your stack, straight from
				your own machine.
			</p>
			{after ? (
				variant === "C" ? (
					<>
						<div className="sp-guide-benefits">
							<b>Understand your usage</b>
							<p>See your model mix, sessions and token usage.</p>
							<b>Choose what you share</b>
							<p>Review the summary before publishing.</p>
						</div>
						<CTA onClick={() => open()}>Open sync setup</CTA>
					</>
				) : (
					<>
						<p className="sp-small">
							Prompts and code stay on your machine. Review the summary before
							publishing.
						</p>
						{variant === "B" ? (
							offer()
						) : (
							<>
								<ol className="sp-guide-sequence">
									<li>
										{audience === "guest"
											? "Sign in and create your stack."
											: "Your stack is ready. Use the computer where you run your agents."}
									</li>
									<li>Run the command below in your terminal.</li>
									<li>
										Link this machine in the browser, then return to the
										terminal.
									</li>
									<li>Review the summary and choose Publish.</li>
								</ol>
								<Command report={report} />
								{audience === "guest" && (
									<CTA quiet onClick={() => open()}>
										Create a stack first
									</CTA>
								)}
							</>
						)}
					</>
				)
			) : (
				<>
					<p className="sp-small">
						Your prompts, responses, code, and file paths never leave your
						machine.
					</p>
					<div className="sp-old-command">
						<Command report={report} />
						<p className="sp-small">
							Prints everything first. Nothing sends until you pick Publish.
						</p>
					</div>
				</>
			)}
			{[
				"What it reads",
				"What publishes",
				"What stays on your machine",
				"Publish on a schedule",
			].map((label) => (
				<details key={label}>
					<summary>{label}</summary>
					<p>
						{label === "What it reads"
							? "Reads local history from supported coding agents. On the first run, the browser opens to link your machine."
							: label === "What publishes"
								? "Models, token counts, sessions and the tool names you approve. Cost sharing is optional."
								: label === "What stays on your machine"
									? "Prompts, responses, code and file paths."
									: "After your first sync, you can enable auto-sync on this machine."}
					</p>
				</details>
			))}
		</div>
	);
}
function Stats() {
	return (
		<>
			<div className="sp-stats">
				<div>
					<strong>24.8M</strong>
					<small>tokens</small>
				</div>
				<div>
					<strong>84</strong>
					<small>sessions</small>
				</div>
				<div>
					<strong>19</strong>
					<small>active days</small>
				</div>
			</div>
			<div className="sp-model">
				<span>Claude Sonnet</span>
				<b>62%</b>
				<div style={{ width: "62%" }} />
			</div>
			<div className="sp-model">
				<span>GPT</span>
				<b>38%</b>
				<div style={{ width: "38%" }} />
			</div>
		</>
	);
}
function Repeat({
	variant,
	open,
	report,
}: {
	variant: Variant;
	open: (who: Audience, repeat?: boolean) => void;
	report: (m: string) => void;
}) {
	const [auto, setAuto] = useState(false);
	return (
		<div className="sp-repeat">
			<div>
				<span className="sp-eyebrow">Last synced 3 days ago</span>
				<h3>Keep your stats current.</h3>
			</div>
			{variant === "A" ? (
				<Command report={report} />
			) : (
				<CTA onClick={() => open("member", true)}>Sync again</CTA>
			)}
			{variant === "B" ? (
				<ol className="sp-inline-steps">
					<li>✓ Stack created</li>
					<li>✓ Machine linked</li>
					<li>Next: refresh usage</li>
				</ol>
			) : null}
			<button
				type="button"
				className="sp-link"
				onClick={() => {
					setAuto(!auto);
					report(
						auto
							? "Demo: auto-sync disabled"
							: "Demo: auto-sync enabled. No settings saved.",
					);
				}}
			>
				{auto ? "✓ Auto-sync enabled (demo)" : "Set up auto-sync"}
			</button>
		</div>
	);
}
function SyncPanel({
	audience,
	repeat,
	close,
	report,
}: {
	audience: Audience;
	repeat?: boolean;
	close: () => void;
	report: (s: string) => void;
}) {
	const dialog = useRef<HTMLDialogElement>(null);
	const [ready, setReady] = useState(audience === "member");
	const [published, setPublished] = useState(false);
	useEffect(() => {
		dialog.current?.showModal();
	}, []);
	return (
		<dialog ref={dialog} className="sync-prototype sp-dialog" onClose={close}>
			<button
				type="button"
				className="sp-close"
				aria-label="Close sync instructions"
				onClick={close}
			>
				<X size={20} />
			</button>
			<p className="sp-eyebrow">Prototype / simulated setup</p>
			<h2>
				{published
					? "Your stats are ready."
					: repeat
						? "Refresh your stack"
						: "Your first sync"}
			</h2>
			{published ? (
				<>
					<p>Your stack now shows your models, tokens and sessions.</p>
					<Stats />
					<p className="sp-small">Demo only. Nothing was uploaded.</p>
					<CTA onClick={close}>Back to comparison</CTA>
				</>
			) : (
				<>
					<ol className="sp-steps">
						<li>
							<span>{ready ? "✓" : "1"}</span>
							<div>
								<b>
									{ready
										? "Your stack is ready"
										: "Create your account and stack"}
								</b>
								<p>
									{ready
										? "Jamie's coding stack · simulated owner"
										: "Sign in and name your stack before linking your machine."}
								</p>
								{!ready && (
									<CTA
										onClick={() => {
											setReady(true);
											report("Demo: account and stack created");
										}}
									>
										Simulate account + stack setup
									</CTA>
								)}
							</div>
						</li>
						<li>
							<span>2</span>
							<div>
								<b>Run this on your computer</b>
								<p>
									Use the terminal on the machine where you run Claude Code,
									Codex or another supported coding agent.
								</p>
								<Command report={report} />
								<p className="sp-small">
									First run: your browser opens to link the machine. Then return
									to the terminal.
								</p>
							</div>
						</li>
						<li>
							<span>3</span>
							<div>
								<b>Review, then publish</b>
								<p>
									The terminal shows the summary for approval. Prompts and code
									stay on your machine.
								</p>
							</div>
						</li>
					</ol>
					<button
						type="button"
						className="sp-button"
						disabled={!ready}
						onClick={() => {
							setPublished(true);
							report("Demo: first sync completed. No data published.");
						}}
					>
						Simulate completed sync <ArrowRight size={14} />
					</button>
					<p className="sp-small">
						Setup ready: {String(ready)} · published: false · persistence: none
					</p>
				</>
			)}
		</dialog>
	);
}

/** Selected direction: discovery headline, sync CTA, quick command, visible examples. */
function SelectedHomepage({
	audience,
	open,
	report,
}: {
	audience: Audience;
	open: (who?: Audience) => void;
	report: (message: string) => void;
}) {
	const examplesId = useId();
	return (
		<div className="sp-selected-home">
			<div className="sp-header">
				<strong>
					<i /> AI STACK
				</strong>
				<nav className="sp-nav" aria-label="Homepage preview navigation">
					Stacks &nbsp; Tools &nbsp; Leaderboard
				</nav>
				<CTA onClick={() => open(audience)}>Sync your stack</CTA>
				<span className="sp-avatar">{audience === "member" ? "JD" : "↗"}</span>
			</div>
			<div className="sp-selected-hero">
				<div className="sp-selected-message">
					<p className="sp-eyebrow">The AI setups behind the work</p>
					<h2>
						See what builders
						<br />
						<em>use to ship.</em>
					</h2>
					<p>
						Explore the tools, models and usage behind real AI stacks. Share
						yours straight from your machine.
					</p>
					<div className="sp-actions">
						<CTA onClick={() => open(audience)}>Sync your stack</CTA>
						<a className="sp-browse" href={`#${examplesId}`}>
							Browse stacks <ArrowRight size={14} />
						</a>
					</div>
					<p className="sp-selected-reassurance">
						Review what you share before publishing.
					</p>
				</div>
				<div className="sp-selected-example">
					<p className="sp-eyebrow">Inside a builder's stack</p>
					<div className="sp-example-identity">
						<span className="sp-avatar">MO</span>
						<div>
							<h3>Morgan's coding stack</h3>
							<p>Web apps, from idea to deployment.</p>
						</div>
					</div>
					<div className="sp-tool-list">
						<span>Claude Code</span>
						<span>Codex</span>
						<span>Cursor</span>
					</div>
					<Stats />
					<p className="sp-small">Measured usage · last 30 days</p>
				</div>
			</div>
			<div className="sp-quick-sync">
				<div>
					<b>
						{audience === "guest"
							? "Already have a stack?"
							: "Update your stack."}
					</b>
					<p>Run this in your terminal.</p>
				</div>
				<Command report={report} />
				<button
					type="button"
					className="sp-link"
					onClick={() => open(audience)}
				>
					How it works <ArrowRight size={14} />
				</button>
			</div>
			<div className="sp-home-examples" id={examplesId}>
				<div className="sp-section-heading">
					<h3>Explore builders' stacks</h3>
					<span className="sp-small">Community setups</span>
				</div>
				<div className="sp-example-grid">
					{[
						{
							name: "Morgan's coding stack",
							person: "@morgan",
							tools: "Claude Code · Codex · Cursor",
							usage: "24.8M tokens · 84 sessions",
						},
						{
							name: "Jamie's web toolkit",
							person: "@jamie",
							tools: "Codex · Figma · Vercel",
							usage: "12.1M tokens · 46 sessions",
						},
						{
							name: "Sam's everyday agents",
							person: "@sam",
							tools: "opencode · Claude Code",
							usage: "8.6M tokens · 32 sessions",
						},
					].map((stack) => (
						<article key={stack.name}>
							<p className="sp-eyebrow">{stack.person}</p>
							<h3>{stack.name}</h3>
							<p>{stack.tools}</p>
							<p className="sp-small">{stack.usage}</p>
							<button
								type="button"
								className="sp-link"
								onClick={() => {
									document
										.getElementById("sync-location-5")
										?.scrollIntoView({ behavior: "smooth" });
									report(
										`Previewing public Stats for ${stack.person}. Fixture data.`,
									);
								}}
							>
								View stack <ArrowRight size={14} />
							</button>
						</article>
					))}
				</div>
				<div className="sp-selected-activity">
					<span className="sp-eyebrow">Community activity</span>
					<p>@morgan synced their stack · @jamie added Codex</p>
				</div>
			</div>
		</div>
	);
}
