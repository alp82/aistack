import { createFileRoute, Link, useNavigate, useSearch } from "@tanstack/react-router";
import { useState } from "react";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { authClient } from "../lib/auth-client";

type SignInSearch = {
	redirect?: string;
};

export const Route = createFileRoute("/signin")({
	component: SignInPage,
	validateSearch: (search: Record<string, unknown>): SignInSearch => {
		return {
			redirect: typeof search.redirect === "string" ? search.redirect : undefined,
		};
	},
});

function SignInPage() {
	const navigate = useNavigate();
	const { redirect } = useSearch({ from: "/signin" });
	const [isSignUp, setIsSignUp] = useState(false);
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [name, setName] = useState("");
	const [error, setError] = useState("");
	const [info, setInfo] = useState("");
	const [loading, setLoading] = useState(false);

	const handleDevAdminLogin = async () => {
		setError("");
		setLoading(true);
		const devEmail = "dev-admin@example.com";
		const devPass = "password123";
		const devName = "Dev Admin";

		try {
			let result = await authClient.signIn.email({
				email: devEmail,
				password: devPass,
			})

			if (result.error) {
				const signUpResult = await authClient.signUp.email({
					email: devEmail,
					password: devPass,
					name: devName,
				})

				if (signUpResult.error) {
					throw new Error(
						`Login failed: ${result.error.message}. Signup failed: ${signUpResult.error.message}`,
					)
				}

				if (!signUpResult.data) {
					result = await authClient.signIn.email({
						email: devEmail,
						password: devPass,
					})
					if (result.error) throw new Error(result.error.message);
				}
			}

			await navigate({ to: redirect || "/admin/tools" });
		} catch (err) {
			setError(
				err instanceof Error
					? err.message
					: "Dev login failed. Ensure you are in development mode.",
			)
		} finally {
			setLoading(false);
		}
	}

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
				})
				if (result.error) {
					setError(result.error.message || "Sign up failed");
				} else {
					setInfo(
						"Account created! Please check your email to verify your address.",
					)
				}
			} else {
				const result = await authClient.signIn.email({
					email,
					password,
				})
				if (result.error) {
					setError(result.error.message || "Sign in failed");
				} else {
					navigate({ to: redirect || "/" });
				}
			}
		} catch (err) {
			setError(err instanceof Error ? err.message : "Authentication failed");
		} finally {
			setLoading(false);
		}
	}

	const handleGoogleSignIn = async () => {
		setError("");
		setLoading(true);
		try {
			await authClient.signIn.social({
				provider: "google",
				callbackURL: redirect || "/",
			})
		} catch (err) {
			setError(err instanceof Error ? err.message : "Google sign-in failed");
			setLoading(false);
		}
	}

	return (
		<div className="flex min-h-screen">
			{/* Left side - Bold typography */}
			<div className="hidden lg:flex lg:w-1/2 flex-col justify-center items-end bg-bg-canvas px-12 xl:px-24 2xl:px-32 py-16 border-r-4 border-accent-lime">
				<div className="space-y-6 text-right max-w-2xl">
					<h1 className="text-[clamp(3rem,8vw,6rem)] font-black leading-[0.85] tracking-tighter text-fg-primary uppercase">
						{isSignUp ? (
							<>
								JOIN<br />
								THE<br />
								<span className="text-accent-lime">STACK</span>
							</>
						) : (
							<>
								WELCOME<br />
								<span className="text-accent-lime">BACK</span>
							</>
						)}
					</h1>
					<p className="font-mono text-base text-fg-muted leading-relaxed">
						{isSignUp
							? "Share your AI workflow with the community. Show the world how you build."
							: "Continue building and sharing your AI stack with passionate builders."}
					</p>
				</div>
			</div>

			{/* Right side - Form */}
			<div className="flex-1 flex items-center justify-start px-6 py-12 sm:px-12 lg:px-16 xl:px-20 bg-bg-panel overflow-y-auto">
				<div className="w-full max-w-2xl space-y-8">
					<div>
						<h2 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tighter text-fg-primary uppercase leading-none">
							{isSignUp ? "CREATE ACCOUNT" : "SIGN IN"}
						</h2>
						<p className="mt-4 font-mono text-sm text-fg-muted">
							{isSignUp
								? "Join the community of AI builders"
								: "Access your AI stack"}
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

					{import.meta.env.DEV && (
						<button
							type="button"
							onClick={handleDevAdminLogin}
							disabled={loading}
							className="w-full border-2 border-destructive bg-destructive px-4 py-3 font-mono text-sm font-semibold uppercase tracking-wide text-white transition-all hover:bg-destructive/90 disabled:opacity-50"
						>
							Dev Admin Login
						</button>
					)}

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
							{loading ? "Loading..." : isSignUp ? "Create Account" : "Sign In"}
						</button>
					</form>

					<div className="text-center">
						<button
							type="button"
							onClick={() => {
								setIsSignUp(!isSignUp);
								setError("")
								setInfo("")
							}}
							className="font-mono text-sm text-fg-muted hover:text-accent-lime transition-colors"
						>
							{isSignUp
								? "Already have an account? Sign in"
								: "Don't have an account? Sign up"}
						</button>
					</div>
				</div>
			</div>
		</div>
	)
}
