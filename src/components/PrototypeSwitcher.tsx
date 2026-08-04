/**
 * PROTOTYPE tooling - the floating variant bar. Throwaway.
 *
 * Shared by every `/prototype` run in this repo. It never renders in a
 * production build, so a stray merge cannot ship it to a visitor.
 */
import { useLocation } from "@tanstack/react-router";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { cn } from "@/lib/utils";

export type ProtoAxis<T extends string = string> = {
	/** URL search-param key. */
	param: string;
	/** Short caption shown left of the value. */
	title: string;
	options: { key: T; label: string }[];
};

export const IS_PROTOTYPE_ENABLED = process.env.NODE_ENV !== "production";

/**
 * Reads the prototype axes out of the URL and keeps them there.
 *
 * The router owns `searchStr` and is SSR-safe, so the first paint already has
 * the right variant - no post-hydration flip. Writes go through
 * `history.replaceState` so the typed route's search schema is untouched.
 */
export function useProtoAxes<T extends Record<string, string>>(
	axes: ProtoAxis[],
): [T, (param: string, value: string) => void] {
	const { searchStr } = useLocation();
	const read = useCallback((): T => {
		const params = new URLSearchParams(searchStr ?? "");
		const out: Record<string, string> = {};
		for (const axis of axes) {
			const raw = params.get(axis.param);
			const hit = axis.options.find((o) => o.key === raw);
			out[axis.param] = (hit ?? axis.options[0]).key;
		}
		return out as T;
	}, [searchStr, axes]);

	const [value, setValue] = useState<T>(read);
	useEffect(() => setValue(read()), [read]);

	const set = useCallback((param: string, next: string) => {
		setValue((prev) => ({ ...prev, [param]: next }) as T);
		if (typeof window === "undefined") return;
		const url = new URL(window.location.href);
		url.searchParams.set(param, next);
		window.history.replaceState(null, "", url.toString());
	}, []);

	return [value, set];
}

export function PrototypeSwitcher({
	axes,
	value,
	onChange,
	note,
}: {
	axes: ProtoAxis[];
	value: Record<string, string>;
	onChange: (param: string, next: string) => void;
	note?: string;
}) {
	const cycle = useCallback(
		(axis: ProtoAxis, dir: 1 | -1) => {
			const i = axis.options.findIndex((o) => o.key === value[axis.param]);
			const next =
				axis.options[(i + dir + axis.options.length) % axis.options.length];
			onChange(axis.param, next.key);
		},
		[value, onChange],
	);

	// Left/right cycle the first axis. Never steal keys from a text field.
	useEffect(() => {
		function onKey(e: KeyboardEvent) {
			const el = document.activeElement;
			if (
				el instanceof HTMLInputElement ||
				el instanceof HTMLTextAreaElement ||
				(el instanceof HTMLElement && el.isContentEditable)
			) {
				return;
			}
			if (e.key === "ArrowLeft") cycle(axes[0], -1);
			else if (e.key === "ArrowRight") cycle(axes[0], 1);
			else if (e.key === "ArrowUp" && axes[1]) cycle(axes[1], -1);
			else if (e.key === "ArrowDown" && axes[1]) cycle(axes[1], 1);
			else return;
			e.preventDefault();
		}
		window.addEventListener("keydown", onKey);
		return () => window.removeEventListener("keydown", onKey);
	}, [axes, cycle]);

	if (!IS_PROTOTYPE_ENABLED) return null;

	return (
		<div className="fixed inset-x-0 bottom-4 z-[60] flex justify-center px-4 print:hidden">
			<div className="flex max-w-full flex-col gap-1 border-2 border-fuchsia-500 bg-black/95 p-2 shadow-2xl backdrop-blur">
				{axes.map((axis, i) => {
					const opt =
						axis.options.find((o) => o.key === value[axis.param]) ??
						axis.options[0];
					return (
						<div key={axis.param} className="flex items-center gap-1">
							<button
								type="button"
								aria-label={`previous ${axis.title}`}
								onClick={() => cycle(axis, -1)}
								className="p-1 text-fuchsia-400 hover:bg-fuchsia-500/20"
							>
								<ChevronLeft size={14} />
							</button>
							<span
								className={cn(
									"min-w-[22rem] max-w-[70vw] truncate px-2 text-center font-mono text-[11px] uppercase tracking-wider",
									i === 0 ? "text-fuchsia-300" : "text-zinc-400",
								)}
							>
								<span className="text-fuchsia-500/60">{axis.title} </span>
								{opt.key} - {opt.label}
							</span>
							<button
								type="button"
								aria-label={`next ${axis.title}`}
								onClick={() => cycle(axis, 1)}
								className="p-1 text-fuchsia-400 hover:bg-fuchsia-500/20"
							>
								<ChevronRight size={14} />
							</button>
						</div>
					);
				})}
				{note && (
					<p className="px-2 text-center font-mono text-[10px] text-zinc-500">
						{note}
					</p>
				)}
			</div>
		</div>
	);
}
