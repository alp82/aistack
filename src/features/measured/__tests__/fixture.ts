/**
 * A real snapshot, shaped the way `measured.getCurrentByStackSlug` returns it.
 *
 * `snapshot.fixture.json` is not invented data: the shipped analyzer
 * (`packages/cli/src/transcripts`) produced it from the owner's own Claude Code
 * history on 2026-07-26 — 382 sessions, 4.27B tokens, 6 models, $5,840 at API
 * prices, fail-closed filtering applied, and real withheld counts. #40 drove
 * both prototype rounds off it, so every rule the display honours was checked
 * against these numbers rather than against a convenient invention.
 *
 * The stored file is the CLIENT payload. The query adds the server clock and
 * resolves model ids against the catalog, which is what `buildSnapshot` does
 * here. `claude-fable-5` is deliberately absent from the catalog: it is the
 * largest row in this window, so it exercises `catalogSlug: null` on the one
 * row where getting it wrong would be most visible.
 */
import type { MeasuredSnapshot } from "../copy";
import raw from "./snapshot.fixture.json";

const CATALOG: Record<string, string> = {
	"claude-opus-5": "Claude Opus 5",
	"claude-opus-4-8": "Claude Opus 4.8",
	"claude-sonnet-5": "Claude Sonnet 5",
	"claude-sonnet-4-6": "Claude Sonnet 4.6",
	"claude-haiku-4-5": "Claude Haiku 4.5",
};

export const HOUR = 60 * 60 * 1000;
export const DAY = 24 * HOUR;

export function buildSnapshot(
	overrides: Partial<MeasuredSnapshot> = {},
): MeasuredSnapshot {
	const payload = raw as unknown as Omit<
		MeasuredSnapshot,
		"receivedAt" | "isFresh" | "models"
	> & { models: Array<Omit<MeasuredSnapshot["models"][number], never>> };
	const receivedAt = Date.now() - 2 * HOUR;

	return {
		...payload,
		receivedAt,
		isFresh: true,
		models: payload.models.map((m) => ({
			...m,
			catalogSlug: CATALOG[m.id] ? m.id : null,
			catalogName: CATALOG[m.id] ?? null,
		})),
		...overrides,
	};
}

/** The same snapshot with every model's cost stripped (`publishCost: false`). */
export function withoutCost(
	overrides: Partial<MeasuredSnapshot> = {},
): MeasuredSnapshot {
	const base = buildSnapshot(overrides);
	return {
		...base,
		pricingTable: null,
		models: base.models.map(({ apiEquivalentUSD: _drop, ...m }) => m),
	};
}
