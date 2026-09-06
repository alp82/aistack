import { ArrowUpRight } from "lucide-react";
import type { ReactNode } from "react";
import { categoryConfig } from "@/config/categoryConfig";
import { monochromeLogoClass } from "@/lib/iconTheme";
import { formatPriceDisplay } from "@/lib/pricing";
import { useScrollHighlight } from "@/lib/useScrollHighlight";
import { cn } from "@/lib/utils";

// ---------------------------------------------------------------------------
// Resolved design tokens for the stack-view journey.
//
// These are the *locked* Editorial values (style: editorial, rhythm:
// alternating, accent: category, density: comfortable, width: wide,
// splitTools: true) - distilled from the throwaway prototype, now archived
// at .prototypes/stack-view-redesign.tsx.
// No runtime switching: this is the chosen design.
// ---------------------------------------------------------------------------

/** Canonical content width for every journey section (the approved "wide"). */
export const STACK_WIDTH = "max-w-7xl";

/** Big-card padding (comfortable density). */
export const PAD = "p-5 md:p-6";
/** Compact-card padding. */
export const PAD_SM = "p-4";
/** Grid gap between cards. */
export const GAP = "gap-4 md:gap-5";

/** Shared card surface - thin rule, transparent, subtle hover lift. */
export const CARD = {
	border: "border border-stroke-subtle",
	bg: "bg-transparent",
	hover: "hover:border-stroke-strong hover:bg-bg-panel/50",
} as const;

/** Combined card surface classes for the common case. */
export const CARD_SURFACE = cn(CARD.border, CARD.bg, CARD.hover);

/**
 * Section background, keyed by the section's position (#351 v26 tonal ladder,
 * kept by the accepted v37 body). Four tints of the canvas hue, rising to the
 * second section and falling back. The hero and the owner drawer sit on the
 * canvas, so section 01 is the first lifted band, and section 04 returns to
 * the canvas before the closing strip.
 */
export function sectionBg(index: number): string {
	const bands = [
		"bg-bg-panel/20",
		"bg-bg-panel/40",
		"bg-bg-panel/20",
		"bg-bg-canvas",
	];
	return bands[(Math.max(1, index) - 1) % bands.length];
}

export type CategoryColor = { text: string; bg: string; border: string };

const DEFAULT_CAT: CategoryColor = {
	text: "text-accent-lime",
	bg: "bg-accent-lime/10",
	border: "border-accent-lime/40",
};

/** Category-tinted accent, falling back to lime for unknown categories. */
export function categoryColor(categories: string[] | undefined): CategoryColor {
	const first = categories?.[0];
	const conf = first
		? categoryConfig[first as keyof typeof categoryConfig]
		: undefined;
	if (!conf) return DEFAULT_CAT;
	return { text: conf.textColor, bg: conf.bgColor, border: conf.borderColor };
}

export function categoryLabel(categories: string[] | undefined): string {
	const first = categories?.[0];
	const conf = first
		? categoryConfig[first as keyof typeof categoryConfig]
		: undefined;
	return conf?.label ?? first ?? "Tool";
}

// --- Icon: monogram fallback, category-tinted, sharp corners --------------

const ICON_SIZES = {
	sm: "size-8 text-sm",
	md: "size-11 text-base",
	lg: "size-14 text-lg",
	xl: "size-16 text-2xl",
} as const;

export function StackIcon({
	name,
	src,
	color,
	size = "md",
	className,
}: {
	name: string;
	src?: string;
	color: CategoryColor;
	size?: keyof typeof ICON_SIZES;
	className?: string;
}) {
	if (src) {
		return (
			<img
				src={src}
				alt={name}
				className={cn(
					ICON_SIZES[size].split(" ")[0],
					"shrink-0 border border-stroke-subtle object-contain p-1",
					monochromeLogoClass(src),
					className,
				)}
			/>
		);
	}
	return (
		<span
			className={cn(
				"inline-flex shrink-0 items-center justify-center border font-mono font-bold uppercase",
				ICON_SIZES[size],
				color.bg,
				color.border,
				color.text,
				className,
			)}
		>
			{name.charAt(0)}
		</span>
	);
}

// --- Price ----------------------------------------------------------------

export function StackPrice({
	amount,
	period = "month",
	size = "md",
	className,
}: {
	amount: number;
	period?: "month" | "year" | "one_time";
	size?: "sm" | "md" | "lg" | "xl";
	className?: string;
}) {
	const d = formatPriceDisplay(amount, period, "round");
	const sizes = {
		sm: "text-base",
		md: "text-xl",
		lg: "text-3xl",
		xl: "text-4xl md:text-5xl",
	};
	const suffix = {
		sm: "text-[10px]",
		md: "text-xs",
		lg: "text-sm",
		xl: "text-base",
	};
	return (
		<span
			className={cn(
				"font-mono font-black leading-none",
				sizes[size],
				className,
			)}
		>
			${d.amountText}
			<span className={cn("font-normal text-fg-muted", suffix[size])}>
				{d.suffix}
			</span>
		</span>
	);
}

export function VisitLink({
	href,
	className,
	label = "Visit",
}: {
	href?: string;
	className?: string;
	label?: string;
}) {
	if (!href) return null;
	return (
		<a
			href={href}
			target="_blank"
			rel="noopener noreferrer"
			className={cn(
				"inline-flex items-center gap-1 font-mono text-[11px] font-semibold uppercase tracking-wider text-fg-muted transition-colors hover:text-accent-lime",
				className,
			)}
		>
			{label}
			<ArrowUpRight className="size-3" />
		</a>
	);
}

export function Chip({
	children,
	color,
	className,
}: {
	children: ReactNode;
	color?: CategoryColor;
	className?: string;
}) {
	return (
		<span
			className={cn(
				"inline-flex items-center border px-2 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-wider",
				color
					? cn(color.bg, color.border, color.text)
					: "border-stroke-subtle text-fg-muted",
				className,
			)}
		>
			{children}
		</span>
	);
}

// --- Section shell + numbered header --------------------------------------

/**
 * The section shell: a band of the page with the rail on the left and the body
 * on the right. The rail holds the numbered header (#351 v27 title rail), the
 * body holds whatever the section prints. Both are explicit slots, so no child
 * depends on its DOM position for its column.
 *
 * The frame is the prototype's: a 170px rail, a 40px gap and 48px of vertical
 * padding on the band. Below `md` the rail stacks above the body.
 */
export function Section({
	index,
	header,
	children,
	id,
	highlighted,
}: {
	index: number;
	header: ReactNode;
	children: ReactNode;
	id?: string;
	highlighted?: boolean;
}) {
	const { ref, reduce } = useScrollHighlight<HTMLElement>(highlighted, {
		block: "start",
	});

	return (
		<section
			ref={ref}
			className={cn(
				// Clears the 64px site header AND the sticky section nav, so a nav
				// jump never lands the section title behind them.
				"scroll-mt-36 px-6 py-12",
				sectionBg(index),
				highlighted && !reduce && "ring-2 ring-accent-lime/50 ring-inset",
			)}
			id={id}
		>
			<div
				className={cn(
					"mx-auto md:grid md:grid-cols-[170px_minmax(0,1fr)] md:gap-x-10",
					STACK_WIDTH,
				)}
			>
				<div className="mb-8 md:mb-0" data-testid="section-rail-slot">
					{header}
				</div>
				<div className="min-w-0">{children}</div>
			</div>
		</section>
	);
}

export function SectionHeader({
	index,
	kicker,
	title,
	meta,
	metaAlwaysVisible = false,
}: {
	index: string;
	kicker: string;
	title: string;
	meta?: ReactNode;
	metaAlwaysVisible?: boolean;
}) {
	return (
		<div>
			<span className="block font-mono text-6xl font-black leading-none tracking-tight text-accent-lime">
				{index}
			</span>
			<p className="sr-only">{kicker}</p>
			<h2 className="mt-3 text-2xl font-black uppercase leading-none tracking-tight text-fg-primary">
				{title}
			</h2>
			{meta && (
				<div
					className={cn(
						"mt-4 font-mono text-xs leading-relaxed text-fg-secondary",
						metaAlwaysVisible ? "block" : "hidden md:block",
					)}
				>
					{meta}
				</div>
			)}
		</div>
	);
}
