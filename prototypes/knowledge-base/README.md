# Knowledge base prototype (alp82/aistack#212)

Throwaway. It exists to settle two questions on
[map #198](https://github.com/alp82/aistack/issues/198):

1. **The publish act.** How does an approved item become public in the
   knowledge base?
2. **The page shape.** What does the public page under `/news` look like?

The spec deferred both here: see the Knowledge base section of
[`docs/specs/news-pipeline.md`](../../docs/specs/news-pipeline.md).

## What to open

`index.html` is one self-contained file. Serve the directory and open it:

```sh
python3 -m http.server 9003 --bind 0.0.0.0 --directory prototypes/knowledge-base
```

The bottom bar switches surface. The page opens on **MODEL**, which says what
approve and publish each mean, to whom, and where. **ADMIN** holds the three
publish acts. **PUBLIC** holds the three page shapes. Admin and public read one
state, so publishing in ADMIN changes what PUBLIC shows.

| Surface | A | B | C |
|---|---|---|---|
| ADMIN | the send publishes the issue | the send publishes the week | approve is publish |
| PUBLIC | topic index | one stream with chips | topic sections on one page |

The admin variants changed once the owner described their own act: "I don't
publish single items. I preselect them, then compose a unique email like the
broadcast ones and send that, which makes it public." That is the send, so A
and B became its two readings, and the publish queue was dropped. C stays as
the per-item act, because dropping every alternative would hide the choice.

## Approve is not publish

The two words name different acts, and the prototype was read once as if they
were the same one.

**Approve** is the verdict already on every inbox row. It moves an item from
`inbox` to `approved`, which `CONTEXT.md` calls the item stream. The stream is
private. Approval alone publishes nothing.

**Publish** is per projection, and each projection has its own act:

- The **newsletter** already has one. `sendIssue` mails the issue and opens
  `/news/<slug>`, whose public query joins the item rows, so those items'
  summaries go public with the send.
- The **knowledge base** has none. Picking it is this ticket.

The audience is different too. The email reaches subscribers. The archive page
and the knowledge base reach anyone, with no login and no subscription.

What that leaves on the table: in the real week the prototype carries, 37 items
are approved and issue #2 names 6 of them. The other 31 carry a summary we
wrote and are seen by nobody until the knowledge base publishes them.

The public surface also carries one toggle: release rows as full entries, or
collapsed into a single strip per topic.

## Nothing here reopens a settled decision

The prototype was read once as a contradiction of the compose ruling, so every
act now names the surface it changes. None of them composes an issue, and none
of them drafts.

| Settled | Where | Untouched by this prototype |
|---|---|---|
| Issues are code-based, no compose page ([#202](https://github.com/alp82/aistack/issues/202)) | `src/newsletter/issues.ts` | Act B shows that split, it never picks it |
| Drafting is a skill in the owner's session ([#205](https://github.com/alp82/aistack/issues/205)) | `.claude/skills/news-draft` | Summaries arrive already written |
| The inbox has a per-row verdict ([#238](https://github.com/alp82/aistack/issues/238)) | `NewsInboxSection.tsx` | Approve and discard stay as they are |

What each act would actually cost:

| Act | Surface | New code |
|---|---|---|
| A, the send publishes the issue | the existing send, in `scripts/newsletter.ts` and the Newsletter view | one field on the item row, one write in `sendIssue` |
| B, the send publishes the week | the same send | the same field and write, over a wider set |
| C, approve is publish | Admin, News, Inbox, unchanged | none: the page queries state `approved` |

## The content is real

`collect.mjs` read the live sources on 2026-08-23 and wrote `collected.json`:
259 items over a 21 day window, from the ten phase-1 feeds, the Hacker News
Algolia lane, the cc-by Gemini API changelog, and one X post through the
official oEmbed endpoint.

`picks.json` curates 37 of them into the stream. `stream.json` is the drafting
pass, done by hand in the same session the way
[the news-draft skill](../../.claude/skills/news-draft/SKILL.md) does it: one
topic and one summary per item, written from the page behind the link.
`build.mjs` merges the three into `index.html`.

Every license class in the re-serving table has at least one real row, because
the page has to render all six:

| Class | Row |
|---|---|
| `cc-by` | Gemini API changelog, 2026-08-13, full text with attribution |
| `permissive-release-notes` | opencode v1.18.21, codex, gemini-cli |
| `unlicensed-release-notes` | claude-code v2.1.241, our summary only |
| `article` | Latent Space, Simon Willison, OpenAI, AI Crier |
| `hn` | fifteen stories, points and comment counts as collected |
| `x` | one post, the official embed, merged onto the Hacker News row it was found on |

Three states the demo did not invent:

- **An item with no summary.** The page behind "A week of using Codex more
  than Claude" refused the fetch, so it is undrafted. Every act has to say what
  happens to it.
- **Releases that say nothing.** claude-code v2.1.241 publishes "bug fixes and
  reliability improvements". gemini-cli v0.56.0 publishes a compare link. Only
  opencode's notes carry real content.
- **One item, two links.** The Hacker News story about the Claude Code effort
  experiment points at an X post, so one row carries both, and the stricter X
  class wins. That is ADR-0004 meeting the re-serving table.

## Rebuilding it

```sh
node collect.mjs   # re-read the live sources (about 4 minutes)
node pick.mjs      # print each pick with its page extract, to draft from
node build.mjs     # merge the three files into index.html
node smoke.mjs     # render every surface and variant against a stub document
```

`smoke.mjs` is the check that matters: it renders all six variants, publishes
the waiting set through each act, and asserts the undrafted item never reaches
the public page.
