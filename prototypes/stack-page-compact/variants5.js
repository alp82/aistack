/* PROTOTYPE - throwaway (ticket alp82/aistack#351). Round 5: the v27 frame
   locked (title rail, two shades, drawer), the original page's loved pieces
   back (metric block with watermark + fun facts, cost tooltip, the colored
   model breakdown with notches), and five treatments of the Stats interior. */
"use strict";

/* ---------- the originals, rebuilt ---------- */
const CHART=["#69a621","#9e71fd","#c21977","#4278d2","#00a99b","#e66700"];
const FRESH=U.tok?U.tok.input+U.tok.output:U.totalTokens*(1-U.cacheHitShare);
const CACHED=U.tok?U.tok.cacheRead:U.totalTokens*U.cacheHitShare;
const FACTS=(()=>{const words=U.totalTokens*0.75;return [
  `≈ ${num(words/90000)} novels' worth of words`,
  `≈ ${num(U.totalTokens*4/160/1e6)}M text messages at 160 characters`,
  `≈ ${num(words/885000)}× the complete works of Shakespeare`,
  `≈ ${num(words/238/60/24)} days of nonstop out-loud reading`,
];})();

/* metric block: watermark history, fun-fact flips on click, cost hover card */
function metricBlock(){
  const max=Math.max(...U.series.map(p=>p.t));
  const pts=U.series.map((p,i)=>`${(i/(U.series.length-1))*400},${96-(p.t/max)*92}`).join(" ");
  const area=`<svg width="100%" height="100%" viewBox="0 0 400 96" preserveAspectRatio="none" aria-hidden="true"><polygon points="0,96 ${pts} 400,96" fill="var(--lime)"/><polyline points="${pts}" fill="none" stroke="var(--lime)" stroke-width="2"/></svg>`;
  const costRows=modelRows.map((m,i)=>`<div style="display:flex;gap:8px;justify-content:space-between;padding:2px 0"><span style="display:flex;gap:6px;align-items:center"><span style="width:8px;height:8px;background:${CHART[i%6]}"></span>${esc(m.name)}</span><b class="mono">${fmtUSD(m.usd)}</b></div>`).join("");
  return `
  <div style="position:relative">
    <div style="position:absolute;inset:0;overflow:hidden;opacity:.16;pointer-events:none">${area}</div>
    <div style="position:relative;padding:12px">
      <button type="button" onclick="this.querySelector('i').textContent=FACTS[(++this.dataset.i)%FACTS.length]" data-i="0" style="all:unset;cursor:pointer;display:block">
        <span class="mono" style="font-size:clamp(44px,5.4vw,60px);font-weight:900;line-height:1;display:block">${fmtT(U.totalTokens)}</span>
        <span class="kick muted" style="display:block;margin-top:8px">tokens · last 30 days</span>
        <i class="mono small lime" style="display:block;font-style:normal;margin-top:4px">≈ tap for a fun fact</i>
      </button>
      <p class="mono small muted" style="margin-top:6px">${fmtT(FRESH)} fresh · ${fmtT(CACHED)} cached</p>
      <div class="hovh" style="position:relative;display:inline-block;margin-top:14px">
        <span class="mono" style="font-size:26px;font-weight:900;border-bottom:1px dotted var(--stroke-strong);cursor:help">≥${fmtUSD(U.usd)}</span>
        <span class="kick muted" style="display:block;margin-top:4px">at api list prices</span>
        <div class="hovc" style="position:absolute;left:0;top:100%;z-index:30;width:280px;background:var(--bg-shell);border:1px solid var(--stroke-strong);padding:12px;display:none">
          ${costRows}<p class="small muted" style="margin-top:8px;border-top:1px solid var(--stroke);padding-top:6px">${COST_NOTE}</p></div>
      </div>
      <p class="mono small" style="margin-top:12px"><span class="lime">${UP} ×${(U.totalTokens/U.prevTokens).toFixed(0)}</span> <span class="muted">vs the 30 days before</span></p>
    </div>
  </div>
  <style>.hovh:hover .hovc{display:block}</style>`;
}

/* the colored model breakdown with hatched was-here notches */
function modelBreakdown(){
  return `
  <div style="display:flex;justify-content:space-between;align-items:baseline;flex-wrap:wrap;gap:6px;margin-bottom:8px">
    <p class="kick lime">where the tokens went</p>
    <p class="mono small muted">the notch marks each share 30 days ago</p></div>
  <div style="border-top:1px solid var(--stroke);border-bottom:1px solid var(--stroke)">
  ${modelRows.map((m,i)=>{
    const paint=CHART[i%6];
    const moved=m.prevShare!=null&&Math.abs(m.prevShare-m.share)>0.02;
    const d=m.prevShare!=null?Math.round((m.share-m.prevShare)*100):null;
    return `<div style="display:flex;align-items:center;gap:12px;padding:10px 0;border-top:${i?`1px solid var(--stroke)`:"0"}">
      <span style="width:12px;height:12px;background:${paint};flex:none"></span>
      <span style="width:128px;flex:none;font-size:14px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${esc(m.name)}</span>
      <span style="position:relative;flex:1;height:28px;background:var(--bg-panel)" title="${esc(m.name)} · ${pct(m.share,1)} · ${fmtUSD(m.usd)} · ${fmtT(m.tokens)} tokens">
        <span style="position:absolute;inset:0 auto 0 0;width:${Math.max(1,m.share*100)}%;background:${paint}"></span>
        ${moved?`<span style="position:absolute;top:-3px;bottom:-3px;left:${m.prevShare*100}%;width:7px;transform:translateX(-50%);background:repeating-linear-gradient(45deg,#fff 0 2px,#000 2px 4px)"></span>`:""}
      </span>
      <b class="mono" style="width:52px;text-align:right;font-size:14px">${pct(m.share,1)}</b>
      <span class="mono small muted" style="width:34px;text-align:right">${d===null?"–":d>0?"↑"+d:d<0?"↓"+(-d):"–"}</span>
    </div>`;}).join("")}
  </div>`;
}

/* the top block both halves together, v27 two-column */
const statsTop=()=>`
  <div style="display:grid;grid-template-columns:minmax(0,340px) 1fr;gap:34px" class="g2">
    <div>${metricBlock()}</div>
    <div>${modelBreakdown()}
      <div style="display:flex;gap:26px;flex-wrap:wrap;margin-top:14px" class="mono small muted">
        <span><b class="sec2">${num(U.sessions)}</b> sessions</span><span><b class="sec2">${U.activeDays}/30</b> days</span>
        <span><b class="sec2">${pct(U.cacheHitShare,1)}</b> cache hits</span><span><b class="sec2">${pct(U.subagentShare,1)}</b> subagent tokens</span>
        <span><b class="sec2">${U.harnessesLabel??"claude-code 61% · codex 39%"}</b></span></div>
    </div>
  </div>`;

/* the original five tab groups, as pure-CSS tabs */
const TOPIC5=[
  ["time","Time",["component:activity-heatmap","component:start-hours","metric:late-night-commits","component:phase-playbook","metric:turn-duration"]],
  ["code","Code",["component:git-ledger","component:coding-languages","metric:parallel-projects"]],
  ["models","Models",["component:model-routing","metric:effort-levels","metric:thinking-share"]],
  ["harness","Harness",["component:delegation","metric:question-back-share"]],
  ["skills","Skills",["component:kit","metric:web-searches-per-active-day"]]];
const cellsOf=list=>wfCells.filter(c=>list.includes(c.id));
function cssTabs(prefix){
  const radios=TOPIC5.map(([id],i)=>`<input type="radio" name="${prefix}" id="${prefix}-${id}" ${i===0?"checked":""} style="display:none">`).join("");
  const labels=`<div style="display:flex;flex-wrap:wrap;border-bottom:1px solid var(--stroke)">${TOPIC5.map(([id,t,l])=>`<label for="${prefix}-${id}" class="mono" style="padding:10px 16px;font-size:12px;letter-spacing:.1em;text-transform:uppercase;cursor:pointer;color:var(--fg-muted)">${t} · ${cellsOf(l).length}</label>`).join("")}</div>`;
  const panels=TOPIC5.map(([id,,l])=>`<div class="tp tp-${prefix}-${id}" style="display:none;margin-top:20px">${tailGrid(cellsOf(l))}</div>`).join("");
  const css=`<style>${TOPIC5.map(([id])=>`#${prefix}-${id}:checked~div label[for="${prefix}-${id}"]{color:var(--lime);box-shadow:inset 0 -2px var(--lime)}#${prefix}-${id}:checked~.tp-${prefix}-${id}{display:block!important}`).join("")}</style>`;
  return `<div>${radios}${labels}${panels}${css}</div>`;
}

/* v27 frame pieces with the simple section names */
const frame5=(statsBody,statsMeta)=>{
  const hero=`<section style="background:${TINT2[0]};padding:44px 0"><div style="max-width:1220px;margin:0 auto;padding:0 24px">${heroV16()}</div></section>`;
  return hero+
    railSec(TINT2[1],"01","// sync","Stats",statsMeta??`30d · checked ${readCheckedAgo}`,statsBody)+
    railSec(TINT2[0],"02","// showcase","Projects",P.length+" projects",projGridV16())+
    railSec(TINT2[1],"03","// ai components","Tools",`${S.tools.length} · ${priceMo(S.price)}`,toolsBodyV16())+
    railSec(TINT2[0],"04","// writeup","Guide",guideMin+" min read",guideBodyV16())+
    ctaStrip()+MEDIA_G2;
};

/* =========================================================================
   V32 SIMPLE -> DETAILS - the originals up top, a podium of three, and the
   v27 drawer holding the twelve.
   ========================================================================= */
function renderV32(){
  return frame5(statsTop()+
    `<div style="margin-top:28px">${podiumGrid()}</div>
     ${drawer("12 more measurements",tailGrid(wfCells.slice(3)))}`);
}

/* =========================================================================
   V33 TABS - the originals up top, then the five familiar tabs, compact.
   ========================================================================= */
function renderV33(){
  return frame5(statsTop()+`<div style="margin-top:28px">${cssTabs("t33")}</div>`);
}

/* =========================================================================
   V34 DISTRIBUTED - the originals stay in Stats with the time measurements;
   git stats live in Projects, tool-usage stats live in Tools.
   ========================================================================= */
function renderV34(){
  const hero=`<section style="background:${TINT2[0]};padding:44px 0"><div style="max-width:1220px;margin:0 auto;padding:0 24px">${heroV16()}</div></section>`;
  const timeCells=cellsOf(["component:activity-heatmap","component:start-hours","component:phase-playbook","metric:turn-duration"]);
  const projCells=cellsOf(["component:git-ledger","component:coding-languages","metric:late-night-commits","metric:parallel-projects"]);
  const toolCells=cellsOf(["component:model-routing","component:kit","component:delegation","metric:effort-levels","metric:thinking-share"]);
  const rest=cellsOf(["metric:question-back-share","metric:web-searches-per-active-day"]);
  return hero+
    railSec(TINT2[1],"01","// sync","Stats",`30d · checked ${readCheckedAgo}`,
      statsTop()+
      `<div style="margin-top:26px"><p class="kick lime" style="margin-bottom:14px">when the work happens</p>${tailGrid(timeCells)}</div>
       <div style="margin-top:18px">${scanRows(rest)}</div>`)+
    railSec(TINT2[0],"02","// showcase","Projects",P.length+" projects",
      projStatCards()+
      `<div style="margin-top:26px"><p class="kick lime" style="margin-bottom:14px">the code behind them</p>${tailGrid(projCells)}</div>`)+
    railSec(TINT2[1],"03","// ai components","Tools",`${S.tools.length} · ${priceMo(S.price)}`,
      toolsBodyV16()+
      `<div style="margin-top:26px"><p class="kick lime" style="margin-bottom:14px">how these tools get used</p>${tailGrid(toolCells)}</div>`)+
    railSec(TINT2[0],"04","// writeup","Guide",guideMin+" min read",guideBodyV16())+
    ctaStrip()+MEDIA_G2;
}

/* =========================================================================
   V35 TWO LEVEL - the value layer alone (originals + three inline figures),
   the drawer opens the full tabbed set.
   ========================================================================= */
function renderV35(){
  return frame5(statsTop()+
    `<div style="display:flex;gap:34px;flex-wrap:wrap;margin-top:26px">
      ${wfCells.slice(0,3).map(c=>`<div><div class="mono lime" style="font-weight:900;font-size:26px">${c.fig}</div><div class="small muted" style="max-width:190px">${c.label}</div></div>`).join("")}
    </div>
    ${drawer("all 15 measurements, by topic",cssTabs("t35"))}`);
}

/* =========================================================================
   V36 GROUPED SCAN - the originals up top, then every measurement as one
   scannable row inside small topic groups, each with its chart beside it.
   ========================================================================= */
function renderV36(){
  const groupRows=TOPIC5.map(([,t,l])=>{
    const cells=cellsOf(l); if(!cells.length) return "";
    return `<div style="margin-top:22px"><p class="kick muted" style="margin-bottom:6px">${t.toLowerCase()}</p>
      ${cells.map(c=>`<div style="display:grid;grid-template-columns:70px minmax(180px,240px) 1fr;gap:14px;align-items:center;padding:8px 0;border-bottom:1px solid var(--stroke)" class="sr3">
        <b class="mono lime" style="font-size:20px;text-align:right">${c.fig}</b>
        <span class="small"><b>${c.name}</b><br><span class="muted">${c.label}</span></span>
        <div style="min-width:0">${microViz(c.id,false)}</div></div>`).join("")}</div>`;}).join("");
  return frame5(statsTop()+groupRows+
    `<style>@media(max-width:760px){.sr3{grid-template-columns:60px 1fr!important}.sr3>div{grid-column:1/3}}</style>`);
}
