type LatestArticle = {
	licenseClass: Exclude<KnowledgeLicenseClass, "x">;
	headline: string;
	url: string;
	publishedAt: number;
	topicName: string;
	topicSlug: string;
};

type LatestX = {
	licenseClass: "x";
	summary: string;
	topicName: string;
	topicSlug: string;
};

type KnowledgeLicenseClass =
	| "cc-by"
	| "permissive-release-notes"
	| "unlicensed-release-notes"
	| "article"
	| "hn"
	| "x";

export type KnowledgeBaseIndexData = {
	latest: Array<LatestArticle | LatestX>;
	topics: Array<{
		name: string;
		slug: string;
		itemCount: number;
		headlines: string[];
	}>;
};

type KnowledgeEntry =
	| {
			licenseClass: Exclude<KnowledgeLicenseClass, "x">;
			headline: string;
			url: string;
			sourceName: string;
			publishedAt: number;
			summary: string;
			sourceText?: string;
			attribution?: string;
			points?: number;
			comments?: number;
			discussionUrl?: string;
	  }
	| {
			licenseClass: "x";
			summary: string;
			embedHtml: string;
	  };

export type KnowledgeTopicPageData = {
	topic: { name: string; slug: string };
	itemCount: number;
	thinReleases: Array<{
		licenseClass: "permissive-release-notes" | "unlicensed-release-notes";
		headline: string;
		url: string;
		sourceName: string;
	}>;
	entries: KnowledgeEntry[];
};

function formatDate(ms: number): string {
	return new Date(ms).toLocaleDateString("en-US", {
		month: "short",
		day: "numeric",
		year: "numeric",
	});
}

export function KnowledgeBaseIndex({ data }: { data: KnowledgeBaseIndexData }) {
	return (
		<section aria-label="Knowledge base" className="mb-20">
			<div className="mb-4 flex items-baseline justify-between border-b-2 border-stroke-strong pb-2">
				<h2 className="font-mono text-sm uppercase tracking-widest text-accent-lime">
					Latest
				</h2>
				<span className="font-mono text-xs text-fg-muted">
					{data.latest.length}
				</span>
			</div>
			<div className="mb-12 border-t border-stroke-subtle">
				{data.latest.map((item, index) => {
					const isX = item.licenseClass === "x";
					return (
						<a
							key={`${item.topicSlug}-${index}`}
							href={isX ? `/news/topics/${item.topicSlug}` : item.url}
							target={isX ? undefined : "_blank"}
							rel={isX ? undefined : "noopener noreferrer"}
							data-testid="latest-item"
							className="group flex flex-col gap-1 border-b border-stroke-subtle py-4 transition-colors hover:border-accent-lime sm:flex-row sm:items-baseline sm:justify-between sm:gap-6"
						>
							<span className="font-semibold text-fg-primary group-hover:text-accent-lime">
								{isX ? item.summary : item.headline}
							</span>
							<span className="shrink-0 font-mono text-xs text-fg-muted">
								{item.topicName}
								{isX ? "" : ` · ${formatDate(item.publishedAt)}`}
							</span>
						</a>
					);
				})}
			</div>

			<div className="mb-4 flex items-baseline justify-between border-b-2 border-stroke-strong pb-2">
				<h2 className="font-mono text-sm uppercase tracking-widest text-accent-lime">
					Topics
				</h2>
				<span className="font-mono text-xs text-fg-muted">
					{data.topics.length}
				</span>
			</div>
			<div className="grid gap-px border border-stroke-subtle bg-stroke-subtle sm:grid-cols-2">
				{data.topics.map((topic) => (
					<a
						key={topic.slug}
						href={`/news/topics/${topic.slug}`}
						data-testid="topic-card"
						className="group bg-bg-panel p-5 transition-colors hover:bg-bg-panel-muted"
					>
						<div className="mb-4 flex items-baseline justify-between gap-4 font-mono text-sm uppercase tracking-wider text-accent-lime">
							<span>{topic.name}</span>
							<span className="text-xs text-fg-muted">{topic.itemCount}</span>
						</div>
						<div className="space-y-2 text-sm text-fg-secondary">
							{topic.headlines.length ? (
								topic.headlines.map((headline) => (
									<p key={headline}>{headline}</p>
								))
							) : (
								<p>Nothing published yet.</p>
							)}
						</div>
					</a>
				))}
			</div>
		</section>
	);
}

function KnowledgeEntryView({ item }: { item: KnowledgeEntry }) {
	if (item.licenseClass === "x") {
		return (
			<article className="border-b border-stroke-subtle py-7">
				<p className="mb-4 leading-relaxed text-fg-secondary">{item.summary}</p>
				<div
					className="border border-stroke-strong bg-bg-panel p-4 text-fg-secondary [&_a]:text-accent-lime [&_blockquote]:m-0 [&_p]:mb-2"
					// Convex returns markup after the X tag and attribute allowlist.
					// biome-ignore lint/security/noDangerouslySetInnerHtml: The server strips active markup and returns an allow-listed static embed.
					dangerouslySetInnerHTML={{ __html: item.embedHtml }}
				/>
			</article>
		);
	}

	return (
		<article className="border-b border-stroke-subtle py-7">
			<h2 className="mb-2 text-xl font-bold leading-tight tracking-tight text-fg-primary">
				<a
					href={item.url}
					target="_blank"
					rel="noopener noreferrer"
					className="hover:text-accent-lime"
				>
					{item.headline}
				</a>
			</h2>
			<p className="mb-4 flex flex-wrap gap-x-3 font-mono text-xs uppercase tracking-wider text-fg-muted">
				<span>{item.sourceName}</span>
				<span>{formatDate(item.publishedAt)}</span>
				{item.points !== undefined ? <span>{item.points} points</span> : null}
			</p>
			<p className="leading-relaxed text-fg-secondary">{item.summary}</p>
			{item.sourceText ? (
				<div className="mt-5 border-l-2 border-stroke-strong pl-4 text-sm leading-relaxed text-fg-secondary">
					<p className="whitespace-pre-line">{item.sourceText}</p>
					{item.attribution ? (
						<p className="mt-3 font-mono text-xs text-fg-muted">
							{item.attribution}
						</p>
					) : null}
				</div>
			) : null}
			<div className="mt-5 flex flex-wrap gap-4 font-mono text-xs text-accent-lime">
				<a href={item.url} target="_blank" rel="noopener noreferrer">
					Read source
				</a>
				{item.discussionUrl ? (
					<a
						href={item.discussionUrl}
						target="_blank"
						rel="noopener noreferrer"
					>
						{item.comments ?? 0} comments
					</a>
				) : null}
			</div>
		</article>
	);
}

export function KnowledgeTopicPage({ data }: { data: KnowledgeTopicPageData }) {
	return (
		<div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 sm:py-24">
			<a
				href="/news"
				className="mb-10 inline-block font-mono text-xs uppercase tracking-widest text-fg-muted hover:text-accent-lime"
			>
				← All topics
			</a>
			<header className="border-b-2 border-stroke-strong pb-6">
				<p className="mb-4 font-mono text-sm uppercase tracking-widest text-accent-lime">
					{"// KNOWLEDGE_BASE"}
				</p>
				<div className="flex items-end justify-between gap-6">
					<h1 className="text-4xl font-black uppercase tracking-tighter text-fg-primary sm:text-6xl">
						{data.topic.name}
					</h1>
					<span className="font-mono text-sm text-fg-muted">
						{data.itemCount}
					</span>
				</div>
			</header>

			{data.thinReleases.length ? (
				<div
					data-testid="release-strip"
					className="my-6 border border-stroke-subtle bg-bg-panel p-4"
				>
					<p className="mb-3 font-mono text-xs uppercase tracking-widest text-fg-muted">
						Releases
					</p>
					<div className="flex flex-wrap gap-x-3 gap-y-2 text-sm">
						{data.thinReleases.map((release) => (
							<a
								key={release.url}
								href={release.url}
								target="_blank"
								rel="noopener noreferrer"
								className="text-accent-lime"
							>
								{release.headline}
							</a>
						))}
					</div>
				</div>
			) : null}

			<div>
				{data.entries.map((item, index) => (
					<KnowledgeEntryView
						key={item.licenseClass === "x" ? `x-${index}` : item.url}
						item={item}
					/>
				))}
			</div>
		</div>
	);
}
