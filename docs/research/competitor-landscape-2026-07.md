# Competitor landscape & the open USP gap (2026-07-15)

Ticket: https://github.com/alp82/aistack/issues/6 (part of the direction/USP map, #3)

**Method.** Five parallel web-research sweeps (all claims verified against the live web on 2026-07-15 unless flagged): (1) stack-sharing & AI tool directories, (2) marketplaces & identity surfaces for AI expertise, (3) learning/knowledge hubs for AI-using builders, (4) directories for skills/rules/prompts/MCP servers, (5) AI-config portability & sync tooling. Analytics baseline from `usage-analytics-2026-07.md`: stack pages already work as shareable identity artifacts; the CLI loop has zero non-owner adoption; one-shot usage dominates.

---

## TL;DR

- **The candidate gaps (3), each unowned as of July 2026:**
  1. **Person-centric AI-stack identity + community** - the StackShare position, vacated by acquisition, translated to the AI era. Two 2026 entrants each hold half of it; neither has traction.
  2. **The provenance layer for AI artifacts** - "the stacks behind the artifacts": every skill/rule/MCP config attested by a real builder's full working setup. Every existing directory lists anonymous atoms; nobody lists person-anchored molecules.
  3. **Living, price-honest, cross-tool workflow knowledge** - structured community-sourced stack data with real costs and freshness signals, in a comparison space otherwise owned by SEO slop and vendor academies.
- **CLI collect/create verdict: a nice-to-have without a moat.** There is no technical moat (a weekend build; a near-exact clone exists at the same zero adoption), the substitute (git + chezmoi) is free and culturally entrenched among exactly the target users, and Anthropic can absorb the sync half with one "sign in to sync" release. Reposition it as a convenience on-ramp to the stack page rather than the USP.
- **The three gaps compose:** the stack page is the atom; provenance and the knowledge layer are aggregations of it. The retention problem the analytics already named (no reason to return) is a bigger threat than any competitor. No player in any of the five categories has solved "community around stack identity" either.

---

## 1. Stack-sharing & tool directories

**Direct "share your stack" products:**

- **StackShare** (stackshare.io) - the original stack-identity community (~1.5M devs at peak). Acquired by FOSSA Aug 2024 ([TechCrunch](https://techcrunch.com/2024/08/01/open-source-startup-fossa-is-buying-stackshare-a-site-used-by-1-5-million-developers/)); Enterprise sunset, team gone, focus shifted to a machine-readable "Tech Stack File" for compliance. It is in zombie mode (403-blocked to fetches; liveness inferred from third-party signals). It never covered the AI-era stack (agents, rules, MCP, prompts). **The "stack as identity" position is vacant.**
- **stackd.cc** - "The AI tools people actually run": live leaderboard of AI tool *combinations* by adoption/upvotes. Solo maker, launched ~June 2026, PH 95 upvotes. Deliberately **anonymous and aggregate** - no personal pages, no notes, no config.
- **StackMyAI** (stackmy.ai) - **near-identical thesis to aistack**: public profile at `stackmy.ai/username` with tools/prompts/skills + `npx stackmyai install username` to import the whole stack locally. Solo builder. Verified via npm API: **20 downloads/month, v0.0.2, last publish 2026-05-03** - its "14.2k imports this month" homepage claim is not credible. (aistack's own CLI: 48 downloads/month, statistically indistinguishable from zero.) It has no community layer and is curation-first rather than scan-first.
- **The /uses movement** (uses.tech, usesthis.com) - 1,000+ hand-built pages, awesome-uses ~5.3k stars still maintained; usesthis.com: 1,305 interviews since 2009, latest June 30 2026. This is 17 years of proof that "my setup as shareable identity artifact" is durable organic behavior, and that nobody has productized it.
- **Peerlist** (peerlist.io) - proof-of-work dev profiles, $1.1M seed, alive. Stack is a logo wall inside a resume; no AI structure, no per-tool notes.
- **read.cv** - cautionary precedent: beloved identity-page product, acquired by Perplexity Jan 2025, **shut down May 2025**. The artifact gets shared; retention/monetization is the hard part.

**AI tool directories (discovery layer):** There's An AI For That (~50,900 tools, ~9.8M visits/mo per Semrush), Toolify (~29,860 tools, pure SEO/placement-fee machine), Futurepedia (pivoting to education), FutureTools (creator-media business - Matt Wolfe's audience is the moat). All of them are saturated and placement-monetized, all are being squeezed by AI answer engines, and none has a person-centric stack/identity feature. Competing on catalog breadth would fail from the start.

**Category verdict:** discovery is saturated; person-centric stack identity + community is open. Three solo builders (aistack, stackd.cc, StackMyAI) independently converged on the position in the same window, all at ~100-user scale. The position is real, but nobody has demonstrated the *community* half.

## 2. Marketplaces & identity surfaces for AI expertise

- **Generalists:** Upwork's AI-services demand +109% YoY with every listed AI skill clearing $100K+ in completed earnings; has a "vibe coding developers" hire hub. Fiverr: AI-agent searches +18,347%; Fiverr Go trains a personal AI on the freelancer. Toptal/Braintrust/A.Team: closed-door vetting → private badge, nothing the builder owns. Contra: closest to "portfolio as storefront" but shows outputs, not the AI workflow behind them.
- **AI-specific wave:** Mercor ($10B Series C, reportedly raising at ~$20B) is really *expert labor for AI labs*, a different buyer. Fractional-CAIO matchers (Go Fractional, Fractionus, chiefaiofficer.com) prove companies pay $5K–$30K/mo for **AI judgment** - but credential = prior exec history; indie builders are structurally excluded.
- **stack.expert** - sells *becoming* an AI consultant ($2,500/yr program + "Stack Certification" + directory). It monetizes the builder rather than the match. It even chose the name "Stack": the framing "your stack = your expertise" is already circulating.
- **LinkedIn Verified AI Skills Certificates (Jan 2026)** - the most important move here: certificates verified by **actual product-usage telemetry** (Descript, Lovable, Replit, Relay at launch; GitHub slated). This is the first mainstream **workflow-as-proof** mechanism, but it is per-tool, BD-gated, and a black-box badge inside a resume platform, with no composed stack, no costs, and no narrative.
- **Vendor certs:** Anthropic's Pearson VUE certification track (4 exams live by July 2026), Microsoft AI Agent Builder Associate. These are exam-shaped, single-vendor, and commoditizing within months.
- **Vibe-coder directories** (GoodVibeCode - literally 7 profiles, Match.dev): the first surfaces where the toolchain itself is the advertised credential. Both are toy-sized with zero verification: the concept is validated, the execution absent.

**Category verdict:** money demonstrably flows to AI fluency, but through outcome-verified channels (reviews, vetting, telemetry badges). **"Your AI stack page as your consulting credential" is unowned.** Four players approach it from different directions (stack.expert, LinkedIn, vibe-coder lists, Peerlist/Contra), but the composite (stack + per-tool judgment + real costs + shipped projects as a consulting landing page) exists nowhere. Caveat: nobody has proven the funnel stack-page → paid gig; pursuing it means pioneering rather than copying. Cheapest validation: an "available for hire" affordance on stack pages + measure clicks.

## 3. Learning & knowledge hubs

- **News/media incumbents** (TLDR AI ~1.1M, The Rundown ~2M+, Ben's Bites ~120–166K, Latent Space, Every): winner-take-most, ad/course-funded, none maintains structured workflow reference. Every has the most evolved model (content → products → consulting) but ships essays rather than reference material.
- **Pragmatic Engineer** - the de-facto census of what real engineers use (900+ respondent surveys; Claude Code dominant), but periodic, paywalled, org-level snapshots.
- **Simon Willison** - highest-trust voice in exactly the "how people actually use these tools" niche; his brand-new "Agentic Engineering Patterns" project is the strongest signal that this knowledge is **uncaptured**, and he is doing it as essays rather than a database.
- **Vendor academies** (Anthropic Academy ~20 free courses since Mar 2026, OpenAI Academy + certifications, DeepLearning.AI co-branded courses): free, deep, official - and structurally incapable of cross-vendor comparison or pricing honesty.
- **Community knowledge:** r/ClaudeAI ~1M members (+~3K/day); knowledge disappears off the front page within 48h. **ClaudeLog** - solo-run community knowledge base that became the #1 resource for one tool: proof a solo builder can own this position in a niche. **cursor.directory** (~68K members) - proof builders contribute structured, copyable artifacts to a free directory.
- **Comparison SEO layer:** first-page "Cursor vs Claude Code 2026" results are LLM-generated content farms with stale pricing - and AI answer engines are intercepting the queries anyway. **Benchmarks** (aider leaderboard, SWE-bench) rank *models*, never *workflows-in-combination*, and nobody maintains a live map of real costs (~30% of surveyed devs hit usage limits).
- **Content rot is measured in weeks** (model generations every 6–10 weeks; pricing/limits churn quarterly; YouTube workflow videos wrong in ~3 months). Implications for a solo builder: never write dated comparison prose; build **structured data that re-verifies programmatically and displays its own freshness**; community-sourcing is the only rot defense that scales past one person; plan for zero-click by being the citable structured source (the aider-leaderboard playbook).

**Category verdict:** "living, community-sourced knowledge of real AI workflows" is owned by nobody - ClaudeLog (one tool), cursor.directory (artifacts, one editor), Pragmatic Engineer (aggregate snapshots) each hold a piece. User-submitted stacks are *already* structured living workflow data; no competitor's format (newsletter/course/video/listicle) can become that without rebuilding.

## 4. Skills, rules, prompts & MCP directories

- **MCP:** official registry (~9,600 servers, community-governed) won the plumbing; Docker MCP Catalog (~200 verified) won enterprise trust; Smithery/Glama/PulseMCP/mcp.so fight over discovery. An independent 2026 audit found **~52% of public MCP servers are effectively dead**, so raw-count directories largely index dead servers. **Do not compete here.**
- **Skills:** **skills.sh (Vercel)** won distribution - `npx skills add owner/repo` into 17+ agents, GitHub-as-registry, ~895K skills indexed, top skill 2.5M installs. Pure telemetry leaderboard: no curation, no security review, no author context. **Anthropic did NOT ship a general skills marketplace by mid-2026** - its official plugin directory (May 2026) is ~55 curated plugins; the long tail is ceded to a low-quality scraper swarm ("eight major marketplaces by Q2 2026; developers spend more time comparing marketplaces than finding skills").
- **Editor rules:** cursor.directory dominates (rules + jobs + **member profiles** - the only player with profiles as a feature, but profiles and rules are parallel silos). Cursor's official Marketplace (Feb 2026) took the partner-plugin high ground. playbooks.com is quietly the most aistack-like (free curated cross-agent directory with per-client configs).
- **Prompts:** PromptBase survives as an image-prompt niche; FlowGPT pivoted away entirely; GPT Store in maintenance mode. Consumer prompt marketplaces were a 2023–24 phenomenon.
- **Workflow hubs:** n8n templates (10,600+, one-click import, but platform-locked) has the strongest artifact→execution loop; LangChain Hub low-energy.

**Category verdict:** neutral *listing* is over (first parties + telemetry winners own it). Open: **curation/trust** (worse in 2026 than 2025 - 52% dead servers, 895K unreviewed skills), **cross-tool composition** (everyone lists atoms, nobody lists working molecules), and above all **provenance**: *no directory anywhere answers "this artifact is used daily by this specific builder, inside this stack, alongside these tools."* aistack already models resources-attached-to-stacks, so provenance comes directly out of the existing data model. Install mechanics: the bar is `npx skills add` one-liners; the pragmatic play is **delegating to the winning installers** (skills.sh, Docker, Smithery, `/plugin`) rather than rebuilding them - be the provenance/composition layer on top of the distribution rails.

## 5. AI-config portability & sync

- **Dotfiles managers absorbed AI configs decisively** - a whole 2025–26 guide genre exists (chezmoi + Claude Code guides, "one skills brain for Codex/Claude/Cursor/Copilot", stow setups). For the exact demographic that runs a CLI coding agent, `git + chezmoi` solves cross-machine sync in 20 minutes, free.
- **Purpose-built wave (~10 OSS tools, no winner):** rulesync (1.2k stars - the traction leader; cross-*tool* generation for 40+ agents, not cross-machine), agentsync/dot-agents cluster (single-digit stars), **claude-brain** (68 stars; the best Claude-specific answer: plugin-distributed, semantic merge, team sharing).
- **First parties:** VS Code Settings Sync **already roams Copilot prompt/instruction files with your account**, so that case is solved. Cursor: no native sync as of Mar 2026 (open forum requests). **Anthropic offers no personal `~/.claude` sync, and its tracker shows 6+ open feature requests with duplicates and no response.** The pain is validated by Anthropic's own backlog, and Anthropic can eliminate the third-party category with one "sign in to sync" release. High absorption risk.
- **The team use case is already gone:** repo-checked-in CLAUDE.md/.cursor/rules + managed settings + plugin marketplaces solved project-scoped and org distribution. Only the personal multi-machine indie remains - and the residual unmet need ("zero-friction, semantics-aware, user-scoped sync for people who won't run a dotfiles repo") is real but shallow and shrinking.
- **The combo (sync + public stack page) is not unique:** StackMyAI is the aistack loop almost verbatim, and both sit at ~zero adoption - weak evidence against "sync + community" as latent demand (both unpromoted, so not conclusive).

**Category verdict - the CLI question answered:** nobody owns config-sync + community, but the sync half has no moat, an entrenched free substitute, and first-party absorption hanging over it. Defensibility, if any, is in the community/compare layer (cursor.directory's 68K members prove people browse setups). **The CLI loop is best positioned as a convenience on-ramp/off-ramp for the stack page ("try this stack in one command"), interoperating with existing rails (import from git/chezmoi/AGENTS.md, delegate installs to skills.sh/Smithery/Docker), rather than as the USP.**

---

## The open USP gaps (synthesis)

### Gap 1 - The person-centric AI-stack identity page, with community
**"The StackShare position, translated to the AI era."** Evidence it's open: StackShare vacated it (acquisition → zombie); Peerlist treats stack as a logo wall; /uses proves 17 years of durable demand for the behavior with zero productization; the two 2026 entrants each hold half (stackd.cc: aggregate no identity; StackMyAI: identity no community) and both are pre-traction. Evidence aistack can take it: the analytics show stack pages are **the one thing already organically working** (pages out-pull the browse directory; signin→signup 79%). Risks: three solo builders converged on it in one year - validation and a closing window at once; read.cv shows identity artifacts alone don't retain or monetize. The community half is the unproven, differentiating part.

### Gap 2 - The provenance layer: "the stacks behind the artifacts"
Every directory in the hottest space of 2025–26 (skills, rules, MCP) lists **anonymous atoms**; trust is collapsing under volume (52% dead MCP servers, 895K unreviewed skills, marketplace swarm). Nobody answers *"who actually runs this daily, inside what setup, alongside what?"*, and first parties structurally never will (they won't editorialize, and they're single-vendor). aistack's data model already attaches resources to stacks: person-anchored, cross-vendor artifact provenance comes directly out of that model, and it's a moat no listing site can copy without rebuilding around people. Distribution should delegate to the winning installers rather than compete with them.

### Gap 3 - Living, price-honest, cross-tool workflow knowledge
The comparison layer is vendor academies (can't be neutral), content farms (aren't trusted), and practitioner essays (rot in weeks). Benchmarks rank models, not tool combinations; nobody maintains real costs at real usage tiers (~30% of devs hit limits and tool-switch). aistack's structured, community-sourced stack data with **real monthly costs** - already the site's honesty differentiator - is the only format that re-verifies programmatically and displays its own freshness; done right it becomes the citable structured source AI answer engines and writers reference (the aider-leaderboard playbook). This is also the return-trigger candidate the analytics called for: "what changed in the stack meta this week" only works on living data.

**How they compose:** Gap 1 is the atom (the stack page as identity), Gaps 2 and 3 are aggregations of it (artifacts with provenance; the living dataset). A single spine - *real builders' real, costed, working AI setups* - feeds all three; they form one position rather than three products.

### Verdict on the current CLI-loop USP
**Retire "carry your AI config between machines" as the lead USP.** It has zero adoption (here and at its clone), no technical moat, a free entrenched substitute (git/chezmoi) among exactly the target users, a solved team story (repo config), and first-party absorption risk (Anthropic's open feature-request stack; VS Code already ships it). The residual pain is real but narrow. Keep the CLI as a supporting affordance of the stack page - "adopt this stack in one command," delegating to skills.sh/Smithery/Docker rails - where it strengthens Gap 2 instead of competing with dotfiles.

**Flagged uncertainties:** StackShare/TAAFT liveness detail (bot-blocked, inferred); StackMyAI import claims (contradicted by npm data, treated as mock); Windsurf→"Devin Desktop" rebrand (single source); GPT Store active-GPT counts (secondary source); several newsletter subscriber counts (aggregator/self-reported).
