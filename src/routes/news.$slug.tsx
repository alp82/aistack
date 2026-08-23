import { convexQuery } from "@convex-dev/react-query";
import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useQuery } from "convex/react";
import { ArrowLeft, ArrowRight, ExternalLink } from "lucide-react";
import { SubscribeForm } from "@/features/news/SubscribeForm";
import { seoMeta } from "@/lib/seo";
import { api } from "../../convex/_generated/api";

/**
 * One sent issue's archive page (#201, map #198).
 *
 * #203 gave this page a job beyond showing the issue. The read-in-browser link
 * is the only site link an issue carries besides the main page, so whoever
 * lands here has to be able to reach the other issues. That is why the neighbour
 * links and the full issue list are on the page, not just a back link.
 *
 * A draft issue is not public: `getSentIssue` returns null for one, and this
 * route 404s.
 */

export const Route = createFileRoute("/news/$slug")({
	component: IssuePage,
	loader: async ({ context, params }) => {
		const issue = await context.queryClient.ensureQueryData(
			convexQuery(api.newsletter.getSentIssue, { slug: params.slug }),
		);
		if (!issue) throw notFound();
		return { issue };
	},
	head: ({ loaderData }) => ({
		meta: seoMeta({
			title: loaderData?.issue
				? `${loaderData.issue.subject} - AI Stack News #${loaderData.issue.number}`
				: "AI Stack News",
			description:
				loaderData?.issue?.intro ??
				"One week of model releases, agent harness changes, and tooling for people who build with AI tools.",
			url: loaderData?.issue ? `/news/${loaderData.issue.slug}` : "/news",
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

function IssuePage() {
	const { slug } = Route.useParams();
	const { issue: loaded } = Route.useLoaderData();
	const issue = useQuery(api.newsletter.getSentIssue, { slug }) ?? loaded;

	if (!issue) return null;

	return (
		<div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 sm:py-24">
			<Link
				to="/news"
				className="mb-10 inline-flex items-center gap-2 font-mono text-xs uppercase tracking-widest text-fg-muted transition-colors hover:text-accent-lime"
			>
				<ArrowLeft className="size-3" />
				All issues
			</Link>

			<header className="mb-12 border-b-2 border-stroke-strong pb-10">
				<p className="mb-6 font-mono text-sm text-accent-lime">
					{"// AI_STACK_NEWS · ISSUE #"}
					{issue.number} · {formatDate(issue.sentAt)}
				</p>
				<h1 className="text-4xl font-black uppercase leading-[0.95] tracking-tighter text-fg-primary sm:text-6xl">
					{issue.subject}
				</h1>
				{issue.intro ? (
					<p className="mt-8 border-l-4 border-accent-lime pl-6 text-lg leading-relaxed text-fg-secondary">
						{issue.intro}
					</p>
				) : null}
			</header>

			<div className="space-y-10">
				{issue.items.map((item) => (
					<article
						key={item.url}
						className="border-b-2 border-stroke-subtle pb-10"
					>
						<h2 className="mb-2 text-2xl font-bold leading-tight tracking-tight text-fg-primary">
							<a
								href={item.url}
								target="_blank"
								rel="noopener noreferrer"
								className="group inline-flex items-start gap-2 hover:text-accent-lime"
							>
								{item.headline}
								<ExternalLink className="mt-2 size-4 shrink-0 text-fg-muted group-hover:text-accent-lime" />
							</a>
						</h2>
						<p className="mb-4 font-mono text-xs uppercase tracking-widest text-fg-muted">
							{[item.sourceName, formatDate(item.publishedAt)]
								.filter(Boolean)
								.join(" · ")}
						</p>
						{item.summary ? (
							<p className="text-base leading-relaxed text-fg-secondary">
								{item.summary}
							</p>
						) : null}
						{item.attribution ? (
							<p className="mt-3 font-mono text-xs text-fg-muted">
								{item.attribution}
							</p>
						) : null}
					</article>
				))}
			</div>

			<nav className="mt-12 flex flex-col gap-4 sm:flex-row sm:justify-between">
				{issue.older ? (
					<Link
						to="/news/$slug"
						params={{ slug: issue.older.slug }}
						className="group flex-1 border-2 border-stroke-subtle p-4 transition-colors hover:border-accent-lime"
					>
						<span className="font-mono text-xs uppercase tracking-widest text-fg-muted">
							<ArrowLeft className="mr-2 inline size-3" />
							Issue #{issue.older.number}
						</span>
						<span className="mt-2 block font-bold text-fg-primary group-hover:text-accent-lime">
							{issue.older.subject}
						</span>
					</Link>
				) : (
					<div className="flex-1" />
				)}
				{issue.newer ? (
					<Link
						to="/news/$slug"
						params={{ slug: issue.newer.slug }}
						className="group flex-1 border-2 border-stroke-subtle p-4 text-right transition-colors hover:border-accent-lime"
					>
						<span className="font-mono text-xs uppercase tracking-widest text-fg-muted">
							Issue #{issue.newer.number}
							<ArrowRight className="ml-2 inline size-3" />
						</span>
						<span className="mt-2 block font-bold text-fg-primary group-hover:text-accent-lime">
							{issue.newer.subject}
						</span>
					</Link>
				) : (
					<div className="flex-1" />
				)}
			</nav>

			<section className="mt-16 border-2 border-stroke-strong bg-bg-panel p-6 sm:p-8">
				<p className="mb-4 font-mono text-sm text-accent-lime">
					{"// GET THE NEXT ONE"}
				</p>
				<SubscribeForm source={`issue-${issue.number}`} />
			</section>
		</div>
	);
}
