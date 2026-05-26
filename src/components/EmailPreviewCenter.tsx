import { render } from "@react-email/render";
import { ChevronDown, ChevronUp, Code, Eye, Mail } from "lucide-react";
import { useState } from "react";
import { MagicLinkEmail } from "../emails/MagicLinkEmail";
import { ResetPasswordEmail } from "../emails/ResetPasswordEmail";
import { VerifyEmail } from "../emails/VerifyEmail";

type ViewMode = "preview" | "html";

interface EmailTemplate {
	id: string;
	name: string;
	description: string;
	component: React.ReactElement;
}

const EMAIL_TEMPLATES: EmailTemplate[] = [
	{
		id: "verify-email",
		name: "Verify Email",
		description: "Sent when a user signs up to verify their email address",
		component: (
			<VerifyEmail verifyUrl="https://aistack.to/verify?token=example123" />
		),
	},
	{
		id: "magic-link",
		name: "Magic Link",
		description: "Sent when a user requests a passwordless sign-in link",
		component: (
			<MagicLinkEmail magicLinkUrl="https://aistack.to/auth/magic?token=example123" />
		),
	},
	{
		id: "reset-password",
		name: "Reset Password",
		description: "Sent when a user requests to reset their password",
		component: (
			<ResetPasswordEmail resetUrl="https://aistack.to/reset?token=example123" />
		),
	},
];

function EmailPreviewCard({ template }: { template: EmailTemplate }) {
	const [expanded, setExpanded] = useState(false);
	const [viewMode, setViewMode] = useState<ViewMode>("preview");
	const [htmlContent, setHtmlContent] = useState<string>("");
	const [loading, setLoading] = useState(false);

	const handleExpand = async () => {
		if (!expanded && !htmlContent) {
			setLoading(true);
			try {
				const html = await render(template.component);
				setHtmlContent(html);
			} catch (error) {
				console.error("Failed to render email:", error);
			}
			setLoading(false);
		}
		setExpanded(!expanded);
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
						<Mail className="size-5 text-accent-lime" />
					</div>
					<div>
						<h3 className="font-mono text-sm font-semibold text-fg-primary">
							{template.name}
						</h3>
						<p className="font-mono text-xs text-fg-muted">
							{template.description}
						</p>
					</div>
				</div>
				{expanded ? (
					<ChevronUp className="size-5 text-fg-muted" />
				) : (
					<ChevronDown className="size-5 text-fg-muted" />
				)}
			</button>

			{expanded && (
				<div className="border-t border-stroke-subtle">
					<div className="flex items-center gap-2 border-b border-stroke-subtle bg-bg-panel-muted px-4 py-2">
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

					<div className="p-4">
						{loading ? (
							<div className="flex items-center justify-center py-12">
								<span className="font-mono text-sm text-fg-muted">
									Rendering...
								</span>
							</div>
						) : viewMode === "preview" ? (
							<div className="mx-auto max-w-[600px] overflow-hidden rounded-lg border border-stroke-subtle bg-white shadow-md">
								<iframe
									srcDoc={htmlContent}
									title={`${template.name} Preview`}
									className="h-[500px] w-full border-0"
									sandbox="allow-same-origin"
								/>
							</div>
						) : (
							<div className="relative">
								<pre className="max-h-[400px] overflow-auto rounded border border-stroke-subtle bg-bg-shell p-4 font-mono text-xs text-fg-secondary">
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

export function EmailPreviewCenter() {
	return (
		<section className="pb-12 sm:pb-16">
			<div className="mx-auto max-w-6xl px-4 sm:px-6">
				<div className="mb-8 flex items-center gap-3">
					<Mail className="size-8 text-accent-lime" />
					<h2 className="text-2xl font-bold tracking-tight text-fg-primary sm:text-3xl">
						Email Templates
					</h2>
				</div>

				<p className="mb-6 font-mono text-sm text-fg-muted">
					Preview all email templates with the current branding. Click to expand
					and view the rendered HTML.
				</p>

				<div className="space-y-4">
					{EMAIL_TEMPLATES.map((template) => (
						<EmailPreviewCard key={template.id} template={template} />
					))}
				</div>
			</div>
		</section>
	);
}
