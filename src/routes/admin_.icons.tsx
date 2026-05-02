import { createFileRoute, Link, Navigate } from "@tanstack/react-router";
import { useQuery } from "convex/react";
import {
	Brain,
	Edit2,
	ExternalLink,
	Image as ImageIcon,
	Package,
	Wrench,
} from "lucide-react";
import { seoMeta } from "@/lib/seo";
import { api } from "../../convex/_generated/api";

export const Route = createFileRoute("/admin_/icons")({
	ssr: false,
	component: AdminIconsPage,
	head: () => ({
		meta: seoMeta({
			title: "Admin Icons - AI Stack",
			description: "Largest icons by storage size.",
			noindex: true,
		}),
	}),
});

function AdminIconsPage() {
	const isAdmin = useQuery(api.admin.checkIsAdmin);
	const topIcons = useQuery(
		api.iconReports.getTopIconsBySize,
		isAdmin ? { limit: 100 } : "skip",
	);

	if (isAdmin === undefined) {
		return (
			<div className="flex min-h-screen items-center justify-center bg-bg-canvas">
				<div className="font-mono text-sm text-fg-muted">Loading...</div>
			</div>
		);
	}

	if (!isAdmin) {
		return <Navigate to="/" />;
	}

	return (
		<div className="min-h-screen bg-bg-canvas">
			<section className="py-12 sm:py-16">
				<div className="mx-auto max-w-6xl px-4 sm:px-6">
					<Link
						to="/admin"
						className="mb-4 inline-flex items-center gap-1.5 border border-stroke-subtle px-2 py-1 font-mono text-[10px] font-semibold uppercase tracking-wide text-fg-secondary transition-colors hover:border-accent-lime hover:text-accent-lime"
					>
						← Back to Admin
					</Link>
					<div className="mb-8 flex items-center gap-3">
						<ImageIcon className="size-8 text-accent-lime" />
						<h1 className="text-2xl font-bold tracking-tight text-fg-primary sm:text-3xl">
							Top Icons by Size
						</h1>
					</div>

					<p className="mb-6 font-mono text-xs text-fg-muted">
						Largest icons in storage. Run{" "}
						<code className="bg-bg-panel-muted px-1">
							pnpm tsx scripts/migrate-icons.ts
						</code>{" "}
						to backfill seeded data into storage.
					</p>

					{!topIcons ? (
						<div className="border-2 border-dashed border-stroke-subtle px-4 py-12 text-center">
							<p className="font-mono text-sm text-fg-muted">
								Loading icons...
							</p>
						</div>
					) : topIcons.length === 0 ? (
						<div className="border-2 border-dashed border-stroke-subtle px-4 py-12 text-center">
							<p className="font-mono text-sm text-fg-muted">
								No icons stored yet
							</p>
						</div>
					) : (
						<div className="border-2 border-stroke-strong bg-bg-panel">
							<table className="w-full">
								<thead className="border-b-2 border-stroke-strong bg-bg-panel-muted">
									<tr>
										<th className="px-4 py-3 text-left font-mono text-[10px] uppercase tracking-wide text-fg-muted">
											Preview
										</th>
										<th className="px-4 py-3 text-left font-mono text-[10px] uppercase tracking-wide text-fg-muted">
											Kind
										</th>
										<th className="px-4 py-3 text-left font-mono text-[10px] uppercase tracking-wide text-fg-muted">
											Name
										</th>
										<th className="px-4 py-3 text-left font-mono text-[10px] uppercase tracking-wide text-fg-muted">
											Slug
										</th>
										<th className="px-4 py-3 text-right font-mono text-[10px] uppercase tracking-wide text-fg-muted">
											Size (KB)
										</th>
										<th className="px-4 py-3 text-right font-mono text-[10px] uppercase tracking-wide text-fg-muted">
											Actions
										</th>
									</tr>
								</thead>
								<tbody>
									{topIcons.map((row) => (
										<tr
											key={row.storageId}
											className="border-b border-stroke-subtle"
										>
											<td className="px-4 py-2">
												<div className="flex size-10 items-center justify-center border border-stroke-subtle bg-bg-panel-muted">
													{row.url ? (
														<img
															src={row.url}
															alt={row.name}
															className="max-h-full max-w-full object-contain p-0.5"
														/>
													) : (
														<KindIcon kind={row.kind} />
													)}
												</div>
											</td>
											<td className="px-4 py-2 font-mono text-xs uppercase text-fg-muted">
												{row.kind}
											</td>
											<td className="px-4 py-2 font-mono text-sm text-fg-primary">
												{row.name}
											</td>
											<td className="px-4 py-2 font-mono text-xs text-fg-muted">
												{row.slug}
											</td>
											<td className="px-4 py-2 text-right font-mono text-sm text-fg-primary">
												{(row.sizeBytes / 1024).toFixed(1)}
											</td>
											<td className="px-4 py-2 text-right">
												<Link
													to="/admin"
													hash={`${row.kind}-${row.slug}`}
													className="inline-flex items-center gap-1.5 border border-stroke-subtle px-2 py-1 font-mono text-[10px] font-semibold uppercase tracking-wide text-fg-secondary transition-colors hover:border-accent-lime hover:text-accent-lime"
													title={`Open ${row.kind} review for ${row.name}`}
													aria-label={`Edit ${row.name}`}
												>
													<Edit2 className="size-3" />
													Edit
												</Link>
												{row.url ? (
													<a
														href={row.url}
														target="_blank"
														rel="noopener noreferrer"
														className="ml-2 inline-flex items-center gap-1.5 border border-stroke-subtle px-2 py-1 font-mono text-[10px] font-semibold uppercase tracking-wide text-fg-secondary transition-colors hover:border-accent-lime hover:text-accent-lime"
														title="Open raw blob"
													>
														<ExternalLink className="size-3" />
														Raw
													</a>
												) : null}
											</td>
										</tr>
									))}
								</tbody>
							</table>
						</div>
					)}
				</div>
			</section>
		</div>
	);
}

function KindIcon({ kind }: { kind: "tool" | "model" | "bundle" }) {
	if (kind === "tool") return <Wrench className="size-5 text-fg-muted" />;
	if (kind === "model") return <Brain className="size-5 text-fg-muted" />;
	return <Package className="size-5 text-fg-muted" />;
}
