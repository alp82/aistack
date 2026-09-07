/* PROTOTYPE - throwaway. A Context row at the head of the Stats accordion,
   over the page as committed (the accepted v43 of #356). Nothing else on the
   page changes and there are no toggles.

   Data: ctx.json, scanned read-only from this machine's own Claude Code and
   Codex logs (last 30 days, per API call, one entry per response). The
   Claude Code window is 1M (calls up to 580K prove the [1m] setting); the
   Codex window is the logged model_context_window.

   The row's body is the /context grid, one per harness: 200 cells, one cell
   is 0.5% of the window; filled cells are the median call split into shared
   prefix, session setup and conversation; outlined cells reach the p90; the
   rest is free space. The row is open by default. LOCKED 2026-09-07. */
"use strict";

const CTX = DATA.ctx;
const CW = 1_000_000; // Claude Code window on this machine
const CTX_COLORS = { shared: CHART[3], setup: CHART[1], conv: CHART[0] };
const CTX_LABEL = { shared: "harness", setup: "instructions", conv: "usual chat" };
const CTX_HINT = {
  shared: "what the harness itself sends on every call: system prompt and tool definitions",
  setup: "what the owner added: CLAUDE.md, memory, skills, agents, the first prompt",
  conv: "the median call, after the harness and instructions",
};

/* the two harness readings the row draws */
function ctxHarnesses() {
  const c = CTX.claude, x = CTX.codex;
  const cShared = c.triP50.shared, cSetup = c.triP50.setup;
  return [
    { id: "claude-code", name: "Claude Code", window: CW,
      p50: c.ctx.p50, p90: c.ctx.p90, max: c.ctx.max, calls: c.calls,
      parts: { shared: cShared, setup: cSetup, conv: Math.max(0, c.ctx.p50 - cShared - cSetup) },
      note: `${num(c.over200k)} calls over 200K` },
    { id: "codex", name: "Codex", window: x.window,
      p50: x.ctx.p50, p90: x.ctx.p90, max: x.ctx.max, calls: x.calls,
      parts: { shared: 11_904, setup: 18_515 - 11_904, conv: Math.max(0, x.ctx.p50 - 18_515) },
      note: `${num(x.compactions)} compactions` },
  ];
}

const ctxSq = (bg, extra = "") => `<i style="display:block;width:100%;aspect-ratio:1;background:${bg};${extra}"></i>`;

function ctxLegend(h) {
  const row = (k, v) => `<div style="display:flex;gap:8px;align-items:baseline;padding:3px 0" title="${CTX_HINT[k]}">
    <span style="width:8px;height:8px;background:${CTX_COLORS[k]};flex:none;align-self:center"></span>
    <span class="mono small sec2" style="min-width:104px">${CTX_LABEL[k]}</span>
    <b class="mono small">${fmtT(v)}</b><span class="mono small muted">${pct(v / h.window, 1)}</span></div>`;
  return `<div>
    ${row("shared", h.parts.shared)}${row("setup", h.parts.setup)}${row("conv", h.parts.conv)}
    <div style="display:flex;gap:8px;align-items:baseline;padding:3px 0;margin-top:6px" title="1 in 10 chats grow past this, after the harness and instructions">
      <span style="width:8px;height:8px;border:1px solid var(--stroke-strong);flex:none;align-self:center"></span>
      <span class="mono small sec2" style="min-width:104px">long chat</span><b class="mono small">${fmtT(h.p90 - h.parts.shared - h.parts.setup)}</b><span class="mono small muted">${pct((h.p90 - h.parts.shared - h.parts.setup) / h.window, 1)}</span></div>
    <div style="display:flex;gap:8px;align-items:baseline;padding:3px 0">
      <span style="width:8px;height:8px;background:var(--bg-panel-muted);flex:none;align-self:center"></span>
      <span class="mono small sec2" style="min-width:104px">free</span><b class="mono small">${fmtT(h.window - h.p50)}</b><span class="mono small muted">${pct(1 - h.p50 / h.window, 1)}</span></div>
  </div>`;
}

function ctxWaffle(h) {
  const N = 200, cell = h.window / N;
  const cells = [];
  const shared = Math.round(h.parts.shared / cell), setup = Math.round(h.parts.setup / cell);
  const filled = Math.max(shared + setup, Math.round(h.p50 / cell));
  const p90 = Math.min(N, Math.round(h.p90 / cell));
  for (let i = 0; i < N; i++) {
    if (i < shared) cells.push(ctxSq(CTX_COLORS.shared));
    else if (i < shared + setup) cells.push(ctxSq(CTX_COLORS.setup));
    else if (i < filled) cells.push(ctxSq(CTX_COLORS.conv));
    else if (i < p90) cells.push(ctxSq("transparent", "box-shadow:inset 0 0 0 1px var(--stroke-strong)"));
    else cells.push(ctxSq("var(--bg-panel-muted)"));
  }
  return `<div style="display:grid;grid-template-columns:repeat(20,1fr);gap:3px;max-width:320px" role="img" aria-label="${h.name}: a typical call uses ${fmtT(h.p50)} of a ${fmtT(h.window)} window">${cells.join("")}</div>`;
}

function ctxBody() {
  return `<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(420px,1fr));gap:32px 48px">
    ${ctxHarnesses().map(h => `<div>
      <div style="display:flex;gap:12px;align-items:baseline;margin-bottom:12px">
        <b class="mono" style="font-size:15px">${h.name}</b>
        <span class="mono" style="font-size:22px;font-weight:900">${fmtT(h.p50)}</span>
        <span class="mono small muted">of ${fmtT(h.window)} · ${pct(h.p50 / h.window, 0)} full · ${num(h.calls)} calls</span></div>
      <div style="display:grid;grid-template-columns:minmax(0,320px) 1fr;gap:24px;align-items:start">
        ${ctxWaffle(h)}${ctxLegend(h)}</div></div>`).join("")}
  </div>`;
}

/* the row head: same shape as the production rows, a context figure per harness */
function ctxRow() {
  const [c, x] = ctxHarnesses();
  const summary = `<b class="mono lime">${fmtT(c.p50)}</b> median call · <b class="mono">${pct(c.p50 / c.window, 0)}</b> of the Claude Code window · <b class="mono">${pct(x.p50 / x.window, 0)}</b> of the Codex window`;
  return `<details name="acc356" open style="border-bottom:1px solid var(--stroke)">
    <summary style="list-style:none;cursor:pointer;position:relative;display:block">
      <div style="position:relative;display:flex;align-items:center;gap:18px;padding:16px 4px;min-height:58px">
        <span class="mono" style="width:88px;flex:none;font-size:12px;font-weight:700;letter-spacing:.14em;text-transform:uppercase;color:var(--lime)">Context</span>
        <span class="small sec2" style="flex:1;min-width:0">${summary}</span><span class="mono muted arr">▾</span>
      </div>
    </summary>
    <div style="padding:8px 4px 26px 110px" class="accbody">${ctxBody()}</div>
  </details>`;
}

/* ======================= wiring ======================= */
const _productionStatsAccordion = productionStatsAccordion;
productionStatsAccordion = function () {
  const html = _productionStatsAccordion();
  const at = html.indexOf("<details");
  return html.slice(0, at) + ctxRow() + html.slice(at);
};
function renderC1() { return renderV43(); }
VARIANTS.length = 0;
VARIANTS.push(["c1", "Context row"]);
for (const k of Object.keys(RENDER)) delete RENDER[k];
RENDER.c1 = renderC1;
