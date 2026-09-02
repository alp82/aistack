/* PROTOTYPE - throwaway (ticket alp82/aistack#351). Round 4: six refinements
   of the winning v16 frame, one per axis the operator opened:
   tonal bands, usage hierarchy, v20 title rail, v17 lime accent panel,
   a usage timeline, and v25's distributed per-section stats. */
"use strict";

/* ---------- round-4 shared kit ---------- */
/* tonal band ladders: lightness tints of the canvas hue, no hard contrast */
const TINT4=["oklch(0.16 0.008 256)","oklch(0.185 0.009 256)","oklch(0.21 0.009 256)","oklch(0.185 0.009 256)"];
const TINT2=["oklch(0.16 0.008 256)","oklch(0.19 0.009 256)"];
const bandAt=(ladder,i)=>ladder[i%ladder.length];

/* v16-style numbered header (kept from the winner) */
const v16head=(n,kick,title,meta)=>`
  <div style="display:flex;align-items:flex-end;gap:16px;border-bottom:1px solid var(--stroke);padding-bottom:12px;margin-bottom:24px">
    ${NUM7(n)}
    <div style="flex:1"><p class="kick lime">${kick}</p>
    <h2 style="font-size:clamp(24px,3.4vw,34px);font-weight:900;text-transform:uppercase;letter-spacing:-.01em">${title}</h2></div>
    <span class="mono small muted">${meta||""}</span></div>`;

/* v20-style title rail: chapter number and title in a left rail */
const railSec=(bg,n,kick,title,meta,body)=>`
  <section style="background:${bg};padding:40px 0"><div style="max-width:1220px;margin:0 auto;padding:0 24px">
    <div style="display:grid;grid-template-columns:190px 1fr;gap:30px" class="rl2">
      <div><div class="mono" style="font-size:52px;font-weight:900;color:var(--lime);line-height:1">${n}</div>
        <p class="kick lime" style="margin-top:6px">${kick}</p>
        <h2 style="font-size:22px;font-weight:900;text-transform:uppercase;letter-spacing:-.01em;margin-top:2px">${title}</h2>
        <p class="mono small muted" style="margin-top:10px">${meta||""}</p></div>
      <div style="min-width:0">${body}</div>
    </div></div></section>`;

/* v17's lime summary panel, sized as an accent block */
const limeSummary=()=>`
  <div style="background:var(--lime);color:var(--lime-contrast);padding:22px 24px">
    <div style="display:flex;gap:28px;flex-wrap:wrap;align-items:flex-end">
      <div><div class="mono" style="font-size:clamp(44px,6vw,68px);font-weight:900;line-height:.9">${fmtT(U.totalTokens)}</div>
        <p class="mono" style="font-size:11px;letter-spacing:.18em;text-transform:uppercase;margin-top:4px;opacity:.75">tokens · 30 days</p></div>
      ${[[fmtUSD(U.usd),"spend ≥ list"],[num(U.sessions),"sessions"],[U.activeDays+"/30","active days"],[pct(U.cacheHitShare,1),"cache hits"]]
        .map(([v,k])=>`<div><div class="mono" style="font-weight:900;font-size:24px">${v}</div><div class="mono" style="font-size:10px;letter-spacing:.12em;text-transform:uppercase;opacity:.7">${k}</div></div>`).join("")}
    </div>
    <div style="mix-blend-mode:multiply;margin-top:10px">${spark(U.series,900,50).replace('var(--lime)','var(--lime-contrast)')}</div>
  </div>`;

/* hierarchy: the three highlight rows big, with their charts */
const podiumGrid=()=>`
  <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:26px">
  ${wfCells.slice(0,3).map(c=>`<div style="border-top:2px solid var(--lime);padding-top:10px">
    <div style="display:flex;gap:10px;align-items:baseline"><b class="mono" style="font-size:30px">${c.fig}</b><span class="small sec2"><b>${c.name}</b></span></div>
    <p class="small muted" style="margin:3px 0 10px">${c.label}</p>${microViz(c.id,false)}</div>`).join("")}</div>`;

/* quick-scan one-liners for the tail measurements */
const scanRows=(cells)=>cells.map(c=>`
  <div style="display:flex;gap:12px;padding:6px 0;border-bottom:1px solid var(--stroke);align-items:baseline">
    <b class="mono lime" style="width:62px;text-align:right;flex:none">${c.fig}</b>
    <span class="small" style="min-width:0"><b>${c.name}</b> <span class="muted">· ${c.label}</span></span></div>`).join("");

/* styled drawer for the initially hidden tail */
const drawer=(label,inner)=>`
  <details style="margin-top:18px"><summary class="mono" style="cursor:pointer;list-style:none;display:inline-flex;align-items:center;gap:10px;border:1px solid var(--stroke);padding:9px 16px;font-size:12px;letter-spacing:.1em;text-transform:uppercase;color:var(--lime)">▸ ${label}</summary>
  <div style="margin-top:16px">${inner}</div></details>`;

/* the deep tail as a two-column chart grid */
const tailGrid=(cells)=>`
  <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:20px 30px">
  ${cells.map(c=>`<div><div style="display:flex;gap:8px;align-items:baseline"><b class="mono lime" style="font-size:20px">${c.fig}</b><span class="small"><b>${c.name}</b></span></div>
    <p class="small muted" style="margin:2px 0 6px">${c.label}</p>${microViz(c.id,false)}</div>`).join("")}</div>`;

/* usage timeline: the 30 days as an annotated horizontal history */
function usageTimeline(){
  const max=Math.max(...U.series.map(p=>p.t));
  const peak=U.series.reduce((a,b)=>b.t>a.t?b:a);
  const cols=U.series.map(p=>{
    const g=W.gitDays.find(x=>x.d===p.d);
    return `<div title="${p.d} · ${fmtT(p.t)} tokens${g?` · ${g.c} commits`:""}" style="flex:1;display:flex;flex-direction:column;justify-content:flex-end;gap:2px;height:100%">
      <span style="background:var(--lime);opacity:${0.3+0.7*p.t/max};height:${Math.max(2,p.t/max*72)}px"></span>
      <span style="background:var(--stroke-strong);height:${g?Math.max(1,g.c/40*16):1}px"></span></div>`;}).join("");
  return `
  <div style="border:1px solid var(--stroke);padding:18px 18px 12px">
    <div style="display:flex;justify-content:space-between;flex-wrap:wrap;gap:8px;margin-bottom:10px" class="mono small">
      <span><b class="lime">${fmtT(U.totalTokens)}</b> tokens · <b>${fmtUSD(U.usd)}</b> · ${num(U.sessions)} sessions</span>
      <span class="muted">▮ tokens · ▄ commits</span></div>
    <div style="display:flex;gap:2px;height:92px;align-items:flex-end">${cols}</div>
    <div class="mono small muted" style="display:flex;justify-content:space-between;margin-top:6px">
      <span>${U.series[0].d}</span><span class="lime">peak ${peak.d} · ${fmtT(peak.t)}</span><span>${U.series[U.series.length-1].d}</span></div>
    <div style="display:flex;gap:24px;flex-wrap:wrap;margin-top:10px;border-top:1px solid var(--stroke);padding-top:10px" class="mono small">
      <span>vs the 30 days before: <b class="lime">${UP} tokens ×${(U.totalTokens/U.prevTokens).toFixed(0)}</b></span>
      <span class="muted">spend then ${fmtUSD(U.prevUsd)} → now ${fmtUSD(U.usd)}</span></div>
  </div>`;
}

/* project cards with integrated project-related stats (v25 idea) */
const projStatCards=()=>{
  const stats=[
    `<b class="mono lime">${rowVal(row("metric:parallel-projects"))}</b> in parallel on a median day`,
    `<b class="mono lime">${num(W.git.commits)}</b> commits · +${fmtT(W.git.add)} −${fmtT(W.git.rm)}`,
    `<b class="mono lime">${pct(W.git.test/W.git.commits)}</b> of commits touch a test file`,
    `<b class="mono lime">${W.langs[0].ext}</b> leads the changed lines at ${pct(W.langs[0].share)}`,
    `<b class="mono lime">${rowVal(row("metric:late-night-commits"))}</b> of commits land late night`,
    `<b class="mono lime">${num(U.projects)}</b> distinct workspaces touched`];
  return `<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(300px,1fr));gap:14px">
    ${P.map((p,i)=>`<div style="border:1px solid var(--stroke);padding:16px">
      <div style="display:flex;gap:8px;align-items:baseline"><b style="font-size:16px">${esc(p.name)}</b>${p.url?`<span class="lime" style="margin-left:auto">↗</span>`:""}</div>
      <p class="small sec2" style="margin-top:5px">${esc(p.desc||"")}</p>
      <p class="mono muted" style="font-size:10px;text-transform:uppercase;margin-top:8px">${p.tags.join(" · ")}</p>
      <p class="small" style="margin-top:10px;border-top:1px solid var(--stroke);padding-top:8px">${stats[i%stats.length]}</p>
    </div>`).join("")}</div>`;
};

const heroV16=()=>`
  <div style="display:flex;flex-wrap:wrap;gap:26px;align-items:flex-end">
    <div style="flex:1;min-width:300px">
      <h1 style="font-size:clamp(44px,7vw,84px);font-weight:900;line-height:.88;letter-spacing:-.03em;text-transform:uppercase">${esc(S.name)}</h1>
      <p style="margin-top:12px;font-size:17px;color:var(--fg-secondary);max-width:520px">${esc(S.oneLiner)}</p>
      <p class="small muted" style="margin-top:8px">${esc(S.creator.name)} @${esc(S.creator.handle)} · ${UP} 12 · Share · Report</p>
    </div>
    <div style="text-align:right"><div class="mono" style="font-size:clamp(40px,5vw,60px);font-weight:900">${price(S.price)}<span style="font-size:17px;color:var(--fg-muted)">/mo</span></div>
    <div style="display:flex;gap:6px;margin-top:12px;justify-content:flex-end">${toolsSorted.slice(0,6).map(t=>toolIcn(t,30)).join("")}<span class="chip">+${S.tools.length-6}</span></div></div>
  </div>`;
const ctaStrip=()=>`<section style="background:var(--lime);padding:24px;text-align:center"><b class="mono" style="color:var(--lime-contrast);text-transform:uppercase;letter-spacing:.14em;font-size:14px">Share your own stack →</b></section>`;
const projGridV16=()=>`<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(320px,1fr));gap:14px">
  ${P.map(p=>`<div style="border:1px solid var(--stroke);padding:16px">
    <div style="display:flex;gap:8px;align-items:baseline"><b style="font-size:16px">${esc(p.name)}</b>${p.url?`<span class="lime" style="margin-left:auto">↗</span>`:""}</div>
    <p class="small sec2" style="margin-top:5px">${esc(p.desc||"")}</p>
    <p class="mono muted" style="font-size:10px;text-transform:uppercase;margin-top:8px">${p.tags.join(" · ")}</p></div>`).join("")}</div>`;
const toolsBodyV16=()=>`<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px 40px" class="g2">${toolTableRows(false)}</div>
  <div style="display:flex;gap:20px;flex-wrap:wrap;margin-top:16px" class="small muted">
    <span><b class="sec2">Models (${S.models.length})</b> ${S.models.map(m=>esc(m.name)).join(", ")}</span>
    <span><b class="sec2">${esc(S.bundles[0].name)}</b> ${esc(S.bundles[0].tier)} · ${priceMo(S.bundles[0].amount)}</span></div>`;
const guideBodyV16=()=>`<div style="display:grid;grid-template-columns:2fr 1fr;gap:32px" class="g2">
  <p style="font-size:17px;line-height:1.65;color:var(--fg-secondary)">${esc(S.guide.firstp)} <b class="lime">read on →</b></p>
  <div style="border-left:2px solid var(--lime);padding-left:16px">${S.guide.heads.map(h=>`<p class="mono" style="font-size:13px;padding:4px 0">${esc(h)}</p>`).join("")}</div></div>`;
const MEDIA_G2=`<style>@media(max-width:820px){.g2{grid-template-columns:1fr!important}.rl2{grid-template-columns:1fr!important}}</style>`;

/* =========================================================================
   V26 TONAL 4 - v16 with a four-tint dark ladder, podium + quick-scan
   hierarchy, lime summary as the one bright accent.
   ========================================================================= */
function renderV26(){
  const wrap=i=>`<div style="max-width:1220px;margin:0 auto;padding:0 24px">${i}</div>`;
  const band=(i,inner)=>`<section style="background:${bandAt(TINT4,i)};padding:44px 0">${wrap(inner)}</section>`;
  return band(0,heroV16())+
    band(1,v16head("01","// sync","Actual Usage",`30d · checked ${readCheckedAgo}`)+
      limeSummary()+
      `<div style="display:grid;grid-template-columns:1fr 1fr;gap:30px;margin-top:26px" class="g2">
        <div>${modelTableRows(false)}<p class="small muted" style="margin-top:8px">${COST_NOTE}</p></div>
        <div>${podiumGrid()}</div>
      </div>
      <div style="margin-top:26px">${scanRows(wfCells.slice(3))}</div>`)+
    band(2,v16head("02","// showcase","Projects",P.length+" projects")+projGridV16())+
    band(3,v16head("03","// ai components","Tools",`${S.tools.length} · ${priceMo(S.price)}`)+toolsBodyV16())+
    band(1,v16head("04","// writeup","Guide",guideMin+" min read")+guideBodyV16())+
    ctaStrip()+MEDIA_G2;
}

/* =========================================================================
   V27 TONAL 2 + RAIL - two shades only, v20's title rail as every section
   header, tail measurements initially hidden behind a drawer.
   ========================================================================= */
function renderV27(){
  const hero=`<section style="background:${TINT2[0]};padding:44px 0"><div style="max-width:1220px;margin:0 auto;padding:0 24px">${heroV16()}</div></section>`;
  return hero+
    railSec(TINT2[1],"01","// sync","Actual Usage",`30d · checked ${readCheckedAgo}`,`
      ${limeSummary()}
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:26px;margin-top:22px" class="g2">
        <div>${modelTableRows(false)}<p class="small muted" style="margin-top:8px">${COST_NOTE}</p></div>
        <div>${podiumGrid()}</div>
      </div>
      ${drawer("12 more measurements",tailGrid(wfCells.slice(3)))}`)+
    railSec(TINT2[0],"02","// showcase","Projects",P.length+" projects",projGridV16())+
    railSec(TINT2[1],"03","// ai components","Tools",`${S.tools.length} · ${priceMo(S.price)}`,toolsBodyV16())+
    railSec(TINT2[0],"04","// writeup","Guide",guideMin+" min read",guideBodyV16())+
    ctaStrip()+MEDIA_G2;
}

/* =========================================================================
   V28 DISTRIBUTED - v25's idea grown up: each measurement lives in the
   section it naturally belongs to. Usage keeps time and models; projects
   carry the git stats; tools carry the kit and routing stats.
   ========================================================================= */
function renderV28(){
  const wrap=i=>`<div style="max-width:1220px;margin:0 auto;padding:0 24px">${i}</div>`;
  const band=(i,inner)=>`<section style="background:${bandAt(TINT4,i)};padding:44px 0">${wrap(inner)}</section>`;
  const ids=list=>wfCells.filter(c=>list.includes(c.id));
  const timeIds=["component:activity-heatmap","component:start-hours","component:phase-playbook","metric:turn-duration","metric:question-back-share","metric:web-searches-per-active-day"];
  const projIds=["component:git-ledger","component:coding-languages","metric:late-night-commits","metric:parallel-projects"];
  const toolIds=["component:model-routing","component:kit","component:delegation","metric:effort-levels","metric:thinking-share"];
  return band(0,heroV16())+
    band(1,v16head("01","// sync","Actual Usage",`30d · checked ${readCheckedAgo}`)+
      limeSummary()+
      `<div style="display:grid;grid-template-columns:1fr 1fr;gap:30px;margin-top:24px" class="g2">
        <div><p class="kick lime" style="margin-bottom:10px">where the tokens went</p>${modelTableRows(false)}
          <p class="small muted" style="margin-top:8px">${COST_NOTE}</p></div>
        <div><p class="kick lime" style="margin-bottom:10px">when and how the sessions run</p>${tailGrid(ids(timeIds).slice(0,4))}</div>
      </div>
      <div style="margin-top:20px">${scanRows(ids(timeIds).slice(4))}</div>`)+
    band(2,v16head("02","// showcase","Projects",P.length+" projects")+
      projStatCards()+
      `<div style="margin-top:24px"><p class="kick lime" style="margin-bottom:10px">the code behind them</p>${tailGrid(ids(projIds))}</div>`)+
    band(3,v16head("03","// ai components","Tools",`${S.tools.length} · ${priceMo(S.price)}`)+
      toolsBodyV16()+
      `<div style="margin-top:24px"><p class="kick lime" style="margin-bottom:10px">how these tools get used</p>${tailGrid(ids(toolIds))}</div>`)+
    band(1,v16head("04","// writeup","Guide",guideMin+" min read")+guideBodyV16())+
    ctaStrip()+MEDIA_G2;
}

/* =========================================================================
   V29 TIMELINE USAGE - v16 tonal frame; the usage section leads with an
   annotated 30-day timeline instead of a stat wall.
   ========================================================================= */
function renderV29(){
  const wrap=i=>`<div style="max-width:1220px;margin:0 auto;padding:0 24px">${i}</div>`;
  const band=(i,inner)=>`<section style="background:${bandAt(TINT4,i)};padding:44px 0">${wrap(inner)}</section>`;
  return band(0,heroV16())+
    band(1,v16head("01","// sync","Actual Usage",`30d · checked ${readCheckedAgo}`)+
      usageTimeline()+
      `<div style="display:grid;grid-template-columns:1fr 1fr;gap:30px;margin-top:24px" class="g2">
        <div>${modelTableRows(false)}<p class="small muted" style="margin-top:8px">${COST_NOTE}</p></div>
        <div><div style="margin-bottom:14px">${phaseStrip(16)}</div>${scanRows(wfCells.slice(0,6))}</div>
      </div>
      ${drawer("9 more measurements",tailGrid(wfCells.slice(6)))}`)+
    band(2,v16head("02","// showcase","Projects",P.length+" projects")+projGridV16())+
    band(3,v16head("03","// ai components","Tools",`${S.tools.length} · ${priceMo(S.price)}`)+toolsBodyV16())+
    band(1,v16head("04","// writeup","Guide",guideMin+" min read")+guideBodyV16())+
    ctaStrip()+MEDIA_G2;
}

/* =========================================================================
   V30 QUIET + DRAWERS - maximum breathing room: each section shows only its
   value layer; every deep layer sits behind a styled drawer.
   ========================================================================= */
function renderV30(){
  const wrap=i=>`<div style="max-width:1100px;margin:0 auto;padding:0 24px">${i}</div>`;
  const band=(i,inner)=>`<section style="background:${bandAt(TINT2,i)};padding:52px 0">${wrap(inner)}</section>`;
  return band(0,heroV16())+
    band(1,v16head("01","// sync","Actual Usage",`30d · checked ${readCheckedAgo}`)+
      limeSummary()+
      `<div style="margin-top:22px;max-width:720px">
        ${modelRows.slice(0,3).map(m=>barRow(m.name,m.share,pct(m.share,1))).join("")}
      </div>
      <div style="display:flex;gap:34px;flex-wrap:wrap;margin-top:22px" class="mono">
        ${wfCells.slice(0,3).map(c=>`<div><div class="lime" style="font-weight:900;font-size:26px">${c.fig}</div><div class="small muted" style="max-width:180px">${c.name}</div></div>`).join("")}
      </div>
      ${drawer("the full reading · models, phases, 15 measurements",
        modelTableRows(false)+`<div style="margin:16px 0">${phaseStrip(14)}</div>`+tailGrid(wfCells)+`<p class="small muted" style="margin-top:10px">${COST_NOTE}</p>`)}`)+
    band(0,v16head("02","// showcase","Projects",P.length+" projects")+
      `<p style="font-size:16px;max-width:640px" class="sec2">${P.map(p=>p.url?`<b>${esc(p.name)}</b>`:esc(p.name)).join(", ")}.</p>`+
      drawer("project details",projGridV16()))+
    band(1,v16head("03","// ai components","Tools",`${S.tools.length} · ${priceMo(S.price)}`)+
      `<div style="display:flex;gap:10px;flex-wrap:wrap">${toolsSorted.map(t=>`<span style="display:inline-flex;align-items:center;gap:8px;border:1px solid var(--stroke);padding:7px 12px">${toolIcn(t,22,"border:0;background:transparent;padding:0")}<b class="small">${esc(t.name)}</b><b class="mono small lime">${t.bundle?"bdl":t.amount>0?price(t.amount):"free"}</b></span>`).join("")}</div>`+
      drawer("tiers, categories, models, bundle",toolsBodyV16()))+
    band(0,v16head("04","// writeup","Guide",guideMin+" min read")+guideBodyV16())+
    ctaStrip()+MEDIA_G2;
}

/* =========================================================================
   V31 ONE MOMENT EACH - tonal quiet bodies; each section spends its boldness
   on exactly one statement moment.
   ========================================================================= */
function renderV31(){
  const wrap=i=>`<div style="max-width:1220px;margin:0 auto;padding:0 24px">${i}</div>`;
  const band=(i,inner)=>`<section style="background:${bandAt(TINT4,i)};padding:44px 0">${wrap(inner)}</section>`;
  const moment=(giant,cap)=>`<div style="margin:6px 0 22px"><div class="mono lime" style="font-size:clamp(52px,8vw,96px);font-weight:900;line-height:.88;letter-spacing:-.03em">${giant}</div><p class="mono small muted" style="margin-top:8px;letter-spacing:.16em;text-transform:uppercase">${cap}</p></div>`;
  return band(0,heroV16())+
    band(1,v16head("01","// sync","Actual Usage",`30d · checked ${readCheckedAgo}`)+
      moment(fmtT(U.totalTokens),`tokens · ${fmtUSD(U.usd)} at list prices · ${num(U.sessions)} sessions on ${U.activeDays} days`)+
      spark(U.series,1100,52)+
      `<div style="display:grid;grid-template-columns:1fr 1fr;gap:30px;margin-top:22px" class="g2">
        <div>${modelTableRows(false)}<p class="small muted" style="margin-top:8px">${COST_NOTE}</p></div>
        <div>${scanRows(wfCells.slice(0,7))}</div>
      </div>
      ${drawer("8 more measurements",tailGrid(wfCells.slice(7)))}`)+
    band(2,v16head("02","// showcase","Projects","")+
      moment(String(P.length),"projects built with this stack")+projGridV16())+
    band(3,v16head("03","// ai components","Tools","")+
      moment(priceMo(S.price),`${S.tools.length} tools · ${S.models.length} models · ${esc(S.bundles[0].name)}`)+toolsBodyV16())+
    band(1,v16head("04","// writeup","Guide","")+
      moment(guideMin+"<span style='font-size:.38em'> min</span>","the owner's setup, in their words")+guideBodyV16())+
    ctaStrip()+MEDIA_G2;
}
