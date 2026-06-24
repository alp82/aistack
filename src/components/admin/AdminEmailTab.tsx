import { Mail, Radio } from "lucide-react";
import { EmailBroadcastsSection } from "./EmailBroadcastsSection";
import { EmailTemplatesSection } from "./EmailTemplatesSection";

export type EmailSubTab = "templates" | "broadcasts";

interface AdminEmailTabProps {
	view: EmailSubTab;
	onViewChange: (view: EmailSubTab) => void;
}

export function AdminEmailTab({ view, onViewChange }: AdminEmailTabProps) {
	return (
		<div className="py-12 sm:py-16">
			<div className="mx-auto max-w-6xl px-4 sm:px-6">
				{/* Sub-tab navigation */}
				<div className="mb-8 flex items-center gap-2 border-b-2 border-stroke-subtle">
					<button
						type="button"
						onClick={() => onViewChange("templates")}
						className={`inline-flex items-center gap-2 border-b-2 px-4 py-3 font-mono text-sm font-semibold uppercase tracking-wide transition-colors -mb-[2px] ${
							view === "templates"
								? "border-accent-lime text-accent-lime"
								: "border-transparent text-fg-muted hover:text-fg-primary"
						}`}
					>
						<Mail className="size-4" />
						Templates
					</button>
					<button
						type="button"
						onClick={() => onViewChange("broadcasts")}
						className={`inline-flex items-center gap-2 border-b-2 px-4 py-3 font-mono text-sm font-semibold uppercase tracking-wide transition-colors -mb-[2px] ${
							view === "broadcasts"
								? "border-accent-lime text-accent-lime"
								: "border-transparent text-fg-muted hover:text-fg-primary"
						}`}
					>
						<Radio className="size-4" />
						Broadcasts
					</button>
				</div>

				{/* Sub-tab content */}
				{view === "templates" ? (
					<EmailTemplatesSection />
				) : (
					<EmailBroadcastsSection />
				)}
			</div>
		</div>
	);
}
