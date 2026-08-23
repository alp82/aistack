---
name: news-draft
description: Draft a summary and a topic for every undrafted news inbox item, one file per item.
disable-model-invocation: true
---

# news-draft

Draft the news inbox. One run reads the undrafted items out of prod, reads the
page behind each one, and writes one draft file per item. The owner reviews the
files, merges them, and runs the apply command.

Nothing here writes to prod. The apply command is the only write path, and it
runs after the owner has merged the files.

Spec: the Drafting section of `docs/specs/news-pipeline.md`. Decision:
`docs/adr/0003-news-drafting-in-the-owner-session.md`.

## Steps

1. Read the work:

   ```sh
   node scripts/news-drafts.ts list
   ```

   The output is JSON: `items` (the undrafted inbox rows), `topics` (the
   owner-managed list), and `remaining` (how many items sit past the batch
   limit). Add `--limit N` to take a bigger or smaller batch.

   Stop here and say so when `items` is empty. There is nothing to draft.

2. Read the page behind every item. Dispatch one Explore subagent per item, all
   in one message so they run at once. Ask each for the facts of the page: what
   shipped or happened, who it is for, and the one number or name that matters.

   Skip the subagent when the item already carries `sourceText`. The collector
   kept the body because the license allowed it, so the text is already in
   front of you.

   Retry a page that fails, once. An item whose page still refuses stays
   undrafted, and the next run re-attempts it. Carry on with the rest.

3. Write the summary in your own words, three or four sentences. Say what
   changed and who it is for. Bytes is the editorial north star: plain, short,
   and specific.

   Quote at most one short sentence from the page, and only from an item whose
   `licenseClass` is `cc-by`, `permissive-release-notes`, `article`, or `hn`.
   The re-serving table in the spec says what each class permits.

4. Pick one topic from `topics`, by name.

   Ask the owner when no topic fits and you have a good candidate. Name the
   item, name the topic you propose, and wait for the answer. The topic list is
   owner-managed and it grows one topic at a time.

5. Write one file per item at `drafts/news/<slug>.md`, where `<slug>` comes
   from the headline. The frontmatter carries four fields and the body is the
   summary:

   ```md
   ---
   itemId: k57abc...
   url: https://vendor.test/blog/thing
   headline: The headline as collected
   topic: Coding agents
   ---

   The summary, in your own words.
   ```

   Copy `itemId` and `url` from the batch exactly. Apply finds the row by
   `itemId`.

6. Print a per-item report: one line per item, saying drafted or why not, then
   the counts. Then tell the owner the next two acts: review and merge the
   files, then run

   ```sh
   node scripts/news-drafts.ts apply
   ```

## Rules

- One topic per item, and the name must match a `topics` entry or one the owner
  just approved.
- Write the summary in your own words every time, whatever the license class
  allowed the collector to keep.
- Leave a failed item undrafted. Drafting never blocks collection, and the next
  run picks the item up for free.
- Let the owner run the apply command. It writes prod, and `--dry-run` shows
  what it would write.
