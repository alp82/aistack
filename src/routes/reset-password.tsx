import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { CheckCircle } from "lucide-react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { authClient } from "../lib/auth-client";

export const Route = createFileRoute("/reset-password")({
	component: ResetPasswordPage,
});

function ResetPasswordPage() {
	const navigate = useNavigate();
	const [password, setPassword] = useState("");
	const [confirmPassword, setConfirmPassword] = useState("");
	const [error, setError] = useState("");
	const [loading, setLoading] = useState(false);
	const [success, setSuccess] = useState(false);

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setError("");

		if (password !== confirmPassword) {
			setError("Passwords do not match");
			return;
		}

		if (password.length < 8) {
			setError("Password must be at least 8 characters");
			return;
		}

		setLoading(true);

		try {
			await authClient.resetPassword({
				newPassword: password,
			});
			setSuccess(true);
			setTimeout(() => {
				navigate({ to: "/signin" });
			}, 2000);
		} catch (err) {
			setError(err instanceof Error ? err.message : "Failed to reset password");
		} finally {
			setLoading(false);
		}
	};

	return (
		<div className="flex min-h-[80vh] items-center justify-center px-4">
			<div className="w-full max-w-[28rem] space-y-6 rounded-lg border bg-card p-8 shadow-lg">
				<div className="text-center">
					<h1 className="text-2xl font-bold">Set New Password</h1>
					<p className="mt-2 text-sm text-muted-foreground">
						Choose a new password for your account
					</p>
				</div>

				{success ? (
					<div className="flex flex-col items-center gap-3 rounded-md bg-green-500/10 p-6 text-center">
						<CheckCircle className="h-10 w-10 text-green-400" />
						<p className="text-sm font-medium text-green-400">
							Password reset successfully
						</p>
						<p className="text-sm text-muted-foreground">
							Redirecting to sign in...
						</p>
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
								<Label htmlFor="password">New Password</Label>
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

							<div className="space-y-2">
								<Label htmlFor="confirmPassword">Confirm Password</Label>
								<Input
									id="confirmPassword"
									type="password"
									value={confirmPassword}
									onChange={(e) => setConfirmPassword(e.target.value)}
									placeholder="••••••••"
									required
									minLength={8}
								/>
							</div>

							<Button type="submit" className="w-full" disabled={loading}>
								{loading ? "Resetting..." : "Reset Password"}
							</Button>
						</form>

						<Link
							to="/signin"
							className="flex items-center justify-center gap-2 text-sm text-primary hover:underline"
						>
							Back to sign in
						</Link>
					</>
				)}
			</div>
		</div>
	);
}
