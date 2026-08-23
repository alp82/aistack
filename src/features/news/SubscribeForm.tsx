import { useMutation } from "convex/react";
import { Check, Loader2 } from "lucide-react";
import { useState } from "react";
import { api } from "../../../convex/_generated/api";

/**
 * The public subscribe form (#201).
 *
 * The audience is members and the waitlist, subscribed by default, so this form
 * exists for the newcomer who is neither. It asks for nothing but an address,
 * and nothing is mailed on submit: the first issue is the confirmation, and it
 * carries a one-click unsubscribe link like every other send.
 *
 * `source` records where the address came from, so the archive page and the
 * subscribe page can be told apart later.
 */
export function SubscribeForm({
	source,
	compact = false,
}: {
	source: string;
	compact?: boolean;
}) {
	const subscribe = useMutation(api.newsletter.subscribe);
	const [email, setEmail] = useState("");
	const [state, setState] = useState<"idle" | "sending" | "done">("idle");
	const [message, setMessage] = useState<string | null>(null);
	const [alreadySubscribed, setAlreadySubscribed] = useState(false);

	async function handleSubmit(event: React.FormEvent) {
		event.preventDefault();
		if (state === "sending") return;
		setState("sending");
		setMessage(null);
		try {
			const result = await subscribe({ email, source });
			if (!result.ok) {
				setMessage(result.message ?? "That did not work. Try again.");
				setState("idle");
				return;
			}
			setAlreadySubscribed(result.alreadySubscribed === true);
			setState("done");
		} catch {
			setMessage("That did not work. Try again.");
			setState("idle");
		}
	}

	if (state === "done") {
		return (
			<div className="flex items-center gap-3 border-2 border-accent-lime bg-accent-lime/10 px-4 py-3">
				<Check className="size-5 shrink-0 text-accent-lime" />
				<p className="font-mono text-sm text-fg-primary">
					{alreadySubscribed
						? "You were already on the list. Nothing changed."
						: "You're on the list. The next issue goes out on a Sunday."}
				</p>
			</div>
		);
	}

	return (
		<form onSubmit={handleSubmit} className={compact ? "" : "max-w-xl"}>
			<div className="flex flex-col gap-3 sm:flex-row">
				<input
					type="email"
					required
					value={email}
					onChange={(e) => setEmail(e.target.value)}
					placeholder="you@example.com"
					aria-label="Email address"
					className="min-w-0 flex-1 border-2 border-stroke-strong bg-bg-canvas px-4 py-3 font-mono text-sm text-fg-primary placeholder:text-fg-muted focus:border-accent-lime focus:outline-none"
				/>
				<button
					type="submit"
					disabled={state === "sending"}
					className="inline-flex items-center justify-center gap-2 border-2 border-accent-lime bg-accent-lime px-6 py-3 font-mono text-sm font-bold uppercase tracking-wide text-accent-lime-contrast transition-colors hover:bg-transparent hover:text-accent-lime disabled:opacity-60"
				>
					{state === "sending" ? (
						<Loader2 className="size-4 animate-spin" />
					) : null}
					Subscribe
				</button>
			</div>
			{message ? (
				<p className="mt-3 font-mono text-sm text-destructive">{message}</p>
			) : null}
			<p className="mt-3 font-mono text-xs text-fg-muted">
				One email a week, at most. Unsubscribe from any issue in one click.
			</p>
		</form>
	);
}
