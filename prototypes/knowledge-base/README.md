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

The bottom bar switches surface. **ADMIN** holds the three publish acts.
**PUBLIC** holds the three page shapes. Both read one state, so publishing in
ADMIN changes what PUBLIC shows.

| Surface | A | B | C |
|---|---|---|---|
| ADMIN | approve is publish | the Sunday send publishes | a publish queue |
| PUBLIC | topic index | one stream with chips | topic sections on one page |

The public surface also carries one toggle: release rows as full entries, or
collapsed into a single strip per topic.

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
