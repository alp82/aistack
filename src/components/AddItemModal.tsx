import { useCallback, useEffect, useRef, useState } from "react";
import { Wrench, Brain, Package, FileText } from "lucide-react";
import { AddToolForm } from "./AddToolModal";
import { AddModelForm } from "./AddModelModal";
import { AddBundleForm } from "./AddBundleModal";
import { AddInstructionForm } from "./AddInstructionForm";
import { Dialog } from "./ui/Dialog";
import type { InstructionType } from "@/features/stack-editor/types";

export type AddItemTab = "tool" | "model" | "bundle" | "instruction";

interface AddItemModalProps {
	open: boolean;
	onClose: () => void;
	defaultTab?: AddItemTab;
	defaultInstructionType?: InstructionType;
	onToolCreated?: (toolId: string) => void;
	onModelCreated?: (modelId: string) => void;
	onBundleCreated?: (bundleId: string) => void;
	onInstructionCreated?: (instruction: {
		name: string;
		type: InstructionType;
		content?: string;
	}) => void;
}

const tabs: { key: AddItemTab; label: string; icon: React.ReactNode }[] = [
	{ key: "tool", label: "Tool", icon: <Wrench className="size-3.5" /> },
	{ key: "model", label: "Model", icon: <Brain className="size-3.5" /> },
	{ key: "bundle", label: "Bundle", icon: <Package className="size-3.5" /> },
	{
		key: "instruction",
		label: "Instruction",
		icon: <FileText className="size-3.5" />,
	},
];

export function AddItemModal({
	open,
	onClose,
	defaultTab = "tool",
	defaultInstructionType,
	onToolCreated,
	onModelCreated,
	onBundleCreated,
	onInstructionCreated,
}: AddItemModalProps) {
	const [activeTab, setActiveTab] = useState<AddItemTab>(defaultTab);
	const [formKey, setFormKey] = useState(0);
	const [addAnother, setAddAnother] = useState(false);
	const [lastCreatedMessage, setLastCreatedMessage] = useState<string | null>(
		null,
	);
	const addAnotherRef = useRef(addAnother);
	addAnotherRef.current = addAnother;

	useEffect(() => {
		if (open) {
			setActiveTab(defaultTab);
			setFormKey(0);
			setAddAnother(false);
			setLastCreatedMessage(null);
		}
	}, [open, defaultTab]);

	const handleCreated = useCallback(
		(type: "tool" | "model" | "bundle", id: string, name?: string) => {
			if (type === "tool") onToolCreated?.(id);
			else if (type === "model") onModelCreated?.(id);
			else if (type === "bundle") onBundleCreated?.(id);

			if (addAnotherRef.current) {
				setLastCreatedMessage(`${name || type} submitted for review.`);
				setFormKey((k) => k + 1);
			} else {
				onClose();
			}
		},
		[onToolCreated, onModelCreated, onBundleCreated, onClose],
	);

	const handleInstructionCreated = useCallback(
		(
			instruction: { name: string; type: InstructionType; content?: string },
			name?: string,
		) => {
			onInstructionCreated?.(instruction);

			if (addAnotherRef.current) {
				setLastCreatedMessage(`${name || "Instruction"} added.`);
				setFormKey((k) => k + 1);
			} else {
				onClose();
			}
		},
		[onInstructionCreated, onClose],
	);

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
				{lastCreatedMessage && (
					<div className="mb-4 border-2 border-accent-lime/30 bg-accent-lime/10 p-3 font-mono text-xs text-accent-lime">
						{lastCreatedMessage}
					</div>
				)}
				{activeTab === "tool" && (
					<AddToolForm
						key={formKey}
						onCancel={onClose}
						onToolCreated={(toolId: string, name?: string) => {
							handleCreated("tool", toolId, name);
						}}
					/>
				)}
				{activeTab === "model" && (
					<AddModelForm
						key={formKey}
						onCancel={onClose}
						onModelCreated={(modelId: string, name?: string) => {
							handleCreated("model", modelId, name);
						}}
					/>
				)}
				{activeTab === "bundle" && (
					<AddBundleForm
						key={formKey}
						onCancel={onClose}
						onBundleCreated={(bundleId: string, name?: string) => {
							handleCreated("bundle", bundleId, name);
						}}
					/>
				)}
				{activeTab === "instruction" && (
					<AddInstructionForm
						key={formKey}
						onCancel={onClose}
						onInstructionCreated={handleInstructionCreated}
						defaultType={defaultInstructionType}
					/>
				)}

				{/* Add another checkbox */}
				<div className="mt-4 flex items-center justify-end gap-2">
					<input
						type="checkbox"
						id="add-another"
						checked={addAnother}
						onChange={(e) => setAddAnother(e.target.checked)}
						className="size-3.5 accent-accent-lime"
					/>
					<label
						htmlFor="add-another"
						className="cursor-pointer font-mono text-xs text-fg-muted select-none"
					>
						Add another after saving
					</label>
				</div>
			</div>
		</Dialog>
	);
}
