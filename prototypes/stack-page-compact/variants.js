/* PROTOTYPE - throwaway (ticket alp82/aistack#351).
   Six full-page renderers over the same real data:
   baseline = today's page reproduced; v1..v5 = compact passes. */
"use strict";

/* =========================================================================
   BASELINE - today's page, spacing and copy faithful to src/features/*.
   Every disclaimer and repeated figure is kept on purpose: this is the
   yardstick the five variants are measured against.
   ========================================================================= */
function renderBaseline(){
  const wrap = inner => `<div style="max-width:1280px;margin:0 auto">${inner}</div>`;
  const sec = (i,bg,inner) => `<section style="padding:96px 24px;background:${bg?"var(--panel30)":"var(--bg-canvas)"}">${wrap(inner)}</section>`;
  const header = (n,kick,title,meta) => `
    <div style="display:flex;flex-wrap:wrap;align-items:flex-end;gap:20px;border-bottom:1px solid var(--stroke);padding-bottom:20px;margin-bottom:40px">
      <span class="mono" style="font-size:72px;font-weight:900;line-height:1;color:var(--stroke-strong)">${n}</span>
      <div style="flex:1;min-width:0">
        <p class="kick lime">${kick}</p>
        <h2 style="font-size:36px;font-weight:900;letter-spacing:-.02em;text-transform:uppercase;margin-top:4px">${title}</h2>
      </div>
      ${meta?`<div class="mono muted" style="font-size:12px;text-transform:uppercase;letter-spacing:.06em">${meta}</div>`:""}
    </div>`;
  const statCell = (fig,name,cap,delta) => `
    <div style="background:var(--bg-canvas);padding:24px 20px;text-align:center">
      <div class="mono" style="font-size:36px;font-weight:900">${fig}</div>
      <div class="kick lime" style="margin-top:12px">${name}</div>
      <div class="small muted" style="margin-top:4px">${cap}</div>
      ${delta?`<div class="small muted" style="margin-top:8px">${delta} <span class="muted">vs the 30 days before</span></div>`:""}
    </div>`;
  const bigCell = (fig,name,cap,body) => `
    <div style="background:var(--bg-canvas);padding:24px">
      <div class="kick lime">${name}</div>
      <div class="mono" style="font-size:34px;font-weight:900;margin-top:10px">${fig}</div>
      <div class="small muted" style="margin-top:2px">${cap}</div>
      <div style="margin-top:20px">${body}</div>
    </div>`;
  const hatch = h => `<div style="height:${h}px;background:repeating-linear-gradient(45deg,var(--bg-panel-muted),var(--bg-panel-muted) 6px,var(--bg-panel) 6px,var(--bg-panel) 12px)"></div>`;

  /* hero */
  const heroTools = S.tools.slice(0,8).map(t=>`
    <span style="display:inline-flex;flex-direction:column;gap:2px;min-width:144px;border:1px solid var(--stroke);padding:12px 16px;text-align:left">
      <b style="font-size:14px">${esc(t.name)}</b><span class="small muted">${esc(t.cat)}</span>
    </span>`).join("");
  const hero = `
  <section style="padding:48px 24px 0;text-align:center">
    <div style="max-width:1024px;margin:0 auto;display:flex;flex-direction:column;align-items:center;gap:32px">
      <p class="small muted">Home / Stacks / ${esc(S.name)}</p>
      <h1 style="font-size:clamp(40px,7vw,72px);font-weight:900;line-height:.9;letter-spacing:-.03em;text-transform:uppercase">${esc(S.name)}</h1>
      <p class="sec2">${esc(S.creator.name)} <span class="muted">@${esc(S.creator.handle)}</span></p>
      <p style="font-size:18px;color:var(--fg-secondary);max-width:640px">${esc(S.oneLiner)}</p>
      <div style="border:1px solid var(--stroke);padding:16px 20px">
        <span class="mono" style="font-size:30px;font-weight:900">${price(S.price)}</span>
        <span class="small muted">/month · Solo</span>
      </div>
      <div style="display:flex;flex-wrap:wrap;gap:12px;justify-content:center">${heroTools}
        <span style="display:inline-flex;align-items:center;min-width:100px;border:1px solid var(--stroke);padding:12px 16px" class="mono muted">+ ${S.tools.length-8} more</span></div>
      <div style="border:1px solid var(--stroke);padding:12px 20px;display:flex;gap:18px;flex-wrap:wrap;justify-content:center" class="small">
        <span class="kick lime">// sync</span>
        <span>${num(U.sessions)} sessions</span><span>${U.activeDays} of the last 30 days</span>
        <span>${esc(U.models[0].name)} leads at ${pct(Math.max(...U.models.map(m=>m.share)))}</span>
        <span class="muted">checked ${readCheckedAgo}</span>
        <span class="lime">Actual Usage ↓</span>
      </div>
      <div style="display:flex;gap:16px" class="mono small muted"><span>▲ 12 upvotes</span><span>Share</span><span>Report</span></div>
    </div>
  </section>`;

  /* nav block */
  const navRows = [
    ["01","Actual Usage",fmtT(U.totalTokens)+" tokens"],
    ["02","Projects",P.length+" projects"],
    ["03","Tools",S.tools.length+" tools · "+priceMo(S.price)],
    ["04","Guide",guideMin+" min read"],
  ].map(([n,t,s])=>`
    <div style="display:flex;align-items:center;gap:16px;padding:16px;border:1px solid var(--stroke);border-top:0">
      <span class="mono lime" style="font-weight:700">${n}</span>
      <span style="flex:1;font-weight:700;text-transform:uppercase" class="mono">${t}</span>
      <span class="small muted">${s}</span>
    </div>`).join("");
  const nav = `<div style="max-width:1280px;margin:0 auto;padding:28px 24px 40px"><div style="border-top:1px solid var(--stroke)">${navRows}</div></div>`;

  /* 01 usage - Time tab shown, as on load */
  const models5 = modelRows.map(m=>`
    <div style="display:flex;align-items:center;gap:14px;padding:12px 0">
      <span style="width:130px;font-size:14px">${esc(m.name)}</span>
      <span class="bar-track" style="height:28px"><span class="bar-fill dim" style="width:${m.share*100}%;outline:1px solid var(--bg-canvas)"></span></span>
      <span class="mono" style="width:52px;text-align:right">${pct(m.share,1)}</span>
    </div>`).join("");
  const usage = sec(1,false, header("01","// sync","Actual Usage",
      `<span class="lime">30 days</span> · 7 days · 24 hours &nbsp; | &nbsp; all machines · checked ${readCheckedAgo}`)+`
    <div style="display:grid;grid-template-columns:minmax(0,352px) 1fr;gap:40px">
      <div>
        <div class="mono" style="font-size:60px;font-weight:900">${fmtT(U.totalTokens)}</div>
        <div class="small muted">tokens · last 30 days &nbsp;<span style="border-bottom:1px dotted var(--stroke)">random fun fact</span></div>
        ${spark(U.series,352,56)}
        <div class="mono" style="font-size:30px;font-weight:900;margin-top:24px">${fmtUSD(U.usd)}</div>
        <div class="small muted">at least, at api list prices · ${U.tables.join(", ")}</div>
        <p class="small muted" style="margin-top:8px">▲ ${num(deltaTokens/U.prevTokens*100)}% <span>vs the 30 days before</span></p>
      </div>
      <div>
        <div style="display:flex;justify-content:space-between;flex-wrap:wrap;gap:8px;margin-bottom:16px">
          <span class="kick lime">where the tokens went</span>
          <span class="small muted">the notch marks where each share stood on Jul 2</span>
        </div>
        ${models5}
      </div>
    </div>
    <div style="margin-top:48px;border-bottom:1px solid var(--stroke);display:flex;flex-wrap:wrap" class="mono">
      ${["Time · 6","Code · 5","Models · 3","Harness · 4","Skills · 2"].map((t,i)=>`<span style="padding:12px 16px;font-size:12px;letter-spacing:.1em;text-transform:uppercase;${i===0?"border-bottom:2px solid var(--lime);color:var(--lime)":"color:var(--fg-muted)"}">${t}</span>`).join("")}
    </div>
    <div style="margin-top:32px;max-width:768px">
      <p class="small muted">${num(W.lead.sessions)} sessions · ${W.lead.harnesses} harnesses · last 30 days</p>
      <div style="margin-top:10px">${phaseStrip(28)}</div>
      <p style="margin-top:14px;font-size:15px">Most measured time in these sessions goes to scout (${pct(W.lead.phaseShare.scout)}), then build (${pct(W.lead.phaseShare.build)}).</p>
      <p class="small muted" style="margin-top:6px">verify in ${pct(W.lead.verify)} of sessions · handoff in ${pct(W.lead.handoff)} of sessions · most start around ${String(W.lead.startHour).padStart(2,"0")}:00 local</p>
      <p class="small muted" style="margin-top:6px;border-bottom:1px dotted var(--stroke);display:inline-block">What the phases mean · What measured time means</p>
    </div>
    <div style="margin-top:24px;display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:1px;border:1px solid var(--stroke);background:var(--stroke)">
      ${statCell(U.activeDays+" of 30","Active days","days with at least one session","▲ 225%")}
      ${bigCell(rowVal(row("component:activity-heatmap")),"When work happens","of activity in the 3 busiest hours",hatch(140))}
      ${bigCell(rowVal(row("component:start-hours")),"Session start times","is the most common start hour",hatch(120))}
      ${statCell(rowVal(row("metric:late-night-commits")),"Late-night commits","of commits between 23:00 and 03:00","")}
      ${bigCell(rowVal(row("component:phase-playbook")),"Session length","median measured session",`
        <p class="small muted">Where the time goes, by session length</p>${hatch(96)}
        <p class="small muted" style="margin-top:10px">Sessions that merged, with and without a verify step.</p>${hatch(56)}`)}
      ${bigCell(rowVal(row("metric:turn-duration")),"Turn length","median turn duration",hatch(90))}
    </div>`);

  /* 02 projects */
  const projRows = P.map(p=>`
    <div style="border-bottom:1px solid var(--stroke);padding:24px 12px;display:flex;gap:16px;align-items:baseline;flex-wrap:wrap">
      <b style="font-size:17px">${esc(p.name)}</b>
      <span class="sec2" style="flex:1;min-width:200px">${esc(p.desc||"")}</span>
      ${p.tags.map(t=>`<span class="chip">${esc(t)}</span>`).join("")}
      ${p.url?`<span class="small lime">Website ↗</span>`:""}
    </div>`).join("");
  const projects = sec(2,true, header("02","// Showcase","Projects",P.length+" projects")+`<div style="margin-bottom:24px"></div>`+projRows);

  /* 03 tools */
  const disc = (label,count)=>`
    <div style="border:1px solid var(--stroke);background:var(--panel30);padding:8px 12px" class="kick lime">▸ ${label} (${count})</div>`;
  const bigCards = toolsSorted.map(t=>`
    <div style="border:1px solid var(--stroke);padding:24px">
      <div style="display:flex;gap:16px;align-items:flex-start">
        <span style="width:56px;height:56px;border:1px solid var(--stroke);display:inline-flex;align-items:center;justify-content:center;font-size:20px;font-weight:700" class="mono lime">${esc(t.name[0])}</span>
        <div style="flex:1">
          <b style="font-size:18px">${esc(t.name)}</b>
          <div class="small muted" style="text-transform:uppercase;margin-top:2px">${esc(t.tier)}</div>
          <div style="margin-top:8px"><span class="chip">${esc(t.cat)}</span></div>
        </div>
        <span class="mono" style="font-size:20px;font-weight:900">${t.bundle?'Bundle ↓':t.amount>0?price(t.amount):"Free"}${!t.bundle&&t.amount>0?`<span class="small muted">/month</span>`:""}</span>
      </div>
      <div style="margin-top:16px;padding-top:6px;display:flex;justify-content:space-between" class="small muted">
        <span></span><span style="text-transform:uppercase;letter-spacing:.06em">Visit ↗</span>
      </div>
    </div>`).join("");
  const tools = sec(3,false, header("03","// AI Components","Tools",`${S.tools.length} items · ${priceMo(S.price)}`)+`
    <div style="display:flex;flex-direction:column;gap:12px;margin-bottom:40px">${disc("MODELS",S.models.length)}${disc("BUNDLES",S.bundles.length)}</div>
    <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(340px,1fr));gap:20px">${bigCards}</div>`);

  /* 04 guide */
  const guide = sec(4,true, header("04","// writeup","Guide")+`
    <div style="max-width:768px">
      <div style="border:1px solid var(--stroke);padding:16px;margin-bottom:24px">
        <p class="kick lime" style="margin-bottom:8px">On this page</p>
        ${S.guide.heads.map(h=>`<p class="small sec2" style="padding:3px 0">${esc(h)}</p>`).join("")}
      </div>
      <p style="font-size:16px;line-height:1.7;color:var(--fg-secondary)">${esc(S.guide.firstp)}</p>
      <p class="small muted" style="margin-top:16px">… ${S.guide.words} words · ${guideMin} min read</p>
    </div>`);

  const cta = `
  <section style="background:var(--lime);padding:96px 24px;text-align:center">
    <h2 style="font-size:clamp(36px,6vw,60px);font-weight:900;letter-spacing:-.03em;line-height:.9;text-transform:uppercase;color:var(--lime-contrast)">Share Your Own Stack</h2>
    <p style="font-size:19px;color:var(--lime-contrast);opacity:.8;margin:24px auto 40px;max-width:640px">Help other builders by sharing the tools, costs, and workflows you run.</p>
    <span class="mono" style="display:inline-block;background:#000;color:#fff;padding:16px 32px;font-weight:700;letter-spacing:.15em;text-transform:uppercase">Create Your Stack →</span>
  </section>`;

  return hero+nav+usage+projects+tools+guide+cta;
}

/* =========================================================================
   Shared compact building blocks. Cut everywhere (all five variants):
   - the nav block (its stats all reappear below)
   - kickers ("// sync" etc.), notch note, "random fun fact",
     per-figure "vs the 30 days before"
   - "Visit" labels -> ↗; per-card "/month" -> one $ column
   - one cost footnote for the whole page instead of captions per figure
   ========================================================================= */
const COST_NOTE = `≥ list prices · ${pct(U.pricedShare)} of tokens priced · ${U.tables.join(" · ")}`;
const wfCells = W.rows.map(r=>({name:r.name,fig:rowVal(r),label:r.label}));

/* =========================================================================
   V1 TIGHT EDITORIAL - today's layout language at half rhythm.
   Numbered sections stay; the numeral moves inline; py 96->40; cards -> rows.
   ========================================================================= */
function renderV1(){
  const sec=(bg,inner)=>`<section style="padding:40px 24px;background:${bg?"var(--panel30)":"var(--bg-canvas)"}"><div style="max-width:1280px;margin:0 auto">${inner}</div></section>`;
  const head=(n,t,meta)=>`
    <div style="display:flex;align-items:baseline;gap:14px;border-bottom:1px solid var(--stroke);padding-bottom:10px;margin-bottom:20px">
      <span class="mono lime" style="font-size:20px;font-weight:900">${n}</span>
      <h2 style="font-size:22px;font-weight:900;letter-spacing:-.01em;text-transform:uppercase;flex:1">${t}</h2>
      ${meta?`<span class="small muted">${meta}</span>`:""}
    </div>`;
  const hero=`
  <section style="padding:28px 24px 0"><div style="max-width:1280px;margin:0 auto">
    <div style="display:flex;flex-wrap:wrap;align-items:baseline;gap:16px">
      <h1 style="font-size:clamp(28px,4.5vw,44px);font-weight:900;letter-spacing:-.02em;text-transform:uppercase">${esc(S.name)}</h1>
      <span class="mono" style="font-size:20px;font-weight:900">${priceMo(S.price)}</span>
      <span class="small muted">▲ 12</span>
      <span class="small muted" style="margin-left:auto">${esc(S.creator.name)} @${esc(S.creator.handle)} · Share · Report</span>
    </div>
    <p class="sec2" style="margin-top:6px">${esc(S.oneLiner)}</p>
    <div style="display:flex;gap:18px;flex-wrap:wrap;margin-top:14px;border:1px solid var(--stroke);padding:8px 14px" class="small">
      <span><b class="mono">${fmtT(U.totalTokens)}</b> tokens / 30d</span>
      <span><b class="mono">${num(U.sessions)}</b> sessions</span>
      <span><b class="mono">${S.tools.length}</b> tools</span>
      <span><b class="mono">${P.length}</b> projects</span>
      <span class="muted">checked ${readCheckedAgo}</span>
    </div>
  </div></section>`;
  const models5=modelRows.map(m=>`
    <div style="display:flex;align-items:center;gap:10px;padding:4px 0">
      <span style="width:120px;font-size:13px">${esc(m.name)}</span>${shareBar(m.share,true)}
      <span class="mono small" style="width:44px;text-align:right">${pct(m.share,1)}</span>
    </div>`).join("");
  const cells=wfCells.map(c=>`
    <div style="background:var(--bg-canvas);padding:12px 14px">
      <div style="display:flex;align-items:baseline;gap:8px"><span class="mono" style="font-size:20px;font-weight:900">${c.fig}</span><span class="small lime">${c.name}</span></div>
      <div class="small muted" style="margin-top:2px">${c.label}</div>
    </div>`).join("");
  const usage=sec(false,head("01","Actual Usage",`<span class="lime">30d</span> · 7d · 24h`)+`
    <div style="display:grid;grid-template-columns:minmax(0,300px) 1fr;gap:28px">
      <div>
        <div class="mono" style="font-size:40px;font-weight:900">${fmtT(U.totalTokens)} <span class="small muted" style="font-weight:400">tokens</span></div>
        ${spark(U.series,300,40)}
        <div class="mono" style="font-size:22px;font-weight:900;margin-top:10px">${fmtUSD(U.usd)} <span class="small muted" style="font-weight:400">▲ vs prior 30d</span></div>
        <div class="small muted" style="margin-top:4px">${U.activeDays} active days · ${num(U.sessions)} sessions · ${pct(U.cacheHitShare,1)} cache hits</div>
      </div>
      <div>${models5}
        <div style="margin-top:10px">${phaseStrip(16)}</div>
      </div>
    </div>
    <div style="margin-top:20px;display:grid;grid-template-columns:repeat(auto-fill,minmax(230px,1fr));gap:1px;border:1px solid var(--stroke);background:var(--stroke)">${cells}</div>
    <p class="small muted" style="margin-top:8px">${COST_NOTE}</p>`);
  const projects=sec(true,head("02","Projects",P.length+" projects")+
    `<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(320px,1fr));gap:10px">`+
    P.map(p=>`<div style="border:1px solid var(--stroke);padding:10px 14px">
      <div style="display:flex;justify-content:space-between;gap:8px"><b>${esc(p.name)}</b>${p.url?`<span class="small lime">↗</span>`:""}</div>
      ${p.desc?`<p class="small sec2" style="margin-top:3px">${esc(p.desc)}</p>`:""}
      <p class="small muted" style="margin-top:4px">${p.tags.join(" · ")}</p>
    </div>`).join("")+`</div>`);
  const toolRows=toolsSorted.map(t=>`
    <div style="display:flex;align-items:center;gap:12px;border:1px solid var(--stroke);padding:8px 12px">
      <span style="width:28px;height:28px;border:1px solid var(--stroke);display:inline-flex;align-items:center;justify-content:center" class="mono lime">${esc(t.name[0])}</span>
      <b style="flex:1">${esc(t.name)}</b>
      <span class="small muted">${esc(t.cat)}</span>
      <span class="small muted" style="text-transform:uppercase">${esc(t.tier)}</span>
      <span class="mono" style="width:64px;text-align:right;font-weight:700">${t.bundle?"bundle":t.amount>0?price(t.amount):"free"}</span>
    </div>`).join("");
  const tools=sec(false,head("03","Tools",`${S.tools.length} · ${priceMo(S.price)}`)+`
    <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(360px,1fr));gap:8px">${toolRows}</div>
    <div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:12px">
      <span class="chip">Models (${S.models.length}): ${S.models.map(m=>esc(m.name)).join(", ")}</span>
      <span class="chip">${esc(S.bundles[0].name)} · ${priceMo(S.bundles[0].amount)}</span>
    </div>`);
  const guide=sec(true,head("04","Guide",guideMin+" min read")+`
    <div style="max-width:768px">
      <p class="small lime" style="margin-bottom:8px">${S.guide.heads.map(esc).join(" · ")}</p>
      <p style="line-height:1.65;color:var(--fg-secondary)">${esc(S.guide.firstp)} <span class="lime small">read all →</span></p>
    </div>`);
  const cta=`<section style="background:var(--lime);padding:18px 24px;display:flex;justify-content:center;gap:18px;align-items:center;flex-wrap:wrap">
    <b style="color:var(--lime-contrast);text-transform:uppercase" class="mono">Share your own stack</b>
    <span class="mono" style="background:#000;color:#fff;padding:8px 18px;font-size:12px;text-transform:uppercase">Create →</span></section>`;
  return hero+usage+projects+tools+guide+cta;
}

/* =========================================================================
   V2 LEDGER - a monospace data sheet. No cards: every section is a ruled
   table under a one-line heading. Density from columns, not padding.
   ========================================================================= */
function renderV2(){
  const wrap=i=>`<div style="max-width:1080px;margin:0 auto;padding:0 24px">${i}</div>`;
  const h=(n,t,tail)=>`<div class="mono" style="display:flex;gap:12px;align-items:baseline;margin:36px 0 12px;border-bottom:2px solid var(--fg-primary);padding-bottom:6px">
    <span class="lime" style="font-weight:700">${n}</span><b style="text-transform:uppercase;letter-spacing:.08em">${t}</b>
    <span class="small muted" style="margin-left:auto">${tail||""}</span></div>`;
  const tr=(cells,strong)=>`<div style="display:flex;gap:14px;padding:6px 0;border-bottom:1px solid var(--stroke);align-items:baseline${strong?";font-weight:700":""}" class="mono small">${cells}</div>`;
  const td=(txt,flex,align)=>`<span style="flex:${flex};text-align:${align||"left"};min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${txt}</span>`;
  const hero=`<div style="padding-top:28px">${wrap(`
    <div class="mono"><span class="lime">stack/</span><b style="font-size:26px;text-transform:uppercase;letter-spacing:.02em">${esc(S.name)}</b></div>
    <p class="sec2" style="margin-top:4px">${esc(S.oneLiner)}</p>
    <div class="mono small" style="margin-top:10px;display:flex;gap:0;flex-wrap:wrap;border:1px solid var(--stroke)">
      ${[["owner","@"+S.creator.handle],["cost",priceMo(S.price)],["tokens 30d",fmtT(U.totalTokens)],["spend 30d",fmtUSD(U.usd)],["sessions",num(U.sessions)],["upvotes","12"]]
        .map(([k,v])=>`<span style="padding:8px 14px;border-right:1px solid var(--stroke)"><span class="muted">${k}</span> <b>${v}</b></span>`).join("")}
    </div>`)}</div>`;
  const usage=wrap(h("01","actual usage",`30d · checked ${readCheckedAgo}`)+
    `<div style="display:flex;gap:24px;align-items:flex-end;flex-wrap:wrap;margin:8px 0 14px">
      <span class="mono" style="font-size:44px;font-weight:900;line-height:1">${fmtT(U.totalTokens)}</span>
      <span style="flex:1;min-width:200px">${spark(U.series,400,44)}</span>
      <span class="mono" style="font-size:26px;font-weight:900">${fmtUSD(U.usd)}</span>
    </div>`+
    modelRows.map(m=>tr(td(esc(m.name),"0 0 150px")+`<span style="flex:1;display:flex;align-items:center">${shareBar(m.share,true)}</span>`+td(pct(m.share,1),"0 0 48px","right")+td(fmtUSD(m.usd),"0 0 60px","right"))).join("")+
    `<div style="height:10px"></div>`+
    `<div style="columns:2;column-gap:40px;column-rule:1px solid var(--stroke)">`+
    wfCells.map(c=>`<div style="display:flex;gap:10px;padding:5px 0;border-bottom:1px solid var(--stroke);break-inside:avoid" class="mono small">
        <span class="muted" style="flex:1">${c.name.toLowerCase()}</span><b>${c.fig}</b><span class="muted" style="flex:1.6;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${c.label}</span></div>`).join("")+
    `</div><p class="small muted mono" style="margin-top:8px">${COST_NOTE}</p>`);
  const projects=wrap(h("02","projects",P.length+"")+P.map(p=>tr(
    td("<b>"+esc(p.name)+"</b>","0 0 140px")+td(esc(p.desc||""), "1")+td(p.tags.join(","),"0 0 200px")+td(p.url?"↗":"","0 0 20px","right"))).join(""));
  const tools=wrap(h("03","tools",`${S.tools.length} · ${priceMo(S.price)}`)+toolsSorted.map(t=>tr(
    td("<b>"+esc(t.name)+"</b>","0 0 140px")+td(esc(t.cat),"1")+td(esc(t.tier),"0 0 160px")+td(t.bundle?"bundle":t.amount>0?price(t.amount):"0","0 0 60px","right"))).join("")+
    tr(td("models","0 0 140px")+td(S.models.map(m=>esc(m.name)).join(", "),"1")+td(String(S.models.length),"0 0 60px","right"))+
    tr(td("bundle","0 0 140px")+td(esc(S.bundles[0].name)+" · "+esc(S.bundles[0].tier),"1")+td(price(S.bundles[0].amount),"0 0 60px","right")));
  const guide=wrap(h("04","guide",guideMin+" min")+`
    <p class="mono small lime">${S.guide.heads.map(esc).join("  /  ")}</p>
    <p style="max-width:700px;margin-top:8px;line-height:1.6;color:var(--fg-secondary)">${esc(S.guide.firstp)} <span class="lime mono small">→</span></p>
    <div style="height:36px"></div>`);
  const cta=`<div style="border-top:2px solid var(--lime);padding:14px 24px;text-align:center" class="mono small"><span class="lime">$</span> share your own stack → <b>aistack.to/stacks/new</b></div>`;
  return hero+usage+projects+tools+guide+cta;
}

/* =========================================================================
   V3 MOSAIC - a dashboard of uniform tiles. No tabs: all 15 measurements
   visible at once as small tiles. Sections divided by hairlines only.
   ========================================================================= */
function renderV3(){
  const wrap=i=>`<div style="max-width:1280px;margin:0 auto;padding:0 24px">${i}</div>`;
  const kick=t=>`<p class="kick muted" style="margin:28px 0 10px">${t}</p>`;
  const tile=(inner,span)=>`<div style="border:1px solid var(--stroke);padding:14px;grid-column:span ${span||1}">${inner}</div>`;
  const stat=(fig,label)=>tile(`<div class="mono" style="font-size:26px;font-weight:900">${fig}</div><div class="small muted" style="margin-top:3px">${label}</div>`);
  const hero=`<div style="padding-top:28px">${wrap(`
    <div style="display:flex;flex-wrap:wrap;gap:14px;align-items:baseline">
      <h1 style="font-size:clamp(26px,4vw,40px);font-weight:900;text-transform:uppercase;letter-spacing:-.02em">${esc(S.name)}</h1>
      <span class="sec2">${esc(S.oneLiner)}</span>
    </div>
    <p class="small muted" style="margin-top:4px">${esc(S.creator.name)} @${esc(S.creator.handle)} · ▲ 12 · Share · Report</p>`)}</div>`;
  const grid=(cols,items)=>`<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(${cols}px,1fr));gap:8px">${items}</div>`;
  const usage=wrap(kick("actual usage · 30 days · checked "+readCheckedAgo)+
    grid(180,[
      tile(`<div class="mono" style="font-size:34px;font-weight:900">${fmtT(U.totalTokens)}</div><div class="small muted">tokens</div>${spark(U.series,220,36)}`,2),
      stat(fmtUSD(U.usd),"spend, ≥ list prices"),
      stat(num(U.sessions),"sessions"),
      stat(U.activeDays+"/30","active days"),
      stat(pct(U.cacheHitShare,1),"cache hits"),
      tile(`<div class="small muted" style="margin-bottom:6px">tokens by model</div>`+modelRows.map(m=>`
        <div style="display:flex;gap:8px;align-items:center;padding:2px 0" class="small"><span style="width:104px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${esc(m.name)}</span>${shareBar(m.share,true)}<span class="mono" style="width:40px;text-align:right">${pct(m.share)}</span></div>`).join(""),2),
      tile(`<div class="small muted" style="margin-bottom:6px">measured time by phase</div>${phaseStrip(16)}`,2),
    ].join(""))+
    `<div style="height:8px"></div>`+
    grid(180,wfCells.map(c=>stat(c.fig,`<b class="sec2">${c.name}</b> · ${c.label}`)).join(""))+
    `<p class="small muted" style="margin-top:8px">${COST_NOTE}</p>`);
  const projects=wrap(kick("projects · "+P.length)+grid(240,P.map(p=>tile(
      `<b>${esc(p.name)}</b>${p.url?` <span class="small lime">↗</span>`:""}<p class="small sec2" style="margin-top:4px">${esc(p.desc||"")}</p><p class="small muted" style="margin-top:4px">${p.tags.join(" · ")}</p>`)).join("")));
  const tools=wrap(kick(`tools · ${S.tools.length} · ${priceMo(S.price)}`)+grid(200,
      toolsSorted.map(t=>tile(`<div style="display:flex;justify-content:space-between;align-items:baseline"><b>${esc(t.name)}</b><span class="mono small" style="font-weight:700">${t.bundle?"bundle":t.amount>0?price(t.amount):"free"}</span></div><div class="small muted" style="margin-top:2px">${esc(t.cat)} · ${esc(t.tier)}</div>`)).join("")+
      tile(`<b class="small">Models (${S.models.length})</b><p class="small muted" style="margin-top:4px">${S.models.map(m=>esc(m.name)).join(", ")}</p>`,2)+
      tile(`<b class="small">${esc(S.bundles[0].name)}</b><p class="small muted" style="margin-top:4px">${esc(S.bundles[0].tier)} · ${priceMo(S.bundles[0].amount)}</p>`)));
  const guide=wrap(kick("guide · "+guideMin+" min read")+
    `<div style="border:1px solid var(--stroke);padding:14px;max-width:768px"><p class="small lime">${S.guide.heads.map(esc).join(" · ")}</p>
     <p style="margin-top:8px;line-height:1.6;color:var(--fg-secondary)">${esc(S.guide.firstp)} <span class="lime small">read all →</span></p></div>
     <div style="height:32px"></div>`);
  const cta=`<div style="background:var(--lime);padding:14px 24px;text-align:center" class="mono"><b style="color:var(--lime-contrast);text-transform:uppercase;font-size:13px">Share your own stack →</b></div>`;
  return hero+usage+projects+tools+guide+cta;
}

/* =========================================================================
   V4 SPLIT RAIL - sticky identity rail on the left (replaces hero, nav and
   CTA), content flows right in one tight column.
   ========================================================================= */
function renderV4(){
  const rail=`
  <aside style="position:sticky;top:46px;align-self:start;display:flex;flex-direction:column;gap:14px;padding:24px 20px;border-right:1px solid var(--stroke);min-height:60vh">
    <h1 style="font-size:24px;font-weight:900;line-height:1.05;text-transform:uppercase;letter-spacing:-.01em">${esc(S.name)}</h1>
    <p class="small sec2">${esc(S.oneLiner)}</p>
    <p class="small muted">${esc(S.creator.name)} @${esc(S.creator.handle)}</p>
    <div class="mono" style="font-size:28px;font-weight:900">${priceMo(S.price)}</div>
    <div class="small muted">▲ 12 upvotes · Share · Report</div>
    <hr class="rule">
    ${[["01 Usage",fmtT(U.totalTokens)+" tok"],["02 Projects",P.length],["03 Tools",S.tools.length+" · "+priceMo(S.price)],["04 Guide",guideMin+" min"]]
      .map(([t,s])=>`<div style="display:flex;justify-content:space-between" class="mono small"><b>${t}</b><span class="muted">${s}</span></div>`).join("")}
    <hr class="rule">
    <p class="small muted">Share your own stack</p>
    <span class="mono small" style="border:1px solid var(--stroke-strong);padding:6px 10px;text-align:center;text-transform:uppercase">Create →</span>
  </aside>`;
  const h=(n,t,meta)=>`<div style="display:flex;align-items:baseline;gap:10px;margin:26px 0 12px"><span class="mono lime" style="font-weight:900">${n}</span><b style="text-transform:uppercase;letter-spacing:.04em">${t}</b><span class="small muted" style="margin-left:auto">${meta||""}</span></div>`;
  const usage=h("01","Actual usage",`30d · checked ${readCheckedAgo}`)+`
    <div style="display:flex;gap:18px;align-items:flex-end;flex-wrap:wrap">
      <span class="mono" style="font-size:38px;font-weight:900;line-height:1">${fmtT(U.totalTokens)}<span class="small muted" style="font-weight:400"> tokens</span></span>
      <span class="mono" style="font-size:22px;font-weight:900">${fmtUSD(U.usd)}</span>
      <span class="small muted">${num(U.sessions)} sessions · ${U.activeDays}/30 days · ${pct(U.cacheHitShare,1)} cached</span>
    </div>
    ${spark(U.series,560,40)}
    <div style="margin:10px 0 6px">${modelRows.map(m=>`
      <div style="display:flex;gap:10px;align-items:center;padding:2px 0" class="small"><span style="width:110px">${esc(m.name)}</span>${shareBar(m.share,true)}<span class="mono" style="width:40px;text-align:right">${pct(m.share)}</span></div>`).join("")}</div>
    ${phaseStrip(14)}
    <div style="margin-top:12px">${wfCells.map(c=>`
      <div style="display:flex;gap:10px;padding:5px 0;border-bottom:1px solid var(--stroke);align-items:baseline">
        <b class="mono" style="width:64px;text-align:right;flex:none">${c.fig}</b>
        <span class="small"><b class="sec2">${c.name}</b> <span class="muted">· ${c.label}</span></span></div>`).join("")}</div>
    <p class="small muted" style="margin-top:6px">${COST_NOTE}</p>`;
  const projects=h("02","Projects",P.length)+P.map(p=>`
      <div style="display:flex;gap:10px;padding:6px 0;border-bottom:1px solid var(--stroke);align-items:baseline;flex-wrap:wrap">
        <b style="width:120px;flex:none">${esc(p.name)}</b><span class="small sec2" style="flex:1;min-width:180px">${esc(p.desc||"")}</span><span class="small muted">${p.tags.join(" · ")}</span>${p.url?`<span class="small lime">↗</span>`:""}</div>`).join("");
  const tools=h("03","Tools",`${S.tools.length} · ${priceMo(S.price)}`)+toolsSorted.map(t=>`
      <div style="display:flex;gap:10px;padding:6px 0;border-bottom:1px solid var(--stroke);align-items:baseline">
        <b style="width:120px;flex:none">${esc(t.name)}</b><span class="small muted" style="flex:1">${esc(t.cat)} · ${esc(t.tier)}</span>
        <span class="mono small" style="font-weight:700">${t.bundle?"bundle":t.amount>0?price(t.amount):"free"}</span></div>`).join("")+
    `<p class="small muted" style="margin-top:8px">Models: ${S.models.map(m=>esc(m.name)).join(", ")} · ${esc(S.bundles[0].name)} ${priceMo(S.bundles[0].amount)}</p>`;
  const guide=h("04","Guide",guideMin+" min read")+`
    <p class="small lime">${S.guide.heads.map(esc).join(" · ")}</p>
    <p style="margin-top:8px;line-height:1.65;color:var(--fg-secondary)">${esc(S.guide.firstp)} <span class="lime small">read all →</span></p>
    <div style="height:40px"></div>`;
  return `<div style="max-width:1180px;margin:0 auto;display:grid;grid-template-columns:250px 1fr" class="v4grid">
    ${rail}<div style="padding:0 24px;min-width:0">${usage+projects+tools+guide}</div></div>
    <style>@media(max-width:760px){.v4grid{grid-template-columns:1fr!important}.v4grid aside{position:static!important;border-right:0!important;border-bottom:1px solid var(--stroke)}}</style>`;
}

/* =========================================================================
   V5 DIGEST - one narrow column. Every section is a bold summary sentence
   with figures inline; detail sits behind native <details>.
   ========================================================================= */
function renderV5(){
  const wrap=i=>`<div style="max-width:680px;margin:0 auto;padding:0 24px">${i}</div>`;
  const det=(sum,body)=>`<details style="margin-top:10px"><summary class="mono small lime" style="cursor:pointer">${sum}</summary><div style="margin-top:10px">${body}</div></details>`;
  const block=(n,t,inner)=>`<div style="padding:26px 0;border-bottom:1px solid var(--stroke)"><p class="kick muted" style="margin-bottom:10px">${n} · ${t}</p>${inner}</div>`;
  const hero=`<div style="padding-top:32px">${wrap(`
    <h1 style="font-size:clamp(30px,5vw,42px);font-weight:900;text-transform:uppercase;letter-spacing:-.02em;line-height:1">${esc(S.name)}</h1>
    <p class="sec2" style="margin-top:8px">${esc(S.oneLiner)}</p>
    <p class="small muted" style="margin-top:6px">${esc(S.creator.name)} @${esc(S.creator.handle)} · ${priceMo(S.price)} · ▲ 12 · Share · Report</p>`)}</div>`;
  const podium=wfCells.slice(0,3);
  const usage=block("01","actual usage",`
    <p style="font-size:17px;line-height:1.6"><b class="mono">${fmtT(U.totalTokens)} tokens</b> and <b class="mono">${fmtUSD(U.usd)}</b> in the last 30 days,
      over <b class="mono">${num(U.sessions)}</b> sessions on <b class="mono">${U.activeDays}</b> days.
      ${esc(U.models[0].name)} leads at ${pct(Math.max(...U.models.map(m=>m.share)))}, ${pct(U.cacheHitShare)} of input comes from cache.</p>
    ${spark(U.series,560,36)}
    <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-top:10px">
      ${podium.map(c=>`<div style="border:1px solid var(--stroke);padding:10px"><div class="mono" style="font-size:20px;font-weight:900">${c.fig}</div><div class="small muted">${c.name}</div></div>`).join("")}
    </div>
    ${det("all 15 measurements + model mix",modelRows.map(m=>`
        <div style="display:flex;gap:10px;align-items:center;padding:2px 0" class="small"><span style="width:110px">${esc(m.name)}</span>${shareBar(m.share,true)}<span class="mono" style="width:40px;text-align:right">${pct(m.share)}</span></div>`).join("")+
      `<div style="margin-top:8px">${phaseStrip(14)}</div>`+
      wfCells.map(c=>`<div style="display:flex;gap:10px;padding:4px 0;border-bottom:1px solid var(--stroke)" class="small"><b class="mono" style="width:60px;text-align:right;flex:none">${c.fig}</b><span><b class="sec2">${c.name}</b> <span class="muted">· ${c.label}</span></span></div>`).join(""))}
    <p class="small muted" style="margin-top:8px">${COST_NOTE} · checked ${readCheckedAgo}</p>`);
  const projects=block("02","projects",`
    <p style="font-size:16px;line-height:1.6">${P.length} projects built on this stack: ${P.map(p=>p.url?`<b>${esc(p.name)}</b>`:esc(p.name)).join(", ")}.</p>
    ${det("project details",P.map(p=>`<p class="small" style="padding:4px 0"><b>${esc(p.name)}</b> <span class="sec2">${esc(p.desc||"")}</span> <span class="muted">${p.tags.join(" · ")}</span></p>`).join(""))}`);
  const paid=toolsSorted.filter(t=>t.amount>0&&!t.bundle);
  const tools=block("03","tools",`
    <p style="font-size:16px;line-height:1.6">${S.tools.length} tools for <b class="mono">${priceMo(S.price)}</b>:
      ${paid.map(t=>`<b>${esc(t.name)}</b> ${price(t.amount)}`).join(", ")}, the rest free or in ${esc(S.bundles[0].name)} (${priceMo(S.bundles[0].amount)}).</p>
    ${det(`all ${S.tools.length} tools + ${S.models.length} models`,
      toolsSorted.map(t=>`<div style="display:flex;gap:10px;padding:3px 0" class="small"><b style="width:120px;flex:none">${esc(t.name)}</b><span class="muted" style="flex:1">${esc(t.cat)} · ${esc(t.tier)}</span><span class="mono">${t.bundle?"bundle":t.amount>0?price(t.amount):"free"}</span></div>`).join("")+
      `<p class="small muted" style="margin-top:6px">Models: ${S.models.map(m=>esc(m.name)).join(", ")}</p>`)}`);
  const guide=block("04","guide",`
    <p style="font-size:16px;line-height:1.65;color:var(--fg-secondary)">${esc(S.guide.firstp)}</p>
    <p class="small lime" style="margin-top:8px">${S.guide.heads.map(esc).join(" · ")} · ${guideMin} min → read the guide</p>`);
  const cta=`<div style="text-align:center;padding:20px" class="mono small"><span style="background:var(--lime);color:var(--lime-contrast);padding:8px 16px;font-weight:700;text-transform:uppercase">Share your own stack →</span></div>`;
  return hero+wrap(usage+projects+tools+guide)+cta;
}
