# What a Claude Code Skill can actually do — primary-source research

Research for auto-sync v1 (issue #31, wayfinder map #29). Question: for each capability
auto-sync needs — get an explicit local approval, send approved aggregates to our backend
as this user, ship and update the thing, and optionally analyze at session end — **what do
Claude Code Skills, hooks, MCP servers and plugins actually provide**, and where is the
line between "the model cooperates" and "the harness enforces it"?

The point is to let a design grilling pick a **send channel** and an **approve-gate design**
from documented facts. Where something doesn't exist, that is stated plainly.

Standing product constraint checked throughout: **raw transcripts, prompt text, filesystem
paths and repo names never leave the machine.**

## Method and evidence base

- **Docs**: `code.claude.com/docs/en/...` (the `docs.claude.com/en/docs/claude-code/*` URLs
  now 301-redirect there). Fetched **2026-07-24**. Pages read: hooks, skills, permissions,
  permission-modes, tools-reference, mcp, plugins-reference, plugin-marketplaces,
  discover-plugins, sub-agents, headless, cli-reference, settings, security,
  monitoring-usage.
- **This machine**: Claude Code **2.1.219**, Linux. `claude --help`, `claude mcp --help`,
  `claude plugin --help`, `~/.claude/` layout, `~/.claude/settings.json`,
  `~/.claude/plugins/`. Plus four live experiments (§1.6) run with `claude -p`.
- **This repo**: `src/routes/api.cli.*`, `convex/httpCli.ts`, `convex/cliTokens.ts`,
  `convex/cliSessions.ts`, `convex/schema.ts` — the existing `/api/cli/*` precedent.

Markers used on every load-bearing claim:

| Marker | Meaning |
|---|---|
| **(documented)** | Stated in the owning Anthropic doc page, linked inline |
| **(observed)** | Verified on this machine at Claude Code 2.1.219; may be version-dependent |
| **(underspecified)** | The docs touch it but don't pin down the behaviour we need |
| **(unverified)** | Claim we could not confirm from a primary source |

Claude Code moves fast — the docs are dense with `min-version` notes across 2.1.126–2.1.219.
Treat every behaviour below as pinned to the 2.1.21x line.

---

## 1. Approve-gate primitives

### 1.1 `AskUserQuestion`

The built-in multiple-choice prompt. It is the *nicest* confirm UI available, and the
*weakest* guarantee.

| Fact | Marker | Source |
|---|---|---|
| Asks multiple-choice questions; user answers by picking an option or typing free text via the `Other` row / notes field | documented | [tools-reference § AskUserQuestion](https://code.claude.com/docs/en/tools-reference#askuserquestion-tool-behavior) |
| `Permission required: No` — the tool itself never goes through the permission engine | documented | [tools-reference tool table](https://code.claude.com/docs/en/tools-reference) |
| Questions stay open until answered, unless `askUserQuestionTimeout` is set to `60s` / `5m` / `10m`; default `"never"`. Not read from project or local settings | documented | [tools-reference](https://code.claude.com/docs/en/tools-reference#question-auto-continue-timeout), [settings](https://code.claude.com/docs/en/settings) |
| On timeout it "submits any options you'd already selected and tells Claude you may be away from your keyboard, so Claude proceeds on its own judgment" | documented | tools-reference |
| **Removed from every subagent**, "even when listed in the `tools` field" | documented | [sub-agents § Available tools](https://code.claude.com/docs/en/sub-agents#control-subagent-capabilities) |
| **Absent in `claude -p` / print mode.** The `system/init` tool list on 2.1.219 contains no `AskUserQuestion` | **observed** | experiment E1, §1.6 |
| Denied in `dontAsk` mode "even if you've allowed them" | documented | [permission-modes § dontAsk](https://code.claude.com/docs/en/permission-modes#allow-only-pre-approved-tools-with-dontask-mode) |
| Input schema (max questions, max options, multi-select support) | **underspecified** — the docs describe the UX, not the wire schema | — |

**Design consequences.**

1. A skill that runs with `context: fork` (subagent) **cannot ask the user anything**. If
   auto-sync wants a question, the asking must happen in the main-loop turn.
2. `AskUserQuestion` is *model-invoked*. Nothing forces the model to call it, and nothing
   stops the model from proceeding after a timeout or an ambiguous answer. It is an
   **affordance, not a gate**.
3. In `-p` mode there is no ask at all — a skill body that says "ask the user, then send"
   degrades silently into "send" unless something else blocks.

### 1.2 The permission engine (the strong layer)

Rules live in `permissions.{allow,ask,deny}` in any settings file. Precedence is
**deny-first**, and modes only set the baseline.

| Mode | Runs without asking | Notes |
|---|---|---|
| `default` (UI label **Manual**) | reads only | |
| `acceptEdits` | reads, file edits, `mkdir`/`touch`/`rm`/`rmdir`/`mv`/`cp`/`sed` in-scope | |
| `plan` | reads only; non-read-only shell commands still prompt | edits blocked until plan approved |
| `auto` | everything, behind a classifier model | explicit `ask` rules still force a prompt |
| `dontAsk` | only pre-approved tools; **never waits for input** | anything that would prompt is auto-denied |
| `bypassPermissions` | everything, incl. protected paths | see exceptions below |

Source: [permission-modes](https://code.claude.com/docs/en/permission-modes).

**What survives even `bypassPermissions`** (documented, [permission-modes § bypassPermissions](https://code.claude.com/docs/en/permission-modes#skip-all-checks-with-bypasspermissions-mode)):

- explicit `ask` rules
- connector tools an organization set to `ask`
- MCP tools marked `_meta["anthropic/requiresUserInteraction"]` (v2.1.199+)
- `rm -rf /` / `rm -rf ~` circuit breaker

> "Modes set the baseline. Layer permission rules on top… These controls apply in every
> mode, including `bypassPermissions`: deny rules and explicit ask rules…, the org `ask`
> setting on connector tools, [and] the `requiresUserInteraction` marker."

`--dangerously-skip-permissions` is documented as **exactly equivalent** to
`--permission-mode bypassPermissions` ([cli-reference](https://code.claude.com/docs/en/cli-reference)),
so it inherits the same exception list. It cannot be entered mid-session from a session that
didn't start with it enabled, refuses to run as root/sudo on Linux/macOS, and shows a
one-time acceptance dialog in interactive mode (none in headless).

Relevant rule syntax for a send channel (documented, [permissions](https://code.claude.com/docs/en/permissions)):

- `WebFetch(domain:aistack.to)` — hostname matching, `*` wildcards, no dot-crossing.
- `Bash(<prefix> *)` — leading env assignments stripped, each `&&`-subcommand checked,
  `$( )` and backtick contents checked; **filters fail open when Bash can't be parsed**.
- `mcp__<server>` / `mcp__<server>__<tool>` / `mcp__<server>__*`. Allow rules accept a
  tool-name glob *only after a literal `mcp__<server>__` prefix*; an unanchored `mcp__*`
  allow "is skipped with a warning and doesn't auto-approve anything". Deny/ask accept
  full globs including `mcp__*`.

### 1.3 `PreToolUse` hooks as a gate

A `PreToolUse` hook can return `hookSpecificOutput.permissionDecision` of
`"deny" | "allow" | "ask" | "defer"` with a `permissionDecisionReason`, or exit 2 to hard-block
(stdout ignored, stderr becomes the reason). Exit code **1 is non-blocking** — only exit 2
blocks (documented, [hooks](https://code.claude.com/docs/en/hooks)).

The precedence rules are the important part (documented, [permissions § Extend permissions with hooks](https://code.claude.com/docs/en/permissions#extend-permissions-with-hooks)):

> "Hook decisions don't bypass permission rules. Claude Code evaluates deny and ask rules
> regardless of what a PreToolUse hook returns: a matching deny rule blocks the call, and a
> matching ask rule still prompts even when the hook returned `"allow"` or `"ask"`."

> "A blocking hook also takes precedence over allow rules. A hook that exits with code 2
> stops the tool call before permission rules are evaluated."

So the ordering is: **hook exit-2 block > deny rules > ask rules > hook allow > allow rules
> mode default.**

Can a hook *force a prompt the user must answer*? Yes in interactive mode — `permissionDecision: "ask"`
routes into the permission flow. **Observed (E3, §1.6): under `--permission-mode bypassPermissions`
in headless, a `PreToolUse` hook returning `"ask"` prevented the Bash call from running and
the call was recorded in `permission_denials`.** That means the hook's `ask` is honoured over
bypass mode. Whether it renders as an interactive prompt (rather than a deny) in an
*interactive* bypass session is **unverified** — headless has no human, so an `ask` can only
resolve as a denial there.

Hooks a plugin ships: `hooks/hooks.json` in the plugin root, or inline in `plugin.json`
(documented, [plugins-reference § Hooks](https://code.claude.com/docs/en/plugins-reference)).
Skills can also declare hooks in frontmatter, scoped to the skill's lifecycle, with `once: true`
supported *only* in skill frontmatter (documented, [hooks § Hooks in skills and agents](https://code.claude.com/docs/en/hooks)).

### 1.4 MCP `requiresUserInteraction` — the strongest in-harness gate

This is the single most load-bearing finding for the approve gate.

An MCP server marks a tool in its `tools/list` entry:

```json
{
  "name": "grant_access",
  "description": "Requests access to a protected resource",
  "_meta": { "anthropic/requiresUserInteraction": true }
}
```

Documented behaviour ([mcp § Require approval for a specific tool](https://code.claude.com/docs/en/mcp#require-approval-for-a-specific-tool),
requires **v2.1.199+**; earlier versions silently ignore it):

- Claude Code "shows that tool's permission prompt on every call, even in `acceptEdits`,
  `auto`, and `bypassPermissions` permission modes, and doesn't offer a 'don't ask again'
  option for it. Allow rules that match the tool don't skip the prompt either."
- In `dontAsk` mode, "Claude Code denies the call instead."
- With `--permission-prompt-tool` in non-interactive mode, an `allow` from the prompt tool
  "is converted to a deny with the message `MCP tool requires user interaction; not
  supported via --permission-prompt-tool`."
- Remote Control / one-tap approval is withheld: "Claude Code withholds the one-tap action
  and shows the tool's full permission prompt instead, so approval still comes from a
  person answering the prompt rather than a tap."
- In auto mode it "skips the classifier and prompts you directly, so a consent step is never
  auto-approved on the tool author's behalf."
- The docs name our exact use case: *"Use this for tools whose permission prompt is itself
  the point, such as a consent or access-grant step where auto-approval would mean no human
  ever agreed."*

The one documented hole: **the Agent SDK's `canUseTool` callback does receive these calls
and can approve them**, "because your SDK application is expected to show them to a user."
So an SDK host embedding Claude Code can still auto-approve. This is a real but narrow
escape hatch — it requires someone to write an SDK app around auto-sync.

The value must be the JSON boolean `true`; any other value is ignored.

### 1.5 Terminal fallbacks — there are none

| Fact | Marker |
|---|---|
| Hooks: "On macOS and Linux, command hooks run in their own session without a controlling terminal as of v2.1.139. The hook process and any child processes can't open `/dev/tty` or send escape sequences directly to the Claude Code interface. Windows has no `/dev/tty`." | documented ([hooks](https://code.claude.com/docs/en/hooks)) |
| A hook's only channels back to the human are `systemMessage` (a warning line) and `terminalSequence` (OSC 0/1/2/9/99/777 + BEL only — bell, window title, desktop notification) | documented |
| **Bash tool calls have no TTY either**: `test -t 0` and `test -t 1` both false; `exec 3<>/dev/tty` fails with `no such device or address`; stdin reads EOF immediately | **observed** (E4, §1.6) |
| Hook JSON output strings are capped at 10,000 chars; `additionalContext` same cap | documented |

**A bundled CLI launched via the Bash tool therefore cannot prompt interactively.** Any
`readline`, `inquirer`, `read -p`, or `/dev/tty` confirm inside it will either hang until the
600 s hook/tool timeout or read EOF and fall through — the classic "EOF means yes" bug. This
rules out the obvious "our CLI asks for confirmation" design *inside a Claude Code session*.

The only truly out-of-band confirm is the user running the CLI **themselves, in their own
terminal**, outside Claude Code.

### 1.6 Experiments run (all on Claude Code 2.1.219, this machine, 2026-07-24)

**E1 — is `AskUserQuestion` available in `-p`?** No.
`claude -p "say hi" --output-format stream-json --verbose --setting-sources ""` → the
`system/init` event's `tools` array was:
`Task, Bash, CronCreate, CronDelete, CronList, DesignSync, Edit, EnterWorktree, ExitWorktree,
Monitor, NotebookEdit, PushNotification, Read, RemoteTrigger, ReportFindings, ScheduleWakeup,
SendMessage, Skill, TaskCreate, TaskGet, TaskList, TaskOutput, TaskStop, TaskUpdate, ToolSearch,
WebFetch, WebSearch, Workflow, Write` — no `AskUserQuestion`, no `EnterPlanMode`/`ExitPlanMode`.
A direct instruction to call it produced: *"I don't have the AskUserQuestion tool available in
this session."*

**E2 — does an explicit `ask` rule survive `bypassPermissions` in headless?** Yes, as a denial.
`claude -p "Run exactly: echo hello-gate" --permission-mode bypassPermissions --settings
'{"permissions":{"ask":["Bash"]}}'` → command not run; `permission_denials` contained the
Bash call.

**E3 — does a `PreToolUse` hook returning `permissionDecision:"ask"` survive `bypassPermissions`
in headless?** Yes, as a denial. Same shape as E2, with a hook script emitting
`{"hookSpecificOutput":{"hookEventName":"PreToolUse","permissionDecision":"ask","permissionDecisionReason":"gate test"}}`
→ command not run, recorded in `permission_denials`.

**E4 — TTY availability inside a Bash tool call.** See §1.5.

**E5 — real `SessionEnd` / `Stop` payloads.** See §4.2.

### 1.7 Where the guarantee lives — threat enumeration

Enumerating the ways a well-meaning-but-confused agent could send without a human "yes",
and what actually forecloses each:

| # | Failure mode | Foreclosed by |
|---|---|---|
| 1 | Model reads the skill, decides the aggregate "looks fine", skips the ask, calls the send tool | **Only** a harness gate on the *send* action: `requiresUserInteraction` MCP tool, an `ask` rule on the send command/domain, or a `PreToolUse` hook returning `ask`. Skill prose does not foreclose it. |
| 2 | Model calls `AskUserQuestion`, user is AFK, `askUserQuestionTimeout` fires, model "proceeds on its own judgment" | Same as #1. The timeout is documented to hand control back to the model. |
| 3 | Skill runs with `context: fork` → `AskUserQuestion` stripped → model asks nothing and proceeds | Same as #1, plus: don't ship the skill with `context: fork`. |
| 4 | User is in `auto` or `acceptEdits` mode; the send is "just another Bash/WebFetch call" | `requiresUserInteraction`, or an explicit `ask` rule. Allow rules and mode defaults do **not** hold. |
| 5 | User runs `--dangerously-skip-permissions` / `bypassPermissions` | `requiresUserInteraction` (documented) and explicit `ask` rules (documented + observed E2); a `PreToolUse` `ask` also held (observed E3). A plain deny/allow-rule design does not hold. |
| 6 | Auto-sync is invoked headlessly (`claude -p`, CI, a scheduled task) | `requiresUserInteraction` → denied. `ask` rule → denied (E2). `AskUserQuestion` → not even present (E1). All three fail *closed*, which is the correct direction. |
| 7 | Skill declares `allowed-tools: Bash(${CLAUDE_SKILL_DIR}/scripts/publish.sh *)` and the send runs with no prompt at all | Nothing — this is a self-inflicted wound. **Do not put the send command in `allowed-tools`.** See §3.2. |
| 8 | User `dontAsk` mode | Everything interactive is denied. Fails closed. |
| 9 | Someone embeds auto-sync in an Agent SDK app and auto-approves via `canUseTool` | Nothing in Claude Code. Documented escape hatch for `requiresUserInteraction`. |
| 10 | Prompt injection from repo content steers the model into sending | Same as #1 — the gate must be on the action, not in the prompt. |

**Verdict for the grilling.** The guarantee ladder, weakest to strongest:

1. *Skill prose telling the model to ask* — no guarantee. Fails #1, #2, #3, #4, #5, #6, #10.
2. *`AskUserQuestion`* — a good UI, no guarantee. Fails #1–#3, #6.
3. *A `PreToolUse` hook* — real, but the hook is itself user-installable config that can be
   disabled (`disableAllHooks`, `--bare`, `--safe-mode`, no plugin enabled). Holds #4/#5 when
   present (E3).
4. *Permission `ask` rule on the send action* — strong, survives bypass (E2), but lives in the
   user's settings and can be edited away by the user (or by an agent with `.claude` write
   access — though `.claude` is a protected path in every mode except `bypassPermissions`).
5. *MCP tool marked `requiresUserInteraction`* — **strongest in-harness option**. The guarantee
   ships with *our* server, not with the user's config; it cannot be allow-ruled away, survives
   every permission mode, and fails closed in headless. Only the Agent-SDK `canUseTool` path
   bypasses it.
6. *A separate out-of-band step the user runs in their own terminal* — strongest overall,
   because the confirm happens outside the agent loop entirely. Costs the most UX.

Note that 5 and 6 are not exclusive: an MCP `publish_metrics` tool marked
`requiresUserInteraction` gives an in-session, human-answered prompt whose text we control,
which is very close to 6's guarantee with 2's ergonomics.

---

## 2. Authenticated sends

### 2.1 What Claude Code gives you

**MCP server auth** (documented, [mcp](https://code.claude.com/docs/en/mcp)):

| Mechanism | Detail |
|---|---|
| OAuth 2.0 + Dynamic Client Registration | Automatic; `/mcp` panel or `claude mcp login <name>`. Falls back to CIMD (Client ID Metadata Document) discovery, or `--client-id`/`--client-secret` + `--callback-port` when DCR is unsupported. |
| Headless OAuth | `claude mcp login <name> --no-browser` prints the URL and prompts for the pasted redirect URL. **Needs an interactive terminal** (`ssh -t`). "In non-interactive mode there's no `/mcp` panel, so Claude Code can't run the OAuth flow for you." |
| Static header | `claude mcp add --transport http x URL --header "Authorization: Bearer …"`. If the server rejects it, Claude Code reports a failed connection and does **not** fall back to OAuth. |
| `${ENV}` expansion in `.mcp.json` | `${VAR}` and `${VAR:-default}`, expanded in `command`, `args`, `env`, `url`, `headers`. Missing var with no default → server still loads, warning in `claude mcp list`, literal `${VAR}` used. |
| `headersHelper` | A command run at each connection (10 s timeout, cwd = session cwd) that must print a JSON string map to stdout; merged into connection headers, overriding static `headers`. Re-run automatically on a 401/403 with one retry (v2.1.193+). Env provided: `CLAUDE_CODE_MCP_SERVER_NAME`, `CLAUDE_CODE_MCP_SERVER_URL`, `CLAUDE_PLUGIN_ROOT`. Note: **executes arbitrary shell**; at project/local scope only after workspace trust. |
| Where credentials rest | OAuth: "Authentication tokens are stored securely and refreshed automatically"; clear via `/mcp` → Clear authentication, or `claude mcp logout <name>`. **The docs don't name the file** (underspecified). (observed) `~/.claude/.credentials.json` exists on this Linux machine with mode `0600`; macOS uses the Keychain per [security § Secure credential storage](https://code.claude.com/docs/en/security). |
| Where *server config* rests | Local & user scope → `~/.claude.json`; project scope → `.mcp.json` in the repo root (prompts for approval; reset with `claude mcp reset-project-choices`). |
| Tool naming | `mcp__<server>__<tool>`; plugin-bundled servers become `mcp__plugin_<plugin-name>_<server-name>__<tool>` and hooks/`if` matchers must use that scoped form. |

**Plugin `userConfig`** — a first-class secret prompt, and an under-appreciated option
(documented, [plugins-reference § User configuration](https://code.claude.com/docs/en/plugins-reference)):

```json
{ "userConfig": {
    "api_token": { "type": "string", "title": "API token",
                   "description": "aistack token", "sensitive": true } } }
```

- Claude Code prompts the user for these values when the plugin is enabled.
- `sensitive: true` masks input and stores the value in the **macOS Keychain, or
  `~/.claude/.credentials.json`** where no keychain exists. Shared ~2 KB budget with OAuth
  tokens — keep tokens short.
- Substitutable as `${user_config.KEY}` in MCP/LSP configs and hook commands; exported to
  hook processes as `CLAUDE_PLUGIN_OPTION_<KEY>`.
- **Shell-form hook commands, monitor commands, and `headersHelper` reject `${user_config.*}`**
  (v2.1.207+) because substituting into a shell would execute the value. Use exec form with
  `args`, or read `CLAUDE_PLUGIN_OPTION_<KEY>` from the environment. MCP `headers` is *not*
  shell-parsed, so `"Authorization": "Bearer ${user_config.api_token}"` is the sanctioned path.
- Non-sensitive values land in `settings.json` under `pluginConfigs[<plugin-id>].options`
  (user settings only from v2.1.207).

### 2.2 The existing aistack precedent — a working device-code flow

**This already exists and works.** It is a textbook OAuth-style device-authorization flow.

Web proxies (thin pass-throughs to the Convex HTTP router):

| Route | File | Method | Notes |
|---|---|---|---|
| `/api/cli/auth/start` | `src/routes/api.cli.auth.start.tsx:12-27` | POST | no auth |
| `/api/cli/auth/poll` | `src/routes/api.cli.auth.poll.tsx:12-32` | GET | no auth; forwards querystring |
| `/api/cli/stacks` | `src/routes/api.cli.stacks.tsx:12-50` | GET | forwards `Authorization` header if present (`:19-20`) |
| `/api/cli/stacks/collect` | `src/routes/api.cli.stacks.collect.tsx:12-52` | POST | forwards `Authorization` header (`:20-21`) |

All four resolve `convexOrigin` from `VITE_CONVEX_SITE_URL || VITE_CONVEX_URL` and throw at
module load if unset.

Convex side, `convex/http.ts:10-13`:

```
/api/cli/auth/start   POST  → httpCli.authStart
/api/cli/auth/poll    GET   → httpCli.authPoll
/api/cli/stacks/collect POST → httpCli.stackCollect
/api/cli/stacks       GET   → httpCli.stackGet
```

The flow (`convex/httpCli.ts`):

1. **`authStart`** (`:50-69`) generates a 6-char user code from a
   Crockford-ish alphabet `ABCDEFGHJKLMNPQRSTUVWXYZ23456789` (`:5-13`) and a
   `crypto.randomUUID()` `secretId`; inserts a `cliSessions` row with `status: 'pending'` and
   a **15-minute** expiry; returns `{ secretId, userCode, authUrl: "<APP_URL>/cli/auth?code=<userCode>" }`.
2. **User approves in the browser.** `src/routes/cli.auth.tsx` renders the approval page; it
   redirects to `/signin?redirect=/cli/auth?code=…` when unauthenticated (`:41-48`) and calls
   `api.cliSessions.approveSession` on click (`:53`). `convex/cliSessions.ts` `approveSession`
   is a **public mutation** that requires `ctx.auth.getUserIdentity()` and derives
   `userId = user.tokenIdentifier.split('|')[1]`.
3. **`authPoll`** (`:71-113`) looks the session up by `secretId`; on `approved` it mints a
   **32-byte hex** token via `crypto.getRandomValues` (`:15-21`), calls
   `cliSessions.issueTokenAndDeleteSession` (atomic issue + session delete), and returns
   `{ status, token, userId }`. Token TTL: **90 days**.
4. **Authenticated calls** send `Authorization: Bearer <token>`. `validateBearerToken`
   (`:34-48`) rejects a missing/non-`Bearer ` header with 401, looks the token up via
   `internal.cliTokens.getByToken`, and 401s on miss.
   `convex/cliTokens.ts:4-22` does an **exact-match index lookup** on `by_token` and returns
   `null` past `expiresAt`.
5. **`stackCollect`** (`:115-162`) resolves `creator` by `userId`, takes that creator's *first*
   stack, upserts resources, then **slides the expiry** another 90 days from last use
   (`refreshToken`, `cliTokens.ts:77-91`).

Schema (`convex/schema.ts:334-354`):

```
cliSessions: { userCode, secretId, status: 'pending'|'approved'|'expired', userId?, createdAt, expiresAt }
             indexes: by_userCode, by_secretId
cliTokens:   { token, userId, name?, createdAt, expiresAt, lastUsedAt }
             indexes: by_token, by_userId
```

`cliTokens.listByUser` (`:24-53`) is a public query returning the caller's tokens
**without the token value** — a revocation UI can be built on it, though no revoke mutation
exists yet.

**Assessment for the grilling.**

Reusable as-is: the device-code dance, the browser approval page, the bearer scheme, the
90-day sliding expiry, the token list query.

Gaps to name before extending it:

- **Tokens are stored in plaintext** in the `cliTokens` table (`token: v.string()` with a
  `by_token` index). A DB read discloses live credentials. Hashing would break the index
  lookup as written.
- **No revoke mutation** — `listByUser` exists, delete does not.
- **No scopes.** A token minted for "collect resources" would also authorize a future
  "publish metrics" endpoint unless scopes are added.
- **No rate limiting** on `/api/cli/*`. Contrast with `/api/stacks/{slug}`, which has the
  hand-rolled `apiRateLimits` fixed-window limiter. `authStart` is unauthenticated and mints
  a DB row per call.
- **One stack per creator is assumed** (`getFirstStackByCreator`) and unenforced.
- `authPoll` mints the token on *poll*, not on approve — so the token exists only after the
  CLI polls. Fine, but it means a stale `secretId` is the only thing standing between an
  approved session and a token; the `secretId` is a UUID, unguessable, and the session row is
  deleted on issue.

### 2.3 What a plain CLI would do instead

| Approach | Headless? | Steps for user | Where the secret rests | Revocable? | Notes |
|---|---|---|---|---|---|
| Device-code (what we have) | Auth step needs a browser once; subsequent sends fully headless | 1 (open URL, click approve) | our choice — currently the CLI's problem | server-side, needs a mutation | Already built. |
| PAT pasted once | Yes, after the paste | 2 (generate on site, paste) | wherever the CLI writes it | trivially (delete row) | Simplest; user friction is a page visit + copy. |
| Plugin `userConfig` `sensitive: true` | Yes | 1 (type into the plugin dialog at enable time) | **OS keychain, or `~/.claude/.credentials.json`** — managed by Claude Code, ~2 KB shared budget | server-side | The only option where *Claude Code stores the secret for us*. Pairs naturally with a PAT. |
| MCP OAuth (DCR) | Login needs an interactive terminal or browser; sends headless after | 1 (`/mcp` or `claude mcp login`) | Claude Code's credential store, auto-refreshed | `claude mcp logout` + server-side | Most "native", most implementation work (we'd have to run an OAuth AS). |
| `headersHelper` script | Yes | depends | our file | our problem | Useful if we already have a token file; 10 s budget, shell-executed, and can't read `${user_config.*}`. |
| Env var (`${API_KEY}` in `.mcp.json`) | Yes | user edits shell profile | shell rc / process env | our problem | Leaks into every subprocess and into `ps`-visible environments. Weakest. |
| Token file (`~/.config/aistack/token`, `0600`) | Yes | 1 paste | our file | our problem | Conventional; we own rotation and permissions. |
| OS keychain via `keytar` | Yes | 1 paste | OS keychain | our problem | Native module, install friction, no first-party support in Claude Code. |

**Privacy note that applies to all of them:** none of these leak anything by themselves. The
leak risk is in the *payload* and in what the transport sees — see §5.

---

## 3. Distribution and install

### 3.1 Where a skill can live

| Location | Path | Applies to |
|---|---|---|
| Enterprise | managed settings dir | all org users |
| Personal | `~/.claude/skills/<name>/SKILL.md` | all your projects |
| Project | `.claude/skills/<name>/SKILL.md` | that repo |
| Plugin | `<plugin>/skills/<name>/SKILL.md` | wherever the plugin is enabled |

Documented, [skills § Where skills live](https://code.claude.com/docs/en/skills). Precedence:
enterprise > personal > project; plugin skills are namespaced `plugin-name:skill-name` and
can't collide. Symlinked skill directories are followed (observed: every skill in this
machine's `~/.claude/skills/` is a symlink into `~/.agents/skills/`).

Two more facts that matter for auto-sync:

- **Skills-directory plugins.** "Add a `.claude-plugin/plugin.json` to a skill folder and it
  loads as a plugin named `<name>@skills-dir`, so it can bundle agents, hooks, and MCP
  servers." (documented, skills). `claude plugin init|new <name>` "Scaffold a new plugin at
  `~/.claude/skills/<name>/` (auto-loads next session as `<name>@skills-dir`)" (observed,
  `claude plugin --help`). **This is the first-party blessed way to write into `~/.claude`.**
- **Cowork / cloud / routines don't read `~/.claude/skills/`** (documented, skills). A
  personal-skill install is invisible to scheduled cloud runs — irrelevant for a
  local-transcript analyzer, but worth knowing.

### 3.2 Frontmatter that matters for a shipped skill

From the [frontmatter reference](https://code.claude.com/docs/en/skills#frontmatter-reference):

| Field | Why it matters here |
|---|---|
| `name` | In a **personal/project** skill this is only a display label — the command comes from the directory name. In a **plugin** skill it replaces the last segment: `my-plugin/skills/review` with `name: fancy` → `/my-plugin:fancy` (v2.1.216+ keeps the prefix). |
| `description` (+ `when_to_use`) | Combined text truncated at **1,536 chars** in the skill listing. |
| `disable-model-invocation: true` | **Only the user can invoke it.** Docs explicitly recommend it "for workflows with side effects… like `/commit`, `/deploy`, or `/send-slack-message`. You don't want Claude deciding to deploy because your code looks ready." Also removes the description from Claude's context and blocks Skill-tool invocation, scheduled-task firing (v2.1.196+), and subagent preloading. **This is a genuine gate primitive: the user typing `/aistack:sync` is a human action.** |
| `allowed-tools` | Grants tools **without prompting** for the turn that invokes the skill; clears on the next user message. `${CLAUDE_SKILL_DIR}` and `${CLAUDE_PROJECT_DIR}` are substituted here *and* in the body (v2.1.129+), so `allowed-tools: Bash(${CLAUDE_SKILL_DIR}/scripts/x.sh *)` runs a bundled script with **no prompt**. Convenient for the *scan* step; a footgun for the *send* step (threat #7). |
| `disallowed-tools` | Removes tools from the pool while the skill is active. Docs name the exact pattern: "such as `AskUserQuestion` for a background loop." |
| `context: fork` / `agent` / `background` | Runs in a subagent → **loses `AskUserQuestion`** and, if backgrounded (default from v2.1.218), runs with a reduced built-in tool set. |
| `hooks` | Skill-scoped hooks, cleaned up when the skill finishes; `once: true` honoured only here. |
| `model`, `effort`, `paths`, `user-invocable`, `argument-hint`, `arguments` | Ancillary. |

**Bundled scripts**: yes — a skill directory can hold `scripts/`, and the docs' own examples
run them (`allowed-tools: Bash(python3 *)`, `${CLAUDE_SKILL_DIR}/scripts/render.sh`). Skill
content lifecycle note: the rendered `SKILL.md` "enters the conversation as a single message
and stays there for the rest of the session… Claude Code does not re-read the skill file on
later turns."

### 3.3 Plugin + marketplace

Plugin manifest `.claude-plugin/plugin.json` — **optional**; only `name` is required if
present; unrecognized top-level fields are ignored (so one file can double as a
`package.json`). Component paths: `skills`, `commands`, `agents`, `hooks`, `mcpServers`,
`outputStyles`, `lspServers`, `experimental`, `dependencies`, `userConfig`, `channels`
(documented, [plugins-reference](https://code.claude.com/docs/en/plugins-reference)).

A plugin can bundle **skills + hooks + MCP servers + commands + agents + LSP + monitors +
themes** — i.e. everything auto-sync could want in one installable unit.

Marketplace `.claude-plugin/marketplace.json` — required `name`, `owner`, `plugins[]`; each
plugin entry needs `name` + `source` and may carry any manifest field plus `category`, `tags`,
`strict`, `relevance`, `displayName`, `defaultEnabled`, `version`. Sources: `github`
(`owner/repo` + `ref`/`sha`), `git`, `git-subdir`, `url`, `npm` (`package`/`version`/`registry`),
and relative local paths. Marketplace source and plugin source are pinned independently.
`renames` (v2.1.193+) migrates users across a rename/removal.

Install paths:

```
/plugin marketplace add alp82/aistack-plugins      # or a git URL, local path, or marketplace.json URL
/plugin install aistack@aistack-plugins            # interactive scope picker
claude plugin install aistack@aistack-plugins --scope user   # non-interactive
/reload-plugins                                    # activate without restart
```

Team/auto path: `extraKnownMarketplaces` + `enabledPlugins` in `.claude/settings.json`; from
v2.1.195 an externally-sourced plugin that only project settings enable **doesn't load until
the member runs `claude plugin install`** — Claude Code prints the command.

(observed) On this machine `~/.claude/plugins/` holds `known_marketplaces.json`,
`installed_plugins.json` (records `installPath`, `version`, `installedAt`, `lastUpdated`,
`gitCommitSha` per plugin), `cache/<marketplace>/<plugin>/<version>/`,
`marketplaces/<name>/` (a git clone), and `data/<plugin>-<marketplace>/`
(`${CLAUDE_PLUGIN_DATA}`).

### 3.4 An `npx`-style installer

**No first-party guidance for or against was found** in the docs (unverified — searched
skills, plugins, plugins-reference, plugin-marketplaces, setup). What such an installer would
have to do: create `~/.claude/skills/<name>/` (or a plugin dir), write `SKILL.md` + scripts,
optionally register an MCP server (better done via `claude mcp add-json` than by hand-editing
`~/.claude.json`), and handle its own updates.

Two things push against hand-rolling it:

- `claude plugin init` already scaffolds into `~/.claude/skills/<name>/` and auto-loads it as
  `<name>@skills-dir` (observed) — the first-party motion exists.
- An npx installer gets **no update story for free** (§3.5) and no `/plugin` inventory,
  context-cost estimate, or "Will install" review pane.

There is also a real trust argument: `.claude` is a **protected path** in every mode except
`bypassPermissions` (documented, [permission-modes § Protected paths](https://code.claude.com/docs/en/permission-modes#protected-paths)),
so a script writing there is exactly the class of action Claude Code is designed to make
visible. An installer the *user* runs in their own shell sidesteps that; an installer an
*agent* runs does not.

### 3.5 Update story per route

| Route | How v1.1 reaches the user | Automatic? | Pinning |
|---|---|---|---|
| Personal skill copied to `~/.claude/skills/` | Only if the user re-copies | **No** | none |
| Project skill in `.claude/skills/` | `git pull` | With the repo | git |
| Skills-dir plugin (`<name>@skills-dir`) | Local dir — no upstream | **No** | none |
| Plugin from a marketplace | `/plugin update`, or background auto-update | **Yes, if enabled** | `version` in `plugin.json` → marketplace entry `version` → git SHA → `unknown` |
| npm-sourced plugin | `claude plugin update` | same as above | `version` / semver range in the source; resolves to `unknown` for cache purposes |
| npx installer | user re-runs `npx` | **No** | npm dist-tag |

Auto-update specifics (documented, [discover-plugins § Configure auto-updates](https://code.claude.com/docs/en/discover-plugins#configure-auto-updates)):

- Runs **after session start, with a random delay of up to ten minutes**, so the running
  session keeps its loaded versions; you get a prompt to `/reload-plugins` or it lands next launch.
- **Official Anthropic marketplaces default to auto-update ON; third-party and local
  development marketplaces default OFF.** A third-party marketplace (ours) therefore does
  *not* auto-update unless the user toggles it, or an admin sets `"autoUpdate": true` in
  `extraKnownMarketplaces`.
- `DISABLE_AUTOUPDATER` kills both Claude Code and plugin updates; `FORCE_AUTOUPDATE_PLUGINS=1`
  keeps plugin updates alive alongside it.
- Private-repo background pulls disable git credential helpers by default and fall back to a
  re-clone — flaky. Irrelevant if our marketplace is public.

**Version pinning trap** (documented, [plugin-marketplaces § Version resolution](https://code.claude.com/docs/en/plugin-marketplaces#version-resolution-and-release-channels)):
if `plugin.json` declares `"version": "1.0.0"` and we push commits without bumping it,
existing users get nothing and `/plugin update` says "already at the latest version". Either
bump religiously or omit `version` entirely so the commit SHA is the version. Never set
`version` in both `plugin.json` and the marketplace entry — `plugin.json` silently wins.

---

## 4. `SessionEnd` and related hooks

### 4.1 The events that matter

There are ~30 hook events. The ones relevant to "analyze at session end, approve later":

| Event | Fires | Can block? | Can inject context to the model? | Can reach the user? |
|---|---|---|---|---|
| `SessionStart` | session begins/resumes; matchers `startup\|resume\|clear\|compact\|fork` | **No** | **Yes** — `additionalContext` (≤10,000 chars), also `initialUserMessage` (applies in `-p`), `sessionTitle` | `systemMessage`, `terminalSequence` |
| `SessionEnd` | session terminates; matchers `clear\|resume\|logout\|prompt_input_exit\|bypass_permissions_disabled\|other` | **No** — "No decision control. Used for side effects like logging or cleanup." | **No** | user only (a hook-error notice; `systemMessage`) |
| `Stop` | Claude finishes responding | **Yes** (`decision: "block"` + `reason`) | **Yes** — `additionalContext` | yes |
| `SubagentStop` | subagent finishes | **Yes** | **Yes** | yes |
| `UserPromptSubmit` | before Claude processes a prompt | **Yes** | **Yes** | yes |
| `PreToolUse` | before a tool call | **Yes** (+ `permissionDecision`, `updatedInput`) | **Yes** | yes |
| `PostToolUse` | after a tool succeeds | No (has `decision: "block"` for feedback) | **Yes** (+ `updatedToolOutput`) | yes |
| `PreCompact` / `PostCompact` | around compaction | Pre: yes / Post: no | — | yes |
| `Notification` | Claude Code sends a notification | **No** | No | logging only |

Source: [hooks](https://code.claude.com/docs/en/hooks).

### 4.2 `SessionEnd` — observed payload

Captured on this machine (E5, Claude Code 2.1.219, headless `claude -p` run):

```json
{
  "session_id": "91d70e05-…",
  "transcript_path": "/home/alp/.claude/projects/-home-alp-dev-projects-aistack-aistack-web/91d70e05-….jsonl",
  "cwd": "/home/alp/dev/projects/aistack/aistack-web",
  "prompt_id": "5879c903-…",
  "hook_event_name": "SessionEnd",
  "reason": "other"
}
```

The paired `Stop` payload from the same run, for contrast:

```json
{
  "session_id": "…", "transcript_path": "…", "cwd": "…", "prompt_id": "…",
  "permission_mode": "default", "effort": { "level": "high" },
  "hook_event_name": "Stop", "stop_hook_active": false,
  "last_assistant_message": "ok", "background_tasks": [], "session_crons": []
}
```

Two things to notice. `SessionEnd` gets **no** `permission_mode`, and `reason` was `"other"`
for a normal headless completion — the documented value set is
`clear | resume | logout | prompt_input_exit | bypass_permissions_disabled | other`, so
"the session simply finished" has no dedicated value. And **both payloads hand the hook an
absolute `cwd` and an absolute `transcript_path`** whose parent directory is the munged
project path — see §5.

### 4.3 Can a `SessionEnd` hook be interactive? No.

- It has "no decision control"; its stdout is not shown to the model, and exit-2 stderr
  renders as a `<hook name> hook error` notice to the user only (documented).
- Hooks have no controlling terminal and can't open `/dev/tty` (documented, §1.5).
- Its only user-facing channels are `systemMessage` and `terminalSequence` (bell / window
  title / OSC-777 desktop notification).

**Therefore the realistic "analyze at end, approve later" shape is:**

1. `SessionEnd` hook (or, better, an `async` hook so it doesn't hold session teardown) runs
   the local analyzer and **writes a pending draft to disk** — e.g.
   `${CLAUDE_PLUGIN_DATA}/pending-sync.json`. Zero network.
2. Next `SessionStart`, a hook reads the draft and returns
   `hookSpecificOutput.additionalContext` (≤10,000 chars) saying "an auto-sync draft is
   pending; run `/aistack:sync` to review and publish." Optionally `terminalSequence` for a
   desktop notification at end-of-session.
3. The user runs the skill; the skill shows the aggregate and calls the gated send tool
   (§1.4/§1.7), which is where the human "yes" happens.

Nothing in that path sends anything without a human, and the expensive scan happens when the
user isn't waiting.

### 4.4 Timeouts, parallelism, environment, headless, detachment

| Property | Value | Marker |
|---|---|---|
| Default timeout | 600 s for `command`/`http`/`mcp_tool`; 30 s for `prompt`; 60 s for `agent`. `UserPromptSubmit` lowers cmd/http/mcp to 30 s; `MessageDisplay` to 10 s. Per-hook `timeout` field | documented |
| Parallelism | "All matching hooks run in parallel." Identical handlers deduplicated (command: `command` + `args`; http: URL) | documented |
| Working directory | the session's current directory (`cwd` from input) | documented |
| Environment | inherits Claude Code's environment; exports `CLAUDE_PROJECT_DIR`, `CLAUDE_PLUGIN_ROOT`, `CLAUDE_PLUGIN_DATA`, `CLAUDE_EFFORT`, `CLAUDE_CODE_REMOTE` (remote only), `CLAUDE_PLUGIN_OPTION_<KEY>`. **"Claude Code strips `OTEL_*` exporter variables from all subprocess spawns"** | documented |
| Headless | Hooks run in `-p` unless `--bare` (skips hooks/skills/plugins/MCP/CLAUDE.md), `--safe-mode`, or `disableAllHooks`. `SessionEnd` explicitly runs on SIGTERM: "Claude Code aborts the in-progress turn, terminates the process tree of any running Bash command, runs `SessionEnd` hooks, and exits with code 143" | documented ([headless](https://code.claude.com/docs/en/headless)) |
| Background / detach | `async: true` runs in the background without blocking; `asyncRewake: true` additionally wakes Claude on exit 2 | documented |
| **Do async hooks outlive the session?** | The docs do not say. Related: a background *Bash task* in `-p` is "terminated about five seconds after Claude has returned its final result and stdin has closed", and SIGTERM "terminates the process tree of any running Bash command" — which suggests process-tree teardown, but says nothing about async hooks specifically | **unverified** — needs a spike |
| Exec form vs shell form | With `args` present the command is resolved as an executable and spawned with no shell (no globbing, no re-parsing). Recommended for `${CLAUDE_PLUGIN_ROOT}` paths | documented |
| Output cap | Hook JSON output strings capped at 10,000 chars; excess written to a file with a preview | documented |

### 4.5 Hook configuration safety

Precedence, lowest to highest (documented, [hooks](https://code.claude.com/docs/en/hooks)):

1. managed policy settings
2. `~/.claude/settings.json`
3. `.claude/settings.json`
4. `.claude/settings.local.json`
5. plugin `hooks/hooks.json`
6. skill/agent frontmatter (while the component is active)

Controls: `disableAllHooks: true` (user/project/local cannot disable *managed* hooks; only a
managed `disableAllHooks` disables everything). Enterprise `allowManagedHooksOnly: true`
blocks user, project and plugin hooks except plugins force-enabled via managed `enabledPlugins`.

**On the "snapshot at startup" behaviour**: the current docs say the opposite of the older
folklore — *"Direct edits to hooks in settings files are normally picked up automatically by
the file watcher."* There is no snapshot-at-startup statement on the 2026-07-24 hooks page
(documented; flagging because a design that relies on "hooks are frozen at startup, so they
can't be tampered with mid-session" would be **wrong**). The `ConfigChange` hook exists
precisely so you can react to mid-session config changes (matchers `user_settings`,
`project_settings`, `local_settings`, `policy_settings`, `skills`), and it *can* block the
change except for `policy_settings`.

Also relevant: from v2.1.218, frontmatter hooks in a *project* subagent run only after the
workspace trust dialog is accepted. And `.claude/settings.json` is a protected path (writes
never auto-approved except in `bypassPermissions`).

---

## 5. Privacy exposure per mechanism

The standing non-goal is "raw transcripts, prompt text, filesystem paths and repo names never
leave the machine". Here is where a naive implementation would break it.

| Mechanism | What it incidentally exposes | Severity |
|---|---|---|
| **Hook input JSON** | Every hook (including `SessionEnd`) receives `cwd` (absolute path) and `transcript_path` (absolute path whose parent dir is the munged project path, e.g. `-home-alp-dev-projects-aistack-aistack-web`) — **observed**, §4.2. A hook that POSTs its own stdin anywhere ships the user's directory tree and repo name. | **High** — the single easiest way to violate the constraint. A `type: "http"` hook pointed at our backend would do it by construction. |
| **`type: "http"` hooks** | POSTs the *entire event JSON* to a URL. For `PostToolUse` that includes `tool_input` and tool results. | **High** — do not use HTTP hooks for anything that touches our servers. |
| **MCP servers** | See the full `input` of every tool call routed to them, plus `roots/list` returns the session's working directories. A remote MCP server we host therefore learns paths unless we design the tool schema to accept **only** the aggregate. | **Medium** — controllable: define the publish tool's input as a closed aggregate schema with no free-form fields, and validate server-side. |
| **`stdio` MCP server (local process)** | Sees the same inputs, but never leaves the machine; it decides what to send. | **Low** — this is the privacy-preferable MCP shape. |
| **`headersHelper`** | Runs a shell command from the session cwd on every connection. Doesn't transmit anything itself. | Low |
| **The transcripts themselves** | `~/.claude/projects/<munged-abs-path>/*.jsonl` contain `cwd`, `gitBranch`, prompt text, and tool inputs; `~/.claude/history.jsonl` contains raw prompt text in `display`. The analyzer must read these and publish **only** derived counts. | **High** — the core of the feature; covered in `docs/research/claude-code-transcripts-2026-07.md`. |
| **Tool/skill/MCP-server names** | User-chosen strings that can encode client or project names (`mcp__acme-internal__…`, `/deploy-bigcorp`). Publishing an inventory of names is a leak vector even though no path is involved. | **Medium** — needs an allowlist against aistack's catalog or per-name approval. |
| **Project count vs project names** | Count is safe; the munged directory names are absolute paths. | Publish counts only. |
| **OpenTelemetry** | If the user has `CLAUDE_CODE_ENABLE_TELEMETRY=1`, Claude Code exports metrics/events to *their* collector, not ours. `OTEL_LOG_USER_PROMPTS`, `OTEL_LOG_TOOL_DETAILS`, `OTEL_LOG_TOOL_CONTENT`, `OTEL_LOG_RAW_API_BODIES` are all **off by default** and redact to `<REDACTED>`. Attributes include `user.email`, `user.account_uuid`, `organization.id`, and `workspace.host_paths`. Claude Code **strips `OTEL_*` from subprocess spawns**, so our scripts can't accidentally inherit an exporter endpoint. | Not our transport; noted so nobody proposes reading OTEL as a metrics source — it would be a *bigger* privacy surface, not a smaller one. |
| **`--debug` / `--debug-file`** | Writes debug logs including hook and MCP traffic to disk. | Local only. |
| **Plugin `userConfig` non-sensitive values** | Land in `settings.json` in plaintext. Anything secret must set `sensitive: true`. | Low if used correctly. |

**Rule of thumb for the design**: the analyzer reads locally and emits a *closed-schema
aggregate*; the send channel must be incapable of carrying anything else. A tool whose input
schema is `{tools: [{name, count}], models: […], activeDays, lastActiveAt, apiEquivalentCostUsd}`
with `additionalProperties: false`, validated server-side, is structurally safer than
"POST this JSON blob".

---

## 6. Realistic send channels, end to end

Five shapes worth considering. Scored on the axes the grilling cares about.

### A. Remote MCP server (ours) with a `requiresUserInteraction` publish tool

Skill computes the aggregate → calls `mcp__aistack__publish_metrics` → Claude Code shows the
permission prompt **on every call, in every mode**, with no "don't ask again" → user answers →
tool posts to our backend. Auth via OAuth (DCR) or a `${user_config.token}` bearer header.

### B. Local stdio MCP server (bundled in the plugin) with the same marker

Same gate. The server is a local process we ship; it reads transcripts and does the HTTPS call
itself. Nothing about the tool input crosses the wire — only the server's own request does.

### C. Bundled CLI called via the Bash tool

Skill runs `${CLAUDE_SKILL_DIR}/bin/aistack-sync publish`. The gate is a permission
`ask` rule on that Bash pattern, or a `PreToolUse` hook. The CLI cannot prompt (no TTY, §1.5).

### D. Pure HTTP from a script / `WebFetch`

Skill runs a script that POSTs, or the model calls `WebFetch`. Gate = `WebFetch(domain:aistack.to)`
in `permissions.ask`, or a Bash ask rule.

### E. Out-of-band: user runs `npx aistack sync` in their own terminal

Claude Code isn't involved in the send at all. The skill's job reduces to "tell the user to run
this", or to writing the draft file.

| Axis | A. Remote MCP | B. Local stdio MCP | C. Bundled CLI via Bash | D. HTTP/WebFetch | E. Out-of-band |
|---|---|---|---|---|---|
| **Approve guarantee** | **Strongest in-harness.** Survives `bypassPermissions`, `auto`, `acceptEdits`; allow rules can't skip it; fails closed in `dontAsk` and headless. Ships with *our* server, not the user's config. Hole: Agent SDK `canUseTool`. | Same as A (the marker is a server-side `tools/list` property, transport-independent) | Medium. Depends on an `ask` rule or hook the *user* has installed and hasn't disabled; `--bare`/`--safe-mode`/`disableAllHooks` remove hooks. An `allow` rule or `allowed-tools` entry silently defeats it. | Weakest. Same dependency as C, plus `WebFetch` prompts are easy to blanket-allow. | **Strongest overall** — the confirm is outside the agent loop entirely |
| **Auth effort** | Highest — we'd host an OAuth AS, or accept a header token via `userConfig` | Medium — server reads a token from `userConfig` env / token file | Low — reuse the existing device-code flow verbatim (§2.2) | Low–medium — token must reach the script/headers | Low — reuse device-code flow |
| **Install / update friction** | `claude mcp add` or plugin-bundled `.mcp.json`; plugin auto-update works but is **off by default for third-party marketplaces** | Same, plus a runtime dependency (node/binary) shipped in the plugin; `${CLAUDE_PLUGIN_DATA}` for deps | Skill or plugin; a binary to build/ship per platform | Lightest — a skill + a script | User must remember to run it; no discovery |
| **Headless** | Denied (correctly). `--permission-prompt-tool` allow is converted to a deny | Same | Ask rule → denied (observed E2); hook ask → denied (observed E3); an allow rule → **sends silently** | Same as C, and more likely to be blanket-allowed | N/A (a human is typing) |
| **Privacy exposure** | Server sees only the tool input — safe **if** the schema is a closed aggregate. `roots/list` would expose working dirs if we ever call it | **Best**: nothing crosses the wire except the request the local server chooses to make | Good: the CLI decides the payload; the Bash *command string* appears in the transcript and (if the user has `OTEL_LOG_TOOL_DETAILS=1`) in their telemetry | Model-composed payloads are the riskiest — the model could inline paths into a `WebFetch` body | Best |
| **Steps for the user (happy path)** | install plugin → auth once → confirm per publish | same | same | same | install → run command → confirm in-terminal |

**What the facts favour, without deciding.** B and A are the only options where the approve
guarantee lives in code *we* control rather than in configuration the user can weaken; B adds
the best privacy story because the aggregate never has to traverse a tool boundary we don't own.
C and D are cheaper to build and reuse the existing `/api/cli/*` plumbing unchanged, at the cost
of a gate that any allow rule, `--bare`, or `disableAllHooks` removes. E is unbeatable on
guarantee and worst on adoption. A hybrid — plugin ships a local stdio MCP server whose single
`publish` tool is marked `requiresUserInteraction` and which authenticates with a token obtained
through the existing device-code flow — collects most of the wins, and is the shape the facts
point at.

Caveat to carry into the grilling: `requiresUserInteraction` requires **Claude Code v2.1.199+**;
earlier versions "ignore it and apply the standard permission flow", i.e. the gate silently
degrades to an ordinary permission prompt (or to nothing under `bypassPermissions`). If we
depend on it, we must detect and refuse to run on older versions.

---

## 7. Open questions the docs don't answer

1. **`AskUserQuestion`'s wire schema.** Max questions per call, max options per question,
   whether multi-select exists, and what the tool result looks like are not in the public docs.
   If the design leans on it for the *review* UI (as distinct from the gate), spike it.
2. **Does a `PreToolUse` `"ask"` render as a real prompt in an *interactive* `bypassPermissions`
   session?** Observed only in headless, where it resolved as a denial (E3). The permission-modes
   page enumerates "explicit ask rules" as surviving bypass but doesn't name hook-returned asks.
   Needs an interactive spike before relying on it.
3. **Do `async: true` hooks outlive the session?** Undocumented. Determines whether a
   `SessionEnd` analyzer can safely take 30 s, or whether it must fit inside teardown.
4. **`SessionEnd` `reason` for a normal exit.** Observed `"other"` for a completed `-p` run; the
   documented set has no "completed" value. What an interactive `Ctrl+D` or `/exit` produces is
   unverified. Matters if we want to skip analysis on `logout` or `clear`.
5. **Where MCP OAuth tokens actually rest.** Docs say "stored securely"; observed
   `~/.claude/.credentials.json` (mode 0600) on this Linux box, Keychain on macOS per the
   security page. The ~2 KB shared budget with `userConfig` sensitive values is documented but
   its enforcement behaviour on overflow is not.
6. **Whether a `requiresUserInteraction` prompt can carry our own body text.** The docs say
   Claude Code "shows the tool's full permission prompt" — whether the tool `description` or an
   input field is what the user reads (i.e. whether we can render the aggregate *inside* the
   consent dialog) is unverified, and it materially changes the UX.
7. **Version floor.** `requiresUserInteraction` needs 2.1.199+; `${CLAUDE_SKILL_DIR}` in
   `allowed-tools` needs 2.1.129+; `background: false` on forked skills needs 2.1.218+. What
   floor is acceptable, and how auto-sync detects and refuses below it, is a product decision.
8. **Marketplace auto-update default.** Third-party marketplaces default to auto-update **off**.
   Do we accept that most users stay on the version they installed, or do we build a
   version-check-and-nag into the skill itself?
9. **Token model on the backend.** Whether to extend `cliTokens` (plaintext, no scopes, no
   revoke) or introduce a scoped, hashed token for metrics publishing. Not a Claude Code
   question — but the answer gates §2's channel choice.
10. **Multi-machine dedup.** Unchanged from the transcripts research: nothing links two machines'
    histories, so server-side merge semantics for one user with several machines remain open.

---

## Source index

Anthropic docs, all fetched 2026-07-24 (note: `docs.claude.com/en/docs/claude-code/*` now
301-redirects to `code.claude.com/docs/en/*`):

- https://code.claude.com/docs/en/hooks
- https://code.claude.com/docs/en/skills
- https://code.claude.com/docs/en/permissions
- https://code.claude.com/docs/en/permission-modes
- https://code.claude.com/docs/en/tools-reference
- https://code.claude.com/docs/en/mcp
- https://code.claude.com/docs/en/plugins-reference
- https://code.claude.com/docs/en/plugin-marketplaces
- https://code.claude.com/docs/en/discover-plugins
- https://code.claude.com/docs/en/sub-agents
- https://code.claude.com/docs/en/headless
- https://code.claude.com/docs/en/cli-reference
- https://code.claude.com/docs/en/settings
- https://code.claude.com/docs/en/security
- https://code.claude.com/docs/en/monitoring-usage

Local (Claude Code 2.1.219, Linux, 2026-07-24): `claude --help`, `claude mcp --help`,
`claude plugin --help`, `~/.claude/settings.json`, `~/.claude/skills/`,
`~/.claude/plugins/{known_marketplaces.json,installed_plugins.json,cache,marketplaces,data}`,
`~/.claude/.credentials.json` (mode only, contents not read). Experiments E1–E5 as described
in §1.6 and §4.2.

Repo: `src/routes/api.cli.auth.start.tsx`, `src/routes/api.cli.auth.poll.tsx`,
`src/routes/api.cli.stacks.tsx`, `src/routes/api.cli.stacks.collect.tsx`,
`src/routes/cli.auth.tsx`, `convex/http.ts`, `convex/httpCli.ts`, `convex/httpCliHelpers.ts`,
`convex/cliTokens.ts`, `convex/cliSessions.ts`, `convex/schema.ts` @ `bafc763`.

Companion: `docs/research/claude-code-transcripts-2026-07.md` (what the transcripts contain and
which metrics are derivable).
