import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Wrench, Brain, Package, X } from "lucide-react";
import { AddToolForm } from "./AddToolModal";
import { AddModelForm } from "./AddModelModal";
import { AddBundleForm } from "./AddBundleModal";

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

	if (!open) return null;

	return createPortal(
		<div className="fixed inset-0 z-50 flex items-center justify-center p-4">
			<div
				className="absolute inset-0 bg-bg-canvas/80 backdrop-blur-md"
				onClick={onClose}
				onKeyDown={(e) => e.key === "Escape" && onClose()}
			/>
			<div className="relative w-full max-w-4xl max-h-[90vh] overflow-y-auto border-2 border-stroke-strong bg-bg-panel shadow-[6px_6px_0_var(--stroke-strong)]">
				{/* Tab Bar */}
				<div className="flex items-center border-b border-stroke-subtle">
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
					<div className="ml-auto pr-3">
						<button
							type="button"
							onClick={onClose}
							className="flex size-8 shrink-0 items-center justify-center border border-stroke-subtle text-fg-muted transition-colors hover:border-accent-lime hover:text-accent-lime cursor-pointer"
						>
							<X className="size-4" />
						</button>
					</div>
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
			</div>
		</div>,
		document.body,
	);
}
