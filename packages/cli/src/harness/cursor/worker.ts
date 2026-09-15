// The Cursor history read, off the main thread (#420). See
// `readLocalOffThread` in local.ts for why: cursor-history walks the whole
// global database synchronously, and on the main thread that freezes the
// terminal for as long as the walk takes.

import { parentPort, workerData } from "node:worker_threads";
import { enableTrace, traceError } from "../../trace.js";
import { type CursorWorkerMessage, readLocalOnce } from "./local.js";

const port = parentPort;
if (!port) throw new Error("cursor worker started without a parent port");
const post = (message: CursorWorkerMessage) => port.postMessage(message);
const input = workerData as {
	root: string;
	before: string;
	// The read window travels with the job: the worker is a fresh module
	// instance, so the setter on the main thread never reaches it.
	sinceMs: number | undefined;
	trace: boolean;
	traceStartedAt: number;
	traceColor: boolean;
	traceColumns: number | undefined;
};
// Trace lines travel over the port, not the worker's stderr: the worker's
// stderr is forwarded through the main thread asynchronously and lands after
// later main-thread lines. The main thread writes each posted line as it
// arrives, on the shared clock.
if (input.trace)
	enableTrace((line) => post({ kind: "trace", line }), input.traceStartedAt, {
		color: input.traceColor,
		columns: input.traceColumns,
	});

readLocalOnce(
	input.root,
	input.before,
	(files, total) =>
		post({
			kind: "progress",
			files,
			...(total !== undefined ? { total } : {}),
		}),
	undefined,
	undefined,
	input.sinceMs,
).then(
	(read) => post({ kind: "result", read }),
	(error) => {
		traceError("cursor worker history", error);
		post({ kind: "error" });
	},
);
