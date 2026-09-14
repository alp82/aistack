// Verbose diagnostics for a sync that looks stuck.
//
// The interactive spinner repaints on a timer, so a phase that blocks the event
// loop (a synchronous SQLite walk, a large transcript parse) leaves the LAST
// message on screen and reads as a hang at the wrong step. A user who reports
// "it hangs at X" is then pointing at the phase that finished. This sink prints
// every phase as it starts, with the seconds since the command began, so the
// report names the phase that is actually running and how long it took.
//
// Enabled by `sync --verbose` or `AISTACK_DEBUG=1`. Every line goes to stderr,
// so the MCP server's stdout protocol and a piped summary stay clean. Nothing
// here prints a path, a prompt, or a database value: counts and durations only.

import { bold, dim, lime, red, yellow } from "./theme.js";

export type TraceLevel = "info" | "success" | "warn" | "error";
const levelLabels = {
	info: "INFO ",
	success: " OK  ",
	warn: "WARN ",
	error: "ERROR",
};
const levelColors = { info: bold, success: lime, warn: yellow, error: red };
let sink: ((line: string) => void) | null = null;
let startedAtMs = 0;
let clock = () => Date.now();
let colored = false;
let columns: number | undefined;

const stderrSink = (line: string) => process.stderr.write(`${line}\n`);

export function traceRequestedByEnv(env = process.env): boolean {
	const value = env.AISTACK_DEBUG?.trim().toLowerCase();
	return value === "1" || value === "true" || value === "yes";
}

export function enableTrace(
	write: (line: string) => void = stderrSink,
	startedAt: number = Date.now(),
	options: { color?: boolean; columns?: number; now?: () => number } = {},
): void {
	sink = write;
	columns =
		options.columns ??
		(process.stderr.isTTY ? process.stderr.columns : undefined);
	clock = options.now ?? (() => Date.now());
	startedAtMs = startedAt;
	colored =
		options.color ??
		(Boolean(process.stderr.isTTY) &&
			process.env.NO_COLOR === undefined &&
			process.env.TERM !== "dumb");
}

/** Shared epoch keeps worker and main-thread timestamps aligned. */
export function traceStartedAt(): number {
	return startedAtMs;
}

export function disableTrace(): void {
	sink = null;
}
export function traceEnabled(): boolean {
	return sink !== null;
}

/** Format every diagnostic through one stderr renderer, including continuation lines. */
export function trace(message: string, level: TraceLevel = "info"): void {
	if (!sink) return;
	const seconds = Math.max(0, (clock() - startedAtMs) / 1000);
	const time = `+${seconds.toFixed(2)}s`.padStart(10);
	const prefix = `[aistack ${time}]`;
	const label = levelLabels[level];
	const width = columns ? Math.max(16, columns - prefix.length - 7) : undefined;
	const lines = message.split(/\r?\n/).flatMap((line) => {
		if (!width) return [line];
		const result: string[] = [];
		let rest = line;
		while (rest.length > width) {
			const space = rest.lastIndexOf(" ", width);
			const cut = space > 0 ? space : width;
			result.push(rest.slice(0, cut));
			rest = rest.slice(cut).trimStart();
		}
		return [...result, rest];
	});
	for (const [index, line] of lines.entries()) {
		const head =
			index === 0 ? `${prefix} ${label} ` : " ".repeat(prefix.length + 7);
		const styledHead =
			index === 0 && colored
				? `${dim(prefix)} ${levelColors[level](label)} `
				: head;
		sink(
			`${styledHead}${colored && (level === "error" || level === "warn") ? levelColors[level](line) : line}`,
		);
	}
}

export function traceTimer(
	label: string,
): (note?: string, level?: TraceLevel) => void {
	if (!sink) return () => {};
	const started = clock();
	return (note, level = "success") =>
		trace(
			`${label} · ${Math.round(clock() - started)} ms${note ? ` · ${note}` : ""}`,
			level,
		);
}

const knownNames = new Set([
	"Error",
	"TypeError",
	"RangeError",
	"SyntaxError",
	"ReferenceError",
	"URIError",
	"EvalError",
	"AggregateError",
	"AbortError",
	"TimeoutError",
]);
const object = (value: unknown): Record<string, unknown> | null =>
	value !== null && typeof value === "object"
		? (value as Record<string, unknown>)
		: null;

/** Stable error identity without message, stack, SQL, paths or response bodies. */
export function traceErrorCode(error: unknown): string {
	const value = object(error);
	const code = value?.code;
	if (typeof code === "string" && /^[A-Z][A-Z0-9_]{0,63}$/.test(code))
		return code;
	return typeof value?.name === "string" && knownNames.has(value.name)
		? value.name
		: "unknown";
}

/** The operation is a static caller label. Exception text is never safe to print wholesale. */
export function traceError(
	operation: string,
	error: unknown,
	level: TraceLevel = "error",
): void {
	if (!sink) return;
	const seen = new Set<unknown>();
	function describe(value: unknown, depth = 0): string {
		if (depth >= 4 || seen.has(value)) return "[cause omitted]";
		seen.add(value);
		const row = object(value);
		const code = traceErrorCode(value);
		const name = row?.name;
		const fields =
			typeof name === "string" && knownNames.has(name) && name !== code
				? [name, code]
				: [code];
		const details = object(row?.details);
		if (code === "SOURCE_LIMIT_EXCEEDED" && details) {
			if (
				typeof details.bound === "string" &&
				/^(sqlite|jsonl|zip)-[a-z-]{1,32}$/.test(details.bound)
			)
				fields.push(details.bound);
			for (const key of ["limit", "observedAtLeast"]) {
				const n = details[key];
				if (typeof n === "number" && Number.isSafeInteger(n) && n >= 0)
					fields.push(`${key}=${n}`);
			}
		}
		for (const key of ["status", "statusCode", "errno", "errcode", "code"]) {
			const n = row?.[key];
			if (typeof n === "number" && Number.isSafeInteger(n))
				fields.push(`${key}=${n}`);
		}
		if (row?.cause !== undefined)
			fields.push(`cause: ${describe(row.cause, depth + 1)}`);
		if (value instanceof AggregateError)
			for (const child of value.errors.slice(0, 4))
				fields.push(`cause: ${describe(child, depth + 1)}`);
		return fields.join(" · ");
	}
	trace(`${operation} failed · ${describe(error)}`, level);
}

/** The facts a bug report needs first, printed once when tracing starts. */
export function traceEnvironment(facts: {
	cliVersion: string;
	baseUrl: string;
	trigger?: string;
}): void {
	trace(
		`aistack ${facts.cliVersion} · node ${process.versions.node} · ${process.platform}-${process.arch} · ${facts.baseUrl}${facts.trigger ? ` · trigger ${facts.trigger}` : ""}`,
	);
}
