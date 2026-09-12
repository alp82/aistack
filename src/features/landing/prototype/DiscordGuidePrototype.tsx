/** Throwaway: three homepage onboarding layouts, selected by ?variant=discord-A|B|C. */
import { useEffect, useState } from "react";
import { DISCORD_INSTALL_URL } from "@/lib/discord";
import compareImage from "./discord-guide-images/compare.png";
import contextImage from "./discord-guide-images/context.png";
import costImage from "./discord-guide-images/cost.png";
import harnessImage from "./discord-guide-images/harness.png";
import tokensImage from "./discord-guide-images/tokens.png";
import "./discord-guide-prototype.css";

const commands = [
	{
		name: "tokens",
		title: "See your model mix",
		description:
			"See token totals and the models behind them. Change the range or open the full model list.",
		image: tokensImage,
	},
	{
		name: "cost",
		title: "Understand your costs",
		description:
			"See current monthly subscriptions alongside measured usage cost for the selected dates.",
		image: costImage,
	},
	{
		name: "context",
		title: "Explore your context usage",
		description:
			"See how much context your calls use. Choose a harness to explore its reading.",
		image: contextImage,
	},
	{
		name: "harness",
		title: "See where you work",
		description:
			"See token usage across harnesses, then compare the same harness with another creator.",
		image: harnessImage,
	},
	{
		name: "compare",
		title: "Compare with another builder",
		description:
			"Choose another creator and compare token usage, measured costs, and model mix.",
		image: compareImage,
	},
] as const;
const names = {
	A: "Install-first walkthrough",
	B: "Command explorer",
	C: "Example-led invitation",
};
export type DiscordGuideVariant = keyof typeof names;

function InstallLink() {
	return (
		<a
			className="dg-install"
			href={DISCORD_INSTALL_URL}
			target="_blank"
			rel="noreferrer"
		>
			Add to Discord <span aria-hidden="true">↗</span>
		</a>
	);
}
function Steps() {
	return (
		<ol className="dg-steps">
			<li>
				<span>01</span>
				<div>
					<h3>Add AI Stack</h3>
					<p>
						Choose your account to use it personally, or a server you manage to
						use it there.
					</p>
				</div>
			</li>
			<li>
				<span>02</span>
				<div>
					<h3>Connect your stack</h3>
					<p>
						Run <code>/link</code> in Discord and sign in to AI Stack. You can
						also browse another creator without linking.
					</p>
				</div>
			</li>
			<li>
				<span>03</span>
				<div>
					<h3>Ask, then explore</h3>
					<p>
						Start with <code>/tokens</code>. Change the date range, open a full
						list, or choose someone to compare with.
					</p>
				</div>
			</li>
		</ol>
	);
}
function Example({ command }: { command: (typeof commands)[number] }) {
	return (
		<figure className="dg-example">
			<div className="dg-chat-head">
				<span className="dg-avatar">AI</span>
				<strong>AI Stack</strong>
				<span className="dg-app-label">APP</span>
				<code>/{command.name}</code>
			</div>
			<a
				href={command.image}
				target="_blank"
				rel="noreferrer"
				aria-label={`Open full-size ${command.name} example`}
			>
				<img
					src={command.image}
					alt={`Example Discord ${command.name} reply card with synthetic usage data`}
				/>
			</a>
			<figcaption>Example data · Open image to view at full size</figcaption>
		</figure>
	);
}
function CommandTabs({
	selected,
	onSelect,
}: {
	selected: number;
	onSelect: (index: number) => void;
}) {
	return (
		<nav className="dg-commands" aria-label="Example commands">
			{commands.map((command, index) => (
				<button
					key={command.name}
					type="button"
					aria-pressed={selected === index}
					onClick={() => onSelect(index)}
				>
					/{command.name}
				</button>
			))}
		</nav>
	);
}
function VariantA({
	selected,
	onSelect,
}: {
	selected: number;
	onSelect: (index: number) => void;
}) {
	return (
		<div className="dg-walkthrough">
			<div>
				<p className="dg-kicker">AI STACK × DISCORD</p>
				<h2>
					Your stack.
					<br />
					In the conversation.
				</h2>
				<p className="dg-intro">
					Bring your tool setup and measured usage into Discord. Start with one
					command and explore from there.
				</p>
				<InstallLink />
				<Steps />
			</div>
			<div className="dg-preview">
				<CommandTabs selected={selected} onSelect={onSelect} />
				<Example command={commands[selected]} />
				<p className="dg-description">{commands[selected].description}</p>
			</div>
		</div>
	);
}
function VariantB({
	selected,
	onSelect,
}: {
	selected: number;
	onSelect: (index: number) => void;
}) {
	return (
		<div className="dg-explorer">
			<div className="dg-explorer-heading">
				<div>
					<p className="dg-kicker">EXPLORE THE DISCORD BOT</p>
					<h2>What do you want to see?</h2>
				</div>
				<InstallLink />
			</div>
			<div className="dg-explorer-body">
				<nav aria-label="Choose a reply example">
					{commands.map((command, index) => (
						<button
							type="button"
							key={command.name}
							onClick={() => onSelect(index)}
							aria-pressed={selected === index}
						>
							<code>/{command.name}</code>
							<span>{command.title}</span>
							<span aria-hidden="true">↗</span>
						</button>
					))}
				</nav>
				<div>
					<Example command={commands[selected]} />
					<p className="dg-description">{commands[selected].description}</p>
				</div>
			</div>
			<Steps />
		</div>
	);
}
function VariantC({
	selected,
	onSelect,
}: {
	selected: number;
	onSelect: (index: number) => void;
}) {
	const [showSteps, setShowSteps] = useState(false);
	return (
		<div className="dg-invitation">
			<div className="dg-invitation-copy">
				<p className="dg-kicker">FROM YOUR STACK TO YOUR CHAT</p>
				<h2>
					Show what
					<br />
					you build with.
				</h2>
				<p className="dg-intro">
					Share a clear picture of your AI usage. Compare setups, explore costs,
					and keep the conversation going.
				</p>
				<div className="dg-invitation-actions">
					<InstallLink />
					<button
						className="dg-how"
						type="button"
						onClick={() => setShowSteps(!showSteps)}
						aria-expanded={showSteps}
					>
						How it works {showSteps ? "−" : "+"}
					</button>
				</div>
				{showSteps && <Steps />}
			</div>
			<div className="dg-invitation-example">
				<Example command={commands[selected]} />
				<CommandTabs selected={selected} onSelect={onSelect} />
				<p className="dg-description">{commands[selected].description}</p>
			</div>
		</div>
	);
}
export function DiscordGuidePrototype({
	variant,
	onVariant,
}: {
	variant: DiscordGuideVariant;
	onVariant: (variant: DiscordGuideVariant) => void;
}) {
	const [selected, setSelected] = useState(0);
	const cycle = (direction: number) => {
		const variants = ["A", "B", "C"] as const;
		onVariant(
			variants[
				(variants.indexOf(variant) + direction + variants.length) %
					variants.length
			],
		);
	};
	useEffect(() => {
		const onKey = (event: KeyboardEvent) => {
			if (
				event.target instanceof HTMLElement &&
				event.target.closest("input, textarea, select, [contenteditable=true]")
			)
				return;
			if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
				event.preventDefault();
				cycle(event.key === "ArrowRight" ? 1 : -1);
			}
		};
		window.addEventListener("keydown", onKey);
		return () => window.removeEventListener("keydown", onKey);
	});
	if (import.meta.env.PROD) return null;
	return (
		<>
			{/* biome-ignore lint/correctness/useUniqueElementIds: One homepage anchor, shared by the prototype URLs. */}
			<section
				id="discord-guide"
				className="dg-section"
				aria-label="AI Stack on Discord"
			>
				{variant === "A" && (
					<VariantA selected={selected} onSelect={setSelected} />
				)}
				{variant === "B" && (
					<VariantB selected={selected} onSelect={setSelected} />
				)}
				{variant === "C" && (
					<VariantC selected={selected} onSelect={setSelected} />
				)}
			</section>
			<nav className="dg-switcher" aria-label="Homepage prototype controls">
				<button
					type="button"
					onClick={() => cycle(-1)}
					aria-label="Previous layout"
				>
					←
				</button>
				<div>
					<strong>
						PROTOTYPE {variant} · {names[variant]}
					</strong>
					<span className="dg-switcher-state">
						Selected example: /{commands[selected].name} · example data
					</span>
				</div>
				<button type="button" onClick={() => cycle(1)} aria-label="Next layout">
					→
				</button>
			</nav>
		</>
	);
}
