import { render } from "@react-email/render";
import { useAction, useQuery } from "convex/react";
import {
	AlertTriangle,
	CheckCircle,
	ChevronDown,
	ChevronUp,
	Code,
	Eye,
	Mail,
	Radio,
	Send,
	ShieldAlert,
	ToggleLeft,
	ToggleRight,
	Users,
} from "lucide-react";
import { useState } from "react";
import { api } from "../../../convex/_generated/api";
import { FeatureUpdateEmail } from "../../emails/FeatureUpdateEmail";
import { WaitlistLaunchEmail } from "../../emails/WaitlistLaunchEmail";
import { Dialog } from "../ui/Dialog";
import { SyncBroadcastPrototypeSection } from "./SyncBroadcastPrototype";

type ViewMode = "preview" | "html";

interface BroadcastEmail {
	id: string;
	name: string;
	description: string;
	audience: string;
	component: React.ReactElement;
}

const BROADCAST_EMAILS: BroadcastEmail[] = [
	{
		id: "waitlist-launch",
		name: "We're Live!",
		description: "Announce the AI Stack launch to waitlist subscribers",
		audience: "Waitlist",
		component: <WaitlistLaunchEmail />,
	},
	{
		id: "feature-update",
		name: "New: Promote, Share & Customize",
		description:
			"Announce three new member features (projects, shareable stack image, accent colors) to waitlist subscribers and registered members",
		audience: "Waitlist + Members",
		component: <FeatureUpdateEmail />,
	},
];

// Track which broadcasts have already been sent
// Mirror of the server registry's `alreadySent` flag in convex/email.ts — keep both in sync.
const SENT_BROADCASTS = new Set(["waitlist-launch"]);

function BroadcastPreviewCard({ broadcast }: { broadcast: BroadcastEmail }) {
	const [expanded, setExpanded] = useState(false);
	const [viewMode, setViewMode] = useState<ViewMode>("preview");
	const [htmlContent, setHtmlContent] = useState<string>("");
	const [loading, setLoading] = useState(false);
	const [sendingTest, setSendingTest] = useState(false);
	const [sendingBroadcast, setSendingBroadcast] = useState(false);
	const [testResult, setTestResult] = useState<{
		success: boolean;
		message?: string;
	} | null>(null);
	const [broadcastResult, setBroadcastResult] = useState<{
		success: boolean;
		sent: number;
		failed: number;
		message?: string;
		sentEmails?: string[];
		errors?: { email: string; error: string }[];
	} | null>(null);
	const [showBroadcastDialog, setShowBroadcastDialog] = useState(false);
	const [broadcastEnabled, setBroadcastEnabled] = useState(false);

	const recipientCount = useQuery(api.email.getBroadcastRecipientCount, {
		broadcastId: broadcast.id,
	});
	const sendTestEmail = useAction(api.email.sendTestEmail);
	const sendBroadcast = useAction(api.email.sendBroadcast);

	const handleExpand = async () => {
		if (!expanded && !htmlContent) {
			setLoading(true);
			try {
				const html = await render(broadcast.component);
				setHtmlContent(html);
			} catch (error) {
				console.error("Failed to render email:", error);
			}
			setLoading(false);
		}
		setExpanded(!expanded);
	};

	const openBroadcastDialog = () => {
		setShowBroadcastDialog(true);
		setTestResult(null);
		setBroadcastResult(null);
		setBroadcastEnabled(false);
	};

	const handleSendTest = async () => {
		setSendingTest(true);
		setTestResult(null);

		try {
			const result = await sendTestEmail({ broadcastId: broadcast.id });
			setTestResult(result);
		} catch (error) {
			console.error("Failed to send test email:", error);
			setTestResult({
				success: false,
				message: error instanceof Error ? error.message : "Unknown error",
			});
		} finally {
			setSendingTest(false);
		}
	};

	const handleSendBroadcast = async () => {
		if (!broadcastEnabled) return;

		setSendingBroadcast(true);
		setBroadcastResult(null);

		try {
			const result = await sendBroadcast({ broadcastId: broadcast.id });
			setBroadcastResult(result);
			if (result.success) {
				// Close dialog and reset after successful send
				setTimeout(() => {
					setShowBroadcastDialog(false);
					setBroadcastEnabled(false);
				}, 3000);
			}
		} catch (error) {
			console.error("Failed to send broadcast:", error);
			setBroadcastResult({
				success: false,
				sent: 0,
				failed: 0,
				message: error instanceof Error ? error.message : "Unknown error",
			});
		} finally {
			setSendingBroadcast(false);
		}
	};

	const closeBroadcastDialog = () => {
		setShowBroadcastDialog(false);
		setBroadcastEnabled(false);
		setBroadcastResult(null);
	};

	return (
		<div className="border-2 border-stroke-strong bg-bg-panel overflow-hidden">
			<button
				type="button"
				onClick={handleExpand}
				className="flex w-full items-center justify-between p-4 text-left transition-colors hover:bg-bg-panel-muted"
			>
				<div className="flex items-center gap-3">
					<div className="flex size-10 items-center justify-center border border-stroke-subtle bg-bg-panel-muted">
						<Radio className="size-5 text-accent-lime" />
					</div>
					<div>
						<h3 className="font-mono text-sm font-semibold text-fg-primary">
							{broadcast.name}
						</h3>
						<p className="font-mono text-xs text-fg-muted">
							{broadcast.description}
						</p>
					</div>
				</div>
				<div className="flex items-center gap-3">
					<span className="inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap border border-stroke-subtle bg-bg-panel-muted px-2 py-1 font-mono text-[10px] font-semibold uppercase tracking-wide text-fg-muted">
						<Users className="size-3" />
						{broadcast.audience}
					</span>
					{expanded ? (
						<ChevronUp className="size-5 text-fg-muted" />
					) : (
						<ChevronDown className="size-5 text-fg-muted" />
					)}
				</div>
			</button>

			{/* Broadcast Dialog */}
			<Dialog
				open={showBroadcastDialog}
				onClose={closeBroadcastDialog}
				title={
					SENT_BROADCASTS.has(broadcast.id)
						? "Broadcast Sent"
						: "Send Broadcast"
				}
				titleIcon={
					<ShieldAlert
						className={`size-6 ${SENT_BROADCASTS.has(broadcast.id) ? "text-green-500" : "text-red-500"}`}
					/>
				}
				size="md"
			>
				{/* Already Sent Message */}
				{SENT_BROADCASTS.has(broadcast.id) && (
					<div className="mb-4 flex items-center gap-3 border border-green-700 bg-green-900/20 p-4">
						<CheckCircle className="size-5 text-green-500" />
						<span className="font-mono text-sm text-fg-primary">
							This broadcast has already been sent to all waitlist subscribers.
						</span>
					</div>
				)}

				{/* Test Result */}
				{testResult && (
					<div
						className={`mb-4 flex items-center gap-3 p-3 ${
							testResult.success
								? "bg-green-900/20 border border-green-700"
								: "bg-red-900/20 border border-red-700"
						}`}
					>
						{testResult.success ? (
							<CheckCircle className="size-5 text-green-500" />
						) : (
							<AlertTriangle className="size-5 text-red-500" />
						)}
						<span className="font-mono text-sm text-fg-primary">
							{testResult.message}
						</span>
					</div>
				)}

				{/* Broadcast Result */}
				{broadcastResult && (
					<div
						className={`mb-4 p-3 ${
							broadcastResult.success
								? "bg-green-900/20 border border-green-700"
								: "bg-red-900/20 border border-red-700"
						}`}
					>
						<div className="flex items-center gap-3">
							{broadcastResult.success ? (
								<CheckCircle className="size-5 text-green-500" />
							) : (
								<AlertTriangle className="size-5 text-red-500" />
							)}
							<span className="font-mono text-sm text-fg-primary">
								{broadcastResult.success
									? `Successfully sent ${broadcastResult.sent} emails`
									: `Sent: ${broadcastResult.sent}, Failed: ${broadcastResult.failed}`}
							</span>
						</div>
						{/* Show sent emails */}
						{broadcastResult.sentEmails &&
							broadcastResult.sentEmails.length > 0 && (
								<details className="mt-2">
									<summary className="cursor-pointer font-mono text-xs text-green-400">
										✓ Sent ({broadcastResult.sentEmails.length})
									</summary>
									<ul className="mt-1 max-h-32 overflow-y-auto pl-4 font-mono text-xs text-fg-muted">
										{broadcastResult.sentEmails.map((email) => (
											<li key={email}>{email}</li>
										))}
									</ul>
								</details>
							)}
						{/* Show failed emails with errors */}
						{broadcastResult.errors && broadcastResult.errors.length > 0 && (
							<details className="mt-2" open>
								<summary className="cursor-pointer font-mono text-xs text-red-400">
									✗ Failed ({broadcastResult.errors.length})
								</summary>
								<ul className="mt-1 max-h-48 overflow-y-auto pl-4 font-mono text-xs text-fg-muted">
									{broadcastResult.errors.map((err) => (
										<li key={err.email} className="mb-1">
											<span className="text-red-400">{err.email}</span>
											<span className="text-fg-muted">: {err.error}</span>
										</li>
									))}
								</ul>
							</details>
						)}
					</div>
				)}

				{/* Send Test Email */}
				<div className="mb-4 flex items-center justify-between border border-stroke-subtle bg-bg-panel-muted p-4">
					<div className="flex items-center gap-3">
						<Mail className="size-5 text-fg-muted" />
						<span className="font-mono text-sm text-fg-secondary">
							Send test email
						</span>
					</div>
					<button
						type="button"
						onClick={handleSendTest}
						disabled={sendingTest}
						className="inline-flex items-center gap-2 border-2 border-accent-lime bg-accent-lime px-3 py-1.5 font-mono text-xs font-semibold uppercase tracking-wide text-accent-lime-contrast transition-colors hover:bg-accent-lime/90 disabled:opacity-50"
					>
						<Mail className="size-3.5" />
						{sendingTest ? "Sending..." : "Send Test"}
					</button>
				</div>

				{/* Warning - hidden if already sent */}
				{!SENT_BROADCASTS.has(broadcast.id) && (
					<p className="mb-4 font-mono text-sm text-fg-secondary">
						You are about to send this email to{" "}
						<span className="font-bold text-fg-primary">
							{recipientCount ?? "..."} recipients
						</span>
						. This action cannot be undone.
					</p>
				)}

				{/* Safety Toggle - hidden if already sent */}
				{!SENT_BROADCASTS.has(broadcast.id) && (
					<div className="mb-6 flex items-center justify-between border border-stroke-subtle bg-bg-panel-muted p-4">
						<div className="flex items-center gap-3">
							<ShieldAlert className="size-5 text-red-500" />
							<span className="font-mono text-sm text-fg-secondary">
								Enable broadcast send
							</span>
						</div>
						<button
							type="button"
							onClick={() => setBroadcastEnabled(!broadcastEnabled)}
							className="text-fg-muted hover:text-fg-primary"
						>
							{broadcastEnabled ? (
								<ToggleRight className="size-8 text-accent-lime" />
							) : (
								<ToggleLeft className="size-8" />
							)}
						</button>
					</div>
				)}

				{/* Actions */}
				<div className="flex items-center justify-end gap-3">
					<button
						type="button"
						onClick={closeBroadcastDialog}
						className="border-2 border-stroke-subtle px-4 py-2 font-mono text-xs font-semibold uppercase tracking-wide text-fg-muted transition-colors hover:border-fg-muted"
					>
						{SENT_BROADCASTS.has(broadcast.id) ? "Close" : "Cancel"}
					</button>
					{!SENT_BROADCASTS.has(broadcast.id) && (
						<button
							type="button"
							onClick={handleSendBroadcast}
							disabled={!broadcastEnabled || sendingBroadcast}
							className="inline-flex items-center gap-2 border-2 border-red-500 bg-red-500 px-4 py-2 font-mono text-xs font-semibold uppercase tracking-wide text-white transition-colors hover:bg-red-600 disabled:cursor-not-allowed disabled:opacity-50"
						>
							<Send className="size-3.5" />
							{sendingBroadcast ? "Sending..." : "Send Broadcast"}
						</button>
					)}
				</div>
			</Dialog>

			{expanded && (
				<div className="border-t border-stroke-subtle">
					{/* Test Result Banner */}
					{testResult && !showBroadcastDialog && (
						<div
							className={`flex items-center gap-3 px-4 py-3 ${
								testResult.success
									? "bg-green-900/20 border-b border-green-700"
									: "bg-red-900/20 border-b border-red-700"
							}`}
						>
							{testResult.success ? (
								<CheckCircle className="size-5 text-green-500" />
							) : (
								<AlertTriangle className="size-5 text-red-500" />
							)}
							<span className="font-mono text-sm text-fg-primary">
								{testResult.message}
							</span>
						</div>
					)}

					<div className="flex items-center justify-between border-b border-stroke-subtle bg-bg-panel-muted px-4 py-2">
						<div className="flex items-center gap-2">
							<button
								type="button"
								onClick={() => setViewMode("preview")}
								className={`inline-flex items-center gap-1.5 px-3 py-1.5 font-mono text-xs font-semibold uppercase tracking-wide transition-colors ${
									viewMode === "preview"
										? "bg-accent-lime text-accent-lime-contrast"
										: "text-fg-muted hover:text-fg-primary"
								}`}
							>
								<Eye className="size-3.5" />
								Preview
							</button>
							<button
								type="button"
								onClick={() => setViewMode("html")}
								className={`inline-flex items-center gap-1.5 px-3 py-1.5 font-mono text-xs font-semibold uppercase tracking-wide transition-colors ${
									viewMode === "html"
										? "bg-accent-lime text-accent-lime-contrast"
										: "text-fg-muted hover:text-fg-primary"
								}`}
							>
								<Code className="size-3.5" />
								HTML
							</button>
						</div>
						<div className="flex items-center gap-3">
							{recipientCount !== undefined && (
								<span className="font-mono text-xs text-fg-muted">
									{recipientCount} recipients
								</span>
							)}
							<button
								type="button"
								onClick={openBroadcastDialog}
								className="inline-flex items-center gap-2 border-2 border-accent-lime bg-accent-lime px-4 py-2 font-mono text-xs font-semibold uppercase tracking-wide text-accent-lime-contrast transition-colors hover:bg-accent-lime/90"
							>
								<Send className="size-3.5" />
								Send
							</button>
						</div>
					</div>

					<div className="p-4">
						{loading ? (
							<div className="flex items-center justify-center py-12">
								<span className="font-mono text-sm text-fg-muted">
									Rendering...
								</span>
							</div>
						) : viewMode === "preview" ? (
							<div className="mx-auto max-w-[768px] overflow-hidden border border-stroke-subtle bg-white shadow-md">
								<iframe
									srcDoc={htmlContent}
									title={`${broadcast.name} Preview`}
									className="h-[800px] w-full border-0"
									sandbox="allow-same-origin"
								/>
							</div>
						) : (
							<div className="relative">
								<pre className="max-h-[400px] overflow-auto border border-stroke-subtle bg-bg-shell p-4 font-mono text-xs text-fg-secondary">
									<code>{htmlContent}</code>
								</pre>
								<button
									type="button"
									onClick={() => {
										navigator.clipboard.writeText(htmlContent);
									}}
									className="absolute right-2 top-2 border border-stroke-subtle bg-bg-panel px-2 py-1 font-mono text-[10px] font-semibold uppercase tracking-wide text-fg-muted transition-colors hover:border-accent-lime hover:text-accent-lime"
								>
									Copy
								</button>
							</div>
						)}
					</div>
				</div>
			)}
		</div>
	);
}

export function EmailBroadcastsSection() {
	return (
		<>
			<div className="mb-8 flex items-center gap-3">
				<Radio className="size-8 text-accent-lime" />
				<div>
					<h2 className="text-2xl font-bold tracking-tight text-fg-primary sm:text-3xl">
						Broadcasts
					</h2>
					<p className="font-mono text-sm text-fg-muted">
						One-time emails sent to specific audiences
					</p>
				</div>
			</div>

			{/* PROTOTYPE #133 — remove with SyncBroadcastPrototypeSection once a variant wins */}
			<SyncBroadcastPrototypeSection />

			<div className="space-y-4">
				{[...BROADCAST_EMAILS].reverse().map((broadcast) => (
					<BroadcastPreviewCard key={broadcast.id} broadcast={broadcast} />
				))}
			</div>
		</>
	);
}
