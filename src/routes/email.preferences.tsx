import { createFileRoute, Link, useSearch } from "@tanstack/react-router";
import { useAction } from "convex/react";
import { Check, Loader2 } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { seoMeta } from "@/lib/seo";
import { api } from "../../convex/_generated/api";

/**
 * The email preferences page (#201, map #198).
 *
 * Unsubscribe is per category, not global (#204). This page is where a
 * recipient sees both toggles at once, so turning the newsletter off does not
 * also silence an important update about their own account.
 *
 * The token is the same signed unsubscribe token every send already carries, so
 * a link in a two-year-old inbox still opens this page. It proves the holder
 * owns the address, and the only preferences it reaches are that address's.
 * Nothing here needs a login, on purpose: a recipient who never made an account
 * still gets to say no.
 */

export const Route = createFileRoute("/email/preferences")({
	component: PreferencesPage,
	// Every key optional, or `search` becomes required on every Link in the app.
	validateSearch: (search: Record<string, unknown>): { token?: string } => ({
		token: typeof search.token === "string" ? search.token : undefined,
	}),
	head: () => ({
		meta: seoMeta({
			title: "Email preferences - AI Stack",
			description: "Choose which emails AI Stack sends you.",
			url: "/email/preferences",
			noindex: true,
		}),
	}),
});

const CATEGORIES = [
	{
		key: "newsletter" as const,
		label: "AI Stack News",
		text: "The weekly newsletter. One email a week, at most.",
	},
	{
		key: "importantUpdates" as const,
		label: "Important updates",
		text: "Rare announcements about AI Stack itself. A few a year.",
	},
];

type Prefs = { email: string; newsletter: boolean; importantUpdates: boolean };

function PreferencesPage() {
	const { token } = useSearch({ from: "/email/preferences" });
	const read = useAction(api.newsletter.preferencesByToken);
	const write = useAction(api.newsletter.setPreferencesByToken);

	const [prefs, setPrefs] = useState<Prefs | null>(null);
	const [status, setStatus] = useState<"loading" | "ready" | "invalid">(
		"loading",
	);
	const [saving, setSaving] = useState(false);
	const [saved, setSaved] = useState(false);

	useEffect(() => {
		let cancelled = false;
		if (!token) {
			setStatus("invalid");
			return;
		}
		read({ token })
			.then((result) => {
				if (cancelled) return;
				if (!result) {
					setStatus("invalid");
					return;
				}
				setPrefs(result);
				setStatus("ready");
			})
			.catch(() => {
				if (!cancelled) setStatus("invalid");
			});
		return () => {
			cancelled = true;
		};
	}, [token, read]);

	const toggle = useCallback(
		async (key: "newsletter" | "importantUpdates") => {
			if (!prefs || !token || saving) return;
			const next = { ...prefs, [key]: !prefs[key] };
			setPrefs(next);
			setSaving(true);
			setSaved(false);
			const result = await write({
				token,
				newsletter: next.newsletter,
				importantUpdates: next.importantUpdates,
			});
			setSaving(false);
			if (result.ok) {
				setSaved(true);
			} else {
				// The write did not land, so put the switch back where it was.
				setPrefs(prefs);
			}
		},
		[prefs, token, saving, write],
	);

	return (
		<div className="mx-auto max-w-2xl px-4 py-20 sm:px-6 sm:py-28">
			<p className="mb-6 font-mono text-sm text-accent-lime">
				{"// EMAIL_PREFERENCES"}
			</p>
			<h1 className="mb-10 text-4xl font-black uppercase leading-[0.95] tracking-tighter text-fg-primary sm:text-5xl">
				Which emails
				<br />
				do you want?
			</h1>

			{status === "loading" ? (
				<p className="flex items-center gap-3 font-mono text-sm text-fg-muted">
					<Loader2 className="size-4 animate-spin" />
					Reading your preferences...
				</p>
			) : null}

			{status === "invalid" ? (
				<div className="border-2 border-stroke-strong bg-bg-panel p-6">
					<p className="mb-4 text-lg text-fg-secondary">
						That link is not valid. Use the unsubscribe link at the bottom of
						any email we sent you.
					</p>
					<Link
						to="/"
						className="font-mono text-sm text-accent-lime hover:underline"
					>
						Go to AI Stack
					</Link>
				</div>
			) : null}

			{status === "ready" && prefs ? (
				<>
					<p className="mb-8 font-mono text-sm text-fg-muted">{prefs.email}</p>
					<ul className="border-t-2 border-stroke-subtle">
						{CATEGORIES.map((category) => (
							<li
								key={category.key}
								className="flex items-center justify-between gap-6 border-b-2 border-stroke-subtle py-6"
							>
								<div>
									<p className="mb-1 font-bold text-fg-primary">
										{category.label}
									</p>
									<p className="text-sm text-fg-secondary">{category.text}</p>
								</div>
								<button
									type="button"
									onClick={() => toggle(category.key)}
									disabled={saving}
									aria-pressed={prefs[category.key]}
									className={`shrink-0 border-2 px-4 py-2 font-mono text-xs font-bold uppercase tracking-wide transition-colors disabled:opacity-60 ${
										prefs[category.key]
											? "border-accent-lime bg-accent-lime text-accent-lime-contrast"
											: "border-stroke-strong text-fg-muted hover:border-accent-lime hover:text-accent-lime"
									}`}
								>
									{prefs[category.key] ? "Subscribed" : "Unsubscribed"}
								</button>
							</li>
						))}
					</ul>
					<div className="mt-6 h-6">
						{saving ? (
							<p className="flex items-center gap-2 font-mono text-xs text-fg-muted">
								<Loader2 className="size-3 animate-spin" />
								Saving...
							</p>
						) : null}
						{saved && !saving ? (
							<p className="flex items-center gap-2 font-mono text-xs text-accent-lime">
								<Check className="size-3" />
								Saved.
							</p>
						) : null}
					</div>
					<p className="mt-10 font-mono text-xs text-fg-muted">
						Transactional email, like a password reset, has no toggle. It only
						goes out when you ask for it.
					</p>
				</>
			) : null}
		</div>
	);
}
