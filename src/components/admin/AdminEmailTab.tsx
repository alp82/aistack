import { useState } from "react";
import { Mail, Radio } from "lucide-react";
import { EmailTemplatesSection } from "./EmailTemplatesSection";
import { EmailBroadcastsSection } from "./EmailBroadcastsSection";

type EmailSubTab = "templates" | "broadcasts";

export function AdminEmailTab() {
	const [activeSubTab, setActiveSubTab] = useState<EmailSubTab>("templates");

	return (
		<div className="py-12 sm:py-16">
			<div className="mx-auto max-w-6xl px-4 sm:px-6">
				{/* Sub-tab navigation */}
				<div className="mb-8 flex items-center gap-2 border-b-2 border-stroke-subtle">
					<button
						type="button"
						onClick={() => setActiveSubTab("templates")}
						className={`inline-flex items-center gap-2 border-b-2 px-4 py-3 font-mono text-sm font-semibold uppercase tracking-wide transition-colors -mb-[2px] ${
							activeSubTab === "templates"
								? "border-accent-lime text-accent-lime"
								: "border-transparent text-fg-muted hover:text-fg-primary"
						}`}
					>
						<Mail className="size-4" />
						Templates
					</button>
					<button
						type="button"
						onClick={() => setActiveSubTab("broadcasts")}
						className={`inline-flex items-center gap-2 border-b-2 px-4 py-3 font-mono text-sm font-semibold uppercase tracking-wide transition-colors -mb-[2px] ${
							activeSubTab === "broadcasts"
								? "border-accent-lime text-accent-lime"
								: "border-transparent text-fg-muted hover:text-fg-primary"
						}`}
					>
						<Radio className="size-4" />
						Broadcasts
					</button>
				</div>

				{/* Sub-tab content */}
				{activeSubTab === "templates" ? (
					<EmailTemplatesSection />
				) : (
					<EmailBroadcastsSection />
				)}
			</div>
		</div>
	);
}
