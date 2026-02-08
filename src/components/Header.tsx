import { useConvexAuth } from "@convex-dev/react-query";
import { Link, useNavigate } from "@tanstack/react-router";
import { LogOut, Plus, User } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { authClient } from "../lib/auth-client";

export default function Header() {
	const { isAuthenticated } = useConvexAuth();
	const navigate = useNavigate();
	const [menuOpen, setMenuOpen] = useState(false);
	const menuRef = useRef<HTMLDivElement>(null);
	const session = authClient.useSession();
	const userName = session.data?.user?.name || session.data?.user?.email || "";

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
		<header className="sticky top-0 z-50 py-3 px-6 flex items-center justify-between bg-slate-950/60 backdrop-blur-xl text-white border-b border-slate-800/50">
			<div className="mx-auto max-w-7xl w-full flex items-center justify-between">
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

				{isAuthenticated ? (
					<div className="flex items-center gap-3">
						<Link
							to="/stacks/new"
							className="inline-flex items-center gap-2 bg-cyan-600 hover:bg-cyan-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
						>
							<Plus className="h-4 w-4" />
							Share Stack
						</Link>

						<div className="relative" ref={menuRef}>
							<button
								type="button"
								onClick={() => setMenuOpen(!menuOpen)}
								className="flex items-center justify-center h-9 w-9 rounded-full bg-gradient-to-br from-cyan-500 to-blue-500 text-white text-sm font-bold hover:opacity-90 transition-opacity"
							>
								{userName.charAt(0).toUpperCase()}
							</button>

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
									<button
										type="button"
										onClick={handleSignOut}
										className="flex w-full items-center gap-2 px-4 py-2.5 text-sm text-gray-300 hover:bg-slate-700 hover:text-white transition-colors"
									>
										<LogOut className="h-4 w-4" />
										Sign Out
									</button>
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
