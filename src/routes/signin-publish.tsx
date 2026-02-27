import { createFileRoute, Link, useNavigate, useSearch } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { authClient } from "../lib/auth-client";

type SignInPublishSearch = {
	redirect?: string;
};

export const Route = createFileRoute("/signin-publish")({
	component: SignInPublishPage,
	validateSearch: (search: Record<string, unknown>): SignInPublishSearch => {
		return {
			redirect: typeof search.redirect === "string" ? search.redirect : undefined,
		};
	},
});

interface GuestStackDraft {
	oneLiner: string;
	description: string;
	toolSubscriptions: Array<{
		toolName: string;
		toolCategories: string[];
		toolIconUrl?: string;
	}>;
}

function SignInPublishPage() {
	const navigate = useNavigate();
	const { redirect } = useSearch({ from: "/signin-publish" });
	const [isSignUp, setIsSignUp] = useState(true);
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [name, setName] = useState("");
	const [error, setError] = useState("");
	const [info, setInfo] = useState("");
	const [loading, setLoading] = useState(false);
	const [guestDraft, setGuestDraft] = useState<GuestStackDraft | null>(null);

	useEffect(() => {
		const saved = localStorage.getItem("guestStack");
		if (saved) {
			try {
				setGuestDraft(JSON.parse(saved));
			} catch {
				console.error("Failed to parse guest stack");
			}
		}
	}, []);

	const handleEmailAuth = async (e: React.FormEvent) => {
		e.preventDefault();
		setError("");
		setInfo("");
		setLoading(true);

		try {
			if (isSignUp) {
				const result = await authClient.signUp.email({
					email,
					password,
					name,
				});
				if (result.error) {
					setError(result.error.message || "Sign up failed");
				} else {
					setInfo("Account created! Please check your email to verify your address.");
				}
			} else {
				const result = await authClient.signIn.email({
					email,
					password,
				});
				if (result.error) {
					setError(result.error.message || "Sign in failed");
				} else {
					navigate({ to: redirect || "/stacks/new" });
				}
			}
		} catch (err) {
			setError(err instanceof Error ? err.message : "Authentication failed");
		} finally {
			setLoading(false);
		}
	};

	const handleGoogleSignIn = async () => {
		setError("");
		setLoading(true);
		try {
			await authClient.signIn.social({
				provider: "google",
				callbackURL: redirect || "/stacks/new",
			});
		} catch (err) {
			setError(err instanceof Error ? err.message : "Google sign-in failed");
			setLoading(false);
		}
	};

	return (
		<div className="flex min-h-screen">
			{/* Left side - Stack Preview */}
			<div className="hidden lg:flex lg:w-1/2 flex-col bg-bg-canvas px-12 xl:px-20 py-12 border-r-4 border-accent-lime overflow-y-auto">
				<div>
					<Link to="/" className="inline-flex items-center gap-2 mb-12">
						<div className="w-4 h-4 bg-accent-lime animate-pulse" style={{ boxShadow: '0 0 8px rgba(163, 230, 53, 0.6)' }} />
						<span className="font-bold text-fg-primary tracking-tighter text-2xl">AI STACK</span>
					</Link>
				</div>

				<div className="space-y-6 flex-1">
					<div>
						<p className="font-mono text-xs uppercase tracking-widest text-accent-lime mb-2">
							// Your Stack Preview
						</p>
						<h2 className="text-3xl font-black tracking-tight text-fg-primary uppercase">
							Almost There!
						</h2>
						<p className="mt-2 font-mono text-sm text-fg-muted">
							Sign up to publish your stack and share it with the community.
						</p>
					</div>

					{guestDraft && (
						<div className="border-2 border-stroke-strong bg-bg-panel p-6 space-y-4">
							<div>
								<p className="font-mono text-[10px] uppercase tracking-widest text-fg-muted mb-1">
									One-liner
								</p>
								<p className="text-lg font-semibold text-fg-primary">
									{guestDraft.oneLiner || "Your AI Stack"}
								</p>
							</div>

							{guestDraft.description && (
								<div>
									<p className="font-mono text-[10px] uppercase tracking-widest text-fg-muted mb-1">
										Description
									</p>
									<p className="text-sm text-fg-secondary line-clamp-3">
										{guestDraft.description}
									</p>
								</div>
							)}

							{guestDraft.toolSubscriptions?.length > 0 && (
								<div>
									<p className="font-mono text-[10px] uppercase tracking-widest text-fg-muted mb-2">
										Tools ({guestDraft.toolSubscriptions.length})
									</p>
									<div className="flex flex-wrap gap-2">
										{guestDraft.toolSubscriptions.slice(0, 8).map((tool, i) => (
											<div
												key={`${tool.toolName}-${i}`}
												className="flex items-center gap-2 border border-stroke-subtle bg-bg-panel-muted px-2 py-1"
											>
												{tool.toolIconUrl ? (
													<img
														src={tool.toolIconUrl}
														alt={tool.toolName}
														className="size-4 rounded object-contain"
													/>
												) : (
													<div className="size-4 bg-accent-lime/20" />
												)}
												<span className="font-mono text-xs text-fg-secondary">
													{tool.toolName}
												</span>
											</div>
										))}
										{guestDraft.toolSubscriptions.length > 8 && (
											<span className="font-mono text-xs text-fg-muted px-2 py-1">
												+{guestDraft.toolSubscriptions.length - 8} more
											</span>
										)}
									</div>
								</div>
							)}
						</div>
					)}

					<div className="border-2 border-dashed border-stroke-subtle p-4 bg-bg-panel-muted/50">
						<p className="font-mono text-xs text-fg-muted">
							<span className="text-accent-lime font-semibold">✓</span> Your progress is saved locally
						</p>
						<p className="font-mono text-xs text-fg-muted mt-1">
							<span className="text-accent-lime font-semibold">✓</span> Only registered users can publish stacks
						</p>
						<p className="font-mono text-xs text-fg-muted mt-1">
							<span className="text-accent-lime font-semibold">✓</span> Your stack will be live after sign up
						</p>
					</div>
				</div>

				<div className="font-mono text-xs text-fg-muted uppercase tracking-widest mt-8">
					Real AI workflows from passionate builders
				</div>
			</div>

			{/* Right side - Form */}
			<div className="flex-1 flex items-center justify-start px-6 py-12 sm:px-12 lg:px-16 xl:px-20 bg-bg-panel overflow-y-auto">
				<div className="w-full max-w-2xl space-y-6">
					{/* Mobile preview */}
					<div className="lg:hidden mb-8">
						<Link to="/" className="inline-flex items-center gap-2 mb-4">
							<div className="w-3 h-3 bg-accent-lime animate-pulse" style={{ boxShadow: '0 0 8px rgba(163, 230, 53, 0.6)' }} />
							<span className="font-bold text-fg-primary tracking-tighter text-xl">AI STACK</span>
						</Link>
						{guestDraft && (
							<div className="border border-stroke-subtle bg-bg-panel-muted p-3 mb-4">
								<p className="font-mono text-xs text-fg-muted">Publishing:</p>
								<p className="font-semibold text-fg-primary truncate">
									{guestDraft.oneLiner || "Your AI Stack"}
								</p>
							</div>
						)}
					</div>

					<div>
						<h2 className="text-3xl font-black tracking-tight text-fg-primary uppercase">
							{isSignUp ? "Create Account" : "Sign In"}
						</h2>
						<p className="mt-2 font-mono text-sm text-fg-muted">
							{isSignUp
								? "Join to publish your stack"
								: "Sign in to publish your stack"}
						</p>
					</div>

					{error && (
						<div className="border-2 border-destructive bg-destructive/10 p-4 font-mono text-sm text-destructive">
							{error}
						</div>
					)}

					{info && (
						<div className="border-2 border-green-500 bg-green-500/10 p-4 font-mono text-sm text-green-400">
							{info}
						</div>
					)}

					<button
						type="button"
						onClick={handleGoogleSignIn}
						disabled={loading}
						className="w-full flex items-center justify-center gap-3 border-2 border-stroke-strong bg-bg-canvas px-4 py-4 font-mono text-sm font-semibold uppercase tracking-wide text-fg-primary transition-all hover:border-accent-lime hover:text-accent-lime disabled:opacity-50"
					>
						<svg className="h-5 w-5" viewBox="0 0 24 24">
							<path
								fill="currentColor"
								d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
							/>
							<path
								fill="currentColor"
								d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
							/>
							<path
								fill="currentColor"
								d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
							/>
							<path
								fill="currentColor"
								d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
							/>
						</svg>
						Continue with Google
					</button>

					<div className="relative">
						<div className="absolute inset-0 flex items-center">
							<span className="w-full border-t-2 border-stroke-subtle" />
						</div>
						<div className="relative flex justify-center">
							<span className="bg-bg-panel px-4 font-mono text-xs uppercase tracking-widest text-fg-muted">
								Or
							</span>
						</div>
					</div>

					<form onSubmit={handleEmailAuth} className="space-y-5">
						{isSignUp && (
							<div className="space-y-2">
								<Label htmlFor="name" className="font-mono text-xs uppercase tracking-widest text-fg-muted">
									Name
								</Label>
								<Input
									id="name"
									type="text"
									value={name}
									onChange={(e) => setName(e.target.value)}
									placeholder="Your name"
									required={isSignUp}
									className="border-2 border-stroke-strong bg-bg-canvas px-4 py-3 font-mono text-fg-primary placeholder:text-fg-muted focus:border-accent-lime focus:ring-0"
								/>
							</div>
						)}

						<div className="space-y-2">
							<Label htmlFor="email" className="font-mono text-xs uppercase tracking-widest text-fg-muted">
								Email
							</Label>
							<Input
								id="email"
								type="email"
								value={email}
								onChange={(e) => setEmail(e.target.value)}
								placeholder="you@example.com"
								required
								className="border-2 border-stroke-strong bg-bg-canvas px-4 py-3 font-mono text-fg-primary placeholder:text-fg-muted focus:border-accent-lime focus:ring-0"
							/>
						</div>

						<div className="space-y-2">
							<div className="flex items-center justify-between">
								<Label htmlFor="password" className="font-mono text-xs uppercase tracking-widest text-fg-muted">
									Password
								</Label>
								{!isSignUp && (
									<Link
										to="/forgot-password"
										className="font-mono text-xs text-accent-lime hover:underline"
									>
										Forgot?
									</Link>
								)}
							</div>
							<Input
								id="password"
								type="password"
								value={password}
								onChange={(e) => setPassword(e.target.value)}
								placeholder="••••••••"
								required
								minLength={8}
								className="border-2 border-stroke-strong bg-bg-canvas px-4 py-3 font-mono text-fg-primary placeholder:text-fg-muted focus:border-accent-lime focus:ring-0"
							/>
						</div>

						<button
							type="submit"
							disabled={loading}
							className="w-full border-2 border-accent-lime bg-accent-lime px-4 py-4 font-mono text-sm font-bold uppercase tracking-widest text-accent-lime-contrast transition-all hover:bg-accent-lime-strong disabled:opacity-50"
						>
							{loading ? "Loading..." : isSignUp ? "Create Account & Publish" : "Sign In & Publish"}
						</button>
					</form>

					<div className="text-center">
						<button
							type="button"
							onClick={() => {
								setIsSignUp(!isSignUp);
								setError("");
								setInfo("");
							}}
							className="font-mono text-sm text-fg-muted hover:text-accent-lime transition-colors"
						>
							{isSignUp
								? "Already have an account? Sign in"
								: "Don't have an account? Sign up"}
						</button>
					</div>

					<div className="text-center">
						<Link
							to="/stacks/new"
							className="font-mono text-xs text-fg-muted hover:text-accent-lime transition-colors"
						>
							← Back to editor
						</Link>
					</div>
				</div>
			</div>
		</div>
	);
}
