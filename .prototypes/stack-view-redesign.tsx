/**
 * ARCHIVED PROTOTYPE — Stack-view redesign explorer (single-file snapshot)
 *
 * Self-contained consolidation of the throwaway `/proto/stack` prototype that
 * formerly lived at `src/features/stack-proto/` (config / data / ui /
 * StackJourney / ControlPanel) + `src/routes/proto.stack.tsx`.
 *
 * Four switchable styles (Editorial / Terminal / Showcase / Bento) plus live
 * cross-cutting params (rhythm / accent / density / width / split-tools),
 * driven by the bottom-right ControlPanel. Mock data (`MOCK_STACK`) mirrors
 * `convex/stacks.ts` getBySlug, so it renders with no DB.
 *
 * OUTCOME: the chosen design — `editorial / alternating / category /
 * comfortable / wide / splitTools` (= DEFAULT_CONFIG) — was ported to
 * production in `src/features/stack-view/` and shipped on
 * `src/routes/stacks.$slug.tsx` (2026-05-31). This file is the frozen
 * reference; it is no longer routed.
 *
 * Still imports a few stable app utilities (`@/config/categoryConfig`,
 * `@/lib/pricing`, `@/lib/theme`, `@/lib/utils`) rather than inlining them.
 *
 * TO RUN AGAIN: add a thin route that re-exports the default component, e.g.
 *   // src/routes/proto.stack.tsx
 *   import { createFileRoute } from "@tanstack/react-router";
 *   import ProtoStackPage from "../../.prototypes/stack-view-redesign";
 *   export const Route = createFileRoute("/proto/stack")({ component: ProtoStackPage });
 * then visit /proto/stack.
 */

import {
	ArrowRight,
	ArrowUpRight,
	CheckCircle,
	FolderOpen,
	Moon,
	Package,
	Settings2,
	Sun,
	User,
	X,
} from "lucide-react";
import { type ReactNode, useState } from "react";
import { categoryConfig } from "@/config/categoryConfig";
import { formatPriceDisplay, sortToolsByPrice } from "@/lib/pricing";
import { useTheme } from "@/lib/theme";
import { cn } from "@/lib/utils";

// ---------------------------------------------------------------------------
// Style presets — four distinct, opinionated design directions for the journey.
// Cross-cutting params (rhythm / accent / density / width) layer on top of any
// style so you can mix-and-match while evaluating.
// ---------------------------------------------------------------------------

export type StyleId = "editorial" | "terminal" | "showcase" | "bento";
export type Rhythm = "flat" | "alternating" | "banded";
export type Accent = "lime" | "category";
export type Density = "comfortable" | "compact";
export type Width = "medium" | "wide" | "full";

export type ProtoConfig = {
	style: StyleId;
	rhythm: Rhythm;
	accent: Accent;
	density: Density;
	width: Width;
	splitTools: boolean; // separate "primary" vs "secondary" tool tiers
};

export const DEFAULT_CONFIG: ProtoConfig = {
	style: "editorial",
	rhythm: "alternating",
	accent: "category",
	density: "comfortable",
	width: "wide",
	splitTools: true,
};

export const STYLE_META: Record<StyleId, { label: string; blurb: string }> = {
	editorial: {
		label: "Editorial",
		blurb:
			"Type-led, airy. Thin rules, big numbered sections, generous whitespace.",
	},
	terminal: {
		label: "Terminal",
		blurb:
			"Brutalist brand-max. Thick borders, offset shadows, ASCII dividers, mono.",
	},
	showcase: {
		label: "Showcase",
		blurb:
			"Product/pricing-page energy. Category accent bars, centered intros, lift on hover.",
	},
	bento: {
		label: "Bento",
		blurb:
			"Dashboard grid. Cost-weighted tiles — pricier tools get bigger cells.",
	},
};

export type ToolsLayout = "editorial" | "cards2" | "showcase" | "bento";
export type ModelsLayout = "tiles" | "rows" | "chips";
export type DividerStyle = "number" | "ascii" | "centered" | "mono";

export type Tokens = {
	divider: DividerStyle;
	toolsLayout: ToolsLayout;
	modelsLayout: ModelsLayout;
	accentBar: boolean; // category-colored top bar on tool cards
	limeBar: boolean; // lime left bar on primary tool cards
	card: {
		border: string;
		bg: string;
		shadow: string;
		hover: string;
	};
	pad: string; // big card padding
	padSm: string; // small card padding
	gap: string; // grid gap
	heading: string; // section title type
};

const STYLE_TOKENS: Record<StyleId, Omit<Tokens, "pad" | "padSm" | "gap">> = {
	editorial: {
		divider: "number",
		toolsLayout: "editorial",
		modelsLayout: "tiles",
		accentBar: false,
		limeBar: false,
		card: {
			border: "border border-stroke-subtle",
			bg: "bg-transparent",
			shadow: "",
			hover: "hover:border-stroke-strong hover:bg-bg-panel/50",
		},
		heading:
			"text-3xl md:text-4xl font-black tracking-tight uppercase text-fg-primary",
	},
	terminal: {
		divider: "ascii",
		toolsLayout: "cards2",
		modelsLayout: "rows",
		accentBar: false,
		limeBar: true,
		card: {
			border: "border-2 border-stroke-strong",
			bg: "bg-bg-panel",
			shadow: "shadow-[4px_4px_0_var(--stroke-strong)]",
			hover:
				"hover:-translate-y-0.5 hover:border-accent-lime hover:shadow-[5px_5px_0_var(--accent-lime)]",
		},
		heading:
			"font-mono text-2xl md:text-3xl font-bold tracking-tight text-fg-primary",
	},
	showcase: {
		divider: "centered",
		toolsLayout: "showcase",
		modelsLayout: "chips",
		accentBar: true,
		limeBar: false,
		card: {
			border: "border border-stroke-subtle",
			bg: "bg-bg-panel",
			shadow: "",
			hover:
				"hover:-translate-y-1 hover:border-accent-lime/60 hover:shadow-[var(--shadow-glow-lime)]",
		},
		heading:
			"text-3xl md:text-5xl font-black tracking-tighter uppercase text-fg-primary",
	},
	bento: {
		divider: "mono",
		toolsLayout: "bento",
		modelsLayout: "tiles",
		accentBar: false,
		limeBar: false,
		card: {
			border: "border border-stroke-strong",
			bg: "bg-bg-panel",
			shadow: "",
			hover: "hover:border-accent-lime",
		},
		heading:
			"font-mono text-2xl md:text-3xl font-bold uppercase tracking-tight text-fg-primary",
	},
};

export function getTokens(config: ProtoConfig): Tokens {
	const base = STYLE_TOKENS[config.style];
	const compact = config.density === "compact";
	return {
		...base,
		pad: compact ? "p-4" : "p-5 md:p-6",
		padSm: compact ? "p-3" : "p-4",
		gap: compact ? "gap-3" : "gap-4 md:gap-5",
	};
}

export function widthClass(config: ProtoConfig): string {
	switch (config.width) {
		case "medium":
			return "max-w-5xl";
		case "wide":
			return "max-w-7xl";
		case "full":
			return "max-w-content";
	}
}

// Section background by index, honoring the rhythm param.
export function sectionBg(config: ProtoConfig, index: number): string {
	if (config.rhythm === "flat") return "bg-bg-canvas";
	if (config.rhythm === "banded") {
		return index % 2 === 0 ? "bg-bg-canvas" : "bg-bg-shell";
	}
	// alternating
	return index % 2 === 0 ? "bg-bg-canvas" : "bg-bg-panel/30";
}

export type CategoryColor = { text: string; bg: string; border: string };

const DEFAULT_CAT: CategoryColor = {
	text: "text-accent-lime",
	bg: "bg-accent-lime/10",
	border: "border-accent-lime/40",
};

export function categoryColor(
	config: ProtoConfig,
	categories: string[] | undefined,
): CategoryColor {
	if (config.accent === "lime") return DEFAULT_CAT;
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
// Mock stack data for the stack-view redesign prototype.
// Shapes mirror convex/stacks.ts `getBySlug` so the chosen design ports cleanly.

export type ProtoTool = {
	_id: string;
	name: string;
	slug: string;
	categories: string[];
	iconUrl?: string;
	websiteUrl?: string;
	price: {
		pricingType: string;
		fixed?: {
			currency: string;
			amount: number;
			period: "month" | "year" | "one_time";
		};
	};
	kind: "main" | "misc";
	primaryUsageLabel: string;
	tierName: string;
	priceKind: "regular" | "discounted" | "bundle" | "usage_based" | "sponsored";
	bundleSlug?: string;
	description?: string;
};

export type ProtoModel = {
	_id: string;
	name: string;
	slug: string;
	provider: string;
	category: string;
	iconUrl?: string;
	role: "primary" | "secondary" | "specialized";
	description?: string;
};

export type ProtoBundle = {
	_id: string;
	name: string;
	slug: string;
	description?: string;
	iconUrl?: string;
	websiteUrl?: string;
	tierId: string;
	tierName: string;
	price: {
		pricingType: string;
		fixed?: {
			currency: string;
			amount: number;
			period: "month" | "year" | "one_time";
		};
	};
};

export type ProtoProject = {
	_id: string;
	name: string;
	slug: string;
	description?: string;
	tags?: string[];
	fileCount: number;
	cloneCount?: number;
	source?: string;
};

export type Inline = string | { ref: string };
export type ProseBlock =
	| { kind: "h2"; text: string }
	| { kind: "p"; spans: Inline[] }
	| { kind: "ul"; items: Inline[][] }
	| { kind: "quote"; text: string };

export type ProtoStack = {
	name: string;
	oneLiner: string;
	teamSize?: number;
	fixedTotal: { currency: string; amount: number; period: "month" };
	hasUsageComponent: boolean;
	creator: {
		name: string;
		avatarUrl?: string;
		xHandle?: string;
		verified: boolean;
	};
	personalPageUrl?: string;
	tools: ProtoTool[];
	models: ProtoModel[];
	bundles: ProtoBundle[];
	projects: ProtoProject[];
	description: ProseBlock[];
};

const fixed = (
	amount: number,
	period: "month" | "year" | "one_time" = "month",
) => ({
	pricingType: "fixed",
	fixed: { currency: "USD", amount, period },
});

export const MOCK_STACK: ProtoStack = {
	name: "Alper Ortac",
	oneLiner: "my dev stack",
	fixedTotal: { currency: "USD", amount: 154, period: "month" },
	hasUsageComponent: false,
	creator: {
		name: "Alper Ortac",
		xHandle: "alperortac",
		verified: true,
	},
	personalPageUrl: "aistack.to",
	tools: [
		{
			_id: "t1",
			name: "Claude",
			slug: "claude",
			categories: ["reasoning"],
			websiteUrl: "https://claude.ai",
			price: fixed(100),
			kind: "main",
			primaryUsageLabel: "MAX 5×",
			tierName: "MAX 5×",
			priceKind: "regular",
			description:
				"My main coding agent runtime. I run a separate Claude Code instance per project, usually 1–3 in parallel.",
		},
		{
			_id: "t2",
			name: "ChatGPT",
			slug: "chatgpt",
			categories: ["reasoning"],
			websiteUrl: "https://chatgpt.com",
			price: fixed(20),
			kind: "main",
			primaryUsageLabel: "PLUS",
			tierName: "PLUS",
			priceKind: "regular",
			description:
				"Second opinion + voice mode for thinking out loud on the go.",
		},
		{
			_id: "t3",
			name: "Perplexity",
			slug: "perplexity",
			categories: ["research"],
			websiteUrl: "https://perplexity.ai",
			price: { pricingType: "fixed" },
			kind: "main",
			primaryUsageLabel: "PRO",
			tierName: "PRO",
			priceKind: "sponsored",
			description: "Fast sourced research when I need citations, not vibes.",
		},
		{
			_id: "t4",
			name: "Notion",
			slug: "notion",
			categories: ["notes"],
			websiteUrl: "https://notion.so",
			price: fixed(10),
			kind: "main",
			primaryUsageLabel: "PLUS",
			tierName: "PLUS",
			priceKind: "regular",
			description:
				"Specs, notes, and the single source of truth for every project.",
		},
		{
			_id: "t5",
			name: "Google AI",
			slug: "google-ai",
			categories: ["reasoning"],
			websiteUrl: "https://ai.google",
			price: fixed(8),
			kind: "main",
			primaryUsageLabel: "PLUS",
			tierName: "PLUS",
			priceKind: "discounted",
			description:
				"Gemini access for long-context document work and image tasks.",
		},
		{
			_id: "t6",
			name: "Lovable",
			slug: "lovable",
			categories: ["app-builder"],
			websiteUrl: "https://lovable.dev",
			price: { pricingType: "fixed" },
			kind: "main",
			primaryUsageLabel: "PRO",
			tierName: "PRO",
			priceKind: "bundle",
			bundleSlug: "lennys-bundle",
			description:
				"Quick UI prototypes before I commit to building the real thing.",
		},
		{
			_id: "t7",
			name: "Ampcode",
			slug: "ampcode",
			categories: ["coding-agent"],
			websiteUrl: "https://ampcode.com",
			price: fixed(0),
			kind: "misc",
			primaryUsageLabel: "FREE",
			tierName: "FREE",
			priceKind: "regular",
			description: "$15 of free credits daily — good for a dozen prompts.",
		},
		{
			_id: "t8",
			name: "Claude Code",
			slug: "claude-code",
			categories: ["coding-agent"],
			websiteUrl: "https://claude.com/claude-code",
			price: fixed(0),
			kind: "misc",
			primaryUsageLabel: "INCLUDED WITH CLAUDE",
			tierName: "INCLUDED",
			priceKind: "regular",
			description:
				"My main coding agent. Works flawlessly with good customization.",
		},
		{
			_id: "t9",
			name: "Opencode",
			slug: "opencode",
			categories: ["coding-agent"],
			websiteUrl: "https://opencode.ai",
			price: fixed(0),
			kind: "misc",
			primaryUsageLabel: "FREE",
			tierName: "FREE",
			priceKind: "regular",
			description:
				"Lets me reuse my ChatGPT + Google AI subs without extra cost.",
		},
		{
			_id: "t10",
			name: "PostHog",
			slug: "posthog",
			categories: ["analytics"],
			websiteUrl: "https://posthog.com",
			price: fixed(0),
			kind: "misc",
			primaryUsageLabel: "FREE",
			tierName: "FREE",
			priceKind: "regular",
			description: "Product analytics, session replays, and feature flags.",
		},
		{
			_id: "t11",
			name: "Sentry",
			slug: "sentry",
			categories: ["monitoring"],
			websiteUrl: "https://sentry.io",
			price: fixed(0),
			kind: "misc",
			primaryUsageLabel: "DEVELOPER",
			tierName: "DEVELOPER",
			priceKind: "regular",
			description: "Error tracking with the stack traces I actually read.",
		},
	],
	models: [
		{
			_id: "m1",
			name: "Claude Sonnet 4.6",
			slug: "claude-sonnet-4-6",
			provider: "Anthropic",
			category: "coding",
			role: "primary",
			description: "My favorite model for subagents.",
		},
		{
			_id: "m2",
			name: "Claude Opus 4.6",
			slug: "claude-opus-4-6",
			provider: "Anthropic",
			category: "reasoning",
			role: "secondary",
			description: "When more complexity is involved.",
		},
		{
			_id: "m3",
			name: "Gemini 3.1 Pro",
			slug: "gemini-3-1-pro",
			provider: "Google",
			category: "reasoning",
			role: "secondary",
		},
		{
			_id: "m4",
			name: "GPT-5.3 Codex",
			slug: "gpt-5-3-codex",
			provider: "OpenAI",
			category: "coding",
			role: "specialized",
		},
		{
			_id: "m5",
			name: "GPT 5.4",
			slug: "gpt-5-4",
			provider: "OpenAI",
			category: "reasoning",
			role: "specialized",
			description:
				"High Thinking — exceptional for narrowing scope on planning tasks.",
		},
	],
	bundles: [
		{
			_id: "b1",
			name: "Lenny's Bundle",
			slug: "lennys-bundle",
			tierId: "annual",
			tierName: "ANNUAL",
			price: fixed(17, "month"),
			description:
				"Great value for the cost of a single subscription. Don't forget to cancel subs after the first free year.",
		},
	],
	projects: [
		{
			_id: "p1",
			name: "Agentic Coding",
			slug: "agentic-coding",
			description:
				"Claude Code setup, subagents, and the workflow I run day to day.",
			tags: ["claude-code", "workflow"],
			fileCount: 14,
			cloneCount: 23,
			source: "CLI",
		},
		{
			_id: "p2",
			name: "Research & Brainstorming",
			slug: "research-brainstorming",
			description: "Prompts and references for scoping new ideas with GPT 5.4.",
			tags: ["research", "planning"],
			fileCount: 6,
			cloneCount: 8,
			source: "CLI",
		},
		{
			_id: "p3",
			name: "UI Wireframes",
			slug: "ui-wireframes",
			description:
				"Lovable + Claude prototypes before committing to real builds.",
			tags: ["design", "frontend"],
			fileCount: 9,
		},
		{
			_id: "p4",
			name: "Claude Code Setup",
			slug: "claude-code-setup",
			description:
				"My CLAUDE.md, hooks, and the plugin doctrine I reuse everywhere.",
			tags: ["config", "claude-code"],
			fileCount: 21,
			cloneCount: 41,
		},
	],
	description: [
		{ kind: "h2", text: "My core stack" },
		{
			kind: "p",
			spans: [
				"Primarily ",
				{ ref: "Claude Code" },
				" for running my coding agents. For each project I run a separate instance, usually I'm working on 1–3 projects in parallel.",
			],
		},
		{
			kind: "p",
			spans: [
				"I sometimes spin up ",
				{ ref: "Opencode" },
				" and ",
				{ ref: "Ampcode" },
				" when I want to save some tokens. Opencode lets me reuse my ",
				{ ref: "ChatGPT" },
				" and ",
				{ ref: "Google AI" },
				" subscriptions without extra costs.",
			],
		},
		{
			kind: "ul",
			items: [
				[
					{ ref: "Opencode" },
					" — reuse existing subscriptions, no extra spend",
				],
				[{ ref: "Ampcode" }, " — $15 of free credits daily, ~a dozen prompts"],
			],
		},
		{
			kind: "quote",
			text: "Lately I'm also using GPT 5.4 (High Thinking) for planning — the way it asks questions to narrow down scope is exceptional.",
		},
	],
};
// --- Icon: monogram fallback, category-tinted, sharp corners --------------

const ICON_SIZES = {
	sm: "size-8 text-sm",
	md: "size-11 text-base",
	lg: "size-14 text-lg",
	xl: "size-16 text-2xl",
} as const;

export function ProtoIcon({
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

export function ProtoPrice({
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

// --- Section shell + header (four divider treatments) ---------------------

export function Section({
	config,
	index,
	children,
	id,
}: {
	config: ProtoConfig;
	index: number;
	children: ReactNode;
	id?: string;
}) {
	return (
		<section
			id={id}
			className={cn("px-6 py-16 md:py-24", sectionBg(config, index))}
		>
			<div className={cn("mx-auto", widthClass(config))}>{children}</div>
		</section>
	);
}

export function SectionHeader({
	tokens,
	index,
	kicker,
	title,
	meta,
}: {
	tokens: Tokens;
	index: string;
	kicker: string;
	title: string;
	meta?: string;
}) {
	if (tokens.divider === "ascii") {
		return (
			<div className="mb-8">
				<div className="flex items-baseline gap-3 font-mono text-fg-muted">
					<span className="text-accent-lime">■</span>
					<span className="text-lg font-bold uppercase tracking-wide text-fg-primary">
						{title}
					</span>
					<span
						aria-hidden
						className="min-w-8 flex-1 self-center border-t border-dashed border-stroke-subtle"
					/>
					{meta && (
						<span className="text-xs uppercase tracking-wider">{meta}</span>
					)}
				</div>
			</div>
		);
	}

	if (tokens.divider === "centered") {
		return (
			<div className="mb-12 text-center">
				<p className="font-mono text-xs font-semibold uppercase tracking-[0.3em] text-accent-lime">
					{kicker}
				</p>
				<h2 className={cn("mt-3", tokens.heading)}>{title}</h2>
				{meta && (
					<p className="mt-3 font-mono text-xs uppercase tracking-wider text-fg-muted">
						{meta}
					</p>
				)}
			</div>
		);
	}

	if (tokens.divider === "number") {
		return (
			<div className="mb-10 flex items-end gap-5 border-b border-stroke-subtle pb-5">
				<span className="font-mono text-5xl font-black leading-none text-stroke-strong md:text-7xl">
					{index}
				</span>
				<div className="flex-1">
					<p className="font-mono text-xs font-semibold uppercase tracking-[0.25em] text-accent-lime">
						{kicker}
					</p>
					<h2 className={cn("mt-1", tokens.heading)}>{title}</h2>
				</div>
				{meta && (
					<span className="hidden font-mono text-xs uppercase tracking-wider text-fg-muted md:block">
						{meta}
					</span>
				)}
			</div>
		);
	}

	// mono
	return (
		<div className="mb-8 flex flex-wrap items-baseline gap-x-4 gap-y-1">
			<p className="font-mono text-xs font-semibold uppercase tracking-[0.25em] text-accent-lime">
				{kicker}
			</p>
			<h2 className={tokens.heading}>{title}</h2>
			{meta && (
				<span className="font-mono text-xs uppercase tracking-wider text-fg-muted">
					· {meta}
				</span>
			)}
		</div>
	);
}
// ===========================================================================
// HERO
// ===========================================================================

function SocialBar({ stack }: { stack: ProtoStack }) {
	if (!stack.creator.xHandle && !stack.personalPageUrl) return null;
	return (
		<div className="mt-6 inline-flex max-w-full bg-bg-panel-muted">
			<div className="flex flex-wrap items-center divide-x divide-stroke-subtle">
				{stack.creator.xHandle && (
					<span className="flex items-center gap-2 border-t-2 border-t-transparent px-4 py-2.5 font-mono text-sm text-fg-secondary">
						<svg
							className="size-4 shrink-0"
							viewBox="0 0 24 24"
							fill="currentColor"
						>
							<title>X</title>
							<path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
						</svg>
						@{stack.creator.xHandle}
					</span>
				)}
				{stack.personalPageUrl && (
					<span className="flex items-center gap-2 border-t-2 border-t-transparent px-4 py-2.5 font-mono text-sm text-fg-secondary">
						<User className="size-4 shrink-0" />
						{stack.personalPageUrl}
					</span>
				)}
			</div>
		</div>
	);
}

function PriceBadge({
	stack,
	style,
}: {
	stack: ProtoStack;
	style: ProtoConfig["style"];
}) {
	const label = stack.teamSize ? `Team ${stack.teamSize}` : "Solo";
	if (style === "terminal") {
		return (
			<div className="flex h-32 w-32 shrink-0 flex-col items-center justify-center border-[3px] border-stroke-strong bg-bg-panel text-center shadow-[4px_4px_0_var(--stroke-strong)]">
				<ProtoPrice
					amount={stack.fixedTotal.amount}
					size="lg"
					className="text-fg-primary"
				/>
				<span className="mt-1 font-mono text-[10px] font-semibold uppercase tracking-wide text-accent-lime">
					{label}
				</span>
			</div>
		);
	}
	if (style === "showcase") {
		return (
			<div className="inline-flex items-center gap-3 border border-stroke-subtle bg-bg-panel px-5 py-3">
				<ProtoPrice
					amount={stack.fixedTotal.amount}
					size="lg"
					className="text-fg-primary"
				/>
				<span className="font-mono text-[10px] font-semibold uppercase tracking-widest text-accent-lime">
					{label}
				</span>
			</div>
		);
	}
	// editorial / bento — clean stat
	return (
		<div className="flex flex-col items-end">
			<ProtoPrice
				amount={stack.fixedTotal.amount}
				size="xl"
				className="text-fg-primary"
			/>
			<span className="mt-1 font-mono text-[10px] font-semibold uppercase tracking-widest text-accent-lime">
				{label}
			</span>
		</div>
	);
}

function Hero({ config, stack }: { config: ProtoConfig; stack: ProtoStack }) {
	const centered = config.style === "showcase";
	const limeColor = categoryColor({ ...config, accent: "lime" }, undefined);
	const name = (
		<h1
			className={cn(
				"font-black uppercase leading-[0.9] tracking-tighter text-fg-primary",
				centered
					? "text-5xl sm:text-6xl md:text-7xl"
					: "text-4xl sm:text-6xl md:text-7xl",
			)}
		>
			{stack.name}
		</h1>
	);

	return (
		<header className="relative overflow-hidden border-b border-stroke-strong bg-bg-canvas px-6 pb-16 pt-12 md:pb-20 md:pt-16">
			<div
				className="pointer-events-none absolute inset-0 z-0 opacity-10"
				style={{
					backgroundImage:
						"linear-gradient(to right, var(--stroke-subtle) 1px, transparent 1px), linear-gradient(to bottom, var(--stroke-subtle) 1px, transparent 1px)",
					backgroundSize: "4rem 4rem",
				}}
			/>
			<div className={cn("relative mx-auto", widthClass(config))}>
				<p className="mb-8 font-mono text-sm text-accent-lime">
					{"// STACK_DETAILS"}
				</p>

				{centered ? (
					<div className="flex flex-col items-center text-center">
						<ProtoIcon name={stack.creator.name} color={limeColor} size="xl" />
						<div className="mt-6">{name}</div>
						<SocialBar stack={stack} />
						<p className="mt-6 max-w-2xl text-lg text-fg-secondary md:text-xl">
							{stack.oneLiner}
						</p>
						<div className="mt-8">
							<PriceBadge stack={stack} style={config.style} />
						</div>
					</div>
				) : (
					<div className="flex flex-col gap-8 md:flex-row md:items-start md:justify-between">
						<div className="flex gap-5">
							<ProtoIcon
								name={stack.creator.name}
								color={limeColor}
								size="xl"
							/>
							<div className="min-w-0">
								{name}
								<SocialBar stack={stack} />
								{stack.creator.verified && (
									<div className="mt-3 flex items-center gap-1.5 font-mono text-xs text-accent-lime">
										<CheckCircle className="size-4" />
										Verified
									</div>
								)}
								<p className="mt-5 max-w-2xl border-l-4 border-accent-lime pl-4 text-base text-fg-secondary md:text-xl md:pl-6">
									{stack.oneLiner}
								</p>
							</div>
						</div>
						<div className="shrink-0">
							<PriceBadge stack={stack} style={config.style} />
						</div>
					</div>
				)}

				{/* Quick stats strip */}
				<div className="mt-10 flex flex-wrap gap-x-8 gap-y-2 font-mono text-xs uppercase tracking-wider text-fg-muted">
					<span>
						<span className="text-fg-primary">{stack.tools.length}</span> tools
					</span>
					<span>
						<span className="text-fg-primary">{stack.models.length}</span>{" "}
						models
					</span>
					<span>
						<span className="text-fg-primary">{stack.bundles.length}</span>{" "}
						bundles
					</span>
					<span>
						<span className="text-fg-primary">{stack.projects.length}</span>{" "}
						projects
					</span>
				</div>
			</div>
		</header>
	);
}

// ===========================================================================
// PROJECTS
// ===========================================================================

function Projects({
	config,
	tokens,
	index,
	stack,
}: {
	config: ProtoConfig;
	tokens: Tokens;
	index: number;
	stack: ProtoStack;
}) {
	if (stack.projects.length === 0) return null;
	return (
		<Section config={config} index={index}>
			<SectionHeader
				tokens={tokens}
				index="01"
				kicker="// PROJECTS"
				title="Projects"
				meta={`${stack.projects.length} shared`}
			/>
			<div className={cn("grid grid-cols-1 sm:grid-cols-2", tokens.gap)}>
				{stack.projects.map((p) => (
					<div
						key={p._id}
						className={cn(
							"group flex flex-col transition-all",
							tokens.card.border,
							tokens.card.bg,
							tokens.card.shadow,
							tokens.card.hover,
							tokens.pad,
						)}
					>
						<div className="flex items-start gap-3">
							<div className="flex size-10 shrink-0 items-center justify-center border border-stroke-subtle bg-bg-panel-muted group-hover:border-accent-lime/50">
								<FolderOpen className="size-5 text-fg-muted group-hover:text-accent-lime" />
							</div>
							<div className="min-w-0 flex-1">
								<p className="truncate font-mono text-sm font-semibold text-fg-primary">
									{p.name}
								</p>
								{p.description && (
									<p className="mt-1 line-clamp-2 text-sm text-fg-secondary">
										{p.description}
									</p>
								)}
							</div>
						</div>
						{p.tags && p.tags.length > 0 && (
							<div className="mt-3 flex flex-wrap gap-1.5">
								{p.tags.map((t) => (
									<Chip key={t}>{t}</Chip>
								))}
							</div>
						)}
						<div className="mt-3 flex items-center gap-3 font-mono text-[10px] uppercase tracking-wider text-fg-muted">
							<span>{p.fileCount} files</span>
							{p.source && (
								<>
									<span className="text-stroke-subtle">|</span>
									<span>via {p.source}</span>
								</>
							)}
							{(p.cloneCount ?? 0) > 0 && (
								<>
									<span className="text-stroke-subtle">|</span>
									<span>{p.cloneCount} clones</span>
								</>
							)}
						</div>
					</div>
				))}
			</div>
		</Section>
	);
}

// ===========================================================================
// TOOLS — price tag + big/mini cards + four layouts
// ===========================================================================

function PriceTag({
	tool,
	size = "md",
}: {
	tool: ProtoTool;
	size?: "sm" | "md" | "lg";
}) {
	if (tool.priceKind === "sponsored") {
		return (
			<span className="inline-block border border-amber-500/40 bg-amber-500/10 px-2 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-wider text-amber-400">
				Sponsored
			</span>
		);
	}
	if (tool.priceKind === "bundle") {
		return (
			<a
				href="#proto-models-bundles"
				className="font-mono text-xs text-purple-400 transition-colors hover:text-purple-300"
			>
				Bundle ↓
			</a>
		);
	}
	if (tool.price.fixed && tool.price.fixed.amount > 0) {
		return (
			<ProtoPrice
				amount={tool.price.fixed.amount}
				period={tool.price.fixed.period}
				size={size}
				className="text-fg-primary"
			/>
		);
	}
	if (tool.price.fixed && tool.price.fixed.amount === 0) {
		return (
			<span className="font-mono text-sm font-bold text-accent-lime">Free</span>
		);
	}
	return (
		<span className="font-mono text-sm font-bold text-fg-primary">Usage</span>
	);
}

function ToolCardBig({
	tool,
	config,
	tokens,
}: {
	tool: ProtoTool;
	config: ProtoConfig;
	tokens: Tokens;
}) {
	const color = categoryColor(config, tool.categories);
	return (
		<div
			className={cn(
				"group relative flex flex-col transition-all",
				tokens.card.border,
				tokens.card.bg,
				tokens.card.shadow,
				tokens.card.hover,
				tokens.pad,
				tokens.limeBar &&
					tool.kind === "main" &&
					"border-l-4 border-l-accent-lime",
			)}
		>
			<div className="flex items-start gap-4">
				<ProtoIcon
					name={tool.name}
					src={tool.iconUrl}
					color={color}
					size="lg"
				/>
				<div className="min-w-0 flex-1">
					<div className="flex items-start justify-between gap-3">
						<div className="min-w-0">
							<h3 className="truncate font-mono text-lg font-bold text-fg-primary">
								{tool.name}
							</h3>
							<p className="mt-0.5 font-mono text-[10px] uppercase tracking-wider text-fg-muted">
								{tool.tierName}
							</p>
						</div>
						<div className="shrink-0 text-right">
							<PriceTag tool={tool} size="lg" />
						</div>
					</div>
				</div>
			</div>
			{tool.description && (
				<p className="mt-4 text-sm leading-relaxed text-fg-secondary">
					{tool.description}
				</p>
			)}
			<div className="mt-4 flex items-center justify-between pt-1">
				<Chip color={config.accent === "category" ? color : undefined}>
					{categoryLabel(tool.categories)}
				</Chip>
				<VisitLink href={tool.websiteUrl} />
			</div>
		</div>
	);
}

function ToolCardShowcase({
	tool,
	config,
	tokens,
}: {
	tool: ProtoTool;
	config: ProtoConfig;
	tokens: Tokens;
}) {
	const color = categoryColor(config, tool.categories);
	return (
		<div
			className={cn(
				"group flex flex-col items-center text-center transition-all",
				tokens.card.border,
				tokens.card.bg,
				tokens.card.hover,
				"overflow-hidden",
			)}
		>
			<div className={cn("h-1 w-full", color.text.replace("text-", "bg-"))} />
			<div className={cn("flex w-full flex-col items-center", tokens.pad)}>
				<ProtoIcon
					name={tool.name}
					src={tool.iconUrl}
					color={color}
					size="lg"
				/>
				<h3 className="mt-4 font-mono text-base font-bold text-fg-primary">
					{tool.name}
				</h3>
				<p className="mt-1 font-mono text-[10px] uppercase tracking-wider text-fg-muted">
					{tool.tierName}
				</p>
				<div className="mt-4">
					<PriceTag tool={tool} size="lg" />
				</div>
				{tool.description && (
					<p className="mt-3 line-clamp-3 text-sm text-fg-secondary">
						{tool.description}
					</p>
				)}
				{tool.websiteUrl && (
					<a
						href={tool.websiteUrl}
						target="_blank"
						rel="noopener noreferrer"
						className="mt-5 inline-flex w-full items-center justify-center border border-stroke-subtle px-3 py-2 font-mono text-[11px] font-semibold uppercase tracking-wider text-fg-secondary transition-colors hover:border-accent-lime hover:text-accent-lime"
					>
						Visit
					</a>
				)}
			</div>
		</div>
	);
}

function ToolCardMini({
	tool,
	config,
	tokens,
}: {
	tool: ProtoTool;
	config: ProtoConfig;
	tokens: Tokens;
}) {
	const color = categoryColor(config, tool.categories);
	return (
		<div
			className={cn(
				"flex items-center gap-3 transition-all",
				tokens.card.border,
				tokens.card.bg,
				tokens.card.hover,
				tokens.padSm,
			)}
		>
			<ProtoIcon name={tool.name} src={tool.iconUrl} color={color} size="sm" />
			<div className="min-w-0 flex-1">
				<p className="truncate font-mono text-sm font-semibold text-fg-primary">
					{tool.name}
				</p>
				<p className="font-mono text-[10px] uppercase tracking-wider text-fg-muted">
					{tool.tierName}
				</p>
			</div>
			<div className="shrink-0 text-right">
				<PriceTag tool={tool} size="sm" />
			</div>
		</div>
	);
}

function ToolCardBento({
	tool,
	config,
	tokens,
	featured,
}: {
	tool: ProtoTool;
	config: ProtoConfig;
	tokens: Tokens;
	featured: boolean;
}) {
	const color = categoryColor(config, tool.categories);
	return (
		<div
			className={cn(
				"group flex h-full flex-col transition-all",
				tokens.card.border,
				tokens.card.bg,
				tokens.card.hover,
				featured ? "p-6 md:p-8" : tokens.padSm,
			)}
		>
			<div className="flex items-start justify-between gap-3">
				<ProtoIcon
					name={tool.name}
					src={tool.iconUrl}
					color={color}
					size={featured ? "lg" : "md"}
				/>
				<PriceTag tool={tool} size={featured ? "lg" : "sm"} />
			</div>
			<h3
				className={cn(
					"mt-3 font-mono font-bold text-fg-primary",
					featured ? "text-xl" : "text-sm",
				)}
			>
				{tool.name}
			</h3>
			<p className="mt-0.5 font-mono text-[10px] uppercase tracking-wider text-fg-muted">
				{tool.tierName}
			</p>
			{featured && tool.description && (
				<p className="mt-3 text-sm leading-relaxed text-fg-secondary">
					{tool.description}
				</p>
			)}
			<div className="mt-auto pt-3">
				<Chip color={config.accent === "category" ? color : undefined}>
					{categoryLabel(tool.categories)}
				</Chip>
			</div>
		</div>
	);
}

function ToolsGrid({
	tools,
	config,
	tokens,
}: {
	tools: ProtoTool[];
	config: ProtoConfig;
	tokens: Tokens;
}) {
	if (tokens.toolsLayout === "showcase") {
		return (
			<div
				className={cn(
					"grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3",
					tokens.gap,
				)}
			>
				{tools.map((t) => (
					<ToolCardShowcase
						key={t._id}
						tool={t}
						config={config}
						tokens={tokens}
					/>
				))}
			</div>
		);
	}
	if (tokens.toolsLayout === "bento") {
		return (
			<div
				className={cn(
					"grid auto-rows-[1fr] grid-cols-2 lg:grid-cols-4",
					tokens.gap,
				)}
			>
				{tools.map((t, i) => {
					const featured = i === 0;
					return (
						<div
							key={t._id}
							className={cn(featured && "col-span-2 row-span-2")}
						>
							<ToolCardBento
								tool={t}
								config={config}
								tokens={tokens}
								featured={featured}
							/>
						</div>
					);
				})}
			</div>
		);
	}
	// editorial / cards2 — big two-column cards
	return (
		<div className={cn("grid grid-cols-1 lg:grid-cols-2", tokens.gap)}>
			{tools.map((t) => (
				<ToolCardBig key={t._id} tool={t} config={config} tokens={tokens} />
			))}
		</div>
	);
}

function Tools({
	config,
	tokens,
	index,
	stack,
}: {
	config: ProtoConfig;
	tokens: Tokens;
	index: number;
	stack: ProtoStack;
}) {
	const primary = sortToolsByPrice(
		config.splitTools
			? stack.tools.filter((t) => t.kind === "main")
			: stack.tools,
	);
	const secondary = config.splitTools
		? sortToolsByPrice(stack.tools.filter((t) => t.kind === "misc"))
		: [];

	const toolCost = stack.tools.reduce(
		(sum, t) =>
			t.price.fixed && t.priceKind !== "bundle" && t.priceKind !== "sponsored"
				? sum + t.price.fixed.amount
				: sum,
		0,
	);

	return (
		<Section config={config} index={index}>
			<SectionHeader
				tokens={tokens}
				index="02"
				kicker="// TOOLS"
				title="Tools"
				meta={`${stack.tools.length} items · $${toolCost}/mo`}
			/>
			<ToolsGrid tools={primary} config={config} tokens={tokens} />

			{secondary.length > 0 && (
				<div className="mt-12">
					<p className="mb-5 font-mono text-[11px] font-semibold uppercase tracking-[0.25em] text-fg-muted">
						{"// Also running"}
					</p>
					<div
						className={cn(
							"grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3",
							tokens.gap,
						)}
					>
						{secondary.map((t) => (
							<ToolCardMini
								key={t._id}
								tool={t}
								config={config}
								tokens={tokens}
							/>
						))}
					</div>
				</div>
			)}
		</Section>
	);
}

// ===========================================================================
// MODELS + BUNDLES — smaller cards
// ===========================================================================

const ROLE_LABEL: Record<ProtoModel["role"], string> = {
	primary: "Primary",
	secondary: "Secondary",
	specialized: "Specialized",
};

function ModelTile({
	model,
	config,
	tokens,
	variant,
}: {
	model: ProtoModel;
	config: ProtoConfig;
	tokens: Tokens;
	variant: "tiles" | "rows";
}) {
	const limeColor = categoryColor({ ...config, accent: "lime" }, undefined);
	return (
		<div
			className={cn(
				"flex items-center gap-3 transition-all",
				tokens.card.border,
				tokens.card.bg,
				tokens.card.hover,
				variant === "rows" ? "px-4 py-2.5" : tokens.padSm,
			)}
		>
			<ProtoIcon
				name={model.name}
				src={model.iconUrl}
				color={limeColor}
				size="sm"
			/>
			<div className="min-w-0 flex-1">
				<p className="truncate font-mono text-sm font-semibold text-fg-primary">
					{model.name}
				</p>
				<p className="font-mono text-[10px] uppercase tracking-wider text-fg-muted">
					{model.provider} · {ROLE_LABEL[model.role]}
				</p>
			</div>
		</div>
	);
}

function ModelChip({
	model,
	config,
}: {
	model: ProtoModel;
	config: ProtoConfig;
}) {
	const limeColor = categoryColor({ ...config, accent: "lime" }, undefined);
	return (
		<div className="inline-flex items-center gap-2 border border-stroke-subtle bg-bg-panel px-3 py-2 transition-colors hover:border-accent-lime">
			<ProtoIcon
				name={model.name}
				src={model.iconUrl}
				color={limeColor}
				size="sm"
			/>
			<div>
				<p className="font-mono text-xs font-semibold text-fg-primary">
					{model.name}
				</p>
				<p className="font-mono text-[10px] uppercase tracking-wider text-fg-muted">
					{model.provider}
				</p>
			</div>
		</div>
	);
}

function BundleCard({
	bundle,
	config,
	tokens,
}: {
	bundle: ProtoBundle;
	config: ProtoConfig;
	tokens: Tokens;
}) {
	const limeColor = categoryColor({ ...config, accent: "lime" }, undefined);
	return (
		<div
			className={cn(
				"flex flex-col transition-all",
				tokens.card.border,
				tokens.card.bg,
				tokens.card.shadow,
				tokens.card.hover,
				tokens.pad,
			)}
		>
			<div className="flex items-start gap-4">
				<ProtoIcon
					name={bundle.name}
					src={bundle.iconUrl}
					color={limeColor}
					size="lg"
				/>
				<div className="min-w-0 flex-1">
					<div className="flex items-start justify-between gap-3">
						<div>
							<h3 className="font-mono text-base font-bold text-fg-primary">
								{bundle.name}
							</h3>
							<p className="mt-0.5 font-mono text-[10px] uppercase tracking-wider text-fg-muted">
								{bundle.tierName}
							</p>
						</div>
						{bundle.price.fixed ? (
							<ProtoPrice
								amount={bundle.price.fixed.amount}
								period={bundle.price.fixed.period}
								size="lg"
								className="text-fg-primary"
							/>
						) : (
							<span className="font-mono text-sm font-bold text-fg-primary">
								Usage
							</span>
						)}
					</div>
				</div>
			</div>
			{bundle.description && (
				<p className="mt-4 text-sm leading-relaxed text-fg-secondary">
					{bundle.description}
				</p>
			)}
		</div>
	);
}

function ModelsBundles({
	config,
	tokens,
	index,
	stack,
}: {
	config: ProtoConfig;
	tokens: Tokens;
	index: number;
	stack: ProtoStack;
}) {
	const sortedModels = [...stack.models].sort((a, b) => {
		const p = a.provider.localeCompare(b.provider);
		return p !== 0 ? p : b.name.localeCompare(a.name);
	});

	return (
		// biome-ignore lint/correctness/useUniqueElementIds: stable anchor target for the "Bundle ↓" jump link
		<Section config={config} index={index} id="proto-models-bundles">
			<SectionHeader
				tokens={tokens}
				index="03"
				kicker="// MODELS & BUNDLES"
				title="Models & Bundles"
				meta={`${stack.models.length} models · ${stack.bundles.length} bundle`}
			/>

			<div className="grid grid-cols-1 gap-10 lg:grid-cols-[1.4fr_1fr] lg:gap-12">
				{/* Models */}
				<div>
					<p className="mb-5 font-mono text-[11px] font-semibold uppercase tracking-[0.25em] text-accent-lime">
						{"// Models"}
					</p>
					{tokens.modelsLayout === "chips" ? (
						<div className="flex flex-wrap gap-3">
							{sortedModels.map((m) => (
								<ModelChip key={m._id} model={m} config={config} />
							))}
						</div>
					) : tokens.modelsLayout === "rows" ? (
						<div className="space-y-2">
							{sortedModels.map((m) => (
								<ModelTile
									key={m._id}
									model={m}
									config={config}
									tokens={tokens}
									variant="rows"
								/>
							))}
						</div>
					) : (
						<div className={cn("grid grid-cols-1 sm:grid-cols-2", tokens.gap)}>
							{sortedModels.map((m) => (
								<ModelTile
									key={m._id}
									model={m}
									config={config}
									tokens={tokens}
									variant="tiles"
								/>
							))}
						</div>
					)}
				</div>

				{/* Bundles */}
				<div>
					<p className="mb-5 font-mono text-[11px] font-semibold uppercase tracking-[0.25em] text-accent-lime">
						{"// Bundles"}
					</p>
					<div className="space-y-4">
						{stack.bundles.length > 0 ? (
							stack.bundles.map((b) => (
								<BundleCard
									key={b._id}
									bundle={b}
									config={config}
									tokens={tokens}
								/>
							))
						) : (
							<div className="flex items-center gap-3 border border-stroke-subtle p-4 text-fg-muted">
								<Package className="size-5" />
								<span className="font-mono text-xs uppercase tracking-wider">
									No bundles
								</span>
							</div>
						)}
					</div>
				</div>
			</div>
		</Section>
	);
}

// ===========================================================================
// DESCRIPTION
// ===========================================================================

function ToolRefChip({ name, stack }: { name: string; stack: ProtoStack }) {
	const tool = stack.tools.find((t) => t.name === name);
	return (
		<span className="mx-0.5 inline-flex items-center gap-1 border border-stroke-subtle bg-bg-panel px-1.5 py-0.5 align-baseline font-mono text-[11px] font-semibold uppercase tracking-wide text-fg-primary">
			{tool && (
				<ProtoIcon
					name={tool.name}
					src={tool.iconUrl}
					color={categoryColor(
						{
							style: "editorial",
							accent: "category",
							rhythm: "flat",
							density: "comfortable",
							width: "wide",
							splitTools: true,
						},
						tool.categories,
					)}
					size="sm"
					className="!size-4"
				/>
			)}
			{name}
		</span>
	);
}

const spansText = (spans: Inline[]) =>
	spans.map((s) => (typeof s === "string" ? s : `@${s.ref}`)).join("");

function renderSpans(spans: Inline[], stack: ProtoStack): ReactNode {
	const seen = new Map<string, number>();
	return spans.map((s) => {
		const base = typeof s === "string" ? `t:${s}` : `r:${s.ref}`;
		const n = seen.get(base) ?? 0;
		seen.set(base, n + 1);
		const key = `${base}#${n}`;
		return typeof s === "string" ? (
			<span key={key}>{s}</span>
		) : (
			<ToolRefChip key={key} name={s.ref} stack={stack} />
		);
	});
}

function ProseRenderer({
	blocks,
	stack,
}: {
	blocks: ProseBlock[];
	stack: ProtoStack;
}) {
	return (
		<div className="max-w-3xl space-y-5">
			{blocks.map((b) => {
				if (b.kind === "h2") {
					return (
						<h3
							key={`h2:${b.text}`}
							className="flex items-center gap-2 pt-2 text-2xl font-bold text-fg-primary"
						>
							<span className="text-accent-lime">■</span>
							{b.text}
						</h3>
					);
				}
				if (b.kind === "p") {
					return (
						<p
							key={`p:${spansText(b.spans)}`}
							className="text-base leading-relaxed text-fg-secondary"
						>
							{renderSpans(b.spans, stack)}
						</p>
					);
				}
				if (b.kind === "ul") {
					return (
						<ul
							key={`ul:${b.items.map(spansText).join("|")}`}
							className="space-y-2"
						>
							{b.items.map((item) => (
								<li
									key={spansText(item)}
									className="flex gap-2 text-base leading-relaxed text-fg-secondary"
								>
									<span className="font-mono text-fg-muted">–</span>
									<span>{renderSpans(item, stack)}</span>
								</li>
							))}
						</ul>
					);
				}
				return (
					<blockquote
						key={`q:${b.text}`}
						className="border-l-4 border-accent-lime bg-bg-panel/40 py-3 pl-5 pr-4 text-base italic text-fg-secondary"
					>
						{b.text}
					</blockquote>
				);
			})}
		</div>
	);
}

function Description({
	config,
	tokens,
	index,
	stack,
}: {
	config: ProtoConfig;
	tokens: Tokens;
	index: number;
	stack: ProtoStack;
}) {
	return (
		<Section config={config} index={index}>
			<SectionHeader
				tokens={tokens}
				index="04"
				kicker="// WRITEUP"
				title="The Details"
			/>
			<ProseRenderer blocks={stack.description} stack={stack} />
		</Section>
	);
}

// ===========================================================================
// CTA + JOURNEY
// ===========================================================================

function Cta({ config }: { config: ProtoConfig }) {
	return (
		<section className="bg-accent-lime px-6 py-20 md:py-24">
			<div className={cn("mx-auto text-center", widthClass(config))}>
				<h2 className="text-4xl font-black uppercase leading-[0.9] tracking-tighter text-black md:text-6xl">
					Share Your Own Stack
				</h2>
				<p className="mx-auto mt-6 max-w-xl text-lg text-black/80">
					Help other builders by sharing the tools, costs, and workflows you
					run.
				</p>
				<span className="mt-10 inline-flex items-center gap-3 bg-black px-8 py-4 font-mono text-base font-bold uppercase tracking-widest text-white transition-colors hover:bg-zinc-800">
					Create Your Stack
					<ArrowRight className="size-5" />
				</span>
			</div>
		</section>
	);
}

export function StackJourney({
	config,
	stack,
}: {
	config: ProtoConfig;
	stack: ProtoStack;
}) {
	const tokens = getTokens(config);
	return (
		<div className="bg-bg-canvas">
			<Hero config={config} stack={stack} />
			<Projects config={config} tokens={tokens} index={1} stack={stack} />
			<Tools config={config} tokens={tokens} index={2} stack={stack} />
			<ModelsBundles config={config} tokens={tokens} index={3} stack={stack} />
			<Description config={config} tokens={tokens} index={4} stack={stack} />
			<Cta config={config} />
		</div>
	);
}
function Segmented<T extends string>({
	label,
	value,
	options,
	onChange,
}: {
	label: string;
	value: T;
	options: { value: T; label: string }[];
	onChange: (v: T) => void;
}) {
	return (
		<div>
			<p className="mb-1.5 font-mono text-[10px] font-semibold uppercase tracking-widest text-fg-muted">
				{label}
			</p>
			<div className="flex flex-wrap gap-1">
				{options.map((o) => (
					<button
						key={o.value}
						type="button"
						onClick={() => onChange(o.value)}
						className={cn(
							"border px-2.5 py-1 font-mono text-[11px] font-semibold uppercase tracking-wider transition-colors",
							value === o.value
								? "border-accent-lime bg-accent-lime text-accent-lime-contrast"
								: "border-stroke-subtle text-fg-secondary hover:border-stroke-strong hover:text-fg-primary",
						)}
					>
						{o.label}
					</button>
				))}
			</div>
		</div>
	);
}

export function ControlPanel({
	config,
	onChange,
}: {
	config: ProtoConfig;
	onChange: (next: ProtoConfig) => void;
}) {
	const [open, setOpen] = useState(true);
	const { theme, toggleTheme } = useTheme();
	const set = <K extends keyof ProtoConfig>(key: K, value: ProtoConfig[K]) =>
		onChange({ ...config, [key]: value });

	if (!open) {
		return (
			<button
				type="button"
				onClick={() => setOpen(true)}
				className="fixed bottom-5 right-5 z-[60] flex items-center gap-2 border-2 border-stroke-strong bg-bg-panel px-4 py-2.5 font-mono text-xs font-semibold uppercase tracking-wider text-fg-primary shadow-[4px_4px_0_var(--stroke-strong)] transition-colors hover:border-accent-lime hover:text-accent-lime"
			>
				<Settings2 className="size-4" />
				Variations
			</button>
		);
	}

	return (
		<div className="fixed bottom-5 right-5 z-[60] max-h-[calc(100vh-2.5rem)] w-[19rem] overflow-y-auto border-2 border-stroke-strong bg-bg-panel shadow-[6px_6px_0_var(--stroke-strong)]">
			<div className="sticky top-0 flex items-center justify-between border-b-2 border-stroke-strong bg-bg-panel px-4 py-3">
				<span className="font-mono text-xs font-bold uppercase tracking-[0.2em] text-accent-lime">
					Prototype Controls
				</span>
				<button
					type="button"
					onClick={() => setOpen(false)}
					className="text-fg-muted transition-colors hover:text-fg-primary"
					aria-label="Collapse controls"
				>
					<X className="size-4" />
				</button>
			</div>

			<div className="space-y-5 p-4">
				{/* Style */}
				<div>
					<p className="mb-1.5 font-mono text-[10px] font-semibold uppercase tracking-widest text-fg-muted">
						Style
					</p>
					<div className="grid grid-cols-2 gap-1.5">
						{(Object.keys(STYLE_META) as StyleId[]).map((id) => (
							<button
								key={id}
								type="button"
								onClick={() => set("style", id)}
								className={cn(
									"border px-2 py-1.5 text-left font-mono text-[11px] font-semibold uppercase tracking-wider transition-colors",
									config.style === id
										? "border-accent-lime bg-accent-lime text-accent-lime-contrast"
										: "border-stroke-subtle text-fg-secondary hover:border-stroke-strong hover:text-fg-primary",
								)}
							>
								{STYLE_META[id].label}
							</button>
						))}
					</div>
					<p className="mt-2 text-[11px] leading-snug text-fg-muted">
						{STYLE_META[config.style].blurb}
					</p>
				</div>

				<div className="border-t border-stroke-subtle" />

				<Segmented<Rhythm>
					label="Section rhythm"
					value={config.rhythm}
					onChange={(v) => set("rhythm", v)}
					options={[
						{ value: "flat", label: "Flat" },
						{ value: "alternating", label: "Alt" },
						{ value: "banded", label: "Banded" },
					]}
				/>
				<Segmented<Accent>
					label="Accent"
					value={config.accent}
					onChange={(v) => set("accent", v)}
					options={[
						{ value: "lime", label: "Lime" },
						{ value: "category", label: "Category" },
					]}
				/>
				<Segmented<Density>
					label="Density"
					value={config.density}
					onChange={(v) => set("density", v)}
					options={[
						{ value: "comfortable", label: "Comfy" },
						{ value: "compact", label: "Compact" },
					]}
				/>
				<Segmented<Width>
					label="Content width"
					value={config.width}
					onChange={(v) => set("width", v)}
					options={[
						{ value: "medium", label: "Med" },
						{ value: "wide", label: "Wide" },
						{ value: "full", label: "Full" },
					]}
				/>
				<Segmented<"yes" | "no">
					label="Split tool tiers"
					value={config.splitTools ? "yes" : "no"}
					onChange={(v) => set("splitTools", v === "yes")}
					options={[
						{ value: "yes", label: "Split" },
						{ value: "no", label: "Unified" },
					]}
				/>

				<div className="border-t border-stroke-subtle" />

				<button
					type="button"
					onClick={toggleTheme}
					className="flex w-full items-center justify-center gap-2 border border-stroke-subtle px-3 py-2 font-mono text-[11px] font-semibold uppercase tracking-wider text-fg-secondary transition-colors hover:border-accent-lime hover:text-accent-lime"
				>
					{theme === "dark" ? (
						<Sun className="size-3.5" />
					) : (
						<Moon className="size-3.5" />
					)}
					{theme === "dark" ? "Light mode" : "Dark mode"}
				</button>
			</div>
		</div>
	);
}

// ===========================================================================
// PAGE — interactive harness (default export; was src/routes/proto.stack.tsx)
// ===========================================================================

export default function ProtoStackPage() {
	const [config, setConfig] = useState<ProtoConfig>(DEFAULT_CONFIG);

	return (
		<div className="min-h-screen bg-bg-canvas">
			<div className="border-b border-stroke-subtle bg-bg-shell px-6 py-2 text-center font-mono text-[11px] uppercase tracking-widest text-fg-muted">
				Prototype · stack-view redesign · use the panel ↘ to switch variations
			</div>
			<StackJourney config={config} stack={MOCK_STACK} />
			<ControlPanel config={config} onChange={setConfig} />
		</div>
	);
}
