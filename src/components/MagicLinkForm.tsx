import { Mail } from "lucide-react";
import { useState } from "react";
import { authClient } from "../lib/auth-client";
import { LastUsedLoginMethodTag } from "./LastUsedLoginMethodTag";
import { Input } from "./ui/input";
import { Label } from "./ui/label";

type MagicLinkFormProps = {
	callbackURL: string;
	disabled?: boolean;
	lastUsed?: boolean;
};

export function MagicLinkForm({
	callbackURL,
	disabled,
	lastUsed,
}: MagicLinkFormProps) {
	const [email, setEmail] = useState("");
	const [loading, setLoading] = useState(false);
	const [sent, setSent] = useState(false);
	const [error, setError] = useState("");

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setError("");
		setLoading(true);

		try {
			const result = await authClient.signIn.magicLink({
				email,
				callbackURL,
			});
			if (result.error) {
				setError(result.error.message || "Failed to send magic link");
			} else {
				setSent(true);
			}
		} catch (err) {
			setError(
				err instanceof Error ? err.message : "Failed to send magic link",
			);
		} finally {
			setLoading(false);
		}
	};

	if (sent) {
		return (
			<div className="space-y-3 border-2 border-green-500 bg-green-500/10 p-6 text-center">
				<Mail className="mx-auto size-8 text-green-400" />
				<p className="font-mono text-sm font-semibold text-green-400">
					Check your inbox
				</p>
				<p className="font-mono text-xs text-fg-muted">
					We sent a sign-in link to{" "}
					<span className="text-fg-primary">{email}</span>
				</p>
				<button
					type="button"
					onClick={() => {
						setSent(false);
						setEmail("");
					}}
					className="font-mono text-xs text-fg-muted hover:text-accent-lime transition-colors cursor-pointer"
				>
					Use a different email
				</button>
			</div>
		);
	}

	return (
		<form onSubmit={handleSubmit} className="space-y-4">
			{error && (
				<div className="border-2 border-destructive bg-destructive/10 p-3 font-mono text-xs text-destructive">
					{error}
				</div>
			)}

			<div className="space-y-2">
				<Label
					htmlFor="magic-link-email"
					className="font-mono text-xs uppercase tracking-widest text-fg-muted"
				>
					Email
				</Label>
				<Input
					id="magic-link-email"
					type="email"
					value={email}
					onChange={(e) => setEmail(e.target.value)}
					placeholder="you@example.com"
					required
					className="border-2 border-stroke-strong bg-bg-canvas px-4 py-3 font-mono text-fg-primary placeholder:text-fg-muted focus:border-accent-lime focus:ring-0"
				/>
			</div>

			<button
				type="submit"
				disabled={loading || disabled}
				className="w-full flex items-center justify-center gap-3 border-2 border-stroke-strong bg-bg-canvas px-4 py-4 font-mono text-sm font-semibold uppercase tracking-wide text-fg-primary transition-all hover:border-accent-lime hover:text-accent-lime disabled:opacity-50 cursor-pointer disabled:cursor-default"
			>
				<Mail className="size-4" />
				{loading ? "Sending..." : "Send Magic Link"}
				{lastUsed && <LastUsedLoginMethodTag />}
			</button>
		</form>
	);
}
