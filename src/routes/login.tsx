import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { authClient } from "../lib/auth-client";

export const Route = createFileRoute("/login")({
	component: LoginPage,
});

function LoginPage() {
	const navigate = useNavigate();
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
		// Use a distinct email to avoid conflicts with previous unverified accounts
		const devEmail = "dev-admin@example.com";
		const devPass = "password123";
		const devName = "Dev Admin";

		try {
			// 1. Try to sign in first
			let result = await authClient.signIn.email({
				email: devEmail,
				password: devPass,
			});

			// 2. If sign-in fails, check if we need to sign up
			if (result.error) {
				// Only sign up if the error suggests user not found or we want to retry creation
				// Better-auth returns generic errors, so we try signUp as fallback
				const signUpResult = await authClient.signUp.email({
					email: devEmail,
					password: devPass,
					name: devName,
				});

				if (signUpResult.error) {
					throw new Error(
						`Login failed: ${result.error.message}. Signup failed: ${signUpResult.error.message}`,
					);
				}

				// SignUp succeeded, usually auto-logs in.
				// If not, we could try signIn again, but let's assume auto-login works or navigate handles it.
				if (!signUpResult.data) {
					// Try manual sign in again just in case
					result = await authClient.signIn.email({
						email: devEmail,
						password: devPass,
					});
					if (result.error) throw new Error(result.error.message);
				}
			}

			// Force a hard navigation to ensure auth state is picked up if client state is lagging
			// Or just use navigate.
			await navigate({ to: "/admin/tools" });
		} catch (err) {
			setError(
				err instanceof Error
					? err.message
					: "Dev login failed. Ensure you are in development mode.",
			);
		} finally {
			setLoading(false);
		}
	};

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
					setInfo(
						"Account created! Please check your email to verify your address.",
					);
				}
			} else {
				const result = await authClient.signIn.email({
					email,
					password,
				});
				if (result.error) {
					setError(result.error.message || "Sign in failed");
				} else {
					navigate({ to: "/" });
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
				callbackURL: "/",
			});
		} catch (err) {
			setError(err instanceof Error ? err.message : "Google sign-in failed");
			setLoading(false);
		}
	};

	return (
		<div className="flex min-h-[80vh] items-center justify-center">
			<div className="w-full max-w-md space-y-8 rounded-lg border bg-card p-8 shadow-lg">
				<div className="text-center">
					<h1 className="text-2xl font-bold">
						{isSignUp ? "Create Account" : "Sign In"}
					</h1>
					<p className="mt-2 text-sm text-muted-foreground">
						{isSignUp
							? "Create a new account to get started"
							: "Sign in to your account"}
					</p>
				</div>

				{error && (
					<div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
						{error}
					</div>
				)}

				{info && (
					<div className="rounded-md bg-green-500/10 p-3 text-sm text-green-400">
						{info}
					</div>
				)}

				<Button
					type="button"
					variant="outline"
					className="w-full"
					onClick={handleGoogleSignIn}
					disabled={loading}
				>
					<svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
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
				</Button>

				{import.meta.env.DEV && (
					<Button
						type="button"
						variant="destructive"
						className="w-full mt-2"
						onClick={handleDevAdminLogin}
						disabled={loading}
					>
						Dev Admin Login
					</Button>
				)}

				<div className="relative">
					<div className="absolute inset-0 flex items-center">
						<span className="w-full border-t" />
					</div>
					<div className="relative flex justify-center text-xs uppercase">
						<span className="bg-card px-2 text-muted-foreground">
							Or continue with email
						</span>
					</div>
				</div>

				<form onSubmit={handleEmailAuth} className="space-y-4">
					{isSignUp && (
						<div className="space-y-2">
							<Label htmlFor="name">Name</Label>
							<Input
								id="name"
								type="text"
								value={name}
								onChange={(e) => setName(e.target.value)}
								placeholder="Your name"
								required={isSignUp}
							/>
						</div>
					)}

					<div className="space-y-2">
						<Label htmlFor="email">Email</Label>
						<Input
							id="email"
							type="email"
							value={email}
							onChange={(e) => setEmail(e.target.value)}
							placeholder="you@example.com"
							required
						/>
					</div>

					<div className="space-y-2">
						<div className="flex items-center justify-between">
							<Label htmlFor="password">Password</Label>
							{!isSignUp && (
								<Link
									to="/forgot-password"
									className="text-xs text-primary hover:underline"
								>
									Forgot password?
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
						/>
					</div>

					<Button type="submit" className="w-full" disabled={loading}>
						{loading ? "Loading..." : isSignUp ? "Sign Up" : "Sign In"}
					</Button>
				</form>

				<div className="text-center text-sm">
					<Button
						type="button"
						variant="link"
						className="text-primary hover:underline p-0 h-auto font-normal"
						onClick={() => {
							setIsSignUp(!isSignUp);
							setError("");
							setInfo("");
						}}
					>
						{isSignUp
							? "Already have an account? Sign in"
							: "Don't have an account? Sign up"}
					</Button>
				</div>
			</div>
		</div>
	);
}
