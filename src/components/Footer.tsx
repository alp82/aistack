import { Link } from "@tanstack/react-router";

const socialLinks = [
	{
		name: "Follow on X",
		href: "https://x.com/alperortac",
		bgColor: "bg-zinc-800/60",
		hoverBg: "hover:bg-zinc-700/80",
		icon: (
			<svg
				viewBox="0 0 24 24"
				className="size-4"
				fill="currentColor"
				aria-hidden="true"
			>
				<path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
			</svg>
		),
	},
	{
		name: "Join Discord",
		href: "https://discord.gg/5y4fpyahaF",
		bgColor: "bg-[#5865F2]/40",
		hoverBg: "hover:bg-[#5865F2]/60",
		icon: (
			<svg
				viewBox="0 0 24 24"
				className="size-4"
				fill="currentColor"
				aria-hidden="true"
			>
				<path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
			</svg>
		),
	},
	{
		name: "Join Reddit",
		href: "https://www.reddit.com/r/aistackcommunity/",
		bgColor: "bg-[#FF4500]/30",
		hoverBg: "hover:bg-[#FF4500]/50",
		icon: (
			<svg
				viewBox="0 0 24 24"
				className="size-4"
				fill="currentColor"
				aria-hidden="true"
			>
				<path d="M12 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0zm5.01 4.744c.688 0 1.25.561 1.25 1.249a1.25 1.25 0 0 1-2.498.056l-2.597-.547-.8 3.747c1.824.07 3.48.632 4.674 1.488.308-.309.73-.491 1.207-.491.968 0 1.754.786 1.754 1.754 0 .716-.435 1.333-1.01 1.614a3.111 3.111 0 0 1 .042.52c0 2.694-3.13 4.87-7.004 4.87-3.874 0-7.004-2.176-7.004-4.87 0-.183.015-.366.043-.534A1.748 1.748 0 0 1 4.028 12c0-.968.786-1.754 1.754-1.754.463 0 .898.196 1.207.49 1.207-.883 2.878-1.43 4.744-1.487l.885-4.182a.342.342 0 0 1 .14-.197.35.35 0 0 1 .238-.042l2.906.617a1.214 1.214 0 0 1 1.108-.701zM9.25 12C8.561 12 8 12.562 8 13.25c0 .687.561 1.248 1.25 1.248.687 0 1.248-.561 1.248-1.249 0-.688-.561-1.249-1.249-1.249zm5.5 0c-.687 0-1.248.561-1.248 1.25 0 .687.561 1.248 1.249 1.248.688 0 1.249-.561 1.249-1.249 0-.687-.562-1.249-1.25-1.249zm-5.466 3.99a.327.327 0 0 0-.231.094.33.33 0 0 0 0 .463c.842.842 2.484.913 2.961.913.477 0 2.105-.056 2.961-.913a.361.361 0 0 0 .029-.463.33.33 0 0 0-.464 0c-.547.533-1.684.73-2.512.73-.828 0-1.979-.196-2.512-.73a.326.326 0 0 0-.232-.095z" />
			</svg>
		),
	},
	{
		name: "View on GitHub",
		href: "https://github.com/alp82/aistack",
		bgColor: "bg-zinc-800/50",
		hoverBg: "hover:bg-zinc-700/70",
		icon: (
			<svg
				viewBox="0 0 24 24"
				className="size-4"
				fill="currentColor"
				aria-hidden="true"
			>
				<path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
			</svg>
		),
	},
];

function Footer() {
	return (
		<footer className="relative flex-1 overflow-hidden border-t-2 border-stroke-strong bg-bg-canvas text-fg-muted py-16 px-6 shadow-[0_-20px_50px_-30px_var(--shadow-color)] md:px-16 lg:px-24">
			<div className="relative max-w-2xl mx-auto flex flex-col gap-12 md:flex-row md:justify-between md:items-start">
				{/* Left side: Logo, Nav, Credit */}
				<div className="flex flex-col gap-8">
					{/* Logo */}
					<Link to="/" className="flex items-center gap-2 group">
						<div
							className="w-3 h-3 bg-accent-lime animate-pulse"
							style={{ boxShadow: "0 0 8px rgba(163, 230, 53, 0.6)" }}
						/>
						<span className="font-bold text-fg-primary tracking-tighter text-xl group-hover:text-accent-lime transition-colors">
							AI STACK
						</span>
					</Link>

					{/* Navigation */}
					<nav className="flex flex-col gap-3">
						<Link
							to="/stacks"
							className="font-mono text-sm font-semibold uppercase tracking-[0.1em] text-fg-muted hover:text-accent-lime transition-colors"
						>
							Stacks
						</Link>
						<Link
							to="/tools"
							className="font-mono text-sm font-semibold uppercase tracking-[0.1em] text-fg-muted hover:text-accent-lime transition-colors"
						>
							Tools
						</Link>
						<Link
							to="/news"
							className="font-mono text-sm font-semibold uppercase tracking-[0.1em] text-fg-muted hover:text-accent-lime transition-colors"
						>
							News
						</Link>
					</nav>

					{/* Credit */}
					<p className="font-mono text-xs text-zinc-600">
						Built by{" "}
						<a
							href="https://x.com/alperortac"
							target="_blank"
							rel="noopener noreferrer"
							className="text-accent-lime hover:text-accent-lime-strong transition-colors"
						>
							@alperortac
						</a>
					</p>
				</div>

				{/* Right side: Social boxes */}
				<div className="flex flex-col gap-1.5">
					{socialLinks.map((link) => (
						<a
							key={link.href}
							href={link.href}
							target="_blank"
							rel="noopener noreferrer"
							className={`flex items-center gap-2.5 px-3 py-2 ${link.bgColor} ${link.hoverBg} text-fg-muted hover:text-fg-primary transition-colors`}
							aria-label={link.name}
						>
							{link.icon}
							<span className="font-mono text-xs font-medium uppercase tracking-wide">
								{link.name}
							</span>
						</a>
					))}
				</div>
			</div>
		</footer>
	);
}

export { Footer };
