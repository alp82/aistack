import { useConvexAuth } from "@convex-dev/react-query";
import { Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "convex/react";
import { Edit, LogOut, Plus, Shield, User } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { api } from "../../convex/_generated/api";
import { authClient } from "../lib/auth-client";
import { Button } from "./ui/button";

export default function Header() {
	const { isAuthenticated } = useConvexAuth();
	const navigate = useNavigate();
	const [menuOpen, setMenuOpen] = useState(false);
	const menuRef = useRef<HTMLDivElement>(null);
	const session = authClient.useSession();
	const userName = session.data?.user?.name || session.data?.user?.email || "";

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
	const isAdmin = useQuery(api.admin.checkIsAdmin) ?? false; // Default to false if undefined/loading to prevent layout shift

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
		<header className="sticky top-0 h-16 z-100 py-3 px-6 flex items-center justify-between bg-slate-950/60 backdrop-blur-xl text-white border-b border-slate-800/50">
			<div className="mx-auto max-w-7xl w-full flex items-center justify-between">
				<div className="flex items-center gap-8">
					<Link
						to="/"
						className="flex items-center gap-2 text-xl font-bold hover:opacity-90 transition-opacity"
					>
						<img
							src="/aistack-logo.png"
							alt="AI Stack Logo"
							className="h-8 w-8"
						/>
						<span className="text-gray-200">AI</span>
						<span className="bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
							Stack
						</span>
					</Link>

					<nav className="hidden md:flex items-center gap-6">
						<Link
							to="/stacks"
							className="text-gray-300 hover:text-white transition-colors text-sm font-medium"
						>
							Browse Stacks
						</Link>
						<Link
							to="/tools"
							className="text-gray-300 hover:text-white transition-colors text-sm font-medium"
						>
							AI Tools
						</Link>
						<Link
							to="/about"
							className="text-gray-300 hover:text-white transition-colors text-sm font-medium"
						>
							About
						</Link>
						{isAdmin && (
							<Link
								to="/admin/tools"
								className="text-cyan-400 hover:text-cyan-300 transition-colors text-sm font-medium flex items-center gap-1"
							>
								<Shield className="h-4 w-4" />
								Admin
							</Link>
						)}
					</nav>
				</div>

				{isAuthenticated ? (
					<div className="flex items-center gap-3">
						{userStack || cachedUserStack ? (
							<a
								href={`/stacks/${(userStack || cachedUserStack)?.slug}/edit`}
								className="inline-flex items-center gap-2 bg-cyan-600 hover:bg-cyan-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
							>
								<Edit className="h-4 w-4" />
								Edit Stack
							</a>
						) : userStack === null ? (
							<Link
								to="/stacks/new"
								className="inline-flex items-center gap-2 bg-cyan-600 hover:bg-cyan-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
							>
								<Plus className="h-4 w-4" />
								Share Stack
							</Link>
						) : null}

						<div className="relative" ref={menuRef}>
							<Button
								variant="ghost"
								size="icon"
								onClick={() => setMenuOpen(!menuOpen)}
								className="rounded-full bg-gradient-to-br from-cyan-500 to-blue-500 text-white font-bold hover:opacity-90 hover:bg-gradient-to-br from-cyan-500 to-blue-500"
							>
								{userName.charAt(0).toUpperCase()}
							</Button>

							{menuOpen && (
								<div className="absolute right-0 mt-2 w-56 rounded-lg border border-slate-700 bg-slate-800 shadow-xl py-1 z-50">
									<div className="px-4 py-3 border-b border-slate-700">
										<p className="text-sm font-medium text-white truncate">
											{userName}
										</p>
										{session.data?.user?.email && session.data?.user?.name && (
											<p className="text-xs text-gray-400 truncate">
												{session.data.user.email}
											</p>
										)}
									</div>
									<Button
										variant="ghost"
										onClick={handleSignOut}
										className="w-full justify-start text-gray-300 hover:bg-slate-700 hover:text-white"
									>
										<LogOut className="h-4 w-4" />
										Sign Out
									</Button>
								</div>
							)}
						</div>
					</div>
				) : (
					<Link
						to="/login"
						className="inline-flex items-center gap-2 bg-cyan-600 hover:bg-cyan-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
					>
						<User className="h-4 w-4" />
						Sign In
					</Link>
				)}
			</div>
		</header>
	);
}
