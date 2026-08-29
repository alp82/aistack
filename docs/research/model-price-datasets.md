# Model price datasets: which one an automatic import should read

Research for [#333](https://github.com/alp82/aistack/issues/333), on map
[#332](https://github.com/alp82/aistack/issues/332). Written 2026-08-29.

Every figure below was read from the live file or API on 2026-08-29, not from a
write-up. The raw downloads (LiteLLM 1.97 MB, OpenRouter 655 KB, models.dev 4.43 MB)
were compared against `PRICES` in `packages/pricing/src/index.ts` (13 first-party keys
plus `codex-auto-review`, 27 rows with the `#fast` and Gemini rows) and against the 45
rows of `models` on prod (`scripts/convex-prod.sh data models`).

## The answer in one paragraph

**Read models.dev (`https://models.dev/api.json`) as the primary source, with LiteLLM's
`model_prices_and_context_window.json` as the fallback and cross-check.** models.dev is
the only one of the four that carries `release_date`, a clean first-party id per model
(`anthropic/claude-opus-5`, `openai/gpt-5.6-terra`), a `cache_write` rate, provider
logos, a schema, MIT data, and a git repo whose TOML files diff per model. LiteLLM has
the widest key coverage and the only 1-hour cache-write rate, but its ids are one flat
namespace of 3,365 rows where the same model appears 6 to 12 times. OpenRouter has no
release dates and no git history, and it re-serves at gateway rates. **No source carries
dated rate history that covers this catalog**, so the import must synthesize history by
diffing on a cron and by reading the git log for the backfill.

## The four sources side by side

| | LiteLLM | OpenRouter | models.dev | llm-prices.com |
| --- | --- | --- | --- | --- |
| URL | raw `model_prices_and_context_window.json` on `main` | `GET /api/v1/models` | `api.json` (built from `providers/*/models/*.toml`) | `historical-v1.json` |
| Rows | 3,365 keys | 396 models | 207 providers, 7,487 provider-models | 162 models |
| Id shape | flat, provider-prefixed sometimes (`claude-opus-5`, `us.anthropic.claude-opus-5`, `azure_ai/claude-opus-5`) | `vendor/model` plus `:batch`, `:free`, `-fast` variants and a dated `canonical_slug` | `provider` then `model` id, first-party providers keyed by vendor | `vendor` + free-form id |
| 13 price keys covered | 13 of 13 | 13 of 13 | 13 of 13 | partial |
| Prod catalog covered | 15 of 15 first-party LLM slugs (bare or via a gateway key) | 13 of 15 (no `grok-4-1`, no `gemini-3-pro-preview`) | 13 of 15 on the vendor provider (`deepseek-v3.2` and `grok-4.1` only on gateway providers) | not checked, too thin |
| Dated history | no (`deprecation_date` only) | no | no (`release_date`, `last_updated`) | yes, `from_date`/`to_date`, but every checked row is a single undated period |
| Cache read | yes | yes | yes | `input_cached`, no write |
| Cache write | yes, 5m and `_above_1hr` | yes, `input_cache_write` and `input_cache_write_1h` | yes, 5m only | no |
| Context window | `max_input_tokens`, `max_output_tokens` | `context_length`, `top_provider.max_completion_tokens` | `limit.context`, `limit.input`, `limit.output` | no |
| Release date | no | `created` (listing time on OpenRouter, an epoch) | `release_date`, `last_updated`, `knowledge` | no |
| Icons | no | no | provider SVG at `/logos/{provider}.svg` | no |
| Aliases | none, each alias is its own row | `canonical_slug` | dated twin rows (`claude-haiku-4-5` and `claude-haiku-4-5-20251001`) | no |
| License | MIT (repo LICENSE; `enterprise/` carved out) | API terms, no data license stated | MIT | repo shows no license |
| Cadence | 100 commits to the file in the last 8 days (2026-08-21 to 08-29); 300 commits back to 2026-06-06 | live | 100 commits in the last 36 hours on `dev` | last updated 2026-08-22 |
| Git history usable for backfill | yes, one huge JSON, so a per-key diff needs a script | none | yes, one TOML per provider-model, so `git log -p` on a path is the history of that one row | yes, JSON per vendor |

## Coverage detail

### The 13 price keys

All four keys per vendor resolve in every source. The mapping the import needs:

| Repo key | models.dev | LiteLLM (bare key) | OpenRouter |
| --- | --- | --- | --- |
| `claude-fable-5` | `anthropic/claude-fable-5` | `claude-fable-5` | `anthropic/claude-fable-5` |
| `claude-opus-5`, `-4-8`, `-4-7`, `-4-6`, `-4-5` | `anthropic/claude-opus-5` etc. | same id | `anthropic/claude-opus-5`, `anthropic/claude-opus-4.8` (dot) |
| `claude-sonnet-5`, `-4-6` | `anthropic/claude-sonnet-5` | same | `anthropic/claude-sonnet-5` |
| `claude-haiku-4-5` | `anthropic/claude-haiku-4-5` (plus dated twin) | `claude-haiku-4-5` (plus dated twin) | `anthropic/claude-haiku-4.5` |
| `claude-opus-5#fast` | `experimental.modes.fast.cost` on the same row (10/50, cache 1/12.5) | `provider_specific_entry.fast: 2.0` (a multiplier) | `anthropic/claude-opus-5-fast` |
| `gpt-5.5`, `gpt-5.4`, `gpt-5.4-mini`, `gpt-5.3-codex`, `gpt-5.6-sol/terra/luna` | `openai/<id>` | bare `<id>` | `openai/<id>` |
| `gemini-3.1-pro-preview`, `gemini-3.6-flash`, `gemini-3.5-flash`, `gemini-3-flash-preview`, `gemini-2.5-pro`, `gemini-2.5-flash` | `google/<id>` | `gemini/<id>` and bare | `google/<id>` |
| `gemini-3-pro-preview` (retired) | not on `google/`, only on gateways | `gemini-3-pro-preview` still present | absent |
| `codex-auto-review` | absent | absent | absent |

`claude-mythos-5` was not checked (no catalog row).

### The prod catalog (45 rows, 15 of them first-party LLMs the import must match)

Slugs on prod: `claude-opus-5`, `claude-sonnet-5`, `claude-haiku-4-5`, `fable-5`,
`claude-opus-48`, `opus-48`, `claude-opus-47`, `claude-opus-4-6`, `claude-opus-4-5`,
`claude-sonnet-4-6`, `claude-sonnet-47`, `claude-haiku-46`, `claude-haiku-47`, `gpt-5.4`,
`gpt-5.5`, `gpt-5.6-terra`, `gpt-5.6-sol`, `gpt-5.6-luna`, `gpt-5.3-codex`, `gpt-5.4-mini`,
`gpt-54-codex`, `gpt-5-2`, `gemini-3-pro`, `gemini-3-1-pro`, `glm-5`, `glm-52`, `kimi-k2-5`,
`kimi-k3`, `deepseek-v3-2`, `grok-4-1`, `grok-43`, `grok-45`, `minimax-m2-5`,
`llama-4-scout`, `composer-25`, `swe-1-5`, plus 9 non-LLM rows (image, video, audio,
embedding).

Three observations from matching them:

1. **The catalog slugs are not one id space.** `claude-opus-48` and `opus-48` are two
   rows for one model; `fable-5` drops the `claude-` prefix that every dataset uses;
   `gemini-3-1-pro` and `gpt-5-2` swap dots for dashes while `gpt-5.4` keeps the dot.
   Whichever source is chosen, the import has to hold an explicit `slug -> source id`
   map on the catalog row and cannot derive it.
2. **The third-party rows are where the sources diverge.** `glm-5`, `kimi-k2.5` sit on
   their vendor provider in models.dev (`zai/glm-5` at 1/3.2, `moonshotai/kimi-k2.5`)
   and on OpenRouter (`z-ai/glm-5`, `moonshotai/kimi-k2.5`). `deepseek-v3.2` has left
   the `deepseek` provider on models.dev (only `deepseek-v4-*` remain) and survives on
   gateway providers and on OpenRouter (`deepseek/deepseek-v3.2`). `grok-4.1` exists on no
   first-party provider anywhere: models.dev `xai` starts at `grok-4.20`, OpenRouter
   starts at `x-ai/grok-4.20`, LiteLLM has only `-fast-reasoning` variants under
   `xai/` and Azure keys. A retired model falls out of every live source; only git
   history keeps it.
3. **LiteLLM's breadth is duplication, not extra models.** `claude-opus-5` appears as
   `claude-opus-5`, `anthropic.claude-opus-5`, `global.`, `us.`, `eu.`, `au.`, `jp.`,
   `azure_ai/`, and the Bedrock `-v1:0` forms. An import that keys on the bare id gets
   the vendor rate; everything else is a reseller rate.

## What each source is, from its own repo

### LiteLLM `model_prices_and_context_window.json`

* Source: `https://raw.githubusercontent.com/BerriAI/litellm/main/model_prices_and_context_window.json`,
  MIT (`LICENSE`, with the `enterprise/` carve-out). The `sample_spec` key documents
  the fields: `input_cost_per_token`, `output_cost_per_token`,
  `cache_creation_input_token_cost`, `cache_creation_input_token_cost_above_1hr`,
  `cache_read_input_token_cost`, `max_input_tokens`, `max_output_tokens`,
  `deprecation_date`, `litellm_provider`, `mode`, and forty `supports_*` flags.
* Rates are per token (`5e-06`), so the import multiplies by 1e6.
* OpenAI rows carry the >272K tier as `_above_272k_tokens` suffixes plus `_flex`,
  `_priority`, `_batches` variants. The standard-context figure is the unsuffixed key,
  which is what `PRICES` encodes.
* No release date, no icon, no alias field. `deprecation_date` is set on 586 rows.
* Cadence: 100 commits to this one file between 2026-08-21 and 2026-08-29, 300 back to
  2026-06-06. It is the most frequently edited file of the four, and every edit is to
  one 2 MB JSON, so history per key means replaying the file at each commit.

### OpenRouter `GET /api/v1/models`

* 396 rows, fields: `id`, `canonical_slug` (dated, `anthropic/claude-opus-5-20260723`),
  `name`, `created`, `description`, `context_length`, `architecture`, `pricing`
  (`prompt`, `completion`, `input_cache_read`, `input_cache_write`,
  `input_cache_write_1h`, `web_search`, `internal_reasoning`, `overrides[]` for the
  >272K OpenAI tier), `top_provider`, `supported_parameters`, `knowledge_cutoff`,
  `expiration_date`. `/models/{slug}/endpoints` lists each upstream endpoint and its
  price.
* Rates are per token as decimal strings.
* The Anthropic and OpenAI rows match vendor list price exactly (Opus 5 at 5/25 with
  6.25 / 10 cache write, Sonnet 5 at 2/10, Terra at 2/12). `created` is the OpenRouter
  listing time, not the vendor release date (Opus 5: 1784912544, which is 2026-07-24).
* No history, no git, no icons, no data license. It is a live gateway price list:
  the `:free` and `:batch` variants and the `-fast` rows are its own products. It is
  the right source for "what does the gateway charge", which is the question the
  `openrouter:` provider key in `PRICES` will one day ask, and the wrong source for
  vendor list price history.

### models.dev (`anomalyco/models.dev`, formerly `sst/models.dev`)

* The GitHub repo redirected to `anomalyco/models.dev` (id 996360053), default branch
  `dev`, MIT, README: "community-contributed ... We also use it internally in
  opencode." 100 commits in the 36 hours before this was written.
* Data is TOML, one file per provider-model at
  `providers/<provider>/models/<id>.toml`, with model-only facts (release date,
  weights, license, links, benchmarks) in `models/<vendor>/<id>.toml` and provider
  files inheriting via `base_model`. A GitHub Action validates submissions against
  `packages/core/src/schema.ts`. `api.json` is the built projection.
* Per model: `id`, `name`, `family`, `release_date`, `last_updated`, `knowledge`,
  `limit.{context,input,output}`, `modalities`, `open_weights`, `reasoning`,
  `tool_call`, `cost.{input,output,cache_read,cache_write}` in dollars per million
  tokens, `cost.tiers[]` with `tier.{type:"context",size}` for the OpenAI 272K and
  Gemini 200K tiers, and `experimental.modes.fast.cost` for Anthropic fast mode.
* Provider logos: `https://models.dev/logos/{provider}.svg`, a default for unknown
  providers. There are no per-model icons anywhere; the catalog's `iconUrl` is a
  provider logo in every source that has one.
* Cache write is the 5-minute rate only (Opus 5: 6.25). The 1-hour rate is absent.
* Dated twin rows (`claude-haiku-4-5` and `claude-haiku-4-5-20251001`) are the alias
  mechanism; the repo's dated-suffix strip already reduces these to one key.

### llm-prices.com (`simonw/llm-prices`)

The only source built around history: `historical-v1.json` carries a `price_history`
array per model with inclusive `from_date` and exclusive `to_date`. In practice every
one of the 162 rows checked holds a single period with both dates `null`, it lists no
Opus 5 and no Haiku 4.5 by current id, carries no cache-write rate, and was last
updated 2026-08-22. It is a shape to copy, not a feed to read.

## Three rate facts this research turned up

1. **`gemini-3.6-flash` is encoded at 1.5 / 7.5 in `PRICES`, and all three datasets say
   0.75 / 3.75.** Google's pricing page confirms: "$0.75 through December 31, 2026.
   $1.50 starting January 1, 2027." The repo has the post-2027 rate as the current
   rate, which overstates cost and breaks the lower-bound tenet. This is exactly the
   drift an import prevents, and it is also a dated period with a known boundary that
   only the vendor page states: no dataset carries the January 2027 step.
2. **`claude-sonnet-5`'s introductory 2 / 10 is what every dataset holds today**, with
   no end date. `PRICES` already encodes the 2026-08-31 step to 3 / 15. On September 1
   the diff cron will see the datasets move, if they move, and that observation lands
   one day late at best.
3. **The 1-hour cache-write rate lives in only two places**, LiteLLM
   (`cache_creation_input_token_cost_above_1hr`) and OpenRouter
   (`input_cache_write_1h`). The repricer in `convex/lib/reprice.ts` charges the
   1-hour tier its own rate, so models.dev alone cannot fill that column and LiteLLM
   has to.

## Recommendation

**Primary: models.dev.** Read `api.json` on a cron. Take `cost`, `limit`,
`release_date`, `last_updated`, `family`, and the provider logo. Key first-party
lookups on the vendor provider (`anthropic`, `openai`, `google`, `zai`, `moonshotai`,
`deepseek`, `xai`) so a gateway row never reaches the vendor rate, which is the rule
`entryFor` already applies. It wins because it is the one source with a release date,
a schema, a per-model file in git, and because opencode (a harness the CLI already
reads) is the same project's consumer, so its ids match what that harness reports.

**Fallback and cross-check: LiteLLM.** Read the bare vendor key per model for the
1-hour cache-write rate, for `deprecation_date`, and for any model models.dev has
dropped (`gemini-3-pro-preview` is still there). When the two disagree on
input/output, hold the row for review instead of writing either.

**Not OpenRouter for list prices.** Keep it in reserve for the `openrouter:` provider
key, where its own rate is the true rate.

## What the import must synthesize itself

* **History.** No source carries dated periods for this catalog. The import writes one
  `(model, rateTableId, from, to)` row per observed change: every cron run compares
  the fetched rate against the open period and closes it at the run's timestamp when
  it differs. A rate change is therefore dated to the run that saw it, not to the
  vendor's effective date, and the record should say so. For the backfill, `git log
  -p -- providers/anthropic/models/claude-opus-5.toml` on `anomalyco/models.dev`
  gives the commit dates each rate changed; LiteLLM's history is the same file
  replayed per commit and needs a script.
* **Announced future steps.** The Gemini 3.6 Flash January 2027 step and the Sonnet 5
  August 31 step are vendor-page facts. They stay hand-entered in `PRICES` and the
  import must not overwrite a future period the cron cannot see.
* **The slug map.** Catalog slugs (`fable-5`, `opus-48`, `gemini-3-1-pro`) do not
  derive from any dataset id. Each catalog row needs an explicit source id, and the
  two Opus 4.8 rows need merging first.
* **Retired models.** `grok-4-1`, `deepseek-v3-2`, `gemini-3-pro-preview` are gone
  from live first-party rows. The import must keep a row whose source row disappears,
  and mark it retired rather than delete it.
* **Rows no source has.** `codex-auto-review` stays a hand-entered row with its
  aggregator-consensus note.
* **Icons.** Only provider logos exist. Per-model icons remain the owner's upload.
* **Consent to overwrite.** The table id on each rate (`anthropic-2026-07-25`) is what
  every surface cites. An imported rate needs its own table id
  (`models.dev@<commit>`) so a printed dollar figure can still name where its rate
  came from.
