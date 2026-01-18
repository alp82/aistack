import { ArrowRight, ExternalLink, Plus, Zap } from "lucide-react";
import { categoryConfig, type ProductCategory } from "@/config/categoryConfig";
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

interface Product {
	_id: string;
	name: string;
	slug: string;
	category: string;
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
	product: string;
	action: string;
}

interface StackCardProps {
	slug: string;
	creator: Creator;
	title: string;
	summary: string;
	teamSize?: number;
	products: Product[];
	fixedTotal?: {
		currency: string;
		amount: number;
		period: "month" | "year" | "one_time";
	};
	hasUsageComponent: boolean;
	usageTotalNotes?: string;
	stackLink?: string;
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
	slug, // eslint-disable-line @typescript-eslint/no-unused-vars
	creator,
	title, // eslint-disable-line @typescript-eslint/no-unused-vars
	summary,
	teamSize,
	products,
	fixedTotal,
	hasUsageComponent,
	usageTotalNotes, // eslint-disable-line @typescript-eslint/no-unused-vars
	stackLink,
	className,
	workflowHighlight,
	compact, // eslint-disable-line @typescript-eslint/no-unused-vars
	onStealClick, // eslint-disable-line @typescript-eslint/no-unused-vars
}: StackCardProps) {
	const xPage = creator.personalPages.find((p) => p.name === "X");
	const projectPage = creator.projectPages[0];

	const displayProducts = products.slice(0, DISPLAY_COUNT);
	const remainingProducts = products.length - DISPLAY_COUNT;

	return (
		<div
			className={cn(
				`w-full max-w-[${STACK_CARD_WIDTH}px] h-[${STACK_CARD_HEIGHT}px] rounded-lg border-8 bg-gray-50 p-6 shadow-sm transition-all duration-300 sharing-highlight`,
				className,
			)}
		>
			<div className="flex flex-col justify-between gap-6 h-full">
				{/* Top Section: Avatar, Stack Name, and Price */}
				<div className="flex justify-between gap-6">
					{/* Avatar and stack name */}
					<div className="flex flex-col md:flex-row items-center gap-3 w-full">
						<div className="flex items-center gap-4">
							{creator.avatarUrl ? (
								<img
								src={creator.avatarUrl}
								alt={creator.name}
								className="h-12 w-12 md:h-16 md:w-16 rounded-full object-cover"
								/>
							) : (
								<div className="flex h-12 w-12 md:h-16 md:w-16 items-center justify-center rounded-full bg-gray-300">
									<span className="text-sm md:text-base font-medium text-gray-600">
										{creator.name.charAt(0).toUpperCase()}
									</span>
								</div>
							)}
							<h3 className="md:hidden text-xl md:text-2xl font-bold text-gray-900">
								{creator.name}
							</h3>
						</div>
						<div className="flex-1 flex-col">
							<h3 className="hidden md:block text-xl md:text-2xl font-bold text-gray-900">
								{creator.name}
							</h3>
							<span className="flex items-center gap-2">
								{xPage && creator.xHandle ? (
								<a
									href={xPage.url}
									target="_blank"
									rel="noopener"
									className="text-sm text-cyan-600 hover:text-cyan-700 transition-colors"
								>
									@{creator.xHandle}
								</a>
								) : creator.xHandle ? (
								<span className="text-sm text-gray-500">@{creator.xHandle}</span>
								) : null}
								{(xPage && creator.xHandle) && projectPage ? <span>•</span> : null}
								{projectPage && (
								<a
									href={projectPage.url}
									target="_blank"
									rel="noopener"
									className="inline-flex items-center gap-1 text-sm text-gray-600 hover:text-gray-900 transition-colors"
								>
									<span className="font-medium">{projectPage.name}</span>
									<ExternalLink className="h-3 w-3" />
								</a>
								)}
							</span>
						</div>

						{/* Price */}
						<div className="flex flex-col items-end gap-1">
							{/* Hero Metric: Total Price */}
							<div className="flex flex-col items-center gap-1">
								<div className="flex items-baseline gap-1 cost-highlight border-2 border-transparent rounded px-1 transition-all duration-300">
									<span>
										<span className="font-bold text-gray-900 text-3xl">
											${fixedTotal?.amount ?? 0}
										</span>
										<span className="text-sm text-gray-500">/mo</span>
										{hasUsageComponent && (
											<span className="ml-1 text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">
												+ usage
											</span>
										)}
									</span>
								</div>

								{/* Team Size Badge */}
								<span className={cn(
									"ml-2 text-xs px-2 py-0.5 rounded-full font-medium",
									teamSize
										? "bg-blue-100 text-blue-700" 
										: "bg-yellow-100 text-yellow-700"
								)}>
									{teamSize ? "Team" : "Solo"}
								</span>
							</div>
						</div>
					</div>
				</div>

				{/* Summary Text */}
				<div className="line-clamp-2 md:line-clamp-3 border-l-2 border-gray-300 pl-2 text-sm md:text-base text-gray-600 leading-relaxed context-highlight transition-all duration-300">
					{summary}
				</div>

				<div className="flex flex-col md:flex-row gap-4">
					{/* Workflow Highlight */}
					{workflowHighlight && (
						<div className="flex flex-col bg-gradient-to-r from-cyan-50 to-sky-100 rounded-lg p-3 border border-sky-300 workflow-highlight transition-all duration-300">
							<div className="flex items-center gap-2 mb-1 md:mb-3">
								<Zap className="h-4 w-4 text-cyan-600" />
								<span className="text-sm font-semibold text-cyan-900">
									{workflowHighlight.title}
								</span>
							</div>
							<div className="flex items-center gap-1 text-xs text-cyan-800">
								{workflowHighlight.steps.map((step, index) => (
									<div key={index} className="flex items-center gap-1">
										<span className="font-medium">{step.product}</span>
										{index < workflowHighlight.steps.length - 1 && (
											<ArrowRight className="h-3 w-3" />
										)}
									</div>
								))}
							</div>
							<div className="flex-1 mb-3" />
							<div className="text-sm text-green-700 font-medium">
								✓ {workflowHighlight.benefit}
							</div>
						</div>
					)}

					{/* Bottom Section: Products List */}
					<div className="flex-1 flex flex-col justify-center">
						<div className="space-y-2">
							{displayProducts.map((product) => {
								const config =
									categoryConfig[
										product.category as keyof typeof categoryConfig
									];
								const Icon = config?.icon || Plus;

								return (
									<div
										key={product._id}
										className="flex items-center justify-between"
									>
										<div className="flex items-center gap-2 flex-1 min-w-0">
											<span className="text-md md:text-lg font-medium text-gray-900 truncate">
												{product.name}
											</span>
											<span
												className={cn(
													"inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs md:text-sm font-medium flex-shrink-0",
													config?.bgColor || "bg-gray-100",
													config?.textColor || "text-gray-700",
												)}
											>
												<Icon className="h-3 w-3" />
												{config?.label || product.category}
											</span>
										</div>
										<span className="text-md md:text-lg font-bold text-gray-900 ml-2 flex-shrink-0 cost-highlight border-1 border-transparent">
											{product.price.fixed
												? `$${product.price.fixed.amount}`
												: "Usage"}
										</span>
									</div>
								);
							})}

							{/* More products indicator / Expand/Collapse button */}
							{products.length > DISPLAY_COUNT && (
								<span className="flex items-center justify-between w-full text-sm md:text-base text-gray-500 transition-colors mt-2">
									<span>
										+{remainingProducts} more product
										{remainingProducts > 1 ? "s" : ""}
									</span>
								</span>
							)}
						</div>

						{/* View Full Stack Link */}
						{stackLink && (
							<a
								href={stackLink}
								onClick={(e) => e.stopPropagation()}
								className="text-sm md:text-base font-medium text-blue-600 hover:text-blue-700 transition-colors inline-flex items-center gap-1"
							>
								View full stack →
							</a>
						)}
					</div>
				</div>
			</div>
		</div>
	);
}
