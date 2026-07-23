import { convexQuery } from "@convex-dev/react-query";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
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
import { StackHeader } from "@/features/stack-view/StackHeader";
import { GuideSection, ToolsSection } from "@/features/stack-view/sections";
import { formatPricingSummary } from "@/lib/pricing";
import { SITE_URL, seoMeta } from "@/lib/seo";
import { api } from "../../convex/_generated/api";

type ViewTool = {
	_id: string;
	name: string;
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
		const stack = await context.queryClient.ensureQueryData(
			convexQuery(api.stacks.getBySlug, { slug: params.slug }),
		);
		return { stack };
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
	const stack = useQuery(api.stacks.getBySlug, { slug });
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

	const scrollToBundle = (bundleSlug: string) => {
		setBundlesOpen(true);
		setHighlightedBundle(bundleSlug);
		setTimeout(() => setHighlightedBundle(null), 1500);
	};

	// All three tiles scroll to the same Components section (id="section-tools").
	// The `target` arg only determines which disclosure (models/bundles) to auto-open.
	const handleTileActivate = (target: "tools" | "models" | "bundles") => {
		setHighlightedSection("tools");
		setTimeout(() => setHighlightedSection(null), 1500);
		if (target === "models") setModelsOpen(true);
		if (target === "bundles") setBundlesOpen(true);
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
						onTileActivate={handleTileActivate}
					/>
				</div>
				<div className="bg-bg-canvas">
					{/* Journey: Projects (01) → Tools (02, with Models/Bundles disclosures) → Workflow (03). */}
					<ProjectsSection
						index={1}
						stackId={stack._id}
						isOwner={upvoteStatus?.isOwner ?? false}
					/>

					{/* biome-ignore lint/correctness/useUniqueElementIds: stable single-instance scroll anchor for the hero tile jump target */}
					<ToolsSection
						index={2}
						id="section-tools"
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
					<GuideSection
						index={3}
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
