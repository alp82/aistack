import { useAction, useMutation, useQuery } from "convex/react";
import { Brain, Check, Download, X } from "lucide-react";
import { useState } from "react";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import { ItemIcon } from "../ItemIcon";

/**
 * The price and model import (#337): run it by hand, approve the pending rows
 * it created, and read what it did. The cron does the same run daily.
 */
export function AdminImportTab() {
	const log = useQuery(api.modelImport.readLog, { limit: 200 });
	const pendingModels = useQuery(api.admin.getPendingModels);
	const runNow = useAction(api.modelImport.runNow);
	const approveModel = useMutation(api.admin.approveModel);
	const rejectModel = useMutation(api.admin.rejectModel);
	const approveAll = useMutation(api.admin.approveAllPendingModels);
	const [running, setRunning] = useState(false);
	const [result, setResult] = useState<string | null>(null);

	const handleRun = async () => {
		setRunning(true);
		setResult(null);
		try {
			const r = await runNow({});
			setResult(
				`${r.source}: ${r.periods} price ${r.periods === 1 ? "change" : "changes"}, ${r.models} new pending ${r.models === 1 ? "row" : "rows"}`,
			);
		} catch (error) {
			setResult(
				`Failed: ${error instanceof Error ? error.message : String(error)}`,
			);
		} finally {
			setRunning(false);
		}
	};

	const handleApprove = async (modelId: Id<"models">) => {
		try {
			await approveModel({ modelId });
		} catch (error) {
			console.error("Failed to approve model:", error);
		}
	};

	const handleReject = async (modelId: Id<"models">) => {
		try {
			await rejectModel({ modelId });
		} catch (error) {
			console.error("Failed to reject model:", error);
		}
	};

	return (
		<div className="py-12 sm:py-16">
			<div className="mx-auto max-w-6xl px-4 sm:px-6">
				<div className="mb-8 flex flex-wrap items-center justify-between gap-4">
					<div>
						<h2 className="font-mono text-xl font-bold uppercase tracking-wide text-fg-primary">
							Price and model import
						</h2>
						<p className="mt-1 font-mono text-xs text-fg-muted">
							models.dev daily at 05:00 UTC, LiteLLM as fallback. A rate change
							is a new dated period; an unknown model is a pending row.
						</p>
					</div>
					<div className="flex items-center gap-3">
						{result && (
							<span className="font-mono text-xs text-fg-secondary">
								{result}
							</span>
						)}
						<button
							type="button"
							onClick={handleRun}
							disabled={running}
							className="inline-flex items-center gap-2 border-2 border-accent-lime bg-accent-lime px-3 py-1.5 font-mono text-xs font-semibold uppercase tracking-wide text-accent-lime-contrast transition-colors hover:bg-accent-lime/90 disabled:opacity-50"
						>
							<Download className="size-3.5" />
							{running ? "Running..." : "Run import now"}
						</button>
					</div>
				</div>

				<section className="mb-12">
					<h3 className="mb-4 font-mono text-sm font-semibold uppercase tracking-wide text-fg-secondary">
						Pending models
						{pendingModels && pendingModels.length > 0 ? (
							<span className="ml-2 inline-flex h-5 min-w-5 items-center justify-center bg-accent-lime px-1 font-mono text-xs font-bold text-bg-canvas">
								{pendingModels.length}
							</span>
						) : null}
						{pendingModels && pendingModels.length > 0 ? (
							<button
								type="button"
								onClick={() => approveAll({}).catch(console.error)}
								className="ml-4 inline-flex items-center gap-1.5 border-2 border-accent-lime px-2 py-0.5 font-mono text-xs font-semibold uppercase tracking-wide text-accent-lime transition-colors hover:bg-accent-lime hover:text-accent-lime-contrast"
							>
								<Check className="size-3.5" />
								Approve all
							</button>
						) : null}
					</h3>
					{!pendingModels || pendingModels.length === 0 ? (
						<div className="border-2 border-dashed border-stroke-subtle px-4 py-8 text-center">
							<p className="font-mono text-sm text-fg-muted">
								No pending models
							</p>
						</div>
					) : (
						<div className="border-2 border-stroke-strong bg-bg-panel">
							{pendingModels.map((model) => (
								<div
									key={model._id}
									className="flex flex-wrap items-center justify-between gap-4 border-b border-stroke-subtle px-4 py-3 last:border-b-0"
								>
									<div className="flex items-center gap-3">
										<ItemIcon
											src={model.iconUrl}
											alt={model.name}
											size="sm"
											fallbackIcon={Brain}
										/>
										<div>
											<div className="font-mono text-sm font-semibold text-fg-primary">
												{model.name}
											</div>
											<div className="font-mono text-xs text-fg-muted">
												{model.slug} · {model.provider}
												{model.aliases && model.aliases.length > 0
													? ` · aliases: ${model.aliases.join(", ")}`
													: ""}
												{model.createdBy === "import" ? " · import" : ""}
											</div>
										</div>
									</div>
									<div className="flex gap-2">
										<button
											type="button"
											onClick={() => handleApprove(model._id)}
											className="inline-flex items-center gap-1.5 border-2 border-accent-lime bg-accent-lime px-3 py-1.5 font-mono text-xs font-semibold uppercase tracking-wide text-accent-lime-contrast transition-colors hover:bg-accent-lime/90"
										>
											<Check className="size-3.5" />
											Approve
										</button>
										<button
											type="button"
											onClick={() => handleReject(model._id)}
											className="inline-flex items-center gap-1.5 border border-stroke-subtle px-3 py-1.5 font-mono text-xs font-semibold uppercase tracking-wide text-fg-secondary transition-colors hover:border-destructive hover:text-destructive"
										>
											<X className="size-3.5" />
											Reject
										</button>
									</div>
								</div>
							))}
						</div>
					)}
				</section>

				<section>
					<h3 className="mb-4 font-mono text-sm font-semibold uppercase tracking-wide text-fg-secondary">
						Import log
					</h3>
					{!log || log.length === 0 ? (
						<div className="border-2 border-dashed border-stroke-subtle px-4 py-8 text-center">
							<p className="font-mono text-sm text-fg-muted">No runs yet</p>
						</div>
					) : (
						<div className="overflow-x-auto border-2 border-stroke-strong bg-bg-panel">
							<table className="w-full font-mono text-xs">
								<tbody>
									{log.map((line) => (
										<tr
											key={line._id}
											className="border-b border-stroke-subtle last:border-b-0"
										>
											<td className="whitespace-nowrap px-4 py-2 text-fg-muted">
												{new Date(line.at)
													.toISOString()
													.replace("T", " ")
													.slice(0, 16)}
											</td>
											<td className="px-2 py-2">
												<span
													className={`inline-block px-1.5 py-0.5 font-semibold uppercase ${
														line.kind === "error"
															? "bg-destructive-fill text-white"
															: line.kind === "run"
																? "bg-bg-canvas text-fg-muted"
																: "bg-accent-lime text-bg-canvas"
													}`}
												>
													{line.kind}
												</span>
											</td>
											<td className="whitespace-nowrap px-2 py-2 text-fg-primary">
												{line.modelSlug ?? ""}
											</td>
											<td className="px-4 py-2 text-fg-secondary">
												{line.detail}
											</td>
										</tr>
									))}
								</tbody>
							</table>
						</div>
					)}
				</section>
			</div>
		</div>
	);
}
