import { useEffect, useState } from "react";
import { Wrench, Brain, Package } from "lucide-react";
import { AddToolForm } from "./AddToolModal";
import { AddModelForm } from "./AddModelModal";
import { AddBundleForm } from "./AddBundleModal";
import { Dialog } from "./ui/Dialog";

export type AddItemTab = "tool" | "model" | "bundle";

interface AddItemModalProps {
	open: boolean;
	onClose: () => void;
	defaultTab?: AddItemTab;
	onToolCreated?: (toolId: string) => void;
	onModelCreated?: (modelId: string) => void;
	onBundleCreated?: (bundleId: string) => void;
}

const tabs: { key: AddItemTab; label: string; icon: React.ReactNode }[] = [
	{ key: "tool", label: "Tool", icon: <Wrench className="size-3.5" /> },
	{ key: "model", label: "Model", icon: <Brain className="size-3.5" /> },
	{ key: "bundle", label: "Bundle", icon: <Package className="size-3.5" /> },
];

export function AddItemModal({
	open,
	onClose,
	defaultTab = "tool",
	onToolCreated,
	onModelCreated,
	onBundleCreated,
}: AddItemModalProps) {
	const [activeTab, setActiveTab] = useState<AddItemTab>(defaultTab);

	useEffect(() => {
		if (open) setActiveTab(defaultTab);
	}, [open, defaultTab]);

	return (
		<Dialog open={open} onClose={onClose} size="lg" scrollable padding="p-0">
			{/* Tab Bar */}
			<div className="flex items-center border-b border-stroke-subtle pt-12">
				{tabs.map((tab) => (
					<button
						key={tab.key}
						type="button"
						onClick={() => setActiveTab(tab.key)}
						className={`flex items-center gap-2 px-6 py-3 font-mono text-xs font-semibold uppercase tracking-wider transition-colors cursor-pointer ${
							activeTab === tab.key
								? "border-b-2 border-accent-lime text-accent-lime bg-bg-panel"
								: "text-fg-muted hover:text-fg-primary hover:bg-bg-panel-muted"
						}`}
					>
						{tab.icon}
						{tab.label}
					</button>
				))}
			</div>

			{/* Tab Content */}
			<div className="p-8">
				{activeTab === "tool" && (
					<AddToolForm
						onCancel={onClose}
						onToolCreated={(toolId) => {
							onToolCreated?.(toolId);
							onClose();
						}}
					/>
				)}
				{activeTab === "model" && (
					<AddModelForm
						onCancel={onClose}
						onModelCreated={(modelId) => {
							onModelCreated?.(modelId);
							onClose();
						}}
					/>
				)}
				{activeTab === "bundle" && (
					<AddBundleForm
						onCancel={onClose}
						onBundleCreated={(bundleId) => {
							onBundleCreated?.(bundleId);
							onClose();
						}}
					/>
				)}
			</div>
		</Dialog>
	);
}
