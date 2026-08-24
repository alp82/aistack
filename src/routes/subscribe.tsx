import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { PageHeader } from "@/components/PageHeader";
import { SubscribeForm } from "@/features/news/SubscribeForm";
import { NEWS_IS_PUBLIC } from "@/lib/newsVisibility";
import { seoMeta } from "@/lib/seo";

/**
 * The public subscribe page (#201, map #198).
 *
 * Members and the waitlist are subscribed by default, so this page is for the
 * newcomer who is neither. It stays a page of its own, not a modal, because it
 * is the address handed out in a talk, a post, or a profile.
 */

export const Route = createFileRoute("/subscribe")({
	component: SubscribePage,
	// The page holds no data, so this loader exists only to close the surface
	// until the first send. See `NEWS_IS_PUBLIC`.
	loader: async () => {
		if (!NEWS_IS_PUBLIC) throw notFound();
	},
	head: () => ({
		meta: seoMeta({
			title: "Subscribe to AI Stack News",
			description:
				"One email a week about AI coding tools: model releases, agent harness changes, and what people actually run.",
			url: "/subscribe",
			keywords: "AI newsletter, subscribe, AI coding tools, weekly digest",
		}),
	}),
});

const WHAT_YOU_GET = [
	{
		label: "Model releases",
		text: "The frontier models and the open weights, with what changed for people who code with them.",
	},
	{
		label: "Harness changes",
		text: "Claude Code, Codex, gemini-cli, opencode, pi. One roll-up per tool, not one line per patch.",
	},
	{
		label: "The money",
		text: "Acquisitions, pricing moves, and capacity news, because they decide which tools survive.",
	},
];

function SubscribePage() {
	return (
		<div className="mx-auto max-w-4xl px-4 py-16 sm:px-6 sm:py-24">
			<PageHeader
				label="AI_STACK_NEWS"
				labelSuffix="ONE EMAIL A WEEK"
				title={<>Subscribe</>}
				description="What actually moved this week in AI coding tools, collected and written up by hand. Sunday. Thin weeks skip."
			/>

			<section className="mb-16 border-2 border-stroke-strong bg-bg-panel p-6 sm:p-8">
				<SubscribeForm source="subscribe-page" />
			</section>

			<section className="mb-16">
				<h2 className="mb-8 font-mono text-sm uppercase tracking-widest text-fg-muted">
					What lands in your inbox
				</h2>
				<ul className="grid gap-6 sm:grid-cols-3">
					{WHAT_YOU_GET.map((row) => (
						<li key={row.label} className="border-t-2 border-accent-lime pt-4">
							<p className="mb-2 font-mono text-xs font-bold uppercase tracking-widest text-fg-primary">
								{row.label}
							</p>
							<p className="text-sm leading-relaxed text-fg-secondary">
								{row.text}
							</p>
						</li>
					))}
				</ul>
			</section>

			<p className="font-mono text-sm text-fg-muted">
				Already had an issue?{" "}
				<Link to="/news" className="text-accent-lime hover:underline">
					Read the archive
				</Link>
				.
			</p>
		</div>
	);
}
