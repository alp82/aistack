"use client";

import {
	motion,
	AnimatePresence,
	useMotionValue,
	useSpring,
	useTransform,
} from "motion/react";
import { useState, useRef, useCallback, useEffect } from "react";
import { cn } from "@/lib/utils";

export interface HoverTarget {
	/** The text to highlight and make interactive */
	text: string;
	/** URL of the image to display on hover */
	imageUrl: string;
	/** Optional URL to navigate to on click */
	linkUrl?: string;
	/** Optional alt text for the image */
	altText?: string;
}

/** Shared animation and positioning options */
interface HoverCardBaseProps {
	/** Position of the preview relative to the trigger */
	position?: "above" | "below" | "left" | "right";
	/** Enter animation duration in seconds */
	enterSpeed?: number;
	/** Exit animation duration in seconds */
	exitSpeed?: number;
	/** Maximum rotation angle for the preview (in degrees) */
	maxRotation?: number;
	/** Maximum offset for preview movement (in pixels) */
	maxOffset?: number;
	/** Preview width in pixels */
	width?: number;
	/** Preview height in pixels (auto for content mode) */
	height?: number | "auto";
	/** Additional CSS classes for the container */
	className?: string;
	/** Offset/spacing from trigger element */
	offset?: number;
}

/** Props for inline text mode with multiple targets */
interface HoverCardInlineProps extends HoverCardBaseProps {
	mode: "inline";
	/** Text content with placeholders for targets (use {0}, {1}, etc.) */
	content: string;
	/** Array of target configurations */
	targets: HoverTarget[];
	/** Callback when a target is clicked */
	onTargetClick?: (target: HoverTarget, index: number) => void;
	/** Additional CSS classes for target text */
	targetClassName?: string;
	/** Padding around target text to expand hover area (in pixels) */
	targetPadding?: number;
	/** Image border radius */
	imageBorderRadius?: string;
	/** Show shadow on image */
	showImageShadow?: boolean;
}

/** Props for wrapper mode with custom content */
interface HoverCardWrapperProps extends HoverCardBaseProps {
	mode: "wrapper";
	/** Children to wrap as the hover trigger */
	children: React.ReactNode;
	/** Content to render in the hover preview */
	renderContent: () => React.ReactNode;
	/** Additional CSS classes for the content wrapper */
	contentClassName?: string;
}

export type HoverCardProps = HoverCardInlineProps | HoverCardWrapperProps;

const HoverCard = (props: HoverCardProps) => {
	const {
		position = "below",
		enterSpeed = 0.2,
		exitSpeed = 0.15,
		maxRotation = 12,
		maxOffset = 15,
		width = 240,
		height = 200,
		className,
		offset = 24,
	} = props;

	const [isVisible, setIsVisible] = useState(false);
	const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
	const triggerRef = useRef<HTMLDivElement>(null);
	const targetRefs = useRef<(HTMLSpanElement | null)[]>([]);
	const hideTimeoutRef = useRef<NodeJS.Timeout | null>(null);

	// Preload images for inline mode
	useEffect(() => {
		if (props.mode === "inline") {
			props.targets.forEach((target) => {
				const img = new Image();
				img.src = target.imageUrl;
			});
		}
	}, [props]);

	// Motion values for smooth cursor tracking and rotation
	const cursorX = useMotionValue(0);
	const cursorY = useMotionValue(0);
	const rotation = useMotionValue(0);
	const offsetX = useMotionValue(0);
	const offsetY = useMotionValue(0);

	const smoothCursorX = useSpring(cursorX, { stiffness: 250, damping: 20 });
	const smoothCursorY = useSpring(cursorY, { stiffness: 250, damping: 20 });
	const smoothRotation = useSpring(rotation, { stiffness: 150, damping: 15 });
	const smoothOffsetX = useSpring(offsetX, { stiffness: 150, damping: 15 });
	const smoothOffsetY = useSpring(offsetY, { stiffness: 150, damping: 15 });

	const previewWidth = typeof width === "number" ? width : 280;
	const previewHeight = height === "auto" ? 240 : (height as number);

	const finalX = useTransform(() => {
		const cx = smoothCursorX.get();
		const ox = smoothOffsetX.get();
		let x: number;
		switch (position) {
			case "left":
				x = cx - previewWidth - offset + ox;
				break;
			case "right":
				x = cx + offset + ox;
				break;
			case "above":
			case "below":
			default:
				x = cx - previewWidth / 2 + ox;
		}
		// Clamp to viewport horizontally
		const padding = 16;
		return Math.max(
			padding,
			Math.min(x, window.innerWidth - previewWidth - padding),
		);
	});

	const finalY = useTransform(() => {
		const cy = smoothCursorY.get();
		const oy = smoothOffsetY.get();
		let y: number;
		switch (position) {
			case "above":
				y = cy - previewHeight - offset + oy;
				break;
			case "below":
				y = cy + offset + oy;
				break;
			case "left":
			case "right":
			default:
				y = cy - previewHeight / 2 + oy;
		}
		// Clamp to viewport vertically
		const padding = 16;
		return Math.max(
			padding,
			Math.min(y, window.innerHeight - previewHeight - padding),
		);
	});

	const handleMouseEnter = useCallback(
		(event: React.MouseEvent<HTMLElement>, index?: number) => {
			if (hideTimeoutRef.current) {
				clearTimeout(hideTimeoutRef.current);
				hideTimeoutRef.current = null;
			}

			const isFirstHover = !isVisible;

			if (isFirstHover) {
				cursorX.jump(event.clientX);
				cursorY.jump(event.clientY);
				smoothCursorX.jump(event.clientX);
				smoothCursorY.jump(event.clientY);
				rotation.jump(0);
				smoothRotation.jump(0);
				offsetX.jump(0);
				smoothOffsetX.jump(0);
				offsetY.jump(0);
				smoothOffsetY.jump(0);
			}

			if (index !== undefined) {
				setHoveredIndex(index);
			}
			setIsVisible(true);
		},
		[
			isVisible,
			cursorX,
			cursorY,
			smoothCursorX,
			smoothCursorY,
			rotation,
			smoothRotation,
			offsetX,
			smoothOffsetX,
			offsetY,
			smoothOffsetY,
		],
	);

	const handleMouseMove = useCallback(
		(event: React.MouseEvent<HTMLElement>, index?: number) => {
			if (props.mode === "inline" && hoveredIndex !== index) return;

			const currentX = event.clientX;
			const currentY = event.clientY;
			cursorX.set(currentX);
			cursorY.set(currentY);

			const target = event.currentTarget;
			const rect = target.getBoundingClientRect();

			const centerX = rect.left + rect.width / 2;
			const centerY = rect.top + rect.height / 2;
			const deltaX = currentX - centerX;
			const deltaY = currentY - centerY;

			const rot = Math.max(
				-maxRotation,
				Math.min(maxRotation, (deltaX / rect.width) * maxRotation * 2),
			);

			const offX = Math.max(
				-maxOffset,
				Math.min(maxOffset, (deltaX / rect.width) * maxOffset * 2),
			);
			const offY = Math.max(
				-maxOffset,
				Math.min(maxOffset, (deltaY / rect.height) * maxOffset * 2),
			);

			rotation.set(rot);
			offsetX.set(offX);
			offsetY.set(offY);
		},
		[
			props.mode,
			hoveredIndex,
			maxRotation,
			maxOffset,
			cursorX,
			cursorY,
			rotation,
			offsetX,
			offsetY,
		],
	);

	const handleMouseLeave = useCallback(() => {
		hideTimeoutRef.current = setTimeout(() => {
			setHoveredIndex(null);
			setIsVisible(false);
		}, 50);
	}, []);

	const handleClick = useCallback(
		(target: HoverTarget, index: number) => {
			if (props.mode === "inline") {
				if (props.onTargetClick) {
					props.onTargetClick(target, index);
				} else if (target.linkUrl) {
					window.open(target.linkUrl, "_blank", "noopener,noreferrer");
				}
			}
		},
		[props],
	);

	// Render inline mode content (text with placeholders)
	const renderInlineContent = () => {
		if (props.mode !== "inline") return null;

		const { content, targets, targetClassName, targetPadding = 4 } = props;
		const parts: (string | React.ReactElement)[] = [];
		let lastIndex = 0;

		const placeholderRegex = /\{(\d+)\}/g;
		let match;

		while ((match = placeholderRegex.exec(content)) !== null) {
			const placeholderIndex = parseInt(match[1], 10);

			if (match.index > lastIndex) {
				parts.push(content.slice(lastIndex, match.index));
			}

			if (targets[placeholderIndex]) {
				const target = targets[placeholderIndex];
				parts.push(
					<span
						key={`target-${placeholderIndex}`}
						ref={(el) => {
							targetRefs.current[placeholderIndex] = el;
						}}
						onMouseEnter={(e) => handleMouseEnter(e, placeholderIndex)}
						onMouseMove={(e) => handleMouseMove(e, placeholderIndex)}
						onMouseLeave={handleMouseLeave}
						onClick={() => handleClick(target, placeholderIndex)}
						className={cn(
							"relative cursor-pointer transition-colors",
							targetClassName,
						)}
						style={{
							padding: `${targetPadding}px`,
							margin: `-${targetPadding}px`,
						}}
					>
						{target.text}
					</span>,
				);
			}

			lastIndex = match.index + match[0].length;
		}

		if (lastIndex < content.length) {
			parts.push(content.slice(lastIndex));
		}

		return parts;
	};

	// Render preview content based on mode
	const renderPreviewContent = () => {
		if (props.mode === "inline") {
			const {
				targets,
				imageBorderRadius = "0.75rem",
				showImageShadow = true,
			} = props;
			if (hoveredIndex === null || !targets[hoveredIndex]) return null;

			return (
				<motion.div
					key={`image-${hoveredIndex}`}
					initial={{ opacity: 0, scale: 0.95 }}
					animate={{ opacity: 1, scale: 1 }}
					exit={{ opacity: 0, scale: 0.95 }}
					transition={{ duration: 0.2, ease: "easeInOut" }}
					className="absolute top-0 left-0 w-full h-full"
				>
					<img
						src={targets[hoveredIndex].imageUrl}
						alt={targets[hoveredIndex].altText || targets[hoveredIndex].text}
						width={previewWidth}
						height={previewHeight}
						className={cn("object-cover", showImageShadow && "shadow-2xl")}
						style={{
							borderRadius: imageBorderRadius,
							width: previewWidth,
							height: previewHeight,
						}}
					/>
				</motion.div>
			);
		}

		// Wrapper mode - render custom content
		return (
			<motion.div
				key="content"
				initial={{ opacity: 0, scale: 0.95 }}
				animate={{ opacity: 1, scale: 1 }}
				exit={{ opacity: 0, scale: 0.95 }}
				transition={{ duration: 0.2, ease: "easeInOut" }}
				className={cn("w-full", props.contentClassName)}
			>
				{props.renderContent()}
			</motion.div>
		);
	};

	// Wrapper mode render
	if (props.mode === "wrapper") {
		return (
			<div className={cn("relative inline-block", className)}>
				<div
					ref={triggerRef}
					onMouseEnter={(e) => handleMouseEnter(e)}
					onMouseMove={(e) => handleMouseMove(e)}
					onMouseLeave={handleMouseLeave}
				>
					{props.children}
				</div>

				<motion.div
					initial={{ opacity: 0, scale: 0.85 }}
					animate={{
						opacity: isVisible ? 1 : 0,
						scale: isVisible ? 1 : 0.85,
					}}
					transition={{
						duration: isVisible ? enterSpeed : exitSpeed,
						ease: isVisible ? "easeOut" : "easeIn",
					}}
					style={{
						position: "fixed",
						left: 0,
						top: 0,
						x: finalX,
						y: finalY,
						width,
						height: height === "auto" ? "auto" : height,
						rotate: smoothRotation,
						pointerEvents: "none",
						zIndex: 9999,
						willChange: "transform, opacity",
					}}
				>
					<AnimatePresence mode="popLayout" initial={false}>
						{isVisible && renderPreviewContent()}
					</AnimatePresence>
				</motion.div>
			</div>
		);
	}

	// Inline mode render
	return (
		<div className={cn("relative", className)}>
			{renderInlineContent()}

			<motion.div
				initial={{ opacity: 0, scale: 0.85 }}
				animate={{
					opacity: isVisible ? 1 : 0,
					scale: isVisible ? 1 : 0.85,
				}}
				transition={{
					duration: isVisible ? enterSpeed : exitSpeed,
					ease: isVisible ? "easeOut" : "easeIn",
				}}
				style={{
					position: "fixed",
					left: 0,
					top: 0,
					x: finalX,
					y: finalY,
					width: previewWidth,
					height: previewHeight,
					rotate: smoothRotation,
					pointerEvents: "none",
					zIndex: 9999,
					willChange: "transform, opacity",
				}}
			>
				<AnimatePresence mode="popLayout" initial={false}>
					{hoveredIndex !== null && renderPreviewContent()}
				</AnimatePresence>
			</motion.div>
		</div>
	);
};

HoverCard.displayName = "HoverCard";

export default HoverCard;
