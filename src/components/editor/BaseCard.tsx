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
	accentColorClass: string;
	headerContent: ReactNode;
	description: string;
	isEditable: boolean;
	selected?: boolean;
	onDescriptionChange?: (value: string) => void;
	cardId: string;
	children?: ReactNode;
}

export function BaseCard({
	accentColorClass,
	headerContent,
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
	}, [draftDescription]);

	useEffect(() => {
		if (selected && isEditable) {
			textareaRef.current?.focus();
		}
	}, [selected]);

	const handleDescriptionChange = (value: string) => {
		setDraftDescription(value);
		onDescriptionChange?.(value);
	};

	const showDescription = isEditable || draftDescription.trim();

	return (
		<NodeViewWrapper
			as="div"
			className="my-3"
			data-card-id={cardId}
			contentEditable={false}
		>
			<div className="group/card flex">
				{/* Accent stripe */}
				<div className={`w-[4px] shrink-0 ${accentColorClass}`} />

				<div className="min-w-0 flex-1">
					{/* Header row */}
					<div className="flex items-center gap-3 px-3 py-2">
						<div className="flex min-w-0 flex-1 items-center">
							{headerContent}
						</div>
					</div>

					{/* Description */}
					{showDescription && (
						<div
							className="px-3 pb-2"
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
									className="w-full resize-none overflow-hidden border-0 bg-transparent font-mono text-xs leading-relaxed text-fg-muted placeholder:text-fg-muted/40 focus:outline-none focus:ring-0"
								/>
							) : (
								<p className="m-0 whitespace-pre-wrap font-mono text-xs leading-relaxed text-fg-muted">
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
