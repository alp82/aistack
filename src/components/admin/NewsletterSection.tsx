import { useAction, useQuery } from "convex/react";
import { Loader2, Mail, RefreshCw, Send } from "lucide-react";
import { useState } from "react";
import { api } from "../../../convex/_generated/api";

/**
 * The newsletter view (#201).
 *
 * Issues are authored in code (`src/newsletter/issues.ts`), so there is nothing
 * to compose here. This view does the three things code cannot do by itself:
 * resolve the authored URLs against the item stream, send one test copy, and
 * send the issue.
 *
 * Send asks for a typed confirmation. It is the one button on the site that
 * mails several hundred people, and a sent issue is never edited.
 */

type PrepareReport = {
	ok: boolean;
	message?: string;
	slug: string;
	number?: number;
	resolved?: number;
	missing?: string[];
	notApproved?: { url: string; state: string }[];
	undrafted?: string[];
};

type SendReport = {
	success: boolean;
	sent: number;
	failed: number;
	suppressed?: number;
	message?: string;
};

function formatDate(ms?: number): string {
	if (typeof ms !== "number") return "";
	return new Date(ms).toLocaleDateString("en-US", {
		month: "short",
		day: "numeric",
		year: "numeric",
	});
}

export function NewsletterSection() {
	const issues = useQuery(api.newsletter.listIssues);
	const recipients = useQuery(api.newsletter.recipientCount);
	const prepare = useAction(api.newsletter.adminPrepareIssue);
	const sendTest = useAction(api.newsletter.adminSendTestIssue);
	const send = useAction(api.newsletter.adminSendIssue);

	const [busy, setBusy] = useState<string | null>(null);
	const [report, setReport] = useState<PrepareReport | null>(null);
	const [sendReport, setSendReport] = useState<SendReport | null>(null);

	async function runPrepare(slug: string) {
		setBusy(`prepare:${slug}`);
		setSendReport(null);
		setReport(await prepare({ slug }));
		setBusy(null);
	}

	async function runTest(slug: string) {
		setBusy(`test:${slug}`);
		setReport(null);
		setSendReport(await sendTest({ slug }));
		setBusy(null);
	}

	async function runSend(slug: string, subject: string) {
		const typed = window.prompt(
			`Send "${subject}" to every subscriber? A sent issue is never edited.\n\nType SEND to confirm.`,
		);
		if (typed !== "SEND") return;
		setBusy(`send:${slug}`);
		setReport(null);
		setSendReport(await send({ slug }));
		setBusy(null);
	}

	if (issues === undefined) {
		return <p className="font-mono text-sm text-fg-muted">Loading...</p>;
	}

	return (
		<>
			<div className="mb-8 flex flex-wrap items-center gap-6 border-2 border-stroke-strong bg-bg-panel p-6">
				<div className="flex items-center gap-3">
					<Mail className="size-4 text-accent-lime" />
					<span className="font-mono text-xs uppercase tracking-widest text-fg-muted">
						Newsletter audience
					</span>
				</div>
				<p className="font-mono text-sm text-fg-primary">
					{recipients ?? 0}+ recipients
				</p>
				<p className="font-mono text-xs text-fg-muted">
					Waitlist and subscribers, minus newsletter opt-outs. Registered
					members are added by the send itself, so the real number is higher.
				</p>
			</div>

			{report ? (
				<div
					className={`mb-6 border-2 p-4 font-mono text-xs ${
						report.ok ? "border-accent-lime" : "border-stroke-strong"
					}`}
				>
					<p className="mb-2 font-bold uppercase tracking-wide text-fg-primary">
						Prepared #{report.number ?? "?"} · {report.resolved ?? 0} items
						resolved
					</p>
					{report.message ? (
						<p className="text-fg-secondary">{report.message}</p>
					) : null}
					{report.missing?.length ? (
						<p className="mt-2 text-fg-secondary">
							Not collected yet ({report.missing.length}):{" "}
							{report.missing.join(", ")}
						</p>
					) : null}
					{report.notApproved?.length ? (
						<p className="mt-2 text-fg-secondary">
							Still in the inbox ({report.notApproved.length}):{" "}
							{report.notApproved.map((n) => n.url).join(", ")}
						</p>
					) : null}
					{report.undrafted?.length ? (
						<p className="mt-2 text-fg-secondary">
							No summary yet ({report.undrafted.length}):{" "}
							{report.undrafted.join(", ")}
						</p>
					) : null}
				</div>
			) : null}

			{sendReport ? (
				<div
					className={`mb-6 border-2 p-4 font-mono text-xs ${
						sendReport.success ? "border-accent-lime" : "border-stroke-strong"
					}`}
				>
					<p className="font-bold uppercase tracking-wide text-fg-primary">
						Sent {sendReport.sent}, failed {sendReport.failed}
						{typeof sendReport.suppressed === "number"
							? `, opted out ${sendReport.suppressed}`
							: ""}
					</p>
					{sendReport.message ? (
						<p className="mt-2 text-fg-secondary">{sendReport.message}</p>
					) : null}
				</div>
			) : null}

			<div className="space-y-4">
				{issues.map((issue) => {
					const sent = issue.status === "sent";
					return (
						<div
							key={issue.slug}
							className="border-2 border-stroke-strong bg-bg-panel p-6"
						>
							<div className="mb-4 flex flex-wrap items-baseline gap-3">
								<span className="font-mono text-xs uppercase tracking-widest text-accent-lime">
									Issue #{issue.number}
								</span>
								<span
									className={`border px-2 py-0.5 font-mono text-[10px] uppercase tracking-wide ${
										sent
											? "border-accent-lime text-accent-lime"
											: "border-stroke-subtle text-fg-muted"
									}`}
								>
									{issue.status ?? "not prepared"}
								</span>
								{sent ? (
									<span className="font-mono text-xs text-fg-muted">
										{formatDate(issue.sentAt)} · {issue.sentCount} sent
										{issue.failedCount ? `, ${issue.failedCount} failed` : ""}
									</span>
								) : null}
							</div>

							<p className="mb-2 text-lg font-bold text-fg-primary">
								{issue.subject}
							</p>
							<p className="mb-6 font-mono text-xs text-fg-muted">
								{issue.resolvedItems} of {issue.authoredItems} authored items
								resolved
							</p>

							<div className="flex flex-wrap gap-3">
								<button
									type="button"
									onClick={() => runPrepare(issue.slug)}
									disabled={sent || busy !== null}
									className="inline-flex cursor-pointer items-center gap-2 border-2 border-stroke-strong px-4 py-2 font-mono text-xs font-semibold uppercase tracking-wide text-fg-primary transition-colors hover:border-accent-lime disabled:cursor-not-allowed disabled:opacity-40"
								>
									{busy === `prepare:${issue.slug}` ? (
										<Loader2 className="size-3.5 animate-spin" />
									) : (
										<RefreshCw className="size-3.5" />
									)}
									Prepare
								</button>
								<button
									type="button"
									onClick={() => runTest(issue.slug)}
									disabled={busy !== null || issue.resolvedItems === 0}
									className="inline-flex cursor-pointer items-center gap-2 border-2 border-stroke-strong px-4 py-2 font-mono text-xs font-semibold uppercase tracking-wide text-fg-primary transition-colors hover:border-accent-lime disabled:cursor-not-allowed disabled:opacity-40"
								>
									{busy === `test:${issue.slug}` ? (
										<Loader2 className="size-3.5 animate-spin" />
									) : (
										<Mail className="size-3.5" />
									)}
									Test send to me
								</button>
								<button
									type="button"
									onClick={() => runSend(issue.slug, issue.subject)}
									disabled={sent || busy !== null || issue.resolvedItems === 0}
									className="inline-flex cursor-pointer items-center gap-2 border-2 border-accent-lime bg-accent-lime px-4 py-2 font-mono text-xs font-semibold uppercase tracking-wide text-accent-lime-contrast transition-colors hover:opacity-80 disabled:cursor-not-allowed disabled:opacity-40"
								>
									{busy === `send:${issue.slug}` ? (
										<Loader2 className="size-3.5 animate-spin" />
									) : (
										<Send className="size-3.5" />
									)}
									{sent ? "Sent" : "Send to everyone"}
								</button>
							</div>
						</div>
					);
				})}
			</div>
		</>
	);
}
