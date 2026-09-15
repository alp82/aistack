import type {
	RenderAnswer,
	RenderRequest,
} from "../discord/server/renderContract";
import { waffleCells } from "../usage/context";
import { CHART_SLOTS } from "./palette";

/**
 * The Discord stats cards. Pure SVG presentation over the render contract:
 * input order, filtering, prices and consent belong to the projection.
 *
 * One design for every command (prototype branch `prototype/discord-stats-cards`):
 * a name plate per person, the tilted VS between two, sections titled by a
 * lucide icon, duel meters and butterfly rows for a comparison, one hero value
 * and accent rows for a single person, and the brand footer with the range.
 * Nothing on the card cites a price table; the embed footer does.
 */

const palette = CHART_SLOTS.map((s) => s.dark);
const LIME = "#c5f442";
const VIOLET = "#b48cff";
/** Bar paint per side: the validated first two palette slots. */
const SIDE = [palette[0], palette[1]];
const BG = "#13171c";
const INK = "#edf2f8";
const MUTED = "#8592a4";
const TRACK = "#242b34";
const RULE = "#303843";
const PLATE_SHADOW = "#8793a2";
const W = 960;
const SANS = "DejaVu Sans, sans-serif";
const MONO = "DejaVu Sans Mono, monospace";

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
const cut = (s: string, n: number) =>
	Array.from(s).length > n
		? `${Array.from(s)
				.slice(0, n - 1)
				.join("")}…`
		: s;
type Anchor = "start" | "middle" | "end";
const mono = (
	x: number,
	y: number,
	s: unknown,
	size = 20,
	fill = MUTED,
	anchor: Anchor = "start",
	extra = "",
) =>
	`<text x="${x}" y="${y}" font-family="${MONO}" font-size="${size}" fill="${fill}" text-anchor="${anchor}" ${extra}>${esc(s)}</text>`;
const bold = (
	x: number,
	y: number,
	s: unknown,
	size: number,
	fill = INK,
	anchor: Anchor = "start",
	extra = "",
) =>
	`<text x="${x}" y="${y}" font-family="${SANS}" font-weight="bold" font-size="${size}" fill="${fill}" text-anchor="${anchor}" letter-spacing="${-size * 0.04}" ${extra}>${esc(s)}</text>`;
/** The hero title style: black, uppercase, tight. */
const black = (
	x: number,
	y: number,
	s: string,
	size: number,
	fill = INK,
	anchor: Anchor = "start",
) =>
	`<text x="${x}" y="${y}" font-family="${SANS}" font-weight="bold" font-size="${size}" fill="${fill}" text-anchor="${anchor}" letter-spacing="${-size * 0.06}">${esc(s.toUpperCase())}</text>`;
/** The tracked mono label style. */
const label = (
	x: number,
	y: number,
	s: string,
	fill = MUTED,
	anchor: Anchor = "start",
) =>
	`<text x="${x}" y="${y}" font-family="${MONO}" font-weight="bold" font-size="13" fill="${fill}" text-anchor="${anchor}" letter-spacing="2">${esc(s.toUpperCase())}</text>`;
const rect = (
	x: number,
	y: number,
	w: number,
	h: number,
	fill: string,
	extra = "",
) =>
	`<rect x="${x}" y="${y}" width="${Math.max(0, w)}" height="${h}" fill="${fill}" ${extra}/>`;
const poly = (points: number[][], fill: string) =>
	`<polygon points="${points.map((p) => p.join(",")).join(" ")}" fill="${fill}"/>`;
const image = (href: string, x: number, y: number, size: number) =>
	`<image x="${x}" y="${y}" width="${size}" height="${size}" href="${href}" preserveAspectRatio="xMidYMid slice"/>`;

export const compactNumber = (n: number | null | undefined): string =>
	n == null
		? "n/a"
		: Intl.NumberFormat("en-US", {
				notation: "compact",
				maximumFractionDigits: 1,
			}).format(n);
const money = (n: number | null | undefined) =>
	n == null ? "n/a" : `$${Math.round(n).toLocaleString("en-US")}`;
const pct = (n: number | null | undefined) =>
	n == null ? "–" : `${Math.round(100 * n)}%`;
const MONTHS = [
	"Jan",
	"Feb",
	"Mar",
	"Apr",
	"May",
	"Jun",
	"Jul",
	"Aug",
	"Sep",
	"Oct",
	"Nov",
	"Dec",
];
/** "Sep 9 to 15, 2026". One month folds; different months or years spell both ends. */
export function rangeLabel(range: RenderAnswer["range"]) {
	const [fy, fm, fd] = range.current.from.split("-").map(Number);
	const [ty, tm, td] = range.current.to.split("-").map(Number);
	const from = `${MONTHS[fm - 1]} ${fd}${fy !== ty ? `, ${fy}` : ""}`;
	const to =
		fy !== ty || fm !== tm ? `${MONTHS[tm - 1]} ${td}, ${ty}` : `${td}, ${ty}`;
	return `${from} to ${to}`;
}

export type IconImages = ReadonlyMap<string, string>;

/** Lucide outlines on the 24-unit grid, stroke only. */
const LUCIDE: Record<string, string> = {
	coins:
		'<circle cx="8" cy="8" r="6"/><path d="M18.09 10.37A6 6 0 1 1 10.34 18"/><path d="M7 6h1v4"/><path d="m16.71 13.88.7.71-2.82 2.82"/>',
	dollar:
		'<line x1="12" x2="12" y1="2" y2="22"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>',
	box: '<path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/><path d="m3.3 7 8.7 5 8.7-5"/><path d="M12 22V12"/>',
	terminal:
		'<polyline points="4 17 10 11 4 5"/><line x1="12" x2="20" y1="19" y2="19"/>',
	gauge: '<path d="m12 14 4-4"/><path d="M3.34 19a10 10 0 1 1 17.32 0"/>',
};
const lucide = (name: string, x: number, y: number, size: number) =>
	`<g transform="translate(${x} ${y}) scale(${size / 24})" fill="none" stroke="${INK}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${LUCIDE[name]}</g>`;

const grid = (y0: number, h: number) => {
	let g = "";
	for (let x = 48; x < W; x += 64) g += rect(x, y0, 1, h, "#1e242c");
	for (let y = y0 + 8; y < y0 + h; y += 64) g += rect(0, y, W, 1, "#1e242c");
	return g;
};
const iconOrBox = (
	icons: IconImages,
	url: string | null | undefined,
	x: number,
	y: number,
	size: number,
) =>
	icons.get(url ?? "")
		? image(icons.get(url ?? "") as string, x, y, size)
		: rect(x, y, size, size, "#2a323c") +
			mono(x + size / 2, y + size * 0.7, "?", size * 0.6, MUTED, "middle");
/** The avatar, or a dark square with the handle's first letter. */
const avatar = (
	icons: IconImages,
	side: RenderAnswer,
	x: number,
	y: number,
	size: number,
) => {
	const href = icons.get(side.identity.avatarUrl ?? "");
	return (
		rect(x - 1, y - 1, size + 2, size + 2, BG) +
		(href
			? image(href, x, y, size)
			: bold(
					x + size / 2,
					y + size * 0.72,
					(Array.from(side.identity.handle)[0] ?? "?").toUpperCase(),
					size * 0.6,
					INK,
					"middle",
				))
	);
};
/** One name plate: solid side color, dark type, gray offset. */
function plate(
	icons: IconImages,
	x: number,
	y: number,
	side: RenderAnswer,
	color: string,
	right: boolean,
) {
	let svg =
		rect(x + 8, y + 8, 440, 100, PLATE_SHADOW) + rect(x, y, 440, 100, color);
	const ax = right ? x + 440 - 16 - 68 : x + 16;
	svg += avatar(icons, side, ax, y + 16, 68);
	const tx = right ? ax - 16 : ax + 68 + 16;
	const anchor: Anchor = right ? "end" : "start";
	svg += black(tx, y + 58, cut(side.identity.handle, 12), 44, BG, anchor);
	svg += label(tx, y + 84, `@${cut(side.identity.handle, 26)}`, BG, anchor);
	return svg;
}
const italic = 'font-style="italic"';
/** The VS mark: white face, lime outline, one solid dark drop shadow, tilted. */
const vsMark = (cx: number, cy: number) =>
	`<g transform="rotate(-6 ${cx} ${cy})">${bold(cx + 8, cy + 8, "VS", 72, BG, "middle", `${italic} stroke="${BG}" stroke-width="8" paint-order="stroke"`)}${bold(cx, cy, "VS", 72, INK, "middle", `${italic} stroke="${LIME}" stroke-width="4" paint-order="stroke"`)}</g>`;

function headerVersus(a: RenderAnswer, b: RenderAnswer, icons: IconImages) {
	const H = 240;
	let svg = rect(0, 0, W, 5, LIME) + grid(5, H - 5);
	svg += plate(icons, 24, 30, a, LIME, false);
	svg += plate(icons, 496, 106, b, VIOLET, true);
	svg += vsMark(480, 150);
	return { svg, y: H + 52 };
}
function headerSolo(a: RenderAnswer, icons: IconImages, title: string) {
	const H = 176;
	let svg = rect(0, 0, W, 5, LIME) + grid(5, H - 5);
	svg += plate(icons, 24, 36, a, LIME, false);
	svg += black(912, 96, title, 30, INK, "end");
	svg += label(912, 122, rangeLabel(a.range), MUTED, "end");
	return { svg, y: H + 52 };
}
/** The site's brand mark: a lime square with a glow, then AI STACK. */
const brand = (x: number, y: number) =>
	rect(x - 4, y - 16, 20, 20, LIME, 'opacity="0.12"') +
	rect(x - 2, y - 14, 16, 16, LIME, 'opacity="0.25"') +
	rect(x, y - 12, 12, 12, LIME) +
	`<text x="${x + 22}" y="${y}" font-family="${SANS}" font-weight="bold" font-size="18" fill="${INK}" letter-spacing="-1">AI STACK</text>`;
function footer(height: number, r: RenderRequest) {
	const { range } = r.subject;
	return (
		rect(48, height - 56, 864, 1, RULE) +
		brand(48, height - 20) +
		mono(
			912,
			height - 21,
			`${rangeLabel(range)} · ${range.days} day${range.days === 1 ? "" : "s"}`,
			15,
			MUTED,
			"end",
		)
	);
}

/** A section title: lucide icon, mono label, thin rule. */
const title = (y: number, icon: string, text: string) =>
	rect(48, y, 864, 1, RULE) +
	rect(44, y - 12, 28, 24, BG) +
	lucide(icon, 48, y - 10, 20) +
	mono(80, y + 6, text, 16, INK);
type Fmt = (n: number | null | undefined) => string;
/** Duel meter: two big values and one shared bar split where the totals meet. */
function meter(
	y: number,
	icon: string,
	text: string,
	left: number | null | undefined,
	right: number | null | undefined,
	fmt: Fmt,
) {
	const total = (left ?? 0) + (right ?? 0) || 1;
	const split = 48 + (864 * (left ?? 0)) / total;
	let svg = title(y, icon, text);
	svg +=
		bold(48, y + 96, fmt(left), 84, INK) +
		bold(912, y + 96, fmt(right), 84, INK, "end");
	svg += poly(
		[
			[48, y + 114],
			[split + 8, y + 114],
			[split - 8, y + 142],
			[48, y + 142],
		],
		SIDE[0],
	);
	svg += poly(
		[
			[split + 14, y + 114],
			[912, y + 114],
			[912, y + 142],
			[split - 2, y + 142],
		],
		SIDE[1],
	);
	svg += mono(
		Math.min(860, Math.max(100, split + 3)),
		y + 166,
		`${pct((left ?? 0) / total)} · ${pct((right ?? 0) / total)}`,
		16,
		MUTED,
		"middle",
	);
	return { svg, y: y + 230 };
}
type Pair = {
	id: string;
	name: string;
	icon: string | null | undefined;
	left: number | null;
	right: number | null;
	/** A word that replaces the formatted value on that side, like a subscription state. */
	leftLabel?: string;
	rightLabel?: string;
	color: string;
};
type Row = {
	id: string;
	name: string;
	icon: string | null | undefined;
	value: number;
	label?: string;
};
/** Union of both sides' rows, the larger value first, a stable color per row. */
function union(
	a: RenderAnswer,
	b: RenderAnswer,
	rowsOf: (x: RenderAnswer) => Row[],
): Pair[] {
	const ra = rowsOf(a),
		rb = rowsOf(b);
	const ids = [...new Set([...ra, ...rb].map((r) => r.id))];
	return ids
		.map((id) => {
			const l = ra.find((r) => r.id === id),
				r = rb.find((r) => r.id === id),
				m = l ?? r;
			return {
				id,
				name: m?.name ?? id,
				icon: m?.icon,
				left: l?.value ?? null,
				right: r?.value ?? null,
				leftLabel: l?.label,
				rightLabel: r?.label,
			};
		})
		.sort(
			(m, n) =>
				Math.max(n.left ?? 0, n.right ?? 0) -
				Math.max(m.left ?? 0, m.right ?? 0),
		)
		.map((m, i) => ({ ...m, color: palette[(i + 2) % palette.length] }));
}
/** Butterfly rows: the icon on the axis, bars outward, values at the ends. */
function butterfly(
	y: number,
	icons: IconImages,
	icon: string,
	text: string,
	rows: Pair[],
	fmt: Fmt,
	max = 1,
) {
	const C = 480,
		GAP = 26,
		REACH = 330;
	let svg = title(y, icon, text);
	y += 44;
	if (!rows.length) {
		svg += mono(C, y + 24, "n/a", 20, MUTED, "middle");
		return { svg, y: y + 40 };
	}
	for (const m of rows) {
		const lw = (REACH * (m.left ?? 0)) / max,
			rw = (REACH * (m.right ?? 0)) / max;
		svg +=
			rect(C - GAP - lw, y, lw, 30, m.left ? m.color : TRACK) +
			rect(C + GAP, y, rw, 30, m.right ? m.color : TRACK);
		svg += iconOrBox(icons, m.icon, C - 20, y - 5, 40);
		svg += bold(
			C - GAP - lw - 14,
			y + 24,
			m.leftLabel ?? fmt(m.left),
			26,
			m.left || m.leftLabel ? INK : "#3b4450",
			"end",
		);
		svg += bold(
			C + GAP + rw + 14,
			y + 24,
			m.rightLabel ?? fmt(m.right),
			26,
			m.right || m.rightLabel ? INK : "#3b4450",
		);
		svg += mono(C, y + 56, cut(m.name, 24), 15, MUTED, "middle");
		y += 84;
	}
	return { svg, y };
}
/** Solo hero: one huge value, an optional unit, a delta chip or a secondary figure. */
function hero(
	y: number,
	icon: string,
	text: string,
	value: string,
	unit: string | null,
	delta: {
		now: number | null | undefined;
		before: number | null | undefined;
	} | null,
	aside?: [string, string],
) {
	let svg = title(y, icon, text);
	svg += bold(46, y + 118, value, 112, INK);
	if (unit) svg += mono(46 + value.length * 74 + 8, y + 118, unit, 30, MUTED);
	if (aside) {
		svg += label(912, y + 70, aside[0], MUTED, "end");
		svg += bold(912, y + 118, aside[1], 44, INK, "end");
	}
	if (delta) {
		const { now, before } = delta;
		if (now == null || !before) {
			svg += mono(912, y + 110, "n/a vs previous period", 16, MUTED, "end");
		} else {
			const d = now / before - 1;
			const up = d >= 0;
			const color = up ? LIME : "#e5484d";
			svg += rect(762, y + 66, 150, 44, up ? "#1f2a12" : "#2a1a1a");
			svg += rect(762, y + 66, 4, 44, color);
			svg += mono(
				896,
				y + 95,
				`${up ? "▲" : "▼"} ${Math.abs(d * 100).toFixed(0)}%`,
				24,
				color,
				"end",
				'font-weight="bold"',
			);
			svg += mono(912, y + 136, "vs previous period", 14, MUTED, "end");
		}
	}
	return { svg, y: y + 176 };
}
/** Solo rows: icon, name, one accent bar, the value at the end and an amount under it. */
function rows(
	y: number,
	icons: IconImages,
	icon: string,
	text: string,
	list: {
		name: string;
		icon: string | null | undefined;
		value: number | null;
		amount?: string;
		right: string;
	}[],
	max = 1,
) {
	let svg = title(y, icon, text);
	y += 46;
	if (!list.length) {
		svg += mono(48, y + 20, "n/a", 20, MUTED);
		return { svg, y: y + 40 };
	}
	for (const r of list) {
		svg += iconOrBox(icons, r.icon, 48, y - 6, 40);
		svg += bold(104, y + 22, cut(r.name, 28), 26, INK);
		svg += bold(912, y + 22, r.right, 26, INK, "end");
		svg += rect(104, y + 36, 600, 8, TRACK);
		if (r.value != null)
			svg += rect(104, y + 36, 600 * Math.min(1, r.value / max), 8, LIME);
		if (r.amount) svg += mono(912, y + 46, r.amount, 15, MUTED, "end");
		y += 76;
	}
	return { svg, y };
}

type Context = RenderAnswer["current"]["context"][number];
/** The waffle: 200 cells, one per 0.5% of the window. The outline reaches p90. */
function waffle(x: number, y: number, h: Context, step: number) {
	const paint = {
		harness: palette[3],
		instructions: palette[1],
		usualChat: h.breakdownAvailable === false ? LIME : palette[0],
		longChat: "none",
		free: "#28303a",
	};
	const cells = waffleCells(
		h.breakdownAvailable === false
			? { ...h, harnessTokens: 0, instructionsTokens: 0 }
			: h,
		h.window ?? 1,
	);
	let svg = "";
	cells.forEach((cell, i) => {
		svg += rect(
			x + (i % 20) * step,
			y + Math.floor(i / 20) * step,
			step - 4,
			step - 4,
			paint[cell],
			cell === "longChat" ? `stroke="${PLATE_SHADOW}"` : "",
		);
	});
	return svg;
}
/** One person's context reading: median, window share, harness, waffle, legend. */
function contextBlock(
	x: number,
	y: number,
	width: number,
	icons: IconImages,
	s: RenderAnswer,
	big: boolean,
) {
	const h = s.publishWorkflow
		? s.current.context.find((c) => c.harness === s.selectedContextHarness)
		: undefined;
	let svg = "";
	if (!h) return { svg: bold(x, y + 70, "n/a", 64), y: y + 100 };
	const meta = s.icons.find((i) => i.kind === "harness" && i.id === h.harness);
	svg += bold(
		x,
		y + (big ? 96 : 70),
		compactNumber(h.medianCall),
		big ? 100 : 64,
	);
	svg += mono(
		x,
		y + (big ? 128 : 98),
		`${h.window ? pct(h.medianCall / h.window) : "n/a"} of ${compactNumber(h.window)} window`,
		18,
	);
	y += big ? 150 : 118;
	svg +=
		iconOrBox(icons, meta?.iconUrl, x, y - 4, 28) +
		bold(x + 40, y + 18, cut(meta?.name ?? h.harness, big ? 40 : 18), 22);
	svg += mono(
		x + width,
		y + 18,
		`${compactNumber(h.calls)} calls · ${compactNumber(h.p90Call)} p90`,
		15,
		MUTED,
		"end",
	);
	y += 44;
	const step = big ? 22 : 18;
	if (h.window) svg += waffle(x, y, h, step);
	else svg += mono(x, y + 20, "Window occupancy: n/a", 18);
	const legend: [string, string, string][] =
		h.breakdownAvailable === false
			? [["Breakdown", "n/a", LIME]]
			: [
					["Harness", compactNumber(h.harnessTokens), palette[3]],
					["Instructions", compactNumber(h.instructionsTokens), palette[1]],
					["Usual chat", compactNumber(h.usualChat), palette[0]],
					["Long chat", compactNumber(h.longChat), "none"],
				];
	legend.push([
		"Free",
		h.window ? compactNumber(Math.max(0, h.window - h.medianCall)) : "n/a",
		"#28303a",
	]);
	if (h.retainedCallsOnly) legend.push(["Retained calls only", "", BG]);
	const swatch = (lx: number, ly: number, size: number, c: string) =>
		rect(
			lx,
			ly - size,
			size,
			size,
			c,
			c === "none" ? `stroke="${PLATE_SHADOW}"` : "",
		);
	const legendRow = (
		lx: number,
		ly: number,
		name: string,
		v: string,
		c: string,
		size: number,
	) =>
		swatch(lx, ly, size, c) +
		mono(lx + size + 10, ly, name, big ? 17 : 15) +
		bold(x + width, ly, v, big ? 20 : 18, INK, "end");
	if (big) {
		const wx = x + 20 * step + 16;
		let ly = y + 16;
		for (const [name, v, c] of legend) {
			svg += legendRow(wx, ly, name, v, c, 12);
			ly += 34;
		}
		y = Math.max(y + (h.window ? step * 10 : 40) + 20, ly);
	} else {
		y += (h.window ? step * 10 : 40) + 20;
		for (const [name, v, c] of legend) {
			svg += legendRow(x, y, name, v, c, 11);
			y += 28;
		}
	}
	return { svg, y };
}

const TITLES: Record<RenderRequest["command"], string> = {
	tokens: "Token usage",
	harness: "Tokens by harness",
	cost: "Subscriptions",
	context: "Context per call",
	compare: "Token usage",
};
const nameOf = (
	kind: "model" | "harness",
	id: string,
	...sides: RenderAnswer[]
) => sides.flatMap((s) => s.icons).find((i) => i.kind === kind && i.id === id);
const modelRows = (x: RenderAnswer, full: boolean) =>
	(x.current.usage?.models ?? [])
		.filter((m) => full || x.current.modelIds.includes(m.id))
		.map((m) => ({
			id: m.id,
			name: nameOf("model", m.id, x)?.name ?? m.catalogName ?? m.id,
			icon: nameOf("model", m.id, x)?.iconUrl,
			value: m.tokenShare,
			amount: m.totalTokens,
		}));
const harnessRows = (x: RenderAnswer) =>
	(x.current.usage?.harnesses ?? []).map((h) => ({
		id: h.harness,
		name: nameOf("harness", h.harness, x)?.name ?? h.harness,
		icon: nameOf("harness", h.harness, x)?.iconUrl,
		value: h.tokenShare,
		amount: h.totalTokens,
	}));
const subRows = (x: RenderAnswer, full: boolean) =>
	(full ? x.subscriptions.rows : x.subscriptions.preview).map((r) => ({
		id: r.id,
		name: r.name,
		icon: r.iconUrl,
		value: r.monthlyUSD,
		state: r.state,
		label: r.state === "paid" ? undefined : r.state,
	}));
/** A comparison subscription row earns its place at $5 a month; a sponsored plan counts as paid. */
const COMPARE_SUB_FLOOR = 5;
const earnsRow = (r: { value: number; state: string }) =>
	r.value >= COMPARE_SUB_FLOOR || r.state === "sponsored";
const costOf = (x: RenderAnswer) =>
	x.publishCost ? x.current.usage?.cost?.usd : null;

export function discordStatsSvg(
	request: RenderRequest,
	icons: IconImages = new Map(),
) {
	const { subject: a, comparison: b, command, full } = request;
	let svg = "";
	let y = 0;
	const add = (part: { svg: string; y: number }) => {
		svg += part.svg;
		y = part.y;
	};
	if (b) {
		add(headerVersus(a, b, icons));
		if (command === "tokens" || command === "compare") {
			add(
				meter(
					y,
					"coins",
					"TOKENS",
					a.current.usage?.totalTokens,
					b.current.usage?.totalTokens,
					compactNumber,
				),
			);
			if (command === "compare" && a.publishCost && b.publishCost)
				add(meter(y, "dollar", "COST", costOf(a), costOf(b), money));
			add(
				butterfly(
					y,
					icons,
					"box",
					full ? "ALL MODELS" : "MODELS",
					union(a, b, (x) => modelRows(x, full)),
					pct,
				),
			);
		} else if (command === "harness") {
			add(
				meter(
					y,
					"coins",
					"TOKENS",
					a.current.usage?.totalTokens,
					b.current.usage?.totalTokens,
					compactNumber,
				),
			);
			add(
				butterfly(
					y,
					icons,
					"terminal",
					"ALL HARNESSES",
					union(a, b, harnessRows),
					pct,
				),
			);
		} else if (command === "cost") {
			add(
				meter(
					y,
					"dollar",
					"MONTHLY SUBSCRIPTIONS",
					a.subscriptions.monthlyUSD,
					b.subscriptions.monthlyUSD,
					money,
				),
			);
			// The measured figure is what the range buttons move; subscriptions are monthly.
			if (a.publishCost && b.publishCost)
				add(meter(y, "coins", "MEASURED USAGE", costOf(a), costOf(b), money));
			// Neither side reaching the floor drops the row, sponsored counting as reached.
			const earned = new Set(
				[...subRows(a, full), ...subRows(b, full)]
					.filter(earnsRow)
					.map((r) => r.id),
			);
			const pairs = union(a, b, (x) => subRows(x, full)).filter((p) =>
				earned.has(p.id),
			);
			const max = Math.max(
				1,
				...pairs.flatMap((s) => [s.left ?? 0, s.right ?? 0]),
			);
			add(
				butterfly(
					y,
					icons,
					"dollar",
					full ? "ALL SUBSCRIPTIONS" : "PER MONTH",
					pairs,
					money,
					max,
				),
			);
		} else {
			svg += title(y, "gauge", "CONTEXT PER CALL · MEDIAN");
			y += 40;
			const left = contextBlock(48, y, 400, icons, a, false);
			const right = contextBlock(512, y, 400, icons, b, false);
			svg += left.svg + right.svg;
			y = Math.max(left.y, right.y) + 10;
		}
	} else {
		add(headerSolo(a, icons, TITLES[command]));
		const usage = a.current.usage,
			previous = a.previous.usage;
		const tokens = {
			now: usage?.totalTokens,
			before: previous?.totalTokens,
		};
		if (command === "tokens" || command === "compare") {
			add(
				hero(
					y,
					"coins",
					"TOKENS",
					compactNumber(usage?.totalTokens),
					null,
					tokens,
				),
			);
			add(
				rows(
					y,
					icons,
					"box",
					full ? "ALL MODELS" : "MODELS · 5%+ USAGE",
					modelRows(a, full).map((m) => ({
						name: m.name,
						icon: m.icon,
						value: m.value,
						right: pct(m.value),
						amount: compactNumber(m.amount),
					})),
				),
			);
		} else if (command === "harness") {
			add(
				hero(
					y,
					"coins",
					"TOKENS",
					compactNumber(usage?.totalTokens),
					null,
					tokens,
				),
			);
			add(
				rows(
					y,
					icons,
					"terminal",
					"HARNESSES",
					harnessRows(a).map((m) => ({
						name: m.name,
						icon: m.icon,
						value: m.value,
						right: pct(m.value),
						amount: compactNumber(m.amount),
					})),
				),
			);
		} else if (command === "cost") {
			const measured = costOf(a);
			add(
				hero(
					y,
					"dollar",
					"MONTHLY SUBSCRIPTIONS",
					money(a.subscriptions.monthlyUSD),
					"/mo",
					null,
					measured == null ? undefined : ["measured usage", money(measured)],
				),
			);
			const list = subRows(a, full);
			const max = Math.max(1, ...list.map((s) => s.value));
			add(
				rows(
					y,
					icons,
					"dollar",
					full ? "ALL SUBSCRIPTIONS" : "SUBSCRIPTIONS",
					list.map((m) => ({
						name: m.name,
						icon: m.icon,
						value: m.value,
						right: m.state === "paid" ? money(m.value) : m.state,
					})),
					max,
				),
			);
		} else {
			svg += title(y, "gauge", "CONTEXT PER CALL · MEDIAN");
			y += 30;
			add(contextBlock(48, y, 864, icons, a, true));
		}
	}
	const height = y + 96;
	if (height > 24000) throw new Error("Render height exceeds limit");
	return {
		svg: `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${height}">${rect(0, 0, W, height, BG)}${svg}${footer(height, request)}</svg>`,
		width: W,
		height,
	};
}
