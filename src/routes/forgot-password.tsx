import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowLeft, Mail } from "lucide-react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { authClient } from "../lib/auth-client";

export const Route = createFileRoute("/forgot-password")({
	component: ForgotPasswordPage,
});

function ForgotPasswordPage() {
	const [email, setEmail] = useState("");
	const [error, setError] = useState("");
	const [loading, setLoading] = useState(false);
	const [sent, setSent] = useState(false);

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setError("");
		setLoading(true);

		try {
			await authClient.forgetPassword({
				email,
				redirectTo: "/reset-password",
			});
			setSent(true);
		} catch (err) {
			setError(
				err instanceof Error ? err.message : "Failed to send reset email",
			);
		} finally {
			setLoading(false);
		}
	};

	return (
		<div className="flex min-h-[80vh] items-center justify-center">
			<div className="w-full max-w-md space-y-6 rounded-lg border bg-card p-8 shadow-lg">
				<div className="text-center">
					<h1 className="text-2xl font-bold">Reset Password</h1>
					<p className="mt-2 text-sm text-muted-foreground">
						Enter your email and we'll send you a reset link
					</p>
				</div>

				{sent ? (
					<div className="space-y-4">
						<div className="flex flex-col items-center gap-3 rounded-md bg-green-500/10 p-6 text-center">
							<Mail className="h-10 w-10 text-green-400" />
							<p className="text-sm font-medium text-green-400">
								Check your email
							</p>
							<p className="text-sm text-muted-foreground">
								If an account exists for <strong>{email}</strong>, we've sent a
								password reset link.
							</p>
						</div>
						<Link
							to="/login"
							className="flex items-center justify-center gap-2 text-sm text-primary hover:underline"
						>
							<ArrowLeft className="h-4 w-4" />
							Back to sign in
						</Link>
					</div>
				) : (
					<>
						{error && (
							<div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
								{error}
							</div>
						)}

						<form onSubmit={handleSubmit} className="space-y-4">
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

							<Button type="submit" className="w-full" disabled={loading}>
								{loading ? "Sending..." : "Send Reset Link"}
							</Button>
						</form>

						<Link
							to="/login"
							className="flex items-center justify-center gap-2 text-sm text-primary hover:underline"
						>
							<ArrowLeft className="h-4 w-4" />
							Back to sign in
						</Link>
					</>
				)}
			</div>
		</div>
	);
}
