# aicoolies.com deep dive - the competitor the landscape sweep missed (2026-07-15)

Follow-up to [competitor-landscape-2026-07.md](./competitor-landscape-2026-07.md), which mapped three open USP gaps (person-centric stack identity, artifact provenance, living price-honest workflow knowledge) and missed aicoolies.com entirely. Owner flag: "a very similar approach and promise" to AI Stack.

**Method.** Primary-source fetches on 2026-07-15: landing, `/about`, `/teams`, `/devs`, three dev profiles (`/dev/rasitakyol`, `/dev/varienos`, `/dev/vitorcsbrito`), `/stacks` + one stack detail, `/tools/claude-code`, `/reviews`, `/comparisons`, `/graveyard`, `/insights/ai-spend`, `/login`, `/llms.txt`. Traction dug via web searches across X/Reddit/HN/Product Hunt/Indie Hackers and maker-identity searches. Wayback CDX was unreachable from this environment; launch timing inferred from on-site "building since" dates (flagged). Claims sourced only from search-snippet caches are marked lower-confidence.

---

## TL;DR

- **aicoolies is primarily an editorial SEO knowledge graph rather than a community.** One maker, ~4 months old, has shipped 1,240+ tool pages, 553 comparisons, 376 scored reviews, 124 curated stacks, and a 28-tool "Graveyard" ([aicoolies.com](https://aicoolies.com), [/reviews](https://aicoolies.com/reviews), [/comparisons](https://aicoolies.com/comparisons), [/stacks](https://aicoolies.com/stacks), [/graveyard](https://aicoolies.com/graveyard)).
- **The person-centric half (the part that overlaps AI Stack) is small: 4 dev profiles total**, two of them the maker and someone from his professional circle ([/devs](https://aicoolies.com/devs)). The community "AI Spend" insights page is gated at 20 members and shows **"1 / 20 members tracking"** ([/insights/ai-spend](https://aicoolies.com/insights/ai-spend)).
- **Traction verdict: the content is massive, the community and distribution are zero.** No X account, no Product Hunt launch, no HN/Reddit/Indie Hackers footprint findable on 2026-07-15. It is a distinct third/fourth entrant rather than one of the two prior entrants (stackd.cc, StackMyAI) renamed, and it does **not** invalidate the "person-centric position vacant / entrants pre-traction" verdict.
- **Where it genuinely overlaps AI Stack's promise:** dev profiles carry categorized tools **plus an itemized "$650/mo AI stack" subscription section** - the same cost-honesty instinct as AI Stack's cost fields ([/dev/rasitakyol](https://aicoolies.com/dev/rasitakyol)).
- **Where it's ahead:** editorial surface area and AEO plumbing (llms.txt, per-tool/comparison/use-case/tag routes, "updated" stamps, Graveyard-as-freshness-signal) - it is executing the landscape doc's Gap-3 prescriptions, just via single-author bulk editorial instead of community data.
- **Credibility tension worth noting:** the site claims "no automated bulk publishing … Tested by hand. Verified by a human." ([/teams](https://aicoolies.com/teams)) while all 12 visible reviews on `/reviews` share one author and one date (July 13, 2026) across 376 reviews. The volume-since-March is not plausible without heavy AI generation.
- **Defensibility read:** AI Stack stays defensible on person-anchored *artifacts* (skills/rules/resources - aicoolies models zero artifacts), on community-sourced live data vs bus-factor-1 editorial, and on the CLI on-ramp. The concrete threat is aicoolies winning the SEO/AEO comparison layer (Gap 3) before AI Stack ships any of it.

---

## 1. What it is

**Positioning.** Tagline: *"The Knowledge Graph for Developer Tools"*; subhead: *"Discover, compare, and build with the best AI stack. A hand-tested catalog of 1240+ AI developer tools."* Footer: *"Built for builders."* ([aicoolies.com](https://aicoolies.com)). About page: *"the definitive knowledge graph for the modern AI stack"*, with a stated methodology of hands-on testing, 0–100 scoring, source verification against docs/repos, and lifecycle tracking ([/about](https://aicoolies.com/about)).

**Information architecture** (from nav + [/llms.txt](https://aicoolies.com/llms.txt), which enumerates nine content types and their routes): Tools (`/tools/{slug}`), Categories, Reviews, Comparisons, Stacks, Use Cases, Tags, Developer Profiles (`/devs`, `/dev/{username}`), and Insights (`/insights/ai-spend`), plus About, Teams, Graveyard, sitemap.xml. Publishing llms.txt at all is a deliberate answer-engine-optimization move.

**Content scale (all editorial):**
- 1,240+ tool pages. The [Claude Code page](https://aicoolies.com/tools/claude-code) shows the anatomy: "Recommended"/"paid" badges, **"updated Jul 15, 2026"** stamp, pricing, platforms, categories, use cases, 4 alternatives, related tools, "Used in Stacks", 10 comparison links, an outbound "Visit Website" button (no visible affiliate parameters), and - notably - **avatars of the devs who have this tool in their stack** (Raşit Akyol, Yiğit Can H.), linking tool pages back to profiles.
- 553 comparisons, each a question-framed card with a declared winner ([/comparisons](https://aicoolies.com/comparisons)).
- 376 reviews with 0–100 scores and "Choose [tool] when…" verdicts; all visible ones authored by Raşit Akyol, all dated July 13, 2026 ([/reviews](https://aicoolies.com/reviews)).
- 124 curated stacks, "Curated, opinionated tool combinations for specific use cases, roles, and budgets" - editorial, unattributed, e.g. [Solo Dev Stack 2026](https://aicoolies.com/stacks/solo-dev-stack-2026) with a 7-tool table (role + pricing + open-source flag per tool) and essay sections ([/stacks](https://aicoolies.com/stacks)).
- 28-entry **Graveyard**: *"Tools that have been discontinued, abandoned, or shut down - kept on record so you know what not to build on"* (Humanloop, Bard, Kite, JetBrains Fleet…) ([/graveyard](https://aicoolies.com/graveyard)).

**The dev-profile data model** (the AI Stack–overlapping part), from [/dev/rasitakyol](https://aicoolies.com/dev/rasitakyol):
- Identity: name, GitHub avatar, handle, role headline ("Fullstack Developer"), "community / builder" label, location (İzmir), **"building since Mar 2026"**, links (personal site, company, X, LinkedIn).
- **"My Stack"**: 25 tools grouped into editorial categories - IDE, Terminal, AI Assistant, Database, Deployment, Design, Testing.
- **"AI Subscriptions"**: headline **"$650/mo AI stack"** itemized - Cursor Ultra $200, Codex Pro $200, Claude Max $200, SuperGrok $30, Devin Pro $20.
- Texture fields: "favorite tool" (Claude Code), "currently exploring" (agentic workflows), recent comments, share buttons (X/LinkedIn/Reddit).

**Field variance across profiles:** [varienos](https://aicoolies.com/dev/varienos) (21 tools, incl. an "AI Coding Plan" category with Backlog.md and Superpowers) has **no subscription/cost section** - costs are optional. [vitorcsbrito](https://aicoolies.com/dev/vitorcsbrito) is a skeleton: 2 tools (LangGraph, Mem0), no bio, no costs, no texture fields. @0xtrou has 0 tools ([/devs](https://aicoolies.com/devs)). So the rich profile is the maker's own; the format degrades fast without curation.

**Creation & curation:** profiles are self-serve via GitHub OAuth only - *"Sign in with GitHub… Build your developer tool stack, share reviews, and discover what other developers are using"* ([/login](https://aicoolies.com/login)). Tool selection is picking from the editorial catalog (which is why categories are uniform across profiles). Everything else on the site is single-editor curated.

**Monetization signals: none.** No pricing page, no sponsor slots, no visible affiliate links, no hire-me CTAs. A search-cached description calls it a "passion project" (lower confidence - snippet, not on-page). Tech stack per About: Next.js, Payload CMS, PostgreSQL, Tailwind, deployed on Coolify, "Warp-inspired dark terminal aesthetic" ([/about](https://aicoolies.com/about)).

## 2. Who's behind it & traction

**Maker: Raşit Akyol** - and yes, `/dev/rasitakyol` is the maker's own profile. He is listed as sole "Founder & Editor-in-Chief" and "Verified Expert": *"Every tool, score, and comparison on the site is tested, verified, and approved by him"* ([/teams](https://aicoolies.com/teams)). Independently: founder of Digital Karınca, a software agency in Karşıyaka, İzmir, Turkey, "15+ years of production experience" ([digitalkarinca.com](https://digitalkarinca.com/en), [LinkedIn](https://tr.linkedin.com/in/rasit-akyol-9a882457), [ZoomInfo](https://www.zoominfo.com/p/Rasit-Akyol/-1617495985)). His employment history includes "Varien Software" (search snippet, lower confidence) - which strongly suggests @varienos, the only other substantive profile, is from his professional circle.

**Age:** the maker's own profile says "building since Mar 2026"; the entire catalog appears built March–July 2026. Wayback CDX was unreachable from this environment, so launch date is inferred, not archived-verified.

**Traction (searched 2026-07-15):**
- **No social footprint found**: searches for aicoolies across X/Twitter, Reddit, Hacker News returned nothing relevant; no @aicoolies account surfaced; no Product Hunt launch; no Indie Hackers posts; no press. (Multiple query variants; absence-of-evidence, but consistent across all of them.)
- **Community numbers, from the site itself**: 4 dev profiles (2 substantive, both maker-adjacent); AI Spend insights locked at *"1 / 20 members tracking - Community spend data unlocks at 20 members"* - i.e. one person (almost certainly the maker) has entered subscription data ([/insights/ai-spend](https://aicoolies.com/insights/ai-spend)).
- **No changelog, blog, or roadmap** found on-site or via search.
- **Editorial-integrity tension:** `/teams` states *"Every entry is read, edited, and approved by a human engineer before it goes live - no automated bulk publishing"* and *"Tested by hand. Verified by a human."* Yet 376 reviews carry a single visible publication date (July 13, 2026) and one author, and 553 comparisons + 1,240 tool pages appeared within ~4 months alongside a day-job agency. The content is near-certainly AI-generated at scale with human sign-off. A search-index cache of the site also surfaced the line "Atlas validates structural consistency across 1,000+ developer tool entries and comparisons" - suggesting a named automated pipeline component that no longer appears on the live `/teams` page (lower confidence: cached snippet only).

**Plain verdict: pre-traction.** The editorial machine is impressively large; the community and distribution are effectively zero. This mirrors StackMyAI's pattern from the landscape doc (big claims/surface, ~no users) with the axes flipped: StackMyAI had a product loop and no content, aicoolies has content and no loop.

## 3. Gap mapping

**Gap 3 (living, price-honest, cross-tool workflow knowledge) - occupied in editorial form, and this is the real overlap.** aicoolies is executing almost exactly the landscape doc's Gap-3 prescriptions: structured comparisons instead of prose farms, per-tool pricing, "updated" stamps, re-verification claims, a Graveyard as a lifecycle/freshness signal, llms.txt for answer-engine citability, and an (aspirational) community spend dataset. The critical difference: it is **single-author editorial** rather than community-sourced. 1,240 tool pages + 553 comparisons maintained by one person is precisely the content-rot trap the landscape doc measured in weeks; the freshness apparatus is so far only a promise, without a demonstrated capability behind it. Still: on the SEO/AEO comparison layer, aicoolies is *ahead of AI Stack today*, because AI Stack has shipped none of this layer.

**Gap 1 (person-centric stack identity + community) - occupied in structure but not in practice.** The `/dev/{username}` profile with categorized tools + itemized monthly AI spend is genuinely the same promise as an AI Stack page - this is the "very similar approach" the owner sensed. But 4 profiles (2 maker-adjacent), no follow/social graph, comments as the only community feature, and 1/20 spend trackers means the position remains **vacant on traction**. The prior verdict stands, amended: the count is now **at least four** pre-traction 2026 solo entrants rather than two (aistack, stackd.cc, StackMyAI, aicoolies). aicoolies is a distinct product rather than stackd.cc or StackMyAI renamed (no leaderboard mechanic, no CLI/import, different maker, different country). Four independent solo convergences in one year strengthens both the validation and the urgency.

**Gap 2 (artifact provenance - "the stacks behind the artifacts") - untouched.** aicoolies models *tools only*. No skills, rules, prompts, MCP servers, configs, or projects anywhere in the data model. Its one provenance-flavored feature - dev avatars on tool pages ("used by") and "Most stacked tools" on the homepage - is provenance of *tools*, not artifacts, and with 4 devs it's decorative. Gap 2 remains fully open.

## 4. Learnings - what aicoolies executes well

1. **Tool↔person cross-linking.** Tool pages show avatars of devs who stack the tool; dev cards show tool counts; the homepage has "Most stacked tools" and "Recent stack builders" ([/tools/claude-code](https://aicoolies.com/tools/claude-code), [aicoolies.com](https://aicoolies.com)). This makes catalog and profiles feed each other and is provenance-lite. AI Stack has the data (tools ↔ stacks ↔ creators) and should render "N stacks include this / by these people" with avatars on tool pages, and tool chips on browse cards.
2. **The "$650/mo AI stack" headline number.** One itemized, share-bait dollar figure at the top of a profile ([/dev/rasitakyol](https://aicoolies.com/dev/rasitakyol)). AI Stack already computes live stack cost - promote it to the shareable hero stat of every stack page and its OG image (partially done; make it the hook, itemized).
3. **Gated community insights as a cold-start CTA.** "Community spend data unlocks at 20 members" turns an empty dashboard into a participation lever ([/insights/ai-spend](https://aicoolies.com/insights/ai-spend)). Better for AI Stack: it already *has* more than 20 stacks with cost data - ship the aggregate "what builders actually spend" page now and beat aicoolies to its own teased feature. That page is also the Gap-3 citable-source play.
4. **The Graveyard.** Cheap to build, memorable, differentiated, and the single most credible freshness signal on the site ([/graveyard](https://aicoolies.com/graveyard)) - a concrete implementation of the landscape doc's "display your own freshness" rule, plus an evergreen SEO/AEO surface ("is X dead?").
5. **AEO plumbing: llms.txt + typed routes.** Nine content types each with listing+detail routes, sitemap, llms.txt describing the graph ([/llms.txt](https://aicoolies.com/llms.txt)). If AI Stack wants to be the citable structured source, publishing llms.txt over its existing public API/pages is an afternoon of work.
6. **Profile texture fields.** "favorite tool", "currently exploring", "building since" - three tiny fields that make a tool list feel like a person and generate return-visit deltas ("exploring" changes over time). Trivial schema additions for AI Stack.
7. **One-click GitHub-OAuth-only onboarding** ([/login](https://aicoolies.com/login)) - but the skeleton profiles (2 tools, 0 tools) show the failure mode: low-friction signup without a guided "build your stack" flow yields empty pages. AI Stack's richer editor is the answer if the first-run flow stays fast.

## 5. USP defensibility

**Where aicoolies is simply ahead:**
- **Content/SEO surface area**: ~2,300 indexed editorial pages vs AI Stack's browse + stack pages. If comparison/review queries are a distribution channel, aicoolies owns the shelf today.
- **Freshness/lifecycle presentation**: updated-stamps, Graveyard, re-verification language - the *packaging* of trust is better than AI Stack's, regardless of substance.
- **Answer-engine readiness**: llms.txt + dense typed internal linking.
- **Sheer shipping velocity**: one person, ~4 months, with an agency behind him - if he pivots resources at community features, he moves fast.

**Where AI Stack stays defensible:**
- **Artifacts (Gap 2)**: aicoolies has no concept of skills/rules/resources/configs/projects. AI Stack's resources-attached-to-stacks model, plus the CLI as "adopt this stack" on-ramp, is a layer aicoolies would need a schema rebuild to copy. This is the widest, most durable delta.
- **Community-sourced truth vs bus-factor-1 editorial**: aicoolies' knowledge layer depends on one person's continued attention to stay fresh, and its "no automated bulk publishing" claim is hard to square with 376 same-day reviews, which is a trust attack surface. AI Stack's data model (real builders, real costs, live Convex recompute) is structurally the rot-resistant version; it just lacks contributors, which is the same problem aicoolies has with 4 devs.
- **Person-first vs catalog-first center of gravity**: aicoolies centers on the catalog (124 editorial stacks vs 4 dev profiles); its dev directory is a feature bolted onto a directory. AI Stack's basic unit is the person's stack page (the position the landscape doc argued is the one worth owning), plus a Discord for the community half nobody (including aicoolies) has demonstrated.
- **Cost honesty at the individual level**: both have it, but aicoolies' is optional free-text-ish per profile (1 of 4 profiles filled it); AI Stack's cost fields are structural to every stack.

**Frank assessment:** aicoolies does not threaten AI Stack's identity/community position - it *re-validates* it, at zero traction, for the fourth time in twelve months. The real strategic threat is narrower: aicoolies (or someone like it) capturing the Gap-3 comparison/AEO layer while AI Stack's community layer is still sub-scale, then bolting on profiles once it has search traffic. That is an out-execution risk rather than a positioning risk. A sobering note: a solo agency founder built a bigger *visible* product in 4 months than the whole category's community traction combined, so the moat in this space is distribution and contributors, never features.

---

## Implications for the identity decision

Input to the pending "which spine leads" decision (consultant marketplace / learning hub / stack curation / skills-workflow directory):

- **Stack curation spine - weakened.** aicoolies now squats on editorial stack curation with 124 SEO-optimized stacks and a faster content machine. Leading with curated/opinionated stacks means a content war against a bulk-editorial producer on his home turf. If curation appears in AI Stack, it must be *community-authored real stacks* (provably-in-use, cost-attested), never editorial fiction; that is the only curation aicoolies structurally can't fake.
- **Learning hub spine - contested but beatable on trust.** aicoolies occupies the comparison/review layer in exactly the low-trust, single-author, bulk-generated form the landscape doc said readers are fleeing. A learning layer *derived from community stack data* ("12 builders switched X→Y this month", real spend aggregates) beats it on credibility - but only after contributor scale exists, so it can't lead.
- **Skills-workflow directory spine - strengthened.** Untouched by aicoolies and by every player in the landscape doc. Person-anchored artifacts (Gap 2) remains the whitest space, and it's the one AI Stack's schema (resources, CLI, live stacks) is uniquely shaped for.
- **Consultant marketplace spine - unaffected.** aicoolies has no hire affordance; no new evidence either way. The landscape doc's "cheapest validation: hire-me affordance + measure clicks" advice stands.
- **Regardless of spine, three cheap moves this competitor makes obvious:** (1) ship the aggregate AI-spend page now - AI Stack has the data aicoolies is still begging 20 members for; (2) add tool↔stack↔person cross-links and "N stacks use this" surfaces; (3) publish llms.txt and adopt Graveyard-style freshness signaling. Each is small, each strengthens Gaps 1–3 simultaneously, and each denies aicoolies an uncontested lane.

**Flagged uncertainties:** launch date inferred from on-site "building since Mar 2026" (Wayback unreachable from this environment); "passion project" framing and Rasit's Varien Software employment (search-snippet cache only); "Atlas" pipeline mention (cached snippet, absent from live page); traction assessed via absence of findable social/press footprint on 2026-07-15 - a private beta audience or non-English (Turkish) distribution channel could exist unseen, though the site itself is English-only.
