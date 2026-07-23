// PROTOTYPE — THROWAWAY. Profile page (/@handle) explorations for the
// profile-first decoupling (issue #27, design in #21). Three structurally
// different variants on /prototype/profile, switchable via ?variant= and the
// floating bottom bar. Mock data only — no Convex, no mutations. Delete me
// once a direction is picked.
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import {
	ArrowUpRight,
	BadgeCheck,
	ChevronLeft,
	ChevronRight,
	Eye,
	Globe,
	Layers,
	LineChart,
	Plus,
} from "lucide-react";
import { useEffect } from "react";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/prototype/profile")({
	validateSearch: (
		search: Record<string, unknown>,
	): { variant?: "a" | "b" | "c"; sparse?: boolean } => ({
		variant:
			search.variant === "b" || search.variant === "c"
				? search.variant
				: search.variant === "a"
					? "a"
					: undefined,
		sparse: search.sparse === true || search.sparse === "true" || undefined,
	}),
	component: PrototypeProfilePage,
});

// ---------------------------------------------------------------------------
// Mock data — shapes follow the #21 entity model: profile owns identity,
// stacks are titled artifacts.
// ---------------------------------------------------------------------------

type MockStack = {
	slug: string;
	title: string;
	oneLiner: string;
	monthly: number;
	usagePlus: boolean;
	tools: number;
	models: number;
	upvotes: number;
	updatedAgo: string;
};

type MockProfile = {
	handle: string;
	name: string;
	avatarHue: number;
	bio?: string;
	xHandle?: string;
	pages: { label: string; url: string }[];
	verified: boolean;
	joined: string;
	stacks: MockStack[];
};

const FULL: MockProfile = {
	handle: "ada",
	name: "Ada Winters",
	avatarHue: 96,
	bio: "Indie dev shipping small tools fast. I rebuild my stack every quarter and write down what actually earned its keep.",
	xHandle: "adawinters",
	pages: [
		{ label: "ada.dev", url: "https://ada.dev" },
		{ label: "github.com/ada", url: "https://github.com/ada" },
	],
	verified: true,
	joined: "2026-03",
	stacks: [
		{
			slug: "daily-driver",
			title: "Daily Driver",
			oneLiner:
				"The setup I actually open every morning — agentic-first, terminal-heavy.",
			monthly: 118,
			usagePlus: true,
			tools: 9,
			models: 3,
			upvotes: 41,
			updatedAgo: "3d ago",
		},
		{
			slug: "weekend-video",
			title: "Weekend Video Rig",
			oneLiner:
				"Everything for cutting devlogs: capture, edit, thumbnails, captions.",
			monthly: 54,
			usagePlus: false,
			tools: 6,
			models: 1,
			upvotes: 12,
			updatedAgo: "2w ago",
		},
		{
			slug: "client-work-safe",
			title: "Client-Work Safe",
			oneLiner:
				"The compliance-friendly subset I'm allowed to use on contracts.",
			monthly: 40,
			usagePlus: false,
			tools: 4,
			models: 2,
			upvotes: 7,
			updatedAgo: "1mo ago",
		},
	],
};

const SPARSE: MockProfile = {
	handle: "sam",
	name: "Sam Okafor",
	avatarHue: 210,
	bio: undefined,
	xHandle: undefined,
	pages: [],
	verified: false,
	joined: "2026-07",
	stacks: [
		{
			slug: "my-stack",
			title: "My Stack",
			oneLiner: "Tools I use for side projects.",
			monthly: 30,
			usagePlus: false,
			tools: 3,
			models: 1,
			upvotes: 2,
			updatedAgo: "5d ago",
		},
	],
};

const IS_OWNER = true; // pretend the viewer owns this profile

// ---------------------------------------------------------------------------
// Shared bits (kept tiny on purpose — each variant owns its own layout)
// ---------------------------------------------------------------------------

function MockAvatar({
	profile,
	className,
}: {
	profile: MockProfile;
	className?: string;
}) {
	return (
		<span
			className={cn(
				"inline-flex shrink-0 items-center justify-center border border-stroke-strong font-mono font-black uppercase",
				className,
			)}
			style={{
				backgroundColor: `oklch(0.35 0.09 ${profile.avatarHue})`,
				color: `oklch(0.92 0.15 ${profile.avatarHue})`,
			}}
		>
			{profile.name
				.split(" ")
				.map((w) => w[0])
				.join("")}
		</span>
	);
}

function Seam({ label, note }: { label: string; note: string }) {
	return (
		<div className="border border-dashed border-stroke-strong px-4 py-3 opacity-60">
			<span className="font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-fg-muted">
				{label}
			</span>
			<p className="mt-1 font-mono text-xs text-fg-muted">{note}</p>
		</div>
	);
}

// ---------------------------------------------------------------------------
// Variant A — "Editorial": centered hero like the stack page, person leads
// full-bleed; stacks as stacked full-width artifact rows beneath a section
// rule. Continuity play: profile reads like the stack page's big sibling.
// ---------------------------------------------------------------------------

function VariantA({ profile }: { profile: MockProfile }) {
	return (
		<div className="min-h-screen bg-bg-canvas text-fg-primary">
			<header className="relative border-b border-stroke-strong px-6 py-10 md:py-16">
				<div
					aria-hidden="true"
					className="pointer-events-none absolute inset-0 opacity-10"
					style={{
						backgroundImage:
							"linear-gradient(to right, var(--stroke-subtle) 1px, transparent 1px), linear-gradient(to bottom, var(--stroke-subtle) 1px, transparent 1px)",
						backgroundSize: "4rem 4rem",
					}}
				/>
				<div className="relative mx-auto flex max-w-7xl flex-col items-center gap-6 text-center">
					<MockAvatar profile={profile} className="size-24 text-3xl" />
					<div>
						<p className="font-mono text-sm text-accent-lime">
							@{profile.handle}
						</p>
						<h1 className="mt-2 break-words text-4xl font-black uppercase leading-[0.9] tracking-tighter sm:text-6xl md:text-7xl">
							{profile.name}
						</h1>
					</div>
					<div className="flex flex-wrap items-center justify-center gap-2 font-mono text-sm text-fg-secondary">
						{profile.xHandle && <span>@{profile.xHandle}</span>}
						{profile.pages.map((p) => (
							<span key={p.url} className="inline-flex items-center gap-1.5">
								<span className="text-stroke-strong">·</span>
								<Globe className="size-3.5" />
								{p.label}
							</span>
						))}
						{profile.verified && (
							<span className="inline-flex items-center gap-1.5 text-accent-lime">
								<span className="text-stroke-strong">·</span>
								<BadgeCheck className="size-3.5" />
								Verified
							</span>
						)}
					</div>
					<div className="h-1 w-14 bg-accent-lime" />
					{profile.bio ? (
						<p className="max-w-prose text-base text-fg-secondary md:text-xl">
							{profile.bio}
						</p>
					) : (
						<p className="max-w-prose font-mono text-sm text-fg-muted">
							Building with {profile.stacks[0].tools} tools · joined{" "}
							{profile.joined}
						</p>
					)}
					<div className="w-full max-w-md">
						<Seam
							label="Hire seam"
							note="“Available for work” affordance lands here later — P3."
						/>
					</div>
				</div>
			</header>

			<main className="mx-auto max-w-7xl px-6 py-10">
				<div className="mb-6 flex items-baseline justify-between">
					<h2 className="font-mono text-xs font-semibold uppercase tracking-[0.2em] text-fg-muted">
						Stacks — {profile.stacks.length}
					</h2>
					{IS_OWNER && (
						<button
							type="button"
							className="inline-flex items-center gap-1.5 border border-stroke-strong bg-bg-panel px-3 py-1 font-mono text-xs font-semibold uppercase tracking-[0.12em] transition-colors hover:border-accent-lime hover:text-accent-lime"
						>
							<Plus className="size-3" />
							Add stack
						</button>
					)}
				</div>
				<div className="flex flex-col gap-4">
					{profile.stacks.map((s) => (
						<a
							key={s.slug}
							href={`/stacks/${s.slug}`}
							className="group grid grid-cols-1 gap-4 border border-stroke-strong bg-bg-panel p-5 transition-all hover:shadow-[6px_6px_0_var(--stroke-strong)] md:grid-cols-[1fr_auto] md:p-6"
						>
							<div>
								<h3 className="text-2xl font-black uppercase tracking-tight group-hover:text-accent-lime md:text-3xl">
									{s.title}
								</h3>
								<p className="mt-2 max-w-prose text-fg-secondary">
									{s.oneLiner}
								</p>
								<p className="mt-3 font-mono text-[10px] uppercase tracking-wider text-fg-muted">
									{s.tools} tools · {s.models} models · ▲{s.upvotes} · updated{" "}
									{s.updatedAgo}
								</p>
							</div>
							<div className="flex items-center gap-4 md:flex-col md:items-end md:justify-center">
								<span className="bg-accent-lime px-4 py-2 font-mono text-xl font-black text-accent-lime-contrast">
									${s.monthly}
									{s.usagePlus && "+"}
									<span className="text-[10px] font-semibold">/mo</span>
								</span>
							</div>
						</a>
					))}
				</div>

				<div className="mt-10 grid gap-4 md:grid-cols-2">
					<Seam
						label="Live stats"
						note="Per-profile measured usage lands here once auto-sync ships (P0.2)."
					/>
					<Seam
						label="View analytics"
						note="Owner-only private dashboard slots in here (P1)."
					/>
				</div>
			</main>
		</div>
	);
}

// ---------------------------------------------------------------------------
// Variant B — "Dossier": split layout. Sticky identity column on the left
// (the person as a permanent fixture), stacks + future measured surfaces in
// the working column on the right. Person and work read as two registers.
// ---------------------------------------------------------------------------

function VariantB({ profile }: { profile: MockProfile }) {
	return (
		<div className="min-h-screen bg-bg-canvas text-fg-primary">
			<div className="mx-auto grid max-w-7xl grid-cols-1 gap-8 px-6 py-10 md:grid-cols-[300px_1fr] md:gap-12">
				{/* Identity column */}
				<aside className="md:sticky md:top-8 md:self-start">
					<MockAvatar profile={profile} className="size-32 text-4xl" />
					<h1 className="mt-5 text-3xl font-black uppercase leading-none tracking-tight">
						{profile.name}
					</h1>
					<p className="mt-1 font-mono text-sm text-accent-lime">
						@{profile.handle}
						{profile.verified && (
							<BadgeCheck className="ml-1.5 inline size-3.5 align-[-2px]" />
						)}
					</p>
					{profile.bio && (
						<p className="mt-4 text-sm leading-relaxed text-fg-secondary">
							{profile.bio}
						</p>
					)}
					<dl className="mt-5 space-y-2 border-t border-stroke-strong pt-4 font-mono text-xs">
						{profile.xHandle && (
							<div className="flex items-center gap-2 text-fg-secondary">
								<span className="text-fg-muted">X</span>@{profile.xHandle}
							</div>
						)}
						{profile.pages.map((p) => (
							<div
								key={p.url}
								className="flex items-center gap-2 text-fg-secondary"
							>
								<Globe className="size-3 text-fg-muted" />
								{p.label}
							</div>
						))}
						<div className="flex items-center gap-2 text-fg-muted">
							<span>joined</span>
							{profile.joined}
						</div>
					</dl>
					<div className="mt-5">
						<Seam label="Hire seam" note="“Available for work” badge — P3." />
					</div>
				</aside>

				{/* Working column */}
				<main>
					<div className="mb-5 flex items-baseline justify-between border-b border-stroke-strong pb-3">
						<h2 className="font-mono text-xs font-semibold uppercase tracking-[0.2em] text-fg-muted">
							<Layers className="mr-1.5 inline size-3.5 align-[-2px]" />
							Stacks — {profile.stacks.length}
						</h2>
						{IS_OWNER && (
							<button
								type="button"
								className="inline-flex items-center gap-1.5 border border-stroke-strong px-3 py-1 font-mono text-xs font-semibold uppercase tracking-[0.12em] transition-colors hover:border-accent-lime hover:text-accent-lime"
							>
								<Plus className="size-3" />
								New
							</button>
						)}
					</div>
					<div className="grid gap-4 lg:grid-cols-2">
						{profile.stacks.map((s, i) => (
							<a
								key={s.slug}
								href={`/stacks/${s.slug}`}
								className={cn(
									"group flex flex-col border border-stroke-strong bg-bg-panel p-5 transition-all hover:shadow-[6px_6px_0_var(--stroke-strong)]",
									i === 0 && "lg:col-span-2",
								)}
							>
								{i === 0 && (
									<span className="mb-3 self-start bg-accent-lime px-2 py-0.5 font-mono text-[10px] font-bold uppercase tracking-[0.14em] text-accent-lime-contrast">
										Most recent
									</span>
								)}
								<h3 className="text-xl font-black uppercase tracking-tight group-hover:text-accent-lime">
									{s.title}
								</h3>
								<p className="mt-1.5 text-sm text-fg-secondary">{s.oneLiner}</p>
								<div className="mt-4 flex items-end justify-between border-t border-stroke-subtle pt-3 font-mono">
									<span className="text-[10px] uppercase tracking-wider text-fg-muted">
										{s.tools}T · {s.models}M · ▲{s.upvotes} · {s.updatedAgo}
									</span>
									<span className="text-lg font-black">
										${s.monthly}
										{s.usagePlus && "+"}
										<span className="text-[10px] text-fg-muted">/mo</span>
									</span>
								</div>
							</a>
						))}
					</div>

					<div className="mt-8 space-y-4">
						<Seam
							label="Live stats"
							note="Measured usage per stack — lands with auto-sync (P0.2)."
						/>
						{IS_OWNER && (
							<Seam
								label="View analytics (owner-only)"
								note="Private per-profile dashboard — P1."
							/>
						)}
					</div>
				</main>
			</div>
		</div>
	);
}

// ---------------------------------------------------------------------------
// Variant C — "Ledger": registry-entry aesthetic. Compact identity band up
// top (small avatar, mono key-value metadata), then stacks as a dense ledger
// table with cost/stat columns and measured-surface columns reserved inline.
// ---------------------------------------------------------------------------

function VariantC({ profile }: { profile: MockProfile }) {
	const total = profile.stacks.reduce((n, s) => n + s.monthly, 0);
	const anyUsage = profile.stacks.some((s) => s.usagePlus);
	return (
		<div className="min-h-screen bg-bg-canvas text-fg-primary">
			<div className="mx-auto max-w-5xl px-6 py-10">
				{/* Identity band */}
				<header className="border border-stroke-strong bg-bg-panel">
					<div className="flex items-start gap-5 p-5 md:p-6">
						<MockAvatar profile={profile} className="size-16 text-xl" />
						<div className="min-w-0 flex-1">
							<div className="flex flex-wrap items-baseline gap-x-3">
								<h1 className="text-2xl font-black uppercase tracking-tight md:text-3xl">
									{profile.name}
								</h1>
								<span className="font-mono text-sm text-accent-lime">
									@{profile.handle}
								</span>
								{profile.verified && (
									<BadgeCheck className="size-4 self-center text-accent-lime" />
								)}
							</div>
							{profile.bio && (
								<p className="mt-2 max-w-prose text-sm text-fg-secondary">
									{profile.bio}
								</p>
							)}
						</div>
					</div>
					<dl className="grid grid-cols-2 border-t border-stroke-strong font-mono text-xs sm:grid-cols-4">
						{[
							["stacks", String(profile.stacks.length)],
							["spend", `$${total}${anyUsage ? "+" : ""}/mo`],
							["joined", profile.joined],
							[
								"links",
								profile.pages.length > 0
									? profile.pages.map((p) => p.label).join(" · ")
									: profile.xHandle
										? `@${profile.xHandle}`
										: "—",
							],
						].map(([k, v]) => (
							<div
								key={k}
								className="border-l border-stroke-strong px-4 py-3 first:border-l-0"
							>
								<dt className="text-[10px] uppercase tracking-[0.14em] text-fg-muted">
									{k}
								</dt>
								<dd className="mt-0.5 truncate text-fg-primary">{v}</dd>
							</div>
						))}
					</dl>
				</header>

				{/* Ledger */}
				<div className="mt-8 flex items-baseline justify-between">
					<h2 className="font-mono text-xs font-semibold uppercase tracking-[0.2em] text-fg-muted">
						Stack ledger
					</h2>
					{IS_OWNER && (
						<button
							type="button"
							className="inline-flex items-center gap-1.5 border border-stroke-strong px-3 py-1 font-mono text-xs font-semibold uppercase tracking-[0.12em] transition-colors hover:border-accent-lime hover:text-accent-lime"
						>
							<Plus className="size-3" />
							Add
						</button>
					)}
				</div>
				<div className="mt-3 overflow-x-auto border border-stroke-strong">
					<table className="w-full min-w-[640px] font-mono text-sm">
						<thead>
							<tr className="border-b border-stroke-strong bg-bg-panel text-left text-[10px] uppercase tracking-[0.14em] text-fg-muted">
								<th className="px-4 py-2.5 font-semibold">Stack</th>
								<th className="px-4 py-2.5 font-semibold">Contents</th>
								<th className="px-4 py-2.5 text-right font-semibold">$/mo</th>
								<th className="px-4 py-2.5 text-right font-semibold">▲</th>
								<th className="px-4 py-2.5 text-right font-semibold">
									Updated
								</th>
								<th className="px-4 py-2.5 text-right font-semibold opacity-50">
									<LineChart className="ml-auto size-3.5" />
								</th>
							</tr>
						</thead>
						<tbody>
							{profile.stacks.map((s) => (
								<tr
									key={s.slug}
									className="group border-b border-stroke-subtle transition-colors last:border-b-0 hover:bg-bg-panel"
								>
									<td className="px-4 py-3.5">
										<a
											href={`/stacks/${s.slug}`}
											className="font-sans text-base font-black uppercase tracking-tight group-hover:text-accent-lime"
										>
											{s.title}
											<ArrowUpRight className="ml-1 inline size-3.5 opacity-0 transition-opacity group-hover:opacity-100" />
										</a>
										<p className="mt-0.5 max-w-xs truncate font-sans text-xs text-fg-muted">
											{s.oneLiner}
										</p>
									</td>
									<td className="px-4 py-3.5 text-xs text-fg-secondary">
										{s.tools}T·{s.models}M
									</td>
									<td className="px-4 py-3.5 text-right font-black">
										${s.monthly}
										{s.usagePlus && "+"}
									</td>
									<td className="px-4 py-3.5 text-right text-fg-secondary">
										{s.upvotes}
									</td>
									<td className="px-4 py-3.5 text-right text-xs text-fg-muted">
										{s.updatedAgo}
									</td>
									<td className="px-4 py-3.5 text-right text-[10px] uppercase text-fg-muted opacity-50">
										sync soon
									</td>
								</tr>
							))}
						</tbody>
					</table>
				</div>

				<div className="mt-8 grid gap-4 sm:grid-cols-3">
					<Seam label="Live stats" note="Auto-sync (P0.2)." />
					<Seam label="View analytics" note="Owner-only — P1." />
					<Seam label="Hire seam" note="P3." />
				</div>
			</div>
		</div>
	);
}

// ---------------------------------------------------------------------------
// Switcher + page
// ---------------------------------------------------------------------------

const VARIANTS = [
	{ key: "a", name: "Editorial hero", Component: VariantA },
	{ key: "b", name: "Dossier split", Component: VariantB },
	{ key: "c", name: "Ledger", Component: VariantC },
] as const;

function PrototypeProfilePage() {
	const { variant = "a", sparse = false } = Route.useSearch();
	const navigate = useNavigate({ from: "/prototype/profile" });
	const index = VARIANTS.findIndex((v) => v.key === variant);
	const current = VARIANTS[index === -1 ? 0 : index];
	const profile = sparse ? SPARSE : FULL;

	const go = (delta: number) => {
		const next = VARIANTS[(index + delta + VARIANTS.length) % VARIANTS.length];
		navigate({
			search: { variant: next.key, sparse: sparse || undefined },
			replace: true,
		});
	};

	useEffect(() => {
		const onKey = (e: KeyboardEvent) => {
			const t = e.target as HTMLElement;
			if (
				t.tagName === "INPUT" ||
				t.tagName === "TEXTAREA" ||
				t.isContentEditable
			)
				return;
			if (e.key === "ArrowLeft") go(-1);
			if (e.key === "ArrowRight") go(1);
		};
		window.addEventListener("keydown", onKey);
		return () => window.removeEventListener("keydown", onKey);
	});

	return (
		<>
			<current.Component profile={profile} />
			{!import.meta.env.PROD && (
				<div className="fixed bottom-4 left-1/2 z-50 flex -translate-x-1/2 items-center gap-1 border border-stroke-strong bg-bg-panel px-1 py-1 font-mono text-xs shadow-[4px_4px_0_var(--stroke-strong)]">
					<button
						type="button"
						onClick={() => go(-1)}
						className="p-1.5 hover:text-accent-lime"
						aria-label="Previous variant"
					>
						<ChevronLeft className="size-4" />
					</button>
					<span className="min-w-40 text-center font-semibold uppercase tracking-wider">
						{current.key} — {current.name}
					</span>
					<button
						type="button"
						onClick={() => go(1)}
						className="p-1.5 hover:text-accent-lime"
						aria-label="Next variant"
					>
						<ChevronRight className="size-4" />
					</button>
					<button
						type="button"
						onClick={() =>
							navigate({
								search: { variant: current.key, sparse: !sparse || undefined },
								replace: true,
							})
						}
						className={cn(
							"ml-1 flex items-center gap-1 border-l border-stroke-strong px-2.5 py-1.5 uppercase tracking-wider",
							sparse
								? "text-accent-lime"
								: "text-fg-muted hover:text-fg-primary",
						)}
						aria-label="Toggle sparse profile"
					>
						<Eye className="size-3.5" />
						sparse
					</button>
				</div>
			)}
		</>
	);
}
