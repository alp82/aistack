import { NodeViewWrapper } from "@tiptap/react";
import {
	type ReactNode,
	useEffect,
	useLayoutEffect,
	useRef,
	useState,
} from "react";
import { autoResize } from "./autoResize";

interface BaseCardProps {
	icon: ReactNode;
	iconBgClass: string;
	borderClass?: string;
	headerContent: ReactNode;
	metadataSlot?: ReactNode;
	description: string;
	isEditable: boolean;
	selected?: boolean;
	onDescriptionChange?: (value: string) => void;
	cardId: string;
	children?: ReactNode;
}

export function BaseCard({
	icon,
	iconBgClass,
	borderClass,
	headerContent,
	metadataSlot,
	description,
	isEditable,
	selected,
	onDescriptionChange,
	cardId,
	children,
}: BaseCardProps) {
	const [draftDescription, setDraftDescription] = useState(description);
	const textareaRef = useRef<HTMLTextAreaElement>(null);

	useEffect(() => {
		setDraftDescription(description);
	}, [description]);

	useLayoutEffect(() => {
		if (textareaRef.current) autoResize(textareaRef.current);
	}, []);

	// Re-measure after mount in case layout wasn't complete during useLayoutEffect
	useEffect(() => {
		if (textareaRef.current) {
			requestAnimationFrame(() => {
				if (textareaRef.current) autoResize(textareaRef.current);
			});
		}
	}, []);

	useEffect(() => {
		if (selected && isEditable) {
			textareaRef.current?.focus();
		}
	}, [selected, isEditable]);

	const handleDescriptionChange = (value: string) => {
		setDraftDescription(value);
		onDescriptionChange?.(value);
	};

	const showDescription = isEditable || draftDescription.trim();

	return (
		<NodeViewWrapper as="div" className="my-3" contentEditable={false}>
			<div
				data-card-id={cardId}
				className={`group/card flex ${borderClass ? `border ${borderClass}` : ""}`}
			>
				{/* Icon column */}
				<div
					className={`w-12 shrink-0 flex items-center justify-center ${iconBgClass}`}
				>
					{icon}
				</div>

				<div className="min-w-0 flex-1">
					{/* Header row */}
					<div className="flex items-center gap-3 px-3 py-2">
						<div className="flex min-w-0 flex-1 items-center">
							{headerContent}
						</div>
						{metadataSlot && <div className="shrink-0">{metadataSlot}</div>}
					</div>

					{/* Description */}
					{showDescription && (
						<div
							className="px-3"
							onMouseDown={(e) => e.stopPropagation()}
							onClick={() => textareaRef.current?.focus()}
						>
							{isEditable ? (
								<textarea
									ref={textareaRef}
									value={draftDescription}
									onChange={(e) => {
										handleDescriptionChange(e.target.value);
										autoResize(e.target);
									}}
									onKeyDown={(e) => e.stopPropagation()}
									placeholder="Add a description..."
									rows={1}
									className="w-full resize-none overflow-hidden border-0 bg-transparent font-mono text-sm leading-relaxed text-fg-secondary placeholder:text-fg-muted/40 focus:outline-none focus:ring-0"
								/>
							) : (
								<p className="m-0 whitespace-pre-wrap text-sm leading-relaxed text-fg-secondary">
									{draftDescription}
								</p>
							)}
						</div>
					)}

					{/* Children slot (file list, etc.) */}
					{children}
				</div>
			</div>
		</NodeViewWrapper>
	);
}
