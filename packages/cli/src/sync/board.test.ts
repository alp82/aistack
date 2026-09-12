import { describe, expect, test } from "vitest";
import {
	applyEvent,
	BAR_CELLS,
	type BoardRow,
	bar,
	createBoard,
	renderRows,
} from "./board.js";

// biome-ignore lint/suspicious/noControlCharactersInRegex: ANSI escapes
const plain = (s: string) => s.replace(/\x1b\[[0-9;]*m/g, "");

describe("board", () => {
	test("folds step and progress events into one row per id", () => {
		const rows = new Map<string, BoardRow>();
		applyEvent(
			rows,
			{ kind: "step", id: "harness:cursor", label: "Cursor", state: "waiting" },
			0,
		);
		applyEvent(
			rows,
			{
				kind: "step",
				id: "harness:cursor",
				label: "Cursor",
				state: "running",
				note: "checking history",
			},
			1000,
		);
		applyEvent(
			rows,
			{
				kind: "progress",
				id: "harness:cursor",
				done: 40,
				total: 327,
				unit: "files",
			},
			2000,
		);
		const row = rows.get("harness:cursor");
		expect(row).toMatchObject({
			state: "running",
			done: 40,
			total: 327,
			startedAt: 1000,
		});
		applyEvent(
			rows,
			{
				kind: "step",
				id: "harness:cursor",
				label: "Cursor",
				state: "done",
				note: "327 files · 61.0 s",
			},
			62000,
		);
		expect(rows.get("harness:cursor")).toMatchObject({
			state: "done",
			endedAt: 62000,
		});
		expect(rows.size).toBe(1);
	});

	test("draws a filled bar for a known total and a sweeping block for an unknown one", () => {
		expect(plain(bar(6, 12, 0))).toBe("██████░░░░░░");
		expect(plain(bar(12, 12, 0))).toBe("█".repeat(BAR_CELLS));
		expect(plain(bar(0, 12, 0))).toBe("░".repeat(BAR_CELLS));
		const a = plain(bar(5, undefined, 0));
		const b = plain(bar(5, undefined, 4));
		expect(a).toHaveLength(BAR_CELLS);
		expect(a).not.toBe(b);
		expect(a.split("█")).toHaveLength(4);
	});

	test("renders every state on its own line, labels aligned, cut to the width", () => {
		const rows: BoardRow[] = [
			{ id: "prices", label: "Prices", state: "done", note: "current" },
			{
				id: "harness:claude-code",
				label: "Claude Code",
				state: "running",
				note: "history",
				done: 312,
				unit: "files",
				startedAt: 0,
			},
			{
				id: "harness:cursor",
				label: "Cursor",
				state: "running",
				note: "recent usage",
				done: 40,
				total: 327,
				unit: "files",
				startedAt: 500,
			},
			{
				id: "harness:pi-mono",
				label: "Pi",
				state: "skipped",
				note: "nothing in window",
			},
			{ id: "git", label: "Git history", state: "waiting" },
			{ id: "x", label: "Broken", state: "failed", note: "boom" },
		];
		const lines = renderRows(rows, { now: 4200, width: 80, frame: 0 }).map(
			plain,
		);
		expect(lines).toEqual([
			"│  ● Prices       current",
			"│  ◐ Claude Code  ███░░░░░░░░░  312 files  history  4.2 s",
			"│  ◐ Cursor       █░░░░░░░░░░░  40/327 files  recent usage  3.7 s",
			"│  ○ Pi           nothing in window",
			"│  ○ Git history  waiting",
			"│  ✗ Broken       boom",
		]);
		const narrow = renderRows(rows, { now: 4200, width: 30, frame: 0 }).map(
			plain,
		);
		for (const line of narrow) expect([...line].length).toBeLessThan(30);
	});

	test("a live board repaints in place and paints the final frame at stop", () => {
		const out: string[] = [];
		let t = 0;
		const board = createBoard({
			write: (text) => out.push(text),
			interactive: true,
			columns: () => 80,
			now: () => t,
			frameMs: 1_000_000,
		});
		board.handle({
			kind: "step",
			id: "prices",
			label: "Prices",
			state: "running",
		});
		board.handle({
			kind: "step",
			id: "settings",
			label: "Stack settings",
			state: "running",
		});
		t = 300;
		board.handle({
			kind: "step",
			id: "prices",
			label: "Prices",
			state: "done",
			note: "current",
		});
		board.stop();
		expect(out).toHaveLength(1);
		const text = plain(out[0] ?? "");
		expect(text).toContain("● Prices          current");
		expect(text).toContain("◐ Stack settings");
		expect(out[0]).not.toContain("\x1b[2A");
		board.stop();
		expect(out).toHaveLength(1);
	});

	test("a board on a pipe prints the rows once, at stop", () => {
		const out: string[] = [];
		const board = createBoard({
			write: (text) => out.push(text),
			interactive: false,
			columns: () => 80,
			now: () => 0,
		});
		board.handle({
			kind: "step",
			id: "prices",
			label: "Prices",
			state: "done",
			note: "current",
		});
		board.stop();
		expect(out.map(plain)).toEqual(["│  ● Prices  current\n"]);
	});
});
