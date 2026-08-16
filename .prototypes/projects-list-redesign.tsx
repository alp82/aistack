/**
 * PROTOTYPE - Projects List redesign  [SHIPPED 2026-05-31]
 * ---------------------------------------------------------------------------
 * CHOSEN: "editorial" layout, Air density, by-tag accent. Folded into the real
 * src/components/ProjectsSection.tsx on 2026-05-31. Kept here as the archived
 * exploration; the other five layouts are reference, not shipped.
 *
 * The old Projects section rendered a cramped 2-col grid of folder-icon cards.
 * This prototype explored six distinct layouts for the same data to pick a
 * direction.
 *
 * Each layout maps to a proven industry pattern, tuned to this brand
 * (terminal / monospace, sharp corners, lime-on-dark):
 *   1. editorial  - GitHub-style stacked rows           (readable, mid-density)
 *   2. cards      - Vercel / Notion gallery + stat bar   (visual browse)
 *   3. table      - `ls -la` dense table                 (power users, 20+)
 *   4. terminal   - shell window, ls listing             (signature novelty)
 *   5. bento      - asymmetric grid w/ featured hero      (overview / landing)
 *   6. board      - Kanban by draft/published            (publish pipeline)
 *
 * Switch everything live from the control panel (bottom-right): layout,
 * density, accent (lime vs per-tag color), dataset size (incl. empty state),
 * and viewer (visitor vs owner - owner reveals reorder/publish/delete).
 *
 * Self-contained: mock data is inline, no DB.
 *
 * TO VIEW: TanStack uses file-based routing (scans src/routes/ only), so a
 * thin bridge route in src/routes/ is needed to mount this in the browser.
 * That bridge is throwaway plumbing - create it only while viewing, delete
 * before committing. See .prototypes/README.md for the copy-paste snippet,
 * or just ask Claude to "mount the projects prototype".
 * ---------------------------------------------------------------------------
 */
import {
	AlignLeft,
	ArrowUpRight,
	ChevronDown,
	ChevronUp,
	Copy,
	Download,
	FileCode2,
	Kanban,
	LayoutDashboard,
	LayoutGrid,
	Maximize2,
	Minimize2,
	Moon,
	Plus,
	Star,
	Sun,
	Table,
	type LucideIcon,
	Terminal,
	Trash2,
} from "lucide-react";
import { type ComponentType, type ReactNode, useState } from "react";
import { SectionHeader } from "@/features/stack-view/ui";
import { useTheme } from "@/lib/theme";
import { cn } from "@/lib/utils";

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

type LayoutId =
	| "editorial"
	| "cards"
	| "table"
	| "terminal"
	| "bento"
	| "board";
type Density = "compact" | "comfortable" | "spacious";
type AccentMode = "lime" | "tag";
type CountMode = "empty" | "few" | "many";

type ProtoConfig = {
	layout: LayoutId;
	density: Density;
	accent: AccentMode;
	count: CountMode;
	owner: boolean;
};

// ---------------------------------------------------------------------------
// Mock data - shape mirrors convex projects.listByStack
// ---------------------------------------------------------------------------

type Project = {
	id: string;
	name: string;
	description: string;
	tags: string[];
	fileCount: number;
	cloneCount: number;
	source: "cli" | "web";
	published: boolean;
	updated: string;
	featured?: boolean;
};

const PROJECTS: Project[] = [
	{
		id: "p1",
		name: "claude-code-dotfiles",
		description:
			"Personal Claude Code setup - custom hooks, slash commands, and an opinionated settings.json tuned for TypeScript monorepos.",
		tags: ["cli", "hooks", "automation"],
		fileCount: 12,
		cloneCount: 1340,
		source: "cli",
		published: true,
		updated: "2d ago",
		featured: true,
	},
	{
		id: "p2",
		name: "cursor-rules-nextjs",
		description:
			"Battle-tested Cursor rules for Next.js 15 + App Router. Enforces server-component-first patterns and strict typing.",
		tags: ["cursor", "nextjs", "rules"],
		fileCount: 6,
		cloneCount: 980,
		source: "cli",
		published: true,
		updated: "5d ago",
	},
	{
		id: "p3",
		name: "mcp-server-toolkit",
		description:
			"Boilerplate and helpers for building Model Context Protocol servers in TypeScript, with a local inspector.",
		tags: ["mcp", "typescript"],
		fileCount: 9,
		cloneCount: 510,
		source: "cli",
		published: true,
		updated: "3d ago",
	},
	{
		id: "p4",
		name: "rag-pipeline-starter",
		description:
			"Production RAG pipeline with a built-in eval harness, hybrid search, and reranking. Bring your own vector store.",
		tags: ["rag", "python", "evals"],
		fileCount: 24,
		cloneCount: 412,
		source: "web",
		published: true,
		updated: "1w ago",
	},
	{
		id: "p5",
		name: "prompt-library",
		description:
			"A curated, version-controlled collection of prompts for coding, review, and refactoring tasks.",
		tags: ["prompts", "library"],
		fileCount: 31,
		cloneCount: 156,
		source: "web",
		published: true,
		updated: "4d ago",
	},
	{
		id: "p6",
		name: "design-tokens-ai",
		description:
			"AI-assisted design-token generator that turns a one-paragraph brand brief into a full Tailwind theme.",
		tags: ["design", "tokens"],
		fileCount: 14,
		cloneCount: 67,
		source: "web",
		published: true,
		updated: "2w ago",
	},
	{
		id: "p7",
		name: "agent-eval-suite",
		description:
			"Automated evaluation suite for LLM agents - task scoring, regression tracking, and CI integration.",
		tags: ["evals", "testing"],
		fileCount: 18,
		cloneCount: 42,
		source: "cli",
		published: false,
		updated: "6h ago",
	},
	{
		id: "p8",
		name: "voice-assistant-config",
		description:
			"Local Whisper + Piper TTS voice setup with wake-word detection and push-to-talk bindings.",
		tags: ["voice", "local", "whisper"],
		fileCount: 7,
		cloneCount: 23,
		source: "cli",
		published: false,
		updated: "1d ago",
	},
];

// ---------------------------------------------------------------------------
// Accent system - lime everywhere, or a stable per-tag color
// ---------------------------------------------------------------------------

type Accent = { text: string; bg: string; border: string; solid: string };

const LIME: Accent = {
	text: "text-accent-lime",
	bg: "bg-accent-lime/10",
	border: "border-accent-lime/40",
	solid: "bg-accent-lime",
};

const TAG_PALETTE: Accent[] = [
	{
		text: "text-cyan-400",
		bg: "bg-cyan-500/10",
		border: "border-cyan-500/40",
		solid: "bg-cyan-400",
	},
	{
		text: "text-violet-400",
		bg: "bg-violet-500/10",
		border: "border-violet-500/40",
		solid: "bg-violet-400",
	},
	{
		text: "text-amber-400",
		bg: "bg-amber-500/10",
		border: "border-amber-500/40",
		solid: "bg-amber-400",
	},
	{
		text: "text-rose-400",
		bg: "bg-rose-500/10",
		border: "border-rose-500/40",
		solid: "bg-rose-400",
	},
	{
		text: "text-emerald-400",
		bg: "bg-emerald-500/10",
		border: "border-emerald-500/40",
		solid: "bg-emerald-400",
	},
	{
		text: "text-sky-400",
		bg: "bg-sky-500/10",
		border: "border-sky-500/40",
		solid: "bg-sky-400",
	},
];

function accentFor(p: Project, mode: AccentMode): Accent {
	if (mode === "lime") return LIME;
	const key = p.tags[0] ?? p.name;
	let h = 0;
	for (let i = 0; i < key.length; i++) h = (h * 31 + key.charCodeAt(i)) >>> 0;
	return TAG_PALETTE[h % TAG_PALETTE.length];
}

const DENSITY: Record<
	Density,
	{ card: string; row: string; gap: string; cols: string; icon: IconSize }
> = {
	compact: {
		card: "p-3",
		row: "py-2",
		gap: "gap-2.5",
		cols: "lg:grid-cols-4",
		icon: "sm",
	},
	comfortable: {
		card: "p-5",
		row: "py-3.5",
		gap: "gap-4",
		cols: "lg:grid-cols-3",
		icon: "md",
	},
	spacious: {
		card: "p-7",
		row: "py-5",
		gap: "gap-6",
		cols: "lg:grid-cols-2",
		icon: "lg",
	},
};

function fmtCount(n: number): string {
	return n >= 1000 ? `${(n / 1000).toFixed(1).replace(/\.0$/, "")}k` : String(n);
}

// ---------------------------------------------------------------------------
// Shared primitives
// ---------------------------------------------------------------------------

type IconSize = "sm" | "md" | "lg" | "xl";

const MONO_SIZES: Record<IconSize, string> = {
	sm: "size-8 text-xs",
	md: "size-10 text-sm",
	lg: "size-12 text-base",
	xl: "size-16 text-2xl",
};

function Monogram({
	name,
	accent,
	size = "md",
}: {
	name: string;
	accent: Accent;
	size?: IconSize;
}) {
	return (
		<span
			className={cn(
				"inline-flex shrink-0 items-center justify-center border font-mono font-bold uppercase",
				MONO_SIZES[size],
				accent.bg,
				accent.border,
				accent.text,
			)}
		>
			{name.charAt(0)}
		</span>
	);
}

/** Drafts get a dashed amber tag - never opacity alone (research). */
function DraftTag() {
	return (
		<span className="shrink-0 border border-dashed border-amber-500/50 px-1.5 py-0.5 font-mono text-[10px] font-bold uppercase tracking-wider text-amber-400">
			draft
		</span>
	);
}

function Tags({
	tags,
	max = 3,
}: {
	tags: string[];
	max?: number;
}) {
	const shown = tags.slice(0, max);
	const extra = tags.length - shown.length;
	return (
		<div className="flex min-w-0 flex-wrap items-center gap-1">
			{shown.map((t) => (
				<span
					key={t}
					className="border border-stroke-subtle bg-bg-panel-muted px-1.5 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-wide text-fg-muted"
				>
					{t}
				</span>
			))}
			{extra > 0 && (
				<span className="font-mono text-[10px] text-fg-muted">+{extra}</span>
			)}
		</div>
	);
}

/** clones (hero) · files · source · updated - monospace, tabular. */
function MetaStrip({
	p,
	className,
	fields = "all",
}: {
	p: Project;
	className?: string;
	fields?: "all" | "mini";
}) {
	return (
		<div
			className={cn(
				"flex items-center gap-2.5 font-mono text-[11px] tabular-nums text-fg-muted",
				className,
			)}
		>
			<span className="inline-flex items-center gap-1">
				<Download className="size-3" />
				{fmtCount(p.cloneCount)}
			</span>
			<span className="text-stroke-subtle">·</span>
			<span className="inline-flex items-center gap-1">
				<FileCode2 className="size-3" />
				{p.fileCount}
			</span>
			{fields === "all" && (
				<>
					<span className="text-stroke-subtle">·</span>
					<span className="hidden sm:inline"># {p.source}</span>
					<span className="hidden text-stroke-subtle sm:inline">·</span>
					<span className="hidden sm:inline">{p.updated}</span>
				</>
			)}
		</div>
	);
}

function Reorder() {
	return (
		<div className="flex shrink-0 flex-col border border-stroke-subtle">
			<button
				type="button"
				aria-label="Move up"
				className="flex size-4 items-center justify-center text-fg-muted transition-colors hover:bg-bg-panel hover:text-accent-lime"
			>
				<ChevronUp className="size-3" />
			</button>
			<button
				type="button"
				aria-label="Move down"
				className="flex size-4 items-center justify-center border-t border-stroke-subtle text-fg-muted transition-colors hover:bg-bg-panel hover:text-accent-lime"
			>
				<ChevronDown className="size-3" />
			</button>
		</div>
	);
}

function OwnerActions({ p }: { p: Project }) {
	return (
		<div className="flex shrink-0 items-center gap-1">
			<button
				type="button"
				className="border border-stroke-subtle px-2 py-1 font-mono text-[10px] font-semibold uppercase tracking-wider text-fg-muted transition-colors hover:border-accent-lime hover:text-accent-lime"
			>
				{p.published ? "Unpublish" : "Publish"}
			</button>
			{!p.published && (
				<button
					type="button"
					aria-label="Delete"
					className="border border-stroke-subtle px-1.5 py-1 text-fg-muted transition-colors hover:border-destructive hover:text-destructive"
				>
					<Trash2 className="size-3" />
				</button>
			)}
		</div>
	);
}

function BlinkCaret({ className }: { className?: string }) {
	return (
		<span
			className={cn(
				"inline-block h-[1em] w-2 translate-y-[0.1em] animate-[blink_2.2s_ease-in-out_infinite] bg-accent-lime",
				className,
			)}
		/>
	);
}

// ---------------------------------------------------------------------------
// 1 - Editorial rows (GitHub-style)
// ---------------------------------------------------------------------------

function EditorialLayout({
	projects,
	cfg,
}: {
	projects: Project[];
	cfg: ProtoConfig;
}) {
	const d = DENSITY[cfg.density];
	return (
		<div className="border-t border-stroke-subtle">
			{projects.map((p) => {
				const a = accentFor(p, cfg.accent);
				return (
					<div
						key={p.id}
						className={cn(
							"group relative flex items-start gap-4 border-b border-stroke-subtle px-2 transition-colors hover:bg-bg-panel/40",
							d.row,
						)}
					>
						<span className="absolute left-0 top-0 h-full w-0.5 origin-top scale-y-0 bg-accent-lime transition-transform duration-200 group-hover:scale-y-100" />
						{cfg.owner && <Reorder />}
						<Monogram name={p.name} accent={a} size={d.icon} />
						<div className="min-w-0 flex-1">
							<div className="flex flex-wrap items-center gap-2">
								<h3 className="truncate font-mono text-base font-semibold text-fg-primary transition-colors group-hover:text-accent-lime">
									{p.name}
								</h3>
								{!p.published && <DraftTag />}
							</div>
							<p className="mt-1 line-clamp-1 text-sm text-fg-secondary">
								{p.description}
							</p>
							<div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1.5">
								<Tags tags={p.tags} />
								<MetaStrip p={p} />
							</div>
						</div>
						<div className="hidden shrink-0 items-center self-center md:flex">
							{cfg.owner ? (
								<OwnerActions p={p} />
							) : (
								<ArrowUpRight className="size-4 text-fg-muted transition-all group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-accent-lime" />
							)}
						</div>
					</div>
				);
			})}
		</div>
	);
}

// ---------------------------------------------------------------------------
// 2 - Spec cards (Vercel / Notion gallery)
// ---------------------------------------------------------------------------

function CardsLayout({
	projects,
	cfg,
}: {
	projects: Project[];
	cfg: ProtoConfig;
}) {
	const d = DENSITY[cfg.density];
	return (
		<div className={cn("grid grid-cols-1 sm:grid-cols-2", d.cols, d.gap)}>
			{projects.map((p) => {
				const a = accentFor(p, cfg.accent);
				return (
					<div
						key={p.id}
						className={cn(
							"group flex flex-col border bg-bg-panel/40 transition-all duration-150 hover:-translate-y-0.5 hover:border-accent-lime",
							p.published
								? "border-stroke-subtle"
								: "border-dashed border-amber-500/40",
						)}
					>
						<div className={cn("flex flex-1 items-start gap-3", d.card)}>
							<Monogram name={p.name} accent={a} size={d.icon} />
							<div className="min-w-0 flex-1">
								<div className="flex items-center gap-2">
									<h3 className="truncate font-mono text-sm font-semibold text-fg-primary transition-colors group-hover:text-accent-lime">
										{p.name}
									</h3>
									{!p.published && <DraftTag />}
								</div>
								<p className="mt-1.5 line-clamp-2 text-sm text-fg-secondary">
									{p.description}
								</p>
								<div className="mt-3">
									<Tags tags={p.tags} max={4} />
								</div>
							</div>
						</div>
						<div className="flex items-center justify-between border-t border-stroke-subtle px-4 py-2.5">
							<MetaStrip p={p} className="text-[10px]" />
							<ArrowUpRight className="size-3.5 shrink-0 text-fg-muted transition-colors group-hover:text-accent-lime" />
						</div>
						{cfg.owner && (
							<div className="flex items-center justify-end gap-1 border-t border-stroke-subtle bg-bg-panel/30 px-4 py-2">
								<OwnerActions p={p} />
							</div>
						)}
					</div>
				);
			})}
		</div>
	);
}

// ---------------------------------------------------------------------------
// 3 - Dense table (`ls -la`)
// ---------------------------------------------------------------------------

const TABLE_COLS =
	"grid-cols-[1.6fr_1fr_auto_auto_auto_auto] md:grid-cols-[2fr_1.2fr_5rem_4rem_5rem_5rem]";

function TableLayout({
	projects,
	cfg,
}: {
	projects: Project[];
	cfg: ProtoConfig;
}) {
	const rowPad =
		cfg.density === "compact"
			? "py-2"
			: cfg.density === "spacious"
				? "py-4"
				: "py-3";
	return (
		<div className="border border-stroke-subtle">
			<div
				className={cn(
					"grid items-center gap-4 border-b border-stroke-strong bg-bg-panel/60 px-4 py-2 font-mono text-[10px] uppercase tracking-wider text-fg-muted",
					TABLE_COLS,
				)}
			>
				<span>--name</span>
				<span className="hidden md:block">--tags</span>
				<span className="text-right">--clones</span>
				<span className="text-right">--files</span>
				<span className="hidden sm:block">--source</span>
				<span className="text-right">--updated</span>
			</div>
			{projects.map((p) => {
				const a = accentFor(p, cfg.accent);
				return (
					<div
						key={p.id}
						className={cn(
							"group relative grid items-center gap-4 border-b border-stroke-subtle px-4 transition-colors last:border-b-0 hover:bg-bg-panel/50",
							TABLE_COLS,
							rowPad,
						)}
					>
						<div className="flex min-w-0 items-center gap-2.5">
							{cfg.owner && <Reorder />}
							<span
								className={cn(
									"size-1.5 shrink-0",
									p.published ? a.solid : "bg-amber-400/70",
								)}
							/>
							<span className="truncate font-mono text-sm text-fg-primary transition-colors group-hover:text-accent-lime">
								{p.name}
							</span>
							{!p.published && (
								<span className="shrink-0 font-mono text-[10px] text-amber-400">
									[draft]
								</span>
							)}
						</div>
						<div className="hidden md:block">
							<Tags tags={p.tags} max={2} />
						</div>
						<span className="text-right font-mono text-xs tabular-nums text-fg-secondary">
							↓{fmtCount(p.cloneCount)}
						</span>
						<span className="text-right font-mono text-xs tabular-nums text-fg-muted">
							{p.fileCount}
						</span>
						<span className="hidden font-mono text-xs text-fg-muted sm:block">
							# {p.source}
						</span>
						<span className="text-right font-mono text-xs text-fg-muted">
							{p.updated}
						</span>
						{cfg.owner && (
							<div className="absolute inset-y-px right-0 flex items-center gap-1 border-l border-stroke-subtle bg-bg-panel px-3 opacity-0 transition-opacity group-hover:opacity-100">
								<OwnerActions p={p} />
							</div>
						)}
					</div>
				);
			})}
		</div>
	);
}

// ---------------------------------------------------------------------------
// 4 - Terminal window (signature view)
// ---------------------------------------------------------------------------

function TerminalLayout({
	projects,
	cfg,
}: {
	projects: Project[];
	cfg: ProtoConfig;
}) {
	return (
		<div className="border border-stroke-strong bg-bg-shell shadow-[var(--shadow-brutal-md)]">
			<div className="flex items-center justify-between border-b border-stroke-strong bg-bg-panel px-4 py-2">
				<div className="flex items-center gap-2 text-fg-muted">
					<Terminal className="size-3.5 text-accent-lime" />
					<span className="font-mono text-xs">~/stack/projects</span>
				</div>
				<span className="font-mono text-[10px] uppercase tracking-wider text-fg-muted">
					{projects.length} {projects.length === 1 ? "entry" : "entries"}
				</span>
			</div>
			<div className="p-4 font-mono text-sm">
				<p className="mb-3 text-xs text-fg-muted">
					<span className="text-accent-lime">❯</span> ls --projects
					--sort=order
				</p>
				<div className="space-y-px">
					{projects.map((p) => {
						const a = accentFor(p, cfg.accent);
						return (
							<div
								key={p.id}
								className="group grid grid-cols-[auto_auto_1fr_auto] items-center gap-3 border-l-2 border-transparent px-2 py-1.5 transition-colors hover:border-accent-lime hover:bg-bg-panel/50"
							>
								<span
									className={cn(
										"text-xs",
										p.published ? a.text : "text-amber-400",
									)}
								>
									{p.published ? "●" : "○"}
								</span>
								<span className="text-xs tabular-nums text-fg-muted">
									{String(p.fileCount).padStart(2, "0")}f
								</span>
								<span className="flex min-w-0 items-center gap-2">
									<span className="truncate text-fg-primary transition-colors group-hover:text-accent-lime">
										{p.name}/
									</span>
									{!p.published && (
										<span className="shrink-0 text-[10px] text-amber-400">
											[draft]
										</span>
									)}
								</span>
								<span className="flex items-center gap-3 text-xs tabular-nums text-fg-muted">
									<span>↓{fmtCount(p.cloneCount)}</span>
									<span className="hidden text-fg-muted/70 sm:inline">
										# {p.source}
									</span>
									<span className="hidden md:inline">{p.updated}</span>
									{cfg.owner && (
										<span className="hidden items-center gap-2 pl-1 opacity-0 transition-opacity group-hover:opacity-100 md:flex">
											<button
												type="button"
												className="text-fg-muted hover:text-accent-lime"
											>
												[{p.published ? "unpub" : "pub"}]
											</button>
											{!p.published && (
												<button
													type="button"
													className="text-fg-muted hover:text-destructive"
												>
													[rm]
												</button>
											)}
										</span>
									)}
								</span>
							</div>
						);
					})}
				</div>
				<p className="mt-3 flex items-center gap-1 text-xs text-fg-muted">
					<span className="text-accent-lime">❯</span>
					<BlinkCaret />
				</p>
			</div>
		</div>
	);
}

// ---------------------------------------------------------------------------
// 5 - Bento showcase (asymmetric grid)
// ---------------------------------------------------------------------------

function bentoSpan(i: number, featured: boolean | undefined): string {
	if (featured) return "col-span-2 row-span-2";
	const pattern = [
		"col-span-1 row-span-1",
		"col-span-1 row-span-1",
		"col-span-2 row-span-1",
		"col-span-1 row-span-1",
		"col-span-1 row-span-1",
		"col-span-2 row-span-1",
		"col-span-1 row-span-1",
	];
	return pattern[i % pattern.length];
}

function BentoLayout({
	projects,
	cfg,
}: {
	projects: Project[];
	cfg: ProtoConfig;
}) {
	const sorted = [...projects].sort(
		(x, y) => (y.featured ? 1 : 0) - (x.featured ? 1 : 0),
	);
	return (
		<div className="grid auto-rows-[10rem] grid-cols-2 gap-3 md:grid-cols-4 md:auto-rows-[11rem]">
			{sorted.map((p, i) => {
				const a = accentFor(p, cfg.accent);
				const span = bentoSpan(i, p.featured);
				const big = !!p.featured;
				const wide = span.includes("col-span-2") && !big;
				return (
					<div
						key={p.id}
						className={cn(
							"group relative flex flex-col justify-between overflow-hidden border bg-bg-panel/40 p-4 transition-all hover:border-accent-lime",
							span,
							p.published
								? "border-stroke-subtle"
								: "border-dashed border-amber-500/40",
						)}
					>
						{big && (
							<span
								aria-hidden
								className="pointer-events-none absolute -bottom-8 -right-3 select-none font-mono text-[9rem] font-black leading-none text-fg-primary/[0.04]"
							>
								{p.name.charAt(0).toUpperCase()}
							</span>
						)}
						<div className="relative flex items-start justify-between gap-2">
							<Monogram name={p.name} accent={a} size={big ? "lg" : "sm"} />
							<div className="flex items-center gap-1.5">
								{big && (
									<span className="inline-flex items-center gap-1 border border-accent-lime/40 bg-accent-lime/10 px-1.5 py-0.5 font-mono text-[10px] font-bold uppercase tracking-wider text-accent-lime">
										<Star className="size-2.5" />
										featured
									</span>
								)}
								{!p.published && <DraftTag />}
							</div>
						</div>
						<div className="relative">
							<h3
								className={cn(
									"truncate font-mono font-semibold text-fg-primary transition-colors group-hover:text-accent-lime",
									big ? "text-lg" : "text-sm",
								)}
							>
								{p.name}
							</h3>
							{(big || wide) && (
								<p className="mt-1.5 line-clamp-2 text-sm text-fg-secondary">
									{p.description}
								</p>
							)}
							<div className="mt-2 flex items-center justify-between gap-2">
								<Tags tags={p.tags} max={big ? 4 : 2} />
							</div>
							<MetaStrip p={p} className="mt-2 text-[10px]" fields="mini" />
						</div>
					</div>
				);
			})}
		</div>
	);
}

// ---------------------------------------------------------------------------
// 6 - Status board (Kanban by published/draft)
// ---------------------------------------------------------------------------

function BoardLayout({
	projects,
	cfg,
}: {
	projects: Project[];
	cfg: ProtoConfig;
}) {
	const columns = [
		{
			key: "published",
			label: "Published",
			dot: "bg-accent-lime",
			items: projects.filter((p) => p.published),
		},
		{
			key: "draft",
			label: "Draft",
			dot: "bg-amber-400",
			items: projects.filter((p) => !p.published),
		},
	];
	return (
		<div className="grid grid-cols-1 gap-4 md:grid-cols-2">
			{columns.map((col) => {
				const files = col.items.reduce((s, p) => s + p.fileCount, 0);
				return (
					<div
						key={col.key}
						className="flex flex-col border border-stroke-subtle bg-bg-panel/20"
					>
						<div className="flex items-center justify-between border-b border-stroke-subtle px-4 py-2.5">
							<div className="flex items-center gap-2">
								<span className={cn("size-2", col.dot)} />
								<span className="font-mono text-xs font-bold uppercase tracking-wider text-fg-primary">
									{col.label}
								</span>
								<span className="font-mono text-[10px] text-fg-muted">
									{col.items.length}
								</span>
							</div>
							<span className="font-mono text-[10px] uppercase tracking-wider tabular-nums text-fg-muted">
								Σ {files} files
							</span>
						</div>
						<div className="flex flex-1 flex-col gap-2 p-3">
							{col.items.length === 0 && (
								<p className="px-1 py-8 text-center font-mono text-xs text-fg-muted">
									- empty -
								</p>
							)}
							{col.items.map((p) => {
								const a = accentFor(p, cfg.accent);
								return (
									<div
										key={p.id}
										className="group border border-stroke-subtle bg-bg-canvas p-3 transition-colors hover:border-accent-lime"
									>
										<div className="flex items-center gap-2">
											<Monogram name={p.name} accent={a} size="sm" />
											<h3 className="truncate font-mono text-sm font-semibold text-fg-primary transition-colors group-hover:text-accent-lime">
												{p.name}
											</h3>
										</div>
										<p className="mt-1.5 line-clamp-2 text-xs text-fg-secondary">
											{p.description}
										</p>
										<div className="mt-2 flex items-center justify-between gap-2">
											<Tags tags={p.tags} max={2} />
											<MetaStrip p={p} className="text-[10px]" fields="mini" />
										</div>
										{cfg.owner && (
											<div className="mt-2 flex justify-end border-t border-stroke-subtle pt-2">
												<OwnerActions p={p} />
											</div>
										)}
									</div>
								);
							})}
						</div>
					</div>
				);
			})}
		</div>
	);
}

// ---------------------------------------------------------------------------
// Empty state - fake prompt, single CTA
// ---------------------------------------------------------------------------

function EmptyState() {
	return (
		<div className="border border-dashed border-stroke-subtle bg-bg-panel/20 px-6 py-12 text-center">
			<p className="font-mono text-sm text-fg-muted">
				<span className="text-accent-lime">❯</span> no projects yet
				<BlinkCaret className="ml-1" />
			</p>
			<p className="mx-auto mt-3 max-w-[28rem] text-sm text-fg-secondary">
				Push your AI config from any repo with the CLI, or create one by hand.
			</p>
			<div className="mt-5 inline-flex items-center border border-stroke-subtle bg-bg-panel">
				<code className="px-3 py-1.5 font-mono text-sm text-accent-lime">
					npx @use-aistack/cli collect
				</code>
				<span className="border-l border-stroke-subtle px-2 py-1.5 text-fg-muted">
					<Copy className="size-4" />
				</span>
			</div>
			<div className="mt-4">
				<button
					type="button"
					className="inline-flex items-center gap-1.5 border border-accent-lime bg-accent-lime/10 px-3 py-1.5 font-mono text-xs font-bold uppercase tracking-wider text-accent-lime transition-colors hover:bg-accent-lime hover:text-accent-lime-contrast"
				>
					<Plus className="size-3.5" />
					New Project
				</button>
			</div>
		</div>
	);
}

function OwnerToolbar() {
	return (
		<div className="mb-6 flex flex-wrap items-center gap-3">
			<button
				type="button"
				className="inline-flex items-center gap-1.5 border border-accent-lime bg-accent-lime/10 px-2.5 py-1 font-mono text-[10px] font-bold uppercase tracking-wider text-accent-lime transition-colors hover:bg-accent-lime hover:text-accent-lime-contrast"
			>
				<Plus className="size-3" />
				New Project
			</button>
			<div className="inline-flex items-center border border-stroke-subtle bg-bg-panel">
				<span className="px-2 py-1 font-mono text-[11px] uppercase tracking-wider text-fg-muted">
					add via
				</span>
				<code className="border-l border-stroke-subtle px-2 py-1 font-mono text-[11px] text-accent-lime">
					npx @use-aistack/cli collect
				</code>
				<span className="border-l border-stroke-subtle px-1.5 py-1 text-fg-muted">
					<Copy className="size-3.5" />
				</span>
			</div>
		</div>
	);
}

// ---------------------------------------------------------------------------
// Layout switch
// ---------------------------------------------------------------------------

const LAYOUTS: Record<
	LayoutId,
	ComponentType<{ projects: Project[]; cfg: ProtoConfig }>
> = {
	editorial: EditorialLayout,
	cards: CardsLayout,
	table: TableLayout,
	terminal: TerminalLayout,
	bento: BentoLayout,
	board: BoardLayout,
};

const LAYOUT_META: Record<LayoutId, { label: string; blurb: string }> = {
	editorial: {
		label: "Editorial",
		blurb:
			"GitHub-style stacked rows. Readable, mid-density - best for 5–20 projects.",
	},
	cards: {
		label: "Cards",
		blurb:
			"Vercel / Notion gallery grid with a footer stat bar. Best for visual browsing.",
	},
	table: {
		label: "Table",
		blurb:
			"Dense `ls -la` table, tabular + sortable. Best for power users and 20+ projects.",
	},
	terminal: {
		label: "Terminal",
		blurb:
			"Signature shell view - projects as an ls listing in a window. On-brand novelty.",
	},
	bento: {
		label: "Bento",
		blurb:
			"Asymmetric grid with a featured hero tile. Best for an overview / landing.",
	},
	board: {
		label: "Board",
		blurb:
			"Kanban by draft/published with per-column totals. Best for the publish pipeline.",
	},
};

// ---------------------------------------------------------------------------
// Control panel
// ---------------------------------------------------------------------------

type Opt<T> = { value: T; label: string; icon?: LucideIcon };

function Segmented<T extends string>({
	options,
	value,
	onChange,
}: {
	options: Opt<T>[];
	value: T;
	onChange: (v: T) => void;
}) {
	return (
		<div className="flex flex-wrap gap-1">
			{options.map((o) => {
				const active = o.value === value;
				return (
					<button
						key={o.value}
						type="button"
						onClick={() => onChange(o.value)}
						className={cn(
							"inline-flex items-center gap-1.5 border px-2 py-1 font-mono text-[10px] font-semibold uppercase tracking-wider transition-colors",
							active
								? "border-accent-lime bg-accent-lime text-accent-lime-contrast"
								: "border-stroke-subtle text-fg-muted hover:border-fg-muted hover:text-fg-secondary",
						)}
					>
						{o.icon && <o.icon className="size-3" />}
						{o.label}
					</button>
				);
			})}
		</div>
	);
}

function Field({ label, children }: { label: string; children: ReactNode }) {
	return (
		<div className="space-y-1.5">
			<p className="font-mono text-[9px] font-bold uppercase tracking-[0.2em] text-fg-muted">
				{label}
			</p>
			{children}
		</div>
	);
}

const LAYOUT_OPTS: Opt<LayoutId>[] = [
	{ value: "editorial", label: "Editorial", icon: AlignLeft },
	{ value: "cards", label: "Cards", icon: LayoutGrid },
	{ value: "table", label: "Table", icon: Table },
	{ value: "terminal", label: "Terminal", icon: Terminal },
	{ value: "bento", label: "Bento", icon: LayoutDashboard },
	{ value: "board", label: "Board", icon: Kanban },
];

function ControlPanel({
	cfg,
	set,
}: {
	cfg: ProtoConfig;
	set: (patch: Partial<ProtoConfig>) => void;
}) {
	const { theme, toggleTheme } = useTheme();
	const [open, setOpen] = useState(true);
	return (
		<div className="fixed bottom-4 right-4 z-50 w-[min(92vw,21rem)] border border-stroke-strong bg-bg-panel-elevated shadow-[var(--shadow-brutal-md)]">
			<div className="flex items-center justify-between border-b border-stroke-strong px-3 py-2">
				<span className="font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-accent-lime">
					Projects · Proto
				</span>
				<div className="flex items-center gap-1">
					<button
						type="button"
						onClick={toggleTheme}
						aria-label="Toggle theme"
						className="flex size-6 items-center justify-center border border-stroke-subtle text-fg-muted transition-colors hover:border-accent-lime hover:text-accent-lime"
					>
						{theme === "dark" ? (
							<Sun className="size-3" />
						) : (
							<Moon className="size-3" />
						)}
					</button>
					<button
						type="button"
						onClick={() => setOpen((o) => !o)}
						aria-label={open ? "Collapse" : "Expand"}
						className="flex size-6 items-center justify-center border border-stroke-subtle text-fg-muted transition-colors hover:border-accent-lime hover:text-accent-lime"
					>
						{open ? (
							<Minimize2 className="size-3" />
						) : (
							<Maximize2 className="size-3" />
						)}
					</button>
				</div>
			</div>
			{open && (
				<div className="space-y-3 p-3">
					<Field label="Layout">
						<Segmented
							options={LAYOUT_OPTS}
							value={cfg.layout}
							onChange={(v) => set({ layout: v })}
						/>
					</Field>
					<div className="grid grid-cols-2 gap-3">
						<Field label="Density">
							<Segmented
								options={[
									{ value: "compact", label: "Cmp" },
									{ value: "comfortable", label: "Cozy" },
									{ value: "spacious", label: "Air" },
								]}
								value={cfg.density}
								onChange={(v) => set({ density: v })}
							/>
						</Field>
						<Field label="Accent">
							<Segmented
								options={[
									{ value: "lime", label: "Lime" },
									{ value: "tag", label: "By tag" },
								]}
								value={cfg.accent}
								onChange={(v) => set({ accent: v })}
							/>
						</Field>
					</div>
					<div className="grid grid-cols-2 gap-3">
						<Field label="Dataset">
							<Segmented
								options={[
									{ value: "empty", label: "0" },
									{ value: "few", label: "4" },
									{ value: "many", label: "8" },
								]}
								value={cfg.count}
								onChange={(v) => set({ count: v })}
							/>
						</Field>
						<Field label="Viewer">
							<Segmented
								options={[
									{ value: "visitor" as const, label: "Visitor" },
									{ value: "owner" as const, label: "Owner" },
								]}
								value={cfg.owner ? "owner" : "visitor"}
								onChange={(v) => set({ owner: v === "owner" })}
							/>
						</Field>
					</div>
					<p className="border-t border-stroke-subtle pt-2 font-mono text-[10px] leading-relaxed text-fg-muted">
						<span className="text-fg-secondary">
							{LAYOUT_META[cfg.layout].label}.
						</span>{" "}
						{LAYOUT_META[cfg.layout].blurb}
					</p>
				</div>
			)}
		</div>
	);
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function ProjectsListProto() {
	const [cfg, setCfg] = useState<ProtoConfig>({
		layout: "editorial",
		density: "comfortable",
		accent: "lime",
		count: "few",
		owner: false,
	});
	const set = (patch: Partial<ProtoConfig>) =>
		setCfg((c) => ({ ...c, ...patch }));

	const dataset =
		cfg.count === "empty"
			? []
			: cfg.count === "few"
				? PROJECTS.slice(0, 4)
				: PROJECTS;
	// Visitors never see drafts (mirrors listByStack includeUnpublished).
	const visible = cfg.owner ? dataset : dataset.filter((p) => p.published);

	const Layout = LAYOUTS[cfg.layout];

	return (
		<div className="min-h-screen bg-bg-canvas pb-40 text-fg-primary">
			<section className="px-6 py-12 md:py-16">
				<div className="mx-auto max-w-7xl">
					<SectionHeader
						index="01"
						kicker="// PROJECTS"
						title="Projects"
						meta={
							visible.length > 0
								? `${visible.length} ${visible.length === 1 ? "project" : "projects"}`
								: undefined
						}
					/>
					{cfg.owner && <OwnerToolbar />}
					{visible.length === 0 ? (
						<EmptyState />
					) : (
						<Layout projects={visible} cfg={cfg} />
					)}
				</div>
			</section>
			<ControlPanel cfg={cfg} set={set} />
		</div>
	);
}
