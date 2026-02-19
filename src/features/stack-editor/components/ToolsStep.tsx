import { useState } from "react";
import { ChevronDown, ChevronUp, Package } from "lucide-react";
import { ToolPicker, type ToolSubscriptionEntry } from "@/components/ToolPicker";
import { BundlePicker, type BundleSubscriptionEntry } from "@/components/BundlePicker";
import { cn } from "@/lib/utils";

type ToolsStepProps = {
	toolSubscriptions: ToolSubscriptionEntry[];
	onToolsChange: (tools: ToolSubscriptionEntry[]) => void;
	bundleSubscriptions: BundleSubscriptionEntry[];
	onBundlesChange: (bundles: BundleSubscriptionEntry[]) => void;
};

function ToolsStep({
	toolSubscriptions,
	onToolsChange,
	bundleSubscriptions,
	onBundlesChange,
}: ToolsStepProps) {
	const [showBundles, setShowBundles] = useState(bundleSubscriptions.length > 0);

	return (
		<div className="space-y-8">
			<div className="border-b border-stroke-subtle pb-6">
				<p className="mb-2 font-mono text-[10px] uppercase tracking-widest text-accent-lime">
					// Step 02
				</p>
				<h2 className="text-2xl font-black uppercase tracking-tight text-fg-primary">
					Tools & Bundles
				</h2>
				<p className="mt-2 text-sm text-fg-muted">
					Add the AI tools and bundles you use in your stack.
				</p>
			</div>

			<div className="space-y-8">
				<div>
					<div className="mb-4 flex items-center justify-between">
						<h3 className="font-mono text-xs uppercase tracking-wider text-fg-primary">
							Tools
						</h3>
						<span className="font-mono text-[10px] text-fg-muted">
							{toolSubscriptions.length} selected
						</span>
					</div>
					<ToolPicker value={toolSubscriptions} onChange={onToolsChange} />
				</div>

				{/* Bundles Toggle */}
				<div className="border-t border-stroke-subtle pt-6">
					<button
						type="button"
						onClick={() => setShowBundles(!showBundles)}
						className={cn(
							"flex w-full items-center justify-between border-2 p-4 transition-all",
							showBundles
								? "border-accent-lime bg-accent-lime/5"
								: "border-stroke-subtle bg-transparent hover:border-fg-muted",
						)}
					>
						<div className="flex items-center gap-3">
							<Package className={cn("size-5", showBundles ? "text-accent-lime" : "text-fg-muted")} />
							<div className="text-left">
								<p className={cn("font-mono text-xs uppercase tracking-wider", showBundles ? "text-accent-lime" : "text-fg-muted")}>
									Bundles
								</p>
								<p className="font-mono text-[10px] text-fg-muted">
									{showBundles
										? `${bundleSubscriptions.length} bundle${bundleSubscriptions.length !== 1 ? "s" : ""} selected`
										: "Click to add bundled subscriptions (optional)"}
								</p>
							</div>
						</div>
						{showBundles ? (
							<ChevronUp className="size-5 text-accent-lime" />
						) : (
							<ChevronDown className="size-5 text-fg-muted" />
						)}
					</button>

					{showBundles && (
						<div className="mt-4">
							<BundlePicker value={bundleSubscriptions} onChange={onBundlesChange} />
						</div>
					)}
				</div>
			</div>
		</div>
	);
}

export { ToolsStep };
export type { ToolsStepProps };
