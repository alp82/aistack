import { useState } from "react";
import { DISCORD_INSTALL_URL } from "@/lib/discord";
import compareImage from "./discord-guide-images/compare.png";
import contextImage from "./discord-guide-images/context.png";
import costImage from "./discord-guide-images/cost.png";
import harnessImage from "./discord-guide-images/harness.png";
import tokensImage from "./discord-guide-images/tokens.png";
import "./discord-guide.css";

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
					<h3>Connect your stack (optional)</h3>
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
					loading="lazy"
					decoding="async"
					src={command.image}
					alt={`Synthetic /${command.name} example: ${command.title}. ${command.description}`}
				/>
			</a>
			<figcaption>
				Synthetic example data · Open image to view at full size
			</figcaption>
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
function Walkthrough({
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
					Bring your stack
					<br />
					into Discord.
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
				<p className="dg-description" aria-live="polite">
					{commands[selected].description}
				</p>
			</div>
		</div>
	);
}
export function DiscordGuideSection() {
	const [selected, setSelected] = useState(0);
	return (
		<section className="dg-section" aria-label="AI Stack on Discord">
			<Walkthrough selected={selected} onSelect={setSelected} />
		</section>
	);
}
