"use client";

import {
	AnimatePresence,
	motion,
	useMotionValue,
	useSpring,
	useTransform,
} from "motion/react";
import { useCallback, useEffect, useRef, useState } from "react";
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

type Position = "above" | "below" | "left" | "right";

/** Shared animation and positioning options */
interface HoverCardBaseProps {
	/** Position of the preview relative to the trigger */
	position?: Position;
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

const SELF_TRANSLATE: Record<Position, string> = {
	below: "translate(-50%, 0)",
	above: "translate(-50%, -100%)",
	left: "translate(-100%, -50%)",
	right: "translate(0, -50%)",
};

function computeAnchor(
	rect: DOMRect,
	position: Position,
	offset: number,
): { x: number; y: number } {
	switch (position) {
		case "below":
			return { x: rect.left + rect.width / 2, y: rect.bottom + offset };
		case "above":
			return { x: rect.left + rect.width / 2, y: rect.top - offset };
		case "left":
			return { x: rect.left - offset, y: rect.top + rect.height / 2 };
		case "right":
			return { x: rect.right + offset, y: rect.top + rect.height / 2 };
	}
}

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

	// Anchor coords (the point on the trigger the card snaps to). Spring smooths
	// transitions between targets in inline mode.
	const anchorX = useMotionValue(0);
	const anchorY = useMotionValue(0);
	const smoothAnchorX = useSpring(anchorX, { stiffness: 350, damping: 30 });
	const smoothAnchorY = useSpring(anchorY, { stiffness: 350, damping: 30 });

	// Cursor-driven parallax: small rotation + offset added on top of the anchor.
	const rotation = useMotionValue(0);
	const offsetX = useMotionValue(0);
	const offsetY = useMotionValue(0);
	const smoothRotation = useSpring(rotation, { stiffness: 150, damping: 15 });
	const smoothOffsetX = useSpring(offsetX, { stiffness: 150, damping: 15 });
	const smoothOffsetY = useSpring(offsetY, { stiffness: 150, damping: 15 });

	const previewWidth = typeof width === "number" ? width : 280;

	const finalX = useTransform(() => smoothAnchorX.get() + smoothOffsetX.get());
	const finalY = useTransform(() => smoothAnchorY.get() + smoothOffsetY.get());

	const updateAnchorFromElement = useCallback(
		(el: HTMLElement | null, jump: boolean) => {
			if (!el) return;
			const rect = el.getBoundingClientRect();
			let { x, y } = computeAnchor(rect, position, offset);
			// Horizontal clamp for above/below: keep the card (centered on x) inside
			// the viewport. Falls back to centering when the trigger is comfortably
			// inside the viewport.
			if (position === "above" || position === "below") {
				const padding = 16;
				const halfWidth = previewWidth / 2;
				const minX = padding + halfWidth;
				const maxX = window.innerWidth - padding - halfWidth;
				if (maxX >= minX) {
					x = Math.max(minX, Math.min(x, maxX));
				}
			}
			anchorX.set(x);
			anchorY.set(y);
			if (jump) {
				smoothAnchorX.jump(x);
				smoothAnchorY.jump(y);
			}
		},
		[
			anchorX,
			anchorY,
			smoothAnchorX,
			smoothAnchorY,
			position,
			offset,
			previewWidth,
		],
	);

	const getCurrentAnchorElement = useCallback((): HTMLElement | null => {
		if (props.mode === "wrapper") return triggerRef.current;
		if (hoveredIndex !== null) return targetRefs.current[hoveredIndex];
		return null;
	}, [props.mode, hoveredIndex]);

	// Re-anchor on scroll / resize while visible so the card stays glued to the
	// trigger even if the page scrolls.
	useEffect(() => {
		if (!isVisible) return;
		const update = () => {
			updateAnchorFromElement(getCurrentAnchorElement(), true);
		};
		window.addEventListener("scroll", update, { passive: true, capture: true });
		window.addEventListener("resize", update);
		return () => {
			window.removeEventListener("scroll", update, { capture: true });
			window.removeEventListener("resize", update);
		};
	}, [isVisible, getCurrentAnchorElement, updateAnchorFromElement]);

	const handleMouseEnter = useCallback(
		(event: React.MouseEvent<HTMLElement>, index?: number) => {
			if (hideTimeoutRef.current) {
				clearTimeout(hideTimeoutRef.current);
				hideTimeoutRef.current = null;
			}

			const isFirstHover = !isVisible;

			if (index !== undefined) {
				setHoveredIndex(index);
			}

			updateAnchorFromElement(event.currentTarget, isFirstHover);

			if (isFirstHover) {
				rotation.jump(0);
				smoothRotation.jump(0);
				offsetX.jump(0);
				smoothOffsetX.jump(0);
				offsetY.jump(0);
				smoothOffsetY.jump(0);
			}

			setIsVisible(true);
		},
		[
			isVisible,
			updateAnchorFromElement,
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

			const target = event.currentTarget;
			const rect = target.getBoundingClientRect();

			const centerX = rect.left + rect.width / 2;
			const centerY = rect.top + rect.height / 2;
			const deltaX = event.clientX - centerX;
			const deltaY = event.clientY - centerY;

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
						height={typeof height === "number" ? height : 240}
						className={cn("object-cover", showImageShadow && "shadow-2xl")}
						style={{
							borderRadius: imageBorderRadius,
							width: previewWidth,
							height: typeof height === "number" ? height : 240,
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

	const selfTranslate = SELF_TRANSLATE[position];

	const previewSurface = (
		<motion.div
			style={{
				position: "fixed",
				left: 0,
				top: 0,
				x: finalX,
				y: finalY,
				pointerEvents: "none",
				zIndex: 9999,
				willChange: "transform",
			}}
			transformTemplate={(_, generated) => `${generated} ${selfTranslate}`}
		>
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
					width: previewWidth,
					height: height === "auto" ? "auto" : (height as number),
					rotate: smoothRotation,
					willChange: "transform, opacity",
				}}
			>
				<AnimatePresence initial={false}>
					{isVisible &&
						(props.mode === "wrapper" || hoveredIndex !== null) &&
						renderPreviewContent()}
				</AnimatePresence>
			</motion.div>
		</motion.div>
	);

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
				{previewSurface}
			</div>
		);
	}

	return (
		<div className={cn("relative", className)}>
			{renderInlineContent()}
			{previewSurface}
		</div>
	);
};

HoverCard.displayName = "HoverCard";

export default HoverCard;
