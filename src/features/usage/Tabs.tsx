import { cn } from "@/lib/utils";
import type { Group } from "./items";

/** The five tabs under the top block, each with its item count. */
export function Tabs({
	groups,
	counts,
	value,
	onChange,
}: {
	groups: readonly Group[];
	counts: (group: Group) => number;
	value: string;
	onChange: (id: string) => void;
}) {
	return (
		<div
			role="tablist"
			className="mt-12 flex flex-wrap border-b border-stroke-strong"
		>
			{groups.map((group) => {
				const on = value === group.id;
				return (
					<button
						key={group.id}
						type="button"
						role="tab"
						aria-selected={on}
						onClick={() => onChange(group.id)}
						className={cn(
							"-mb-px flex items-baseline gap-2 border-b-2 px-4 py-3 font-mono text-xs uppercase tracking-widest",
							on
								? "border-accent-lime text-fg-primary"
								: "border-transparent text-fg-muted hover:text-fg-primary",
						)}
					>
						{group.label}
						<span data-testid="tab-count" className="text-[10px] text-fg-muted">
							{counts(group)}
						</span>
					</button>
				);
			})}
		</div>
	);
}
