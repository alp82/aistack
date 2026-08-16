# User interviews - findings (2026-07)

Ticket: [Interview current users: why they don't curate, what brings them back](https://github.com/alp82/aistack/issues/4)
Guide: [`interview-guide.md`](./interview-guide.md)
Conducted: 15–18 Jul 2026, Discord DMs. **9 interviewees.**

This covers the felt-reasons half of *why current users don't curate* (the
analytics ticket answered the "what"; this answers the "why"). It is direct
evidence for the keystone identity decision
([#7](https://github.com/alp82/aistack/issues/7)) and the CLI role decision
([#8](https://github.com/alp82/aistack/issues/8)).

## Participants

| Alias | Handle | Segment | One-line read |
|---|---|---|---|
| P1 | Will (AI DevX engineer) | returner / power user | Wants auto-sync from transcripts + a weekly trends digest |
| P2 | zacksiri (Memovee) | trial / returner | "Lots of workflows shown off, no real app/value" - wants results, not workflows |
| P3 | François Best | dormant (logs in only to update) | Staleness = not worth the hassle; wants OpenUsage-style direct value |
| P4 | Mark (TECH) | churned | Stays current via X; wants personal↔work split, more categories, project→stack suggest + expert connect |
| P5 | maddada (GSTX) | skeptic | "Heh interesting", not "wow useful"; no recurring need; results all similar anyway |
| P6 | OrcDev | dormant / creator | Wants a shareable brand/visibility page + aggregate shareable tech charts |
| P7 | Justin (jalco) | dormant / supporter | "Kit for AI builders" - link stuff, referrals; auto tool-audit via CLI |
| P8 | ShadowArcanist | returner | Tool discovery from prolific builders (esp. coding); GitHub stars as source |
| P9 | Jay (radiumcoders) | returner | Low-signal; checking how others handle their AI stack |

Segments: **returners** P1, P2, P8, P9 · **dormant** P3, P6, P7 · **churned** P4 · **skeptic** P5. No pure CLI users surfaced (P7/P1 *want* CLI/MCP, don't use one today).

## Raw transcripts

### P1 - Will (AI DevX engineer)
- **Last visit / motivation:** "went to see the most recent updates you'd done because I saw a post of yours on social media."
- **Original hope:** "main motivator is to not fall behind - pace of innovation is crazy. I change my workflow at least once every 2 months, and every change is so impactful; missing one would have a negative effect (esp. given my role as an AI DevX engineer trying to influence change in my org)."
- **Sources:** X, YouTube.
- **Creators:** Matt Pocock, IndyDevDan, the Claude Code team (Boris, Thariq), Karpathy.
- **What would you change:** "maybe skill distribution?"
- **Feature (verbatim ask):** "1. An 'AI Stack' MCP/CLI. 2. An 'AI Stack' Skill that runs Explore agents over my Claude Code transcripts, generates updates to `// STEP 03: WORKFLOW`, and syncs that update to AI Stack via MCP/CLI. I change my workflow a lot and don't want to manually sync - Claude can look at my transcripts, see my current workflow, then update it."
- **Closing:** "I'd love a weekly digest of AI tooling trends. What are people dropping? What are they adopting? What is new?" (Alper: aligned - "similar pace/tone as the Bytes newsletter.")

### P2 - zacksiri (Memovee App Dev)
- **Last visit:** "saw it on your profile so wanted to try it out."
- **Original hope:** "wanted to see what others were using."
- **Interesting in other stacks?** "Not really." "Everyone has different standards; I can't really see what others are doing. Everyone is using mostly the same things - some model, some harness. I wondered what kind of things people were *building*."
- **Fall-behind concern:** "I don't think I have that issue."
- **Key line:** "Ultimately lots of people are saying and showing off a lot of workflows but no real app / value. Even on Twitter you can see." (Alper reframed: interested in *results / projects people work on*, not workflows - confirmed.)

### P3 - François Best
- **Last visit (brutally honest):** "I don't really use it, I just logged in to update it and it was still on Opus/Sonnet 4.6 + GPT-5.3 Codex - things change very quickly (weekly, almost), and I don't think of updating it."
- **What's it for:** "I don't really see what it's for apart from showcasing the tools you use, but it doesn't 'get me anything' or solve a problem I have. Apart from linking it in my resume when job-hunting - but I only use free/sponsored stuff and have paid maybe one month of $20 Claude ever, so it's not impressive and doesn't relate to how I actually use the tools (usage ratios & what I use each for). This gets outdated very quickly."
- **Sync usage automatically?** "If it's not intrusive, maybe. I like what Robin made with OpenUsage because it gives me direct value: seeing the limits right on my toolbar."
- **Sources:** Shipper Club, YouTube, X, Hacker News ("terminally online").
- **Creators:** Theo, Matt Pocock, OrcDev, Ben Davies (Nerd Snipe podcast), + podcasts: Syntax, Pragmatic Engineer, Open Source Security, Security Cryptography Whatever, Devtools FM.

### P4 - Mark (TECH)
- **Last visit:** "when you reached out to me to publish my stack. Should probably update it - it's changed since then."
- **Original hope:** "used to be interested in others' stacks ~a year ago, but now I'm on X daily and regularly talk to heavy AI users, so I feel always up to date on best practices and what tools people use - I don't feel the need to look for this info anymore."
- **Sources:** Mostly X; The Rundown AI newsletter (skim daily).
- **Creators:** levelsio, Justine Moore, leo (synthwavedd), Taelin, Karpathy. "Most of my AI news is seeing multiple posts about the same thing."
- **Change:** "I think of my personal stack as clearly distinct from my job/work stack - seeing that separation would be useful."
- **Feature:** "More categories. I see coding agent, reasoning, image gen, research - but not writing (legal/copy/creative), or video/content creation. A general writing category would help; I could refer friends."
- **Self-assessment:** "I don't see myself using it in the future - my algorithm shows me things when I get interested. I might refer friends, but as a one-off, not recurring activity. Might not be the target audience."
- **Closing:** "Feature idea: paste a project idea → have it suggest a stack. And refer you to others on the site who know that stack and would talk to you (message through the site + email notification). Takes away from the minimal format, but could bring activity."

### P5 - maddada (GSTX)
- **Framing:** "I'll answer really honestly - don't take it personally, honest feedback is more useful than encouraging words that take you on the wrong path."
- **Last visit / hope:** "To try a tool built by a cool dude I met on Shippers Club. Wouldn't have used it otherwise. I don't really have a need for AI Stack personally, and this stuff changes so often - most people don't care what others use since it's all very similar results anyway."
- **Value if different?** "Not sure for me personally. Some might find it 'interesting', but I don't know what would make it actually useful and make people visit recurringly."
- **Future problem it could solve:** "The hardest part - takes tons of research and trial/error. Sadly I can't think of a problem this project as it stands would solve for me. So far it's 'heh interesting', not 'wow I would pay for this' or 'this is very useful'. And I don't know how you take it from here to there."
- **Sources:** X, YouTube. **Creators:** SyntaxFM, primeagen, theo, ben, mitchell.
- **GitHub stack image goal:** "makes my profile on GitHub look nicer, that's all."

### P6 - OrcDev
- **Last visit:** "when I wanted to add my second Claude I bought - mostly to support you."
- **Original hope:** "as a content creator building the OrcDev brand, it'd be cool if I were shareable, so people can send my profile: 'omg check OrcDev, he uses this and this.' Solving visibility and more audience."
- **Maintain brand elsewhere?** "No, I just mention it a million times through social media."
- **When tools change?** "Not changing anything - people are quite confused what I use; I see it in Shipper Club too."
- **Change / feature:** "Charts with most-used technologies, made shareable - not sure how many users you have, but with 1000+ that'd be shareable and powerful." Plus landing-page notes: "move the hero up to fill the blank space; try 'SEE THEIR STACK' with some famous builders; we can get people from Shipper Club there."

### P7 - Justin (jalco / NEON)
- **Last visit / hope:** "used it to support you! Eventually it'd be cool to see what certain 'influencers' use. Also make it simpler to add tools - perhaps via CLI, like an audit of used tools automatically."
- **Main motivation (stay up to date vs share vs no point):** "both - I do see a point. You know that website that's like the setup someone has - I think it's called Kit. They can link to their stuff, get referrals, etc."
- **Sources:** "X primarily. Haven't looked recently." (Q5/Q6 deferred - moving house.)

### P8 - ShadowArcanist
- **Last visit:** "saw members on 'The Hoard' server talking about updating AI Stack, realized I have an account, wanted to update my profile since I changed my tools recently."
- **Original hope:** "wanted to see what tools/software other people use - especially people who build a lot - so I can find new tools that make my life easier (mainly coding)."
- **Sources:** "GitHub - I like the stars tab on user profiles; good/useful starred repos, I check them in free time."
- **Creators:** "Not really - some I check: Theo and mischavandenburg (YouTube)."
- **Q5 (change to make it more useful):** "A notification feed would be helpful - follow others and receive a notification when they add/remove/update their stack. It will help to see what tools people are adopting and removing from their workflows."
- **Q6 (one thing):** "Analytics - right now I have a profile on AI Stack but no idea if anyone visits it. If the profile gets views, it kinda motivates me to keep it up to date all the time."

### P9 - Jay (radiumcoders)
- **Last visit:** "a little while ago, to check out how others are handling AI with their stack."
- **Original hope:** "to get the AI stack… idk, I was just checking out projects, to be honest I didn't think much."
- **Sources:** "Shipper Club thing." **Creators:** "mainly boss + sometimes Theo."
- **Change:** "current one is good to me mostly." **Feature:** "can't think of one currently, will let you know."

## Synthesis - five sharpest insights

**1. The staleness treadmill is the root cause of curation drop-off (felt-side, confirmed).**
Tooling changes weekly; stacks go stale within days; manual re-curation isn't worth the effort. François was literally still on Opus/Sonnet 4.6; Mark "should probably update"; maddada and Will both cite the churn. The analytics found near-zero optional-depth curation and no return trigger; the interviews say *why*: **maintenance cost exceeds perceived value.** Any identity that depends on users manually keeping an accurate stack is not viable.

**2. Auto-sync from transcripts is the strongest product signal, and it redefines the CLI's role.**
Will, unprompted, specified the exact fix: a Skill/MCP that reads his Claude Code transcripts, detects his live workflow, and syncs it to AI Stack - "I don't want to manually sync." François echoes with the value framing (OpenUsage-style *direct value*, "not intrusive"), Justin with "auto audit of used tools." This is the one mechanism that makes curation sustainable, and it points [#8](https://github.com/alp82/aistack/issues/8) away from config-carry toward **auto-capture of the current setup**.

**3. The bare tool list is commoditized; differentiation lives in usage, cost, and output.**
"Everyone is using mostly the same things - some model, some harness" (zacksiri); "all very similar results anyway" (maddada). What is *not* commoditized, per the interviews: usage ratios + what-each-tool-is-for (François), real costs incl. free/sponsored honesty (François), and **the projects/results built** - "lots of workflows shown off, no real app/value" (zacksiri). This pushes identity toward artifact-provenance (Gap 2) + price-honesty (Gap 3), away from a plain showcase.

**4. Two audiences diverge on return-value, and passive discovery loses to the algorithm.**
Creators (OrcDev, Justin) want a **shareable, Kit-style identity page** for visibility/referrals/brand. Consumers (ShadowArcanist, zacksiri, Jay) want **tool/project discovery**. But the heavy users (Mark, maddada, François) already stay current via X and explicitly won't return for passive browsing - "my algorithm shows me things when I get interested." Implication: the recurring-return hook cannot be "browse others' stacks." It must be creator-side value (an auto-maintained brand asset) or an active push.

**5. Two concrete return-triggers surfaced: the mechanisms the analytics said were missing.**
A **weekly tooling-trends digest** ("what's being dropped/adopted/new" - Will, with Alper already aligned on Bytes-style tone) and **aggregate, shareable most-used-tech charts** (OrcDev - "with 1000+ users, powerful"; matches the aicoolies aggregate-spend counter-move already in the map's fog). Both are pull-back triggers, not passive browse.

### Secondary signals (feed the roadmap, not the keystone)
- **Personal vs work stack separation** (Mark) - a concrete case for multiple-stacks-per-user (already in fog).
- **More stack categories** - writing (legal/copy/creative), video/content (Mark).
- **Project → stack suggestion + connect-me-to-an-expert** (Mark) - organic consultant/marketplace signal, but from a self-described non-recurring user; "takes away from the minimal format."
- **Landing page** (OrcDev) - move hero up, "SEE THEIR STACK" with famous builders as social proof, recruit from Shipper Club.
- **GitHub profile image is purely cosmetic** (maddada: "makes my profile look nicer, that's all") - the embed is a vanity asset, not a value driver.

## Implication for the keystone

The interviews do not decide the identity; they hard-constrain it. A viable direction must (a) **eliminate manual curation** (auto-sync is the load-bearing mechanism, not a nice-to-have), (b) **differentiate past the commoditized tool list** (usage/cost/output), and (c) **carry its own return trigger** (digest and/or shareable aggregates), because passive stack-browsing demonstrably loses to X for the exact heavy-user audience the product targets. Carry these into [#7](https://github.com/alp82/aistack/issues/7) and [#8](https://github.com/alp82/aistack/issues/8).
