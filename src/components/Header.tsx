import { useConvexAuth } from "@convex-dev/react-query";
import { useQueryClient } from "@tanstack/react-query";
import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { useQuery } from "convex/react";
import {
	ChartLine,
	Home,
	Laptop,
	Layers,
	LogOut,
	Menu,
	Moon,
	Pencil,
	Plus,
	Shield,
	Sun,
	Wrench,
	X,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { NEWS_IS_PUBLIC } from "@/lib/newsVisibility";
import { cn } from "@/lib/utils";
import { api } from "../../convex/_generated/api";
import { authClient } from "../lib/auth-client";
import { useTheme } from "../lib/theme";

const XIcon = () => (
	<svg
		viewBox="0 0 24 24"
		className="size-4"
		fill="currentColor"
		aria-hidden="true"
	>
		<path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
	</svg>
);

const DiscordIcon = () => (
	<svg
		viewBox="0 0 24 24"
		className="size-4"
		fill="currentColor"
		aria-hidden="true"
	>
		<path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
	</svg>
);

const GithubIcon = () => (
	<svg
		viewBox="0 0 24 24"
		className="size-4"
		fill="currentColor"
		aria-hidden="true"
	>
		<path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
	</svg>
);

function ThemeToggle() {
	const { theme, toggleTheme } = useTheme();
	const [mounted, setMounted] = useState(false);

	useEffect(() => {
		setMounted(true);
	}, []);

	return (
		<button
			type="button"
			onClick={toggleTheme}
			className="flex size-8 items-center justify-center text-fg-muted transition-colors hover:text-fg-primary"
			aria-label={
				mounted
					? theme === "dark"
						? "Switch to light mode"
						: "Switch to dark mode"
					: "Toggle theme"
			}
		>
			{mounted ? (
				theme === "dark" ? (
					<Sun className="size-4" />
				) : (
					<Moon className="size-4" />
				)
			) : (
				<Sun className="size-4" />
			)}
		</button>
	);
}

export default function Header() {
	const { isAuthenticated } = useConvexAuth();
	const navigate = useNavigate();
	const queryClient = useQueryClient();
	const routerState = useRouterState();
	const currentPath = routerState.location.pathname;
	const [menuOpen, setMenuOpen] = useState(false);
	const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
	const menuRef = useRef<HTMLDivElement>(null);
	const session = authClient.useSession();
	const userName = session.data?.user?.name || session.data?.user?.email || "";
	const [avatarError, setAvatarError] = useState(false);
	const avatarUrl = session.data?.user?.image;

	// Reset error state when avatar URL changes
	useEffect(() => {
		setAvatarError(false);
	}, [avatarUrl]);

	const isActive = (path: string) => {
		if (path === "/stacks")
			return currentPath.startsWith("/stacks") && !currentPath.includes("/new");
		if (path === "/admin") return currentPath.startsWith("/admin");
		return currentPath === path;
	};

	const me = useQuery(api.creators.getMe);
	const isAdmin = useQuery(api.admin.checkIsAdmin) ?? false;
	const pendingReviewCount = useQuery(api.admin.getPendingReviewCount);

	useEffect(() => {
		const handleClickOutside = (e: MouseEvent) => {
			if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
				setMenuOpen(false);
			}
		};
		document.addEventListener("mousedown", handleClickOutside);
		return () => document.removeEventListener("mousedown", handleClickOutside);
	}, []);

	const handleSignOut = async () => {
		setMenuOpen(false);
		await authClient.signOut();
		await queryClient.invalidateQueries({ queryKey: ["auth-token"] });
		navigate({ to: "/" });
	};

	const shareStackHref = me?.hasStack ? `/@${me.handle}` : "/stacks/new";

	return (
		<>
			<header className="sticky top-0 z-50 border-b-2 border-stroke-strong bg-bg-canvas px-6 shadow-[0_10px_30px_-20px_var(--shadow-color)] backdrop-blur-md">
				<div className="mx-auto flex h-16 max-w-content items-center justify-between">
					<div className="flex items-center gap-6 md:gap-12">
						<Link
							to="/"
							onClick={(e) => {
								if (window.innerWidth < 768) {
									e.preventDefault();
									setMobileMenuOpen(!mobileMenuOpen);
								}
							}}
							className="flex items-center gap-2 font-bold tracking-tighter text-xl text-fg-primary transition-colors hover:text-accent-lime"
						>
							<div
								className="w-3 h-3 bg-accent-lime animate-pulse"
								style={{ boxShadow: "0 0 8px rgba(163, 230, 53, 0.6)" }}
							/>
							<span>AI STACK</span>
						</Link>

						<nav className="hidden items-center gap-8 md:flex">
							<Link
								to="/stacks"
								className={cn(
									"font-mono text-xs font-semibold uppercase tracking-[0.15em] transition-colors",
									isActive("/stacks")
										? "text-accent-lime"
										: "text-fg-muted hover:text-fg-primary",
								)}
							>
								Stacks
							</Link>
							<Link
								to="/tools"
								className={cn(
									"font-mono text-xs font-semibold uppercase tracking-[0.15em] transition-colors",
									isActive("/tools")
										? "text-accent-lime"
										: "text-fg-muted hover:text-fg-primary",
								)}
							>
								Tools
							</Link>
							<Link
								to="/leaderboard"
								className={cn(
									"font-mono text-xs font-semibold uppercase tracking-[0.15em] transition-colors",
									isActive("/leaderboard")
										? "text-accent-lime"
										: "text-fg-muted hover:text-fg-primary",
								)}
							>
								Leaderboard
							</Link>
							<Link
								to="/activity"
								className={cn(
									"font-mono text-xs font-semibold uppercase tracking-[0.15em] transition-colors",
									isActive("/activity")
										? "text-accent-lime"
										: "text-fg-muted hover:text-fg-primary",
								)}
							>
								Activity
							</Link>
							{NEWS_IS_PUBLIC && (
								<Link
									to="/news"
									className={cn(
										"font-mono text-xs font-semibold uppercase tracking-[0.15em] transition-colors",
										isActive("/news")
											? "text-accent-lime"
											: "text-fg-muted hover:text-fg-primary",
									)}
								>
									News
								</Link>
							)}
							{/* <Link
							to="/about"
							className={cn(
								"font-mono text-xs font-semibold uppercase tracking-[0.15em] transition-colors",
								isActive("/about") ? "text-accent-lime" : "text-fg-muted hover:text-fg-primary"
							)}
						>
							About
						</Link> */}
						</nav>
					</div>

					<div className="flex items-center gap-2 sm:gap-3">
						{/* Social links */}
						<div className="hidden items-center gap-2 sm:flex">
							<a
								href="https://x.com/alperortac"
								target="_blank"
								rel="noopener noreferrer"
								className="flex size-8 items-center justify-center text-fg-muted transition-colors hover:text-fg-primary"
								aria-label="Follow on X"
							>
								<XIcon />
							</a>
							<a
								href="https://discord.gg/5y4fpyahaF"
								target="_blank"
								rel="noopener noreferrer"
								className="flex size-8 items-center justify-center text-fg-muted transition-colors hover:text-fg-primary"
								aria-label="Join Discord"
							>
								<DiscordIcon />
							</a>
							<a
								href="https://github.com/alp82/aistack"
								target="_blank"
								rel="noopener noreferrer"
								className="flex size-8 items-center justify-center text-fg-muted transition-colors hover:text-fg-primary"
								aria-label="View on GitHub"
							>
								<GithubIcon />
							</a>
							<ThemeToggle />
						</div>

						{/* Admin link - outline button style */}
						{isAdmin && (
							<Link
								to="/admin"
								className="relative hidden items-center gap-1.5 border-2 border-stroke-strong bg-bg-panel px-3 py-1.5 font-mono text-xs font-semibold uppercase tracking-[0.12em] text-fg-primary transition-colors hover:border-accent-lime hover:text-accent-lime md:inline-flex"
							>
								<Shield className="size-3.5" />
								Admin
								{typeof pendingReviewCount === "number" &&
									pendingReviewCount > 0 && (
										<span className="absolute -right-1.5 -top-1.5 flex size-4 items-center justify-center rounded-full bg-red-500 font-mono text-[10px] font-bold text-white">
											{pendingReviewCount > 9 ? "9+" : pendingReviewCount}
										</span>
									)}
							</Link>
						)}

						{/* Profile / Share Stack CTA */}
						{isAuthenticated ? (
							<>
								{me?.hasStack ? (
									<Link
										to="/$creator"
										params={{ creator: `@${me.handle}` }}
										className="hidden sm:inline-flex items-center gap-2 border-2 border-stroke-strong bg-bg-panel px-3 py-1.5 font-mono text-xs font-semibold uppercase tracking-[0.12em] text-fg-primary transition-colors hover:border-accent-lime hover:text-accent-lime"
									>
										<Pencil className="size-3.5" />
										Profile
									</Link>
								) : me === null || me?.hasStack === false ? (
									<Link
										to="/stacks/new"
										className="hidden sm:inline-flex items-center gap-2 border-2 border-accent-lime bg-accent-lime px-3 py-1.5 font-mono text-xs font-semibold uppercase tracking-[0.12em] text-accent-lime-contrast transition-colors hover:bg-accent-lime-strong"
									>
										<Plus className="size-3.5" />
										Share Stack
									</Link>
								) : null}

								<div className="relative" ref={menuRef}>
									<button
										type="button"
										onClick={() => setMenuOpen(!menuOpen)}
										className="flex size-8 items-center justify-center overflow-hidden border-2 border-stroke-strong bg-bg-panel font-mono text-xs font-bold text-fg-primary transition-colors hover:border-accent-lime hover:text-accent-lime"
									>
										{avatarUrl && !avatarError ? (
											<img
												src={avatarUrl}
												alt={userName}
												className="size-full object-cover"
												onError={() => setAvatarError(true)}
											/>
										) : (
											<span>{userName.charAt(0).toUpperCase()}</span>
										)}
									</button>

									{menuOpen && (
										<div className="absolute right-0 z-50 mt-1 w-56 border-2 border-stroke-strong bg-bg-panel shadow-[4px_4px_0_var(--stroke-strong)]">
											<div className="border-b border-stroke-subtle px-4 py-3">
												<p className="truncate font-mono text-xs font-semibold uppercase tracking-wide text-fg-primary">
													{userName}
												</p>
												{session.data?.user?.email &&
													session.data?.user?.name && (
														<p className="mt-0.5 truncate font-mono text-xs text-fg-muted">
															{session.data.user.email}
														</p>
													)}
											</div>
											{/* The only way into the private view numbers (#86). */}
											<Link
												to="/settings/analytics"
												onClick={() => setMenuOpen(false)}
												className="flex w-full items-center gap-2 px-4 py-2 font-mono text-xs uppercase tracking-wide text-fg-secondary transition-colors hover:bg-bg-panel-muted hover:text-fg-primary"
											>
												<ChartLine className="size-3.5" />
												Views
											</Link>
											{/* The only way into the revoke surface (#49). */}
											<Link
												to="/settings/machines"
												onClick={() => setMenuOpen(false)}
												className="flex w-full items-center gap-2 px-4 py-2 font-mono text-xs uppercase tracking-wide text-fg-secondary transition-colors hover:bg-bg-panel-muted hover:text-fg-primary"
											>
												<Laptop className="size-3.5" />
												Machines
											</Link>
											<button
												type="button"
												onClick={handleSignOut}
												className="flex w-full items-center gap-2 px-4 py-2 font-mono text-xs uppercase tracking-wide text-fg-secondary transition-colors hover:bg-bg-panel-muted hover:text-fg-primary"
											>
												<LogOut className="size-3.5" />
												Sign Out
											</button>
										</div>
									)}
								</div>
							</>
						) : (
							<>
								<Link
									to="/stacks/new"
									className="hidden sm:inline-flex items-center gap-2 border-2 border-accent-lime bg-accent-lime px-3 py-1.5 font-mono text-xs font-semibold uppercase tracking-[0.12em] text-accent-lime-contrast transition-colors hover:bg-accent-lime-strong"
								>
									<Plus className="size-3.5" />
									Share Stack
								</Link>
								<Link
									to="/signin"
									search={{ redirect: currentPath }}
									className="inline-flex items-center gap-2 border-2 border-stroke-strong bg-bg-panel px-3 py-1.5 font-mono text-xs font-semibold uppercase tracking-[0.12em] text-fg-primary transition-colors hover:border-accent-lime hover:text-accent-lime"
								>
									Sign In
								</Link>
							</>
						)}

						{/* Mobile hamburger */}
						<button
							type="button"
							onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
							className="flex size-8 items-center justify-center text-fg-primary md:hidden"
							aria-label="Toggle menu"
						>
							{mobileMenuOpen ? (
								<X className="size-5" />
							) : (
								<Menu className="size-5" />
							)}
						</button>
					</div>
				</div>

				{/* Mobile menu panel */}
				{mobileMenuOpen && (
					<div className="border-t-2 border-stroke-strong bg-bg-canvas px-6 py-6 md:hidden">
						<nav className="flex flex-col gap-4 mb-6">
							<Link
								to="/"
								onClick={() => setMobileMenuOpen(false)}
								className={cn(
									"font-mono text-sm font-semibold uppercase tracking-[0.15em] transition-colors",
									currentPath === "/"
										? "text-accent-lime"
										: "text-fg-muted hover:text-fg-primary",
								)}
							>
								Home
							</Link>
							<Link
								to="/stacks"
								onClick={() => setMobileMenuOpen(false)}
								className={cn(
									"font-mono text-sm font-semibold uppercase tracking-[0.15em] transition-colors",
									isActive("/stacks")
										? "text-accent-lime"
										: "text-fg-muted hover:text-fg-primary",
								)}
							>
								Stacks
							</Link>
							<Link
								to="/tools"
								onClick={() => setMobileMenuOpen(false)}
								className={cn(
									"font-mono text-sm font-semibold uppercase tracking-[0.15em] transition-colors",
									isActive("/tools")
										? "text-accent-lime"
										: "text-fg-muted hover:text-fg-primary",
								)}
							>
								Tools
							</Link>
							<Link
								to="/leaderboard"
								onClick={() => setMobileMenuOpen(false)}
								className={cn(
									"font-mono text-sm font-semibold uppercase tracking-[0.15em] transition-colors",
									isActive("/leaderboard")
										? "text-accent-lime"
										: "text-fg-muted hover:text-fg-primary",
								)}
							>
								Leaderboard
							</Link>
							<Link
								to="/activity"
								onClick={() => setMobileMenuOpen(false)}
								className={cn(
									"font-mono text-sm font-semibold uppercase tracking-[0.15em] transition-colors",
									isActive("/activity")
										? "text-accent-lime"
										: "text-fg-muted hover:text-fg-primary",
								)}
							>
								Activity
							</Link>
							{NEWS_IS_PUBLIC && (
								<Link
									to="/news"
									onClick={() => setMobileMenuOpen(false)}
									className={cn(
										"font-mono text-sm font-semibold uppercase tracking-[0.15em] transition-colors",
										isActive("/news")
											? "text-accent-lime"
											: "text-fg-muted hover:text-fg-primary",
									)}
								>
									News
								</Link>
							)}
							{isAdmin && (
								<Link
									to="/admin"
									onClick={() => setMobileMenuOpen(false)}
									className={cn(
										"relative font-mono text-sm font-semibold uppercase tracking-[0.15em] transition-colors inline-flex items-center gap-1.5",
										isActive("/admin")
											? "text-accent-lime"
											: "text-fg-muted hover:text-fg-primary",
									)}
								>
									<Shield className="size-3.5" />
									Admin
									{typeof pendingReviewCount === "number" &&
										pendingReviewCount > 0 && (
											<span className="flex size-4 items-center justify-center rounded-full bg-red-500 font-mono text-[10px] font-bold text-white">
												{pendingReviewCount > 9 ? "9+" : pendingReviewCount}
											</span>
										)}
								</Link>
							)}
						</nav>

						<div className="flex flex-col gap-3">
							{isAuthenticated ? (
								<>
									{me?.hasStack ? (
										<Link
											to="/$creator"
											params={{ creator: `@${me.handle}` }}
											onClick={() => setMobileMenuOpen(false)}
											className="inline-flex items-center gap-2 border-2 border-stroke-strong bg-bg-panel px-3 py-2 font-mono text-xs font-semibold uppercase tracking-[0.12em] text-fg-primary transition-colors hover:border-accent-lime hover:text-accent-lime"
										>
											<Pencil className="size-3.5" />
											Profile
										</Link>
									) : me === null || me?.hasStack === false ? (
										<Link
											to="/stacks/new"
											onClick={() => setMobileMenuOpen(false)}
											className="inline-flex items-center gap-2 border-2 border-accent-lime bg-accent-lime px-3 py-2 font-mono text-xs font-semibold uppercase tracking-[0.12em] text-accent-lime-contrast transition-colors hover:bg-accent-lime-strong"
										>
											<Plus className="size-3.5" />
											Share Stack
										</Link>
									) : null}
									<button
										type="button"
										onClick={() => {
											setMobileMenuOpen(false);
											handleSignOut();
										}}
										className="inline-flex items-center gap-2 border-2 border-stroke-strong bg-bg-panel px-3 py-2 font-mono text-xs font-semibold uppercase tracking-[0.12em] text-fg-secondary transition-colors hover:border-destructive hover:text-destructive"
									>
										<LogOut className="size-3.5" />
										Sign Out
									</button>
								</>
							) : (
								<>
									<Link
										to="/stacks/new"
										onClick={() => setMobileMenuOpen(false)}
										className="inline-flex items-center gap-2 border-2 border-accent-lime bg-accent-lime px-3 py-2 font-mono text-xs font-semibold uppercase tracking-[0.12em] text-accent-lime-contrast transition-colors hover:bg-accent-lime-strong"
									>
										<Plus className="size-3.5" />
										Share Stack
									</Link>
									<Link
										to="/signin"
										search={{ redirect: currentPath }}
										onClick={() => setMobileMenuOpen(false)}
										className="inline-flex items-center gap-2 border-2 border-stroke-strong bg-bg-panel px-3 py-2 font-mono text-xs font-semibold uppercase tracking-[0.12em] text-fg-primary transition-colors hover:border-accent-lime hover:text-accent-lime"
									>
										Sign In
									</Link>
								</>
							)}
						</div>

						<div className="mt-6 flex items-center gap-3">
							<a
								href="https://x.com/alperortac"
								target="_blank"
								rel="noopener noreferrer"
								className="flex size-8 items-center justify-center text-fg-muted transition-colors hover:text-fg-primary"
								aria-label="Follow on X"
							>
								<XIcon />
							</a>
							<a
								href="https://discord.gg/5y4fpyahaF"
								target="_blank"
								rel="noopener noreferrer"
								className="flex size-8 items-center justify-center text-fg-muted transition-colors hover:text-fg-primary"
								aria-label="Join Discord"
							>
								<DiscordIcon />
							</a>
							<a
								href="https://github.com/alp82/aistack"
								target="_blank"
								rel="noopener noreferrer"
								className="flex size-8 items-center justify-center text-fg-muted transition-colors hover:text-fg-primary"
								aria-label="View on GitHub"
							>
								<GithubIcon />
							</a>
							<ThemeToggle />
						</div>
					</div>
				)}
			</header>

			{/* Mobile bottom tab bar */}
			<nav className="fixed bottom-0 left-0 right-0 z-50 border-t-2 border-stroke-strong bg-bg-canvas md:hidden">
				<div className="flex items-stretch justify-around">
					<Link
						to="/"
						onClick={() => setMobileMenuOpen(false)}
						className={cn(
							"flex flex-1 flex-col items-center gap-1 py-2 font-mono text-[10px] font-semibold uppercase tracking-wider transition-colors",
							currentPath === "/" ? "text-accent-lime" : "text-fg-muted",
						)}
					>
						<Home className="size-5" />
						Home
					</Link>
					<Link
						to="/stacks"
						onClick={() => setMobileMenuOpen(false)}
						className={cn(
							"flex flex-1 flex-col items-center gap-1 py-2 font-mono text-[10px] font-semibold uppercase tracking-wider transition-colors",
							isActive("/stacks") ? "text-accent-lime" : "text-fg-muted",
						)}
					>
						<Layers className="size-5" />
						Stacks
					</Link>
					<Link
						to="/tools"
						onClick={() => setMobileMenuOpen(false)}
						className={cn(
							"flex flex-1 flex-col items-center gap-1 py-2 font-mono text-[10px] font-semibold uppercase tracking-wider transition-colors",
							isActive("/tools") ? "text-accent-lime" : "text-fg-muted",
						)}
					>
						<Wrench className="size-5" />
						Tools
					</Link>
					<a
						href={shareStackHref}
						onClick={() => setMobileMenuOpen(false)}
						className={cn(
							"flex flex-1 flex-col items-center gap-1 py-2 font-mono text-[10px] font-semibold uppercase tracking-wider transition-colors",
							currentPath === "/stacks/new"
								? "text-accent-lime"
								: "text-fg-muted",
						)}
					>
						<Plus className="size-5" />
						Share
					</a>
				</div>
			</nav>
		</>
	);
}
