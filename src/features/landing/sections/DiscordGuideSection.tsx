import { Link } from "@tanstack/react-router";

export function DiscordGuideSection() {
	return (
		<section
			aria-label="AI Stack on Discord"
			className="relative mx-auto my-12 max-w-7xl border-y border-stroke-strong bg-bg-panel px-6 py-10 sm:px-8"
		>
			<p className="font-mono text-xs uppercase tracking-widest text-accent-lime">
				AI Stack × Discord
			</p>
			<h2 className="mt-3 text-3xl font-semibold tracking-tight text-fg-primary">
				Bring your stack into Discord.
			</h2>
			<p className="mt-4 max-w-2xl text-sm leading-relaxed text-fg-secondary">
				Explore your token usage, costs and tools in Discord. See the commands,
				reply examples and setup steps in the bot guide.
			</p>
			<Link
				to="/discord"
				className="mt-6 inline-flex border-2 border-accent-lime bg-accent-lime px-4 py-3 font-mono text-xs font-bold uppercase tracking-wider text-accent-lime-contrast hover:bg-accent-lime-strong focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent-lime"
			>
				Explore the Discord bot
			</Link>
		</section>
	);
}
