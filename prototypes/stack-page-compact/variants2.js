/* PROTOTYPE - throwaway (ticket alp82/aistack#351). Round 2: ten designs,
   each pushing a distinct visual identity while keeping the round-1 cuts. */
"use strict";

/* ---------- round-2 shared helpers ---------- */
const TOOL_ICON = Object.fromEntries(S.tools.map(t=>[t.name,t.icon]));
const PROVIDER_ICON = {"OpenAI":TOOL_ICON["ChatGPT"],"Anthropic":TOOL_ICON["Claude"],"Google":TOOL_ICON["Google AI"]};
const MODEL_PROVIDER = Object.fromEntries(S.models.map(m=>[m.name,m.provider]));
const OFFSET_H = Math.round((W.utcOffsetMin||0)/60);
const localH = h => (h+OFFSET_H+24)%24;

function icn(src,name,px,extra){
  if(src) return `<img src="${src}" alt="" style="width:${px}px;height:${px}px;object-fit:contain;border:1px solid var(--stroke);padding:${Math.max(2,px/12)}px;background:var(--bg-panel);${extra||""}">`;
  return `<span class="mono lime" style="width:${px}px;height:${px}px;display:inline-flex;align-items:center;justify-content:center;border:1px solid var(--stroke);font-weight:700;font-size:${px*0.45}px;${extra||""}">${esc((name||"?")[0])}</span>`;
}
const toolIcn=(t,px,extra)=>icn(t.icon,t.name,px,extra);
const modelIcn=(name,px)=>icn(PROVIDER_ICON[MODEL_PROVIDER[name]]||PROVIDER_ICON[(name.match(/GPT/i)?"OpenAI":name.match(/Claude|Fable/i)?"Anthropic":name.match(/Gemini/i)?"Google":"")],name,px);

/* 7x24 commit heatmap, hours shifted to owner-local; single-hue lime scale */
function heatmap(cellH){
  const grid=Array.from({length:7},()=>Array(24).fill(0));
  for(const [wd,h,c] of (W.heat||[])) grid[wd][localH(h)]+=c;
  const max=Math.max(1,...grid.flat());
  const days=["mo","tu","we","th","fr","sa","su"];
  // weekdayUtc 0=Sunday in JS convention; reorder Mon-first
  const order=[1,2,3,4,5,6,0];
  return `<div style="display:grid;grid-template-columns:22px repeat(24,1fr);gap:2px" class="small muted">`+
    order.map((wd,ri)=>`<span style="font-size:9px;line-height:${cellH}px">${days[ri]}</span>`+
      grid[wd].map(v=>`<span title="${v}" style="height:${cellH}px;background:oklch(0.78 0.17 132 / ${v===0?0.06:0.15+0.85*(v/max)})"></span>`).join("")).join("")+
    `</div><div class="small muted" style="display:flex;justify-content:space-between;margin-top:2px;font-size:9px"><span>00</span><span>06</span><span>12</span><span>18</span><span>23</span></div>`;
}
/* 24-column session start-hour chart */
function startHoursChart(h){
  const arr=Array(24).fill(0);
  for(const [hr,s] of (W.startHours||[])) arr[localH(hr)]+=s;
  const max=Math.max(1,...arr);
  return `<div style="display:flex;align-items:flex-end;gap:2px;height:${h}px">`+
    arr.map((v,i)=>`<span title="${String(i).padStart(2,"0")}:00 · ${v}" style="flex:1;background:${v===max?"var(--lime)":"var(--bg-panel-muted)"};height:${Math.max(2,v/max*h)}px"></span>`).join("")+`</div>`;
}
/* commits per day columns */
function gitBars(h){
  const max=Math.max(1,...W.gitDays.map(g=>g.c));
  return `<div style="display:flex;align-items:flex-end;gap:2px;height:${h}px">`+
    W.gitDays.map(g=>`<span title="${g.d} · ${g.c} commits" style="flex:1;background:var(--lime);opacity:${0.35+0.65*g.c/max};height:${Math.max(2,g.c/max*h)}px"></span>`).join("")+`</div>`;
}
const UP="▲", ASCII_BAR=(share,w)=>{const n=Math.round(share*w);return "█".repeat(n)+"░".repeat(w-n);};
const podium3=wfCells.slice(0,3);

/* =========================================================================
   V6 MAGAZINE - the current identity turned up: giant numerals, alternating
   dark/light bands, asymmetric two-column features, logo marquee.
   ========================================================================= */
function renderV6(){
  const wrap=i=>`<div style="max-width:1220px;margin:0 auto;padding:0 24px">${i}</div>`;
  const band=(light,pad,inner)=>`<section style="background:${light?"oklch(0.95 0.005 256)":"var(--bg-canvas)"};color:${light?"oklch(0.15 0.008 256)":"var(--fg-primary)"};padding:${pad}px 0">${wrap(inner)}</section>`;
  const hero=band(false,44,`
    <div style="display:flex;flex-wrap:wrap;gap:24px;align-items:flex-end">
      <div style="flex:1;min-width:280px">
        <p class="kick lime">stack</p>
        <h1 style="font-size:clamp(44px,7vw,84px);font-weight:900;line-height:.88;letter-spacing:-.03em;text-transform:uppercase">${esc(S.name)}</h1>
        <p style="margin-top:14px;font-size:17px;color:var(--fg-secondary);max-width:520px">${esc(S.oneLiner)}</p>
        <p class="small muted" style="margin-top:8px">${esc(S.creator.name)} @${esc(S.creator.handle)} · ${UP} 12</p>
      </div>
      <div style="text-align:right">
        <div class="mono" style="font-size:clamp(40px,5vw,64px);font-weight:900;line-height:1">${price(S.price)}<span style="font-size:18px;color:var(--fg-muted)">/mo</span></div>
        <p class="kick muted" style="margin-top:6px">${S.tools.length} tools · solo</p>
      </div>
    </div>
    <div style="display:flex;gap:10px;flex-wrap:wrap;margin-top:28px">${toolsSorted.map(t=>toolIcn(t,44)).join("")}</div>`);
  const usage=band(true,52,`
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:40px;align-items:start" class="mag2">
      <div>
        <p class="kick" style="color:oklch(0.55 0.18 132)">01 · actual usage · 30 days</p>
        <div class="mono" style="font-size:clamp(64px,9vw,120px);font-weight:900;line-height:.9;letter-spacing:-.03em">${fmtT(U.totalTokens)}</div>
        <p style="font-size:16px;margin-top:8px">tokens · <b class="mono">${fmtUSD(U.usd)}</b> · ${num(U.sessions)} sessions on ${U.activeDays} days</p>
        <div style="margin-top:18px">${spark(U.series,520,64).replace('var(--lime)','oklch(0.55 0.18 132)')}</div>
        <p style="font-size:11px;font-family:var(--mono);margin-top:10px;color:oklch(0.45 0.005 256)">${COST_NOTE}</p>
      </div>
      <div>
        ${modelRows.map(m=>`<div style="display:flex;align-items:center;gap:12px;padding:7px 0;border-bottom:1px solid oklch(0.65 0.008 256/.9)">
          ${modelIcn(m.name,26)}<b style="width:120px;font-size:14px">${esc(m.name)}</b>
          <span class="bar-track" style="background:oklch(0.9 0.004 256)"><span class="bar-fill" style="background:oklch(0.55 0.18 132);width:${m.share*100}%"></span></span>
          <span class="mono" style="font-weight:700;width:48px;text-align:right">${pct(m.share,1)}</span></div>`).join("")}
        <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:14px;margin-top:20px">
          ${podium3.map(c=>`<div><div class="mono" style="font-size:30px;font-weight:900">${c.fig}</div><div style="font-size:11px;font-family:var(--mono);color:oklch(0.45 0.005 256)">${c.name.toLowerCase()}</div></div>`).join("")}
        </div>
      </div>
    </div>
    <style>@media(max-width:800px){.mag2{grid-template-columns:1fr!important}}</style>`);
  const measure=band(false,52,`
    <p class="kick lime" style="margin-bottom:20px">the other twelve measurements</p>
    <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(250px,1fr));gap:24px 32px">
      ${wfCells.slice(3).map(c=>`<div style="border-top:2px solid var(--lime);padding-top:8px">
        <div class="mono" style="font-size:28px;font-weight:900">${c.fig}</div>
        <div class="small sec2" style="margin-top:2px"><b>${c.name}</b></div>
        <div class="small muted">${c.label}</div></div>`).join("")}
    </div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:32px;margin-top:36px" class="mag2">
      <div><p class="kick muted" style="margin-bottom:8px">commits, hour by weekday</p>${heatmap(12)}</div>
      <div><p class="kick muted" style="margin-bottom:8px">measured time by phase</p>${phaseStrip(20)}</div>
    </div>`);
  const projects=band(true,48,`
    <p class="kick" style="color:oklch(0.55 0.18 132)">02 · built with this stack</p>
    <div style="display:flex;gap:14px;flex-wrap:wrap;margin-top:16px">
      ${P.map(p=>`<div style="flex:1;min-width:220px;border:1px solid oklch(0.65 0.008 256/.9);background:#fff;padding:16px">
        <b style="font-size:17px">${esc(p.name)}</b>${p.url?` <span style="color:oklch(0.55 0.18 132)">↗</span>`:""}
        <p style="font-size:13px;margin-top:6px;color:oklch(0.3 0.006 256)">${esc(p.desc||"")}</p>
        <p style="font-size:10px;font-family:var(--mono);text-transform:uppercase;margin-top:8px;color:oklch(0.45 0.005 256)">${p.tags.join(" · ")}</p>
      </div>`).join("")}
    </div>`);
  const tools=band(false,48,`
    <div style="display:flex;justify-content:space-between;align-items:baseline;flex-wrap:wrap;gap:8px">
      <p class="kick lime">03 · the tools</p><span class="mono" style="font-weight:900;font-size:20px">${priceMo(S.price)}</span>
    </div>
    <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(300px,1fr));gap:10px;margin-top:16px">
      ${toolsSorted.map(t=>`<div style="display:flex;align-items:center;gap:12px;border:1px solid var(--stroke);padding:10px 14px">
        ${toolIcn(t,34)}<div style="flex:1"><b>${esc(t.name)}</b><div class="small muted">${esc(t.cat)} · ${esc(t.tier)}</div></div>
        <span class="mono" style="font-weight:900">${t.bundle?"bundle":t.amount>0?price(t.amount):"free"}</span></div>`).join("")}
    </div>
    <p class="small muted" style="margin-top:12px">models: ${S.models.map(m=>esc(m.name)).join(" · ")} &nbsp;|&nbsp; ${esc(S.bundles[0].name)} ${priceMo(S.bundles[0].amount)}</p>`);
  const guide=band(true,48,`
    <p class="kick" style="color:oklch(0.55 0.18 132)">04 · the guide</p>
    <div style="display:grid;grid-template-columns:2fr 1fr;gap:32px;margin-top:14px" class="mag2">
      <p style="font-size:18px;line-height:1.6">${esc(S.guide.firstp)}</p>
      <div style="border-left:2px solid oklch(0.55 0.18 132);padding-left:16px">
        ${S.guide.heads.map(h=>`<p style="font-size:13px;font-family:var(--mono);padding:4px 0">${esc(h)}</p>`).join("")}
        <p class="small" style="margin-top:8px;color:oklch(0.55 0.18 132)">read the full guide · ${guideMin} min →</p>
      </div>
    </div>`);
  const cta=`<section style="background:var(--lime);padding:26px 24px;text-align:center"><b class="mono" style="color:var(--lime-contrast);text-transform:uppercase;letter-spacing:.15em;font-size:15px">Share your own stack →</b></section>`;
  return hero+usage+measure+projects+tools+guide+cta;
}

/* =========================================================================
   V7 TERMINAL - the page as one styled terminal session. aistack is a CLI
   product; the page speaks its language.
   ========================================================================= */
function renderV7(){
  const P0="oklch(0.13 0.01 256)";
  const line=(cmd,out)=>`<div style="margin-top:22px"><p><span class="lime">❯</span> <b>${cmd}</b></p><div style="margin-top:10px">${out}</div></div>`;
  const kv=rows=>rows.map(([k,v])=>`<div style="display:flex;gap:12px;padding:2px 0"><span class="muted" style="width:170px;flex:none">${k}</span><span style="flex:1;min-width:0">${v}</span></div>`).join("");
  return `<div style="background:${P0};min-height:100vh;padding:20px 12px 60px;font-family:var(--mono);font-size:13px;line-height:1.5">
  <div style="max-width:900px;margin:0 auto;border:1px solid var(--stroke);background:var(--bg-shell)">
    <div style="display:flex;gap:6px;align-items:center;padding:8px 12px;border-bottom:1px solid var(--stroke)">
      <span style="width:10px;height:10px;background:var(--stroke-strong)"></span><span style="width:10px;height:10px;background:var(--stroke-strong)"></span><span style="width:10px;height:10px;background:var(--lime)"></span>
      <span class="muted" style="margin-left:8px;font-size:11px">aistack.to/stacks/${S.name.toLowerCase().replace(/[^a-z0-9]+/g,"-")}</span>
    </div>
    <div style="padding:18px 20px 30px">
      <pre class="lime" style="font-size:clamp(14px,3.4vw,30px);line-height:1.15;font-weight:700;margin:0">▄▀█ █░░ █▀█ █▀▀ █▀█
█▀█ █▄▄ █░░ ██▄ █▀▄<span class="muted" style="font-size:.45em">  's coding stack</span></pre>
      ${line("aistack info",kv([["owner",esc(S.creator.name)+" <span class='muted'>@"+esc(S.creator.handle)+"</span>"],["about",esc(S.oneLiner)],["cost","<b class='lime'>"+priceMo(S.price)+"</b> fixed"],["upvotes","12 "+UP]]))}
      ${line("aistack usage --30d",`
        <div style="display:flex;gap:26px;flex-wrap:wrap;align-items:baseline">
          <span style="font-size:42px;font-weight:900" class="lime">${fmtT(U.totalTokens)}</span>
          <span>tokens · <b>${fmtUSD(U.usd)}</b> · ${num(U.sessions)} sessions · ${U.activeDays}/30 days</span>
        </div>
        <div style="margin-top:8px">${spark(U.series,760,44)}</div>
        <div style="margin-top:12px">${modelRows.map(m=>`<div style="display:flex;gap:10px"><span style="width:130px;flex:none">${esc(m.name)}</span><span class="lime">${ASCII_BAR(m.share,24)}</span><span style="width:50px;text-align:right">${pct(m.share,1)}</span></div>`).join("")}</div>
        <p class="muted" style="margin-top:8px;font-size:11px"># ${COST_NOTE}</p>`)}
      ${line("aistack workflow --30d",`
        <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(260px,1fr));gap:2px 26px">
        ${wfCells.map(c=>`<div style="display:flex;gap:8px;padding:2px 0"><span class="lime" style="width:64px;text-align:right;flex:none;font-weight:700">${c.fig}</span><span class="muted" style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${c.name.toLowerCase()}</span></div>`).join("")}
        </div>
        <div style="margin-top:12px">${phaseStrip(12)}</div>`)}
      ${line("aistack projects",P.map(p=>`<div style="display:flex;gap:10px;padding:2px 0"><span class="lime">▪</span><b style="width:130px;flex:none">${esc(p.name)}</b><span class="muted" style="flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${esc(p.desc||p.tags.join(" · "))}</span>${p.url?`<span class="lime">↗</span>`:""}</div>`).join(""))}
      ${line("aistack tools",`
        ${toolsSorted.map(t=>`<div style="display:flex;gap:10px;align-items:center;padding:3px 0">${toolIcn(t,20,"border:0;background:transparent;padding:0")}<b style="width:130px;flex:none">${esc(t.name)}</b><span class="muted" style="flex:1">${esc(t.cat.toLowerCase())} · ${esc(t.tier.toLowerCase())}</span><span>${t.bundle?"<span class='muted'>bundle</span>":t.amount>0?"<b class='lime'>"+price(t.amount)+"</b>":"free"}</span></div>`).join("")}
        <div style="display:flex;justify-content:space-between;border-top:1px solid var(--stroke);margin-top:6px;padding-top:6px"><b>total</b><b class="lime">${priceMo(S.price)}</b></div>`)}
      ${line("cat GUIDE.md | head",`<p style="color:var(--fg-secondary);max-width:640px;line-height:1.6">${esc(S.guide.firstp)}</p><p class="muted" style="margin-top:6px">— ${S.guide.heads.map(esc).join(" · ")} (${guideMin} min) —</p>`)}
      ${line("npx @use-aistack/cli sync",`<p class="muted"># share your own stack<span class="lime" style="animation:blink 1s step-end infinite">▌</span></p><style>@keyframes blink{50%{opacity:0}}</style>`)}
    </div>
  </div></div>`;
}

/* =========================================================================
   V8 BENTO - mixed-size tiles on a strict grid, logos big, one tile one fact.
   ========================================================================= */
function renderV8(){
  const T=(span,rows,inner,style)=>`<div style="grid-column:span ${span};grid-row:span ${rows||1};border:1px solid var(--stroke);padding:18px;display:flex;flex-direction:column;justify-content:space-between;gap:10px;${style||""}">${inner}</div>`;
  const big=(fig,label)=>`<div><div class="mono" style="font-size:34px;font-weight:900;line-height:1">${fig}</div><div class="small muted" style="margin-top:4px">${label}</div></div>`;
  return `<div style="max-width:1220px;margin:0 auto;padding:28px 20px 40px">
    <div style="display:grid;grid-template-columns:repeat(6,1fr);gap:10px;grid-auto-flow:dense" class="bento">
      ${T(4,1,`<div><p class="kick lime">stack</p>
        <h1 style="font-size:clamp(30px,4.5vw,52px);font-weight:900;line-height:.9;text-transform:uppercase;letter-spacing:-.02em;margin-top:6px">${esc(S.name)}</h1>
        <p class="sec2" style="margin-top:10px;max-width:480px">${esc(S.oneLiner)}</p></div>
        <p class="small muted">${esc(S.creator.name)} @${esc(S.creator.handle)} · ${UP} 12 · Share</p>`)}
      ${T(2,1,`<p class="kick muted">fixed cost</p><div class="mono" style="font-size:clamp(40px,5vw,60px);font-weight:900">${price(S.price)}<span style="font-size:16px;color:var(--fg-muted)">/mo</span></div><p class="small muted">${S.tools.length} tools · solo</p>`,"background:var(--lime);--fg-muted:var(--lime-contrast);color:var(--lime-contrast)")}
      ${T(4,1,`<p class="kick lime">tokens · 30 days</p>
        <div style="display:flex;gap:20px;align-items:baseline;flex-wrap:wrap"><span class="mono" style="font-size:clamp(44px,6vw,72px);font-weight:900;line-height:1">${fmtT(U.totalTokens)}</span>
        <span class="small muted">${fmtUSD(U.usd)} · ${num(U.sessions)} sessions · ${U.activeDays}/30 days</span></div>
        ${spark(U.series,700,54)}<p class="small muted" style="font-size:10px">${COST_NOTE}</p>`)}
      ${T(2,1,`<p class="kick lime">models</p><div>${modelRows.slice(0,3).map(m=>`<div style="display:flex;align-items:center;gap:8px;padding:4px 0">${modelIcn(m.name,22)}<span class="small" style="flex:1">${esc(m.name)}</span><b class="mono small">${pct(m.share)}</b></div>`).join("")}</div><div>${shareBar(modelRows[0].share,false)}</div>`)}
      ${wfCells.slice(0,3).map(c=>T(2,1,`<p class="kick muted">${c.name.toLowerCase()}</p>${big(c.fig,c.label)}`)).join("")}
      ${T(3,1,`<p class="kick lime">commits, hour × weekday</p>${heatmap(11)}`)}
      ${T(3,1,`<p class="kick lime">measured time by phase</p>${phaseStrip(18)}<p class="small muted">${num(W.lead.sessions)} sessions · median ${rowVal(row("component:phase-playbook"))}</p>`)}
      ${wfCells.slice(3,9).map(c=>T(2,1,`<p class="kick muted">${c.name.toLowerCase()}</p>${big(c.fig,c.label)}`)).join("")}
      ${T(6,1,`<p class="kick lime">tools · ${priceMo(S.price)}</p>
        <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(180px,1fr));gap:8px">
        ${toolsSorted.map(t=>`<div style="display:flex;align-items:center;gap:8px;border:1px solid var(--stroke);padding:7px 10px">${toolIcn(t,26)}<span style="flex:1;font-size:13px"><b>${esc(t.name)}</b></span><span class="mono small" style="font-weight:700">${t.bundle?"bdl":t.amount>0?price(t.amount):"free"}</span></div>`).join("")}
        </div>`)}
      ${T(3,1,`<p class="kick lime">projects · ${P.length}</p><div>${P.map(p=>`<div style="display:flex;gap:8px;padding:3px 0" class="small"><b style="width:110px;flex:none">${esc(p.name)}</b><span class="muted" style="flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${esc(p.desc||p.tags.join(" · "))}</span>${p.url?`<span class="lime">↗</span>`:""}</div>`).join("")}</div>`)}
      ${T(3,1,`<p class="kick lime">guide · ${guideMin} min</p><p class="small sec2" style="line-height:1.6">${esc(S.guide.firstp.slice(0,220))}…</p><p class="small lime">${S.guide.heads.map(esc).join(" · ")} →</p>`)}
      ${T(6,1,`<p style="text-align:center" class="mono"><b style="text-transform:uppercase;letter-spacing:.12em">Share your own stack →</b></p>`,"background:var(--lime);color:var(--lime-contrast)")}
    </div></div>
    <style>@media(max-width:820px){.bento{grid-template-columns:repeat(2,1fr)!important}.bento>div{grid-column:span 2!important}}</style>`;
}

/* =========================================================================
   V9 BILLBOARD - full-bleed statement bands, one giant figure per band,
   alternating black / lime / white.
   ========================================================================= */
function renderV9(){
  const band=(bg,fg,inner)=>`<section style="background:${bg};color:${fg};padding:56px 24px;text-align:center;overflow:hidden">${inner}</section>`;
  const giant=(t,sub)=>`<div class="mono" style="font-size:clamp(64px,13vw,170px);font-weight:900;line-height:.85;letter-spacing:-.04em">${t}</div><p class="mono" style="margin-top:14px;font-size:clamp(12px,2vw,17px);letter-spacing:.2em;text-transform:uppercase;opacity:.75">${sub}</p>`;
  return band("var(--bg-canvas)","var(--fg-primary)",`
      <p class="kick lime">aistack · stack</p>
      <h1 style="font-size:clamp(40px,8vw,100px);font-weight:900;line-height:.9;text-transform:uppercase;letter-spacing:-.03em;margin-top:10px">${esc(S.name)}</h1>
      <p class="sec2" style="margin-top:14px;font-size:17px">${esc(S.oneLiner)}</p>
      <p class="small muted" style="margin-top:8px">${esc(S.creator.name)} @${esc(S.creator.handle)} · ${UP} 12</p>`)+
    band("var(--lime)","var(--lime-contrast)",giant(fmtT(U.totalTokens),`tokens in 30 days · ${fmtUSD(U.usd)} at list prices`)+
      `<div style="max-width:820px;margin:26px auto 0;mix-blend-mode:multiply">${spark(U.series,820,70).replace('var(--lime)','var(--lime-contrast)')}</div>
       <p class="mono" style="font-size:12px;opacity:.7;margin-top:10px">${num(U.sessions)} sessions · ${U.activeDays} of 30 days · ${pct(U.cacheHitShare,1)} cache hits · ${pct(U.pricedShare)} priced</p>`)+
    band("var(--bg-canvas)","var(--fg-primary)",`
      <p class="kick lime" style="margin-bottom:22px">where the tokens went</p>
      <div style="max-width:760px;margin:0 auto">${modelRows.map(m=>`
        <div style="display:flex;align-items:center;gap:14px;padding:8px 0;text-align:left">${modelIcn(m.name,30)}
          <b style="width:150px;font-size:16px">${esc(m.name)}</b>${shareBar(m.share,true)}
          <b class="mono" style="width:56px;text-align:right;font-size:16px">${pct(m.share,1)}</b></div>`).join("")}</div>
      <div style="display:flex;justify-content:center;gap:clamp(20px,5vw,64px);flex-wrap:wrap;margin-top:34px">
        ${podium3.map(c=>`<div><div class="mono lime" style="font-size:clamp(34px,5vw,56px);font-weight:900">${c.fig}</div><p class="kick muted" style="margin-top:6px">${c.name}</p></div>`).join("")}
      </div>
      <details style="max-width:760px;margin:22px auto 0"><summary class="mono small lime" style="cursor:pointer">all 15 measurements</summary>
        <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:14px;margin-top:16px;text-align:left">
        ${wfCells.map(c=>`<div style="border-top:2px solid var(--lime);padding-top:6px"><b class="mono" style="font-size:22px">${c.fig}</b><p class="small muted">${c.name} · ${c.label}</p></div>`).join("")}</div></details>
      <p class="mono muted" style="font-size:10px;margin-top:18px">${COST_NOTE}</p>`)+
    band("oklch(0.95 0.005 256)","oklch(0.15 0.008 256)",
      giant(`<span style="color:oklch(0.55 0.18 132)">${price(S.price)}</span><span style="font-size:.3em">/mo</span>`,`${S.tools.length} tools · ${S.models.length} models · 1 bundle`)+`
      <div style="display:flex;gap:14px;flex-wrap:wrap;justify-content:center;margin-top:30px;max-width:900px;margin-left:auto;margin-right:auto">
        ${toolsSorted.map(t=>`<div style="display:flex;align-items:center;gap:8px;border:1px solid oklch(0.65 0.008 256);background:#fff;padding:8px 14px">${toolIcn(t,26,"border:0;background:transparent")}<b style="font-size:14px">${esc(t.name)}</b><span class="mono small" style="font-weight:700;color:oklch(0.55 0.18 132)">${t.bundle?"bundle":t.amount>0?price(t.amount):"free"}</span></div>`).join("")}
      </div>`)+
    band("var(--bg-canvas)","var(--fg-primary)",`
      <div style="display:flex;justify-content:center;gap:clamp(24px,6vw,80px);flex-wrap:wrap">
        ${P.map(p=>`<div style="max-width:150px"><b style="font-size:16px">${esc(p.name)}</b>${p.url?` <span class="lime">↗</span>`:""}<p class="small muted" style="margin-top:4px">${p.tags.slice(0,2).join(" · ")}</p></div>`).join("")}
      </div>
      <p class="kick muted" style="margin-top:18px">${P.length} projects built with this stack</p>`)+
    band("var(--bg-shell)","var(--fg-primary)",`
      <p style="max-width:640px;margin:0 auto;font-size:19px;line-height:1.6;color:var(--fg-secondary)">“${esc(S.guide.firstp.slice(0,180))}…”</p>
      <p class="mono lime" style="margin-top:14px;font-size:13px">read the guide · ${guideMin} min →</p>`)+
    `<section style="background:var(--lime);padding:22px;text-align:center"><b class="mono" style="color:var(--lime-contrast);text-transform:uppercase;letter-spacing:.14em">Share your own stack →</b></section>`;
}

/* =========================================================================
   V10 BLUEPRINT - engineering drawing: grid paper, outlined modules with
   corner ticks, mono annotations, leader-line callouts.
   ========================================================================= */
function renderV10(){
  const paper="background-image:linear-gradient(oklch(0.78 0.17 132/.06) 1px,transparent 1px),linear-gradient(90deg,oklch(0.78 0.17 132/.06) 1px,transparent 1px);background-size:28px 28px";
  const mod=(label,inner,extra)=>`<div style="position:relative;border:1px solid oklch(0.78 0.17 132/.55);padding:22px 18px 16px;margin-top:30px;${extra||""}">
    <span class="mono" style="position:absolute;top:-9px;left:12px;background:var(--bg-canvas);padding:0 8px;font-size:11px;letter-spacing:.2em;text-transform:uppercase;color:var(--lime)">${label}</span>
    <span style="position:absolute;width:7px;height:7px;border-left:2px solid var(--lime);border-top:2px solid var(--lime);left:-1px;top:-1px"></span>
    <span style="position:absolute;width:7px;height:7px;border-right:2px solid var(--lime);border-bottom:2px solid var(--lime);right:-1px;bottom:-1px"></span>
    ${inner}</div>`;
  const call=(fig,name,label)=>`<div style="display:flex;gap:10px;align-items:baseline;padding:4px 0" class="mono">
    <span class="muted" style="font-size:10px">◇</span><b style="font-size:19px" class="lime">${fig}</b>
    <span class="small sec2">${name}</span><span class="small muted" style="flex:1;border-bottom:1px dashed oklch(0.78 0.17 132/.3)"></span><span class="small muted" style="font-size:10px">${label}</span></div>`;
  return `<div style="min-height:100vh;${paper};padding:34px 20px 50px"><div style="max-width:1050px;margin:0 auto">
    <div class="mono" style="display:flex;justify-content:space-between;flex-wrap:wrap;gap:8px;border:1px solid oklch(0.78 0.17 132/.55);padding:10px 16px;font-size:11px">
      <span>DWG № AS-351 · SHEET 1/1</span><span>SCALE 30 DAYS</span><span>DATE 2026-08-30</span><span>REV ${UP}12</span>
    </div>
    ${mod("assembly · "+S.name,`
      <div style="display:flex;gap:28px;flex-wrap:wrap;align-items:baseline">
        <h1 class="mono" style="font-size:clamp(26px,4vw,42px);font-weight:900;text-transform:uppercase;letter-spacing:.02em">${esc(S.name)}</h1>
        <span class="mono lime" style="font-size:24px;font-weight:900">${priceMo(S.price)}</span>
      </div>
      <p class="sec2" style="margin-top:8px;max-width:560px">${esc(S.oneLiner)}</p>
      <p class="mono small muted" style="margin-top:6px">DRAWN BY ${esc(S.creator.name).toUpperCase()} @${esc(S.creator.handle)}</p>`)}
    ${mod("meter · tokens 30d",`
      <div style="display:flex;gap:24px;align-items:flex-end;flex-wrap:wrap">
        <span class="mono lime" style="font-size:clamp(40px,6vw,64px);font-weight:900;line-height:1">${fmtT(U.totalTokens)}</span>
        <span class="mono small muted">${fmtUSD(U.usd)} · ${num(U.sessions)} SESSIONS · ${U.activeDays}/30 DAYS · ${pct(U.cacheHitShare,1)} CACHE</span>
      </div>
      <div style="margin-top:14px">${spark(U.series,940,56)}</div>
      <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:6px 36px;margin-top:14px">
        ${modelRows.map(m=>call(pct(m.share,1),esc(m.name),fmtUSD(m.usd))).join("")}
      </div>
      <p class="mono muted" style="font-size:10px;margin-top:10px">NOTE: ${COST_NOTE.toUpperCase()}</p>`)}
    ${mod("instrumentation · 15 measurements",`
      <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(300px,1fr));gap:2px 36px">
        ${wfCells.map(c=>call(c.fig,c.name,"")).join("")}
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:24px;margin-top:16px" class="bp2">
        <div><p class="mono small muted" style="margin-bottom:6px">FIG 1 · COMMITS BY HOUR × WEEKDAY</p>${heatmap(10)}</div>
        <div><p class="mono small muted" style="margin-bottom:6px">FIG 2 · MEASURED TIME BY PHASE</p>${phaseStrip(14)}</div>
      </div><style>@media(max-width:760px){.bp2{grid-template-columns:1fr!important}}</style>`)}
    ${mod("payload · projects",`<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:4px 30px">
      ${P.map(p=>`<div style="display:flex;gap:8px;align-items:baseline" class="mono small"><span class="lime">▣</span><b>${esc(p.name)}</b><span class="muted" style="flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${esc(p.desc||p.tags.join(" · "))}</span>${p.url?"<span class='lime'>↗</span>":""}</div>`).join("")}</div>`)}
    ${mod("bill of materials · "+S.tools.length+" tools",`
      <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(300px,1fr));gap:4px 30px" class="mono small">
      ${toolsSorted.map((t,i)=>`<div style="display:flex;gap:10px;align-items:center;padding:2px 0"><span class="muted">${String(i+1).padStart(2,"0")}</span>${toolIcn(t,20,"border:0;background:transparent;padding:0")}<b style="flex:1">${esc(t.name)}</b><span class="muted">${esc(t.cat.toUpperCase())}</span><span class="lime" style="font-weight:700">${t.bundle?"BDL":t.amount>0?price(t.amount):"FREE"}</span></div>`).join("")}
      </div>
      <div class="mono" style="display:flex;justify-content:flex-end;gap:16px;border-top:1px solid oklch(0.78 0.17 132/.4);margin-top:10px;padding-top:8px"><span class="muted small">TOTAL</span><b class="lime">${priceMo(S.price)}</b></div>`)}
    ${mod("operating manual · guide",`<p style="max-width:640px;line-height:1.65;color:var(--fg-secondary)">${esc(S.guide.firstp)}</p>
      <p class="mono small lime" style="margin-top:8px">${S.guide.heads.map(h=>esc(h).toUpperCase()).join(" / ")} · ${guideMin} MIN →</p>`)}
    <p class="mono" style="text-align:center;margin-top:30px;font-size:12px"><span style="background:var(--lime);color:var(--lime-contrast);padding:8px 18px;font-weight:700;letter-spacing:.14em">SHARE YOUR OWN STACK →</span></p>
  </div></div>`;
}

/* =========================================================================
   V11 RECEIPT - the stack as a printed till receipt. Narrow, mono, playful.
   ========================================================================= */
function renderV11(){
  const dash=`border-top:1px dashed var(--stroke-strong)`;
  const li=(l,r)=>`<div style="display:flex;justify-content:space-between;gap:10px;padding:2px 0"><span style="min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${l}</span><span style="flex:none">${r}</span></div>`;
  const hd=t=>`<p style="text-align:center;letter-spacing:.3em;margin:14px 0 6px;font-weight:700">· ${t} ·</p>`;
  return `<div style="background:var(--bg-shell);min-height:100vh;padding:34px 12px 60px">
  <div class="mono" style="max-width:420px;margin:0 auto;background:oklch(0.97 0.003 256);color:oklch(0.2 0.009 256);padding:26px 22px;font-size:12.5px;line-height:1.55;box-shadow:0 10px 40px rgb(0 0 0/.6);
    clip-path:polygon(0 8px,2% 0,4% 8px,6% 0,8% 8px,10% 0,12% 8px,14% 0,16% 8px,18% 0,20% 8px,22% 0,24% 8px,26% 0,28% 8px,30% 0,32% 8px,34% 0,36% 8px,38% 0,40% 8px,42% 0,44% 8px,46% 0,48% 8px,50% 0,52% 8px,54% 0,56% 8px,58% 0,60% 8px,62% 0,64% 8px,66% 0,68% 8px,70% 0,72% 8px,74% 0,76% 8px,78% 0,80% 8px,82% 0,84% 8px,86% 0,88% 8px,90% 0,92% 8px,94% 0,96% 8px,98% 0,100% 8px,100% 100%,0 100%)">
    <p style="text-align:center;font-weight:900;font-size:18px;letter-spacing:.18em">AI STACK</p>
    <p style="text-align:center;letter-spacing:.1em;font-size:11px">30-DAY STATEMENT · 2026-08-30</p>
    <p style="text-align:center;font-size:11px;color:oklch(0.45 0 0)">stack: ${esc(S.name)} · @${esc(S.creator.handle)}</p>
    <div style="${dash};margin:12px 0"></div>
    <p style="text-align:center;font-size:11px">${esc(S.oneLiner)}</p>
    ${hd("USAGE")}
    ${li("TOKENS ×"+num(U.totalTokens),"<b>"+fmtT(U.totalTokens)+"</b>")}
    ${li("SPEND (LIST PRICES)","<b>"+fmtUSD(U.usd)+"</b>")}
    ${li("SESSIONS",num(U.sessions))}
    ${li("ACTIVE DAYS",U.activeDays+"/30")}
    ${li("CACHE HITS",pct(U.cacheHitShare,1))}
    <div style="margin:6px 0">${spark(U.series,376,34).replace('var(--lime)','oklch(0.45 0.16 132)')}</div>
    ${modelRows.map(m=>li(esc(m.name.toUpperCase()),pct(m.share,1))).join("")}
    ${hd("WORKFLOW")}
    ${wfCells.map(c=>li(c.name.toUpperCase(),"<b>"+c.fig+"</b>")).join("")}
    ${hd("PROJECTS")}
    ${P.map(p=>li(esc(p.name.toUpperCase()),p.url?"↗":"")).join("")}
    ${hd("TOOLS")}
    ${toolsSorted.map(t=>li(esc(t.name.toUpperCase())+" · "+esc(t.tier.toUpperCase()),t.bundle?"BDL":t.amount>0?price(t.amount)+".00":"0.00")).join("")}
    <div style="${dash};margin:8px 0"></div>
    ${li("<b>TOTAL / MO</b>","<b style='font-size:15px'>"+price(S.price)+".99</b>")}
    ${li("GUIDE",guideMin+" MIN READ")}
    <div style="${dash};margin:10px 0"></div>
    <p style="font-size:10px;color:oklch(0.45 0 0);text-align:center">${COST_NOTE.toUpperCase()}</p>
    <p style="text-align:center;margin-top:10px;font-size:11px">*** THANK YOU FOR STACKING ***</p>
    <div style="height:44px;margin:10px 24px 0;background:repeating-linear-gradient(90deg,#111 0 2px,transparent 2px 5px,#111 5px 6px,transparent 6px 10px,#111 10px 13px,transparent 13px 15px)"></div>
    <p style="text-align:center;font-size:10px;letter-spacing:.3em">${S.name.toUpperCase().replace(/[^A-Z0-9]/g,"")}</p>
    <p style="text-align:center;margin-top:12px"><span style="background:oklch(0.55 0.18 132);color:#fff;padding:6px 14px;font-weight:700;font-size:11px;letter-spacing:.12em">SHARE YOUR OWN →</span></p>
  </div></div>`;
}

/* =========================================================================
   V12 TICKER - trading-terminal: scrolling model tape, quote tiles with
   deltas, git candles, glowing lime numerals.
   ========================================================================= */
function renderV12(){
  const glow="text-shadow:0 0 18px oklch(0.78 0.17 132/.55)";
  const tape=modelRows.concat(modelRows).map(m=>`<span style="padding:0 26px"><b>${esc(m.name.toUpperCase())}</b> <span class="lime">${pct(m.share,1)}</span> <span class="muted">${fmtUSD(m.usd)}</span></span>`).join("");
  const quote=(fig,name,sub,span)=>`<div style="grid-column:span ${span||1};border:1px solid var(--stroke);background:var(--bg-shell);padding:14px">
      <p class="mono small muted" style="letter-spacing:.14em;text-transform:uppercase">${name}</p>
      <div class="mono lime" style="font-size:30px;font-weight:900;margin-top:6px;${glow}">${fig}</div>
      <p class="small muted" style="margin-top:4px">${sub||""}</p></div>`;
  const candles=W.gitDays.map(g=>{const max=Math.max(...W.gitDays.map(x=>x.a+x.r));const h=60*(g.a+g.r)/max;const up=g.a>=g.r;
    return `<span title="${g.d} +${num(g.a)} −${num(g.r)}" style="flex:1;display:flex;flex-direction:column;justify-content:flex-end"><span style="height:${Math.max(2,h)}px;background:${up?"var(--lime)":"oklch(0.6 0.19 25)"};opacity:.85"></span></span>`;}).join("");
  return `<div style="background:var(--bg-shell);min-height:100vh;padding-bottom:40px">
    <div style="overflow:hidden;border-bottom:1px solid var(--lime);background:var(--bg-canvas)"><div class="mono small" style="display:inline-flex;white-space:nowrap;padding:9px 0;animation:tk 28s linear infinite">${tape}</div></div>
    <style>@keyframes tk{from{transform:translateX(0)}to{transform:translateX(-50%)}}@media(max-width:820px){.tkg{grid-template-columns:repeat(2,1fr)!important}.tkg>div{grid-column:span 2!important}}</style>
    <div style="max-width:1220px;margin:0 auto;padding:26px 20px">
      <div style="display:flex;justify-content:space-between;align-items:flex-end;flex-wrap:wrap;gap:14px">
        <div><p class="mono small lime">AISTACK:${esc(S.creator.handle.toUpperCase())}</p>
        <h1 class="mono" style="font-size:clamp(26px,4vw,44px);font-weight:900;text-transform:uppercase">${esc(S.name)}</h1>
        <p class="small muted">${esc(S.oneLiner)}</p></div>
        <div style="text-align:right"><div class="mono lime" style="font-size:40px;font-weight:900;${glow}">${priceMo(S.price)}</div><p class="mono small muted">FIXED · ${UP}12 UPVOTES</p></div>
      </div>
      <div style="display:grid;grid-template-columns:repeat(6,1fr);gap:8px;margin-top:22px" class="tkg">
        ${quote(fmtT(U.totalTokens),"tokens/30d",spark(U.series,340,36),2)}
        ${quote(fmtUSD(U.usd),"spend ≥ list","100% of tokens priced")}
        ${quote(num(U.sessions),"sessions",U.activeDays+"/30 days active")}
        ${quote(pct(U.cacheHitShare,1),"cache hits","input from cache")}
        ${quote(pct(U.subagentShare,1),"subagent tokens","of all tokens")}
        ${wfCells.map(c=>quote(c.fig,c.name,c.label)).join("")}
        ${quote(candles?`<div style="display:flex;gap:2px;align-items:flex-end;height:60px">${candles}</div>`:"","git volume · 30d",num(W.git.add)+" added · "+num(W.git.rm)+" removed",3)}
        ${quote(phaseStrip(14),"time by phase",num(W.lead.sessions)+" sessions",3)}
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:8px" class="tkg">
        <div style="border:1px solid var(--stroke);background:var(--bg-canvas);padding:14px">
          <p class="mono small muted" style="letter-spacing:.14em">HOLDINGS · ${S.tools.length} TOOLS · ${priceMo(S.price)}</p>
          ${toolsSorted.map(t=>`<div style="display:flex;gap:10px;align-items:center;padding:4px 0;border-bottom:1px solid var(--stroke)" class="mono small">${toolIcn(t,20,"border:0;background:transparent;padding:0")}<b style="flex:1">${esc(t.name.toUpperCase())}</b><span class="muted">${esc(t.tier.toUpperCase())}</span><span class="lime" style="width:52px;text-align:right;font-weight:700">${t.bundle?"BDL":t.amount>0?price(t.amount):"0"}</span></div>`).join("")}
        </div>
        <div style="border:1px solid var(--stroke);background:var(--bg-canvas);padding:14px">
          <p class="mono small muted" style="letter-spacing:.14em">OUTPUT · ${P.length} PROJECTS</p>
          ${P.map(p=>`<div style="display:flex;gap:10px;padding:4px 0;border-bottom:1px solid var(--stroke)" class="mono small"><span class="lime">${UP}</span><b style="width:120px;flex:none">${esc(p.name.toUpperCase())}</b><span class="muted" style="flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${esc(p.desc||p.tags.join(" · "))}</span>${p.url?"<span class='lime'>↗</span>":""}</div>`).join("")}
          <p class="mono small muted" style="letter-spacing:.14em;margin-top:14px">RESEARCH · GUIDE</p>
          <p class="small sec2" style="margin-top:6px;line-height:1.55">${esc(S.guide.firstp.slice(0,200))}… <span class="lime">${guideMin} MIN →</span></p>
        </div>
      </div>
      <p class="mono small muted" style="margin-top:10px">${COST_NOTE}</p>
      <p style="text-align:center;margin-top:20px"><span class="mono" style="background:var(--lime);color:var(--lime-contrast);padding:9px 20px;font-weight:700;letter-spacing:.14em;font-size:12px">OPEN YOUR POSITION · SHARE YOUR STACK →</span></p>
    </div></div>`;
}

/* =========================================================================
   V13 SPINE - the 30 days as a huge chart spine up top; sections hang off a
   vertical lime line, alternating left and right.
   ========================================================================= */
function renderV13(){
  const node=(side,label,inner)=>`
    <div style="position:relative;display:grid;grid-template-columns:1fr 44px 1fr;margin-top:34px" class="sp3">
      <div style="grid-column:${side==="l"?1:3};grid-row:1;${side==="l"?"text-align:right;":""}">
        <p class="kick lime" style="margin-bottom:8px">${label}</p>${inner}</div>
      <div style="grid-column:2;grid-row:1;display:flex;justify-content:center">
        <span style="width:2px;background:var(--lime);opacity:.5"></span>
        <span style="position:absolute;top:2px;width:12px;height:12px;background:var(--lime);outline:4px solid var(--bg-canvas)"></span>
      </div>
    </div>`;
  const max=Math.max(...U.series.map(p=>p.t));
  const bigChart=`<div style="display:flex;align-items:flex-end;gap:3px;height:120px">${U.series.map(p=>`<span title="${p.d} · ${fmtT(p.t)}" style="flex:1;background:var(--lime);opacity:${0.3+0.7*p.t/max};height:${Math.max(2,p.t/max*120)}px"></span>`).join("")}</div>`;
  return `<div style="max-width:1000px;margin:0 auto;padding:34px 20px 50px">
    <div style="text-align:center">
      <h1 style="font-size:clamp(34px,6vw,64px);font-weight:900;text-transform:uppercase;letter-spacing:-.02em;line-height:.9">${esc(S.name)}</h1>
      <p class="sec2" style="margin-top:10px">${esc(S.oneLiner)}</p>
      <p class="small muted" style="margin-top:6px">${esc(S.creator.name)} @${esc(S.creator.handle)} · ${priceMo(S.price)} · ${UP} 12</p>
    </div>
    <div style="margin-top:26px">${bigChart}
      <div style="display:flex;justify-content:space-between;align-items:baseline;margin-top:8px" class="mono small muted"><span>Aug 1</span>
      <span style="font-size:15px;color:var(--fg-primary)"><b class="lime" style="font-size:24px">${fmtT(U.totalTokens)}</b> tokens · <b>${fmtUSD(U.usd)}</b> · ${num(U.sessions)} sessions</span><span>Aug 30</span></div></div>
    ${node("l","models",modelRows.map(m=>`<div style="display:flex;gap:8px;align-items:center;justify-content:flex-end;padding:3px 0" class="small"><span>${esc(m.name)}</span><b class="mono">${pct(m.share,1)}</b>${modelIcn(m.name,20)}</div>`).join(""))}
    ${node("r","rhythm",`<div style="max-width:380px">${heatmap(9)}</div><p class="small muted" style="margin-top:6px">${rowVal(row("component:start-hours"))} usual start · ${rowVal(row("metric:late-night-commits"))} late-night commits</p>`)}
    ${node("l","sessions",`<p class="small sec2">median <b class="mono lime" style="font-size:20px">${rowVal(row("component:phase-playbook"))}</b> · turns <b class="mono">${rowVal(row("metric:turn-duration"))}</b></p><div style="max-width:360px;margin-left:auto;margin-top:8px">${phaseStrip(12)}</div>`)}
    ${node("r","delegation + kit",`<p class="small sec2"><b class="mono lime" style="font-size:20px">${rowVal(row("component:delegation"))}</b> of tool calls in subagents · <b class="mono">${rowVal(row("metric:effort-levels"))}</b> turns at high effort</p>
      <p class="small muted" style="margin-top:6px">skills: ${W.skills.slice(0,4).map(s=>esc(s.name)).join(", ")} · ${rowVal(row("metric:web-searches-per-active-day"))} web searches/day</p>`)}
    ${node("l","code",`<p class="small sec2"><b class="mono lime" style="font-size:20px">${num(W.git.commits)}</b> commits · +${num(W.git.add)} −${num(W.git.rm)} · ${num(W.git.test)} touch tests</p><div style="max-width:360px;margin-left:auto;margin-top:8px">${gitBars(36)}</div>`)}
    ${node("r","projects · "+P.length,P.map(p=>`<div class="small" style="padding:2px 0"><b>${esc(p.name)}</b> <span class="muted">${esc((p.desc||"").slice(0,60))}</span>${p.url?" <span class='lime'>↗</span>":""}</div>`).join(""))}
    ${node("l","tools · "+priceMo(S.price),`<div style="display:flex;gap:6px;flex-wrap:wrap;justify-content:flex-end">${toolsSorted.map(t=>`<span style="display:inline-flex;align-items:center;gap:6px;border:1px solid var(--stroke);padding:5px 9px" class="small">${toolIcn(t,18,"border:0;background:transparent;padding:0")}<b>${esc(t.name)}</b><span class="mono lime">${t.bundle?"bdl":t.amount>0?price(t.amount):"free"}</span></span>`).join("")}</div>`)}
    ${node("r","guide · "+guideMin+" min",`<p class="small sec2" style="line-height:1.6">${esc(S.guide.firstp.slice(0,220))}…</p><p class="small lime" style="margin-top:6px">${S.guide.heads.map(esc).join(" · ")} →</p>`)}
    <p style="text-align:center;margin-top:36px"><span class="mono" style="background:var(--lime);color:var(--lime-contrast);padding:9px 20px;font-weight:700;letter-spacing:.12em;font-size:12px;text-transform:uppercase">Share your own stack →</span></p>
    <p class="mono small muted" style="text-align:center;margin-top:12px;font-size:10px">${COST_NOTE}</p>
    <style>@media(max-width:700px){.sp3{grid-template-columns:1fr!important}.sp3>div{grid-column:1!important;text-align:left!important}.sp3 span{justify-content:flex-start!important}}</style>
  </div>`;
}

/* =========================================================================
   V14 RAILS - phone-first: big section headers, content in horizontal
   snap-scroll card rails. Vertical height stays tiny.
   ========================================================================= */
function renderV14(){
  const rail=(title,meta,cards,w)=>`
    <div style="margin-top:30px">
      <div style="display:flex;align-items:baseline;gap:12px;padding:0 20px;max-width:1220px;margin:0 auto">
        <h2 style="font-size:clamp(20px,3vw,30px);font-weight:900;text-transform:uppercase;letter-spacing:-.01em">${title}</h2>
        <span class="small muted">${meta||""}</span><span style="flex:1;border-top:1px solid var(--stroke)"></span><span class="lime mono small">⟶</span>
      </div>
      <div style="display:flex;gap:10px;overflow-x:auto;scroll-snap-type:x mandatory;padding:14px 20px 6px;-webkit-overflow-scrolling:touch">
        ${cards.map(c=>`<div style="flex:0 0 ${w||240}px;scroll-snap-align:start;border:1px solid var(--stroke);padding:16px;background:var(--bg-canvas)">${c}</div>`).join("")}
      </div>
    </div>`;
  const stat=(fig,name,sub)=>`<div class="mono lime" style="font-size:30px;font-weight:900">${fig}</div><p class="small sec2" style="margin-top:6px"><b>${name}</b></p><p class="small muted">${sub||""}</p>`;
  return `<div style="padding-top:30px;padding-bottom:20px">
    <div style="max-width:1220px;margin:0 auto;padding:0 20px">
      <h1 style="font-size:clamp(34px,6vw,64px);font-weight:900;line-height:.9;text-transform:uppercase;letter-spacing:-.02em">${esc(S.name)}</h1>
      <p class="sec2" style="margin-top:10px;max-width:560px">${esc(S.oneLiner)}</p>
      <div style="display:flex;gap:16px;flex-wrap:wrap;margin-top:12px" class="mono small">
        <b class="lime" style="font-size:16px">${priceMo(S.price)}</b><span class="muted">${esc(S.creator.name)} @${esc(S.creator.handle)}</span><span class="muted">${UP} 12 · Share · Report</span>
      </div>
    </div>
    ${rail("Usage","30 days · "+num(U.sessions)+" sessions",[
      `<div class="mono lime" style="font-size:34px;font-weight:900">${fmtT(U.totalTokens)}</div><p class="small muted">tokens · 30 days</p>${spark(U.series,260,44)}<p class="small muted" style="margin-top:6px">${fmtUSD(U.usd)} ≥ list prices</p>`,
      `<p class="kick muted" style="margin-bottom:8px">models</p>`+modelRows.slice(0,4).map(m=>`<div style="display:flex;gap:8px;align-items:center;padding:3px 0" class="small">${modelIcn(m.name,18)}<span style="flex:1">${esc(m.name)}</span><b class="mono">${pct(m.share)}</b></div>`).join(""),
      `<p class="kick muted" style="margin-bottom:8px">time by phase</p>${phaseStrip(14)}<p class="small muted" style="margin-top:8px">median session ${rowVal(row("component:phase-playbook"))}</p>`,
      ...podium3.map(c=>stat(c.fig,c.name,c.label)),
    ],280)}
    ${rail("Measured","12 more",wfCells.slice(3).map(c=>stat(c.fig,c.name,c.label)),220)}
    ${rail("Projects",P.length+" built with this stack",P.map(p=>`<b style="font-size:16px">${esc(p.name)}</b>${p.url?" <span class='lime'>↗</span>":""}<p class="small sec2" style="margin-top:6px">${esc(p.desc||"")}</p><p class="small muted" style="margin-top:6px">${p.tags.join(" · ")}</p>`),240)}
    ${rail("Tools",S.tools.length+" · "+priceMo(S.price),toolsSorted.map(t=>`
      <div style="display:flex;align-items:center;gap:10px">${toolIcn(t,36)}<div><b>${esc(t.name)}</b><p class="small muted">${esc(t.cat)}</p></div></div>
      <p class="mono lime" style="margin-top:10px;font-weight:900;font-size:18px">${t.bundle?"bundle":t.amount>0?priceMo(t.amount):"free"}</p><p class="small muted">${esc(t.tier)}</p>`),190)}
    ${rail("Guide",guideMin+" min read",[`<p class="small sec2" style="line-height:1.6">${esc(S.guide.firstp.slice(0,300))}…</p>`,...S.guide.heads.map(h=>`<p class="mono lime" style="font-weight:700">${esc(h)}</p><p class="small muted" style="margin-top:6px">chapter</p>`)],260)}
    <p style="text-align:center;margin:30px 0 10px"><span class="mono" style="background:var(--lime);color:var(--lime-contrast);padding:10px 22px;font-weight:700;letter-spacing:.12em;text-transform:uppercase;font-size:12px">Share your own stack →</span></p>
    <p class="mono muted" style="text-align:center;font-size:10px">${COST_NOTE}</p></div>`;
}

/* =========================================================================
   V15 SPLIT HERO - fixed graphic half (lime diagonal, giant figures),
   scrolling compact half. Bold geometry.
   ========================================================================= */
function renderV15(){
  const left=`
  <div style="position:sticky;top:46px;height:calc(100vh - 46px);display:flex;flex-direction:column;justify-content:space-between;overflow:hidden;background:linear-gradient(118deg,var(--lime) 0 62%,var(--bg-canvas) 62.2%);padding:34px 28px" class="sh-left">
    <div style="color:var(--lime-contrast)">
      <p class="kick">aistack · stack</p>
      <h1 style="font-size:clamp(30px,3.4vw,52px);font-weight:900;line-height:.9;text-transform:uppercase;letter-spacing:-.02em;margin-top:10px">${esc(S.name)}</h1>
      <p style="margin-top:12px;max-width:340px;font-size:14px;font-weight:500">${esc(S.oneLiner)}</p>
      <p class="mono" style="margin-top:8px;font-size:11px">${esc(S.creator.name)} @${esc(S.creator.handle)} · ${UP} 12</p>
    </div>
    <div>
      <div class="mono" style="color:var(--lime-contrast);font-size:clamp(44px,4.5vw,72px);font-weight:900;line-height:.9">${fmtT(U.totalTokens)}</div>
      <p class="mono" style="color:var(--lime-contrast);font-size:11px;letter-spacing:.2em;text-transform:uppercase;margin-top:6px">tokens · 30 days</p>
      <div style="display:flex;gap:22px;margin-top:16px" class="mono">
        ${[["spend",fmtUSD(U.usd)],["cost",priceMo(S.price)],["sessions",num(U.sessions)]].map(([k,v])=>`<div><div style="font-weight:900;font-size:19px;color:var(--lime-contrast)">${v}</div><div style="font-size:10px;letter-spacing:.14em;text-transform:uppercase;color:var(--lime-contrast);opacity:.7">${k}</div></div>`).join("")}
      </div>
    </div>
    <div style="mix-blend-mode:multiply;margin:0 -28px -10px">${spark(U.series,600,64).replace('var(--lime)','var(--lime-contrast)')}</div>
  </div>`;
  const h=(t,m)=>`<div style="display:flex;align-items:baseline;gap:10px;margin:26px 0 10px"><b style="text-transform:uppercase;letter-spacing:.06em;font-size:15px">${t}</b><span class="small muted">${m||""}</span><span style="flex:1;border-top:2px solid var(--lime)"></span></div>`;
  const right=`
  <div style="padding:20px 26px 40px;min-width:0">
    ${h("Models","where the tokens went")}
    ${modelRows.map(m=>`<div style="display:flex;gap:10px;align-items:center;padding:3px 0" class="small">${modelIcn(m.name,20)}<span style="width:110px">${esc(m.name)}</span>${shareBar(m.share,true)}<b class="mono" style="width:44px;text-align:right">${pct(m.share)}</b></div>`).join("")}
    ${h("Measured","15 numbers, no ranking")}
    <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:14px 18px">
      ${wfCells.map(c=>`<div><div class="mono lime" style="font-size:22px;font-weight:900">${c.fig}</div><p class="small sec2"><b>${c.name}</b></p></div>`).join("")}
    </div>
    <div style="margin-top:14px">${phaseStrip(12)}</div>
    ${h("Projects",P.length+"")}
    ${P.map(p=>`<div style="display:flex;gap:8px;padding:3px 0" class="small"><b style="width:110px;flex:none">${esc(p.name)}</b><span class="muted" style="flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${esc(p.desc||p.tags.join(" · "))}</span>${p.url?"<span class='lime'>↗</span>":""}</div>`).join("")}
    ${h("Tools",S.tools.length+" · "+priceMo(S.price))}
    <div style="display:flex;gap:6px;flex-wrap:wrap">
      ${toolsSorted.map(t=>`<span style="display:inline-flex;align-items:center;gap:6px;border:1px solid var(--stroke);padding:5px 9px" class="small">${toolIcn(t,18,"border:0;background:transparent;padding:0")}<b>${esc(t.name)}</b><span class="mono lime">${t.bundle?"bdl":t.amount>0?price(t.amount):"free"}</span></span>`).join("")}
    </div>
    ${h("Guide",guideMin+" min")}
    <p class="small sec2" style="line-height:1.65;max-width:520px">${esc(S.guide.firstp)}</p>
    <p class="small lime" style="margin-top:6px">${S.guide.heads.map(esc).join(" · ")} →</p>
    <p class="mono muted" style="font-size:10px;margin-top:16px">${COST_NOTE}</p>
    <p style="margin-top:22px"><span class="mono" style="background:var(--lime);color:var(--lime-contrast);padding:8px 18px;font-weight:700;font-size:11px;letter-spacing:.12em;text-transform:uppercase">Share your own stack →</span></p>
  </div>`;
  return `<div style="display:grid;grid-template-columns:minmax(340px,44%) 1fr;max-width:1400px;margin:0 auto" class="sh">
    ${left}${right}</div>
    <style>@media(max-width:820px){.sh{grid-template-columns:1fr!important}.sh-left{position:static!important;height:auto!important;gap:20px}}</style>`;
}
