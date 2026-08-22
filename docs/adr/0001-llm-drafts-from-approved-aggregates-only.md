# The LLM drafts prose from approved aggregates only

**Superseded by [ADR-0002](0002-no-llm-in-the-workflow-surface.md)**: the workflow
surface ships without an LLM.

The measured workflow surface computes every fact deterministically from local
transcripts, harness files, and local Git history. An LLM may draft prose about
those facts. It receives only aggregates the owner approved at the sync gate.

The LLM never produces a number, a label, or a legend. A measurement the
harness does not record stays absent, and the LLM never fills the gap. Every
LLM text carries a draft label, the owner can edit it, and the measured facts
stay visible beside it.

Why: the product's claim is "measured, not told". One guessed number would
poison every measured one. The alternative, an LLM that summarizes raw
transcripts, was rejected because raw data never leaves the machine.

Decided in [alp82/aistack#174](https://github.com/alp82/aistack/issues/174),
grounded in the extractability research
([docs/research/deterministic-workflow-extractability-2026-08.md](../research/deterministic-workflow-extractability-2026-08.md)).
