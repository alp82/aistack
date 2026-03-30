import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { InstructionPanel } from "@/components/InstructionPanel";
import { useEditorContext } from "@/features/stack-editor/context/EditorContext";
import type { InstructionItem } from "@/features/stack-editor/types";

interface MobileInstructionOverlayProps {
	instructions: InstructionItem[];
	onInstructionsChange: (instructions: InstructionItem[]) => void;
}

export function MobileInstructionOverlay({
	instructions,
	onInstructionsChange,
}: MobileInstructionOverlayProps) {
	const {
		editInstructionRequest,
		setEditInstructionRequest,
		removeInstructionFromEditor,
	} = useEditorContext();
	const [editingInstruction, setEditingInstruction] =
		useState<InstructionItem | null>(null);
	const [isOpen, setIsOpen] = useState(false);

	useEffect(() => {
		if (editInstructionRequest) {
			const inst = instructions.find((i) => i.name === editInstructionRequest);
			if (inst) {
				setEditingInstruction(inst);
				setIsOpen(true);
			}
			setEditInstructionRequest(null);
		}
	}, [editInstructionRequest, instructions, setEditInstructionRequest]);

	const handleSave = useCallback(
		(updated: InstructionItem) => {
			if (editingInstruction) {
				const idx = instructions.findIndex(
					(i) =>
						i.name === editingInstruction.name &&
						i.type === editingInstruction.type,
				);
				if (idx >= 0) {
					const next = [...instructions];
					next[idx] = updated;
					onInstructionsChange(next);
				}
			}
			setIsOpen(false);
			setEditingInstruction(null);
		},
		[editingInstruction, instructions, onInstructionsChange],
	);

	const handleDelete = useCallback(() => {
		if (editingInstruction) {
			const filtered = instructions.filter(
				(i) =>
					!(
						i.name === editingInstruction.name &&
						i.type === editingInstruction.type
					),
			);
			removeInstructionFromEditor(editingInstruction.name);
			onInstructionsChange(filtered);
		}
		setIsOpen(false);
		setEditingInstruction(null);
	}, [
		editingInstruction,
		instructions,
		onInstructionsChange,
		removeInstructionFromEditor,
	]);

	const handleBack = useCallback(() => {
		setIsOpen(false);
		setEditingInstruction(null);
	}, []);

	return (
		<AnimatePresence>
			{isOpen && (
				<motion.div
					initial={{ y: "100%" }}
					animate={{ y: 0 }}
					exit={{ y: "100%" }}
					transition={{ duration: 0.3, ease: "easeInOut" }}
					className="fixed inset-0 z-50 overflow-y-auto bg-bg-panel lg:hidden"
				>
					<div className="sticky top-0 z-10 flex items-center justify-between border-b border-stroke-subtle bg-bg-panel p-4">
						<p className="font-mono text-[10px] uppercase tracking-widest text-accent-lime">
							{"// EDIT INSTRUCTION"}
						</p>
						<button
							type="button"
							onClick={handleBack}
							className="flex size-8 items-center justify-center border border-stroke-subtle text-fg-muted transition-colors hover:border-accent-lime hover:text-accent-lime"
						>
							<X className="size-4" />
						</button>
					</div>
					<InstructionPanel
						instruction={editingInstruction}
						onSave={handleSave}
						onDelete={handleDelete}
						onBack={handleBack}
					/>
				</motion.div>
			)}
		</AnimatePresence>
	);
}
