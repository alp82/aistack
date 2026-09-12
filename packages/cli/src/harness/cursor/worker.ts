// The Cursor history read, off the main thread (#420). See
// `readLocalOffThread` in local.ts for why: cursor-history walks the whole
// global database synchronously, and on the main thread that freezes the
// terminal for as long as the walk takes.

import { parentPort, workerData } from "node:worker_threads";
import { enableTrace } from "../../trace.js";
import { type CursorWorkerMessage, readLocalOnce } from "./local.js";

const port = parentPort;
if (!port) throw new Error("cursor worker started without a parent port");
const post = (message: CursorWorkerMessage) => port.postMessage(message);
const input = workerData as { root: string; before: string; trace: boolean };
if (input.trace) enableTrace();

readLocalOnce(input.root, input.before, (files, total) =>
	post({ kind: "progress", files, ...(total !== undefined ? { total } : {}) }),
).then(
	(read) => post({ kind: "result", read }),
	() => post({ kind: "error" }),
);
