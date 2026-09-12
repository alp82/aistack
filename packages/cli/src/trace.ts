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

let sink: ((line: string) => void) | null = null;
let startedAtMs = 0;

const stderrSink = (line: string) => {
	process.stderr.write(`${line}\n`);
};

/** True when the environment asks for diagnostics without a flag. */
export function traceRequestedByEnv(env = process.env): boolean {
	const value = env.AISTACK_DEBUG?.trim().toLowerCase();
	return value === "1" || value === "true" || value === "yes";
}

export function enableTrace(
	write: (line: string) => void = stderrSink,
	now: () => number = () => performance.now(),
): void {
	sink = write;
	startedAtMs = now();
}

export function disableTrace(): void {
	sink = null;
}

export function traceEnabled(): boolean {
	return sink !== null;
}

function elapsedLabel(): string {
	const seconds = (performance.now() - startedAtMs) / 1000;
	return `+${seconds.toFixed(seconds < 10 ? 2 : 1)}s`;
}

/** One diagnostic line. A no-op unless tracing is on, so callers never guard. */
export function trace(message: string): void {
	if (!sink) return;
	sink(`[aistack ${elapsedLabel().padStart(7)}] ${message}`);
}

/**
 * Time one step. Returns a function that prints `label · N ms` plus an optional
 * result note, so a caller writes `const done = traceTimer("x"); ...; done("ok")`.
 */
export function traceTimer(label: string): (note?: string) => void {
	if (!sink) return () => {};
	const started = performance.now();
	return (note) => {
		const ms = Math.round(performance.now() - started);
		trace(`${label} · ${ms} ms${note ? ` · ${note}` : ""}`);
	};
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
