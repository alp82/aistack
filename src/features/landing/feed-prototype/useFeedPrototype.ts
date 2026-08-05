/**
 * PROTOTYPE — throwaway. Wayfinder ticket #84 (map #76).
 *
 * Owns the prototype's state: which variant, which density, the fixture rows
 * with live-aging timestamps, and event injection.
 *
 * It deliberately does NOT go through `validateSearch` on the landing route.
 * That validator returns a fixed key set, so an extra `?variant=` would be
 * stripped from the parsed search. The raw query string is read instead, and
 * writes go through `history.replaceState` — shareable and reload-stable
 * without touching production route code.
 */

import { useRouterState } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import { type ActivityEvent, type FeedRow, rowsFor } from "./fixtures";

export type VariantKey =
	| "E1"
	| "E2"
	| "E3"
	| "D2b"
	| "D2c"
	| "A"
	| "B"
	| "C"
	| "D1"
	| "D3";
export type Density = "real" | "grown";

export type DisplayRow = Omit<FeedRow, "minutesAgo"> & {
	/** Frozen at mount, so a row's age advances with the clock. */
	at: number;
	minutesAgo: number;
	isNew: boolean;
};

const VARIANTS: VariantKey[] = [
	"E1",
	"E2",
	"E3",
	"D2b",
	"D2c",
	"A",
	"B",
	"C",
	"D1",
	"D3",
];
const TICK_MS = 20_000;
const FLASH_MS = 2_500;

/** Rotated through on each "+ event" press, so repeated presses vary. */
const INJECTABLE: { stack: FeedRow["stack"]; event: ActivityEvent }[] = [
	{
		stack: { name: "Shipfast Solo", slug: "shipfast-solo", creator: "marco" },
		event: {
			type: "sync.landed",
			harnesses: [
				{
					harness: "claude-code",
					windowDays: 30,
					sessions: 191,
					activeDays: 19,
					projects: 11,
					totalTokens: 1_212_004_887,
				},
			],
		},
	},
	{
		stack: { name: "Kestrel", slug: "kestrel", creator: "diego" },
		event: {
			type: "stack.composition_changed",
			added: [{ kind: "tool", slug: "zed", name: "Zed" }],
			removed: [{ kind: "tool", slug: "vscode", name: "VS Code" }],
		},
	},
	{
		stack: { name: "Halfpipe", slug: "halfpipe", creator: "rin" },
		event: { type: "stack.published", toolCount: 7 },
	},
];

function readParams(searchStr: string) {
	const params = new URLSearchParams(
		searchStr.startsWith("?") ? searchStr.slice(1) : searchStr,
	);
	// `D`, `D2` and `D2a` were earlier names as the band narrowed. All of them
	// land on D2a1, the current default.
	const raw = params.get("variant");
	const upper = raw?.toUpperCase() ?? "";
	const ALIASES: Record<string, VariantKey> = {
		D: "E1",
		D2: "E1",
		D2A: "E1",
		D2A1: "E1",
		D2A2: "E1",
		D2A3: "E1",
		E1: "E1",
		E2: "E2",
		E3: "E3",
		D2B: "D2b",
		D2C: "D2c",
		D1: "D1",
		D3: "D3",
		A: "A",
		B: "B",
		C: "C",
	};
	const variant = ALIASES[upper];
	const density = params.get("density") as Density | null;
	return {
		variant: variant && VARIANTS.includes(variant) ? variant : null,
		density: density === "grown" ? "grown" : ("real" as Density),
	};
}

export function useFeedPrototype() {
	const searchStr = useRouterState({ select: (s) => s.location.searchStr });
	const initial = useMemo(() => readParams(searchStr), [searchStr]);

	const [variant, setVariantState] = useState<VariantKey | null>(
		initial.variant,
	);
	const [density, setDensityState] = useState<Density>(initial.density);

	// Relative time needs the client clock. Rendering it during SSR would
	// hydrate a stale "4h ago" against a fresh one.
	const [now, setNow] = useState<number | null>(null);
	useEffect(() => {
		setNow(Date.now());
		const id = setInterval(() => setNow(Date.now()), TICK_MS);
		return () => clearInterval(id);
	}, []);

	const [injected, setInjected] = useState<DisplayRow[]>([]);
	const [injectCount, setInjectCount] = useState(0);

	const writeUrl = useCallback((next: Record<string, string>) => {
		if (typeof window === "undefined") return;
		const params = new URLSearchParams(window.location.search);
		for (const [key, value] of Object.entries(next)) params.set(key, value);
		window.history.replaceState(null, "", `?${params.toString()}`);
	}, []);

	const setVariant = useCallback(
		(next: VariantKey) => {
			setVariantState(next);
			writeUrl({ variant: next });
		},
		[writeUrl],
	);

	const setDensity = useCallback(
		(next: Density) => {
			setDensityState(next);
			setInjected([]);
			writeUrl({ density: next });
		},
		[writeUrl],
	);

	const cycle = useCallback(
		(step: number) => {
			const index = VARIANTS.indexOf(variant ?? "A");
			setVariant(VARIANTS[(index + step + VARIANTS.length) % VARIANTS.length]);
		},
		[variant, setVariant],
	);

	const inject = useCallback(() => {
		const seed = INJECTABLE[injectCount % INJECTABLE.length];
		const at = Date.now();
		setInjectCount((c) => c + 1);
		setInjected((rows) => [
			{ id: `inj-${at}`, at, minutesAgo: 0, isNew: true, ...seed },
			...rows,
		]);
		setTimeout(
			() =>
				setInjected((rows) =>
					rows.map((r) => (r.at === at ? { ...r, isNew: false } : r)),
				),
			FLASH_MS,
		);
	}, [injectCount]);

	// Fixture timestamps are frozen once per density, then aged by the ticking
	// clock — otherwise every tick would slide the whole feed forward.
	const [base, setBase] = useState<number | null>(null);
	useEffect(() => {
		setBase(Date.now());
	}, []);
	// biome-ignore lint/correctness/useExhaustiveDependencies: density IS the trigger — swapping the fixture set re-anchors every timestamp.
	useEffect(() => {
		setBase(Date.now());
	}, [density]);

	const rows: DisplayRow[] = useMemo(() => {
		if (now === null || base === null) return [];
		const fixtures = rowsFor(density).map((row) => {
			const at = base - row.minutesAgo * 60_000;
			return { ...row, at, minutesAgo: (now - at) / 60_000, isNew: false };
		});
		const live = injected.map((row) => ({
			...row,
			minutesAgo: (now - row.at) / 60_000,
		}));
		return [...live, ...fixtures].sort((a, b) => a.minutesAgo - b.minutesAgo);
	}, [now, base, density, injected]);

	useEffect(() => {
		if (variant === null) return;
		function onKey(event: KeyboardEvent) {
			const target = event.target as HTMLElement | null;
			const tag = target?.tagName;
			if (tag === "INPUT" || tag === "TEXTAREA" || target?.isContentEditable) {
				return;
			}
			if (event.key === "ArrowLeft") cycle(-1);
			if (event.key === "ArrowRight") cycle(1);
		}
		window.addEventListener("keydown", onKey);
		return () => window.removeEventListener("keydown", onKey);
	}, [variant, cycle]);

	return {
		/** null means the prototype is off and the landing page renders normally. */
		variant,
		density,
		rows,
		ready: now !== null,
		setVariant,
		setDensity,
		cycle,
		inject,
	};
}
