import { useMutation, useQuery } from "convex/react";
import { Check, Flag, X } from "lucide-react";
import { api } from "../../../convex/_generated/api";

export function AdminQualityTab() {
	const flaggedStacks = useQuery(api.admin.getFlaggedStacks);
	const lowQualityStacks = useQuery(api.admin.getLowQualityStacks);
	const markStackLowQuality = useMutation(api.admin.markStackLowQuality);
	const dismissStackFlags = useMutation(api.admin.dismissStackFlags);
	const unmarkStackLowQuality = useMutation(api.admin.unmarkStackLowQuality);

	return (
		<>
			{/* Flagged Stacks Section */}
			<section className="py-12 sm:py-16">
				<div className="mx-auto max-w-6xl px-4 sm:px-6">
					<div className="mb-8 flex items-center gap-3">
						<Flag className="size-8 text-orange-400" />
						<h1 className="text-2xl font-bold tracking-tight text-fg-primary sm:text-3xl">
							Flagged Stacks
						</h1>
					</div>

					{!flaggedStacks || flaggedStacks.length === 0 ? (
						<div className="border-2 border-dashed border-stroke-subtle px-4 py-12 text-center">
							<p className="font-mono text-sm text-fg-muted">
								No flagged stacks to review
							</p>
						</div>
					) : (
						<div className="space-y-5">
							{flaggedStacks.map((stack) => (
								<div
									key={stack._id}
									className="border-2 border-orange-400/40 bg-bg-panel p-6"
								>
									<div className="flex items-start justify-between gap-4">
										<div>
											<h3 className="font-mono text-lg font-semibold text-fg-primary">
												{stack.name}
											</h3>
											<p className="font-mono text-xs text-fg-muted mt-1">
												{stack.oneLiner}
											</p>
											<p className="font-mono text-xs text-fg-muted mt-1">
												By {stack.creatorName}
											</p>
										</div>
										<div className="flex items-center gap-2 shrink-0">
											<span className="border border-orange-400/50 bg-orange-400/10 px-2 py-1 font-mono text-xs font-bold text-orange-400">
												{stack.flagCount}{" "}
												{stack.flagCount === 1 ? "report" : "reports"}
											</span>
											<a
												href={`/stacks/${stack.slug}`}
												target="_blank"
												rel="noopener noreferrer"
												className="border border-stroke-subtle px-3 py-1.5 font-mono text-xs text-fg-muted hover:border-accent-lime hover:text-accent-lime transition-colors"
											>
												View
											</a>
										</div>
									</div>

									<div className="flex gap-3 mt-4 pt-4 border-t border-stroke-subtle">
										<button
											type="button"
											onClick={() =>
												markStackLowQuality({ stackId: stack._id })
											}
											className="cursor-pointer inline-flex items-center gap-2 border-2 border-orange-500 bg-orange-500 px-4 py-2 font-mono text-xs font-semibold uppercase tracking-wide text-white transition-colors hover:bg-orange-600"
										>
											<Flag className="size-3.5" />
											Mark Low Quality
										</button>
										<button
											type="button"
											onClick={() => dismissStackFlags({ stackId: stack._id })}
											className="cursor-pointer inline-flex items-center gap-2 border-2 border-stroke-strong px-4 py-2 font-mono text-xs font-semibold uppercase tracking-wide text-fg-secondary transition-colors hover:border-accent-lime hover:text-accent-lime"
										>
											<X className="size-3.5" />
											Dismiss Flags
										</button>
									</div>
								</div>
							))}
						</div>
					)}
				</div>
			</section>

			{/* Low Quality Stacks Section */}
			<section className="pb-12 sm:pb-16">
				<div className="mx-auto max-w-6xl px-4 sm:px-6">
					<div className="mb-8 flex items-center gap-3">
						<Flag className="size-8 text-fg-muted" />
						<h2 className="text-2xl font-bold tracking-tight text-fg-primary sm:text-3xl">
							Low Quality Stacks
						</h2>
					</div>

					{!lowQualityStacks || lowQualityStacks.length === 0 ? (
						<div className="border-2 border-dashed border-stroke-subtle px-4 py-12 text-center">
							<p className="font-mono text-sm text-fg-muted">
								No stacks currently marked as low quality
							</p>
						</div>
					) : (
						<div className="space-y-5">
							{lowQualityStacks.map((stack) => (
								<div
									key={stack._id}
									className="border-2 border-stroke-strong bg-bg-panel p-6"
								>
									<div className="flex items-start justify-between gap-4">
										<div>
											<h3 className="font-mono text-lg font-semibold text-fg-primary">
												{stack.name}
											</h3>
											<p className="font-mono text-xs text-fg-muted mt-1">
												{stack.oneLiner}
											</p>
											<p className="font-mono text-xs text-fg-muted mt-1">
												By {stack.creatorName}
											</p>
										</div>
										<div className="flex items-center gap-2 shrink-0">
											{stack.flagCount > 0 && (
												<span className="border border-orange-400/50 bg-orange-400/10 px-2 py-1 font-mono text-xs font-bold text-orange-400">
													{stack.flagCount}{" "}
													{stack.flagCount === 1 ? "report" : "reports"}
												</span>
											)}
											<a
												href={`/stacks/${stack.slug}`}
												target="_blank"
												rel="noopener noreferrer"
												className="border border-stroke-subtle px-3 py-1.5 font-mono text-xs text-fg-muted hover:border-accent-lime hover:text-accent-lime transition-colors"
											>
												View
											</a>
										</div>
									</div>

									<div className="flex gap-3 mt-4 pt-4 border-t border-stroke-subtle">
										<button
											type="button"
											onClick={() =>
												unmarkStackLowQuality({ stackId: stack._id })
											}
											className="cursor-pointer inline-flex items-center gap-2 border-2 border-green-500 bg-green-500 px-4 py-2 font-mono text-xs font-semibold uppercase tracking-wide text-white transition-colors hover:bg-green-600"
										>
											<Check className="size-3.5" />
											Remove Low Quality Flag
										</button>
									</div>
								</div>
							))}
						</div>
					)}
				</div>
			</section>
		</>
	);
}
