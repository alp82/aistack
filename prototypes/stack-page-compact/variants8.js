/* PROTOTYPE - throwaway (ticket alp82/aistack#356). The accepted v38 hero and
   v37 body stay fixed. These three variants test only how production-only
   states and the complete Stats inventory fit around that structure. */
"use strict";

const state356=()=>OPT("state")||"owner";

function prodExtra(key){
  const rows={
    time:[[`${U.activeDays}/30`,"Active days","days with at least one session"]],
    code:[[num(P.length),"Project workspaces","distinct workspaces touched"],[num(U.sessions),"Sessions","sessions in the range"]],
    harness:[["2","By harness","harnesses measured"],[pct(U.cacheHitShare,1),"Cache hits","of input tokens served from cache"],[pct(U.subagentShare,1),"Run by subagents","of tokens spent by subagents"]],
  }[key]||[];
  if(!rows.length)return "";
  return `<div style="margin-top:14px;border-top:1px solid var(--stroke)">${rows.map(([fig,name,caption])=>`
    <div title="${esc(name)}: ${esc(fig)} ${esc(caption)}" style="display:grid;grid-template-columns:88px minmax(150px,220px) 1fr;gap:16px;align-items:center;padding:10px 0;border-bottom:1px solid var(--stroke)">
      <b class="mono lime" style="font-size:18px;text-align:right">${fig}</b>
      <span class="small"><b>${name}</b><br><span class="muted">${caption}</span></span>
      ${shareBar(key==="harness"?(name==="Cache hits"?U.cacheHitShare:name==="Run by subagents"?U.subagentShare:.61):Math.min(1,Number(String(fig).replace(/[^0-9.]/g,""))/(key==="time"?30:Math.max(U.sessions,1))),true)}
    </div>`).join("")}</div>`;
}

function productionStatsAccordion(){
  return `<div style="border-top:1px solid var(--stroke)">${topicGroups().map(g=>{
    const cells=g.key==="harness"?g.cells.filter(c=>c.id!=="metric:question-back-share"):g.cells;
    const summary={
      time:`<b class="mono lime">${U.activeDays}/30</b> active days · usual start <b class="mono">${rowVal(row("component:start-hours"))}</b> · <b class="mono">${rowVal(row("component:phase-playbook"))}</b> median session`,
      code:`<b class="mono lime">${num(P.length)}</b> workspaces · <b class="mono">${num(U.sessions)}</b> sessions · <b class="mono">${num(W.git.commits)}</b> commits`,
      models:g.summary,
      harness:`<b class="mono lime">2</b> harnesses · <b class="mono">${pct(U.cacheHitShare,1)}</b> cache hits · <b class="mono">${pct(U.subagentShare,1)}</b> run by subagents`,
      skills:g.summary,
    }[g.key];
    return `<details name="acc356" style="border-bottom:1px solid var(--stroke)">
      <summary style="list-style:none;cursor:pointer;position:relative;display:block">
        <div style="position:absolute;inset:6px 0;opacity:.14;pointer-events:none" aria-hidden="true">${g.bg}</div>
        <div style="position:relative;display:flex;align-items:center;gap:18px;padding:16px 4px;min-height:58px">
          <span class="mono" style="width:88px;flex:none;font-size:12px;font-weight:700;letter-spacing:.14em;text-transform:uppercase;color:var(--lime)">${g.label}</span>
          <span class="small sec2" style="flex:1;min-width:0">${summary}</span><span class="mono muted arr">▾</span>
        </div>
      </summary>
      <div style="padding:8px 4px 26px 110px" class="accbody">
        <div style="display:grid;grid-template-columns:minmax(0,380px) 1fr;gap:34px" class="g2"><div>${leadChart(g.key)}</div><div>${scanRows(cells)}${prodExtra(g.key)}</div></div>
      </div>
    </details>`;
  }).join("")}</div><style>details[open] .arr{transform:rotate(180deg)}@media(max-width:760px){.accbody{padding-left:4px!important}}</style>`;
}

function ownerFacts(){
  return [
    ["SYNC","Updated 23 min ago","Machine data is current"],
    ["CHANGES","3 suggestions","Review measured stack changes"],
    ["VIEWS","184 this month","Private owner analytics"],
  ];
}

function utilityBand356(){
  if(state356()!=="owner")return "";
  return `<aside class="u356-band" aria-label="Owner tools"><div>${ownerFacts().map(([k,v,d])=>`
    <a href="#s-stats" title="${d}"><span class="kick lime">${k}</span><b class="mono">${v}</b><span class="small muted">${d}</span></a>`).join("")}</div></aside>
  <style>.u356-band{background:var(--bg-shell);border-block:1px solid var(--stroke)}.u356-band>div{max-width:1280px;margin:auto;padding:0 24px;display:grid;grid-template-columns:repeat(3,1fr)}.u356-band a{display:grid;gap:3px;padding:13px 18px;border-right:1px solid var(--stroke)}.u356-band a:first-child{border-left:1px solid var(--stroke)}@media(max-width:700px){.u356-band>div{display:block}.u356-band a{border-left:1px solid var(--stroke);border-bottom:1px solid var(--stroke)}}</style>`;
}

function utilityPanel356(){
  if(state356()!=="owner")return "";
  return `<aside style="border:1px solid var(--stroke);margin-bottom:28px" aria-label="Owner tools">
    <div style="display:flex;align-items:center;gap:12px;padding:10px 14px;border-bottom:1px solid var(--stroke)"><span class="kick lime">Owner tools</span><span class="small muted">Only you can see this</span><a href="#" class="mono small" style="margin-left:auto">Edit stack ↗</a></div>
    <div style="display:grid;grid-template-columns:repeat(3,1fr)" class="u356-grid">${ownerFacts().map(([k,v,d])=>`<a href="#" style="padding:14px;border-right:1px solid var(--stroke)"><span class="kick muted">${k}</span><b class="mono" style="display:block;margin-top:4px">${v}</b><span class="small muted">${d}</span></a>`).join("")}</div>
  </aside><style>@media(max-width:700px){.u356-grid{grid-template-columns:1fr!important}.u356-grid a{border-bottom:1px solid var(--stroke)}}</style>`;
}

function utilityDrawer356(){
  if(state356()!=="owner")return "";
  return `<aside style="max-width:1280px;margin:0 auto 24px;padding:0 24px" aria-label="Owner tools"><details style="background:var(--bg-shell);padding:12px 16px">
    <summary style="cursor:pointer;display:flex;gap:14px;align-items:center;list-style:none"><span class="kick lime">Owner tools</span><b class="mono small">Updated 23 min ago</b><span class="small muted">3 suggestions · 184 views</span><span class="mono muted" style="margin-left:auto">▾</span></summary>
    <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:16px;padding:14px 0 4px">${ownerFacts().map(([k,v,d])=>`<a href="#" style="border-top:1px solid var(--stroke);padding-top:10px"><span class="kick muted">${k}</span><b class="mono" style="display:block">${v}</b><span class="small muted">${d}</span></a>`).join("")}</div>
  </details></aside>`;
}

function warning356(){
  if(state356()!=="reported")return "";
  return `<aside style="background:oklch(0.22 0.035 55);border-block:1px solid oklch(0.65 0.12 55);padding:12px 0"><div style="max-width:1280px;margin:auto;padding:0 24px;display:flex;gap:16px;align-items:center"><b class="mono" style="color:oklch(0.8 0.14 70)">REPORT RECEIVED</b><span class="small sec2">You reported this stack. The report remains private.</span><a href="#" class="mono small" style="margin-left:auto;text-decoration:underline">Undo</a></div></aside>`;
}

function hero356(extra){
  let h=heroA();
  if(state356()==="owner")h=h.replaceAll(">Report</a>",">Edit stack</a>");
  if(state356()==="reported")h=h.replaceAll(">Report</a>",">Reported · undo</a>");
  if(state356()==="no-reading"){
    h=h.replace(/<a href="#s-stats" style="position:relative;[\s\S]*?<\/a>/,"");
    h=h.replace(`updated ${readCheckedAgo}`,"");
    h=h.replace("<section style=","<section class=\"proto-no-reading\" style=");
    h=h.replace('class="ha-tabs ', 'class="ha-tabs proto-no-reading-nav ');
    h+=`<style>.proto-no-reading .ha-tiles{grid-template-columns:1fr!important}.proto-no-reading-nav .ha-idrow .mono.small:last-child{display:none!important}</style>`;
  }
  return h.replace('<nav id="ha-tabs"',`${warning356()}${extra}<nav id="ha-tabs"`);
}

function body356(innerBefore){
  const empty=state356()==="no-reading";
  const stats=empty?`<div style="border:1px dashed var(--stroke);padding:28px"><p style="font-size:20px;font-weight:800">No measured stats yet</p><p class="small muted" style="margin-top:8px">The authored stack remains available below. Measured figures appear after a machine publishes its first reading.</p></div>`:
    `${innerBefore}${statsTop37()}<div style="margin-top:36px">${productionStatsAccordion()}</div>`;
  const html=sec37(1,"01","","Stats",empty?"waiting for a reading":`${OPT("win")} · all machines<br>updated ${readCheckedAgo}`,stats)+
    sec37(2,"02","","Projects",P.length+" projects",projGridV16())+
    sec37(3,"03","","Tools",`${S.tools.length} tools · ${priceMo(S.price)}`,toolsBodyV16())+
    sec37(0,"04","","Guide",guideMin+" min read",guideBodyV16());
  const ids=["s-stats","s-projects","s-tools","s-guide"];let i=0;
  return html.replace(/<section /g,()=>`<section id="${ids[i++]}" `)+ctaStrip()+MEDIA_G2+`<style>[id^="s-"]{scroll-margin-top:calc(var(--ptop,0px) + 88px)}</style>`;
}

function renderV41(){return hero356(utilityBand356())+body356("");}
function renderV42(){return hero356("")+body356(utilityPanel356());}
function renderV43(){return hero356(utilityDrawer356())+body356("");}
