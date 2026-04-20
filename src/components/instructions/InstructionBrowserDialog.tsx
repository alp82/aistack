import { Dialog } from "@/components/ui/Dialog";
import {
	InstructionBrowser,
	type InstructionBrowserProps,
} from "./InstructionBrowser";

export interface InstructionBrowserDialogProps extends InstructionBrowserProps {
	open: boolean;
	onClose: () => void;
	title?: string;
}

export function InstructionBrowserDialog({
	open,
	onClose,
	title = "Instruction Files",
	...props
}: InstructionBrowserDialogProps) {
	return (
		<Dialog
			open={open}
			onClose={onClose}
			title={title}
			size="lg"
			padding="p-0"
			scrollable
		>
			<InstructionBrowser {...props} />
		</Dialog>
	);
}
