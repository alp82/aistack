/**
 * PROTOTYPE — throwaway. Wayfinder ticket #92 (map #76).
 *
 * Three spines for `/leaderboard`, switchable from the floating bar:
 *
 *   ?variant=A  leaderboard-first — the board is the page
 *   ?variant=B  statistics-first — the state of AI coding spend
 *   ?variant=C  equal weight — a sticky stats rail beside the board
 *
 * Sub-shape B (a new route) because the page does not exist yet. Nothing here
 * is wired to Convex: the whole point is judging the design at 4, 50 and 500
 * rows, and prod has 4. The read side arrives with #83.
 *
 * DELETE THIS FILE before anything merges to main. The winner gets rewritten.
 */

import {
	createFileRoute,
	stripSearchParams,
	useNavigate,
	useSearch,
} from "@tanstack/react-router";
import { useCallback, useEffect, useMemo } from "react";
import { aggregate, type Weight } from "@/features/leaderboard/proto/aggregate";
import {
	CLOCKS,
	type ClockKey,
	type DensityKey,
	populationFor,
} from "@/features/leaderboard/proto/fixtures";
import {
	PrototypeSwitcher,
	VARIANT_KEYS,
	type VariantKey,
} from "@/features/leaderboard/proto/PrototypeSwitcher";
import { VariantA } from "@/features/leaderboard/proto/VariantA";
import { VariantB } from "@/features/leaderboard/proto/VariantB";
import { VariantC } from "@/features/leaderboard/proto/VariantC";
import { VariantC2 } from "@/features/leaderboard/proto/VariantC2";
import { coerceEnum, coercePage } from "@/lib/searchParams";

const DEFAULTS = {
	variant: "C2" as VariantKey,
	density: "real" as DensityKey,
	weight: "tokens" as Weight,
	clock: "now" as ClockKey,
	page: 1,
};

export const Route = createFileRoute("/leaderboard")({
	component: LeaderboardPrototype,
	// Every key optional, or `search` becomes required on every Link in the app.
	validateSearch: (
		search: Record<string, unknown>,
	): {
		variant?: VariantKey;
		density?: DensityKey;
		weight?: Weight;
		clock?: ClockKey;
		page?: number;
	} => ({
		variant: coerceEnum(search.variant, VARIANT_KEYS, "C2"),
		density: coerceEnum(
			search.density,
			["real", "grown", "scale"] as const,
			"real",
		),
		weight: coerceEnum(search.weight, ["tokens", "stacks"] as const, "tokens"),
		clock: coerceEnum(search.clock, ["now", "quiet", "dark"] as const, "now"),
		page: coercePage(search.page),
	}),
	search: { middlewares: [stripSearchParams(DEFAULTS)] },
});

function LeaderboardPrototype() {
	const navigate = useNavigate();
	const search = useSearch({ from: "/leaderboard" });

	const variant = search.variant ?? DEFAULTS.variant;
	const density = search.density ?? DEFAULTS.density;
	const weight = search.weight ?? DEFAULTS.weight;
	const clock = search.clock ?? DEFAULTS.clock;
	const page = search.page ?? DEFAULTS.page;

	const set = useCallback(
		(next: Partial<typeof DEFAULTS>) => {
			navigate({
				to: "/leaderboard",
				search: (prev) => ({ ...prev, ...next }),
				replace: true,
			});
		},
		[navigate],
	);

	const nowMs = CLOCKS[clock];
	const agg = useMemo(
		() => aggregate(populationFor(density, nowMs), nowMs),
		[density, nowMs],
	);

	const cycle = useCallback(
		(step: number) => {
			const i = VARIANT_KEYS.indexOf(variant);
			const next =
				VARIANT_KEYS[(i + step + VARIANT_KEYS.length) % VARIANT_KEYS.length];
			set({ variant: next, page: 1 });
		},
		[variant, set],
	);

	useEffect(() => {
		const onKey = (e: KeyboardEvent) => {
			const el = document.activeElement;
			if (
				el instanceof HTMLInputElement ||
				el instanceof HTMLTextAreaElement ||
				(el instanceof HTMLElement && el.isContentEditable)
			) {
				return;
			}
			if (e.key === "ArrowLeft") cycle(-1);
			if (e.key === "ArrowRight") cycle(1);
		};
		window.addEventListener("keydown", onKey);
		return () => window.removeEventListener("keydown", onKey);
	}, [cycle]);

	return (
		<>
			{variant === "A" && (
				<VariantA agg={agg} page={page} onPage={(p) => set({ page: p })} />
			)}
			{variant === "B" && <VariantB agg={agg} weight={weight} />}
			{variant === "C" && (
				<VariantC
					agg={agg}
					weight={weight}
					page={page}
					onPage={(p) => set({ page: p })}
				/>
			)}
			{(variant === "C2" || variant === "C3") && (
				<VariantC2
					agg={agg}
					weight={weight}
					page={page}
					onPage={(p) => set({ page: p })}
					quietGroup={variant === "C2" ? "list" : "line"}
				/>
			)}
			<div className="h-32" />
			<PrototypeSwitcher
				variant={variant}
				density={density}
				weight={weight}
				clock={clock}
				livingCount={agg.livingCount}
				staleCount={agg.stale.length}
				onCycle={cycle}
				onDensity={(d) => set({ density: d, page: 1 })}
				onWeight={(w) => set({ weight: w })}
				onClock={(c) => set({ clock: c, page: 1 })}
			/>
		</>
	);
}
