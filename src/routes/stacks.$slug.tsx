import { convexQuery } from "@convex-dev/react-query";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useConvexAuth, useMutation, useQuery } from "convex/react";
import { ArrowRight } from "lucide-react";
import { useEffect, useState } from "react";
import { JsonLd } from "@/components/JsonLd";
import type { ModelItemData } from "@/components/ModelItem";
import { ProjectsSection } from "@/components/ProjectsSection";
import { MeasuredSection } from "@/features/measured/MeasuredSection";
import {
	type BundleLookupData,
	EditorProvider,
	type ModelLookupData,
	type ToolLookupData,
	useEditorContext,
} from "@/features/stack-editor/context/EditorContext";
import { accentClassFor } from "@/features/stack-view/accentPresets";
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
// PROTOTYPE #303 (throwaway): `?variant=A|B|C` swaps sections 01 and 04.
import {
	isVariantKey,
	UsageMergePrototype,
	type VariantKey,
} from "@/features/usage-merge-prototype/UsageMergePrototype";
import { StackViewsLine } from "@/features/view-analytics/StackViewsLine";
import { workflowNavStat } from "@/features/workflow/navStat";
import { WorkflowSection } from "@/features/workflow/WorkflowSection";
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
	// PROTOTYPE #303: all-optional, so no Link is forced to pass `search`.
	validateSearch: (
		search: Record<string, unknown>,
	): { variant?: VariantKey; view?: string } => ({
		...(isVariantKey(search.variant) ? { variant: search.variant } : {}),
		...(typeof search.view === "string" ? { view: search.view } : {}),
	}),
	component: StackDetailsPage,
	loader: async ({ context, params }) => {
		// The workflow reading rides along because it decides the NUMBERING (#217):
		// section 04 exists only when a reading does, and resolving that after
		// hydration would renumber Guide from 04 to 05 under the reader.
		const [stack, workflow] = await Promise.all([
			context.queryClient.ensureQueryData(
				convexQuery(api.stacks.getBySlug, { slug: params.slug }),
			),
			context.queryClient.ensureQueryData(
				convexQuery(api.workflow.getWorkflowByStackSlug, { slug: params.slug }),
			),
		]);
		return { stack, workflow };
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
	const { variant: protoVariant } = Route.useSearch();
	const navigate = useNavigate();
	const { isAuthenticated } = useConvexAuth();
	// Falls back to the loader snapshot (same pattern as the landing page):
	// the live query returns undefined until the Convex WebSocket delivers,
	// and a wedged connection must show the SSR'd stack, not a loading state.
	const { stack: loadedStack, workflow: loadedWorkflow } =
		Route.useLoaderData();
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
	const [modelsOpen, setModelsOpen] = useState(false);
	const [highlightedSection, setHighlightedSection] = useState<"tools" | null>(
		null,
	);
	const [hasHovered, setHasHovered] = useState(false);
	const upvotersData = useQuery(
		api.stacks.getUpvoters,
		hasHovered && stack ? { stackId: stack._id } : "skip",
	);

	// THE NAV RESTATES WHAT THE SECTIONS SHOW (#217), so the page reads the same
	// three queries its sections read, with the same arguments. The Convex client
	// serves both callers from one subscription, and the shared answer is also
	// what keeps the nav's numbering and the sections' numbering identical: the
	// workflow reading decides whether 04 exists at all, and both sides read it
	// here rather than each deciding for itself.
	const measuredSnapshot = useQuery(api.measured.getCurrentByStackSlug, {
		slug,
	});
	const workflowReading =
		useQuery(api.workflow.getWorkflowByStackSlug, { slug }) ?? loadedWorkflow;
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

	// The locked order (#193, spec `docs/specs/workflow-surface.md`): Actual
	// Usage 01, Projects 02, Tools 03, Workflow 04, Guide 05. Two of the five
	// render only when they have content, so the NUMBER is the position among
	// the ones that do. `buildPageSections` assigns it once, and both the nav
	// and the sections take it from there.
	const sections = buildPageSections({
		usage: {
			present: true,
			stat: usageStat(measuredSnapshot?.activity.totalTokens ?? null),
		},
		projects: { present: true, stat: projectsStat(projects?.length ?? 0) },
		tools: {
			present: stack.tools.length > 0,
			stat: toolsStat(stack.tools.length, stack.fixedTotal?.amount ?? 0),
		},
		workflow: {
			present: workflowReading != null,
			stat: workflowNavStat(workflowReading),
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
					{/* Owner-private, under the hero and above the first numbered
					    section (#112). A visitor renders nothing here. */}
					<StackViewsLine
						stackId={stack._id}
						isOwner={upvoteStatus?.isOwner ?? false}
					/>

					{/* The nav block. It sits under the hero and above 01, and past it
					    the same links dock as a fixed rail under the site header. */}
					<StackPageNav
						sections={sections}
						identity={{
							name: stack.name,
							priceText: costText,
							upvotes: upvoteStatus?.count ?? 0,
						}}
					/>

					{/* The journey (#40, reordered by #58, workflow placed by #217):
					    Actual Usage 01 → Projects 02 → Tools 03 → Workflow 04 →
					    Guide 05. What ran now literally comes first. */}
					{protoVariant ? (
						<UsageMergePrototype
							index={1}
							slug={stack.slug}
							variant={protoVariant}
						/>
					) : (
						<MeasuredSection
							index={numberOf("usage") ?? 1}
							slug={stack.slug}
							stackId={stack._id}
							isOwner={upvoteStatus?.isOwner ?? false}
							stackToolSlugs={stack.tools.map((t: ViewTool) => t.slug)}
						/>
					)}

					<ProjectsSection
						index={numberOf("projects") ?? 2}
						id={SECTION_ANCHORS.projects}
						stackId={stack._id}
						isOwner={upvoteStatus?.isOwner ?? false}
					/>

					<ToolsSection
						index={numberOf("tools") ?? 3}
						id={SECTION_ANCHORS.tools}
						highlighted={highlightedSection === "tools"}
						tools={stack.tools}
						models={stack.models}
						bundles={stack.bundles}
						highlightedBundle={highlightedBundle}
						bundlesOpen={bundlesOpen}
						onBundlesOpenChange={setBundlesOpen}
						modelsOpen={modelsOpen}
						onModelsOpenChange={setModelsOpen}
						fixedTotal={stack.fixedTotal}
						onBundleClick={scrollToBundle}
					/>

					{/* Section 04 renders itself away when the stack has no reading, or
					    when the owner never gave `publishWorkflow`. `numberOf` returns
					    null in exactly that case, and the page renders no 04 either. */}
					{!protoVariant && numberOf("workflow") !== null && (
						<WorkflowSection
							index={numberOf("workflow") ?? 4}
							slug={stack.slug}
							stackId={stack._id}
						/>
					)}

					<GuideSection
						index={numberOf("guide") ?? 4}
						id={SECTION_ANCHORS.guide}
						description={stack.description}
						isOwner={upvoteStatus?.isOwner ?? false}
						slug={stack.slug}
					/>

					{/* CTA Section - hide for the owner and for creators who already have a stack */}
					{!upvoteStatus?.isOwner && !me?.hasStack && (
						<section className="bg-accent-lime py-24 px-6 md:px-16 border-t border-accent-lime">
							<div className="mx-auto max-w-3xl text-center">
								<h2 className="text-4xl md:text-6xl font-black tracking-tighter mb-6 text-accent-lime-contrast leading-[0.9] uppercase">
									Share Your Own Stack
								</h2>
								<p className="text-lg md:text-xl text-accent-lime-contrast/80 mb-10 leading-relaxed">
									Help other builders by sharing the tools, costs, and workflows
									you run.
								</p>
								<Link to="/stacks/new">
									<span className="inline-flex items-center gap-3 px-8 py-4 bg-black text-white font-mono font-bold uppercase tracking-widest hover:bg-zinc-800 transition-colors text-base shadow-xl">
										Create Your Stack
										<ArrowRight className="size-5" />
									</span>
								</Link>
							</div>
						</section>
					)}
				</div>
			</div>
		</EditorProvider>
	);
}
