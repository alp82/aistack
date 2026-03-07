import { Link } from "@tanstack/react-router";
import { ArrowRight, ExternalLink, Plus, Zap } from "lucide-react";

import { PriceDisplay } from "@/components/PriceDisplay";
import { categoryConfig } from "@/config/categoryConfig";
import { formatPriceDisplay } from "@/lib/pricing";
import { cn } from "@/lib/utils";

export const STACK_CARD_WIDTH = 792;
export const STACK_CARD_HEIGHT = 416;

const DISPLAY_COUNT = 3;

interface Creator {
	_id: string;
	name: string;
	xHandle?: string;
	avatarUrl?: string;
	personalPages: Array<{ name: string; url: string }>;
	projectPages: Array<{ name: string; url: string }>;
}

interface Tool {
	_id: string;
	name: string;
	slug: string;
	categories: string[];
	iconUrl?: string;
	price: {
		pricingType: "fixed" | "usage" | "mixed";
		fixed?: {
			currency: string;
			amount: number;
			period: "month" | "year" | "one_time";
		};
	};
	primaryUsageLabel: string;
}

interface WorkflowStep {
	tool: string;
	action: string;
}

interface StackCardProps {
	slug: string;
	name: string;
	creator: Creator;
	oneLiner: string;
	teamSize?: number;
	tools: Tool[];
	fixedTotal?: {
		currency: string;
		amount: number;
		period: "month" | "year" | "one_time";
	};
	hasUsageComponent: boolean;
	usageTotalNotes?: string;
	className?: string;
	workflowHighlight?: {
		title: string;
		steps: WorkflowStep[];
		benefit: string;
	};
	compact?: boolean;
	onStealClick?: () => void;
}

export function StackCard({
	slug,
	name,
	creator,
	oneLiner,
	teamSize,
	tools,
	fixedTotal,
	hasUsageComponent,
	className,
	workflowHighlight,
}: StackCardProps) {
	const xPage = creator.personalPages.find((p) => p.name === "X");
	const projectPage = creator.projectPages[0];
	const displayTools = tools.slice(0, DISPLAY_COUNT);
	const remainingTools = tools.length - DISPLAY_COUNT;

	return (
		<article
			className={cn(
				`w-full max-w-[${STACK_CARD_WIDTH}px] min-h-[${STACK_CARD_HEIGHT}px] border-2 border-stroke-subtle bg-bg-panel-elevated shadow-terminal-md`,
				className,
			)}
		>
			<div className="border-b border-stroke-subtle bg-gradient-to-r from-bg-panel to-bg-panel-muted/55 p-5">
				<div className="flex items-start justify-between gap-4">
					<div className="flex min-w-0 items-center gap-3">
						{creator.avatarUrl ? (
							<img
								src={creator.avatarUrl}
								alt={creator.name}
								className="h-12 w-12 rounded-full border border-stroke-subtle object-cover"
							/>
						) : (
							<div className="flex h-12 w-12 items-center justify-center rounded-full border border-stroke-subtle bg-bg-panel-muted text-sm font-semibold text-fg-secondary">
								{creator.name.charAt(0).toUpperCase()}
							</div>
						)}
						<div className="min-w-0">
							<h3 className="truncate text-xl font-semibold text-fg-primary">
								{name}
							</h3>
							<div className="mt-0.5 flex items-center gap-2 text-xs text-fg-muted">
								{xPage && creator.xHandle ? (
									<a
										href={xPage.url}
										target="_blank"
										rel="noopener"
										className="hover:text-fg-primary"
									>
										@{creator.xHandle}
									</a>
								) : null}
								{projectPage && (
									<a
										href={projectPage.url}
										target="_blank"
										rel="noopener"
										className="inline-flex items-center gap-1 hover:text-fg-primary"
									>
										{projectPage.name}
										<ExternalLink className="h-3 w-3" />
									</a>
								)}
							</div>
						</div>
					</div>
					<div className="text-right">
						<PriceDisplay
							amount={fixedTotal?.amount ?? 0}
							period={fixedTotal?.period ?? "month"}
							rounding="floor"
							size="lg"
							className="text-fg-primary"
						/>
						<div className="mt-1 flex items-center justify-end gap-2">
							{hasUsageComponent && (
								<span className="inline-flex border border-accent-lime/45 bg-accent-lime-soft/12 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-accent-lime">
									+ usage
								</span>
							)}
							<span className="rounded-full bg-bg-panel px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-fg-secondary">
								{teamSize ? `Team ${teamSize}` : "Solo"}
							</span>
						</div>
					</div>
				</div>
			</div>

			<div className="space-y-4 border-b border-stroke-subtle p-5">
				<p className="line-clamp-3 border-l-2 border-stroke-subtle pl-3 text-sm leading-relaxed text-fg-secondary">
					{oneLiner}
				</p>
				{workflowHighlight && (
					<div className="border border-accent-lime/40 bg-accent-lime-soft/12 p-3">
						<p className="mb-1 inline-flex items-center gap-1 text-xs font-semibold uppercase tracking-wide text-accent-lime">
							<Zap className="h-3.5 w-3.5" />
							{workflowHighlight.title}
						</p>
						<p className="text-xs text-fg-secondary">
							{workflowHighlight.steps.map((step) => step.tool).join(" -> ")}
						</p>
						<p className="mt-1 text-xs font-medium text-green-600">
							{workflowHighlight.benefit}
						</p>
					</div>
				)}
			</div>

			<div className="flex items-center justify-between gap-4 bg-bg-panel px-5 py-3">
				<div className="space-y-1">
					{displayTools.map((tool) => {
						const toolPriceDisplay = tool.price.fixed
							? formatPriceDisplay(
									tool.price.fixed.amount,
									tool.price.fixed.period,
								)
							: null;

						return (
							<div
								key={tool._id}
								className="flex items-center gap-2 text-sm text-fg-secondary"
							>
								<span className="font-medium text-fg-primary">{tool.name}</span>
								{tool.categories.map((cat) => {
									const catConfig =
										categoryConfig[cat as keyof typeof categoryConfig];
									const CatIcon = catConfig?.icon || Plus;

									return (
										<span
											key={cat}
											className={cn(
												"inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide",
												catConfig?.bgColor || "bg-bg-panel-muted",
												catConfig?.textColor || "text-fg-muted",
											)}
										>
											<CatIcon className="h-3 w-3" />
											{catConfig?.label || cat}
										</span>
									);
								})}
								<span className="font-semibold text-fg-primary">
									{toolPriceDisplay
										? `$${toolPriceDisplay.amountText}${toolPriceDisplay.suffix}`
										: "Usage"}
								</span>
							</div>
						);
					})}
					{remainingTools > 0 && (
						<p className="text-xs text-fg-muted">
							+{remainingTools} more tools
						</p>
					)}
				</div>
				<Link
					to="/stacks/$slug"
					params={{ slug }}
					className="inline-flex items-center gap-1 text-sm font-semibold text-accent-lime"
				>
					View full stack
					<ArrowRight className="h-3.5 w-3.5" />
				</Link>
			</div>
		</article>
	);
}
