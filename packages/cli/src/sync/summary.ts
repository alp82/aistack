// The approve gate's two beats, as text.
//
// Wayfinder ticket #41 (map #29), shape fixed by the spike #35 and the copy
// locked in #48. Beat one is the FULL summary, printed as ordinary scrollable
// transcript output. Beat two is the SHORT elicitation message — it must stay
// short, or `Accept` falls below the fold and the gate times out (#35, 1H).
//
// Everything here derives from the exact bytes that will be sent (`body`),
// plus the local-only kept-private list that deliberately never enters them.
// Nothing in this file is accepted as a caller-supplied argument beside the
// payload — the spike promoted that from a caution to a demonstrated property.

import type {
	KeptPrivateAtom,
	NameCategory,
	SyncConfig,
	SyncConfigSource,
} from "../harness/shared/allowlist.js";
import { NAME_CATEGORIES } from "../harness/shared/allowlist.js";
import type { MeasuredPayload, SyncBody } from "../harness/shared/payload.js";

export type GateContext = {
	/** The exact request body a publish would send. */
	body: SyncBody;
	/** The local-only review list — never inside any payload (#44). */
	keptPrivate: Record<NameCategory, KeptPrivateAtom[]>;
	config: SyncConfig;
	source: SyncConfigSource;
	/** Web origin for the URLs the gate prints, e.g. https://aistack.to */
	baseUrl: string;
};

// ---------------------------------------------------------------------------
// Formatting
// ---------------------------------------------------------------------------

/** `4.27B`, `40.7M`, `216k`, `950` — three significant digits, like #40. */
export function fmtTokens(n: number): string {
	const sig = (v: number): string => {
		const s = v.toPrecision(3);
		return s.includes(".") ? s.replace(/\.?0+$/, "") : s;
	};
	if (n >= 1e9) return `${sig(n / 1e9)}B`;
	if (n >= 1e6) return `${sig(n / 1e6)}M`;
	if (n >= 1e3) return `${sig(n / 1e3)}k`;
	return String(n);
}

/** `≈$5,840` — whole dollars; the ≈ and "at API prices" wording are #37's. */
export function fmtUSD(n: number): string {
	return `≈$${Math.round(n).toLocaleString("en-US")}`;
}

const fmtPct = (share: number): string => `${(share * 100).toFixed(1)}%`;

/**
 * The dollar figure the gate names, or `null` when none may render.
 *
 * Mirrors the public display's rule (#46): a dollar figure never renders
 * without its pricing table. Summing only the models that carry the field
 * matches what actually goes up — an unpriceable model publishes tokens, not
 * dollars.
 */
export function totalUSD(payload: MeasuredPayload): number | null {
	if (payload.pricingTable === null) return null;
	let sum = 0;
	let any = false;
	for (const m of payload.models) {
		if (m.apiEquivalentUSD !== undefined) {
			sum += m.apiEquivalentUSD;
			any = true;
		}
	}
	return any ? sum : null;
}

/** DISTINCT kept-private names, from the send bytes (`inventory.withheld`). */
export function withheldCount(payload: MeasuredPayload): number {
	const w = payload.inventory.withheld;
	return (
		w.builtinTools + w.mcpServers + w.skills + w.subagents + w.slashCommands
	);
}

// ---------------------------------------------------------------------------
// Beat two — the elicitation message. Copy locked in #48; keep it SHORT.
// ---------------------------------------------------------------------------

export function buildGateDialog(ctx: GateContext): string {
	const { payloads, keptPrivate } = ctx.body;
	const tokens = payloads.reduce((a, p) => a + p.activity.totalTokens, 0);
	const usds = payloads
		.map((p) => totalUSD(p))
		.filter((u): u is number => u !== null);
	const usd = usds.length > 0 ? usds.reduce((a, b) => a + b, 0) : null;
	const days = payloads[0]?.window.days ?? 0;
	const facts = [
		`${fmtTokens(tokens)} tokens`,
		`${days} days`,
		...(usd === null ? [] : [fmtUSD(usd)]),
	].join(" · ");

	const n = payloads.reduce((a, p) => a + withheldCount(p), 0);
	const lines = [`Publish to aistack? ${facts}`];
	if (n > 0) {
		lines.push(
			keptPrivate === undefined
				? `${n} name${n === 1 ? "" : "s"} stay${n === 1 ? "s" : ""} on this machine`
				: `${n} name${n === 1 ? "" : "s"} go${n === 1 ? "es" : ""} up for you to review`,
		);
	}
	return lines.join("\n");
}

// ---------------------------------------------------------------------------
// Beat one — the full summary, transcript output.
// ---------------------------------------------------------------------------

const CATEGORY_LABEL: Record<NameCategory, string> = {
	builtinTools: "tools",
	mcpServers: "mcp",
	skills: "skills",
	subagents: "agents",
	slashCommands: "commands",
};

/** Kept-private rows for the gate: one row per group, then singles (#48). */
export function keptPrivateRows(
	keptPrivate: Record<NameCategory, KeptPrivateAtom[]>,
): Array<{ label: string; names: number }> {
	const groups = new Map<string, number>();
	const singles: string[] = [];
	for (const category of NAME_CATEGORIES) {
		for (const atom of keptPrivate[category]) {
			if (atom.group === null) singles.push(atom.name);
			else groups.set(atom.group, (groups.get(atom.group) ?? 0) + 1);
		}
	}
	const rows = [...groups].map(([label, names]) => ({ label, names }));
	for (const name of singles) rows.push({ label: name, names: 1 });
	rows.sort((a, b) => b.names - a.names || a.label.localeCompare(b.label));
	return rows;
}

const KEPT_PRIVATE_ROWS_SHOWN = 6;

/** Display name for a harness discriminator the gate prints. */
export function harnessLabel(name: string): string {
	if (name === "claude-code") return "Claude Code";
	if (name === "codex") return "Codex";
	return name;
}

/** One harness's payload block: window, activity, cost, models, inventory. */
function payloadBlock(payload: MeasuredPayload, showHeader: boolean): string[] {
	const out: string[] = [];
	if (showHeader) {
		out.push(
			`— ${harnessLabel(payload.harness.name)}${payload.harness.version ? ` ${payload.harness.version}` : ""}`,
		);
	}
	out.push(
		`window    ${payload.window.days} days · ${payload.window.from} → ${payload.window.to}`,
	);
	out.push(
		`activity  ${payload.activity.sessions} sessions · ${payload.activity.activeDays} active days · ${fmtTokens(payload.activity.totalTokens)} tokens`,
	);
	const usd = totalUSD(payload);
	out.push(
		usd === null
			? "cost      not published"
			: `cost      ${fmtUSD(usd)} at API prices`,
	);

	// Coverage is silent when clean; a degraded scan is named as a floor (#40).
	const cov = payload.coverage;
	if (cov.filesUnreadable > 0 || cov.linesFailed > 0) {
		out.push(
			`coverage  ${cov.filesUnreadable} files unreadable · ${cov.linesFailed} lines failed — this reading is a floor`,
		);
	}

	out.push("");
	out.push("models");
	for (const m of payload.models) {
		const dollars =
			usd !== null && m.apiEquivalentUSD !== undefined
				? `   ${fmtUSD(m.apiEquivalentUSD)}`
				: "";
		out.push(`  ${m.id.padEnd(28)} ${fmtPct(m.tokenShare)}${dollars}`);
	}

	out.push("");
	out.push("what publishes");
	for (const category of NAME_CATEGORIES) {
		const atoms = payload.inventory[category];
		if (atoms.length === 0) continue;
		const names = atoms.map((a) => a.name).join(", ");
		out.push(`  ${CATEGORY_LABEL[category].padEnd(9)} ${names}`);
	}
	return out;
}

export function buildGateSummary(ctx: GateContext): string {
	const { body, keptPrivate, config, source, baseUrl } = ctx;
	const { payloads } = body;
	const host = baseUrl.replace(/^https?:\/\//, "");
	const out: string[] = [];

	out.push("from your machine — sync preview");
	out.push("");

	if (config.stack === null) {
		out.push("to        (no linked stack — publish is unavailable)");
	} else {
		out.push(
			`to        ${config.stack.name} · ${host}/stacks/${config.stack.slug}`,
		);
	}

	// One block per detected harness. With a single harness the header line is
	// dropped, so the single-harness preview reads exactly as it always did.
	for (const payload of payloads) {
		out.push(...payloadBlock(payload, payloads.length > 1));
		out.push("");
	}
	if (out[out.length - 1] === "") out.pop();

	const n = payloads.reduce((a, p) => a + withheldCount(p), 0);
	if (n > 0) {
		out.push("");
		out.push(`kept private: ${n} name${n === 1 ? "" : "s"}`);
		const rows = keptPrivateRows(keptPrivate);
		const shown = rows.slice(0, KEPT_PRIVATE_ROWS_SHOWN);
		const width = Math.max(...shown.map((r) => r.label.length));
		for (const row of shown) {
			out.push(`  ${row.label.padEnd(width)}  ${row.names}`);
		}
		if (rows.length > shown.length) {
			out.push(`  ...${rows.length - shown.length} more`);
		}
		// #48: beat one names the switch before the first upload, and points at
		// the changes page. Both lines are the locked copy, verbatim or near it.
		if (body.keptPrivate !== undefined && config.stack !== null) {
			out.push(`  publish them at ${host}/stacks/${config.stack.slug}/changes`);
			out.push(
				"  (they go up for you to review — turn off: Review kept-private names, on your stack)",
			);
		} else {
			out.push("  they stay on this machine");
		}
	}

	if (source === "bundled") {
		out.push("");
		out.push(
			"! could not fetch your settings from aistack — using the bundled list.",
		);
		out.push(
			"  This publishes less: no cost, no ticked names, nothing staged for review.",
		);
	}

	return out.join("\n");
}
