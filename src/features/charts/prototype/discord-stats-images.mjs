// Throwaway PNG renderer for the live Discord prototype. Fixture values only.
import { readFileSync } from "node:fs";
import sharp from "sharp";
import {
	DEFAULT_MODEL_MIN_SHARE,
	dates,
	HARNESS_NAMES,
	ITEM_ICONS,
	MODELS,
	PEOPLE,
	SELF,
	TOOLS,
} from "../../discord/prototype/live/fixtures.mjs";

// The existing validated dark-theme chart palette.
const palette = [
	"#69a621",
	"#9e71fd",
	"#c21977",
	"#4278d2",
	"#00a99b",
	"#e66700",
];
const escapeXml = (value) =>
	String(value).replace(
		/[&<>"']/g,
		(char) =>
			({
				"&": "&amp;",
				"<": "&lt;",
				">": "&gt;",
				'"': "&quot;",
				"'": "&apos;",
			})[char],
	);
const text = (x, y, value, size = 20, fill = "#edf0f2", extra = "") =>
	`<text x="${x}" y="${y}" font-family="DejaVu Sans, sans-serif" font-size="${size}" fill="${fill}" ${extra}>${escapeXml(value)}</text>`;
const rect = (x, y, width, height, fill, extra = "") =>
	`<rect x="${x}" y="${y}" width="${width}" height="${height}" fill="${fill}" ${extra}/>`;

const iconData = new Map(
	Object.values(ITEM_ICONS).map((key) => [
		key,
		`data:image/png;base64,${readFileSync(new URL(`../../../../public/email/${key}-logo.png`, import.meta.url)).toString("base64")}`,
	]),
);
function itemIcon(name, x, y, size = 36) {
	const data = iconData.get(ITEM_ICONS[name]);
	return data
		? `<image x="${x}" y="${y}" width="${size}" height="${size}" href="${data}"/>`
		: "";
}

const mono = (x, y, value, size = 22, fill = "#aeb8c6", extra = "") =>
	text(x, y, value, size, fill, extra).replace(
		"DejaVu Sans, sans-serif",
		"DejaVu Sans Mono, monospace",
	);

function starterCard(state) {
	const factor = state.days / 7;
	const isCost = state.command === "cost";
	const isHarness = state.command === "harness";
	const models = state.full
		? MODELS
		: MODELS.filter(([, share]) => share >= DEFAULT_MODEL_MIN_SHARE);
	const tools = state.full ? TOOLS : TOOLS.slice(0, 3);
	const rows = isCost
		? tools
		: isHarness
			? [
					[HARNESS_NAMES[0], 70],
					[HARNESS_NAMES[1], 30],
				]
			: models;
	const height = 404 + rows.length * 96 + (isCost ? 120 : 0);
	const total = `${(SELF.tokens * factor).toFixed(1)}M`;
	const requester = Array.from(state.requester).slice(0, 26).join("");
	let svg =
		rect(0, 0, 960, height, "#13171c") +
		rect(0, 0, 960, 5, "#c5f442") +
		mono(48, 55, "AI STACK", 24, "#c5f442") +
		mono(912, 55, requester, 22, "#aeb8c6", 'text-anchor="end"') +
		rect(48, 82, 864, 1, "#303843") +
		mono(
			48,
			132,
			isCost
				? "MONTHLY SUBSCRIPTIONS"
				: isHarness
					? "TOKENS BY HARNESS"
					: "TOKEN USAGE",
			23,
		) +
		text(
			42,
			236,
			isCost ? "$155" : total,
			112,
			"#f3f6fa",
			'font-weight="bold" letter-spacing="-5"',
		);
	if (isCost)
		svg +=
			mono(372, 234, "/ month", 28) +
			mono(48, 278, "Current plans · 4 tools", 23);
	else {
		svg += mono(48, 278, dates(state.days), 23);
		if (!isHarness)
			svg +=
				rect(682, 172, 230, 62, "#20292a") +
				mono(707, 211, "↑ 12%", 30, "#d4e2d5") +
				mono(
					912,
					258,
					"vs previous period",
					18,
					"#aeb8c6",
					'text-anchor="end"',
				);
	}
	const label = isCost
		? state.full
			? "ALL TOOLS"
			: "TOP 3 TOOLS"
		: isHarness
			? "HARNESS MIX"
			: state.full
				? "ALL MODELS"
				: "MODELS · 5%+ USAGE";
	svg +=
		mono(48, 335, label, 20, "#8b99ac") +
		mono(
			912,
			335,
			isCost ? "USD / MONTH" : "TOKEN SHARE",
			20,
			"#8b99ac",
			'text-anchor="end"',
		);
	rows.forEach(([name, value], index) => {
		const y = 352 + index * 96;
		const color = isCost ? "#c5f442" : palette[index % palette.length];
		const share = isCost ? value / SELF.monthly : value / 100;
		svg +=
			itemIcon(name, 48, y + 5, 40) +
			text(108, y + 34, name, 30, "#edf2f8") +
			mono(
				912,
				y + 34,
				isCost ? `$${value}` : `${value}%`,
				30,
				"#edf2f8",
				'text-anchor="end"',
			) +
			rect(108, y + 54, 530, 7, "#28303a") +
			rect(108, y + 54, 530 * share, 7, color);
		if (!isCost)
			svg += mono(
				912,
				y + 66,
				`${(SELF.tokens * factor * share).toFixed(2)}M`,
				20,
				"#98a5b6",
				'text-anchor="end"',
			);
	});
	if (isCost) {
		const y = 352 + rows.length * 96;
		svg +=
			rect(48, y + 12, 864, 100, "#1e252d") +
			mono(68, y + 46, "MEASURED USAGE", 20) +
			mono(
				888,
				y + 52,
				`$${(SELF.usage * factor).toFixed(2)}  ↑ 12%`,
				28,
				"#edf2f8",
				'text-anchor="end"',
			) +
			mono(68, y + 84, dates(state.days), 19) +
			mono(
				888,
				y + 84,
				"vs previous period",
				18,
				"#aeb8c6",
				'text-anchor="end"',
			);
	}
	svg +=
		rect(48, height - 54, 864, 1, "#303843") +
		mono(48, height - 22, "PROTOTYPE / SYNTHETIC DATA", 17, "#8592a4");
	return `<svg xmlns="http://www.w3.org/2000/svg" width="960" height="${height}">${svg}</svg>`;
}

function cardHeader(state, title) {
	const requester = Array.from(state.requester).slice(0, 26).join("");
	return (
		rect(0, 0, 960, 5, "#c5f442") +
		mono(48, 55, "AI STACK", 24, "#c5f442") +
		mono(912, 55, requester, 22, "#aeb8c6", 'text-anchor="end"') +
		rect(48, 82, 864, 1, "#303843") +
		mono(48, 132, title, 23) +
		mono(48, 170, dates(state.days), 21)
	);
}

function cardFrame(body, height) {
	return `<svg xmlns="http://www.w3.org/2000/svg" width="960" height="${height}">${rect(0, 0, 960, height, "#13171c")}${body}${rect(48, height - 54, 864, 1, "#303843")}${mono(48, height - 22, "PROTOTYPE / SYNTHETIC DATA", 17, "#8592a4")}</svg>`;
}

function waffle(x, y, median, step = 22) {
	const p90 = median + 56000;
	return Array.from({ length: 200 }, (_, i) => {
		const fill =
			i < 12
				? palette[3]
				: i < 20
					? palette[1]
					: i < median / 1000
						? palette[0]
						: i < p90 / 1000
							? "none"
							: "#28303a";
		return rect(
			x + (i % 20) * step,
			y + Math.floor(i / 20) * step,
			step - 4,
			step - 4,
			fill,
			fill === "none" ? 'stroke="#8793a2"' : "",
		);
	}).join("");
}

function contextLegend(x, y, width, median, rowHeight = 43) {
	const values = [
		["Harness", 12, palette[3]],
		["Instructions", 8, palette[1]],
		["Usual chat", median / 1000 - 20, palette[0]],
		["Long chat", median / 1000 + 36, "none"],
		["Free", 200 - median / 1000, "#28303a"],
	];
	return values
		.map(
			([name, value, fill], i) =>
				rect(
					x,
					y + i * rowHeight - 12,
					12,
					12,
					fill,
					fill === "none" ? 'stroke="#8793a2"' : "",
				) +
				text(x + 24, y + i * rowHeight, name, 21, "#aeb8c6") +
				mono(
					x + width,
					y + i * rowHeight,
					`${value}K`,
					22,
					"#edf2f8",
					'text-anchor="end"',
				),
		)
		.join("");
}

function contextCard(state, other) {
	let svg = cardHeader(
		state,
		other ? "CONTEXT COMPARISON" : "CONTEXT PER CALL",
	);
	if (!other) {
		svg +=
			text(
				42,
				288,
				"64K",
				112,
				"#f3f6fa",
				'font-weight="bold" letter-spacing="-5"',
			) +
			mono(48, 328, "MEDIAN CALL", 21) +
			mono(912, 274, "32%", 64, "#edf2f8", 'text-anchor="end"') +
			mono(912, 312, "of a 200K window", 21, "#aeb8c6", 'text-anchor="end"') +
			itemIcon(HARNESS_NAMES[0], 48, 368, 40) +
			text(108, 397, HARNESS_NAMES[0], 30) +
			mono(
				912,
				397,
				`${Math.round((1000 * state.days) / 7).toLocaleString("en-US")} calls`,
				22,
				"#aeb8c6",
				'text-anchor="end"',
			) +
			waffle(48, 438, SELF.median) +
			contextLegend(542, 460, 370, SELF.median) +
			rect(48, 695, 864, 82, "#1e252d") +
			mono(68, 728, "120K p90 call", 24, "#edf2f8") +
			mono(892, 728, "Desktop", 21, "#aeb8c6", 'text-anchor="end"') +
			mono(68, 757, "Each cell: 0.5% of window · outline reaches p90", 19);
		return cardFrame(svg, 844);
	}
	const sides = [
		{ name: state.requester, median: SELF.median },
		{ name: other.handle, median: other.median },
	];
	sides.forEach((side, index) => {
		const x = index ? 510 : 48;
		svg +=
			rect(x, 207, 402, 640, "#192028") +
			rect(x, 207, 402, 4, palette[index]) +
			mono(
				x + 22,
				251,
				Array.from(side.name).slice(0, 20).join(""),
				24,
				palette[index],
			) +
			text(
				x + 16,
				338,
				`${side.median / 1000}K`,
				80,
				"#f3f6fa",
				'font-weight="bold" letter-spacing="-3"',
			) +
			mono(
				x + 22,
				374,
				`${Math.round(side.median / 2000)}% of 200K window`,
				19,
			) +
			itemIcon(HARNESS_NAMES[0], x + 22, 399, 30) +
			text(x + 65, 423, HARNESS_NAMES[0], 24) +
			waffle(x + 22, 452, side.median, 18) +
			contextLegend(x + 22, 675, 355, side.median, 32) +
			mono(x + 22, 828, "Desktop · median call", 17);
	});
	const change = Math.round(Math.abs(SELF.median / other.median - 1) * 100);
	svg +=
		mono(
			48,
			887,
			`${change}% ${SELF.median >= other.median ? "larger" : "smaller"} median call`,
			24,
			"#edf2f8",
		) + mono(48, 923, "Each cell: 0.5% of window · outline reaches p90", 19);
	return cardFrame(svg, 991);
}

function comparisonMetric(y, title, mine, theirs, format, unit = "") {
	const max = Math.max(mine, theirs, 1);
	const percentage = theirs
		? `${Math.round(Math.abs(mine / theirs - 1) * 100)}% ${mine >= theirs ? "more" : "less"}`
		: "n/a";
	const difference =
		unit === "pp"
			? `${Math.abs(mine - theirs)} pp`
			: format(Math.abs(mine - theirs));
	return (
		mono(48, y + 22, title, 21) +
		text(
			44,
			y + 102,
			format(mine),
			68,
			"#f3f6fa",
			'font-weight="bold" letter-spacing="-2"',
		) +
		text(
			916,
			y + 102,
			format(theirs),
			68,
			"#f3f6fa",
			'font-weight="bold" text-anchor="end" letter-spacing="-2"',
		) +
		rect(48, y + 123, 864, 12, "#28303a") +
		rect(48, y + 123, (864 * mine) / max, 12, palette[0]) +
		rect(48, y + 145, 864, 12, "#28303a") +
		rect(48, y + 145, (864 * theirs) / max, 12, palette[1]) +
		mono(48, y + 193, `${percentage} · ${difference} difference`, 22, "#aeb8c6")
	);
}

function comparisonMix(y, state, other) {
	const names = [...MODELS.slice(0, 3).map(([name]) => name), "Other"];
	const colors = [palette[0], palette[1], palette[2], palette[5]];
	let svg =
		mono(48, y + 22, "MODEL MIX", 21) +
		mono(912, y + 22, "TOKEN SHARE", 18, "#aeb8c6", 'text-anchor="end"');
	[SELF.mix, other.mix].forEach((shares, index) => {
		svg += mono(
			48,
			y + 63 + index * 60,
			index ? other.handle : Array.from(state.requester).slice(0, 26).join(""),
			19,
			"#aeb8c6",
		);
		let x = 48;
		shares.forEach((share, i) => {
			const width = (864 * share) / 100;
			svg += rect(x, y + 76 + index * 60, width - 2, 22, colors[i]);
			x += width;
		});
	});
	svg +=
		mono(720, y + 199, "YOU", 16, "#aeb8c6", 'text-anchor="end"') +
		mono(912, y + 199, "THEM", 16, "#aeb8c6", 'text-anchor="end"');
	names.forEach((name, i) => {
		const at = y + 220 + i * 56;
		svg +=
			rect(48, at + 40, 864, 1, "#303843") +
			rect(48, at + 4, 8, 20, colors[i]) +
			itemIcon(name, 72, at - 2, 32) +
			text(120, at + 24, name, 24) +
			mono(
				720,
				at + 24,
				`${SELF.mix[i]}%`,
				26,
				"#edf2f8",
				'text-anchor="end"',
			) +
			mono(
				912,
				at + 24,
				`${other.mix[i]}%`,
				26,
				"#edf2f8",
				'text-anchor="end"',
			);
	});
	return svg;
}

function comparisonCard(state, other) {
	const factor = state.days / 7;
	let svg =
		cardHeader(state, "STACK COMPARISON") +
		rect(48, 209, 402, 68, "#192028") +
		rect(48, 209, 4, 68, palette[0]) +
		mono(
			70,
			252,
			Array.from(state.requester).slice(0, 22).join(""),
			27,
			palette[0],
		) +
		rect(510, 209, 402, 68, "#192028") +
		rect(908, 209, 4, 68, palette[1]) +
		mono(890, 252, other.handle, 27, palette[1], 'text-anchor="end"') +
		mono(480, 252, "VS", 18, "#aeb8c6", 'text-anchor="middle"');
	if (["tokens", "compare"].includes(state.command)) {
		svg += comparisonMetric(
			306,
			"TOKENS",
			SELF.tokens * factor,
			other.tokens * factor,
			(n) => `${n.toFixed(1)}M`,
		);
		let mixY = 540;
		if (state.command === "compare") {
			svg +=
				rect(48, 524, 864, 1, "#303843") +
				comparisonMetric(
					550,
					"MEASURED USAGE COST",
					SELF.usage * factor,
					other.usage * factor,
					(n) => `$${n.toFixed(2)}`,
				);
			mixY = 793;
		}
		svg +=
			rect(48, mixY - 13, 864, 1, "#303843") +
			comparisonMix(mixY, state, other);
		return cardFrame(svg, mixY + 510);
	}
	if (state.command === "cost") {
		svg +=
			comparisonMetric(
				306,
				"CURRENT MONTHLY SUBSCRIPTIONS",
				SELF.monthly,
				other.monthly,
				(n) => `$${n}`,
			) + mono(48, 548, "Per month · current plans", 21);
		return cardFrame(svg, 628);
	}
	svg +=
		itemIcon(HARNESS_NAMES[0], 48, 310, 30) +
		text(96, 334, HARNESS_NAMES[0], 25) +
		comparisonMetric(
			357,
			"SHARE OF TOKENS",
			SELF.harness,
			other.harness,
			(n) => `${n}%`,
			"pp",
		);
	return cardFrame(svg, 638);
}

export async function renderStatsImage(state) {
	const other = PEOPLE.find((person) => person.handle === state.person);
	const svg =
		state.command === "context"
			? contextCard(state, other)
			: other
				? comparisonCard(state, other)
				: starterCard(state);
	return sharp(Buffer.from(svg)).png().toBuffer();
}
