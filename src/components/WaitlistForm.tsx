import { useMutation, useQuery } from "convex/react";
import { Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { api } from "../../convex/_generated/api";
import { authClient } from "../lib/auth-client";
import { SuccessMessage } from "./SuccessMessage";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";

type WaitlistFormVariant = "hero" | "footer" | "header";

interface WaitlistFormProps {
	variant: WaitlistFormVariant;
	displayCount?: number;
	className?: string;
	onSuccess?: () => void;
}

export function WaitlistForm({
	variant,
	displayCount = 0,
	className = "",
	onSuccess,
}: WaitlistFormProps) {
	const [email, setEmail] = useState("");
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [submitMessage, setSubmitMessage] = useState("");
	const [error, setError] = useState("");

	const waitlistStatus = useQuery(
		api.waitlist.getWaitlistStatus,
		email ? { email } : "skip",
	);
	const joinWaitlist = useMutation(api.waitlist.joinWaitlist);

	useEffect(() => {
		const checkGoogleSuccess = () => {
			const shouldShowSuccess = sessionStorage.getItem("showWaitlistSuccess");
			if (shouldShowSuccess === "true") {
				setSubmitMessage("Thanks for joining! We'll keep you updated.");
				sessionStorage.removeItem("showWaitlistSuccess");
				onSuccess?.();
			}
		};
		checkGoogleSuccess();
	}, [onSuccess]);

	const handleEmailSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setIsSubmitting(true);
		setError("");

		try {
			await joinWaitlist({
				email,
				source: variant,
			});
			setSubmitMessage("Thanks for joining! We'll keep you updated.");
			setEmail("");
			onSuccess?.();
		} catch (err: unknown) {
			const message =
				err instanceof Error ? err.message : "Something went wrong";
			setError(message);
		} finally {
			setIsSubmitting(false);
		}
	};

	const handleGoogleSignIn = async () => {
		try {
			sessionStorage.removeItem("showWaitlistSuccess");
			await authClient.signOut();
			window.dispatchEvent(new CustomEvent("auth-signout"));
			await new Promise((resolve) => setTimeout(resolve, 100));

			document.cookie.split(";").forEach((c) => {
				const cookie = c.trim();
				if (
					cookie.startsWith("g_state") ||
					(cookie.startsWith("__Secure-") && cookie.includes("google")) ||
					cookie.startsWith("G_AUTH") ||
					(cookie.startsWith("S") && cookie.includes("google"))
				) {
					const domain = window.location.hostname;
					const path = "/";
					document.cookie = `${cookie.split("=")[0]}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=${path}`;
					document.cookie = `${cookie.split("=")[0]}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=${path};domain=.${domain}`;
				}
			});

			if (window.localStorage.getItem("gauth.token")) {
				window.localStorage.removeItem("gauth.token");
			}

			await authClient.signIn.social({
				provider: "google",
				callbackURL: `/auth-callback?source=${variant}`,
			});
		} catch (err) {
			console.error("Google sign-in failed:", err);
			setError("Failed to sign in with Google. Please try again.");
		}
	};

	const isHeader = variant === "header";

	if (isHeader) {
		return (
			<div className={cn("flex items-center gap-2", className)}>
				{submitMessage ? (
					<span className="text-green-400 text-sm font-medium">
						✓ You're on the list!
					</span>
				) : (
					<>
						<form
							onSubmit={handleEmailSubmit}
							className="flex items-center gap-2"
						>
							<Input
								type="email"
								value={email}
								onChange={(e) => setEmail(e.target.value)}
								placeholder="Enter your email"
								className="w-48 h-8 bg-slate-800 border-slate-600 text-white placeholder-gray-500 text-sm"
								required
							/>
							<Button
								type="submit"
								size="sm"
								disabled={isSubmitting || !!waitlistStatus}
								className="bg-cyan-600 hover:bg-cyan-700 text-white px-3 h-8 text-sm"
							>
								{isSubmitting ? (
									<Loader2 className="h-4 w-4 animate-spin" />
								) : (
									"Join"
								)}
							</Button>
						</form>
						<div className="h-6 w-px bg-slate-600" />
						<Button
							variant="ghost"
							size="sm"
							onClick={handleGoogleSignIn}
							disabled={isSubmitting || !!waitlistStatus}
							className="h-8 px-2 text-gray-300 hover:text-white hover:bg-slate-700"
						>
							<svg className="h-4 w-4" aria-hidden="true" viewBox="0 0 24 24">
								<path
									d="M12.0003 4.75C13.7703 4.75 15.3553 5.36002 16.6053 6.54998L20.0303 3.125C17.9502 1.19 15.2353 0 12.0003 0C7.31028 0 3.25527 2.69 1.28027 6.60998L5.27028 9.70498C6.21525 6.86002 8.87028 4.75 12.0003 4.75Z"
									fill="#EA4335"
								/>
								<path
									d="M23.49 12.275C23.49 11.49 23.415 10.73 23.3 10H12V14.51H18.47C18.18 15.99 17.34 17.25 16.08 18.1L19.945 21.1C22.2 19.01 23.49 15.92 23.49 12.275Z"
									fill="#4285F4"
								/>
								<path
									d="M5.26498 14.2949C5.02498 13.5699 4.88501 12.7999 4.88501 11.9999C4.88501 11.1999 5.01998 10.4299 5.26498 9.7049L1.275 6.60986C0.46 8.22986 0 10.0599 0 11.9999C0 13.9399 0.46 15.7699 1.28 17.3899L5.26498 14.2949Z"
									fill="#FBBC05"
								/>
								<path
									d="M12.0004 24.0001C15.2404 24.0001 17.9654 22.935 19.9454 21.095L16.0804 18.095C15.0054 18.82 13.6204 19.245 12.0004 19.245C8.8704 19.245 6.21537 17.135 5.2654 14.29L1.27539 17.385C3.25539 21.31 7.3104 24.0001 12.0004 24.0001Z"
									fill="#34A853"
								/>
							</svg>
						</Button>
					</>
				)}
				{error && <span className="text-red-400 text-xs">{error}</span>}
			</div>
		);
	}

	return (
		<div className={cn("space-y-2 md:space-y-4", className)}>
			<form
				onSubmit={handleEmailSubmit}
				className="flex items-center gap-2 md:gap-4 mx-auto max-w-md"
			>
				<div className="flex-1">
					<Label htmlFor={`${variant}-email`} className="sr-only">
						Email
					</Label>
					<Input
						id={`${variant}-email`}
						type="email"
						value={email}
						onChange={(e) => setEmail(e.target.value)}
						placeholder="Enter your email"
						className="bg-white border-gray-500 text-black placeholder-gray-500 h-12"
						required
					/>
				</div>
				<Button
					type="submit"
					size="lg"
					disabled={isSubmitting || !!waitlistStatus || !displayCount}
					className="bg-sky-600 hover:bg-sky-700 text-white px-2 md:px-6 cursor-pointer"
				>
					{!displayCount
						? "Loading..."
						: isSubmitting
							? "Joining..."
							: waitlistStatus && email
								? "Already Joined"
								: "Join Waitlist"}
				</Button>
			</form>

			<div className="relative max-w-md mx-auto">
				<div className="absolute inset-0 flex items-center">
					<span className="w-full border-t border-gray-600"></span>
				</div>
				<div className="relative flex justify-center text-sm">
					<span className="px-2 bg-transparent text-gray-400">
						Or continue with
					</span>
				</div>
			</div>

			<Button
				variant="outline"
				onClick={handleGoogleSignIn}
				disabled={isSubmitting || !!waitlistStatus || !displayCount}
				className="border-gray-600 text-black hover:bg-gray-300 hover:border-gray-500 max-w-md mx-auto w-full cursor-pointer"
			>
				<svg className="h-4 w-4" aria-hidden="true" viewBox="0 0 24 24">
					<path
						d="M12.0003 4.75C13.7703 4.75 15.3553 5.36002 16.6053 6.54998L20.0303 3.125C17.9502 1.19 15.2353 0 12.0003 0C7.31028 0 3.25527 2.69 1.28027 6.60998L5.27028 9.70498C6.21525 6.86002 8.87028 4.75 12.0003 4.75Z"
						fill="#EA4335"
					/>
					<path
						d="M23.49 12.275C23.49 11.49 23.415 10.73 23.3 10H12V14.51H18.47C18.18 15.99 17.34 17.25 16.08 18.1L19.945 21.1C22.2 19.01 23.49 15.92 23.49 12.275Z"
						fill="#4285F4"
					/>
					<path
						d="M5.26498 14.2949C5.02498 13.5699 4.88501 12.7999 4.88501 11.9999C4.88501 11.1999 5.01998 10.4299 5.26498 9.7049L1.275 6.60986C0.46 8.22986 0 10.0599 0 11.9999C0 13.9399 0.46 15.7699 1.28 17.3899L5.26498 14.2949Z"
						fill="#FBBC05"
					/>
					<path
						d="M12.0004 24.0001C15.2404 24.0001 17.9654 22.935 19.9454 21.095L16.0804 18.095C15.0054 18.82 13.6204 19.245 12.0004 19.245C8.8704 19.245 6.21537 17.135 5.2654 14.29L1.27539 17.385C3.25539 21.31 7.3104 24.0001 12.0004 24.0001Z"
						fill="#34A853"
					/>
				</svg>
				Join with Google
			</Button>

			{submitMessage && <SuccessMessage message={submitMessage} />}

			{error && (
				<div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 max-w-md mx-auto">
					<p className="text-red-400 text-center">{error}</p>
				</div>
			)}
		</div>
	);
}
