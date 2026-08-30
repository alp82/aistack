/* PROTOTYPE - throwaway (ticket alp82/aistack#351). Round 3: ten designs on
   the liked directions (V6/V9 look, V7/V10 section ideas, V15 right column),
   now with the deep data in: every measurement carries its own micro chart. */
"use strict";

/* ---------- round-3 shared helpers ---------- */
const EFFORT_TOTAL=Object.values(W.effort).reduce((a,b)=>a+b,0);
const effortShare=k=>(W.effort[k]||0)/EFFORT_TOTAL;
const barRow=(label,share,val,dark)=>`<div style="display:flex;gap:8px;align-items:center;padding:2px 0" class="small">
  <span style="width:96px;flex:none;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${label}</span>
  <span class="bar-track" style="height:6px;${dark?"background:oklch(0.9 0.004 256)":""}"><span class="bar-fill" style="width:${Math.max(1,share*100)}%;${dark?"background:oklch(0.55 0.18 132)":""}"></span></span>
  <b class="mono" style="width:40px;text-align:right">${val??pct(share)}</b></div>`;
const dotRow=(n,of,dark)=>{const c=dark?"oklch(0.55 0.18 132)":"var(--lime)";const g=dark?"oklch(0.85 0.004 256)":"var(--bg-panel-muted)";
  return `<div style="display:flex;gap:3px;flex-wrap:wrap">${Array.from({length:of},(_,i)=>`<span style="width:8px;height:8px;background:${i<n?c:g}"></span>`).join("")}</div>`;};
const seg3=(shares,labels,dark)=>`<div style="display:flex;height:10px;gap:2px">${shares.map((s,i)=>`<span title="${labels[i]} ${pct(s)}" style="width:${s*100}%;background:oklch(${dark?0.55-i*0.12:0.78-i*0.16} ${0.18-i*0.05} 132)"></span>`).join("")}</div>
  <div class="small muted" style="display:flex;gap:10px;margin-top:3px">${labels.map((l,i)=>`<span>${l} ${pct(shares[i])}</span>`).join("")}</div>`;
/* one micro visual per measurement id; h ~ 30-60px; dark=on light bg */
function microViz(id,dark){
  switch(id){
    case "component:activity-heatmap": return heatmap(7);
    case "component:start-hours": return startHoursChart(30);
    case "metric:late-night-commits": return barRow("23:00-03:00",row("metric:late-night-commits").value,null,dark)+barRow("daytime",1-row("metric:late-night-commits").value,null,dark);
    case "component:phase-playbook": return phaseStrip(10);
    case "component:git-ledger": return gitBars(30);
    case "component:coding-languages": return W.langs.slice(0,3).map(l=>barRow(l.ext,l.share,null,dark)).join("");
    case "component:kit": return W.skills.slice(0,3).map(s=>barRow(s.name,s.share,null,dark)).join("");
    case "component:model-routing": return modelRows.slice(0,3).map(m=>barRow(m.name,m.share,null,dark)).join("");
    case "component:delegation": return barRow("subagents",row("component:delegation").value,null,dark)+barRow("main loop",1-row("component:delegation").value,null,dark);
    case "metric:effort-levels": return seg3([effortShare("high"),effortShare("medium"),effortShare("low")],["high","med","low"],dark);
    case "metric:thinking-share": return barRow("thinking",row("metric:thinking-share").value,null,dark)+barRow("visible",1-row("metric:thinking-share").value,null,dark);
    case "metric:turn-duration": return `<div class="small muted">median turn, capped gaps</div>`+barRow("≈",Math.min(1,row("metric:turn-duration").value/5),rowVal(row("metric:turn-duration")),dark);
    case "metric:question-back-share": return `<div class="small muted">no turn ends with a question back</div>`;
    case "metric:web-searches-per-active-day": return dotRow(Math.round(row("metric:web-searches-per-active-day").value),10,dark)+`<div class="small muted" style="margin-top:3px">${W.webSearches} total · ${U.activeDays} days</div>`;
    case "metric:parallel-projects": return dotRow(7,12,dark)+`<div class="small muted" style="margin-top:3px">median active day · peak 31</div>`;
    default: return "";
  }
}
const modelTableRows=(dark)=>modelRows.map(m=>`
  <div style="display:flex;align-items:center;gap:10px;padding:6px 0;border-bottom:1px solid ${dark?"oklch(0.65 0.008 256/.6)":"var(--stroke)"}">
    ${modelIcn(m.name,22)}<b style="width:128px;font-size:13px">${esc(m.name)}</b>
    <span class="bar-track" style="height:10px;${dark?"background:oklch(0.9 0.004 256)":""}"><span class="bar-fill" style="width:${m.share*100}%;${dark?"background:oklch(0.55 0.18 132)":""}"></span></span>
    <b class="mono small" style="width:44px;text-align:right">${pct(m.share,1)}</b>
    <span class="mono small muted" style="width:52px;text-align:right">${fmtUSD(m.usd)}</span>
    <span class="mono small muted" style="width:48px;text-align:right">${fmtT(m.tokens)}</span></div>`).join("");
const toolTableRows=(dark)=>toolsSorted.map(t=>`
  <div style="display:flex;align-items:center;gap:10px;padding:5px 0;border-bottom:1px solid ${dark?"oklch(0.65 0.008 256/.6)":"var(--stroke)"}">
    ${toolIcn(t,24)}<b style="width:118px;font-size:13px;flex:none">${esc(t.name)}</b>
    <span class="small muted" style="flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${esc(t.cat)} · ${esc(t.tier)}</span>
    <b class="mono small" style="${dark?"color:oklch(0.55 0.18 132)":"color:var(--lime)"}">${t.bundle?"bundle":t.amount>0?priceMo(t.amount):"free"}</b></div>`).join("");
const projRowsDeep=(dark)=>P.map(p=>`
  <div style="padding:6px 0;border-bottom:1px solid ${dark?"oklch(0.65 0.008 256/.6)":"var(--stroke)"}">
    <div style="display:flex;gap:8px;align-items:baseline"><b>${esc(p.name)}</b><span class="small muted">${p.tags.join(" · ")}</span>${p.url?`<span style="margin-left:auto;${dark?"color:oklch(0.55 0.18 132)":"color:var(--lime)"}">↗</span>`:""}</div>
    ${p.desc?`<p class="small ${dark?"":"sec2"}" style="margin-top:2px;${dark?"color:oklch(0.3 0.006 256)":""}">${esc(p.desc)}</p>`:""}</div>`).join("");
const statStrip=(dark)=>`<div style="display:flex;gap:26px;flex-wrap:wrap" class="mono">
  ${[[num(U.sessions),"sessions"],[U.activeDays+"/30","active days"],[pct(U.cacheHitShare,1),"cache hits"],[pct(U.subagentShare,1),"subagent tokens"],[num(W.git.commits),"commits"]]
    .map(([v,k])=>`<div><div style="font-weight:900;font-size:20px">${v}</div><div class="small muted" style="font-size:10px;letter-spacing:.1em;text-transform:uppercase">${k}</div></div>`).join("")}</div>`;
const NUM7=(n,color)=>`<span class="mono" style="font-size:clamp(44px,6vw,72px);font-weight:900;line-height:.9;color:${color||"var(--stroke-strong)"}">${n}</span>`;

/* =========================================================================
   V16 MAGAZINE DEEP - V6 grown up: the real page's numbered headers return,
   every measurement is a small editorial feature with its own micro chart.
   ========================================================================= */
function renderV16(){
  const wrap=i=>`<div style="max-width:1220px;margin:0 auto;padding:0 24px">${i}</div>`;
  const band=(light,inner)=>`<section style="background:${light?"oklch(0.95 0.005 256)":"var(--bg-canvas)"};color:${light?"oklch(0.15 0.008 256)":"var(--fg-primary)"};padding:44px 0">${wrap(inner)}</section>`;
  const head=(n,kick,title,meta,light)=>`
    <div style="display:flex;align-items:flex-end;gap:16px;border-bottom:1px solid ${light?"oklch(0.65 0.008 256)":"var(--stroke)"};padding-bottom:12px;margin-bottom:24px">
      ${NUM7(n,light?"oklch(0.8 0.01 256)":"var(--stroke-strong)")}
      <div style="flex:1"><p class="kick" style="color:${light?"oklch(0.55 0.18 132)":"var(--lime)"}">${kick}</p>
      <h2 style="font-size:clamp(24px,3.4vw,34px);font-weight:900;text-transform:uppercase;letter-spacing:-.01em">${title}</h2></div>
      <span class="mono small" style="color:${light?"oklch(0.45 0.005 256)":"var(--fg-muted)"}">${meta||""}</span></div>`;
  const hero=band(false,`
    <div style="display:flex;flex-wrap:wrap;gap:26px;align-items:flex-end">
      <div style="flex:1;min-width:300px">
        <h1 style="font-size:clamp(44px,7vw,84px);font-weight:900;line-height:.88;letter-spacing:-.03em;text-transform:uppercase">${esc(S.name)}</h1>
        <p style="margin-top:12px;font-size:17px;color:var(--fg-secondary);max-width:520px">${esc(S.oneLiner)}</p>
        <p class="small muted" style="margin-top:8px">${esc(S.creator.name)} @${esc(S.creator.handle)} · ${UP} 12 · Share · Report</p>
      </div>
      <div style="text-align:right"><div class="mono" style="font-size:clamp(40px,5vw,60px);font-weight:900">${price(S.price)}<span style="font-size:17px;color:var(--fg-muted)">/mo</span></div>
      <div style="display:flex;gap:6px;margin-top:12px;justify-content:flex-end">${toolsSorted.slice(0,6).map(t=>toolIcn(t,30)).join("")}<span class="chip">+${S.tools.length-6}</span></div></div>
    </div>`);
  const usage=band(false,head("01","// sync","Actual Usage",`30d · checked ${readCheckedAgo}`)+`
    <div style="display:grid;grid-template-columns:minmax(0,420px) 1fr;gap:36px" class="g2">
      <div>
        <div class="mono lime" style="font-size:clamp(56px,7vw,84px);font-weight:900;line-height:.9">${fmtT(U.totalTokens)}</div>
        <p class="small muted" style="margin-top:4px">tokens · 30 days · <b class="sec2">${fmtUSD(U.usd)}</b> at list prices</p>
        ${spark(U.series,420,64)}
        <div style="margin-top:18px">${statStrip(false)}</div>
      </div>
      <div>${modelTableRows(false)}
        <p class="small muted" style="margin-top:8px">${COST_NOTE}</p></div>
    </div>
    <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:26px 30px;margin-top:36px">
      ${wfCells.map(c=>`<div style="border-top:2px solid var(--lime);padding-top:8px">
        <div style="display:flex;align-items:baseline;gap:10px"><b class="mono" style="font-size:26px">${c.fig}</b><span class="small sec2"><b>${c.name}</b></span></div>
        <p class="small muted" style="margin:2px 0 8px">${c.label}</p>${microViz(c.id,false)}</div>`).join("")}
    </div>`);
  const projects=band(true,head("02","// showcase","Projects",P.length+" projects",true)+
    `<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(320px,1fr));gap:16px">
     ${P.map(p=>`<div style="background:#fff;border:1px solid oklch(0.65 0.008 256);padding:16px">
       <div style="display:flex;gap:8px;align-items:baseline"><b style="font-size:16px">${esc(p.name)}</b>${p.url?`<span style="margin-left:auto;color:oklch(0.55 0.18 132)">↗</span>`:""}</div>
       <p style="font-size:13px;margin-top:6px;color:oklch(0.3 0.006 256)">${esc(p.desc||"")}</p>
       <p class="mono" style="font-size:10px;text-transform:uppercase;margin-top:10px;color:oklch(0.45 0.005 256)">${p.tags.join(" · ")}</p></div>`).join("")}
    </div>`);
  const tools=band(false,head("03","// ai components","Tools",`${S.tools.length} · ${priceMo(S.price)}`)+`
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px 40px" class="g2">${toolTableRows(false)}</div>
    <div style="display:flex;gap:20px;flex-wrap:wrap;margin-top:16px" class="small muted">
      <span><b class="sec2">Models (${S.models.length})</b> ${S.models.map(m=>esc(m.name)).join(", ")}</span>
      <span><b class="sec2">${esc(S.bundles[0].name)}</b> ${esc(S.bundles[0].tier)} · ${priceMo(S.bundles[0].amount)}</span></div>`);
  const guide=band(true,head("04","// writeup","Guide",guideMin+" min read",true)+`
    <div style="display:grid;grid-template-columns:2fr 1fr;gap:32px" class="g2">
      <p style="font-size:17px;line-height:1.65">${esc(S.guide.firstp)} <b style="color:oklch(0.55 0.18 132)">read on →</b></p>
      <div style="border-left:2px solid oklch(0.55 0.18 132);padding-left:16px">${S.guide.heads.map(h=>`<p class="mono" style="font-size:13px;padding:4px 0">${esc(h)}</p>`).join("")}</div>
    </div>`);
  const cta=`<section style="background:var(--lime);padding:24px;text-align:center"><b class="mono" style="color:var(--lime-contrast);text-transform:uppercase;letter-spacing:.14em;font-size:14px">Share your own stack →</b></section>`;
  return hero+usage+projects+tools+guide+cta+`<style>@media(max-width:820px){.g2{grid-template-columns:1fr!important}}</style>`;
}

/* =========================================================================
   V17 BILLBOARD DATA - V9's full-bleed statement bands, each followed by its
   deep data panel in a contrast box.
   ========================================================================= */
function renderV17(){
  const band=(bg,fg,pad,inner)=>`<section style="background:${bg};color:${fg};padding:${pad}px 24px">${inner}</section>`;
  const center=i=>`<div style="max-width:1080px;margin:0 auto">${i}</div>`;
  const giant=(t,sub)=>`<div class="mono" style="font-size:clamp(56px,11vw,140px);font-weight:900;line-height:.85;letter-spacing:-.04em;text-align:center">${t}</div><p class="mono" style="margin-top:12px;text-align:center;font-size:clamp(11px,1.6vw,15px);letter-spacing:.22em;text-transform:uppercase;opacity:.75">${sub}</p>`;
  const panel=(bg,fg,inner)=>`<div style="background:${bg};color:${fg};padding:22px;margin-top:30px;text-align:left">${inner}</div>`;
  return band("var(--bg-canvas)","var(--fg-primary)",52,center(`
      <p class="kick lime" style="text-align:center">aistack · stack</p>
      <h1 style="font-size:clamp(40px,7.6vw,92px);font-weight:900;line-height:.9;text-transform:uppercase;letter-spacing:-.03em;text-align:center;margin-top:8px">${esc(S.name)}</h1>
      <p class="sec2" style="text-align:center;margin-top:12px;font-size:17px">${esc(S.oneLiner)}</p>
      <p class="small muted" style="text-align:center;margin-top:6px">${esc(S.creator.name)} @${esc(S.creator.handle)} · ${UP} 12</p>`))+
    band("var(--lime)","var(--lime-contrast)",52,center(
      giant(fmtT(U.totalTokens),`tokens in 30 days · ${fmtUSD(U.usd)} at list prices`)+
      `<div style="mix-blend-mode:multiply;max-width:840px;margin:20px auto 0">${spark(U.series,840,64).replace('var(--lime)','var(--lime-contrast)')}</div>`+
      panel("oklch(0.22 0.02 132)","oklch(0.96 0.01 132)",`
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px 36px" class="g2">
          <div>${modelRows.map(m=>`<div style="display:flex;align-items:center;gap:10px;padding:5px 0;border-bottom:1px solid oklch(0.35 0.03 132)">
            ${modelIcn(m.name,20)}<b style="width:120px;font-size:13px">${esc(m.name)}</b>
            <span class="bar-track" style="height:8px;background:oklch(0.3 0.02 132)"><span class="bar-fill" style="width:${m.share*100}%"></span></span>
            <b class="mono small" style="width:44px;text-align:right">${pct(m.share,1)}</b><span class="mono small" style="width:56px;text-align:right;opacity:.7">${fmtUSD(m.usd)}</span></div>`).join("")}</div>
          <div style="display:flex;flex-direction:column;justify-content:space-between;gap:14px">${statStrip(false)}
            <div>${phaseStrip(14)}</div></div>
        </div>
        <p class="mono" style="font-size:10px;margin-top:12px;opacity:.6">${COST_NOTE}</p>`)))+
    band("var(--bg-canvas)","var(--fg-primary)",52,center(
      giant(`<span class="lime">${wfCells[0].fig}</span>`,"of events fall in the three busiest hours")+
      panel("var(--bg-shell)","var(--fg-primary)",`
        <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(270px,1fr));gap:22px 30px">
          ${wfCells.map(c=>`<div><div style="display:flex;gap:8px;align-items:baseline"><b class="mono lime" style="font-size:22px">${c.fig}</b><span class="small"><b>${c.name}</b></span></div>
            <p class="small muted" style="margin:2px 0 6px">${c.label}</p>${microViz(c.id,false)}</div>`).join("")}
        </div>`)))+
    band("oklch(0.95 0.005 256)","oklch(0.15 0.008 256)",52,center(
      giant(`<span style="color:oklch(0.55 0.18 132)">${price(S.price)}</span><span style="font-size:.32em">/mo</span>`,`${S.tools.length} tools · ${S.models.length} models · ${P.length} projects`)+
      panel("#fff","oklch(0.15 0.008 256)",`
        <div style="display:grid;grid-template-columns:1.2fr 1fr;gap:10px 36px" class="g2">
          <div>${toolTableRows(true)}</div>
          <div>${projRowsDeep(true)}
            <p class="small" style="margin-top:10px;color:oklch(0.45 0.005 256)">Models: ${S.models.map(m=>esc(m.name)).join(", ")}</p></div>
        </div>`)))+
    band("var(--bg-shell)","var(--fg-primary)",44,center(`
      <p style="max-width:680px;margin:0 auto;font-size:19px;line-height:1.6;color:var(--fg-secondary);text-align:center">“${esc(S.guide.firstp.slice(0,200))}…”</p>
      <p class="mono lime" style="margin-top:12px;text-align:center;font-size:13px">${S.guide.heads.map(esc).join(" · ")} · ${guideMin} min →</p>`))+
    `<section style="background:var(--lime);padding:20px;text-align:center"><b class="mono" style="color:var(--lime-contrast);text-transform:uppercase;letter-spacing:.14em">Share your own stack →</b></section>
    <style>@media(max-width:820px){.g2{grid-template-columns:1fr!important}}</style>`;
}

/* =========================================================================
   V18 WINDOWS - editorial hero, then every section is a terminal window
   panel (V7's treatment as a component, not the whole page).
   ========================================================================= */
function renderV18(){
  const win=(title,inner)=>`
    <div style="border:1px solid var(--stroke);background:var(--bg-shell);margin-top:22px">
      <div style="display:flex;gap:6px;align-items:center;padding:7px 12px;border-bottom:1px solid var(--stroke)">
        <span style="width:9px;height:9px;background:var(--stroke-strong)"></span><span style="width:9px;height:9px;background:var(--stroke-strong)"></span><span style="width:9px;height:9px;background:var(--lime)"></span>
        <span class="mono small muted" style="margin-left:8px">${title}</span></div>
      <div style="padding:16px 18px">${inner}</div></div>`;
  return `<div style="max-width:1120px;margin:0 auto;padding:40px 22px 50px">
    <div style="display:flex;flex-wrap:wrap;gap:22px;align-items:flex-end">
      <div style="flex:1;min-width:280px">
        <h1 style="font-size:clamp(38px,6vw,68px);font-weight:900;line-height:.9;text-transform:uppercase;letter-spacing:-.02em">${esc(S.name)}</h1>
        <p class="sec2" style="margin-top:10px;max-width:520px">${esc(S.oneLiner)}</p>
        <p class="small muted" style="margin-top:6px">${esc(S.creator.name)} @${esc(S.creator.handle)} · ${UP} 12</p></div>
      <div class="mono" style="font-size:clamp(34px,4.4vw,52px);font-weight:900">${price(S.price)}<span style="font-size:15px;color:var(--fg-muted)">/mo</span></div>
    </div>
    ${win("aistack usage --30d",`
      <div style="display:flex;gap:22px;align-items:baseline;flex-wrap:wrap">
        <span class="mono lime" style="font-size:46px;font-weight:900">${fmtT(U.totalTokens)}</span>
        <span class="mono small">tokens · <b>${fmtUSD(U.usd)}</b> · ${num(U.sessions)} sessions · ${U.activeDays}/30 days · ${pct(U.cacheHitShare,1)} cache</span></div>
      ${spark(U.series,1000,48)}
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px 36px;margin-top:12px" class="g2">
        <div>${modelTableRows(false)}</div>
        <div><p class="mono small muted" style="margin-bottom:6px"># measured time by phase</p>${phaseStrip(14)}
          <p class="mono small muted" style="margin:12px 0 6px"># commits, hour × weekday</p>${heatmap(9)}</div></div>
      <p class="mono small muted" style="margin-top:10px"># ${COST_NOTE}</p>`)}
    ${win("aistack workflow --30d",`
      <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(300px,1fr));gap:16px 30px">
      ${wfCells.map(c=>`<div style="display:flex;gap:12px"><b class="mono lime" style="width:64px;text-align:right;flex:none;font-size:18px">${c.fig}</b>
        <div style="flex:1;min-width:0"><p class="small"><b>${c.name}</b> <span class="muted">· ${c.label}</span></p><div style="margin-top:5px">${microViz(c.id,false)}</div></div></div>`).join("")}
      </div>`)}
    ${win("aistack projects",projRowsDeep(false))}
    ${win("aistack tools",`<div style="display:grid;grid-template-columns:1fr 1fr;gap:4px 36px" class="g2">${toolTableRows(false)}</div>
      <div class="mono" style="display:flex;justify-content:flex-end;gap:14px;margin-top:10px;border-top:1px solid var(--stroke);padding-top:8px"><span class="small muted">TOTAL</span><b class="lime">${priceMo(S.price)}</b></div>`)}
    ${win("cat GUIDE.md",`<p style="line-height:1.65;color:var(--fg-secondary);max-width:720px">${esc(S.guide.firstp)}</p>
      <p class="mono small lime" style="margin-top:8px">${S.guide.heads.map(esc).join(" · ")} · ${guideMin} min →</p>`)}
    <p style="text-align:center;margin-top:26px"><span class="mono" style="background:var(--lime);color:var(--lime-contrast);padding:9px 20px;font-weight:700;letter-spacing:.12em;text-transform:uppercase;font-size:12px">Share your own stack →</span></p>
    <style>@media(max-width:820px){.g2{grid-template-columns:1fr!important}}</style></div>`;
}

/* =========================================================================
   V19 BLUEPRINT EDITORIAL - V10's annotated modules with V16's typography
   and the deep instrument panel.
   ========================================================================= */
function renderV19(){
  const paper="background-image:linear-gradient(oklch(0.78 0.17 132/.05) 1px,transparent 1px),linear-gradient(90deg,oklch(0.78 0.17 132/.05) 1px,transparent 1px);background-size:26px 26px";
  const mod=(n,label,inner)=>`<div style="position:relative;border:1px solid oklch(0.78 0.17 132/.5);padding:26px 22px 20px;margin-top:34px">
    <span class="mono" style="position:absolute;top:-10px;left:14px;background:var(--bg-canvas);padding:0 10px;font-size:11px;letter-spacing:.2em;text-transform:uppercase;color:var(--lime)">${n} · ${label}</span>
    <span style="position:absolute;width:8px;height:8px;border-left:2px solid var(--lime);border-top:2px solid var(--lime);left:-1px;top:-1px"></span>
    <span style="position:absolute;width:8px;height:8px;border-right:2px solid var(--lime);border-bottom:2px solid var(--lime);right:-1px;bottom:-1px"></span>${inner}</div>`;
  return `<div style="${paper};padding:36px 20px 50px"><div style="max-width:1120px;margin:0 auto">
    <div style="display:flex;flex-wrap:wrap;gap:20px;align-items:flex-end;justify-content:space-between">
      <div><p class="kick lime">assembly № as-351</p>
        <h1 style="font-size:clamp(38px,6vw,64px);font-weight:900;line-height:.9;text-transform:uppercase;letter-spacing:-.02em;margin-top:6px">${esc(S.name)}</h1>
        <p class="sec2" style="margin-top:10px;max-width:520px">${esc(S.oneLiner)}</p>
        <p class="small muted" style="margin-top:6px">drawn by ${esc(S.creator.name)} @${esc(S.creator.handle)} · rev ${UP}12</p></div>
      <div class="mono" style="text-align:right"><div style="font-size:clamp(36px,4.6vw,54px);font-weight:900" class="lime">${priceMo(S.price)}</div><p class="small muted">fixed · ${S.tools.length} components</p></div>
    </div>
    ${mod("01","meter · usage 30d",`
      <div style="display:grid;grid-template-columns:minmax(0,400px) 1fr;gap:30px" class="g2">
        <div><div class="mono lime" style="font-size:clamp(50px,6.4vw,76px);font-weight:900;line-height:.9">${fmtT(U.totalTokens)}</div>
          <p class="small muted" style="margin-top:4px">tokens · <b class="sec2">${fmtUSD(U.usd)}</b> at list prices</p>
          ${spark(U.series,400,56)}<div style="margin-top:14px">${statStrip(false)}</div></div>
        <div>${modelTableRows(false)}<p class="small muted" style="margin-top:8px">note: ${COST_NOTE}</p></div>
      </div>`)}
    ${mod("02","instrumentation · 15 gauges",`
      <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:20px 28px">
      ${wfCells.map(c=>`<div style="border-left:2px solid oklch(0.78 0.17 132/.5);padding-left:12px">
        <div style="display:flex;gap:8px;align-items:baseline"><b class="mono lime" style="font-size:22px">${c.fig}</b><span class="small"><b>${c.name}</b></span></div>
        <p class="small muted" style="margin:2px 0 6px">${c.label}</p>${microViz(c.id,false)}</div>`).join("")}</div>`)}
    ${mod("03","payload · projects",`<div style="display:grid;grid-template-columns:1fr 1fr;gap:4px 34px" class="g2">${projRowsDeep(false)}</div>`)}
    ${mod("04","bill of materials",`<div style="display:grid;grid-template-columns:1fr 1fr;gap:4px 34px" class="g2">${toolTableRows(false)}</div>
      <div class="mono" style="display:flex;justify-content:flex-end;gap:14px;margin-top:10px;border-top:1px solid oklch(0.78 0.17 132/.4);padding-top:8px"><span class="small muted">total</span><b class="lime">${priceMo(S.price)}</b></div>`)}
    ${mod("05","operating manual",`<p style="max-width:680px;line-height:1.65;color:var(--fg-secondary)">${esc(S.guide.firstp)}</p>
      <p class="mono small lime" style="margin-top:8px">${S.guide.heads.map(esc).join(" / ")} · ${guideMin} min →</p>`)}
    <p style="text-align:center;margin-top:30px"><span class="mono" style="background:var(--lime);color:var(--lime-contrast);padding:9px 20px;font-weight:700;letter-spacing:.14em;font-size:12px">SHARE YOUR OWN STACK →</span></p>
    <style>@media(max-width:820px){.g2{grid-template-columns:1fr!important}}</style></div></div>`;
}

/* =========================================================================
   V20 DOSSIER - an annual-report layout: cover, contents, chapters with
   pull-stat sidebars. Mostly paper background.
   ========================================================================= */
function renderV20(){
  const paper=`background:oklch(0.96 0.004 256);color:oklch(0.16 0.008 256)`;
  const L="oklch(0.55 0.18 132)";
  const chap=(n,title,side,body)=>`
    <div style="display:grid;grid-template-columns:200px 1fr;gap:30px;padding:30px 0;border-top:1px solid oklch(0.7 0.008 256)" class="g2">
      <div><div class="mono" style="font-size:44px;font-weight:900;color:${L}">${n}</div>
        <p class="mono" style="font-size:12px;letter-spacing:.16em;text-transform:uppercase;font-weight:700;margin-top:4px">${title}</p>
        <div style="margin-top:14px">${side||""}</div></div>
      <div style="min-width:0">${body}</div></div>`;
  const pull=(v,k)=>`<div style="margin-top:10px"><div class="mono" style="font-size:22px;font-weight:900">${v}</div><p style="font-size:10px;font-family:var(--mono);text-transform:uppercase;letter-spacing:.1em;color:oklch(0.45 0.005 256)">${k}</p></div>`;
  return `<div style="${paper};padding:0 0 40px">
    <div style="max-width:960px;margin:0 auto;padding:0 24px">
      <div style="padding:56px 0 34px;border-bottom:4px solid ${L}">
        <p class="mono" style="font-size:12px;letter-spacing:.2em;text-transform:uppercase;color:${L}">aistack · 30-day report · 2026-08-30</p>
        <h1 style="font-size:clamp(40px,6.6vw,74px);font-weight:900;line-height:.9;text-transform:uppercase;letter-spacing:-.02em;margin-top:12px">${esc(S.name)}</h1>
        <p style="margin-top:12px;font-size:17px;max-width:560px;color:oklch(0.3 0.006 256)">${esc(S.oneLiner)}</p>
        <div style="display:flex;gap:28px;flex-wrap:wrap;margin-top:18px" class="mono">
          ${[[fmtT(U.totalTokens),"tokens"],[fmtUSD(U.usd),"spend ≥ list"],[priceMo(S.price),"fixed cost"],[num(U.sessions),"sessions"],[P.length,"projects"]].map(([v,k])=>`<div><div style="font-weight:900;font-size:24px">${v}</div><div style="font-size:10px;letter-spacing:.14em;text-transform:uppercase;color:oklch(0.45 0.005 256)">${k}</div></div>`).join("")}
        </div>
        <p class="mono" style="font-size:11px;margin-top:10px;color:oklch(0.45 0.005 256)">${esc(S.creator.name)} @${esc(S.creator.handle)} · ${UP} 12 upvotes</p>
      </div>
      ${chap("01","Usage",pull(U.activeDays+"/30","active days")+pull(pct(U.cacheHitShare,1),"cache hits")+pull(pct(U.subagentShare,1),"subagent tokens"),`
        <div style="mix-blend-mode:multiply">${spark(U.series,700,60).replace('var(--lime)',L)}</div>
        <div style="margin-top:14px">${modelTableRows(true)}</div>
        <p style="font-size:11px;font-family:var(--mono);margin-top:8px;color:oklch(0.45 0.005 256)">${COST_NOTE}</p>`)}
      ${chap("02","How the work runs",pull(rowVal(row("component:phase-playbook")),"median session")+pull(rowVal(row("component:delegation")),"in subagents")+pull(rowVal(row("metric:effort-levels")),"high effort"),`
        <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(260px,1fr));gap:18px 26px">
        ${wfCells.map(c=>`<div style="border-top:2px solid ${L};padding-top:6px">
          <div style="display:flex;gap:8px;align-items:baseline"><b class="mono" style="font-size:20px">${c.fig}</b><span style="font-size:12px"><b>${c.name}</b></span></div>
          <p style="font-size:11px;color:oklch(0.45 0.005 256);margin:2px 0 6px">${c.label}</p>${microViz(c.id,true)}</div>`).join("")}</div>`)}
      ${chap("03","Built with it",pull(P.length,"projects"),projRowsDeep(true))}
      ${chap("04","The stack",pull(priceMo(S.price),"per month")+pull(S.models.length,"models"),`
        ${toolTableRows(true)}
        <p style="font-size:12px;margin-top:10px;color:oklch(0.3 0.006 256)"><b>Models</b> ${S.models.map(m=>esc(m.name)).join(", ")} · <b>${esc(S.bundles[0].name)}</b> ${priceMo(S.bundles[0].amount)}</p>`)}
      ${chap("05","Guide",pull(guideMin+" min","read"),`
        <p style="font-size:16px;line-height:1.65">${esc(S.guide.firstp)}</p>
        <p class="mono" style="font-size:12px;margin-top:10px;color:${L}">${S.guide.heads.map(esc).join(" · ")} →</p>`)}
      <div style="border-top:4px solid ${L};padding-top:18px;text-align:center">
        <span class="mono" style="background:${L};color:#fff;padding:9px 20px;font-weight:700;letter-spacing:.14em;font-size:12px;text-transform:uppercase">Share your own stack →</span></div>
    </div><style>@media(max-width:760px){.g2{grid-template-columns:1fr!important}}</style></div>`;
}

/* =========================================================================
   V21 CHAPTERS - V15 per section: each section is a two-column spread with
   a sticky giant title half and a deep content half, sides alternating.
   ========================================================================= */
function renderV21(){
  const spread=(n,title,fig,cap,flip,body,limeBg)=>`
    <section style="display:grid;grid-template-columns:${flip?"1fr minmax(300px,42%)":"minmax(300px,42%) 1fr"};border-top:1px solid var(--stroke)" class="sp2">
      <div style="grid-column:${flip?2:1};grid-row:1;position:sticky;top:46px;align-self:start;padding:34px 28px;${limeBg?"background:var(--lime);color:var(--lime-contrast)":""}">
        <p class="mono" style="font-size:12px;letter-spacing:.2em;text-transform:uppercase;${limeBg?"":"color:var(--lime)"}">${n} · ${title}</p>
        <div class="mono" style="font-size:clamp(44px,5.6vw,76px);font-weight:900;line-height:.9;margin-top:10px">${fig}</div>
        <p class="small" style="margin-top:8px;${limeBg?"opacity:.75":"color:var(--fg-muted)"}">${cap}</p></div>
      <div style="grid-column:${flip?1:2};grid-row:1;padding:34px 28px;min-width:0">${body}</div>
    </section>`;
  return `<div style="max-width:1280px;margin:0 auto">
    <div style="padding:44px 28px 34px;text-align:center">
      <h1 style="font-size:clamp(40px,7vw,84px);font-weight:900;line-height:.9;text-transform:uppercase;letter-spacing:-.03em">${esc(S.name)}</h1>
      <p class="sec2" style="margin-top:12px;font-size:17px">${esc(S.oneLiner)}</p>
      <p class="small muted" style="margin-top:6px">${esc(S.creator.name)} @${esc(S.creator.handle)} · ${priceMo(S.price)} · ${UP} 12</p>
    </div>
    ${spread("01","actual usage",fmtT(U.totalTokens),`tokens · 30 days · ${fmtUSD(U.usd)} at list prices`,false,`
      ${spark(U.series,640,52)}
      <div style="margin:14px 0">${statStrip(false)}</div>
      ${modelTableRows(false)}
      <p class="small muted" style="margin-top:8px">${COST_NOTE}</p>`,true)}
    ${spread("02","the workflow",rowVal(row("component:phase-playbook")),"median measured session",true,`
      <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(260px,1fr));gap:16px 26px">
      ${wfCells.map(c=>`<div><div style="display:flex;gap:8px;align-items:baseline"><b class="mono lime" style="font-size:20px">${c.fig}</b><span class="small"><b>${c.name}</b></span></div>
        <p class="small muted" style="margin:2px 0 6px">${c.label}</p>${microViz(c.id,false)}</div>`).join("")}</div>`)}
    ${spread("03","projects",String(P.length),"built with this stack",false,projRowsDeep(false))}
    ${spread("04","tools",priceMo(S.price),`${S.tools.length} tools · ${S.models.length} models · 1 bundle`,true,`
      ${toolTableRows(false)}
      <p class="small muted" style="margin-top:10px">Models: ${S.models.map(m=>esc(m.name)).join(", ")} · ${esc(S.bundles[0].name)} ${priceMo(S.bundles[0].amount)}</p>`)}
    ${spread("05","guide",guideMin+" min","setup and habits, in the owner's words",false,`
      <p style="font-size:16px;line-height:1.65;color:var(--fg-secondary)">${esc(S.guide.firstp)}</p>
      <p class="small lime" style="margin-top:8px">${S.guide.heads.map(esc).join(" · ")} →</p>`)}
    <section style="background:var(--lime);padding:22px;text-align:center"><b class="mono" style="color:var(--lime-contrast);text-transform:uppercase;letter-spacing:.14em">Share your own stack →</b></section>
    <style>@media(max-width:820px){.sp2{grid-template-columns:1fr!important}.sp2>div{grid-column:1!important;position:static!important}.sp2>div:first-child{grid-row:1}.sp2>div:last-child{grid-row:2}}</style>
  </div>`;
}

/* =========================================================================
   V22 MURAL - one continuous infographic: a flowing story with connector
   lines, annotated figures, and every chart inline.
   ========================================================================= */
function renderV22(){
  const conn=`<div style="display:flex;justify-content:center"><span style="width:2px;height:34px;background:var(--lime);opacity:.55"></span></div>`;
  const note=(t)=>`<p class="mono" style="font-size:11px;letter-spacing:.16em;text-transform:uppercase;color:var(--lime);text-align:center">${t}</p>`;
  const box=(inner,w)=>`<div style="max-width:${w||760}px;margin:10px auto 0;border:1px solid var(--stroke);padding:18px">${inner}</div>`;
  return `<div style="padding:40px 20px 50px">
    <div style="text-align:center">
      <h1 style="font-size:clamp(38px,6.6vw,76px);font-weight:900;line-height:.9;text-transform:uppercase;letter-spacing:-.03em">${esc(S.name)}</h1>
      <p class="sec2" style="margin-top:10px">${esc(S.oneLiner)}</p>
      <p class="small muted" style="margin-top:6px">${esc(S.creator.name)} @${esc(S.creator.handle)} · ${priceMo(S.price)} · ${UP} 12</p>
    </div>
    ${conn}${note("30 days of work became")}
    <div class="mono lime" style="font-size:clamp(60px,10vw,120px);font-weight:900;text-align:center;line-height:.9">${fmtT(U.totalTokens)}</div>
    <p class="mono small muted" style="text-align:center;margin-top:6px">tokens · ${fmtUSD(U.usd)} at list prices · ${num(U.sessions)} sessions</p>
    ${box(spark(U.series,720,54),760)}
    ${conn}${note("routed through five models")}
    ${box(modelTableRows(false)+`<p class="small muted" style="margin-top:6px">${COST_NOTE}</p>`,760)}
    ${conn}${note("on a daily rhythm")}
    ${box(`<div style="display:grid;grid-template-columns:1fr 1fr;gap:20px" class="g2">
      <div><p class="small muted" style="margin-bottom:6px">commits, hour × weekday</p>${heatmap(9)}</div>
      <div><p class="small muted" style="margin-bottom:6px">session starts by hour</p>${startHoursChart(52)}
        <p class="small muted" style="margin-top:6px">${rowVal(row("component:start-hours"))} usual start · ${rowVal(row("metric:late-night-commits"))} of commits late night</p></div>
    </div>`,760)}
    ${conn}${note("in sessions that look like this")}
    ${box(phaseStrip(16)+`
      <div style="display:flex;gap:26px;flex-wrap:wrap;margin-top:12px" class="mono">
      ${[[rowVal(row("component:phase-playbook")),"median session"],[rowVal(row("metric:turn-duration")),"median turn"],[rowVal(row("component:delegation")),"in subagents"],[rowVal(row("metric:effort-levels")),"high effort"],[rowVal(row("metric:thinking-share")),"thinking tokens"]].map(([v,k])=>`<div><div class="lime" style="font-weight:900;font-size:20px">${v}</div><div class="small muted" style="font-size:10px;letter-spacing:.1em;text-transform:uppercase">${k}</div></div>`).join("")}
      </div>`,760)}
    ${conn}${note("shipping real code")}
    ${box(`<div style="display:flex;gap:26px;flex-wrap:wrap;align-items:flex-end" class="mono">
        <div><div class="lime" style="font-weight:900;font-size:26px">${num(W.git.commits)}</div><div class="small muted" style="font-size:10px;text-transform:uppercase">commits</div></div>
        <div><div style="font-weight:900;font-size:26px">+${fmtT(W.git.add)}</div><div class="small muted" style="font-size:10px;text-transform:uppercase">added</div></div>
        <div><div style="font-weight:900;font-size:26px">−${fmtT(W.git.rm)}</div><div class="small muted" style="font-size:10px;text-transform:uppercase">removed</div></div>
        <div style="flex:1;min-width:200px">${gitBars(44)}</div></div>
      <div style="margin-top:10px">${W.langs.slice(0,4).map(l=>barRow(l.ext,l.share)).join("")}</div>`,760)}
    ${conn}${note("into "+P.length+" projects")}
    ${box(projRowsDeep(false),760)}
    ${conn}${note("on "+S.tools.length+" tools for "+priceMo(S.price))}
    ${box(toolTableRows(false),760)}
    ${conn}${note("explained in the guide")}
    ${box(`<p style="line-height:1.65;color:var(--fg-secondary)">${esc(S.guide.firstp)}</p>
      <p class="small lime" style="margin-top:8px">${S.guide.heads.map(esc).join(" · ")} · ${guideMin} min →</p>`,760)}
    ${conn}
    <p style="text-align:center"><span class="mono" style="background:var(--lime);color:var(--lime-contrast);padding:10px 22px;font-weight:700;letter-spacing:.12em;text-transform:uppercase;font-size:12px">Share your own stack →</span></p>
    <style>@media(max-width:700px){.g2{grid-template-columns:1fr!important}}</style></div>`;
}

/* =========================================================================
   V23 CONSOLE PRO - a matured ops dashboard: KPI band, chart column left,
   deep list column right, everything visible, no gimmicks.
   ========================================================================= */
function renderV23(){
  const card=(title,inner,extra)=>`<div style="border:1px solid var(--stroke);background:var(--bg-canvas);padding:16px;${extra||""}">
    <p class="mono small muted" style="letter-spacing:.16em;text-transform:uppercase;margin-bottom:10px">${title}</p>${inner}</div>`;
  return `<div style="background:var(--bg-shell);min-height:100vh;padding:26px 18px 44px"><div style="max-width:1260px;margin:0 auto">
    <div style="display:flex;flex-wrap:wrap;gap:16px;align-items:flex-end;justify-content:space-between">
      <div><p class="kick lime">stack</p>
        <h1 style="font-size:clamp(28px,4.4vw,46px);font-weight:900;text-transform:uppercase;letter-spacing:-.02em">${esc(S.name)}</h1>
        <p class="small sec2" style="margin-top:4px">${esc(S.oneLiner)} <span class="muted">· ${esc(S.creator.name)} @${esc(S.creator.handle)} · ${UP} 12</span></p></div>
      <div style="display:flex;gap:22px;flex-wrap:wrap" class="mono">
        ${[[fmtT(U.totalTokens),"tokens 30d"],[fmtUSD(U.usd),"spend ≥ list"],[priceMo(S.price),"fixed"],[num(U.sessions),"sessions"],[U.activeDays+"/30","days"]].map(([v,k])=>`<div style="text-align:right"><div class="lime" style="font-weight:900;font-size:22px">${v}</div><div class="small muted" style="font-size:9px;letter-spacing:.12em;text-transform:uppercase">${k}</div></div>`).join("")}
      </div></div>
    <div style="display:grid;grid-template-columns:1.15fr .85fr;gap:10px;margin-top:18px" class="g2">
      <div style="display:flex;flex-direction:column;gap:10px">
        ${card("tokens per day · 30d",spark(U.series,640,64))}
        ${card("tokens by model",modelTableRows(false)+`<p class="small muted" style="margin-top:6px">${COST_NOTE}</p>`)}
        ${card("measured time by phase",phaseStrip(16)+`<p class="small muted" style="margin-top:8px">median session ${rowVal(row("component:phase-playbook"))} · median turn ${rowVal(row("metric:turn-duration"))} · verify in ${pct(W.lead.verify)} of sessions</p>`)}
        ${card("commits · hour × weekday",heatmap(11)+`<p class="small muted" style="margin-top:8px">${num(W.git.commits)} commits · +${fmtT(W.git.add)} −${fmtT(W.git.rm)} · ${rowVal(row("metric:late-night-commits"))} late night</p>`)}
        ${card("languages + kit",`<div style="display:grid;grid-template-columns:1fr 1fr;gap:16px" class="g2">
          <div>${W.langs.slice(0,4).map(l=>barRow(l.ext,l.share)).join("")}</div>
          <div>${W.skills.slice(0,4).map(s=>barRow(s.name,s.share)).join("")}</div></div>`)}
      </div>
      <div style="display:flex;flex-direction:column;gap:10px">
        ${card("all 15 measurements",wfCells.map(c=>`
          <div style="display:flex;gap:10px;padding:4px 0;border-bottom:1px solid var(--stroke);align-items:baseline">
            <b class="mono lime" style="width:60px;text-align:right;flex:none">${c.fig}</b>
            <span class="small"><b>${c.name}</b> <span class="muted">· ${c.label}</span></span></div>`).join(""))}
        ${card("projects · "+P.length,projRowsDeep(false))}
        ${card("tools · "+priceMo(S.price),toolTableRows(false))}
        ${card("guide · "+guideMin+" min",`<p class="small sec2" style="line-height:1.6">${esc(S.guide.firstp.slice(0,260))}…</p>
          <p class="small lime" style="margin-top:6px">${S.guide.heads.map(esc).join(" · ")} →</p>`)}
      </div>
    </div>
    <p style="text-align:center;margin-top:20px"><span class="mono" style="background:var(--lime);color:var(--lime-contrast);padding:9px 20px;font-weight:700;letter-spacing:.12em;text-transform:uppercase;font-size:12px">Share your own stack →</span></p>
    <style>@media(max-width:900px){.g2{grid-template-columns:1fr!important}}</style></div></div>`;
}

/* =========================================================================
   V24 FEATURE TABLE - editorial page where every section body is one deep,
   beautiful table: each of the 15 rows carries its own inline chart.
   ========================================================================= */
function renderV24(){
  const wrap=i=>`<div style="max-width:1080px;margin:0 auto;padding:0 24px">${i}</div>`;
  const head=(n,t,meta)=>`<div style="display:flex;align-items:baseline;gap:14px;margin:42px 0 16px">
    <span class="mono lime" style="font-size:26px;font-weight:900">${n}</span>
    <h2 style="font-size:clamp(22px,3vw,30px);font-weight:900;text-transform:uppercase;letter-spacing:-.01em">${t}</h2>
    <span style="flex:1;border-top:2px solid var(--lime)"></span><span class="mono small muted">${meta||""}</span></div>`;
  return `<div style="padding-bottom:40px">
    <div style="background:var(--bg-shell);padding:44px 0 34px">${wrap(`
      <div style="display:flex;flex-wrap:wrap;gap:20px;align-items:flex-end;justify-content:space-between">
        <div><h1 style="font-size:clamp(38px,6vw,68px);font-weight:900;line-height:.9;text-transform:uppercase;letter-spacing:-.02em">${esc(S.name)}</h1>
        <p class="sec2" style="margin-top:10px;max-width:540px">${esc(S.oneLiner)}</p>
        <p class="small muted" style="margin-top:6px">${esc(S.creator.name)} @${esc(S.creator.handle)} · ${UP} 12</p></div>
        <div style="text-align:right"><div class="mono lime" style="font-size:clamp(38px,5vw,58px);font-weight:900">${fmtT(U.totalTokens)}</div>
        <p class="mono small muted">tokens 30d · ${fmtUSD(U.usd)} · ${priceMo(S.price)} fixed</p></div>
      </div>`)}</div>
    ${wrap(head("01","Usage",`${num(U.sessions)} sessions · ${U.activeDays}/30 days · checked ${readCheckedAgo}`)+`
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:24px" class="g2">
        <div>${spark(U.series,500,56)}<div style="margin-top:12px">${modelTableRows(false)}</div></div>
        <div>${statStrip(false)}<div style="margin-top:14px">${phaseStrip(14)}</div>
          <p class="small muted" style="margin-top:10px">${COST_NOTE}</p></div>
      </div>`)}
    ${wrap(head("02","Measured","15 rows · fixed order")+
      wfCells.map(c=>`<div style="display:grid;grid-template-columns:76px 220px 1fr;gap:16px;padding:10px 0;border-bottom:1px solid var(--stroke);align-items:center" class="wfr">
        <b class="mono lime" style="font-size:22px;text-align:right">${c.fig}</b>
        <div><p class="small"><b>${c.name}</b></p><p class="small muted">${c.label}</p></div>
        <div style="min-width:0">${microViz(c.id,false)}</div></div>`).join(""))}
    ${wrap(head("03","Projects",P.length+"")+`<div style="display:grid;grid-template-columns:1fr 1fr;gap:4px 34px" class="g2">${projRowsDeep(false)}</div>`)}
    ${wrap(head("04","Tools",`${S.tools.length} · ${priceMo(S.price)}`)+`<div style="display:grid;grid-template-columns:1fr 1fr;gap:4px 34px" class="g2">${toolTableRows(false)}</div>
      <p class="small muted" style="margin-top:10px">Models: ${S.models.map(m=>esc(m.name)).join(", ")} · ${esc(S.bundles[0].name)} ${priceMo(S.bundles[0].amount)}</p>`)}
    ${wrap(head("05","Guide",guideMin+" min")+`
      <p style="max-width:700px;line-height:1.65;color:var(--fg-secondary)">${esc(S.guide.firstp)}</p>
      <p class="small lime" style="margin-top:8px">${S.guide.heads.map(esc).join(" · ")} →</p>`)}
    <p style="text-align:center;margin-top:34px"><span class="mono" style="background:var(--lime);color:var(--lime-contrast);padding:9px 20px;font-weight:700;letter-spacing:.12em;text-transform:uppercase;font-size:12px">Share your own stack →</span></p>
    <style>@media(max-width:820px){.g2{grid-template-columns:1fr!important}.wfr{grid-template-columns:60px 1fr!important}.wfr>div:last-child{grid-column:1/3}}</style></div>`;
}

/* =========================================================================
   V25 STORY SCROLL - chaptered slides: each section fills most of a screen
   with a giant figure and a deep supporting panel. Progress dots fixed right.
   ========================================================================= */
function renderV25(){
  const slide=(n,kick,giant,cap,body,limeBg)=>`
    <section style="min-height:86vh;display:flex;flex-direction:column;justify-content:center;padding:40px 24px;${limeBg?"background:var(--lime);color:var(--lime-contrast)":"background:var(--bg-canvas)"};border-top:1px solid var(--stroke)">
      <div style="max-width:1080px;margin:0 auto;width:100%">
        <p class="mono" style="font-size:12px;letter-spacing:.22em;text-transform:uppercase;${limeBg?"opacity:.7":"color:var(--lime)"}">${n} · ${kick}</p>
        <div class="mono" style="font-size:clamp(52px,9vw,110px);font-weight:900;line-height:.88;letter-spacing:-.03em;margin-top:10px">${giant}</div>
        <p style="margin-top:10px;font-size:15px;${limeBg?"opacity:.8":"color:var(--fg-muted)"}">${cap}</p>
        <div style="margin-top:26px">${body}</div>
      </div></section>`;
  return `<div>
    <section style="min-height:70vh;display:flex;flex-direction:column;justify-content:center;text-align:center;padding:40px 24px">
      <h1 style="font-size:clamp(44px,8vw,96px);font-weight:900;line-height:.88;text-transform:uppercase;letter-spacing:-.03em">${esc(S.name)}</h1>
      <p class="sec2" style="margin-top:14px;font-size:18px">${esc(S.oneLiner)}</p>
      <p class="small muted" style="margin-top:8px">${esc(S.creator.name)} @${esc(S.creator.handle)} · ${priceMo(S.price)} · ${UP} 12 · scroll ↓</p>
    </section>
    ${slide("01","thirty days",fmtT(U.totalTokens),`tokens · ${fmtUSD(U.usd)} at list prices · ${num(U.sessions)} sessions on ${U.activeDays} days`,`
      <div style="mix-blend-mode:multiply">${spark(U.series,1000,72).replace('var(--lime)','var(--lime-contrast)')}</div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px 40px;margin-top:18px" class="g2">
        ${modelRows.map(m=>`<div style="display:flex;align-items:center;gap:10px;padding:4px 0;border-bottom:1px solid oklch(0.3 0.03 132/.35)">
          ${modelIcn(m.name,20)}<b style="width:120px;font-size:13px">${esc(m.name)}</b>
          <span class="bar-track" style="height:8px;background:oklch(0.3 0.03 132/.25)"><span style="display:block;height:100%;background:var(--lime-contrast);width:${m.share*100}%"></span></span>
          <b class="mono small" style="width:44px;text-align:right">${pct(m.share,1)}</b><span class="mono small" style="width:52px;text-align:right;opacity:.7">${fmtUSD(m.usd)}</span></div>`).join("")}
      </div>
      <p class="mono" style="font-size:10px;margin-top:10px;opacity:.65">${COST_NOTE}</p>`,true)}
    ${slide("02","the shape of the work",rowVal(row("component:phase-playbook")),"is the median measured session",`
      ${phaseStrip(18)}
      <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(260px,1fr));gap:18px 28px;margin-top:22px">
      ${wfCells.filter(c=>c.id!=="component:phase-playbook").map(c=>`<div style="border-left:2px solid var(--lime);padding-left:12px">
        <div style="display:flex;gap:8px;align-items:baseline"><b class="mono lime" style="font-size:20px">${c.fig}</b><span class="small"><b>${c.name}</b></span></div>
        <p class="small muted" style="margin:2px 0 6px">${c.label}</p>${microViz(c.id,false)}</div>`).join("")}</div>`)}
    ${slide("03","what it shipped",String(P.length)+"<span style='font-size:.4em'> projects</span>","plus "+num(W.git.commits)+" commits · +"+fmtT(W.git.add)+" −"+fmtT(W.git.rm),`
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:4px 40px" class="g2">${projRowsDeep(false)}</div>
      <div style="max-width:640px;margin-top:16px">${gitBars(40)}</div>`)}
    ${slide("04","what it costs",priceMo(S.price),`${S.tools.length} tools · ${S.models.length} models · ${esc(S.bundles[0].name)}`,`
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:4px 40px" class="g2">${toolTableRows(false)}</div>`)}
    ${slide("05","in the owner's words",guideMin+"<span style='font-size:.4em'> min</span>","the guide: "+S.guide.heads.map(esc).join(" · "),`
      <p style="max-width:720px;font-size:17px;line-height:1.65;color:var(--fg-secondary)">${esc(S.guide.firstp)}</p>
      <p class="small lime" style="margin-top:10px">read the full guide →</p>`)}
    <section style="background:var(--lime);padding:26px;text-align:center"><b class="mono" style="color:var(--lime-contrast);text-transform:uppercase;letter-spacing:.15em;font-size:14px">Share your own stack →</b></section>
    <style>@media(max-width:820px){.g2{grid-template-columns:1fr!important}}</style></div>`;
}
