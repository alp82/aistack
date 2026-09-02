/* PROTOTYPE - throwaway (ticket alp82/aistack#352). Round 1: three hero and
   subnav pairs, each rendered over the accepted v37 body from #351. The body
   is unchanged; only the top of the page and the section navigation differ.

   v38 Masthead + tabs   identity left, two promise tiles right (authored price,
                         measured tokens), logo strip; sticky tab bar with the
                         four section stats, identity appears once stuck.
   v39 Figures first     the four section figures ARE the hero, each a link;
                         the one-liner follows; a vertical progress rail on wide
                         screens, a sticky figure strip everywhere else.
   v40 Contents          name and one-liner left, a "in this stack" ladder
                         right with one sentence per section; a reading scrubber
                         pinned under the header, segments sized by section. */
"use strict";

const UPVOTES=12; // not in slim.json; the demo's stand-in, as in heroV16

/* The four sections of the v37 body, with the anchor ids body352() stamps. */
function sections352(){
  return [
    {n:"01",id:"s-stats",title:OPT("name")==="usage"?"Actual Usage":"Stats",stat:`${fmtT(U.totalTokens)} tokens`,
     line:`${fmtT(U.totalTokens)} tokens in 30 days, ${num(U.sessions)} sessions on ${W.lead.harnesses} harnesses`},
    {n:"02",id:"s-projects",title:"Projects",stat:`${P.length} projects`,
     line:`${P.length} projects, ${num(W.git.commits)} commits in the last 30 days`},
    {n:"03",id:"s-tools",title:"Tools",stat:`${S.tools.length} tools · ${priceMo(S.price)}`,
     line:`${S.tools.length} tools for ${priceMo(S.price)}, ${esc(toolsSorted[0].name)} and ${esc(toolsSorted[1].name)} cost the most`},
    {n:"04",id:"s-guide",title:"Guide",stat:`${guideMin} min read`,
     line:`${num(S.guide.words)} words by ${esc(S.creator.name.split(" ")[0])}, ${guideMin} min read`},
  ];
}

/* The v37 body (everything under the hero), with an id on each section. */
function body352(){
  const name=OPT("name")==="usage"?"Actual Usage":"Stats";
  const rows=OPT("rows")==="tabs"?`<div style="margin-top:36px">${cssTabs("t37")}</div>`:`<div style="margin-top:36px">${statsAccordion()}</div>`;
  const ids=["s-stats","s-projects","s-tools","s-guide"];
  let i=0;
  const html=sec37(1,"01","// sync",name,`30d · all machines<br>updated ${readCheckedAgo}`,statsTop37()+rows)+
    sec37(2,"02","// showcase","Projects",P.length+" projects",projGridV16())+
    sec37(3,"03","// ai components","Tools",`${S.tools.length} tools · ${priceMo(S.price)}`,toolsBodyV16())+
    sec37(0,"04","// writeup","Guide",guideMin+" min read",guideBodyV16());
  return html.replace(/<section /g,()=>`<section id="${ids[i++]}" `)+ctaStrip()+MEDIA_G2+
    `<style>[id^="s-"]{scroll-margin-top:calc(var(--ptop,0px) + 48px)}</style>`;
}

/* shared identity bits */
const avatar352=px=>`<img src="${S.creator.avatar}" alt="" width="${px}" height="${px}" style="display:block;object-fit:cover;flex:none">`;
const byline352=()=>`<span class="mono small"><b class="sec2">${esc(S.creator.name)}</b> <span class="muted">@${esc(S.creator.handle)}</span></span><span class="small lime">✓ verified</span>`;
const actions352=()=>`<span class="chip" style="cursor:pointer">▲ ${UPVOTES}</span><span class="chip" style="cursor:pointer">Share</span><span class="chip" style="cursor:pointer">Report</span>`;

/* =========================================================================
   V38 MASTHEAD + TABS
   ========================================================================= */
function heroA(){
  const sec=sections352();
  const shown=8;
  const act=OPT("act"), rule=OPT("rule"), lbl=OPT("lbl"), nav=OPT("nav");
  const ruleCss=rule==="line"?"border-top:1px solid var(--stroke)":rule==="dim"?"border-top:1px solid oklch(0.55 0.01 256 / 0.25)":"";
  const label=lbl==="runs on"?"runs on":lbl==="tools"?`${S.tools.length} tools`:"";
  /* the three actions, arranged by importance: upvote > share > report */
  const btnUp=`<button class="ha-up" type="button"><span class="tri">▲</span> Upvote <b>${UPVOTES}</b></button>`;
  const btnShare=`<button class="ha-ghost" type="button">Share</button>`;
  const lnkReport=`<a class="ha-quiet" href="#">Report</a>`;
  const actionsUnderTitle=act==="stacked"?`<div style="display:flex;gap:10px;margin-top:22px;align-items:center">${btnUp}${btnShare}</div>`:
    act==="chips"?`<div style="display:flex;gap:6px;margin-top:20px">${actions352()}</div>`:"";
  const actionsInColumn=act==="tile"?`<div style="display:flex;gap:8px;align-items:stretch">${btnUp.replace('class="ha-up"','class="ha-up" style="flex:1;justify-content:center"')}${btnShare}</div>`:"";
  const actionsTopRight=act==="corner"?`<div style="display:flex;gap:8px;align-items:center">${btnUp}${btnShare}</div>`:"";
  const reportSlot=act==="chips"?"":`<span style="margin-left:auto;display:flex;gap:16px;align-items:center" class="mono small muted"><span>updated ${readCheckedAgo}</span>${lnkReport}</span>`;
  return `<section style="background:${TINT4[0]};padding:56px 0 36px"><div style="max-width:1280px;margin:0 auto;padding:0 24px">
   ${act==="corner"?`<div style="display:flex;justify-content:flex-end;margin:-24px 0 8px">${actionsTopRight}</div>`:""}
   <div style="display:grid;grid-template-columns:1fr auto;gap:40px;align-items:end" class="g2">
    <div style="min-width:0">
      <div style="display:flex;align-items:center;gap:12px;flex-wrap:wrap">${avatar352(40)}${byline352()}</div>
      <h1 style="font-size:clamp(44px,7vw,88px);font-weight:900;line-height:.88;letter-spacing:-.03em;text-transform:uppercase;margin-top:20px">${esc(S.name)}</h1>
      <p style="margin-top:16px;font-size:18px;color:var(--fg-secondary);max-width:560px">${esc(S.oneLiner)}</p>
      ${actionsUnderTitle}
    </div>
    <div style="display:grid;gap:10px;min-width:260px" class="ha-tiles">
      ${actionsInColumn}
      <div style="background:var(--lime);color:var(--lime-contrast);padding:18px 20px;box-shadow:4px 4px 0 var(--stroke-strong);cursor:help" title="authored: tools and bundles at list prices">
        <div class="mono" style="font-size:40px;font-weight:900;line-height:1">${price(S.price)}</div>
        <div class="kick" style="margin-top:6px;opacity:.8">per month · solo</div>
      </div>
      <a href="#s-stats" style="position:relative;border:1px solid var(--stroke);padding:18px 20px;display:block;overflow:hidden" title="measured: tokens across all machines, last 30 days">
        <div style="position:absolute;inset:0;opacity:.15;pointer-events:none" aria-hidden="true">${spark(U.series,400,80)}</div>
        <div class="mono" style="font-size:40px;font-weight:900;line-height:1;position:relative">${fmtT(U.totalTokens)}</div>
        <div class="kick muted" style="margin-top:6px;position:relative">tokens · 30 days · <span class="lime">${UP} ×${(U.totalTokens/U.prevTokens).toFixed(0)}</span></div>
      </a>
    </div>
   </div>
   <div style="display:flex;align-items:center;gap:8px;margin-top:${rule==="none"?"36px":"32px"};padding-top:${rule==="none"?"0":"20px"};${ruleCss};flex-wrap:wrap">
     ${label?`<span class="kick muted" style="margin-right:8px">${label}</span>`:""}<a href="#s-tools" style="display:flex;gap:8px;align-items:center">${toolsSorted.slice(0,shown).map(t=>toolIcn(t,28)).join("")}<span class="chip" style="border-color:oklch(0.55 0.01 256 / 0.35)">+${S.tools.length-shown}</span></a>
     ${reportSlot||`<span class="mono small muted" style="margin-left:auto">updated ${readCheckedAgo}</span>`}
   </div>
  </div></section>
  <nav id="ha-tabs" class="ha-tabs ha-nav-${nav}" aria-label="Sections">
   <div style="max-width:1280px;margin:0 auto;padding:0 24px;display:flex;align-items:stretch;overflow-x:auto">
    <span class="ha-id"><b>${esc(S.name)}</b><span class="lime mono" style="font-size:11px">${priceMo(S.price)}</span></span>
    ${sec.map(s=>`<a href="#${s.id}" data-spy="${s.id}" class="ha-tab"><span class="n">${s.n}</span><span class="t">${s.title}</span><span class="s">${s.stat}</span></a>`).join("")}
   </div>
  </nav>
  <style>
   .ha-up{display:inline-flex;align-items:center;gap:8px;background:none;border:1px solid var(--lime);color:var(--lime);font-family:var(--mono);font-size:12px;font-weight:700;letter-spacing:.1em;text-transform:uppercase;padding:10px 16px;cursor:pointer}
   .ha-up:hover{background:var(--lime);color:var(--lime-contrast)}.ha-up .tri{font-size:10px}.ha-up b{font-weight:900}
   .ha-ghost{display:inline-flex;align-items:center;background:none;border:1px solid var(--stroke);color:var(--fg-secondary);font-family:var(--mono);font-size:12px;font-weight:700;letter-spacing:.1em;text-transform:uppercase;padding:10px 16px;cursor:pointer}
   .ha-ghost:hover{border-color:var(--fg-secondary)}
   .ha-quiet{font-family:var(--mono);font-size:11px;color:var(--fg-muted);text-decoration:underline dotted;text-underline-offset:3px}.ha-quiet:hover{color:oklch(0.75 0.15 60)}
   .ha-tabs{position:sticky;top:var(--ptop,0px);z-index:30;background:${TINT4[0]}}
   .ha-tab{display:flex;align-items:baseline;gap:10px;padding:14px 18px 12px;white-space:nowrap;font-family:var(--mono);font-size:12px;font-weight:700;letter-spacing:.1em;text-transform:uppercase;color:var(--fg-muted);box-shadow:inset 0 -3px 0 transparent}
   .ha-tab .n{color:var(--stroke-strong)}.ha-tab .s{font-weight:400;letter-spacing:.04em;text-transform:none;font-size:11px}
   .ha-tab.on{color:var(--lime);box-shadow:inset 0 -3px 0 var(--lime)}.ha-tab.on .n{color:var(--lime)}
   .ha-tab:hover{color:var(--fg-primary)}
   .ha-id{display:none;align-items:center;gap:10px;padding:0 18px 0 0;margin-right:6px;font-size:12px;font-weight:900;text-transform:uppercase;white-space:nowrap}
   .ha-tabs.stuck .ha-id{display:flex}
   /* nav: lines = round 1, quiet = one dim hairline, bare = tint only */
   .ha-nav-lines{border-top:1px solid var(--stroke);border-bottom:1px solid var(--stroke)}
   .ha-nav-lines .ha-tab{border-right:1px solid var(--stroke)}.ha-nav-lines .ha-tab:first-of-type{border-left:1px solid var(--stroke)}
   .ha-nav-quiet{border-bottom:1px solid oklch(0.55 0.01 256 / 0.25)}
   .ha-nav-quiet .ha-tab{padding-left:0;padding-right:0;margin-right:32px}
   .ha-nav-bare{background:${TINT4[1]}}.ha-nav-bare .ha-tab{padding-left:0;padding-right:0;margin-right:32px}
   .ha-nav-bare.stuck{box-shadow:0 8px 24px oklch(0 0 0 / .35)}
   @media(max-width:700px){.ha-tab .s{display:none}.ha-tabs .ha-id{display:none!important}.ha-tab{padding:12px 14px}.ha-nav-quiet .ha-tab,.ha-nav-bare .ha-tab{margin-right:20px}.ha-tiles{grid-template-columns:1fr 1fr}.ha-tiles>div:first-child:not(.ha-tile){grid-column:1/3}}
  </style>`;
}

/* =========================================================================
   V39 FIGURES FIRST
   ========================================================================= */
function heroB(){
  const sec=sections352();
  const figs=[
    {s:sec[0],big:fmtT(U.totalTokens),unit:"tokens · 30 days",viz:spark(U.series,400,60)},
    {s:sec[1],big:String(P.length),unit:`projects · ${num(W.git.commits)} commits`,viz:gitBars(56)},
    {s:sec[2],big:String(S.tools.length),unit:`tools · ${priceMo(S.price)}`,viz:`<div style="display:flex;gap:4px;flex-wrap:wrap;padding:10px 20px 0">${toolsSorted.slice(0,8).map(t=>toolIcn(t,22)).join("")}</div>`},
    {s:sec[3],big:`${guideMin}<span style="font-size:.4em;margin-left:4px">MIN</span>`,unit:"guide by the author",viz:`<div style="display:grid;gap:6px;padding:10px 20px 0">${[1,.8,.9,.6,.85].map(w=>`<span style="height:4px;width:${w*100}%;background:var(--fg-muted)"></span>`).join("")}</div>`},
  ];
  const plain=h=>h.replace(/<[^>]*>/g," ");
  return `<section style="background:${TINT4[0]};padding:40px 0 0"><div style="max-width:1280px;margin:0 auto;padding:0 24px">
    <div style="display:flex;align-items:center;gap:12px;flex-wrap:wrap">
      ${avatar352(28)}<span class="mono" style="font-size:13px;font-weight:900;text-transform:uppercase;letter-spacing:.08em">${esc(S.name)}</span>
      <span class="mono small muted">by ${esc(S.creator.name)} @${esc(S.creator.handle)}</span>
      <span style="margin-left:auto;display:flex;gap:6px">${actions352()}</span></div>
    <div class="hb-grid" style="display:grid;grid-template-columns:repeat(4,1fr);margin-top:36px;border:1px solid var(--stroke)">
      ${figs.map(f=>`<a href="#${f.s.id}" class="hb-fig" style="position:relative;padding:22px 20px 64px;border-right:1px solid var(--stroke);overflow:hidden;display:block;min-width:0">
        <div style="position:absolute;left:0;right:0;bottom:0;height:44px;opacity:.16;pointer-events:none" aria-hidden="true">${f.viz}</div>
        <div class="kick lime" style="position:relative"><span style="color:var(--stroke-strong)">${f.s.n}</span> ${f.s.title}</div>
        <div class="mono" style="font-size:clamp(44px,5.4vw,72px);font-weight:900;line-height:1;margin-top:14px;position:relative">${f.big}</div>
        <div class="kick muted" style="margin-top:8px;position:relative">${f.unit}</div>
        <span class="lime" style="position:absolute;right:16px;top:18px">↓</span></a>`).join("")}
    </div>
    <p style="font-size:clamp(20px,2.4vw,30px);line-height:1.3;max-width:900px;margin:36px 0 0;font-weight:500">${esc(S.oneLiner)}</p>
    <div style="margin-top:32px;border-top:1px solid var(--stroke);display:flex;gap:20px;flex-wrap:wrap;padding:12px 0" class="mono small muted">
      <span><b class="sec2">${num(U.sessions)}</b> sessions</span><span><b class="sec2">${U.activeDays}/30</b> days</span><span><b class="sec2">${W.lead.harnesses}</b> harnesses</span>
      <span style="margin-left:auto">updated ${readCheckedAgo}</span></div>
  </div></section>
  <nav id="hb-rail" class="hb-rail" aria-label="Sections">
    <div class="hb-line"><span id="hb-fill"></span></div>
    ${sec.map(s=>`<a href="#${s.id}" data-spy="${s.id}" class="hb-item"><span class="n">${s.n}</span><span class="t">${s.title}</span></a>`).join("")}
  </nav>
  <nav id="hb-strip" class="hb-strip" aria-label="Sections">
    ${figs.map(f=>`<a href="#${f.s.id}" data-spy="${f.s.id}" class="hb-chip"><span class="n">${f.s.n}</span><b>${plain(f.big)}</b><span class="t">${f.s.title}</span></a>`).join("")}
  </nav>
  <style>
   .hb-fig:last-child{border-right:0!important}
   .hb-fig:hover .kick.lime{text-decoration:underline}
   .hb-rail{position:fixed;left:24px;top:50%;transform:translate(-160%,-50%);transition:transform .25s;z-index:30;display:flex;flex-direction:column;gap:14px;padding-left:16px}
   .hb-rail.shown{transform:translate(0,-50%)}
   .hb-line{position:absolute;left:0;top:0;bottom:0;width:2px;background:var(--stroke)}
   .hb-line span{display:block;width:100%;height:0;background:var(--lime)}
   .hb-item{font-family:var(--mono);font-size:11px;letter-spacing:.12em;text-transform:uppercase;color:var(--fg-muted);display:flex;gap:8px;font-weight:700}
   .hb-item .n{color:var(--stroke-strong)}.hb-item.on{color:var(--lime)}.hb-item.on .n{color:var(--lime)}
   .hb-strip{display:none;position:sticky;top:var(--ptop,0px);z-index:30;background:${TINT4[0]};border-top:1px solid var(--stroke);border-bottom:1px solid var(--stroke);overflow-x:auto;padding:0 8px}
   .hb-chip{display:inline-flex;align-items:baseline;gap:6px;padding:10px 12px;font-family:var(--mono);font-size:11px;color:var(--fg-muted);white-space:nowrap;box-shadow:inset 0 -3px 0 transparent;text-transform:uppercase;letter-spacing:.08em}
   .hb-chip b{color:var(--fg-primary);font-size:13px}.hb-chip .n{color:var(--stroke-strong)}.hb-chip.on{box-shadow:inset 0 -3px 0 var(--lime);color:var(--lime)}.hb-chip.on b,.hb-chip.on .n{color:var(--lime)}
   @media(max-width:1560px){.hb-rail{display:none}.hb-strip{display:flex}}
   @media(max-width:820px){.hb-grid{grid-template-columns:1fr 1fr!important}.hb-fig{border-bottom:1px solid var(--stroke)}.hb-fig:nth-child(2n){border-right:0!important}.hb-fig:nth-child(n+3){border-bottom:0}}
  </style>`;
}

/* =========================================================================
   V40 CONTENTS + SCRUBBER
   ========================================================================= */
function heroC(){
  const sec=sections352();
  return `<section style="background:${TINT4[0]};padding:56px 0 48px"><div style="max-width:1280px;margin:0 auto;padding:0 24px">
   <div style="display:grid;grid-template-columns:minmax(0,7fr) minmax(0,5fr);gap:56px;align-items:start" class="g2">
    <div style="min-width:0">
      <h1 style="font-size:clamp(44px,6.4vw,80px);font-weight:900;line-height:.9;letter-spacing:-.03em;text-transform:uppercase">${esc(S.name)}</h1>
      <p style="margin-top:18px;font-size:18px;color:var(--fg-secondary);max-width:540px">${esc(S.oneLiner)}</p>
      <div style="display:flex;align-items:center;gap:12px;margin-top:24px;flex-wrap:wrap">${avatar352(36)}${byline352()}<span style="display:flex;gap:6px;margin-left:8px">${actions352()}</span></div>
    </div>
    <div style="border-left:2px solid var(--lime)">
      <p class="kick lime" style="padding:0 20px 4px">in this stack</p>
      ${sec.map(s=>`<a href="#${s.id}" class="hc-row" style="display:grid;grid-template-columns:36px 1fr auto;gap:12px;align-items:baseline;padding:14px 20px;border-bottom:1px solid var(--stroke)">
        <span class="mono" style="font-size:12px;font-weight:900;color:var(--stroke-strong)">${s.n}</span>
        <span><b style="font-size:15px;text-transform:uppercase;letter-spacing:-.01em">${s.title}</b><br><span class="small sec2">${s.line}</span></span>
        <span class="lime">↓</span></a>`).join("")}
      <p class="mono small muted" style="padding:12px 20px 0">updated ${readCheckedAgo}</p>
    </div>
   </div>
  </div></section>
  <nav id="hc-bar" class="hc-bar" aria-label="Reading progress">
    <div class="hc-track">${sec.map(s=>`<a href="#${s.id}" data-spy="${s.id}" data-seg="${s.id}" class="hc-seg"><span class="fill"></span><span class="lbl"><span class="n">${s.n}</span> <span class="t">${s.title}</span></span></a>`).join("")}</div>
  </nav>
  <style>
   .hc-row:hover b{color:var(--lime)}
   .hc-bar{position:fixed;left:0;right:0;top:var(--ptop,0px);z-index:30;background:${TINT4[0]};border-bottom:1px solid var(--stroke);transform:translateY(-110%);transition:transform .2s}
   .hc-bar.shown{transform:none}
   .hc-track{display:flex;max-width:1280px;margin:0 auto;padding:0 24px}
   .hc-seg{position:relative;flex:1 1 0;height:34px;display:flex;align-items:center;border-right:1px solid var(--stroke);overflow:hidden;min-width:0}
   .hc-seg:first-child{border-left:1px solid var(--stroke)}
   .hc-seg .fill{position:absolute;left:0;top:0;bottom:0;width:0;background:var(--lime);opacity:.18}
   .hc-seg .lbl{position:relative;padding:0 12px;font-family:var(--mono);font-size:11px;font-weight:700;letter-spacing:.12em;text-transform:uppercase;color:var(--fg-muted);white-space:nowrap}
   .hc-seg .n{color:var(--stroke-strong)}.hc-seg.on .lbl{color:var(--lime)}.hc-seg.on .n{color:var(--lime)}
   .hc-seg.on::after{content:"";position:absolute;left:0;right:0;bottom:0;height:3px;background:var(--lime)}
   @media(max-width:700px){.hc-seg .lbl{padding:0 8px}.hc-seg:not(.on) .t{display:none}}
  </style>`;
}

function renderV38(){return heroA()+body352();}
function renderV39(){return heroB()+body352();}
function renderV40(){return heroC()+body352();}

/* ---------- scroll behavior, wired after every render by the template ---------- */
window.afterRender=function(){
  if(window._nav352)window._nav352();
  window._nav352=null;
  const ptopOf=()=>{const h=document.getElementById("proto-head").offsetHeight;document.documentElement.style.setProperty("--ptop",h+"px");return h;};
  ptopOf();
  const spyLinks=[...document.querySelectorAll("[data-spy]")];
  if(!spyLinks.length)return;
  const ids=[...new Set(spyLinks.map(a=>a.dataset.spy))];
  const secs=ids.map(id=>document.getElementById(id)).filter(Boolean);
  const hero=document.querySelector("#page > section");
  const onScroll=()=>{
    const ptop=ptopOf();
    const line=scrollY+innerHeight*0.3;
    let cur=null;
    for(const s of secs){if(s.offsetTop<=line)cur=s.id;}
    spyLinks.forEach(a=>a.classList.toggle("on",a.dataset.spy===cur));
    const heroGone=hero.getBoundingClientRect().bottom<ptop;
    const tabs=document.getElementById("ha-tabs");
    if(tabs)tabs.classList.toggle("stuck",tabs.getBoundingClientRect().top<=ptop+1);
    const rail=document.getElementById("hb-rail");
    if(rail){rail.classList.toggle("shown",heroGone);const p=scrollY/Math.max(1,document.documentElement.scrollHeight-innerHeight);document.getElementById("hb-fill").style.height=(p*100).toFixed(1)+"%";}
    const bar=document.getElementById("hc-bar");
    if(bar){bar.classList.toggle("shown",heroGone);
      secs.forEach(s=>{const seg=bar.querySelector(`[data-seg="${s.id}"]`);if(!seg)return;seg.style.flexGrow=Math.max(1,s.offsetHeight/100);
        const f=Math.min(1,Math.max(0,(line-s.offsetTop)/s.offsetHeight));seg.querySelector(".fill").style.width=(f*100).toFixed(1)+"%";});}
  };
  onScroll();
  addEventListener("scroll",onScroll,{passive:true});addEventListener("resize",onScroll);
  window._nav352=()=>{removeEventListener("scroll",onScroll);removeEventListener("resize",onScroll);};
};
