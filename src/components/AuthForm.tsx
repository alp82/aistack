import { useQueryClient } from "@tanstack/react-query";
import { Link, useNavigate } from "@tanstack/react-router";
import { type ReactNode, useEffect, useId, useState } from "react";
import { authClient } from "../lib/auth-client";
import { MagicLinkForm } from "./MagicLinkForm";
import { Input } from "./ui/input";
import { Label } from "./ui/label";

const GoogleIcon = () => (
	<svg aria-hidden="true" className="h-5 w-5" viewBox="0 0 24 24">
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
);

const GitHubIcon = () => (
	<svg aria-hidden="true" className="h-5 w-5" viewBox="0 0 24 24">
		<path
			fill="currentColor"
			d="M12 1.5C6.2 1.5 1.5 6.2 1.5 12c0 4.64 3.01 8.58 7.18 9.97.53.1.72-.23.72-.51 0-.25-.01-1.09-.01-1.97-2.92.63-3.54-1.24-3.54-1.24-.48-1.21-1.16-1.53-1.16-1.53-.95-.65.07-.64.07-.64 1.05.07 1.61 1.08 1.61 1.08.94 1.6 2.45 1.14 3.05.87.09-.68.37-1.14.67-1.4-2.33-.27-4.78-1.16-4.78-5.18 0-1.14.41-2.08 1.08-2.82-.11-.27-.47-1.36.1-2.84 0 0 .88-.28 2.89 1.08A9.97 9.97 0 0 1 12 6.34c.88 0 1.77.12 2.6.35 2-1.36 2.88-1.08 2.88-1.08.57 1.48.21 2.57.1 2.84.67.74 1.08 1.68 1.08 2.82 0 4.03-2.45 4.9-4.79 5.17.38.32.71.94.71 1.9 0 1.37-.01 2.47-.01 2.81 0 .28.19.62.73.51A10.5 10.5 0 0 0 22.5 12c0-5.8-4.7-10.5-10.5-10.5Z"
		/>
	</svg>
);

const LastUsedTag = () => (
	<span className="border border-current px-1.5 py-0.5 font-mono text-[10px] font-normal lowercase tracking-normal">
		last used
	</span>
);

interface AuthFormProps {
	/** Where to redirect after successful auth */
	callbackURL: string;
	/** Whether to default to sign-up mode */
	defaultIsSignUp?: boolean;
	/** Custom submit button label for sign-up mode (e.g. "Create Account & Publish") */
	signUpSubmitLabel?: string;
	/** Custom submit button label for sign-in mode (e.g. "Sign In & Publish") */
	signInSubmitLabel?: string;
	/** Additional content rendered below the sign-up/sign-in toggle */
	footer?: ReactNode;
}

export function AuthForm({
	callbackURL,
	defaultIsSignUp = false,
	signUpSubmitLabel = "Create Account",
	signInSubmitLabel = "Sign In",
	footer,
}: AuthFormProps) {
	const navigate = useNavigate();
	const queryClient = useQueryClient();
	const [isSignUp, setIsSignUp] = useState(defaultIsSignUp);
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [name, setName] = useState("");
	const [error, setError] = useState("");
	const [info, setInfo] = useState("");
	const [loading, setLoading] = useState(false);
	const [lastLoginMethod, setLastLoginMethod] = useState<string | null>(null);
	const nameId = useId();
	const emailId = useId();
	const passwordId = useId();

	useEffect(() => {
		setLastLoginMethod(authClient.getLastUsedLoginMethod());
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
					await queryClient.invalidateQueries({ queryKey: ["auth-token"] });
					navigate({ to: callbackURL });
				}
			}
		} catch (err) {
			setError(err instanceof Error ? err.message : "Authentication failed");
		} finally {
			setLoading(false);
		}
	};

	const handleSocialSignIn = async (provider: "google" | "github") => {
		setError("");
		setLoading(true);
		try {
			await authClient.signIn.social({
				provider,
				callbackURL,
			});
		} catch (err) {
			setError(
				err instanceof Error
					? err.message
					: `${provider === "google" ? "Google" : "GitHub"} sign-in failed`,
			);
			setLoading(false);
		}
	};

	return (
		<div className="space-y-6">
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
				onClick={() => handleSocialSignIn("google")}
				disabled={loading}
				className="w-full flex items-center justify-center gap-3 border-2 border-stroke-strong bg-bg-canvas px-4 py-4 font-mono text-sm font-semibold uppercase tracking-wide text-fg-primary transition-all hover:border-accent-lime hover:text-accent-lime disabled:opacity-50 cursor-pointer disabled:cursor-default"
			>
				<GoogleIcon />
				Continue with Google
				{lastLoginMethod === "google" && <LastUsedTag />}
			</button>

			<button
				type="button"
				onClick={() => handleSocialSignIn("github")}
				disabled={loading}
				className="w-full flex items-center justify-center gap-3 border-2 border-stroke-strong bg-bg-canvas px-4 py-4 font-mono text-sm font-semibold uppercase tracking-wide text-fg-primary transition-all hover:border-accent-lime hover:text-accent-lime disabled:opacity-50 cursor-pointer disabled:cursor-default"
			>
				<GitHubIcon />
				Continue with GitHub
				{lastLoginMethod === "github" && <LastUsedTag />}
			</button>

			<div className="relative">
				<div className="absolute inset-0 flex items-center">
					<span className="w-full border-t-2 border-stroke-subtle" />
				</div>
				<div className="relative flex justify-center">
					<span className="bg-bg-panel px-4 font-mono text-xs uppercase tracking-widest text-fg-muted">
						Or use a magic link
					</span>
				</div>
			</div>

			<MagicLinkForm
				callbackURL={callbackURL}
				disabled={loading}
				lastUsed={lastLoginMethod === "magic-link"}
			/>

			<div className="relative">
				<div className="absolute inset-0 flex items-center">
					<span className="w-full border-t-2 border-stroke-subtle" />
				</div>
				<div className="relative flex justify-center">
					<span className="bg-bg-panel px-4 font-mono text-xs uppercase tracking-widest text-fg-muted">
						Or use email & password
					</span>
				</div>
			</div>

			<form onSubmit={handleEmailAuth} className="space-y-5">
				{isSignUp && (
					<div className="space-y-2">
						<Label
							htmlFor={nameId}
							className="font-mono text-xs uppercase tracking-widest text-fg-muted"
						>
							Name
						</Label>
						<Input
							id={nameId}
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
					<Label
						htmlFor={emailId}
						className="font-mono text-xs uppercase tracking-widest text-fg-muted"
					>
						Email
					</Label>
					<Input
						id={emailId}
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
						<Label
							htmlFor={passwordId}
							className="font-mono text-xs uppercase tracking-widest text-fg-muted"
						>
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
						id={passwordId}
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
					className="w-full flex items-center justify-center gap-3 border-2 border-accent-lime bg-accent-lime px-4 py-4 font-mono text-sm font-bold uppercase tracking-widest text-accent-lime-contrast transition-all hover:bg-accent-lime-strong disabled:opacity-50 cursor-pointer disabled:cursor-default"
				>
					{loading
						? "Loading..."
						: isSignUp
							? signUpSubmitLabel
							: signInSubmitLabel}
					{lastLoginMethod === "email" && <LastUsedTag />}
				</button>
			</form>

			<div className="text-center space-y-3">
				<button
					type="button"
					onClick={() => {
						setIsSignUp(!isSignUp);
						setError("");
						setInfo("");
					}}
					className="font-mono text-sm text-fg-muted hover:text-accent-lime transition-colors cursor-pointer"
				>
					{isSignUp
						? "Already have an account? Sign in"
						: "Don't have an account? Sign up"}
				</button>
			</div>

			{footer}
		</div>
	);
}
