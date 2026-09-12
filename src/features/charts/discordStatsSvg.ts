import type {
	RenderAnswer,
	RenderRequest,
} from "../discord/server/renderContract";
import { waffleCells } from "../usage/context";
import { CHART_SLOTS } from "./palette";

const palette = CHART_SLOTS.map((s) => s.dark);
const accent = "#c5f442";
const esc = (s: unknown) =>
	String(s).replace(
		/[&<>"']/g,
		(c) =>
			({
				"&": "&amp;",
				"<": "&lt;",
				">": "&gt;",
				'"': "&quot;",
				"'": "&apos;",
			})[c] ?? c,
	);
const cut = (s: string, length = 36) =>
	Array.from(s).length > length
		? `${Array.from(s)
				.slice(0, length - 1)
				.join("")}…`
		: s;
const txt = (
	x: number,
	y: number,
	s: unknown,
	size = 22,
	color = "#edf2f8",
	end = false,
) =>
	`<text x="${x}" y="${y}" font-family="DejaVu Sans Mono, monospace" font-size="${size}" fill="${color}"${end ? ' text-anchor="end"' : ""}>${esc(s)}</text>`;
const rect = (
	x: number,
	y: number,
	w: number,
	h: number,
	color: string,
	outline = false,
) =>
	`<rect x="${x}" y="${y}" width="${Math.max(0, w)}" height="${h}" fill="${color}"${outline ? ' stroke="#8793a2"' : ""}/>`;
export const compactNumber = (n: number | null | undefined): string =>
	n == null
		? "n/a"
		: Intl.NumberFormat("en-US", {
				notation: "compact",
				maximumFractionDigits: 1,
			}).format(n);
const dollars = (n: number | null | undefined) =>
	n == null ? "n/a" : `$${n.toFixed(2)}`;
const percent = (n: number | null | undefined) =>
	n == null ? "n/a" : `${(100 * n).toFixed(1)}%`;
const delta = (a: number | null | undefined, b: number | null | undefined) =>
	a == null || b == null || b === 0
		? "n/a vs previous period"
		: `${((a / b - 1) * 100).toFixed(1)}% vs previous period`;
export type IconImages = ReadonlyMap<string, string>;

/** Pure SVG presentation. Input order, filtering and prices belong to the projection. */
export function discordStatsSvg(
	request: RenderRequest,
	icons: IconImages = new Map(),
) {
	const { subject: a, comparison: b, command, full } = request;
	let y = 200;
	let svg =
		rect(0, 0, 960, 5, accent) +
		txt(48, 55, "AI STACK", 24, accent) +
		txt(912, 55, cut(a.identity.handle, 32), 22, "#aeb8c6", true) +
		rect(48, 82, 864, 1, "#303843") +
		txt(
			48,
			132,
			{
				tokens: "TOKEN USAGE",
				harness: "TOKENS BY HARNESS",
				cost: "MONTHLY SUBSCRIPTIONS",
				context: "CONTEXT PER CALL · MEDIAN",
				compare: "STACK COMPARISON",
			}[command],
			24,
		) +
		txt(
			48,
			170,
			`${a.range.current.from} to ${a.range.current.to} UTC`,
			20,
			"#aeb8c6",
		);
	const line = (s: string, size = 20) => {
		svg += txt(48, y, s, size, "#aeb8c6");
		y += size + 14;
	};
	const icon = (
		url: string | null | undefined,
		x: number,
		at: number,
		size = 32,
	) =>
		icons.has(url ?? "")
			? `<image x="${x}" y="${at}" width="${size}" height="${size}" href="${icons.get(url ?? "")}"/>`
			: rect(x, at, size, size, "#303843") +
				txt(x + size / 2, at + size * 0.72, "?", size * 0.65, "#8592a4");
	const nameOf = (
		answer: RenderAnswer,
		kind: "model" | "harness",
		id: string,
	) => answer.icons.find((i) => i.kind === kind && i.id === id);
	const cost = (answer: RenderAnswer) =>
		answer.publishCost ? answer.current.usage?.cost : null;
	const disclosure = (answer: RenderAnswer) => {
		const c = cost(answer);
		if (!c) {
			line("Measured usage cost: n/a");
			return;
		}
		line(
			`${dollars(c.usd)} ${c.estimated ? "estimate / lower bound" : "measured"} · ${percent(c.pricedShare)} of tokens priced`,
		);
		// Sources wrap without dropping identifiers, including full table citations.
		const source = `Price sources: ${c.pricingTables.join(", ") || "n/a"}`;
		for (let i = 0; i < source.length; i += 72)
			line(source.slice(i, i + 72), 18);
	};
	const row = (
		label: string,
		value: string,
		share: number | null,
		url?: string | null,
		index = 0,
		total = 2,
		amount?: number,
	) => {
		svg +=
			icon(url, 48, y - 24) +
			txt(
				96,
				y,
				cut(
					label,
					Math.max(
						12,
						Math.min(40, Math.floor((790 - value.length * 15) / 15)),
					),
				),
				25,
			) +
			txt(912, y, value, 25, "#edf2f8", true);
		if (share != null)
			svg +=
				rect(96, y + 18, 620, 7, "#28303a") +
				rect(
					96,
					y + 18,
					620 * Math.min(1, share),
					7,
					total === 1 ? accent : palette[index % palette.length],
				);
		if (amount !== undefined)
			svg += txt(912, y + 30, compactNumber(amount), 18, "#aeb8c6", true);
		y += 72;
	};
	const modelRows = (answer: RenderAnswer, other?: RenderAnswer) => {
		line(full ? "ALL MODELS" : "MODELS · 5%+ USAGE");
		const ids = full
			? (answer.current.usage?.models.map((m) => m.id) ?? [])
			: answer.current.modelIds;
		const otherIds = other
			? full
				? (other.current.usage?.models.map((m) => m.id) ?? [])
				: other.current.modelIds
			: [];
		const combined = [...new Set([...ids, ...otherIds])];
		if (!combined.length) line("Models: n/a");
		combined.forEach((id, index) => {
			const m = answer.current.usage?.models.find((m) => m.id === id),
				n = other?.current.usage?.models.find((m) => m.id === id),
				meta =
					nameOf(answer, "model", id) ?? (other && nameOf(other, "model", id));
			row(
				meta?.name ?? m?.catalogName ?? n?.catalogName ?? id,
				other
					? `${percent(m?.tokenShare)} / ${percent(n?.tokenShare)}`
					: percent(m?.tokenShare),
				other ? null : (m?.tokenShare ?? null),
				meta?.iconUrl,
				index,
				combined.length,
				other ? undefined : m?.totalTokens,
			);
			if (other) {
				svg +=
					rect(96, y - 54, 250 * (m?.tokenShare ?? 0), 6, palette[0]) +
					rect(370, y - 54, 250 * (n?.tokenShare ?? 0), 6, palette[1]);
			}
		});
	};
	const metric = (
		title: string,
		left: number | null | undefined,
		right: number | null | undefined,
		format = compactNumber,
	) => {
		line(title);
		svg +=
			txt(48, y + 48, format(left), 62) +
			txt(912, y + 48, format(right), 62, "#edf2f8", true);
		const max = Math.max(left ?? 0, right ?? 0, 1);
		svg +=
			rect(48, y + 70, (864 * (left ?? 0)) / max, 10, palette[0]) +
			rect(48, y + 90, (864 * (right ?? 0)) / max, 10, palette[1]);
		y += 136;
		line(
			left == null || right == null
				? "Difference: n/a"
				: `${format(Math.abs(left - right))} difference · ${right ? `${((left / right - 1) * 100).toFixed(1)}%` : "n/a"} relative change`,
		);
	};
	if (b) {
		line(`${cut(a.identity.handle, 25)} / ${cut(b.identity.handle, 25)}`, 25);
		y += 16;
	}
	if (command === "context") {
		const harness = a.selectedContextHarness;
		const sides = b ? [a, b] : [a];
		let bottom = y;
		sides.forEach((answer, index) => {
			const x = b ? 48 + index * 462 : 48,
				width = b ? 402 : 864,
				top = y;
			let at = top;
			const h = answer.publishWorkflow
				? answer.current.context.find((h) => h.harness === harness)
				: undefined;
			svg += txt(
				x,
				at,
				cut(answer.identity.handle, b ? 22 : 40),
				24,
				b ? palette[index] : accent,
			);
			at += 46;
			if (!h) {
				svg += txt(x, at, "n/a", 64);
				bottom = Math.max(bottom, at + 80);
				return;
			}
			svg += txt(x, at + 38, compactNumber(h.medianCall), 72);
			at += 83;
			svg += txt(
				x,
				at,
				`${h.window ? percent(h.medianCall / h.window) : "n/a"} of ${compactNumber(h.window)} window`,
				19,
			);
			at += 45;
			const meta = nameOf(answer, "harness", h.harness);
			svg +=
				icon(meta?.iconUrl, x, at - 25) +
				txt(x + 45, at, cut(meta?.name ?? h.harness, b ? 24 : 45), 23);
			at += 35;
			svg += txt(
				x,
				at,
				`${compactNumber(h.calls)} calls · ${compactNumber(h.p90Call)} p90`,
				19,
			);
			at += 32;
			const matrixTop = at;
			if (h.window) {
				const paint = {
					harness: palette[3],
					instructions: palette[1],
					usualChat: h.breakdownAvailable === false ? accent : palette[0],
					longChat: "none",
					free: "#28303a",
				};
				const cells = waffleCells(
					h.breakdownAvailable === false
						? { ...h, harnessTokens: 0, instructionsTokens: 0 }
						: h,
					h.window,
				);
				const step = b ? 18 : 22;
				cells.forEach((cell, i) => {
					svg += rect(
						x + (i % 20) * step,
						at + Math.floor(i / 20) * step,
						step - 4,
						step - 4,
						paint[cell],
						cell === "longChat",
					);
				});
				at += step * 10 + 28;
			} else {
				svg += txt(x, at, "Window occupancy: n/a", 20);
				at += 36;
			}
			const labels =
				h.breakdownAvailable === false
					? [["Breakdown", "n/a"]]
					: [
							["Harness", compactNumber(h.harnessTokens)],
							["Instructions", compactNumber(h.instructionsTokens)],
							["Usual chat", compactNumber(h.usualChat)],
							["Long chat", compactNumber(h.longChat)],
						];
			labels.push([
				"Free",
				h.window ? compactNumber(Math.max(0, h.window - h.medianCall)) : "n/a",
			]);
			const matrixBottom = at;
			const legendX = !b && h.window ? 542 : x;
			if (!b && h.window) at = matrixTop + 20;
			labels.forEach(([label, value], index) => {
				if (h.breakdownAvailable !== false)
					svg += rect(
						legendX,
						at - 14,
						12,
						12,
						[palette[3], palette[1], palette[0], "none", "#28303a"][index],
						label === "Long chat",
					);
				svg +=
					txt(legendX + 24, at, label, 21, "#aeb8c6") +
					txt(x + width - 16, at, value, 21, "#edf2f8", true);
				at += 34;
			});
			at = Math.max(at, matrixBottom);
			if (h.retainedCallsOnly) {
				svg += txt(x, at, "Retained calls only", 18, "#aeb8c6");
				at += 30;
			}
			bottom = Math.max(bottom, at);
		});
		y = bottom + 22;
		if (b) {
			const left = a.publishWorkflow
				? a.current.context.find((h) => h.harness === harness)?.medianCall
				: null;
			const right = b.publishWorkflow
				? b.current.context.find((h) => h.harness === harness)?.medianCall
				: null;
			line(
				left == null || right == null
					? "Median difference: n/a"
					: `${compactNumber(Math.abs(left - right))} median difference · ${right ? `${((left / right - 1) * 100).toFixed(1)}%` : "n/a"} relative change`,
			);
		}
		line("Each cell: 0.5% of window · outline reaches p90", 19);
	} else if (b) {
		if (command === "cost") {
			metric(
				"CURRENT MONTHLY SUBSCRIPTIONS",
				a.subscriptions.monthlyUSD,
				b.subscriptions.monthlyUSD,
				dollars,
			);
			line("Per month · current plans");
		} else if (command === "harness") {
			const id = a.selectedTokenHarness;
			line(nameOf(a, "harness", id ?? "")?.name ?? id ?? "Harness: n/a");
			metric(
				"SHARE OF TOKENS",
				a.current.usage?.harnesses.find((h) => h.harness === id)?.tokenShare,
				b.current.usage?.harnesses.find((h) => h.harness === id)?.tokenShare,
				percent,
			);
		} else {
			metric(
				"TOKENS",
				a.current.usage?.totalTokens,
				b.current.usage?.totalTokens,
			);
			if (command === "compare") {
				metric("MEASURED USAGE COST", cost(a)?.usd, cost(b)?.usd, dollars);
				for (const answer of [a, b]) {
					line(cut(answer.identity.handle));
					disclosure(answer);
				}
			}
			modelRows(a, b);
		}
	} else {
		const amount =
			command === "cost"
				? dollars(a.subscriptions.monthlyUSD)
				: compactNumber(a.current.usage?.totalTokens);
		svg += txt(42, y + 80, amount, 100);
		y += 125;
		line(
			command === "cost"
				? "Per month · current plans"
				: delta(a.current.usage?.totalTokens, a.previous.usage?.totalTokens),
		);
		y += 16;
		if (command === "cost") {
			line(full ? "ALL SUBSCRIPTIONS" : "SUBSCRIPTIONS · UP TO FIVE ENTRIES");
			const rows = full ? a.subscriptions.rows : a.subscriptions.preview;
			rows.forEach((r, i) => {
				row(
					r.name,
					r.state === "paid" ? dollars(r.monthlyUSD) : r.state,
					null,
					r.iconUrl,
					i,
					rows.length,
				);
			});
			disclosure(a);
		} else if (command === "harness") {
			const rows = a.current.usage?.harnesses ?? [];
			if (!rows.length) line("Harnesses: n/a");
			rows.forEach((h, i) => {
				const meta = nameOf(a, "harness", h.harness);
				row(
					meta?.name ?? h.harness,
					percent(h.tokenShare),
					h.tokenShare,
					meta?.iconUrl,
					i,
					rows.length,
					h.totalTokens,
				);
			});
		} else {
			if (command === "compare") disclosure(a);
			modelRows(a);
		}
	}
	const height = y + 90;
	if (height > 24000) throw new Error("Render height exceeds limit");
	svg +=
		rect(48, height - 54, 864, 1, "#303843") +
		txt(48, height - 22, "aistack.to · Published readings", 17, "#8592a4");
	return {
		svg: `<svg xmlns="http://www.w3.org/2000/svg" width="960" height="${height}">${rect(0, 0, 960, height, "#13171c")}${svg}</svg>`,
		width: 960,
		height,
	};
}
