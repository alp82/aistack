import { ArrowUpRight } from "lucide-react";
import type { ReactNode } from "react";
import { categoryConfig } from "@/config/categoryConfig";
import { formatPriceDisplay } from "@/lib/pricing";
import { cn } from "@/lib/utils";

// ---------------------------------------------------------------------------
// Resolved design tokens for the stack-view journey.
//
// These are the *locked* Editorial values (style: editorial, rhythm:
// alternating, accent: category, density: comfortable, width: wide,
// splitTools: true) — distilled from the throwaway prototype, now archived
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

/** Section title type. */
export const HEADING =
	"text-3xl md:text-4xl font-black tracking-tight uppercase text-fg-primary";

/** Shared card surface — thin rule, transparent, subtle hover lift. */
export const CARD = {
	border: "border border-stroke-subtle",
	bg: "bg-transparent",
	hover: "hover:border-stroke-strong hover:bg-bg-panel/50",
} as const;

/** Combined card surface classes for the common case. */
export const CARD_SURFACE = cn(CARD.border, CARD.bg, CARD.hover);

/** Alternating section background, keyed by the section's position. */
export function sectionBg(index: number): string {
	return index % 2 === 0 ? "bg-bg-canvas" : "bg-bg-panel/30";
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

export function Section({
	index,
	children,
	id,
}: {
	index: number;
	children: ReactNode;
	id?: string;
}) {
	return (
		<section className={cn("px-6 py-16 md:py-24", sectionBg(index))} id={id}>
			<div className={cn("mx-auto", STACK_WIDTH)}>{children}</div>
		</section>
	);
}

export function SectionHeader({
	index,
	kicker,
	title,
	meta,
}: {
	index: string;
	kicker: string;
	title: string;
	meta?: string;
}) {
	return (
		<div className="mb-10 flex items-end gap-5 border-b border-stroke-subtle pb-5">
			<span className="font-mono text-5xl font-black leading-none text-stroke-strong md:text-7xl">
				{index}
			</span>
			<div className="flex-1">
				<p className="font-mono text-xs font-semibold uppercase tracking-[0.25em] text-accent-lime">
					{kicker}
				</p>
				<h2 className={cn("mt-1", HEADING)}>{title}</h2>
			</div>
			{meta && (
				<span className="hidden font-mono text-xs uppercase tracking-wider text-fg-muted md:block">
					{meta}
				</span>
			)}
		</div>
	);
}
