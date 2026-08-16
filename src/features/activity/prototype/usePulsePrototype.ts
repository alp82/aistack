/**
 * PROTOTYPE - throwaway. Three replacements for the landing PulseBand:
 * less height, chart promoted to the primary object, feed demoted.
 *
 * Switchable via `?variant=` on the existing `/` route. This deliberately does
 * NOT go through `validateSearch` (its fixed key set would strip `variant`):
 * the raw query string is read, and writes go through `history.replaceState`.
 * Same pattern as the #84 feed prototype (commit c8b981d).
 */

import { useRouterState } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useState } from "react";

export type PulseVariantKey = "A" | "B" | "C" | "D" | "E";

const VARIANTS: PulseVariantKey[] = ["D", "E", "A", "B", "C"];

function readVariant(searchStr: string): PulseVariantKey | null {
	const params = new URLSearchParams(
		searchStr.startsWith("?") ? searchStr.slice(1) : searchStr,
	);
	const raw = params.get("variant")?.toUpperCase() ?? "";
	return (VARIANTS as string[]).includes(raw) ? (raw as PulseVariantKey) : null;
}

export function usePulsePrototype() {
	const searchStr = useRouterState({ select: (s) => s.location.searchStr });
	const initial = useMemo(() => readVariant(searchStr), [searchStr]);
	const [variant, setVariantState] = useState<PulseVariantKey | null>(initial);

	const setVariant = useCallback((next: PulseVariantKey) => {
		setVariantState(next);
		if (typeof window === "undefined") return;
		const params = new URLSearchParams(window.location.search);
		params.set("variant", next);
		window.history.replaceState(null, "", `?${params.toString()}`);
	}, []);

	const cycle = useCallback(
		(step: number) => {
			const index = VARIANTS.indexOf(variant ?? "D");
			setVariant(VARIANTS[(index + step + VARIANTS.length) % VARIANTS.length]);
		},
		[variant, setVariant],
	);

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

	return { variant, cycle };
}
