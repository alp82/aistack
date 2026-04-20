import * as p from "@clack/prompts";

const esc = (code: string) => `\x1b[${code}m`;
const reset = esc("0");

const LIME = "163;230;53";
const BLACK = "0;0;0";
const YELLOW = "250;204;21";
const RED = "248;113;113";
const MUTED = "120;120;120";

export const lime = (s: string) => `${esc(`38;2;${LIME}`)}${s}${reset}`;
export const limeBold = (s: string) =>
	`${esc("1")}${esc(`38;2;${LIME}`)}${s}${reset}`;
export const bgLime = (s: string) =>
	`${esc(`48;2;${LIME}`)}${esc(`38;2;${BLACK}`)}${s}${reset}`;
export const yellow = (s: string) => `${esc(`38;2;${YELLOW}`)}${s}${reset}`;
export const red = (s: string) => `${esc(`38;2;${RED}`)}${s}${reset}`;
export const dim = (s: string) => `${esc(`38;2;${MUTED}`)}${s}${reset}`;
export const bold = (s: string) => `${esc("1")}${s}${reset}`;

// ■ logo square in lime + AISTACK in bold on lime bg
export const banner = (cmd: string) =>
	`${lime("■")} ${bgLime(` AISTACK `)} ${bold(cmd.toUpperCase())}`;

// Compact line with clack-style bar
const BAR = `${esc(`38;2;${MUTED}`)}│${reset}`;

export function lines(items: string[]) {
	for (const item of items) {
		console.log(`${BAR}  ${item}`);
	}
}

export function section(label: string, count?: number) {
	console.log(`${BAR}`);
	const countStr = count !== undefined ? ` ${dim(String(count))}` : "";
	console.log(`${BAR}  ${bold(label.toUpperCase())}${countStr}`);
}

export function divider() {
	console.log(`${BAR}  ${dim("─".repeat(40))}`);
}

export function intro(cmd: string) {
	console.log();
	p.intro(banner(cmd));
}

export function outro(msg: string) {
	p.outro(msg);
	console.log();
}

export function outroError(msg: string) {
	p.outro(red(msg));
	console.log();
}

export function outroCancel(msg = "cancelled") {
	p.cancel(dim(msg));
	console.log();
}

export function outroSkipped(msg: string) {
	p.outro(dim(msg));
	console.log();
}
