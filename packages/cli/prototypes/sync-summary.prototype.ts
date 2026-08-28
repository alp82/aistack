// PROTOTYPE - throwaway. Answers: what should the sync summary look like?
// Run: pnpm tsx prototypes/sync-summary.prototype.ts [a|b|c]
import * as p from "@clack/prompts";
import { banner, bgLime, bold, dim, divider, lime, lines, red, section, yellow } from "../src/theme.js";

const variant = process.argv[2] ?? "a";

const fx = {
	stack: "Alper's Coding Stack", url: "aistack.to/stacks/alpers-coding-stack-unw0sl",
	window: "30 days · 2026-07-30 → 2026-08-28", version: "0.10.0",
	harnesses: [
		{ name: "Claude Code", ver: "2.1.251", sessions: 471, days: 26, tokens: "3.81B", cost: "$4,582",
		  coverage: "0 files unreadable · 8 lines failed", floor: true,
		  models: [["claude-opus-5", "62.1%", "$1,889"], ["claude-fable-5", "37.6%", "$2,688"], ["+2 more", "0.3%", "$5"]],
		  names: { tools: 17, skills: 12, agents: 4, commands: 9 },
		  lists: { tools: "Bash, Edit, Read, Write, WebFetch, Agent, Skill, WebSearch, ToolSearch, TaskUpdate, TaskCreate, SendUserFile, Monitor, TaskStop, Artifact, TaskOutput, EnterWorktree",
		           skills: "grilling, code-review, prototype, domain-modeling, research, claude-api, tdd, codebase-design, dataviz, diagnosing-bugs, update-config, artifact-design",
		           agents: "general-purpose, Explore, fork, claude-code-guide",
		           commands: "clear, wayfinder, implement, effort, model, prototype, config, setup-matt-pocock-skills, plugin" } },
		{ name: "Codex", ver: "0.146.1", sessions: 122, days: 6, tokens: "896M", cost: "$651",
		  skipped: "7 files not written by Codex (codex-tui ×7)",
		  models: [["gpt-5.6-sol", "100.0%", "$651"]], names: null },
		{ name: "Pi", ver: "", sessions: 1, days: 1, tokens: "0", cost: null, models: [], names: null },
	],
	days: "371 days · 2025-07-25 to 2026-08-28 · 38 with usage",
	workflow: "742 sessions · scout 62.6% · build 16.2% · verify 10.0% · handoff 3.8% · unknown 7.4%",
	git: "4794 commits · 21.7M lines changed",
	kept: [["(default)", 1], ["aistack", 1], ["aistack-sync", 1]], keptMore: 19,
	total: "4.7B tokens · 30 days · ≈$5,233 · 22 names go up for you to review",
};

const wrap = (s: string, width = 70, indent = "     ") => {
	const out: string[] = []; let cur = "";
	for (const w of s.split(", ")) { const n = cur ? `${cur}, ${w}` : w; if (n.length > width && cur) { out.push(cur); cur = w; } else cur = n; }
	out.push(cur); return out.map((l, i) => (i ? indent + l : l));
};
const kv = (k: string, v: string, w = 10) => `${dim(k.padEnd(w))}${v}`;

function header(label: string) {
	console.log(); p.intro(banner("sync"));
	p.log.message(dim("auto-sync: ok · published at 2026-08-28T03:05:57.200Z"));
	p.log.warn("Codex hook written - open Codex and run /hooks once to trust it, or it will not run.");
	p.log.step(`${bold("SCAN COMPLETE")} ${dim(label)}`);
}
function footer() {
	console.log(`${dim("│")}`);
	p.log.step(`${bold("PUBLISH?")} ${fx.total}`);
	lines([dim("22 kept-private names go up for you to review · turn off: Review kept-private names, on your stack")]);
	console.log(`${dim("│")}  ${dim("◇")} Publish  ${dim("/")}  Nothing was sent`);
	p.outro("done"); console.log();
}

// ── A: sections + type labels, like `collect` ────────────────────────────
function variantA() {
	header("variant A · sections");
	lines([kv("to", `${bold(fx.stack)} ${dim("·")} ${fx.url}`), kv("window", fx.window), kv("searched", `claude code, codex, opencode, pi ${dim(`· aistack ${fx.version}`)}`)]);
	for (const h of fx.harnesses) {
		divider(); section(h.name, h.sessions);
		lines([kv("usage", `${h.sessions} sessions · ${h.days} active days · ${bold(h.tokens)} tokens`)]);
		if (h.cost) lines([kv("cost", `${lime(`≈${h.cost}`)} ${dim("at API prices")}`)]);
		if (h.coverage) lines([kv("coverage", `${h.coverage} ${dim("· this reading is a floor")}`)]);
		if (h.skipped) lines([kv("skipped", yellow(h.skipped))]);
		h.models.forEach((m, i) => lines([kv(i ? "" : "models", `${m[0].padEnd(16)} ${m[1].padStart(6)}  ${dim(`≈${m[2]}`)}`)]));
		if (h.names) for (const [t, n] of Object.entries(h.names)) {
			lines([`${lime(t.toUpperCase())} ${dim(String(n))}`]);
			lines(wrap(h.lists[t as keyof typeof h.lists], 66, "  ").map((l) => dim(`  ${l}`)));
		} else if (h.cost) lines([kv("publishes", dim("no names from this harness"))]);
	}
	divider(); section("also publishing");
	lines([kv("days", fx.days), kv("workflow", fx.workflow), kv("git", fx.git)]);
	divider(); section("kept private", 22);
	for (const [n, c] of fx.kept) lines([`${dim(String(c).padStart(3))}  ${n}`]);
	lines([dim(`     …${fx.keptMore} more · review at ${fx.url}/changes`)]);
	footer();
}

// ── B: a single receipt table, one row per harness ───────────────────────
function variantB() {
	header("variant B · receipt");
	lines([`${bold(fx.stack)} ${dim("·")} ${fx.url}`, dim(fx.window)]);
	divider();
	const row = (c: string[], hd = false) => (hd ? dim : (s: string) => s)(`${c[0].padEnd(14)}${c[1].padStart(9)}${c[2].padStart(6)}${c[3].padStart(9)}${c[4].padStart(10)}${c[5].padStart(8)}`);
	lines([row(["harness", "sessions", "days", "tokens", "cost", "names"], true)]);
	for (const h of fx.harnesses) {
		const names = h.names ? String(Object.values(h.names).reduce((a, b) => a + b, 0)) : "–";
		lines([row([h.name, String(h.sessions), String(h.days), h.tokens, h.cost ? `≈${h.cost}` : "–", names])]);
		for (const m of h.models) lines([dim(`  ${m[0].padEnd(20)}${m[1].padStart(7)}   ≈${m[2]}`)]);
		if (h.coverage) lines([dim(`  ${h.coverage} · floor`)]);
		if (h.skipped) lines([`  ${yellow(h.skipped)}`]);
	}
	lines([bold(row(["total", "594", "", "4.7B", "≈$5,233", "42"]))]);
	divider();
	lines([kv("names", `${lime("TOOLS")} ${dim("17")}  ${lime("SKILLS")} ${dim("12")}  ${lime("AGENTS")} ${dim("4")}  ${lime("COMMANDS")} ${dim("9")}  ${dim("· all from Claude Code")}`)]);
	lines(wrap(fx.harnesses[0].lists.tools, 60, "          ").map((l, i) => dim(i ? l : `${"tools".padEnd(10)}${l}`)));
	lines([kv("days", fx.days), kv("workflow", fx.workflow), kv("git", fx.git)]);
	lines([kv("private", `22 names ${dim(`· (default), aistack, aistack-sync, …${fx.keptMore} more`)}`)]);
	footer();
}

// ── C: headline first, detail collapsed to one line per thing ────────────
function variantC() {
	header("variant C · headline");
	lines([`${bgLime(" 4.7B tokens ")} ${bold("≈$5,233")} ${dim("· 30 days · 594 sessions · 3 harnesses")}`]);
	lines([dim(`to ${fx.stack} · ${fx.url}`)]);
	for (const h of fx.harnesses) {
		divider();
		lines([`${bold(h.name)} ${dim(h.ver)}  ${h.tokens} tokens ${h.cost ? lime(`≈${h.cost}`) : dim("free")} ${dim(`· ${h.sessions} sessions · ${h.days} days`)}`]);
		if (h.models.length) lines([dim(`  ${h.models.map((m) => `${m[0]} ${m[1]}`).join("  ·  ")}`)]);
		if (h.coverage) lines([dim(`  ${h.coverage} · floor`)]);
		if (h.skipped) lines([`  ${yellow("skipped")} ${dim(h.skipped)}`]);
		if (h.names) lines([`  ${Object.entries(h.names).map(([t, n]) => `${lime(t)} ${n}`).join(dim("  ·  "))}`]);
	}
	divider();
	lines([kv("days", fx.days), kv("workflow", fx.workflow), kv("git", fx.git), kv("private", `22 names ${dim("· go up for you to review")}`)]);
	footer();
}

(({ a: variantA, a2: variantA2, a3: variantA3, b: variantB, c: variantC } as Record<string, () => void>)[variant] ?? (() => console.log(red("unknown variant"))))();

// ── A2: sections, name lists collapsed to counts ─────────────────────────
function variantA2() {
	header("variant A2 · sections, counts only");
	lines([kv("to", `${bold(fx.stack)} ${dim("·")} ${fx.url}`), kv("window", `${fx.window} ${dim(`· aistack ${fx.version}`)}`)]);
	for (const h of fx.harnesses) {
		divider(); section(h.name, h.sessions);
		lines([kv("usage", `${h.days} active days · ${bold(h.tokens)} tokens ${h.cost ? lime(`≈${h.cost}`) : ""}`)]);
		if (h.coverage) lines([kv("coverage", dim(`${h.coverage} · floor`))]);
		if (h.skipped) lines([kv("skipped", yellow(h.skipped))]);
		if (h.models.length) lines([kv("models", h.models.map((m) => `${m[0]} ${dim(m[1])}`).join(dim(" · ")))]);
		if (h.names) lines([kv("names", Object.entries(h.names).map(([t, n]) => `${lime(t.toUpperCase())} ${dim(String(n))}`).join("  "))]);
	}
	divider(); section("also publishing");
	lines([kv("days", fx.days), kv("workflow", fx.workflow), kv("git", fx.git), kv("private", `22 names ${dim(`· (default), aistack, aistack-sync, …${fx.keptMore} more`)}`)]);
	footer();
}

// ── A3: one section per harness, two lines each, no dividers ─────────────
function variantA3() {
	header("variant A3 · minimal");
	lines([kv("to", `${bold(fx.stack)} ${dim("·")} ${fx.url}`), kv("window", fx.window)]);
	for (const h of fx.harnesses) {
		section(h.name, h.sessions);
		lines([kv("usage", `${h.days} active days · ${bold(h.tokens)} tokens ${h.cost ? lime(`≈${h.cost}`) : ""} ${h.models.length ? dim(`· ${h.models.map((m) => `${m[0]} ${m[1]}`).join(", ")}`) : ""}`)]);
		if (h.skipped) lines([kv("skipped", yellow(h.skipped))]);
		if (h.names) lines([kv("names", Object.entries(h.names).map(([t, n]) => `${lime(t.toUpperCase())} ${dim(String(n))}`).join("  "))]);
	}
	section("also");
	lines([kv("days", dim(fx.days)), kv("workflow", dim(fx.workflow)), kv("git", dim(fx.git)), kv("private", dim("22 names, go up for you to review"))]);
	footer();
}
