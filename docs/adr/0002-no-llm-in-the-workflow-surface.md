# The workflow surface ships without an LLM

Supersedes [ADR-0001](0001-llm-drafts-from-approved-aggregates-only.md).

The measured workflow surface uses no LLM anywhere. Every number comes from a fixed
local rule over transcripts, harness files, and local Git history. Every sentence is a
deterministic template over those numbers, versioned with the rules. An absent
measurement drops its sentence.

ADR-0001 allowed an LLM to draft prose from approved aggregates. That path is closed:
no draft slots, no drafting step at sync, no LLM endpoint in the CLI config. With no
draft there is nothing to edit, so the owner controls on the web are pin and hide.

Why: an AI step at the sync would scare people off the sync. The product's claim is
"measured, not told", and a surface a user must proofread is told, not measured. The
alternative, an optional user-configured LLM endpoint, was rejected because even an
optional AI step changes what the sync looks like it does.

Decided in [alp82/aistack#166](https://github.com/alp82/aistack/issues/166), round 2,
specified in [docs/specs/workflow-surface.md](../specs/workflow-surface.md).
