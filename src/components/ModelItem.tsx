import { Brain } from "lucide-react";
import { ItemIcon } from "@/components/ItemIcon";

export interface ModelItemData {
	_id: string;
	name: string;
	slug: string;
	provider: string;
	category: string;
	iconUrl?: string;
	role: "primary" | "secondary" | "specialized";
}

interface ModelItemProps {
	model: ModelItemData;
}

export function ModelItem({ model }: ModelItemProps) {
	return (
		<div className="border border-stroke-subtle p-3 hover:border-stroke-strong transition-colors">
			<div className="flex items-center gap-3">
				<ItemIcon
					src={model.iconUrl}
					alt={model.name}
					size="sm"
					fallbackIcon={Brain}
				/>
				<div className="flex-1 min-w-0">
					<span className="font-mono text-sm font-semibold text-fg-primary block">
						{model.name}
					</span>
					<span className="font-mono text-[10px] text-fg-muted uppercase tracking-wider">
						{model.provider}
					</span>
				</div>
			</div>
		</div>
	);
}
