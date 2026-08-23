# News drafting runs in the owner's Claude session

The news pipeline drafts each item's summary and topic through a skill in this repo,
run in the owner's Claude session on the owner's subscription. The backend holds no
LLM call and no API key. The owner picks the model per session.

The run reads the full linked page through an explorer subagent and writes one draft
file per item. The owner reviews and merges the files, and an apply script on the
server writes the merged drafts into the inbox rows. Retries live in the skill. A
failed item stays undrafted, and the next run re-attempts it.

Why: the owner already pays for a subscription, and a per-call API key would add a
second bill and a secret to manage. The session also gives drafting an interactive
reviewer: the skill can ask the owner about a new topic mid-run. The alternative, a
Convex action at collect time, was rejected together with the spec line that proposed
it.

Decided in [alp82/aistack#205](https://github.com/alp82/aistack/issues/205),
recorded in [docs/specs/news-pipeline.md](../specs/news-pipeline.md).
