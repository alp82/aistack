import { useAction, useMutation, useQuery } from "convex/react";
import { Pause, Play, Plus, RefreshCw, Trash2, Undo2 } from "lucide-react";
import { useId, useState } from "react";
import { RelativeTime } from "@/components/RelativeTime";
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

/**
 * The points gate of the Hacker News lane (#208).
 *
 * The one dial that changes inbox volume. The prototype (#178) measured a real
 * week: 97 items at a gate of 20, and 649 with no keyword net at all. The
 * keyword tiers themselves are code, because they are regular expressions a
 * test proves.
 */
function PointsGate({
	source,
}: {
	source: { _id: Id<"newsSources">; minPoints?: number };
}) {
	const setSourceMinPoints = useMutation(api.news.setSourceMinPoints);
	const inputId = useId();
	const [value, setValue] = useState(String(source.minPoints ?? 20));
	const [error, setError] = useState<string | null>(null);

	async function save(next: string) {
		setValue(next);
		const points = Number(next);
		if (!Number.isInteger(points) || points < 0) return;
		setError(null);
		try {
			await setSourceMinPoints({ sourceId: source._id, minPoints: points });
		} catch (err) {
			setError(err instanceof Error ? err.message : "Could not save that");
		}
	}

	return (
		<span className="inline-flex items-center gap-2 border border-stroke-subtle px-2 py-0.5 font-mono text-xs text-fg-muted">
			<label htmlFor={inputId}>min points</label>
			<input
				id={inputId}
				type="number"
				min={0}
				value={value}
				onChange={(e) => save(e.target.value)}
				className="w-14 border border-stroke-subtle bg-bg-canvas px-1 py-0.5 font-mono text-xs text-fg-primary focus:border-accent-lime focus:outline-none"
			/>
			{error ? <span className="text-red-400">{error}</span> : null}
		</span>
	);
}

export function NewsSourcesSection() {
	const sources = useQuery(api.news.listSources);
	const setSourceEnabled = useMutation(api.news.setSourceEnabled);
	const deleteSource = useMutation(api.news.deleteSource);
	const collectNow = useAction(api.news.collectNow);
	const scrapeNow = useAction(api.newsScrapers.scrapeNow);
	const resetBaseline = useAction(api.newsScrapers.resetBaseline);
	const [running, setRunning] = useState<"feeds" | "scrapers" | null>(null);
	const [report, setReport] = useState<string | null>(null);

	async function runCollector() {
		setRunning("feeds");
		setReport(null);
		try {
			const reports = await collectNow({});
			const added = reports.reduce((sum, r) => sum + r.added, 0);
			const failed = reports.filter((r) => r.error !== null).length;
			setReport(
				`${reports.length} feeds read, ${added} new items, ${failed} failed`,
			);
		} catch (error) {
			setReport(error instanceof Error ? error.message : "The run failed");
		} finally {
			setRunning(null);
		}
	}

	async function runScrapers() {
		setRunning("scrapers");
		setReport(null);
		try {
			const reports = await scrapeNow({});
			const added = reports.reduce((sum, r) => sum + r.added, 0);
			const failed = reports.filter((r) => r.error !== null).length;
			const seeded = reports.filter((r) => r.seeded).length;
			setReport(
				`${reports.length} scrapers read, ${added} new items, ${seeded} seeded, ${failed} failed`,
			);
		} catch (error) {
			setReport(error instanceof Error ? error.message : "The run failed");
		} finally {
			setRunning(null);
		}
	}

	async function remove(sourceId: Id<"newsSources">, name: string) {
		if (!window.confirm(`Delete ${name}? Its collected items stay.`)) return;
		await deleteSource({ sourceId });
	}

	async function forgetBaseline(
		sourceId: Id<"newsSources">,
		name: string,
	): Promise<void> {
		if (
			!window.confirm(
				`Forget what ${name} has shown before? The next run reads it cold and adds nothing.`,
			)
		)
			return;
		await resetBaseline({ sourceId });
	}

	return (
		<>
			<AddSource />

			<div className="mb-6 flex flex-wrap items-center gap-3">
				<button
					type="button"
					onClick={runCollector}
					disabled={running !== null}
					className="inline-flex cursor-pointer items-center gap-2 border-2 border-stroke-strong px-4 py-2 font-mono text-xs font-semibold uppercase tracking-wide text-fg-secondary transition-colors hover:border-accent-lime hover:text-accent-lime disabled:cursor-not-allowed disabled:opacity-40"
				>
					<RefreshCw
						className={`size-3.5 ${running === "feeds" ? "animate-spin" : ""}`}
					/>
					{running === "feeds" ? "Reading" : "Collect feeds"}
				</button>
				<button
					type="button"
					onClick={runScrapers}
					disabled={running !== null}
					className="inline-flex cursor-pointer items-center gap-2 border-2 border-stroke-strong px-4 py-2 font-mono text-xs font-semibold uppercase tracking-wide text-fg-secondary transition-colors hover:border-accent-lime hover:text-accent-lime disabled:cursor-not-allowed disabled:opacity-40"
				>
					<RefreshCw
						className={`size-3.5 ${running === "scrapers" ? "animate-spin" : ""}`}
					/>
					{running === "scrapers" ? "Reading" : "Run scrapers"}
				</button>
				{report ? (
					<span className="font-mono text-xs text-fg-muted">{report}</span>
				) : null}
				<span className="ml-auto font-mono text-xs text-fg-muted">
					Feeds and scrapers run every 6 hours. Hacker News runs daily at 06:00
					UTC.
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
								// A PAUSED SOURCE IS NOT A FAILING SOURCE (#262).
								//
								// `lastError` is what the last poll of an ACTIVE source said.
								// Pausing retires the poll, so the red goes with it. The text
								// stays, muted, because the reason you paused it is the record
								// you want when you come back to the row. The inbox already
								// reads it this way and gates its own banner on `enabled`.
								source.lastError && source.enabled
									? "border-red-400/40"
									: "border-stroke-strong"
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
									{source.kind}
								</span>
								<span className="border border-stroke-subtle px-2 py-0.5 font-mono text-xs text-fg-muted">
									{source.licenseClass}
								</span>
								{source.kind === "hn" ? <PointsGate source={source} /> : null}
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
									{source.scraperSlug ? (
										<button
											type="button"
											onClick={() => forgetBaseline(source._id, source.name)}
											className="inline-flex cursor-pointer items-center gap-2 border border-stroke-subtle px-3 py-1.5 font-mono text-xs text-fg-muted transition-colors hover:border-accent-lime hover:text-accent-lime"
										>
											<Undo2 className="size-3.5" />
											Reset baseline
										</button>
									) : (
										<button
											type="button"
											onClick={() => remove(source._id, source.name)}
											className="inline-flex cursor-pointer items-center gap-2 border border-stroke-subtle px-3 py-1.5 font-mono text-xs text-fg-muted transition-colors hover:border-red-400 hover:text-red-400"
										>
											<Trash2 className="size-3.5" />
											Delete
										</button>
									)}
								</div>
							</div>
							<p className="mt-2 break-all font-mono text-xs text-fg-muted">
								{source.url}
							</p>
							<p className="mt-1 font-mono text-xs text-fg-muted">
								polled{" "}
								{source.lastPolledAt ? (
									<RelativeTime at={source.lastPolledAt} />
								) : (
									"never"
								)}{" "}
								· last ok{" "}
								{source.lastOkAt ? (
									<RelativeTime at={source.lastOkAt} />
								) : (
									"never"
								)}
								{source.consecutiveFailures > 0
									? ` · ${source.consecutiveFailures} failures in a row`
									: ""}
							</p>
							{source.lastError ? (
								<p
									className={`mt-1 font-mono text-xs ${
										source.enabled ? "text-red-400" : "text-fg-muted"
									}`}
								>
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
