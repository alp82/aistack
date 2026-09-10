import type { HarnessAdapter } from "../types.js";
import { cachedEvents, cacheFile, loadCache } from "./cache.js";
import { messageTimes } from "./evidence.js";
import { dataPath, readLocal, storeRoot } from "./local.js";
import { scan } from "./scan.js";
import { CURSOR_BUILTIN_TOOLS } from "./workflow.js";

export const CURSOR_HARNESS_NAME = "cursor";
export { CURSOR_BUILTIN_TOOLS } from "./workflow.js";
export const cursorAdapter: HarnessAdapter = {
	name: CURSOR_HARNESS_NAME,
	builtinTools: CURSOR_BUILTIN_TOOLS,
	async detect(options) {
		const roots = options.roots ?? [dataPath()];
		for (const root of roots) {
			const held = await loadCache(cacheFile(root, storeRoot()));
			if (
				!held.complete ||
				[
					...held.value.local,
					...cachedEvents(held.value, new Set(held.value.sessions)),
				].some((row) => row.tsMs >= options.sinceMs)
			)
				return true;
			const local = await readLocal(root);
			// A discovered unreadable source must reach scanComplete, never silently disappear.
			if (
				!local.complete ||
				local.sessions.some(({ session }) =>
					messageTimes(session).some((t) => t !== null && t >= options.sinceMs),
				)
			)
				return true;
			// Undated retained history can gain its first usable anchor from dashboard enrichment.
			if (
				local.sessions.some(
					({ session }) =>
						session.messages.length > 0 &&
						messageTimes(session).every((t) => t === null),
				)
			)
				return true;
		}
		return false;
	},
	scan,
};
