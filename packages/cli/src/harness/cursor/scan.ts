import path from "node:path";
import {
	apiEquivalentCost,
	normalizeModel,
	type TokenCounts,
} from "@aistack/pricing";
import {
	createHarnessWorkflowReducer,
	createWorkflowLocalSources,
} from "../../workflow/reducer.js";
import {
	addModelUsage,
	countsTotal,
	createAggregate,
	emptyUsage,
	noteProjectDay,
	noteSessionStart,
	utcDateOf,
} from "../shared/aggregate.js";
import type { HarnessScan, HarnessScanOptions } from "../types.js";
import { type Account, existingAccount } from "./account.js";
import {
	cachedEvents,
	cacheFile,
	loadCache,
	refreshAccount,
	saveCache,
} from "./cache.js";
import { localContributions, messageTimes, reconcile } from "./evidence.js";
import { dataPath, type LocalRead, readLocal, storeRoot } from "./local.js";

export type ScanOptions = HarnessScanOptions & {
	root?: string;
	cachePath?: string;
	now?: number;
	readLocalImpl?: (
		root: string,
		onProgress?: (files: number) => void,
	) => Promise<LocalRead>;
	accountImpl?: (root: string) => Promise<Account | null>;
	fetchImpl?: typeof fetch;
};
export async function scan(options: ScanOptions): Promise<HarnessScan> {
	const root = options.root ?? dataPath();
	const now = options.now ?? Date.now();
	const file = options.cachePath ?? cacheFile(root, storeRoot());
	const local = await (options.readLocalImpl ?? readLocal)(
		root,
		options.onProgress,
	);
	const loaded = await loadCache(file);
	let complete = local.complete && loaded.complete;
	const ids = new Set(local.sessions.map((s) => s.session.id));
	// Disappearing local history cannot prove a full replacement, even when usage is cached.
	if (
		[
			...loaded.value.local,
			...Object.values(loaded.value.windows).flatMap((w) => w.events),
		].some((row) => row.tsMs >= options.sinceMs && !ids.has(row.session))
	)
		complete = false;
	const account = await (options.accountImpl ?? existingAccount)(root);
	const cache = await refreshAccount({
		cache: loaded.value,
		account,
		sinceMs: options.sinceMs,
		now,
		sessionIds: ids,
		fetchImpl: options.fetchImpl,
	});
	const api = cachedEvents(cache, ids);
	const native = new Set<string>();
	const contributions = local.sessions
		.flatMap((s) => localContributions(s, api))
		.filter((row) => {
			if (!row.nativeId) return true;
			if (native.has(row.nativeId)) return false;
			native.add(row.nativeId);
			return true;
		});
	const dated = new Set(contributions.map((row) => row.session));
	if (
		loaded.value.local.some(
			(row) => row.tsMs >= options.sinceMs && !dated.has(row.session),
		)
	)
		complete = false;
	const previousDates = new Map<string, Set<string>>();
	for (const row of [
		...loaded.value.local,
		...cachedEvents(loaded.value, ids),
	]) {
		const dates = previousDates.get(row.session) ?? new Set();
		dates.add(utcDateOf(row.tsMs));
		previousDates.set(row.session, dates);
	}
	if (complete) {
		cache.local = contributions;
		cache.sessions = [...ids].sort();
		try {
			await saveCache(file, cache);
		} catch {
			complete = false;
		}
	}
	const aggregate = createAggregate();
	const workflowLocal = createWorkflowLocalSources();
	const workflow = createHarnessWorkflowReducer("cursor", workflowLocal);
	const sessions = new Map(local.sessions.map((s) => [s.session.id, s]));
	const sessionDates = previousDates;
	for (const { session } of local.sessions) {
		for (const message of session.messages)
			if (message.model) {
				const model = normalizeModel(message.model);
				if (!aggregate.byModel.has(model))
					aggregate.byModel.set(model, emptyUsage());
			}
		const project = session.canonicalWorkspacePath;
		if (project && path.isAbsolute(project)) aggregate.projectDirs.add(project);
		if (session.metadata?.cursorVersion)
			aggregate.ccVersions.add(session.metadata.cursorVersion);
		const times = messageTimes(session, api).filter(
			(t): t is number => t !== null && t >= options.sinceMs && t <= now,
		);
		if (times.length) {
			aggregate.sessions.add(session.id);
			noteSessionStart(aggregate, session.id, Math.min(...times));
		}
	}
	for (const contribution of reconcile(contributions, api)) {
		const { tsMs, buckets, session, sidechain } = contribution;
		const dates = sessionDates.get(session) ?? new Set();
		dates.add(utcDateOf(tsMs));
		sessionDates.set(session, dates);
		if (tsMs < options.sinceMs || tsMs > now) continue;
		const model = normalizeModel(contribution.model);
		const counts: TokenCounts = {
			input: buckets.input ?? 0,
			output: buckets.output ?? 0,
			cacheRead: buckets.cacheRead ?? 0,
			cacheWrite5m: 0,
			cacheWrite1h: 0,
			cacheWriteUnsplit: buckets.cacheWrite ?? 0,
		};
		addModelUsage(
			aggregate,
			model,
			counts,
			apiEquivalentCost(model, counts, tsMs),
			1,
			{ tsMs, sidechain },
		);
		aggregate.records++;
		aggregate.assistantRecords++;
		aggregate.distinctResponses++;
		aggregate.sessions.add(session);
		aggregate.activeDays.add(utcDateOf(tsMs));
		aggregate.firstTs = Math.min(aggregate.firstTs ?? tsMs, tsMs);
		aggregate.lastTs = Math.max(aggregate.lastTs ?? tsMs, tsMs);
		if (sidechain) aggregate.sidechainTokens += countsTotal(counts);
		else aggregate.mainTokens += countsTotal(counts);
		noteSessionStart(aggregate, session, tsMs);
		const project = sessions.get(session)?.session.canonicalWorkspacePath;
		if (project && path.isAbsolute(project))
			noteProjectDay(aggregate, project, tsMs);
	}
	aggregate.files = local.stats.filesRead;
	return {
		aggregate,
		stats: local.stats,
		workflow: workflow.finish(),
		workflowLocal,
		scanComplete: complete,
		sessionDates,
	};
}
