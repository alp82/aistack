import { Inbox, Mail, Rss, Tags } from "lucide-react";
import { NewsInboxSection } from "./NewsInboxSection";
import { NewsletterSection } from "./NewsletterSection";
import { NewsSourcesSection } from "./NewsSourcesSection";
import { NewsTopicsSection } from "./NewsTopicsSection";

export type NewsSubTab = "inbox" | "sources" | "topics" | "newsletter";

const SUB_TABS = [
	{ id: "inbox" as const, label: "Inbox", Icon: Inbox },
	{ id: "sources" as const, label: "Sources", Icon: Rss },
	{ id: "topics" as const, label: "Topics", Icon: Tags },
	{ id: "newsletter" as const, label: "Newsletter", Icon: Mail },
];

interface AdminNewsTabProps {
	view: NewsSubTab;
	onViewChange: (view: NewsSubTab) => void;
}

export function AdminNewsTab({ view, onViewChange }: AdminNewsTabProps) {
	return (
		<div className="py-12 sm:py-16">
			<div className="mx-auto max-w-6xl px-4 sm:px-6">
				<div className="mb-8 flex items-center gap-2 border-b-2 border-stroke-subtle">
					{SUB_TABS.map(({ id, label, Icon }) => (
						<button
							key={id}
							type="button"
							onClick={() => onViewChange(id)}
							className={`inline-flex items-center gap-2 border-b-2 px-4 py-3 font-mono text-sm font-semibold uppercase tracking-wide transition-colors -mb-[2px] ${
								view === id
									? "border-accent-lime text-accent-lime"
									: "border-transparent text-fg-muted hover:text-fg-primary"
							}`}
						>
							<Icon className="size-4" />
							{label}
						</button>
					))}
				</div>

				{view === "inbox" && <NewsInboxSection />}
				{view === "sources" && <NewsSourcesSection />}
				{view === "topics" && <NewsTopicsSection />}
				{view === "newsletter" && <NewsletterSection />}
			</div>
		</div>
	);
}
