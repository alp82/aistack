import { useConvexAuth } from "@convex-dev/react-query";
import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { useQuery } from "convex/react";
import { Edit, LogOut, Moon, Plus, Shield, Sun } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { api } from "../../convex/_generated/api";
import { authClient } from "../lib/auth-client";
import { useTheme } from "../lib/theme";
import { Button } from "./ui/button";
import { cn } from "@/lib/utils";

const XIcon = () => (
	<svg viewBox="0 0 24 24" className="size-4" fill="currentColor" aria-hidden="true">
		<path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
	</svg>
);

const DiscordIcon = () => (
	<svg viewBox="0 0 24 24" className="size-4" fill="currentColor" aria-hidden="true">
		<path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
	</svg>
);

function ThemeToggle() {
	const { theme, toggleTheme } = useTheme();
	return (
		<button
			type="button"
			onClick={toggleTheme}
			className="flex size-8 items-center justify-center text-fg-muted transition-colors hover:text-fg-primary"
			aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
		>
			{theme === "dark" ? <Sun className="size-4" /> : <Moon className="size-4" />}
		</button>
	);
}

export default function Header() {
	const { isAuthenticated } = useConvexAuth();
	const navigate = useNavigate();
	const routerState = useRouterState();
	const currentPath = routerState.location.pathname;
	const [menuOpen, setMenuOpen] = useState(false);
	const menuRef = useRef<HTMLDivElement>(null);
	const session = authClient.useSession();
	const userName = session.data?.user?.name || session.data?.user?.email || "";

	const isActive = (path: string) => {
		if (path === "/stacks") return currentPath.startsWith("/stacks") && !currentPath.includes("/new");
		if (path === "/admin") return currentPath.startsWith("/admin");
		return currentPath === path;
	};

	const [cachedUserStack, setCachedUserStack] = useState<{
		slug: string;
	} | null>(() => {
		if (typeof window !== "undefined" && isAuthenticated) {
			const cached = localStorage.getItem("userStack");
			return cached ? JSON.parse(cached) : null;
		}
		return null;
	});

	const userStack = useQuery(api.stacks.getUserStack);
	const isAdmin = useQuery(api.admin.checkIsAdmin) ?? false;

	useEffect(() => {
		if (userStack !== undefined) {
			if (userStack) {
				localStorage.setItem("userStack", JSON.stringify(userStack));
				setCachedUserStack(userStack);
			} else {
				localStorage.removeItem("userStack");
				setCachedUserStack(null);
			}
		}
	}, [userStack]);

	useEffect(() => {
		if (!isAuthenticated) {
			localStorage.removeItem("userStack");
			setCachedUserStack(null);
		}
	}, [isAuthenticated]);

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
		navigate({ to: "/" });
	};

	return (
		<header className="sticky top-0 z-50 h-14 border-b-2 border-stroke-strong bg-bg-canvas px-6">
			<div className="mx-auto flex h-full max-w-content items-center justify-between">
				<div className="flex items-center gap-12">
					<Link
						to="/"
						className="flex items-center gap-2 font-bold tracking-tighter text-xl text-fg-primary transition-colors hover:text-accent-lime"
					>
						<div className="w-3 h-3 bg-accent-lime animate-pulse" style={{ boxShadow: '0 0 8px rgba(163, 230, 53, 0.6)' }} />
						<span className="hidden lg:inline">AI STACK</span>
					</Link>

					<nav className="hidden items-center gap-8 md:flex">
						<Link
							to="/stacks"
							className={cn(
								"font-mono text-xs font-semibold uppercase tracking-[0.15em] transition-colors",
								isActive("/stacks") ? "text-accent-lime" : "text-fg-muted hover:text-fg-primary"
							)}
						>
							Stacks
						</Link>
						<Link
							to="/tools"
							className={cn(
								"font-mono text-xs font-semibold uppercase tracking-[0.15em] transition-colors",
								isActive("/tools") ? "text-accent-lime" : "text-fg-muted hover:text-fg-primary"
							)}
						>
							Tools
						</Link>
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

				<div className="flex items-center gap-3">
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
						<ThemeToggle />
					</div>

					{/* Admin link - outline button style */}
					{isAdmin && (
						<Link
							to="/admin"
							className="hidden items-center gap-1.5 border-2 border-stroke-strong bg-bg-panel px-3 py-1.5 font-mono text-xs font-semibold uppercase tracking-[0.12em] text-fg-primary transition-colors hover:border-accent-lime hover:text-accent-lime md:inline-flex"
						>
							<Shield className="size-3.5" />
							Admin
						</Link>
					)}

					{/* Share Stack CTA */}
					{isAuthenticated ? (
						<>
							{userStack || cachedUserStack ? (
								<a
									href={`/stacks/${(userStack || cachedUserStack)?.slug}/edit`}
									className="inline-flex items-center gap-2 border-2 border-stroke-strong bg-bg-panel px-3 py-1.5 font-mono text-xs font-semibold uppercase tracking-[0.12em] text-fg-primary transition-colors hover:border-accent-lime hover:text-accent-lime"
								>
									<Edit className="size-3.5" />
									Edit Stack
								</a>
							) : userStack === null ? (
								<Link
									to="/stacks/new"
									className="inline-flex items-center gap-2 border-2 border-accent-lime bg-accent-lime px-3 py-1.5 font-mono text-xs font-semibold uppercase tracking-[0.12em] text-accent-lime-contrast transition-colors hover:bg-accent-lime-strong"
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
									{session.data?.user?.image ? (
										<img
											src={session.data.user.image}
											alt={userName}
											className="size-full object-cover"
											onError={(e) => {
												e.currentTarget.style.display = "none";
												e.currentTarget.nextElementSibling?.classList.remove("hidden");
											}}
										/>
									) : null}
									<span className={session.data?.user?.image ? "hidden" : ""}>
										{userName.charAt(0).toUpperCase()}
									</span>
								</button>

								{menuOpen && (
									<div className="absolute right-0 z-50 mt-1 w-56 border-2 border-stroke-strong bg-bg-panel shadow-[4px_4px_0_var(--stroke-strong)]">
										<div className="border-b border-stroke-subtle px-4 py-3">
											<p className="truncate font-mono text-xs font-semibold uppercase tracking-wide text-fg-primary">
												{userName}
											</p>
											{session.data?.user?.email && session.data?.user?.name && (
												<p className="mt-0.5 truncate font-mono text-xs text-fg-muted">
													{session.data.user.email}
												</p>
											)}
										</div>
										<Button
											variant="ghost"
											onClick={handleSignOut}
											className="w-full justify-start rounded-none font-mono text-xs uppercase tracking-wide text-fg-secondary hover:bg-bg-panel-muted hover:text-fg-primary"
										>
											<LogOut className="size-3.5" />
											Sign Out
										</Button>
									</div>
								)}
							</div>
						</>
					) : (
						<>
							<Link
								to="/stacks/new"
								className="inline-flex items-center gap-2 border-2 border-accent-lime bg-accent-lime px-3 py-1.5 font-mono text-xs font-semibold uppercase tracking-[0.12em] text-accent-lime-contrast transition-colors hover:bg-accent-lime-strong"
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
				</div>
			</div>
		</header>
	);
}
