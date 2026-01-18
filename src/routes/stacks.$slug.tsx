import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "convex/react";
import {
	ArrowLeft,
	CheckCircle,
	ExternalLink,
	Lock,
} from "lucide-react";
import { categoryConfig } from "@/config/categoryConfig";
import { cn } from "@/lib/utils";
import { api } from "../../convex/_generated/api";
import { Button } from "../components/ui/button";

export const Route = createFileRoute("/stacks/$slug")({
	ssr: false,
	component: StackDetailsPage,
});

function StackDetailsPage() {
	const { slug } = Route.useParams();
	const stack = useQuery(api.stacks.getBySlug, { slug });

	if (stack === undefined) {
		return (
			<div className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800 flex items-center justify-center">
				<div className="text-gray-400">Loading stack...</div>
			</div>
		);
	}

	if (stack === null) {
		return (
			<div className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800 flex items-center justify-center">
				<div className="text-center">
					<h1 className="text-2xl font-bold text-white mb-4">
						Stack not found
					</h1>
					<Link to="/" className="text-cyan-400 hover:text-cyan-300">
						← Back to home
					</Link>
				</div>
			</div>
		);
	}

	const xPage = stack.creator.personalPages.find((p) => p.name === "X");
	const projectPage = stack.creator.projectPages[0];

	return (
		<div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900">
			{/* Back link */}
			<div className="max-w-4xl mx-auto px-6 pt-6">
				<Link
					to="/"
					className="inline-flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
				>
					<ArrowLeft className="h-4 w-4" />
					Back to all stacks
				</Link>
			</div>

			{/* Header */}
			<header className="max-w-4xl mx-auto px-6 py-8">
				<div className="flex items-start gap-6">
					{stack.creator.avatarUrl ? (
						<img
							src={stack.creator.avatarUrl}
							alt={stack.creator.name}
							className="h-20 w-20 rounded-full object-cover border-4 border-cyan-500/30"
						/>
					) : (
						<div className="h-20 w-20 rounded-full bg-gradient-to-br from-cyan-500 to-blue-500 flex items-center justify-center text-white text-2xl font-bold">
							{stack.creator.name.charAt(0)}
						</div>
					)}

					<div className="flex-1">
						<h1 className="text-3xl font-bold text-white mb-2">
							{stack.title}
						</h1>
						<div className="flex items-center gap-4 mb-3">
							<div className="flex items-center gap-2">
								{stack.creator.verified && (
									<CheckCircle className="h-4 w-4 text-cyan-400" />
								)}
								<span className="text-gray-300">{stack.creator.name}</span>
								{xPage && stack.creator.xHandle && (
									<a
										href={xPage.url}
										target="_blank"
										rel="noopener noreferrer"
										className="text-cyan-400 hover:text-cyan-300"
									>
										@{stack.creator.xHandle}
									</a>
								)}
							</div>
							{projectPage && (
								<a
									href={projectPage.url}
									target="_blank"
									rel="noopener noreferrer"
									className="inline-flex items-center gap-1 text-gray-400 hover:text-white transition-colors"
								>
									{projectPage.name}
									<ExternalLink className="h-3 w-3" />
								</a>
							)}
						</div>
						{stack.creator.bio && (
							<p className="text-gray-400 text-sm">{stack.creator.bio}</p>
						)}
					</div>

					<div className="text-right">
						<div className="flex items-baseline gap-1">
							<span className="text-4xl font-bold text-white">
								${stack.fixedTotal?.amount ?? 0}
							</span>
							<span className="text-gray-400">/mo</span>
						</div>
						{stack.hasUsageComponent && (
							<span className="text-xs bg-amber-500/20 text-amber-400 px-2 py-1 rounded-full">
								+ usage
							</span>
						)}
						{stack.usageTotalNotes && (
							<p className="text-xs text-gray-500 mt-1">
								{stack.usageTotalNotes}
							</p>
						)}
					</div>
				</div>
			</header>

			{/* Summary */}
			<section className="max-w-4xl mx-auto px-6 pb-8">
				<p className="text-gray-300 text-lg leading-relaxed">{stack.summary}</p>
			</section>

			{/* Products */}
			<section className="max-w-4xl mx-auto px-6 py-8 border-t border-gray-800">
				<h2 className="text-xl font-bold text-white mb-6">
					Products in this Stack
				</h2>
				<div className="grid gap-4">
					{stack.products.map((product) => {
						const config =
							categoryConfig[product.category as keyof typeof categoryConfig];
						const Icon = config?.icon;

						return (
							<div
								key={product._id}
								className="bg-slate-800/50 rounded-lg p-4 border border-gray-700 hover:border-gray-600 transition-colors"
							>
								<div className="flex items-center justify-between">
									<div className="flex items-center gap-3">
										{product.iconUrl ? (
											<img
												src={product.iconUrl}
												alt={product.name}
												className="h-10 w-10 rounded-lg object-contain bg-white p-1"
											/>
										) : Icon ? (
											<div className="h-10 w-10 rounded-lg bg-gray-700 flex items-center justify-center">
												<Icon className="h-5 w-5 text-gray-400" />
											</div>
										) : null}
										<div>
											<div className="flex items-center gap-2">
												<span className="font-semibold text-white">
													{product.name}
												</span>
												<span
													className={cn(
														"text-xs px-2 py-0.5 rounded-full",
														config?.bgColor || "bg-gray-700",
														config?.textColor || "text-gray-300",
													)}
												>
													{config?.label || product.category}
												</span>
												{product.priceKind === "discounted" && (
													<span className="text-xs bg-green-500/20 text-green-400 px-2 py-0.5 rounded-full">
														Discounted
													</span>
												)}
												{product.priceKind === "bundle" && (
													<span className="text-xs bg-purple-500/20 text-purple-400 px-2 py-0.5 rounded-full">
														Bundle
													</span>
												)}
											</div>
											<p className="text-sm text-gray-400">
												{product.primaryUsageLabel}
											</p>
											{product.notes && (
												<p className="text-xs text-gray-500 mt-1">
													{product.notes}
												</p>
											)}
										</div>
									</div>
									<div className="text-right">
										<div className="text-xl font-bold text-white">
											{product.price.fixed
												? `$${product.price.fixed.amount}`
												: "Usage"}
										</div>
										{product.price.fixed && (
											<span className="text-xs text-gray-500">
												/
												{product.price.fixed.period === "one_time"
													? "once"
													: "mo"}
											</span>
										)}
										{product.websiteUrl && (
											<a
												href={product.websiteUrl}
												target="_blank"
												rel="noopener noreferrer"
												className="block text-xs text-cyan-400 hover:text-cyan-300 mt-1"
											>
												Visit site →
											</a>
										)}
									</div>
								</div>
							</div>
						);
					})}
				</div>
			</section>

			{/* Gated Content */}
			<section className="max-w-4xl mx-auto px-6 py-8 border-t border-gray-800">
				<div className="bg-slate-800/50 rounded-xl p-8 border border-gray-700 text-center">
					<Lock className="h-12 w-12 text-gray-500 mx-auto mb-4" />
					<h3 className="text-xl font-bold text-white mb-2">
						Unlock Full Prompts & Automation Files
					</h3>
					<p className="text-gray-400 mb-6 max-w-md mx-auto">
						Get access to the exact system prompts, configuration files, and
						automation scripts used in this stack.
					</p>
					<Button
						onClick={() => {
							const emailInput = document.querySelector(
								'input[type="email"]',
							) as HTMLInputElement;
							if (emailInput) {
								emailInput.scrollIntoView({
									behavior: "smooth",
									block: "center",
								});
								emailInput.focus();
							}
						}}
						className="bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 text-white px-8 py-3"
					>
						Join Waitlist to Unlock
					</Button>
				</div>
			</section>

			{/* Footer CTA */}
			<section className="max-w-4xl mx-auto px-6 py-12 text-center">
				<Button
					onClick={() => {
						const emailInput = document.querySelector(
							'input[type="email"]',
						) as HTMLInputElement;
						if (emailInput) {
							emailInput.scrollIntoView({
								behavior: "smooth",
								block: "center",
							});
							emailInput.focus();
						}
					}}
					size="lg"
					className="bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 text-white px-12 py-4 text-lg"
				>
					Steal This Stack
				</Button>
			</section>
		</div>
	);
}
