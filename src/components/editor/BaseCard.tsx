import { NodeViewWrapper } from "@tiptap/react";
import { Minimize2 } from "lucide-react";
import {
	type ReactNode,
	useEffect,
	useLayoutEffect,
	useRef,
	useState,
} from "react";
import HoverPreview from "@/components/ui/hover-preview";
import { autoResize } from "./autoResize";

interface BaseCardProps {
	accentColorClass: string;
	icon: ReactNode;
	name: string;
	nameEditable?: boolean;
	onNameChange?: (name: string) => void;
	description: string;
	isEditable: boolean;
	selected?: boolean;
	onDescriptionChange?: (value: string) => void;
	onCollapse?: () => void;
	tooltipContent: () => ReactNode;
	cardId: string;
	actionButtons?: ReactNode;
	children?: ReactNode;
}

export function BaseCard({
	accentColorClass,
	icon,
	name,
	nameEditable,
	onNameChange,
	description,
	isEditable,
	selected,
	onDescriptionChange,
	onCollapse,
	tooltipContent,
	cardId,
	actionButtons,
	children,
}: BaseCardProps) {
	const [draftDescription, setDraftDescription] = useState(description);
	const [editingName, setEditingName] = useState(false);
	const [draftName, setDraftName] = useState(name);
	const textareaRef = useRef<HTMLTextAreaElement>(null);

	useEffect(() => {
		setDraftDescription(description);
	}, [description]);

	useEffect(() => {
		setDraftName(name);
	}, [name]);

	const handleNameCommit = () => {
		const newName = draftName.trim() || name;
		setEditingName(false);
		if (newName !== name) {
			onNameChange?.(newName);
		}
	};

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
						<HoverPreview
							mode="wrapper"
							position="above"
							width={300}
							height="auto"
							offset={8}
							maxRotation={3}
							maxOffset={5}
							renderContent={tooltipContent}
						>
							<div className="flex min-w-0 flex-1 items-center gap-3">
								<div className="flex size-5 shrink-0 items-center justify-center">
									{icon}
								</div>
								{nameEditable && editingName ? (
									<input
										type="text"
										value={draftName}
										onChange={(e) => setDraftName(e.target.value)}
										onBlur={handleNameCommit}
										onKeyDown={(e) => {
											e.stopPropagation();
											if (e.key === "Enter") handleNameCommit();
											if (e.key === "Escape") {
												setDraftName(name);
												setEditingName(false);
											}
										}}
										autoFocus
										className="min-w-0 flex-1 border-0 bg-transparent font-mono text-xs font-bold text-fg-primary focus:outline-none focus:ring-0"
									/>
								) : (
									<span
										className={`truncate font-mono text-xs font-bold text-fg-primary ${nameEditable ? "cursor-pointer hover:text-accent-lime" : ""}`}
										onClick={() => nameEditable && setEditingName(true)}
									>
										{name}
									</span>
								)}
							</div>
						</HoverPreview>

						<div className="flex shrink-0 items-center gap-1 opacity-0 transition-opacity group-hover/card:opacity-100">
							{actionButtons}
							{isEditable && onCollapse && (
								<button
									type="button"
									onClick={onCollapse}
									title="Collapse to inline"
									className="flex cursor-pointer items-center p-1 text-fg-muted transition-colors hover:text-fg-primary"
								>
									<Minimize2 className="size-3" />
								</button>
							)}
						</div>
					</div>

					{/* Description */}
					{showDescription && (
						<div className="px-3 pb-2" onMouseDown={(e) => e.stopPropagation()}>
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
