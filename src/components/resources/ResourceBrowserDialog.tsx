import { Dialog } from "@/components/ui/Dialog";
import { ResourceBrowser, type ResourceBrowserProps } from "./ResourceBrowser";

export interface ResourceBrowserDialogProps extends ResourceBrowserProps {
	open: boolean;
	onClose: () => void;
	title?: string;
}

export function ResourceBrowserDialog({
	open,
	onClose,
	title = "Files",
	...props
}: ResourceBrowserDialogProps) {
	return (
		<Dialog
			open={open}
			onClose={onClose}
			title={title}
			size="lg"
			padding="p-0"
			scrollable
		>
			<ResourceBrowser {...props} />
		</Dialog>
	);
}
