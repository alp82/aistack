import { convexQuery } from "@convex-dev/react-query";
import { createFileRoute, notFound } from "@tanstack/react-router";
import { useQuery } from "convex/react";
import {
	KnowledgeTopicPage,
	type KnowledgeTopicPageData,
} from "@/features/news/KnowledgeBase";
import { seoMeta } from "@/lib/seo";
import { api } from "../../convex/_generated/api";

export const Route = createFileRoute("/news/topics/$slug")({
	component: TopicRoute,
	loader: async ({ context, params }) => {
		const topic = await context.queryClient.ensureQueryData(
			convexQuery(api.knowledgeBase.getTopic, { slug: params.slug }),
		);
		if (!topic) throw notFound();
		return { topic };
	},
	head: ({ loaderData }) => ({
		meta: seoMeta({
			title: loaderData?.topic
				? `${loaderData.topic.topic.name} news - AI Stack`
				: "AI Stack knowledge base",
			description: loaderData?.topic
				? `Published AI tooling news about ${loaderData.topic.topic.name}.`
				: "Published AI tooling news, grouped by topic.",
			url: loaderData?.topic
				? `/news/topics/${loaderData.topic.topic.slug}`
				: "/news",
		}),
	}),
});

function TopicRoute() {
	const { slug } = Route.useParams();
	const { topic: loaded } = Route.useLoaderData();
	const topic = useQuery(api.knowledgeBase.getTopic, { slug }) ?? loaded;
	if (!topic) return null;
	return <KnowledgeTopicPage data={topic as KnowledgeTopicPageData} />;
}
