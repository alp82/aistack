// The scan board (#420): one row per unit of stage work, redrawn in place
// while the steps run concurrently, the way a status bar lists subagents.
//
// The stage emits `StageEvent`s; `applyEvent` folds them into rows and
// `renderRows` turns rows into lines. Both are pure, so the drawing is tested
// without a terminal. `createBoard` owns the timer and the cursor movement: it
// paints every frame, moves the cursor back up, and paints again, so a step
// that stalls only stalls its own row. On a pipe it prints the finished rows
// once, at stop.

import { dim, lime, red } from "../theme.js";
import type { StageEvent } from "./stage.js";

export type BoardRow = {
	id: string;
	label: string;
	state: "waiting" | "running" | "done" | "skipped" | "failed";
	note?: string;
	done?: number;
	total?: number;
	unit?: string;
	startedAt?: number;
	endedAt?: number;
};

export const BAR_CELLS = 12;
const FILLED = "█";
const EMPTY = "░";
const PREFIX = "│  ";

export function applyEvent(
	rows: Map<string, BoardRow>,
	event: StageEvent,
	now: number,
): void {
	const row: BoardRow = rows.get(event.id) ?? {
		id: event.id,
		label: event.kind === "step" ? event.label : event.id,
		state: "waiting",
	};
	if (event.kind === "step") {
		row.label = event.label;
		row.state = event.state;
		row.note = event.note;
		if (event.state === "running" && row.startedAt === undefined)
			row.startedAt = now;
		if (event.state === "done" || event.state === "failed") row.endedAt = now;
		if (event.state === "running" && row.note !== undefined) {
			// A new running note is a new sub-step; its count starts over.
			row.done = undefined;
			row.total = undefined;
		}
	} else {
		row.done = event.done;
		row.total = event.total;
		row.unit = event.unit;
		if (event.note !== undefined) row.note = event.note;
		if (row.state === "waiting") row.state = "running";
		if (row.startedAt === undefined) row.startedAt = now;
	}
	rows.set(event.id, row);
}

/** A determinate bar, or the moving block of an activity bar when `total` is unknown. */
export function bar(
	done: number,
	total: number | undefined,
	frame: number,
): string {
	if (total !== undefined && total > 0) {
		const filled = Math.max(
			0,
			Math.min(BAR_CELLS, Math.round((done / total) * BAR_CELLS)),
		);
		return `${lime(FILLED.repeat(filled))}${dim(EMPTY.repeat(BAR_CELLS - filled))}`;
	}
	// A three-cell block sweeping back and forth: work is happening, size unknown.
	const span = BAR_CELLS - 3;
	const at = frame % (span * 2);
	const start = at < span ? at : span * 2 - at;
	return [...Array(BAR_CELLS).keys()]
		.map((i) => (i >= start && i < start + 3 ? lime(FILLED) : dim(EMPTY)))
		.join("");
}

const seconds = (ms: number) => `${(ms / 1000).toFixed(1)} s`;

export function renderRows(
	rows: readonly BoardRow[],
	opts: { now: number; width: number; frame: number },
): string[] {
	const labelWidth = Math.max(0, ...rows.map((r) => r.label.length));
	return rows.map((row) => {
		const label = row.label.padEnd(labelWidth);
		let icon: string;
		let body: string;
		switch (row.state) {
			case "waiting":
				icon = dim("○");
				body = dim("waiting");
				break;
			case "running": {
				icon = lime("◐");
				const parts: string[] = [bar(row.done ?? 0, row.total, opts.frame)];
				if (row.done !== undefined) {
					parts.push(
						row.total !== undefined
							? `${row.done}/${row.total} ${row.unit ?? ""}`.trimEnd()
							: `${row.done} ${row.unit ?? ""}`.trimEnd(),
					);
				}
				if (row.note) parts.push(dim(row.note));
				if (row.startedAt !== undefined)
					parts.push(dim(seconds(opts.now - row.startedAt)));
				body = parts.join("  ");
				break;
			}
			case "done":
				icon = lime("●");
				body = dim(row.note ?? "done");
				break;
			case "skipped":
				icon = dim("○");
				body = dim(row.note ?? "skipped");
				break;
			case "failed":
				icon = red("✗");
				body = red(row.note ?? "failed");
				break;
		}
		return fit(`${dim(PREFIX)}${icon} ${label}  ${body}`, opts.width);
	});
}

/** Cut a line to the terminal width, counting visible characters only. */
function fit(line: string, width: number): string {
	if (width <= 0) return line;
	let visible = 0;
	let out = "";
	// biome-ignore lint/suspicious/noControlCharactersInRegex: ANSI escapes
	for (const part of line.split(/(\x1b\[[0-9;]*m)/)) {
		if (part.startsWith("\x1b[")) {
			out += part;
			continue;
		}
		const room = width - 1 - visible;
		if (room <= 0) break;
		const slice = [...part].slice(0, room).join("");
		out += slice;
		visible += [...slice].length;
	}
	return `${out}\x1b[0m`;
}

export type Board = {
	handle: (event: StageEvent) => void;
	/** Paint the final frame and release the lines. */
	stop: () => void;
};

export function createBoard(opts: {
	write: (text: string) => void;
	interactive: boolean;
	columns?: () => number;
	now?: () => number;
	frameMs?: number;
}): Board {
	const rows = new Map<string, BoardRow>();
	const now = opts.now ?? (() => Date.now());
	const columns = opts.columns ?? (() => process.stdout.columns ?? 80);
	let painted = 0;
	let frame = 0;
	let stopped = false;
	const paint = () => {
		const lines = renderRows([...rows.values()], {
			now: now(),
			width: columns(),
			frame,
		});
		frame++;
		const up = painted > 0 ? `\x1b[${painted}A` : "";
		opts.write(`${up}${lines.map((line) => `\x1b[2K\r${line}`).join("\n")}\n`);
		painted = lines.length;
	};
	const timer = opts.interactive
		? setInterval(paint, opts.frameMs ?? 80)
		: null;
	return {
		handle: (event) => {
			if (stopped) return;
			applyEvent(rows, event, now());
		},
		stop: () => {
			if (stopped) return;
			stopped = true;
			if (timer) clearInterval(timer);
			if (opts.interactive) paint();
			else
				opts.write(
					`${renderRows([...rows.values()], { now: now(), width: columns(), frame: 0 }).join("\n")}\n`,
				);
		},
	};
}
