/* PROTOTYPE - throwaway (ticket alp82/aistack#351). Round 6: one composed
   design (v37) on a steady spacing scale, with the Stats topics as accordion
   rows and live toggles: title style, band tints, section name, rows mode. */
"use strict";

/* OPTS is set by the template from URL params:
   {title:"rail"|"num", bands:"2"|"4", name:"stats"|"usage", rows:"acc"|"tabs"} */
const optDefaults={title:"rail",bands:"2",name:"stats",rows:"acc"};
const OPT=k=>(window.OPTS&&window.OPTS[k])||optDefaults[k];

/* ---------- steady-rhythm section shell (both title styles) ---------- */
function sec37(i,n,kick,title,meta,body){
  const ladder=OPT("bands")==="4"?TINT4:TINT2;
  const bg=bandAt(ladder,i);
  if(OPT("title")==="num"){
    return `<section style="background:${bg};padding:48px 0"><div style="max-width:1180px;margin:0 auto;padding:0 24px">
      ${v16head(n,kick,title,meta)}${body}</div></section>`;
  }
  return `<section style="background:${bg};padding:48px 0"><div style="max-width:1180px;margin:0 auto;padding:0 24px">
    <div style="display:grid;grid-template-columns:170px 1fr;gap:40px" class="rl2">
      <div><div class="mono" style="font-size:48px;font-weight:900;color:var(--lime);line-height:1">${n}</div>
        <p class="kick lime" style="margin-top:8px">${kick}</p>
        <h2 style="font-size:21px;font-weight:900;text-transform:uppercase;letter-spacing:-.01em;margin-top:2px">${title}</h2>
        <p class="mono small muted" style="margin-top:12px;line-height:1.7">${meta||""}</p></div>
      <div style="min-width:0">${body}</div>
    </div></div></section>`;
}

/* ---------- the five topic groups: summary row data ---------- */
function topicGroups(){
  const modelStrip=`<div style="display:flex;height:100%">${modelRows.map((m,i)=>`<span style="width:${m.share*100}%;background:${CHART[i%6]}"></span>`).join("")}</div>`;
  const delegStrip=`<div style="display:flex;height:100%"><span style="width:${row("component:delegation").value*100}%;background:var(--lime)"></span><span style="flex:1;background:var(--bg-panel-muted)"></span></div>`;
  const skillStrip=`<div style="display:flex;align-items:flex-end;gap:3px;height:100%">${W.skills.map(s=>`<span style="flex:1;background:var(--lime);height:${Math.max(8,s.share/W.skills[0].share*100)}%"></span>`).join("")}</div>`;
  return [
    {key:"time",label:"Time",cells:cellsOf(["component:activity-heatmap","component:start-hours","metric:late-night-commits","component:phase-playbook","metric:turn-duration"]),
     summary:`<b class="mono lime">${rowVal(row("component:phase-playbook"))}</b> median session · usual start <b class="mono">${rowVal(row("component:start-hours"))}</b> · <b class="mono">${rowVal(row("component:activity-heatmap"))}</b> of events in the 3 busiest hours`,
     bg:startHoursChart(46)},
    {key:"code",label:"Code",cells:cellsOf(["component:git-ledger","component:coding-languages","metric:parallel-projects"]),
     summary:`<b class="mono lime">${num(W.git.commits)}</b> commits · <b class="mono">+${fmtT(W.git.add)} −${fmtT(W.git.rm)}</b> lines · <b class="mono">${rowVal(row("metric:parallel-projects"))}</b> projects in parallel`,
     bg:gitBars(46)},
    {key:"models",label:"Models",cells:cellsOf(["component:model-routing","metric:effort-levels","metric:thinking-share"]),
     summary:`<b class="mono lime">${rowVal(row("component:model-routing"))}</b> of main-loop tokens on one model · <b class="mono">${rowVal(row("metric:effort-levels"))}</b> of turns at high effort`,
     bg:modelStrip},
    {key:"harness",label:"Harness",cells:cellsOf(["component:delegation","metric:question-back-share"]),
     summary:`<b class="mono lime">${rowVal(row("component:delegation"))}</b> of tool calls run in subagents · <b class="mono">${num(U.sessions)}</b> sessions on <b class="mono">${W.lead.harnesses}</b> harnesses`,
     bg:delegStrip},
    {key:"skills",label:"Skills",cells:cellsOf(["component:kit","metric:web-searches-per-active-day"]),
     summary:`<b class="mono lime">${esc(W.skills[0].name)}</b> leads at ${pct(W.skills[0].share)} of skill calls · <b class="mono">${rowVal(row("metric:web-searches-per-active-day"))}</b> web searches per active day`,
     bg:skillStrip},
  ];
}

/* accordion: one meaningful row per topic, history chart as the watermark */
function statsAccordion(){
  return `<div style="border-top:1px solid var(--stroke)">${topicGroups().map(g=>`
    <details style="border-bottom:1px solid var(--stroke)">
      <summary style="list-style:none;cursor:pointer;position:relative;display:block">
        <div style="position:absolute;inset:6px 0;opacity:.14;pointer-events:none">${g.bg}</div>
        <div style="position:relative;display:flex;align-items:center;gap:18px;padding:16px 4px;min-height:58px">
          <span class="mono" style="width:88px;flex:none;font-size:12px;font-weight:700;letter-spacing:.14em;text-transform:uppercase;color:var(--lime)">${g.label}</span>
          <span class="small sec2" style="flex:1;min-width:0">${g.summary}</span>
          <span class="mono muted arr" style="flex:none">▾</span>
        </div>
      </summary>
      <div style="padding:8px 4px 24px 110px" class="accbody">${tailGrid(g.cells)}</div>
    </details>`).join("")}</div>
  <style>details[open] .arr{transform:rotate(180deg)}@media(max-width:760px){.accbody{padding-left:4px!important}}</style>`;
}

/* ---------- the composed stats top: equalized columns ---------- */
function statsTop37(){
  return `
  <div style="display:grid;grid-template-columns:minmax(0,330px) 1fr;gap:40px;align-items:stretch" class="g2">
    <div style="display:flex;flex-direction:column;justify-content:space-between">${metricBlock()}</div>
    <div style="display:flex;flex-direction:column;justify-content:space-between">
      <div>${modelBreakdown()}</div>
      <div style="display:flex;gap:28px;flex-wrap:wrap;margin-top:16px" class="mono small muted">
        <span><b class="sec2">${num(U.sessions)}</b> sessions</span><span><b class="sec2">${U.activeDays}/30</b> days</span>
        <span><b class="sec2">${pct(U.cacheHitShare,1)}</b> cache hits</span><span><b class="sec2">${pct(U.subagentShare,1)}</b> subagent tokens</span>
        <span><b class="sec2">claude-code 61% · codex 39%</b></span></div>
    </div>
  </div>`;
}

/* =========================================================================
   V37 COMPOSED - one design. Steady 48px section rhythm, aligned columns,
   accordion (or tabs) below the top block, four live toggles in the top bar.
   ========================================================================= */
function renderV37(){
  const name=OPT("name")==="usage"?"Actual Usage":"Stats";
  const rows=OPT("rows")==="tabs"?`<div style="margin-top:36px">${cssTabs("t37")}</div>`:`<div style="margin-top:36px">${statsAccordion()}</div>`;
  const hero=`<section style="background:${(OPT("bands")==="4"?TINT4:TINT2)[0]};padding:48px 0 40px"><div style="max-width:1180px;margin:0 auto;padding:0 24px">${heroV16()}</div></section>`;
  return hero+
    sec37(1,"01","// sync",name,`30d · all machines<br>checked ${readCheckedAgo}`,statsTop37()+rows)+
    sec37(2,"02","// showcase","Projects",P.length+" projects",projGridV16())+
    sec37(3,"03","// ai components","Tools",`${S.tools.length} tools · ${priceMo(S.price)}`,toolsBodyV16())+
    sec37(0,"04","// writeup","Guide",guideMin+" min read",guideBodyV16())+
    ctaStrip()+MEDIA_G2;
}
