import { useAction, useMutation, useQuery } from "convex/react";
import { Pause, Play, Plus, RefreshCw, Trash2 } from "lucide-react";
import { useState } from "react";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";

// The classes of the re-serving table in docs/specs/news-pipeline.md. Only the
// three the feed lane can produce are offered. Hacker News and X arrive through
// their own lanes (#208), which set their own class.
const LICENSE_OPTIONS = [
	{ value: "article", label: "Article: headline, link, our summary" },
	{ value: "cc-by", label: "CC-BY: full text with attribution" },
	{
		value: "permissive-release-notes",
		label: "MIT or Apache release notes: full text with notice",
	},
	{
		value: "unlicensed-release-notes",
		label: "Unlicensed release notes: our summary plus link",
	},
] as const;

type LicenseValue = (typeof LICENSE_OPTIONS)[number]["value"];

function ago(ms: number | undefined): string {
	if (!ms) return "never";
	const minutes = Math.round((Date.now() - ms) / 60000);
	if (minutes < 60) return `${minutes}m ago`;
	const hours = Math.round(minutes / 60);
	if (hours < 48) return `${hours}h ago`;
	return `${Math.round(hours / 24)}d ago`;
}

function AddSource() {
	const createSource = useMutation(api.news.createSource);
	const [name, setName] = useState("");
	const [url, setUrl] = useState("");
	const [licenseClass, setLicenseClass] = useState<LicenseValue>("article");
	const [error, setError] = useState<string | null>(null);

	async function submit(e: React.FormEvent) {
		e.preventDefault();
		setError(null);
		try {
			await createSource({ name, url, kind: "feed", licenseClass });
			setName("");
			setUrl("");
		} catch (err) {
			setError(err instanceof Error ? err.message : "Could not add that");
		}
	}

	return (
		<form
			onSubmit={submit}
			className="mb-8 border-2 border-stroke-strong bg-bg-panel p-6"
		>
			<h2 className="mb-4 font-mono text-sm font-semibold uppercase tracking-wide text-fg-primary">
				Add a feed
			</h2>
			<div className="flex flex-col gap-3">
				<div className="flex flex-col gap-3 sm:flex-row">
					<input
						type="text"
						value={name}
						onChange={(e) => setName(e.target.value)}
						placeholder="Name"
						className="flex-1 border-2 border-stroke-subtle bg-bg-canvas px-3 py-2 font-mono text-sm text-fg-primary placeholder:text-fg-muted focus:border-accent-lime focus:outline-none"
					/>
					<input
						type="url"
						value={url}
						onChange={(e) => setUrl(e.target.value)}
						placeholder="Feed URL"
						className="flex-[2] border-2 border-stroke-subtle bg-bg-canvas px-3 py-2 font-mono text-sm text-fg-primary placeholder:text-fg-muted focus:border-accent-lime focus:outline-none"
					/>
				</div>
				<div className="flex flex-col gap-3 sm:flex-row">
					<select
						value={licenseClass}
						onChange={(e) => setLicenseClass(e.target.value as LicenseValue)}
						className="flex-1 border-2 border-stroke-subtle bg-bg-canvas px-3 py-2 font-mono text-xs text-fg-primary focus:border-accent-lime focus:outline-none"
					>
						{LICENSE_OPTIONS.map((option) => (
							<option key={option.value} value={option.value}>
								{option.label}
							</option>
						))}
					</select>
					<button
						type="submit"
						disabled={!name.trim() || !url.trim()}
						className="inline-flex cursor-pointer items-center justify-center gap-2 border-2 border-accent-lime bg-accent-lime px-4 py-2 font-mono text-xs font-semibold uppercase tracking-wide text-bg-canvas transition-colors hover:opacity-80 disabled:cursor-not-allowed disabled:opacity-40"
					>
						<Plus className="size-3.5" />
						Add
					</button>
				</div>
			</div>
			<p className="mt-3 font-mono text-xs text-fg-muted">
				A new source collects forward only. Items published before you add it
				are not collected.
			</p>
			{error ? (
				<p className="mt-3 font-mono text-xs text-red-400">{error}</p>
			) : null}
		</form>
	);
}

export function NewsSourcesSection() {
	const sources = useQuery(api.news.listSources);
	const setSourceEnabled = useMutation(api.news.setSourceEnabled);
	const deleteSource = useMutation(api.news.deleteSource);
	const collectNow = useAction(api.news.collectNow);
	const [running, setRunning] = useState(false);
	const [report, setReport] = useState<string | null>(null);

	async function runCollector() {
		setRunning(true);
		setReport(null);
		try {
			const reports = await collectNow({});
			const added = reports.reduce((sum, r) => sum + r.added, 0);
			const failed = reports.filter((r) => r.error !== null).length;
			setReport(
				`${reports.length} sources read, ${added} new items, ${failed} failed`,
			);
		} catch (error) {
			setReport(error instanceof Error ? error.message : "The run failed");
		} finally {
			setRunning(false);
		}
	}

	async function remove(sourceId: Id<"newsSources">, name: string) {
		if (!window.confirm(`Delete ${name}? Its collected items stay.`)) return;
		await deleteSource({ sourceId });
	}

	return (
		<>
			<AddSource />

			<div className="mb-6 flex flex-wrap items-center gap-3">
				<button
					type="button"
					onClick={runCollector}
					disabled={running}
					className="inline-flex cursor-pointer items-center gap-2 border-2 border-stroke-strong px-4 py-2 font-mono text-xs font-semibold uppercase tracking-wide text-fg-secondary transition-colors hover:border-accent-lime hover:text-accent-lime disabled:cursor-not-allowed disabled:opacity-40"
				>
					<RefreshCw className={`size-3.5 ${running ? "animate-spin" : ""}`} />
					{running ? "Reading" : "Collect now"}
				</button>
				{report ? (
					<span className="font-mono text-xs text-fg-muted">{report}</span>
				) : null}
				<span className="ml-auto font-mono text-xs text-fg-muted">
					The cron runs every 6 hours.
				</span>
			</div>

			{sources === undefined ? (
				<p className="font-mono text-sm text-fg-muted">Loading...</p>
			) : !sources || sources.length === 0 ? (
				<div className="border-2 border-dashed border-stroke-subtle px-4 py-12 text-center">
					<p className="font-mono text-sm text-fg-muted">No sources yet.</p>
				</div>
			) : (
				<div className="space-y-3">
					{sources.map((source) => (
						<div
							key={source._id}
							className={`border-2 bg-bg-panel p-4 ${
								source.lastError ? "border-red-400/40" : "border-stroke-strong"
							}`}
						>
							<div className="flex flex-wrap items-center gap-3">
								<span
									className={`font-mono text-sm font-semibold ${
										source.enabled ? "text-fg-primary" : "text-fg-muted"
									}`}
								>
									{source.name}
								</span>
								<span className="border border-stroke-subtle px-2 py-0.5 font-mono text-xs text-fg-muted">
									{source.licenseClass}
								</span>
								{!source.enabled ? (
									<span className="border border-stroke-subtle px-2 py-0.5 font-mono text-xs text-fg-muted">
										paused
									</span>
								) : null}
								<div className="ml-auto flex gap-2">
									<button
										type="button"
										onClick={() =>
											setSourceEnabled({
												sourceId: source._id,
												enabled: !source.enabled,
											})
										}
										className="inline-flex cursor-pointer items-center gap-2 border border-stroke-subtle px-3 py-1.5 font-mono text-xs text-fg-muted transition-colors hover:border-accent-lime hover:text-accent-lime"
									>
										{source.enabled ? (
											<Pause className="size-3.5" />
										) : (
											<Play className="size-3.5" />
										)}
										{source.enabled ? "Pause" : "Resume"}
									</button>
									<button
										type="button"
										onClick={() => remove(source._id, source.name)}
										className="inline-flex cursor-pointer items-center gap-2 border border-stroke-subtle px-3 py-1.5 font-mono text-xs text-fg-muted transition-colors hover:border-red-400 hover:text-red-400"
									>
										<Trash2 className="size-3.5" />
										Delete
									</button>
								</div>
							</div>
							<p className="mt-2 break-all font-mono text-xs text-fg-muted">
								{source.url}
							</p>
							<p className="mt-1 font-mono text-xs text-fg-muted">
								polled {ago(source.lastPolledAt)} · last ok{" "}
								{ago(source.lastOkAt)}
								{source.consecutiveFailures > 0
									? ` · ${source.consecutiveFailures} failures in a row`
									: ""}
							</p>
							{source.lastError ? (
								<p className="mt-1 font-mono text-xs text-red-400">
									{source.lastError}
								</p>
							) : null}
						</div>
					))}
				</div>
			)}
		</>
	);
}
