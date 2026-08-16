# Third-party rollouts in `~/.codex/sessions` - attribution and the unknown bucket

Research for issue #73 (wayfinder map #60). Two questions. First: how do third-party
rollout files differ from real Codex CLI rollouts, and what should the scanner do with
them? Second: what causes the scanner's unnamed partial-read failure ("1 of 138 files
unreadable")?

Method: source reading of `openai/codex` at tag **rust-v0.146.0**, `xai-org/grok-build`
at `main`, and `anomalyco/opencode` at `dev` (the repo moved from `sst/opencode`).
Plus structural inspection of the 26 rollout files under `~/.codex/sessions` on this
machine (structure only - no conversation content reproduced), and synthetic
reproduction of the scanner failure paths. Date: 2026-08-02.

---

## 1. What a genuine Codex rollout always contains

Three invariants hold for every file the codex-rs core writes. All three are pinned in
source, and all 26 local files satisfy them.

1. **The first line is `session_meta`.** The recorder builds the `SessionMeta` at
   creation with `id`, `timestamp`, `cwd`, `originator`, `cli_version` (the compiled
   crate version), `source`, `model_provider`, and `base_instructions`
   ([`rollout/src/recorder.rs` L832–866](https://github.com/openai/codex/blob/rust-v0.146.0/codex-rs/rollout/src/recorder.rs#L832-L866)),
   and writes it before any pending item
   ([recorder.rs L1715–1733](https://github.com/openai/codex/blob/rust-v0.146.0/codex-rs/rollout/src/recorder.rs#L1715-L1733)).
2. **`session_meta` and `turn_context` are never filtered.** The persistence policy
   returns `true` for both unconditionally
   ([`rollout/src/policy.rs` L9–19](https://github.com/openai/codex/blob/rust-v0.146.0/codex-rs/rollout/src/policy.rs#L9-L19)).
3. **Every real user turn persists one `turn_context`.** The comment in the core says it
   directly: "Persist one `TurnContextItem` per real user turn"
   ([`core/src/session/mod.rs` L3715–3719](https://github.com/openai/codex/blob/rust-v0.146.0/codex-rs/core/src/session/mod.rs#L3715-L3719)).
   Observed consequence: in all 26 local files, the first `turn_context` line precedes
   the first `token_count` line (checked mechanically, 0 violations).

So a file that carries `token_count` usage but **no preceding `turn_context`** was not
written by the codex-rs core. That is the fingerprint. It is negative by construction:
it detects "not genuine Codex", not "written by tool X".

### `originator` names the embedder, not the harness

`session_meta.originator` defaults per binary (`codex_cli_rs`, `codex-tui`,
`codex_exec`) and is overridable by any embedder via the
`CODEX_INTERNAL_ORIGINATOR_OVERRIDE` env var or the app-server client info
([`core/src/thread_manager.rs` L1475–1481](https://github.com/openai/codex/blob/rust-v0.146.0/codex-rs/core/src/thread_manager.rs#L1475-L1481)).
Observed locally: `codex_cli_rs`, `codex-tui`, `codex_exec`, and `Claude Code` (source
`vscode`) - real codex-core files written while another tool drove Codex. Files from
embedders that run the real core keep all three invariants, so they price and attribute
correctly today. `originator` is therefore a diagnostic label, not a trust signal.

## 2. Neither grok build nor opencode writes rollouts - in their public source

The live test (#68) attributed the impostor files to "grok build and opencode" from the
tester's tool inventory. The public sources do not confirm a writer in either tool:

- **grok build** ([xai-org/grok-build](https://github.com/xai-org/grok-build), Rust, not
  a GitHub fork of codex) **reads** `~/.codex` as a "foreign session" import source. It
  honors `CODEX_HOME`, probes `state_<N>.sqlite`, `sessions/`, and `archived_sessions/`
  ([`foreign_sessions/codex/mod.rs`](https://github.com/xai-org/grok-build/blob/main/crates/codegen/xai-grok-workspace/src/foreign_sessions/codex/mod.rs)).
  Its own sessions live under `grok_home()/sessions/<encoded-cwd>`
  ([`xai-grok-config/src/paths.rs` L155–170](https://github.com/xai-org/grok-build/blob/main/crates/codegen/xai-grok-config/src/paths.rs)).
  A repo-wide search finds no write into `CODEX_HOME`. It does have a strict `codex`
  harness type (wire-format emulation,
  [`mvp_agent/mod.rs` L1063–1081](https://github.com/xai-org/grok-build/blob/main/crates/codegen/xai-grok-shell/src/agent/mvp_agent/mod.rs)),
  but that steers prompts, not persistence.
- **opencode** ([anomalyco/opencode](https://github.com/anomalyco/opencode)) has a codex
  plugin that does ChatGPT-plan OAuth (originator `opencode` in the authorize URL) and
  talks to `chatgpt.com/backend-api/codex/responses`
  ([`plugin/openai/codex.ts` L10–92](https://github.com/anomalyco/opencode/blob/dev/packages/opencode/src/plugin/openai/codex.ts)).
  No code touches `~/.codex/sessions`; the repo has zero `CODEX_HOME` references.

Conclusion: the writer of the impostor files is **unidentified**. Candidates outside
these repos exist (session-converter tools such as
[SakuraByteCore/codexmate `cli/session-convert.js`](https://github.com/SakuraByteCore/codexmate),
[yigitkonur/cli-continues](https://github.com/yigitkonur/cli-continues), community
plugins, or a closed-source build of either tool). The attribution question does not
block the fix, because the fingerprint in §1 does not depend on knowing the writer.
A cheap follow-up diagnostic: have a tester report the `session_meta.originator`
histogram of their flagged files (a field name and a count - no content).

## 3. Recommendation: exclude on fingerprint failure, count it, name it

The `unknown` bucket exists because `ingestEvent` attributes a delta to
`state.modelKey ?? "(unknown)"`, and `modelKey` is only set by a `turn_context`
([`packages/cli/src/harness/codex/analyzer.ts` L111–114, L171](../../packages/cli/src/harness/codex/analyzer.ts)).
Three options were on the table:

- **Keep with an honest label** - rejected. The tokens are another agent's usage. They
  distort the Codex model shares, and their cost is unpriceable (no model), so the cost
  floor lies in both directions.
- **Re-attribute** - rejected. `originator` is a free-form string, not a harness id, and
  building further harness adapters is out of scope on map #60.
- **Exclude, count, and report** - recommended. Classify per file: a file whose first
  parsed line is not `session_meta`, or that carries a `token_count` with no preceding
  `turn_context`, fails the genuine fingerprint. Drop its usage from the aggregate,
  count it in a new scan stat (for example `filesForeign`), and print one local coverage
  line: "N files in ~/.codex/sessions were not written by Codex CLI - skipped
  (originators: …)". Counts and originator names may ride in the local summary; nothing
  new enters the payload.

Two consequences make the scan self-checking. First, the `(unknown)` model bucket then
only arises from genuine files, so it should sit at ~0; a nonzero value becomes a real
signal (for example a codex format change) instead of noise. Second, the classification
needs a two-pass or buffered fold per file (the verdict arrives at end of file), which
fits the existing whole-file read in `scan.ts`.

## 4. The partial-read failure

### Where the number comes from

`scan()` wraps `ingestFile` in a bare catch: any throw increments
`stats.filesUnreadable` and decrements `filesRead`
([`codex/scan.ts` L125–131](../../packages/cli/src/harness/codex/scan.ts)). The catch is
deliberately silent because the error object carries the absolute path (standing
privacy non-goal). The summary then prints only the count
([`sync/summary.ts` L179](../../packages/cli/src/sync/summary.ts)) - which is why the
warning names neither file nor reason.

### What can throw

Verified by synthetic reproduction (a corrupt `.zst` and a `chmod 000` file both land in
`filesUnreadable`; the local real corpus reads 26/26 clean):

1. **`.zst` on an old Node runtime.** `zlib.zstdDecompressSync` is feature-detected;
   when absent, every `.zst` throws
   ([`codex/scan.ts` L65–72, L155–158](../../packages/cli/src/harness/codex/scan.ts)).
   This is not the testers' case: a 1285-file machine with week-old sessions would have
   many `.zst` files (see below), not exactly one failure.
2. **A corrupt or truncated `.zst`.** Unlikely from codex itself - it writes via a
   `.tmp` file and an atomic no-clobber rename
   ([`rollout/src/compression.rs` L127](https://github.com/openai/codex/blob/rust-v0.146.0/codex-rs/rollout/src/compression.rs)).
3. **The compression race (most likely).** Codex spawns a background worker on start
   that compresses rollouts older than 7 days (`MIN_ROLLOUT_AGE`,
   [compression.rs L258](https://github.com/openai/codex/blob/rust-v0.146.0/codex-rs/rollout/src/compression.rs))
   and then **unlinks the plain `.jsonl`**
   ([compression.rs L682](https://github.com/openai/codex/blob/rust-v0.146.0/codex-rs/rollout/src/compression.rs)).
   A scan that runs while Codex is open can list a `.jsonl` in the walk and get `ENOENT`
   at read time. "Exactly 1 of N" on two different machines fits one file caught
   mid-compression. Codex's own reader handles this with a retry that falls back to the
   `.zst` path (`MAX_NOT_FOUND_RETRIES`,
   [compression.rs L19, L47](https://github.com/openai/codex/blob/rust-v0.146.0/codex-rs/rollout/src/compression.rs)).
4. **Permissions** (`EACCES`) - possible, machine-specific.

Related edge from the same worker: between the `.zst` rename and the `.jsonl` unlink,
both files exist. The walk would ingest both (dedup is by `realpath`, and the two names
differ), which double-counts that session's tokens. The window is milliseconds wide;
it is noted here but was not observed.

### Fix shape

1. **Name file and reason locally.** Collect per-failure records
   `{path relative to codexHome, error class}` (`ENOENT`, `EACCES`, `zstd-unsupported`,
   `zstd-corrupt`) and print them in the coverage warning. Relative paths and error
   classes stay on the machine - the payload keeps bare counts, unchanged.
2. **Close the race before counting.** On `ENOENT` for `foo.jsonl`, try
   `foo.jsonl.zst` once before counting the file unreadable - mirrors codex's own
   fallback. This should turn "1 unreadable" into 0 on busy machines.
3. **Distinguish the runtime gap.** When `zstdDecompress === null`, report the `.zst`
   count as its own line ("N compressed rollouts need Node ≥ 22.15") instead of folding
   it into generic unreadability.

## Sources

- [openai/codex @ rust-v0.146.0 - rollout recorder](https://github.com/openai/codex/blob/rust-v0.146.0/codex-rs/rollout/src/recorder.rs),
  [policy](https://github.com/openai/codex/blob/rust-v0.146.0/codex-rs/rollout/src/policy.rs),
  [compression](https://github.com/openai/codex/blob/rust-v0.146.0/codex-rs/rollout/src/compression.rs),
  [session core](https://github.com/openai/codex/blob/rust-v0.146.0/codex-rs/core/src/session/mod.rs),
  [thread_manager](https://github.com/openai/codex/blob/rust-v0.146.0/codex-rs/core/src/thread_manager.rs)
- [xai-org/grok-build - foreign_sessions/codex](https://github.com/xai-org/grok-build/tree/main/crates/codegen/xai-grok-workspace/src/foreign_sessions/codex),
  [paths.rs](https://github.com/xai-org/grok-build/blob/main/crates/codegen/xai-grok-config/src/paths.rs)
- [anomalyco/opencode - plugin/openai/codex.ts](https://github.com/anomalyco/opencode/blob/dev/packages/opencode/src/plugin/openai/codex.ts)
- Local: `~/.codex/sessions` (26 files, structure only), `packages/cli/src/harness/codex/{scan,analyzer}.ts`, synthetic failure repro in the session scratchpad
- Prior report: [codex-session-log-anatomy-2026-08.md](codex-session-log-anatomy-2026-08.md)
