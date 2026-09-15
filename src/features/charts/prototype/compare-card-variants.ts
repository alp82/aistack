// PROTOTYPE. Throwaway. Three variants of the /compare Discord card, rendered to
// PNG from fixture values so the owner can pick a direction. Run:
//   pnpm prototype:compare-card [outDir]
// Question: what should the compare card look like once the labels, price
// sources and disclosure lines are gone? Every variant opens with a
// fighting-game VS header (avatars, names) and then differs in the body:
//   A  Scorecards: two columns, huge values, one stacked model bar per side.
//   B  Butterfly: one center axis, bars grow outward, values at the edges.
//   C  Duel meters + slope: HP-style shared bars, then a slope chart of models.
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import sharp from "sharp";
import type {
	RenderAnswer,
	RenderRequest,
} from "../../discord/server/renderContract";
import { waffleCells } from "../../usage/context";
import { CHART_SLOTS } from "../palette";

const palette = CHART_SLOTS.map((s) => s.dark);
const LIME = "#c5f442";
const VIOLET = "#b48cff";
const SIDE = [palette[0], palette[1]];
const BG = "#13171c";
const INK = "#edf2f8";
const MUTED = "#8592a4";
const TRACK = "#242b34";
const W = 960;

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
	`<text x="${x}" y="${y}" font-family="DejaVu Sans Mono, monospace" font-size="${size}" fill="${fill}" text-anchor="${anchor}" ${extra}>${esc(s)}</text>`;
const bold = (
	x: number,
	y: number,
	s: unknown,
	size = 64,
	fill = INK,
	anchor: Anchor = "start",
	extra = "",
) =>
	`<text x="${x}" y="${y}" font-family="DejaVu Sans, sans-serif" font-weight="bold" font-size="${size}" fill="${fill}" text-anchor="${anchor}" letter-spacing="${-size * 0.04}" ${extra}>${esc(s)}</text>`;
const rect = (
	x: number,
	y: number,
	w: number,
	h: number,
	fill: string,
	extra = "",
) =>
	`<rect x="${x}" y="${y}" width="${Math.max(0, w)}" height="${h}" fill="${fill}" ${extra}/>`;
const poly = (points: number[][], fill: string, extra = "") =>
	`<polygon points="${points.map((p) => p.join(",")).join(" ")}" fill="${fill}" ${extra}/>`;
const image = (href: string, x: number, y: number, size: number) =>
	`<image x="${x}" y="${y}" width="${size}" height="${size}" href="${href}" preserveAspectRatio="xMidYMid slice"/>`;

const compact = (n: number | null | undefined) =>
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
const ratio = (a: number | null | undefined, b: number | null | undefined) =>
	a == null || b == null || !a || !b
		? "n/a"
		: a >= b
			? `${(a / b).toFixed(1)}× more`
			: `${(b / a).toFixed(1)}× less`;

// ---------------------------------------------------------------- fixtures
const dataUri = (file: string) =>
	`data:image/png;base64,${readFileSync(new URL(`../../../../public/email/${file}`, import.meta.url)).toString("base64")}`;
async function svgUri(svg: string) {
	const png = await sharp(Buffer.from(svg)).png().toBuffer();
	return `data:image/png;base64,${png.toString("base64")}`;
}
async function avatar(letter: string, from: string, to: string) {
	return svgUri(
		`<svg xmlns="http://www.w3.org/2000/svg" width="240" height="240"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${from}"/><stop offset="1" stop-color="${to}"/></linearGradient></defs><rect width="240" height="240" fill="url(#g)"/><circle cx="120" cy="96" r="52" fill="#13171c" opacity="0.85"/><rect x="40" y="160" width="160" height="90" fill="#13171c" opacity="0.85"/><text x="120" y="118" font-family="DejaVu Sans" font-weight="bold" font-size="64" fill="${from}" text-anchor="middle">${letter}</text></svg>`,
	);
}
const ICONS: Record<string, string> = {
	"local:openai": dataUri("chatgpt-logo.png"),
	"local:anthropic": dataUri("claude-logo.png"),
	"local:cursor": dataUri("cursor-logo.png"),
	"local:codex": dataUri("codex-logo.png"),
	"local:opencode": dataUri("opencode-logo.png"),
	"local:perplexity": dataUri("perplexity-logo.png"),
	"local:lovable": dataUri("lovable-logo.png"),
	"local:xai": "",
	"avatar:a": "",
	"avatar:b": "",
};
type Model = [id: string, name: string, icon: string | null, share: number];
type Harness = [id: string, name: string, icon: string | null, share: number, sessions: number];
type Sub = [name: string, icon: string | null, usd: number, state: "paid" | "included" | "free"];
type Ctx = { harness: string; window: number; calls: number; medianCall: number; p90Call: number; harnessTokens: number; instructionsTokens: number; usualChat: number; longChat: number };
function answer(
	handle: string,
	avatarUrl: string,
	totalTokens: number,
	usd: number,
	models: Model[],
	harnesses: Harness[],
	subs: Sub[],
	context: Ctx[],
	previousTokens: number,
): RenderAnswer {
	const usage = (total: number) => ({
		dates: ["2026-09-15"],
		activeDays: 7,
		sessions: harnesses.reduce((n, h) => n + h[4], 0),
		projects: 3,
		totalTokens: total,
		cacheHitShare: 0.7,
		subagentShare: 0.1,
		models: models.map(([id, catalogName, , tokenShare]) => ({
			id,
			catalogSlug: id,
			catalogName,
			tokens: { input: 0, output: 0, cacheWrite: 0, cacheRead: 0 },
			totalTokens: total * tokenShare,
			tokenShare,
			usd: null,
			estimated: true,
			pricingTables: [],
		})),
		harnesses: harnesses.map(([harness, , , tokenShare, sessions]) => ({
			harness,
			sessions,
			totalTokens: total * tokenShare,
			tokenShare,
		})),
		cost: { usd, estimated: true, pricedShare: 0.95, pricingTables: [] },
		excludedTokens: { unpriced: 0, synthetic: 0 },
	});
	const rows = subs.map(([name, iconUrl, monthlyUSD, state], i) => ({
		id: String(i),
		name,
		iconUrl,
		monthlyUSD,
		state,
	}));
	return {
		identity: {
			creatorId: handle,
			stackId: handle,
			handle,
			name: handle,
			avatarUrl,
			profileUrl: `https://aistack.to/@${handle}`,
			stackName: handle,
			stackUrl: `https://aistack.to/s/${handle}`,
		},
		range: {
			endDate: "2026-09-15",
			days: 7,
			current: { from: "2026-09-09", to: "2026-09-15" },
			previous: { from: "2026-09-02", to: "2026-09-08" },
		},
		current: {
			usage: usage(totalTokens),
			context: context.map((c) => ({ ...c, compactions: 2 })),
			modelIds: models.filter((m) => m[3] >= 0.05).map((m) => m[0]),
			hasMoreModels: false,
		},
		previous: { usage: usage(previousTokens), context: [], modelIds: [], hasMoreModels: false },
		subscriptions: {
			monthlyUSD: rows.reduce((n, r) => n + r.monthlyUSD, 0),
			rows,
			preview: rows.slice(0, 5),
			hasMore: rows.length > 5,
		},
		icons: [
			...models.map(([id, name, iconUrl]) => ({ kind: "model" as const, id, name, iconUrl })),
			...harnesses.map(([id, name, iconUrl]) => ({ kind: "harness" as const, id, name, iconUrl })),
		],
		selectedContextHarness: context[0]?.harness ?? null,
		selectedTokenHarness: harnesses[0]?.[0] ?? null,
		publishCost: true,
		publishWorkflow: true,
	};
}
const subjectA = () =>
	answer(
		"alperortac",
		"avatar:a",
		1_300_000_000,
		1617.43,
		[
			["gpt-6-astra", "GPT-6 Astra", "local:openai", 0.831],
			["claude-fable-5-1", "Claude Fable 5.1", "local:anthropic", 0.136],
			["gpt-5.4-mini", "GPT-5.4 mini", "local:openai", 0.033],
		],
		[
			["codex", "Codex", "local:codex", 0.71, 148],
			["claude-code", "Claude Code", "local:anthropic", 0.24, 52],
			["opencode", "opencode", "local:opencode", 0.05, 14],
		],
		[
			["Claude", "local:anthropic", 100, "paid"],
			["ChatGPT", "local:openai", 20, "paid"],
			["Cursor", "local:cursor", 20, "paid"],
			["Perplexity", "local:perplexity", 15, "paid"],
			["Lovable", "local:lovable", 0, "free"],
		],
		[
			{ harness: "codex", window: 200_000, calls: 3140, medianCall: 64_000, p90Call: 138_000, harnessTokens: 12_000, instructionsTokens: 9_000, usualChat: 43_000, longChat: 95_000 },
		],
		1_160_000_000,
	);
const subjectB = () =>
	answer(
		"gvaste",
		"avatar:b",
		2_700_000_000,
		2322.9,
		[
			["grok-4.6-build", "Grok 4.6 Build", "local:xai", 0.539],
			["gpt-6-astra", "GPT-6 Astra", "local:openai", 0.374],
			["gpt-reserve", "gpt-reserve", null, 0.078],
		],
		[
			["cursor", "Cursor", "local:cursor", 0.62, 260],
			["codex", "Codex", "local:codex", 0.38, 128],
		],
		[
			["Cursor", "local:cursor", 200, "paid"],
			["ChatGPT", "local:openai", 200, "paid"],
			["Perplexity", "local:perplexity", 0, "included"],
		],
		[
			{ harness: "codex", window: 200_000, calls: 1820, medianCall: 91_000, p90Call: 171_000, harnessTokens: 12_000, instructionsTokens: 21_000, usualChat: 58_000, longChat: 80_000 },
		],
		3_010_000_000,
	);
const fixture = (command: RenderRequest["command"], comparison: boolean): RenderRequest => ({
	version: 1,
	command,
	full: false,
	subject: subjectA(),
	comparison: comparison ? subjectB() : null,
});

// ------------------------------------------------------------ shared parts
type Icons = ReadonlyMap<string, string>;
const iconOrBox = (icons: Icons, url: string | null | undefined, x: number, y: number, size: number) =>
	icons.get(url ?? "")
		? image(icons.get(url ?? "") as string, x, y, size)
		: rect(x, y, size, size, "#2a323c") + mono(x + size / 2, y + size * 0.7, "?", size * 0.6, MUTED, "middle");
const avatarOf = (icons: Icons, x: RenderAnswer) => icons.get(x.identity.avatarUrl ?? "") ?? "";
const grid = (y0: number, h: number) => {
	let g = "";
	for (let x = 48; x < W; x += 64) g += rect(x, y0, 1, h, "#1e242c");
	for (let y = y0 + 8; y < y0 + h; y += 64) g += rect(0, y, W, 1, "#1e242c");
	return g;
};
const black = (x: number, y: number, s: string, size: number, fill = INK, anchor: Anchor = "start") =>
	`<text x="${x}" y="${y}" font-family="DejaVu Sans, sans-serif" font-weight="bold" font-size="${size}" fill="${fill}" text-anchor="${anchor}" letter-spacing="${-size * 0.06}">${esc(s.toUpperCase())}</text>`;
const label = (x: number, y: number, s: string, fill = MUTED, anchor: Anchor = "start") =>
	`<text x="${x}" y="${y}" font-family="DejaVu Sans Mono, monospace" font-weight="bold" font-size="13" fill="${fill}" text-anchor="${anchor}" letter-spacing="2">${esc(s.toUpperCase())}</text>`;
const LUCIDE: Record<string, string> = {
	coins: '<circle cx="8" cy="8" r="6"/><path d="M18.09 10.37A6 6 0 1 1 10.34 18"/><path d="M7 6h1v4"/><path d="m16.71 13.88.7.71-2.82 2.82"/>',
	dollar: '<line x1="12" x2="12" y1="2" y2="22"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>',
	box: '<path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/><path d="m3.3 7 8.7 5 8.7-5"/><path d="M12 22V12"/>',
	terminal: '<polyline points="4 17 10 11 4 5"/><line x1="12" x2="20" y1="19" y2="19"/>',
	gauge: '<path d="m12 14 4-4"/><path d="M3.34 19a10 10 0 1 1 17.32 0"/>',
	grid: '<rect width="7" height="7" x="3" y="3"/><rect width="7" height="7" x="14" y="3"/><rect width="7" height="7" x="14" y="14"/><rect width="7" height="7" x="3" y="14"/>',
};
const lucide = (name: string, x: number, y: number, size: number, color = INK) =>
	`<g transform="translate(${x} ${y}) scale(${size / 24})" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${LUCIDE[name]}</g>`;
const it = 'font-style="italic"';
const vsText = (cx: number, cy: number, size: number, fill: string, extra = "") =>
	bold(cx, cy, "VS", size, fill, "middle", `${it} ${extra}`);
/** The locked VS: white face, lime outline, one solid dark drop shadow, tilted. */
const vsHard = (cx: number, cy: number) =>
	`<g transform="rotate(-6 ${cx} ${cy})">${vsText(cx + 8, cy + 8, 72, BG, `stroke="${BG}" stroke-width="8" paint-order="stroke"`)}${vsText(cx, cy, 72, INK, `stroke="${LIME}" stroke-width="4" paint-order="stroke"`)}</g>`;

/** One name plate. Solid color, dark type, gray offset. */
function plate(icons: Icons, x: number, y: number, side: RenderAnswer, color: string, right: boolean) {
	let svg = rect(x + 8, y + 8, 440, 100, "#8793a2") + rect(x, y, 440, 100, color);
	const ax = right ? x + 440 - 16 - 68 : x + 16;
	svg += rect(ax - 1, y + 15, 70, 70, BG) + image(avatarOf(icons, side), ax, y + 16, 68);
	const tx = right ? x + 440 - 16 - 68 - 16 : x + 16 + 68 + 16;
	const anchor: Anchor = right ? "end" : "start";
	svg += black(tx, y + 58, cut(side.identity.handle, 12), 44, BG, anchor);
	svg += label(tx, y + 84, `@${side.identity.handle}`, BG, anchor);
	return svg;
}
/** Comparison header, the locked "hard" layout. */
function headerVs(a: RenderAnswer, b: RenderAnswer, icons: Icons) {
	const H = 240;
	let svg = rect(0, 0, W, 5, LIME) + grid(5, H - 5);
	svg += plate(icons, 24, 30, a, LIME, false);
	svg += plate(icons, 496, 106, b, VIOLET, true);
	svg += vsHard(480, 150);
	return { svg, y: H + 52 };
}
/** Single-subject header: one plate, the command title as a black uppercase headline beside it. */
function headerSolo(a: RenderAnswer, icons: Icons, title: string) {
	const H = 176;
	let svg = rect(0, 0, W, 5, LIME) + grid(5, H - 5);
	svg += plate(icons, 24, 36, a, LIME, false);
	svg += black(912, 96, title, 30, INK, "end");
	svg += label(912, 122, niceRange(a.range).split(" · ")[0], MUTED, "end");
	return { svg, y: H + 52 };
}
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
/** "Sep 9 to 15, 2026 · 7 days". Same month folds, different months or years spell both. */
function niceRange(r: RenderAnswer["range"]) {
	const [fy, fm, fd] = r.current.from.split("-").map(Number);
	const [ty, tm, td] = r.current.to.split("-").map(Number);
	const from = `${MONTHS[fm - 1]} ${fd}`;
	const to = fy !== ty ? `${MONTHS[tm - 1]} ${td}, ${ty}` : fm !== tm ? `${MONTHS[tm - 1]} ${td}` : `${td}`;
	const year = fy !== ty ? `${fy}` : "";
	return `${from}${year ? `, ${year}` : ""} to ${to}${fy === ty ? `, ${ty}` : ""} · ${r.days} day${r.days === 1 ? "" : "s"}`;
}
/** The site's brand mark: a lime square with a glow, then AI STACK in bold tight type. */
const brand = (x: number, y: number) =>
	rect(x - 4, y - 16, 20, 20, LIME, 'opacity="0.12"') +
	rect(x - 2, y - 14, 16, 16, LIME, 'opacity="0.25"') +
	rect(x, y - 12, 12, 12, LIME) +
	`<text x="${x + 22}" y="${y}" font-family="DejaVu Sans, sans-serif" font-weight="bold" font-size="18" fill="${INK}" letter-spacing="-1">AI STACK</text>`;
function footer(height: number, r: RenderRequest) {
	return (
		rect(48, height - 56, 864, 1, "#303843") +
		brand(48, height - 20) +
		mono(912, height - 21, niceRange(r.subject.range), 15, MUTED, "end")
	);
}
const frame = (body: string, height: number, r: RenderRequest) =>
	`<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${height}">${rect(0, 0, W, height, BG)}${body}${footer(height, r)}</svg>`;

const modelsOf = (x: RenderAnswer) => x.current.usage?.models ?? [];
const metaOf = (kind: "model" | "harness", id: string, ...sides: RenderAnswer[]) =>
	sides.flatMap((s) => s.icons).find((i) => i.kind === kind && i.id === id);
type Pair = { id: string; name: string; icon: string | null | undefined; left: number | null; right: number | null; color: string };
/** Union of two sides' rows, ordered by the larger value, a stable color per row. */
function union(
	a: RenderAnswer,
	b: RenderAnswer,
	rowsOf: (x: RenderAnswer) => { id: string; name: string; icon: string | null | undefined; value: number }[],
): Pair[] {
	const ra = rowsOf(a), rb = rowsOf(b);
	const ids = [...new Set([...ra.map((r) => r.id), ...rb.map((r) => r.id)])];
	return ids
		.map((id) => {
			const m = ra.find((r) => r.id === id) ?? rb.find((r) => r.id === id);
			return {
				id,
				name: m?.name ?? id,
				icon: m?.icon,
				left: ra.find((r) => r.id === id)?.value ?? null,
				right: rb.find((r) => r.id === id)?.value ?? null,
			};
		})
		.sort((m, n) => Math.max(n.left ?? 0, n.right ?? 0) - Math.max(m.left ?? 0, m.right ?? 0))
		.map((m, i) => ({ ...m, color: palette[(i + 2) % palette.length] }));
}
const modelRows = (x: RenderAnswer) =>
	modelsOf(x)
		.filter((m) => x.current.modelIds.includes(m.id))
		.map((m) => ({ id: m.id, name: metaOf("model", m.id, x)?.name ?? m.catalogName ?? m.id, icon: metaOf("model", m.id, x)?.iconUrl, value: m.tokenShare, amount: m.totalTokens }));
const harnessRows = (x: RenderAnswer) =>
	(x.current.usage?.harnesses ?? []).map((h) => ({ id: h.harness, name: metaOf("harness", h.harness, x)?.name ?? h.harness, icon: metaOf("harness", h.harness, x)?.iconUrl, value: h.tokenShare, amount: h.totalTokens }));
const subRows = (x: RenderAnswer) =>
	x.subscriptions.preview.map((r) => ({ id: r.name, name: r.name, icon: r.iconUrl, value: r.monthlyUSD, amount: r.monthlyUSD, state: r.state }));

// ------------------------------------------------------------ body parts
/** A section title: lucide icon, mono label, thin rule. */
const title = (y: number, icon: string, text: string) =>
	rect(48, y, 864, 1, "#303843") + rect(44, y - 12, 28, 24, BG) + lucide(icon, 48, y - 10, 20) + mono(80, y + 6, text, 16, INK);
/** Duel meter: two big values, one shared bar split where the totals meet. Returns the SVG and the next y. */
function meter(y: number, icon: string, text: string, left: number | null | undefined, right: number | null | undefined, fmt: (n: number | null | undefined) => string) {
	const total = (left ?? 0) + (right ?? 0) || 1;
	const split = 48 + (864 * (left ?? 0)) / total;
	let svg = title(y, icon, text);
	svg += bold(48, y + 96, fmt(left), 84, INK) + bold(912, y + 96, fmt(right), 84, INK, "end");
	svg += poly([[48, y + 114], [split + 8, y + 114], [split - 8, y + 142], [48, y + 142]], SIDE[0]);
	svg += poly([[split + 14, y + 114], [912, y + 114], [912, y + 142], [split - 2, y + 142]], SIDE[1]);
	svg += mono(split + 3, y + 166, `${pct((left ?? 0) / total)} · ${pct((right ?? 0) / total)}`, 16, MUTED, "middle");
	return { svg, y: y + 230 };
}
/** Butterfly rows: icon on the axis, bars outward, values at the ends. */
function butterfly(y: number, icons: Icons, icon: string, text: string, rows: Pair[], fmt: (n: number | null | undefined) => string, max = 1) {
	const C = 480, GAP = 26, REACH = 330;
	let svg = title(y, icon, text);
	y += 44;
	for (const m of rows) {
		const lw = (REACH * (m.left ?? 0)) / max, rw = (REACH * (m.right ?? 0)) / max;
		svg += rect(C - GAP - lw, y, lw, 30, m.left ? m.color : TRACK) + rect(C + GAP, y, rw, 30, m.right ? m.color : TRACK);
		svg += iconOrBox(icons, m.icon, C - 20, y - 5, 40);
		svg += bold(C - GAP - lw - 14, y + 24, fmt(m.left), 26, m.left ? INK : "#3b4450", "end");
		svg += bold(C + GAP + rw + 14, y + 24, fmt(m.right), 26, m.right ? INK : "#3b4450");
		svg += mono(C, y + 56, cut(m.name, 24), 15, MUTED, "middle");
		y += 84;
	}
	return { svg, y };
}
/** Solo hero value: one huge number, an optional unit, and a delta chip against the previous period. */
function hero(y: number, icon: string, text: string, value: string, unit: string | null, now: number | null | undefined, before: number | null | undefined, aside?: [string, string]) {
	let svg = title(y, icon, text);
	svg += bold(46, y + 118, value, 112, INK);
	const vw = value.length * 74;
	if (unit) svg += mono(46 + vw + 8, y + 118, unit, 30, MUTED);
	if (aside) {
		svg += label(912, y + 70, aside[0], MUTED, "end");
		svg += bold(912, y + 118, aside[1], 44, INK, "end");
	}
	if (now != null && before) {
		const d = now / before - 1;
		const up = d >= 0;
		const t = `${up ? "▲" : "▼"} ${Math.abs(d * 100).toFixed(0)}%`;
		svg += rect(912 - 150, y + 66, 150, 44, up ? "#1f2a12" : "#2a1a1a");
		svg += rect(912 - 150, y + 66, 4, 44, up ? LIME : "#e5484d");
		svg += mono(912 - 16, y + 95, t, 24, up ? LIME : "#e5484d", "end", 'font-weight="bold"');
		svg += mono(912, y + 136, "vs previous period", 14, MUTED, "end");
	}
	return { svg, y: y + 176 };
}
/** Solo rows: icon, name, one accent bar, value at the end and a small amount under it. */
function rows(y: number, icons: Icons, icon: string, text: string, list: { name: string; icon: string | null | undefined; value: number | null; amount?: string; right: string }[], max = 1) {
	let svg = title(y, icon, text);
	y += 46;
	for (const r of list) {
		svg += iconOrBox(icons, r.icon, 48, y - 6, 40);
		svg += bold(104, y + 22, cut(r.name, 28), 26, INK);
		svg += bold(912, y + 22, r.right, 26, INK, "end");
		svg += rect(104, y + 36, 600, 8, TRACK);
		if (r.value != null) svg += rect(104, y + 36, 600 * Math.min(1, r.value / max), 8, LIME);
		if (r.amount) svg += mono(912, y + 46, r.amount, 15, MUTED, "end");
		y += 76;
	}
	return { svg, y };
}
/** The waffle: 200 cells, one per 0.5% of the window. Outline reaches p90. */
function waffle(x: number, y: number, h: NonNullable<RenderAnswer["current"]["context"][number]>, step: number) {
	const paint = { harness: palette[3], instructions: palette[1], usualChat: palette[0], longChat: "none", free: "#28303a" };
	const cells = waffleCells(h, h.window ?? 1);
	let svg = "";
	cells.forEach((cell, i) => {
		svg += rect(x + (i % 20) * step, y + Math.floor(i / 20) * step, step - 4, step - 4, paint[cell], cell === "longChat" ? 'stroke="#8793a2"' : "");
	});
	return svg;
}
function contextBlock(x: number, y: number, width: number, icons: Icons, s: RenderAnswer, big: boolean) {
	const h = s.current.context.find((c) => c.harness === s.selectedContextHarness);
	let svg = "";
	if (!h) return { svg: bold(x, y + 70, "n/a", 64), y: y + 100 };
	const meta = metaOf("harness", h.harness, s);
	svg += bold(x, y + (big ? 96 : 70), compact(h.medianCall), big ? 100 : 64, INK);
	svg += mono(x, y + (big ? 128 : 98), `${h.window ? pct(h.medianCall / h.window) : "n/a"} of ${compact(h.window)} window`, 18, MUTED);
	y += big ? 150 : 118;
	svg += iconOrBox(icons, meta?.iconUrl, x, y - 4, 28) + bold(x + 40, y + 18, meta?.name ?? h.harness, 22, INK);
	svg += mono(x + width, y + 18, `${compact(h.calls)} calls · ${compact(h.p90Call)} p90`, 15, MUTED, "end");
	y += 44;
	const step = big ? 22 : 18;
	svg += waffle(x, y, h, step);
	const wx = x + 20 * step + 16;
	const legend: [string, string, string][] = [
		["Harness", compact(h.harnessTokens), palette[3]],
		["Instructions", compact(h.instructionsTokens), palette[1]],
		["Usual chat", compact(h.usualChat), palette[0]],
		["Long chat", compact(h.longChat), "none"],
		["Free", h.window ? compact(Math.max(0, h.window - h.medianCall)) : "n/a", "#28303a"],
	];
	if (big) {
		let ly = y + 16;
		for (const [name, v, c] of legend) {
			svg += rect(wx, ly - 12, 12, 12, c, c === "none" ? 'stroke="#8793a2"' : "");
			svg += mono(wx + 22, ly, name, 17, MUTED) + bold(x + width, ly, v, 20, INK, "end");
			ly += 34;
		}
		y += step * 10 + 20;
	} else {
		y += step * 10 + 20;
		for (const [name, v, c] of legend) {
			svg += rect(x, y - 11, 11, 11, c, c === "none" ? 'stroke="#8793a2"' : "");
			svg += mono(x + 20, y, name, 15, MUTED) + bold(x + width, y, v, 18, INK, "end");
			y += 28;
		}
	}
	return { svg, y };
}

// ------------------------------------------------------------------ cards
function card(r: RenderRequest, icons: Icons) {
	const a = r.subject, b = r.comparison;
	const titles: Record<RenderRequest["command"], string> = {
		tokens: "Token usage",
		harness: "Tokens by harness",
		cost: "Subscriptions",
		context: "Context per call",
		compare: "Token usage",
	};
	let svg = "", y = 0;
	if (b) {
		({ svg, y } = headerVs(a, b, icons));
		const tokens = [a.current.usage?.totalTokens, b.current.usage?.totalTokens] as const;
		if (r.command === "tokens" || r.command === "compare") {
			const m = meter(y, "coins", "TOKENS", tokens[0], tokens[1], compact); svg += m.svg; y = m.y;
			if (r.command === "compare") {
				const c = meter(y, "dollar", "COST", a.current.usage?.cost?.usd, b.current.usage?.cost?.usd, money); svg += c.svg; y = c.y;
			}
			const rowsM = union(a, b, modelRows);
			const bf = butterfly(y, icons, "box", "MODELS", rowsM, pct); svg += bf.svg; y = bf.y;
		} else if (r.command === "harness") {
			const id = a.selectedTokenHarness ?? "";
			const name = metaOf("harness", id, a, b)?.name ?? id;
			const m = meter(y, "terminal", `${name.toUpperCase()} · SHARE OF TOKENS`, a.current.usage?.harnesses.find((h) => h.harness === id)?.tokenShare, b.current.usage?.harnesses.find((h) => h.harness === id)?.tokenShare, pct);
			svg += m.svg; y = m.y;
			const bf = butterfly(y, icons, "terminal", "ALL HARNESSES", union(a, b, harnessRows), pct); svg += bf.svg; y = bf.y;
		} else if (r.command === "cost") {
			const m = meter(y, "dollar", "MONTHLY SUBSCRIPTIONS", a.subscriptions.monthlyUSD, b.subscriptions.monthlyUSD, money); svg += m.svg; y = m.y;
			const rowsS = union(a, b, subRows);
			const max = Math.max(1, ...rowsS.flatMap((s) => [s.left ?? 0, s.right ?? 0]));
			const bf = butterfly(y, icons, "dollar", "PER MONTH", rowsS, money, max); svg += bf.svg; y = bf.y;
		} else {
			svg += title(y, "gauge", "CONTEXT PER CALL · MEDIAN");
			y += 40;
			const l = contextBlock(48, y, 400, icons, a, false);
			const rr = contextBlock(512, y, 400, icons, b, false);
			svg += l.svg + rr.svg;
			y = Math.max(l.y, rr.y) + 10;

		}
		return frame(svg, y + 40, r);
	}
	({ svg, y } = headerSolo(a, icons, titles[r.command]));
	const u = a.current.usage, p = a.previous.usage;
	if (r.command === "tokens" || r.command === "compare") {
		const h = hero(y, "coins", "TOKENS", compact(u?.totalTokens), null, u?.totalTokens, p?.totalTokens); svg += h.svg; y = h.y;
		const rs = rows(y, icons, "box", "MODELS · 5%+ USAGE", modelRows(a).map((m) => ({ name: m.name, icon: m.icon, value: m.value, right: pct(m.value), amount: compact(m.amount) }))); svg += rs.svg; y = rs.y;
	} else if (r.command === "harness") {
		const h = hero(y, "coins", "TOKENS", compact(u?.totalTokens), null, u?.totalTokens, p?.totalTokens); svg += h.svg; y = h.y;
		const rs = rows(y, icons, "terminal", "HARNESSES", harnessRows(a).map((m) => ({ name: m.name, icon: m.icon, value: m.value, right: pct(m.value), amount: compact(m.amount) }))); svg += rs.svg; y = rs.y;
	} else if (r.command === "cost") {
		const h = hero(y, "dollar", "MONTHLY SUBSCRIPTIONS", money(a.subscriptions.monthlyUSD), "/mo", null, null, ["measured usage", money(u?.cost?.usd)]); svg += h.svg; y = h.y;
		const max = Math.max(1, ...subRows(a).map((s) => s.value));
		const rs = rows(y, icons, "dollar", "SUBSCRIPTIONS", subRows(a).map((m) => ({ name: m.name, icon: m.icon, value: m.value, right: m.state === "paid" ? money(m.value) : m.state })), max); svg += rs.svg; y = rs.y;
	} else {
		svg += title(y, "gauge", "CONTEXT PER CALL · MEDIAN");
		y += 30;
		const c = contextBlock(48, y, 864, icons, a, true); svg += c.svg; y = c.y;

	}
	return frame(svg, y + 40, r);
}

// ------------------------------------------------------------------ main
async function main() {
	const outDir = process.argv[2] ?? join(process.cwd(), ".prototype-out");
	mkdirSync(outDir, { recursive: true });
	ICONS["avatar:a"] = await avatar("A", LIME, "#4e8300");
	ICONS["avatar:b"] = await avatar("G", VIOLET, "#5b2fc9");
	ICONS["local:xai"] = await svgUri(
		'<svg xmlns="http://www.w3.org/2000/svg" width="96" height="96"><rect width="96" height="96" fill="#000"/><path d="M18 18 L50 62 M78 18 L38 70 M52 44 L78 78" stroke="#fff" stroke-width="9"/></svg>',
	);
	const icons = new Map(Object.entries(ICONS));
	const commands: RenderRequest["command"][] = ["tokens", "harness", "cost", "context", "compare"];
	for (const command of commands) {
		for (const comparison of command === "compare" ? [true] : [false, true]) {
			const svg = card(fixture(command, comparison), icons);
			const file = join(outDir, `${command}${comparison ? "-vs" : ""}.png`);
			writeFileSync(file, await sharp(Buffer.from(svg)).png().toBuffer());
			console.log(file);
		}
	}
}
main();
