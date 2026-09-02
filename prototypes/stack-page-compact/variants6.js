/* PROTOTYPE - throwaway (ticket alp82/aistack#351). Round 6: one composed
   design (v37) on a steady spacing scale, with the Stats topics as accordion
   rows and live toggles: title style, band tints, section name, rows mode. */
"use strict";

/* OPTS is set by the template from URL params:
   {title:"rail"|"num", bands:"2"|"4", name:"stats"|"usage", rows:"acc"|"tabs"} */
const optDefaults={title:"rail",bands:"4",name:"stats",rows:"acc",top:"side",exp:"grid"};
const OPT=k=>(window.OPTS&&window.OPTS[k])||optDefaults[k];

/* ---------- steady-rhythm section shell (both title styles) ---------- */
function sec37(i,n,kick,title,meta,body){
  const ladder=OPT("bands")==="4"?TINT4:TINT2;
  const bg=bandAt(ladder,i);
  if(OPT("title")==="num"){
    return `<section style="background:${bg};padding:48px 0"><div style="max-width:1280px;margin:0 auto;padding:0 24px">
      ${v16head(n,kick,title,meta)}${body}</div></section>`;
  }
  return `<section style="background:${bg};padding:48px 0"><div style="max-width:1280px;margin:0 auto;padding:0 24px">
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

/* the topic's lead chart, for the "feature" expanded format */
function leadChart(key){
  switch(key){
    case "time": return `<p class="kick muted" style="margin-bottom:8px">commits, hour × weekday</p>`+heatmap(12);
    case "code": return `<p class="kick muted" style="margin-bottom:8px">commits per day, 30 days</p>`+gitBars(64);
    case "models": return `<p class="kick muted" style="margin-bottom:8px">main-loop routing</p>`+microViz("component:model-routing",false);
    case "harness": return `<p class="kick muted" style="margin-bottom:8px">where tool calls run</p>`+microViz("component:delegation",false);
    case "skills": return `<p class="kick muted" style="margin-bottom:8px">skill calls</p>`+W.skills.slice(0,5).map(s=>barRow(s.name,s.share)).join("");
    default: return "";
  }
}

/* expanded content, three formats behind the exp knob */
function expBody(g){
  const exp=OPT("exp");
  if(exp==="feature")return `
    <div style="display:grid;grid-template-columns:minmax(0,380px) 1fr;gap:34px" class="g2">
      <div>${leadChart(g.key)}</div>
      <div>${scanRows(g.cells)}</div>
    </div>`;
  if(exp==="rows")return g.cells.map(c=>`
    <div style="display:grid;grid-template-columns:76px minmax(180px,250px) 1fr;gap:18px;align-items:center;padding:10px 0;border-top:1px solid var(--stroke)" class="sr3">
      <b class="mono lime" style="font-size:20px;text-align:right">${c.fig}</b>
      <span class="small"><b>${c.name}</b><br><span class="muted">${c.label}</span></span>
      <div style="min-width:0">${microViz(c.id,false)}</div>
    </div>`).join("")+`<style>@media(max-width:760px){.sr3{grid-template-columns:60px 1fr!important}.sr3>div{grid-column:1/3}}</style>`;
  /* grid (default): equalized two-up cells with consistent chart slots */
  return `<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(300px,1fr));gap:22px 34px">
    ${g.cells.map(c=>`<div style="cursor:help" title="${c.name}: ${c.fig} ${c.label}">
      <div style="display:flex;gap:10px;align-items:baseline"><b class="mono lime" style="font-size:22px">${c.fig}</b><span class="small"><b>${c.name}</b></span></div>
      <p class="small muted" style="margin:2px 0 8px">${c.label}</p>${microViz(c.id,false)}</div>`).join("")}</div>`;
}

/* accordion: one meaningful row per topic, history chart as the watermark.
   name= makes it exclusive natively; the template adds a toggle fallback. */
function statsAccordion(){
  return `<div style="border-top:1px solid var(--stroke)">${topicGroups().map(g=>`
    <details name="acc37" style="border-bottom:1px solid var(--stroke)">
      <summary style="list-style:none;cursor:pointer;position:relative;display:block">
        <div style="position:absolute;inset:6px 0;opacity:.14;pointer-events:none" aria-hidden="true">${g.bg}</div>
        <div style="position:relative;display:flex;align-items:center;gap:18px;padding:16px 4px;min-height:58px">
          <span class="mono" style="width:88px;flex:none;font-size:12px;font-weight:700;letter-spacing:.14em;text-transform:uppercase;color:var(--lime)">${g.label}</span>
          <span class="small sec2" style="flex:1;min-width:0">${g.summary}</span>
          <span class="mono muted arr" style="flex:none">▾</span>
        </div>
      </summary>
      <div style="padding:8px 4px 26px 110px" class="accbody">${expBody(g)}</div>
    </details>`).join("")}</div>
  <style>details[open] .arr{transform:rotate(180deg)}@media(max-width:760px){.accbody{padding-left:4px!important}}</style>`;
}

/* ---------- the stats top block, four layouts behind the top knob ---------- */
const statChips=()=>`<div style="display:flex;gap:28px;flex-wrap:wrap" class="mono small muted">
  <span title="sessions in the range" style="cursor:help"><b class="sec2">${num(U.sessions)}</b> sessions</span>
  <span title="days with at least one session" style="cursor:help"><b class="sec2">${U.activeDays}/30</b> days</span>
  <span title="share of input tokens served from cache" style="cursor:help"><b class="sec2">${pct(U.cacheHitShare,1)}</b> cache hits</span>
  <span title="share of tokens spent by subagents" style="cursor:help"><b class="sec2">${pct(U.subagentShare,1)}</b> subagent tokens</span>
  <span title="token share by harness" style="cursor:help"><b class="sec2">claude-code 61% · codex 39%</b></span></div>`;

/* one-line headline strip: number, cost, delta on a single baseline */
function headlineStrip(){
  const max=Math.max(...U.series.map(p=>p.t));
  const pts=U.series.map((p,i)=>`${(i/(U.series.length-1))*400},${64-(p.t/max)*60}`).join(" ");
  return `
  <div style="position:relative;border:1px solid var(--stroke);padding:18px 20px">
    <div style="position:absolute;inset:0;overflow:hidden;opacity:.13;pointer-events:none" aria-hidden="true">
      <svg width="100%" height="100%" viewBox="0 0 400 64" preserveAspectRatio="none"><polygon points="0,64 ${pts} 400,64" fill="var(--lime)"/></svg></div>
    <div style="position:relative;display:flex;gap:30px;flex-wrap:wrap;align-items:baseline">
      <span class="mono" style="font-size:clamp(40px,4.6vw,54px);font-weight:900;line-height:1;cursor:pointer" title="tap for a fun fact"
        onclick="this.nextElementSibling.querySelector('i').textContent=FACTS[(++this.dataset.i)%FACTS.length]" data-i="0">${fmtT(U.totalTokens)}</span>
      <span><span class="kick muted">tokens · last 30 days</span><br><i class="mono small lime" style="font-style:normal">${fmtT(FRESH)} fresh · ${fmtT(CACHED)} cached</i></span>
      <span class="hovh" style="position:relative">
        <span class="mono" style="font-size:24px;font-weight:900;border-bottom:1px dotted var(--stroke-strong);cursor:help">≥${fmtUSD(U.usd)}</span>
        <span class="kick muted" style="display:block;margin-top:2px">at api list prices</span>
        <span class="hovc" style="position:absolute;left:0;top:100%;z-index:30;width:280px;background:var(--bg-shell);border:1px solid var(--stroke-strong);padding:12px;display:none">
          ${modelRows.map((m,i)=>`<span style="display:flex;gap:8px;justify-content:space-between;padding:2px 0"><span style="display:flex;gap:6px;align-items:center"><span style="width:8px;height:8px;background:${CHART[i%6]}"></span>${esc(m.name)}</span><b class="mono">${fmtUSD(m.usd)}</b></span>`).join("")}
          <span class="small muted" style="display:block;margin-top:8px;border-top:1px solid var(--stroke);padding-top:6px">${COST_NOTE}</span></span></span>
      <span class="mono small" style="margin-left:auto"><span class="lime">${UP} ×${(U.totalTokens/U.prevTokens).toFixed(0)}</span> <span class="muted">vs the 30 days before</span></span>
    </div>
  </div>`;
}

function statsTop37(){
  const top=OPT("top");
  if(top==="stack")return headlineStrip()+
    `<div style="margin-top:28px">${modelBreakdown()}</div><div style="margin-top:16px">${statChips()}</div>`;
  if(top==="merged")return `
    <div style="border:1px solid var(--stroke)">
      ${headlineStrip().replace('border:1px solid var(--stroke);','border:0;border-bottom:1px solid var(--stroke);')}
      <div style="padding:18px 20px">${modelBreakdown()}</div>
      <div style="border-top:1px solid var(--stroke);padding:12px 20px">${statChips()}</div>
    </div>`;
  if(top==="hero")return `
    <div>${metricBlock()}</div>
    <div style="margin-top:10px">${statChips()}</div>
    <div style="margin-top:28px">${modelBreakdown()}</div>`;
  /* side (default): matched heights, breakdown owns the right column */
  return `
  <div style="display:grid;grid-template-columns:minmax(0,330px) 1fr;gap:40px;align-items:stretch" class="g2">
    <div style="display:flex;flex-direction:column;justify-content:space-between">${metricBlock()}</div>
    <div style="display:flex;flex-direction:column;justify-content:space-between">
      <div>${modelBreakdown()}</div>
      <div style="margin-top:16px">${statChips()}</div>
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
  const hero=`<section style="background:${(OPT("bands")==="4"?TINT4:TINT2)[0]};padding:48px 0 40px"><div style="max-width:1280px;margin:0 auto;padding:0 24px">${heroV16()}</div></section>`;
  return hero+
    sec37(1,"01","// sync",name,`30d · all machines<br>checked ${readCheckedAgo}`,statsTop37()+rows)+
    sec37(2,"02","// showcase","Projects",P.length+" projects",projGridV16())+
    sec37(3,"03","// ai components","Tools",`${S.tools.length} tools · ${priceMo(S.price)}`,toolsBodyV16())+
    sec37(0,"04","// writeup","Guide",guideMin+" min read",guideBodyV16())+
    ctaStrip()+MEDIA_G2;
}
