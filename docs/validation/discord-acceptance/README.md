# Isolated Discord acceptance

Tracking: [Validate production Discord cards in an isolated test app](https://github.com/alp82/aistack/issues/415).
Status on 2026-09-12: automated preparation passed; the owner waived the
remaining pre-release live review and authorized shipping.

The owner instructed: "i think we can skip another test round and ship it. if
anything needs adjustments we can make further updates directly". This overrides
the previous desktop/mobile, tester and install-context review gate. Those live
checks were not performed and are not recorded as passes. The setup and matrix
below remain available for optional investigation after release.

## Prepared configuration

- Test application: **Curia-Test**, ID `1544672376409690232`. This differs from
  production's `1540381573243736116`.
- Existing test guild: `1544671821859913821`. Any later live test needs agreed
  channels/private conversation and a consenting tester.
- The real nine-command definitions are registered on the test application's
  global scope and existing test guild. Readback confirmed both install types
  and all three contexts on global commands. The previous definitions are in
  ignored `.discord-acceptance.local/global-before.json` and `guild-before.json`.
- The local anonymous Convex backend has the test application's public key,
  a dedicated `DISCORD_RENDER_SECRET`, and
  `DISCORD_RENDER_ORIGIN=http://127.0.0.1:3021`.
- The built renderer is running on `http://127.0.0.1:3021`. Its secret, storage
  allowlist and port are in ignored `.env.discord-acceptance.local`, mode 0600.
  The bot token remains only in the existing ignored prototype environment.
- The app's current endpoint is still
  `https://pseudoencephalitic-colette-adorably.ngrok-free.dev/interactions`.
  That tunnel currently forwards to port 3020, the fixture server. Commands
  sent there do **not** validate this implementation.
- Local `APP_URL` and `SITE_URL` remain `http://localhost:3019`. Account linking
  and profile links target the local app. A phone or another person's computer
  cannot open that localhost address. Verify those links on the owner's local
  desktop; remote local-account linking needs an explicitly configured reachable
  local web URL before attempting it. Do not send local link tokens to production.

## Optional isolated-app testing steps

1. Name a consenting tester and the agreed test guild channel, bot DM and
   user-installed private conversation. The agent has sent no messages.
2. In the terminal running the existing ngrok tunnel, stop that tunnel and run
   `ngrok http 3211`. Copy its HTTPS URL. In the **Curia-Test** Developer Portal,
   General Information, set Interactions Endpoint URL to
   `<that HTTPS URL>/api/discord/interactions` and save. Discord must accept
   signature/PING verification. Keep the local app and Convex servers running.
3. Install **Curia-Test** in the agreed guild and to your user account using
   [the test application's install link](https://discord.com/oauth2/authorize?client_id=1544672376409690232).
   Both install types are already enabled. Ensure the agreed guild channel allows
   the app to send messages, embed links and attach files. Open the bot DM and
   use a user-installed command in the agreed private conversation. Allow for
   test-app global command propagation; guild commands alone cannot prove these
   other contexts.
4. Run the matrix below on desktop and mobile. Start with `/tokens`, `/cost`,
   `/context`, `/harness`, then `/compare`. If an account is unlinked, use the
   creator picker or run `/link` and approve while signed into the local app on
   the owner's desktop. Only the owner runs CLI `sync` if more measured data is
   necessary. The database was refreshed from production earlier in this effort.

The existing `discord:prototype` server and setup wizard use fixture data and
the old endpoint; they are not the setup path for this acceptance.

## Evidence matrix

Fill every applicable row with pass/fail, device/client, context, timestamp and
a screenshot or brief reproduction if testing later. All live rows below were
waived as pre-release requirements and remain untested in this acceptance round.
Use the owner and consenting tester for comparisons. Do not edit another
creator's records to manufacture an edge case.

| Check | Expected evidence |
| --- | --- |
| Five starter cards, desktop and mobile | Tokens, cost, context, harness and compare have readable labels, no clipping, correct real identity and icons. |
| Guild, bot DM, user-installed private channel | Every starter delivers and its controls work in each context; record install type and venue. |
| Identity and recovery | Native profile/stack links target the correct local records; unlinked, no-stack and unknown-person paths recover through linking or the creator picker. |
| Creator selection | Slash autocomplete and Search modal find the intended handle; `/compare` without a person offers selection; the subject stays pinned. |
| Person comparisons | Distinct consenting people compare correctly; context/harness use the subject's selected harness on both sides, with unavailable counterparts shown as `n/a`. |
| Cost and missing data | Missing differs from zero; sources, priced coverage and lower-bound disclosure appear; monthly subscriptions remain separate from measured costs. |
| Lists and filters | Five subscription entries expand to the full list; bundles are not double charged; model filtering follows the exact 5% rule. |
| Context | The selected harness uses all-machine context atoms; other workflow readings retain their existing machine boundary. |
| Dates and updates | Presets and Custom days update the same message repeatedly; one current PNG remains and controls survive. The initial UTC anchor stays pinned. |
| Requester ownership | Tester clicking the owner's control gets a private rejection; the public answer remains unchanged. Reverse roles too. |
| Consent withdrawal | Owner changes consent only on their local stack, then updates an existing answer. A fresh read omits revoked cost/workflow information. Restore the owner's prior setting after recording evidence. |
| Expiry and failure | After one hour controls recover privately. Failed updates do not falsely advance the visible view; retry or rerun works as explained. |

Synthetic exact-boundary, midnight, duplicate, stale, concurrent/busy and
failure-injection cases belong in automated local tests. Real-client acceptance
checks their visible behavior where practical; do not claim a synthetic test is
desktop/mobile evidence. Record unavailable local fixtures explicitly.

## Automated evidence

Tested base commit: `98b3cac6b0224deedf783d62090c0ee1814d7d36`, plus the shared
uncommitted data, renderer and interaction changes. Record the eventual commit
and rerun any automated checks affected by subsequent changes during release.

- `pnpm build` passed after durable-controls integration. Build log:
  `/tmp/discord-acceptance-build.log` (local, temporary).
- The built HTTP route returned real PNGs with `Cache-Control: no-store` for
  all five starters using the mirrored `alperortac` projection for September
  6 through 12. See [runtime.json](runtime.json). The comparison smoke uses
  the same subject on both sides; distinct people were not tested live.
- The actual local Convex HTTP endpoint rejected an unsigned Discord request
  with HTTP 401. The test-app portal switch and signed PING were not performed.
- The implementation tickets record the passing data, renderer, lifecycle,
  palette and consent suites. This preparation does not replace those results
  or establish live client acceptance. The owner explicitly waived that review.

## Running the prepared renderer

The dedicated renderer can stay running during acceptance. To restart after
stopping it, from the repository root:

```sh
node --env-file=.env.local --env-file=.env.discord-acceptance.local .output/server/index.mjs
```

Stop it with Ctrl-C in its terminal. If using the agent-started background
process, identify its PID with `lsof -nP -iTCP:3021 -sTCP:LISTEN`, confirm the
command is this renderer, then `kill <PID>`. This does not stop the owner's
port-3019 web server or local Convex. Rebuild before restarting after code changes.

## Acceptance record

- Owner desktop/mobile verdict: waived as a release gate; no new live verdict.
- Consenting tester and agreed venues: not arranged; additional round waived.
- Test-app portal signature/PING verification: not performed.
- Screenshots and message references: no new live evidence.
- Live defects: none observed because this round was not performed.
- Release readiness: owner authorized shipping with these live checks waived.
  The release ticket still owns actual deployment and activation checks.

Keep tokens, secrets, private conversations and unrelated user information out
of screenshots and issue comments. The separate release ticket owns production
configuration, deployment and registration.
