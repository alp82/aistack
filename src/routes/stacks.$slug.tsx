import { convexQuery } from "@convex-dev/react-query";
import {
	createFileRoute,
	Link,
	notFound,
	useNavigate,
} from "@tanstack/react-router";
import { useConvexAuth, useMutation, useQuery } from "convex/react";
import { ArrowRight } from "lucide-react";
import { useEffect, useState } from "react";
import { JsonLd } from "@/components/JsonLd";
import type { ModelItemData } from "@/components/ModelItem";
import { ProjectsSection } from "@/components/ProjectsSection";
import {
	type BundleLookupData,
	EditorProvider,
	type ModelLookupData,
	type ToolLookupData,
	useEditorContext,
} from "@/features/stack-editor/context/EditorContext";
import { accentClassFor } from "@/features/stack-view/accentPresets";
import { heroReadingFrom } from "@/features/stack-view/heroReading";
import { OwnerToolsDrawer } from "@/features/stack-view/OwnerToolsDrawer";
import { StackPageNav } from "@/features/stack-view/PageNav";
import {
	buildPageSections,
	guideStat,
	projectsStat,
	SECTION_ANCHORS,
	sectionIndex,
	toolsStat,
	usageStat,
} from "@/features/stack-view/pageOrder";
import { StackHeader } from "@/features/stack-view/StackHeader";
import { GuideSection, ToolsSection } from "@/features/stack-view/sections";
import { PAGE_RANGE } from "@/features/usage/copy";
import { UsageSection } from "@/features/usage/UsageSection";
import { formatPricingSummary } from "@/lib/pricing";
import { SITE_URL, seoMeta } from "@/lib/seo";
import { useRecordView } from "@/lib/useRecordView";
import { api } from "../../convex/_generated/api";

type ViewTool = {
	_id: string;
	name: string;
	slug: string;
	categories: string[];
	iconUrl?: string;
	price: {
		pricingType: string;
		fixed?: { currency: string; amount: number; period: string };
	};
	primaryUsageLabel: string;
	description?: string;
};

type ViewBundle = {
	_id: string;
	name: string;
	description?: string;
	iconUrl?: string;
	tierName: string;
	price: {
		pricingType: string;
		fixed?: { currency: string; amount: number; period: string };
	};
};

function ViewLookupDataSync({
	tools,
	bundles,
	models,
}: {
	tools: ViewTool[];
	bundles: ViewBundle[];
	models: ModelItemData[];
}) {
	const { setToolLookup, setBundleLookup, setModelLookup } = useEditorContext();

	useEffect(() => {
		const toolMap = new Map<string, ToolLookupData>();
		for (const tool of tools) {
			toolMap.set(tool.name, {
				name: tool.name,
				categories: tool.categories,
				iconUrl: tool.iconUrl,
				price: tool.price.fixed
					? { amount: tool.price.fixed.amount, period: tool.price.fixed.period }
					: undefined,
				tierName: tool.primaryUsageLabel,
				description: tool.description,
			});
		}
		setToolLookup(toolMap);
	}, [tools, setToolLookup]);

	useEffect(() => {
		const bundleMap = new Map<string, BundleLookupData>();
		for (const bundle of bundles) {
			bundleMap.set(bundle.name, {
				name: bundle.name,
				iconUrl: bundle.iconUrl,
				price: bundle.price.fixed
					? {
							amount: bundle.price.fixed.amount,
							period: bundle.price.fixed.period,
						}
					: undefined,
				tierName: bundle.tierName,
				description: bundle.description,
			});
		}
		setBundleLookup(bundleMap);
	}, [bundles, setBundleLookup]);

	useEffect(() => {
		const modelMap = new Map<string, ModelLookupData>();
		for (const model of models) {
			modelMap.set(model.name, {
				name: model.name,
				provider: model.provider,
				iconUrl: model.iconUrl,
				category: model.category,
			});
		}
		setModelLookup(modelMap);
	}, [models, setModelLookup]);

	return null;
}

export const Route = createFileRoute("/stacks/$slug")({
	component: StackDetailsPage,
	loader: async ({ context, params }) => {
		// The two measured reads seed the hero tile, the nav stat and section 01
		// for server rendering: the 30-day all-machines usage fold and the
		// workflow rows.
		const [stack, usage] = await Promise.all([
			context.queryClient.ensureQueryData(
				convexQuery(api.stacks.getBySlug, { slug: params.slug }),
			),
			context.queryClient.ensureQueryData(
				convexQuery(api.measured.getUsageByStackSlug, { slug: params.slug }),
			),
			context.queryClient.ensureQueryData(
				convexQuery(api.workflow.getWorkflowByStackSlug, { slug: params.slug }),
			),
		]);
		if (!stack) throw notFound();
		return { stack, usage };
	},
	head: ({ loaderData }) => {
		if (!loaderData?.stack) {
			return {
				meta: seoMeta({
					title: "AI Stack Details",
					description: "View detailed information about this AI stack.",
					noindex: true,
				}),
			};
		}

		const stack = loaderData.stack;
		const toolCount = stack.tools.length;
		const costText = formatPricingSummary(
			stack.fixedTotal,
			stack.hasUsageComponent,
		);
		const description = `${stack.oneLiner} • ${toolCount} tools • ${costText}`;
		const ogImageUrl = `${SITE_URL}/api/og/stack/${stack.slug}?v=${stack.updatedAt ?? stack._creationTime}`;

		return {
			meta: seoMeta({
				title: `${stack.name} - AI Stack`,
				description,
				url: `/stacks/${stack.slug}`,
				image: ogImageUrl,
				imageWidth: "1200",
				imageHeight: "630",
				keywords: `${stack.name}, AI stack, ${stack.tools.map((t: ViewTool) => t.name).join(", ")}`,
			}),
		};
	},
});

function StackDetailsPage() {
	const { slug } = Route.useParams();
	const navigate = useNavigate();
	const { isAuthenticated } = useConvexAuth();
	// Falls back to the loader snapshot (same pattern as the landing page):
	// the live query returns undefined until the Convex WebSocket delivers,
	// and a wedged connection must show the SSR'd stack, not a loading state.
	const { stack: loadedStack, usage: loadedUsage } = Route.useLoaderData();
	const stack = useQuery(api.stacks.getBySlug, { slug }) ?? loadedStack;
	// Deduped daily visitors (#78). Counted on MOUNT and keyed by document id, so
	// a slug rename keeps the page's history.
	useRecordView("stack", stack?._id);
	const me = useQuery(api.creators.getMe);
	const upvoteStatus = useQuery(
		api.stacks.getUpvoteStatus,
		stack ? { stackId: stack._id } : "skip",
	);
	const reportStatus = useQuery(
		api.stacks.getReportStatus,
		stack ? { stackId: stack._id } : "skip",
	);
	const toggleUpvote = useMutation(api.stacks.toggleUpvote);
	const reportStack = useMutation(api.stacks.reportStack);
	const unreportStack = useMutation(api.stacks.unreportStack);
	const [upvoting, setUpvoting] = useState(false);
	const [reporting, setReporting] = useState(false);
	const [highlightedBundle, setHighlightedBundle] = useState<string | null>(
		null,
	);
	const [bundlesOpen, setBundlesOpen] = useState(false);
	const [highlightedSection, setHighlightedSection] = useState<"tools" | null>(
		null,
	);
	const [hasHovered, setHasHovered] = useState(false);
	const upvotersData = useQuery(
		api.stacks.getUpvoters,
		hasHovered && stack ? { stackId: stack._id } : "skip",
	);

	// THE PAGE READS USAGE ONCE. This is the only subscription to the usage
	// fold, and every surface that prints a measured figure takes it from here:
	// the hero tile, the nav stat, the owner drawer's sync time and section 01.
	// One read is what keeps the figures identical (#217). The window is fixed
	// at PAGE_RANGE, which is the fold the loader snapshot carries, so the
	// snapshot always stands in (#356).
	const liveUsage = useQuery(api.measured.getUsageByStackSlug, {
		slug,
		range: PAGE_RANGE,
	});
	const usage = liveUsage ?? loadedUsage;
	const heroReading = heroReadingFrom(usage, PAGE_RANGE);
	const projects = useQuery(
		api.projects.listByStack,
		stack ? { stackId: stack._id } : "skip",
	);

	const scrollToBundle = (bundleSlug: string) => {
		setBundlesOpen(true);
		setHighlightedBundle(bundleSlug);
		setTimeout(() => setHighlightedBundle(null), 1500);
	};

	// The hero's tool tiles all scroll to the same Tools section
	// (id="section-tools"). Since #40 replaced the count tiles with named tools,
	// the hero no longer opens the Models or Bundles disclosures directly.
	const handleToolsActivate = () => {
		setHighlightedSection("tools");
		setTimeout(() => setHighlightedSection(null), 1500);
	};

	const handleUpvote = async () => {
		if (!stack) return;
		if (!isAuthenticated) {
			navigate({ to: "/signin", search: { redirect: `/stacks/${slug}` } });
			return;
		}
		if (upvoteStatus?.isOwner) {
			return;
		}
		setUpvoting(true);
		try {
			await toggleUpvote({ stackId: stack._id });
		} catch (error) {
			console.error("Failed to toggle upvote:", error);
		} finally {
			setUpvoting(false);
		}
	};

	const handleReport = async () => {
		if (!stack) return;
		if (!isAuthenticated) {
			navigate({ to: "/signin", search: { redirect: `/stacks/${slug}` } });
			return;
		}
		setReporting(true);
		try {
			if (reportStatus?.reported) {
				await unreportStack({ stackId: stack._id });
			} else {
				await reportStack({ stackId: stack._id });
			}
		} catch (error) {
			console.error("Failed to toggle report:", error);
		} finally {
			setReporting(false);
		}
	};

	// Redirect to canonical slug if URL slug prefix is stale/wrong
	useEffect(() => {
		if (stack && stack.slug !== slug) {
			navigate({
				to: "/stacks/$slug",
				params: { slug: stack.slug },
				replace: true,
			});
		}
	}, [stack, slug, navigate]);

	if (stack === undefined) {
		return (
			<div className="flex min-h-screen items-center justify-center bg-bg-canvas">
				<div className="font-mono text-sm text-fg-muted">Loading stack...</div>
			</div>
		);
	}

	if (stack === null) {
		return (
			<div className="flex min-h-screen items-center justify-center bg-bg-canvas">
				<div className="text-center">
					<h1 className="mb-4 text-2xl font-bold text-fg-primary">
						Stack not found
					</h1>
					<Link
						to="/"
						className="font-mono text-sm text-accent-lime hover:text-accent-lime-strong"
					>
						← Back to home
					</Link>
				</div>
			</div>
		);
	}

	const costText = formatPricingSummary(
		stack.fixedTotal,
		stack.hasUsageComponent,
	);

	// The settled order (spec `docs/specs/workflow-surface.md`): Stats 01,
	// Projects 02, Tools 03, Guide 04. Tools renders only when it has
	// content, so the NUMBER is the position among the sections that render.
	// `buildPageSections` assigns it once, and both the nav and the sections
	// take it from there.
	const sections = buildPageSections({
		usage: {
			present: true,
			stat: usageStat(
				usage?.hasDays && usage.current
					? usage.current.totalTokens
					: (usage?.legacy?.tokens ?? null),
			),
		},
		projects: { present: true, stat: projectsStat(projects?.length ?? 0) },
		tools: {
			present: stack.tools.length > 0,
			stat: toolsStat(stack.tools.length, stack.fixedTotal?.amount ?? 0),
		},
		guide: { present: true, stat: guideStat(stack.description) },
	});
	const numberOf = (key: Parameters<typeof sectionIndex>[1]) =>
		sectionIndex(sections, key);

	return (
		<EditorProvider>
			<JsonLd
				data={{
					type: "SoftwareApplication",
					name: stack.name,
					description: `${stack.oneLiner} • ${stack.tools.length} tools • ${costText}`,
					url: `/stacks/${stack.slug}`,
					author: stack.creator?.name,
					...(stack.fixedTotal?.amount > 0 && {
						offers: {
							price: String(stack.fixedTotal.amount),
							priceCurrency: "USD",
						},
					}),
				}}
			/>
			<ViewLookupDataSync
				tools={stack.tools}
				bundles={stack.bundles}
				models={stack.models}
			/>
			<div className={accentClassFor(stack.accentPreset)}>
				<div className="bg-bg-canvas">
					<StackHeader
						stack={stack}
						reading={heroReading}
						range={PAGE_RANGE}
						upvoteStatus={upvoteStatus}
						reportStatus={reportStatus}
						upvotersData={upvotersData}
						upvoting={upvoting}
						reporting={reporting}
						onUpvote={handleUpvote}
						onReport={handleReport}
						onUpvoteHover={() => setHasHovered(true)}
						onToolsActivate={handleToolsActivate}
					/>
				</div>
				<div className="bg-bg-canvas">
					<OwnerToolsDrawer
						stackId={stack._id}
						stackSlug={stack.slug}
						isOwner={upvoteStatus?.isOwner ?? false}
						receivedAt={usage?.receivedAt ?? null}
					/>

					{/* The nav block. It sits under the hero and above 01, and past it
					    the same links dock as a fixed rail under the site header. */}
					<StackPageNav
						sections={sections}
						identity={{
							name: stack.name,
							priceText: costText,
							upvotes: upvoteStatus?.count ?? 0,
							tokenText:
								sections.find((section) => section.key === "usage")?.stat ??
								null,
						}}
					/>

					{/* The journey (#40, reordered by #58, merged by #307): Stats 01,
					    Projects 02, Tools 03, Guide 04. What ran comes first. */}
					<UsageSection
						index={numberOf("usage") ?? 1}
						slug={stack.slug}
						isOwner={upvoteStatus?.isOwner ?? false}
						stackToolSlugs={stack.tools.map((t: ViewTool) => t.slug)}
						range={PAGE_RANGE}
					/>

					<ProjectsSection
						index={numberOf("projects") ?? 2}
						id={SECTION_ANCHORS.projects}
						stackId={stack._id}
						isOwner={upvoteStatus?.isOwner ?? false}
						presentation="cards"
					/>

					<ToolsSection
						index={numberOf("tools") ?? 3}
						id={SECTION_ANCHORS.tools}
						highlighted={highlightedSection === "tools"}
						tools={stack.tools}
						bundles={stack.bundles}
						highlightedBundle={highlightedBundle}
						bundlesOpen={bundlesOpen}
						onBundlesOpenChange={setBundlesOpen}
						fixedTotal={stack.fixedTotal}
						onBundleClick={scrollToBundle}
					/>

					<GuideSection
						index={numberOf("guide") ?? 4}
						id={SECTION_ANCHORS.guide}
						description={stack.description}
						isOwner={upvoteStatus?.isOwner ?? false}
						slug={stack.slug}
					/>

					{/* CTA Section - hide for the owner and for creators who already have a stack */}
					{!upvoteStatus?.isOwner && !me?.hasStack && (
						<section className="border-t border-accent-lime bg-accent-lime px-6 py-6">
							<div className="mx-auto flex max-w-7xl flex-wrap items-center gap-4">
								<h2 className="text-xl font-black uppercase tracking-tight text-accent-lime-contrast md:text-2xl">
									Share your own stack
								</h2>
								<p className="text-sm text-accent-lime-contrast/80">
									Show builders the tools and workflows you run.
								</p>
								<Link
									to="/stacks/new"
									className="ml-auto inline-flex items-center gap-2 bg-black px-4 py-2 font-mono text-xs font-bold uppercase tracking-widest text-white transition-colors hover:bg-zinc-800"
								>
									Create your stack <ArrowRight className="size-4" />
								</Link>
							</div>
						</section>
					)}
				</div>
			</div>
		</EditorProvider>
	);
}
