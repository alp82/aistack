import { convexQuery } from "@convex-dev/react-query";
import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useQuery } from "convex/react";
import { ArrowRight, Mail } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import {
	KnowledgeBaseIndex,
	type KnowledgeBaseIndexData,
} from "@/features/news/KnowledgeBase";
import { SubscribeForm } from "@/features/news/SubscribeForm";
import { NEWS_IS_PUBLIC } from "@/lib/newsVisibility";
import { seoMeta } from "@/lib/seo";
import { api } from "../../convex/_generated/api";

/**
 * The newsletter archive (#201, map #198).
 *
 * Every sent issue gets a public page, and this is the index of them. It is
 * also where a visitor who has never had an issue can subscribe.
 *
 * The knowledge base is the pull view over the same item stream. Its topic
 * index leads this page, while newsletter issues remain available here.
 */

export const Route = createFileRoute("/news/")({
	component: NewsIndex,
	// The archive is meant to be linked and cited, so the first HTML carries the
	// issues rather than waiting for a hydrated client.
	loader: async ({ context }) => {
		// Closed until the first send. Server-side, so no content reaches the
		// client. See `NEWS_IS_PUBLIC`.
		if (!NEWS_IS_PUBLIC) throw notFound();
		const [issues, knowledgeBase] = await Promise.all([
			context.queryClient.ensureQueryData(
				convexQuery(api.newsletter.listSentIssues, {}),
			),
			context.queryClient.ensureQueryData(
				convexQuery(api.knowledgeBase.getIndex, {}),
			),
		]);
		return { issues, knowledgeBase };
	},
	head: () => ({
		meta: seoMeta({
			title: "AI Stack News - The weekly newsletter archive",
			description:
				"Every issue of AI Stack News: the week's model releases, agent harness changes, and tooling, collected for people who build with AI tools.",
			url: "/news",
			keywords:
				"AI newsletter, AI coding news, agent harness, model releases, weekly AI digest",
		}),
	}),
});

function formatDate(ms?: number): string {
	if (typeof ms !== "number") return "";
	return new Date(ms).toLocaleDateString("en-US", {
		month: "short",
		day: "numeric",
		year: "numeric",
	});
}

function NewsIndex() {
	const { issues: loaded, knowledgeBase: loadedKnowledgeBase } =
		Route.useLoaderData();
	const issues = useQuery(api.newsletter.listSentIssues, {}) ?? loaded;
	const knowledgeBase =
		useQuery(api.knowledgeBase.getIndex, {}) ?? loadedKnowledgeBase;

	return (
		<div className="mx-auto max-w-5xl px-4 py-16 sm:px-6 sm:py-24">
			<PageHeader
				label="AI_STACK_NEWS"
				labelSuffix="KNOWLEDGE_BASE"
				title={
					<>
						News by
						<br />
						topic
					</>
				}
				description="Approved AI tooling news, grouped by topic. The newest five stay close, and each topic keeps its own archive."
			/>

			<KnowledgeBaseIndex data={knowledgeBase as KnowledgeBaseIndexData} />

			<section className="mb-20 border-2 border-stroke-strong bg-bg-panel p-6 sm:p-8">
				<div className="mb-4 flex items-center gap-3 font-mono text-sm text-accent-lime">
					<Mail className="size-4" />
					<span>{"// SUBSCRIBE"}</span>
				</div>
				<SubscribeForm source="news-archive" />
			</section>

			<section>
				<h2 className="mb-8 font-mono text-sm uppercase tracking-widest text-fg-muted">
					Newsletter issues
				</h2>

				{issues.length === 0 ? (
					<p className="border-l-4 border-stroke-strong pl-6 text-lg text-fg-secondary">
						No issue has gone out yet. The first one is being put together.
					</p>
				) : (
					<ul className="border-t-2 border-stroke-subtle">
						{issues.map((issue) => (
							<li key={issue.slug}>
								<Link
									to="/news/$slug"
									params={{ slug: issue.slug }}
									className="group flex flex-col gap-2 border-b-2 border-stroke-subtle py-6 transition-colors hover:border-accent-lime sm:flex-row sm:items-baseline sm:gap-8"
								>
									<span className="w-32 shrink-0 font-mono text-xs uppercase tracking-widest text-fg-muted">
										#{issue.number} · {formatDate(issue.sentAt)}
									</span>
									<span className="flex-1 text-xl font-bold tracking-tight text-fg-primary group-hover:text-accent-lime">
										{issue.subject}
									</span>
									<span className="shrink-0 font-mono text-xs text-fg-muted">
										{issue.itemCount} items
									</span>
									<ArrowRight className="hidden size-4 shrink-0 text-fg-muted group-hover:text-accent-lime sm:block" />
								</Link>
							</li>
						))}
					</ul>
				)}
			</section>
		</div>
	);
}
