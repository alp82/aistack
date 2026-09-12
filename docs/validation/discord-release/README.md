# Discord statistics release

Release work for [Deploy and activate the accepted Discord command release](https://github.com/alp82/aistack/issues/416).

## Owner disposition

On 2026-09-12 the owner waived another live desktop/mobile, consenting-tester,
and install-context acceptance round and authorized shipping, with follow-up
adjustments after release. Those client checks remain untested. Deployment,
authentication, native PNG runtime and command registration still need verified
results. This overrides the earlier pre-registration live acceptance gate.

## Prepared release

The release is isolated from the pending Cursor and project-import changes on
`task/cursor-collection`. Its base is `20568ab6` on `origin/main`.

The focused release build passed. Five targeted test files passed, 66 tests:
Discord data reads, lifecycle transport, retained commands, registration contract
and native PNG rendering. No new human test round was requested.

- [Approved registration payload](commands-approved.json): nine global commands,
  retaining stack, leaderboard, model and link alongside tokens, cost, context,
  harness and compare. Every command enables both installation types and all
  three interaction contexts.
- [Previous source payload](commands-before-source.json): the five-command
  definition on the release base. This is source evidence, not a snapshot of
  Discord's live registrations. Capture the actual global GET response before PUT.
- Production application ID: `1540381573243736116`, the existing install link.
- Production interaction endpoint: `https://convex-site.aistack.to/api/discord/interactions`.
- Web renderer endpoint: `https://aistack.to/api/discord/render`.

## Configuration and deployment

1. Coolify automatically deploys `main` for application
   `k8g00cc0cgwosgscko0g8g44` (`alp82/aistack:main`, internal application ID 3).
   Its authorized control plane is available over SSH at `root@10.0.0.10`;
   the application runs on its configured server `159.69.247.66`. The Convex
   server at `root@10.0.0.20` hosts the backend only. Coolify uses Nixpacks with
   `pnpm install`, `pnpm build`, and `pnpm start`.
2. Set one dedicated random `DISCORD_RENDER_SECRET` of at least 32 characters in
   both the web service and Convex. Keep the value out of issues and logs. Set
   Convex `DISCORD_RENDER_ORIGIN=https://aistack.to`.
3. Set web `DISCORD_RENDER_ICON_ORIGINS` to the trusted production Convex storage
   origin and any verified canonical catalog origins. Confirm storage URLs from
   production records before choosing the allowlist.
4. Deploy the web renderer using the existing web mechanism. It must package
   Sharp/libvips. Verify unsigned requests return 401, signed invalid payloads
   return 400, and a signed valid answer returns a nonempty PNG with no-store.
5. Push the release to `main` to trigger `.github/workflows/deploy-convex.yml`.
   Wait for its successful run. All production Convex code deployment uses that
   workflow. Use `scripts/convex-prod.sh` only for configuration, reads and calls
   to already-deployed functions; never pass a code-push command or `--push`.
6. Read an actual public creator's answer through the deployed read function and
   verify the authenticated production renderer returns PNG. Record dimensions,
   bytes and timing without private tokens or credentials. Verify trusted icon
   fetches from the actual web runtime.

The owner accepts temporary failures of cached old commands during transition.
Deploy renderer before calling handlers where the hosting mechanism allows it.

## Registration and readback

Use the production bot credential through an ignored local environment file or
secret manager. The existing `.env.discord-prototype.local` belongs to the test
app and cannot activate the production application. The bot token is never a
Convex or web deployment variable.

Before mutation, authenticated GET
`https://discord.com/api/v10/applications/1540381573243736116/commands` and save
the complete response locally as the rollback snapshot. Confirm the credential
belongs to the production application. Register with the existing script:

```sh
DISCORD_APP_ID=1540381573243736116 pnpm tsx scripts/discord-register-commands.ts
```

Supply `DISCORD_BOT_TOKEN` through the authorized environment, never inline in a
recorded command. Omit `DISCORD_GUILD_ID` for global registration. Fetch globals
again and compare command names, descriptions, options, contexts and installation
types to `commands-approved.json`. Record the response IDs and a sanitized
payload. Inspect any known production test guild for stale local definitions
that shadow globals; remove only this application's obsolete definitions.

No unsolicited Discord message is part of deployment. Owner desktop/mobile and
consenting-tester interactions remain waived, not passed.

## Recovery

Revert the failing code on `main` and wait for the same GitHub Actions deployment.
Restore the captured prior global definitions if command rollback is necessary,
removing Discord response-only ID/version fields before PUT. The source fallback
payload is available above but does not replace a live pre-release snapshot.
Keep additive schema and data intact; never force an empty Convex function push.
Record the rollback workflow run and registration readback.

## Production deployment evidence

On 2026-09-12, bot implementation commit `8833cc25` deployed successfully through
[GitHub Actions](https://github.com/alp82/aistack/actions/runs/34686428911) and
Coolify deployment `bqdrhhlmvzkzske54yof5elr`. Both services hold the same dedicated
renderer secret. Coolify holds it runtime-only; Convex points at
`https://aistack.to`. The web icon allowlist is
`https://convex.aistack.to,https://models.dev`.

The deployed query read alperortac's real seven-day public statistics. Signed
requests rasterized all five cards, and rejected unsigned requests with 401 and
invalid payloads with 400. All responses used no-store. Requests from inside the
actual web container reached both approved icon origins with HTTP 200.

Image inspection then found missing text in the Nixpacks runtime, which lacked
fonts. Commit `1531f91d` adds `fontconfig` and `fonts-dejavu-core` using the official
[Nixpacks package configuration](https://nixpacks.com/docs/configuration/file).
This makes the renderer's DejaVu Sans Mono font available in the deployed image.
The fix deployed successfully through
[GitHub Actions](https://github.com/alp82/aistack/actions/runs/34686632260) and
Coolify deployment `tcfacxwar1u78bep5q0cmiw9`. All five signed cards then rendered
with readable text, confirmed by image inspection. The final PNGs were
56,052 to 141,914 bytes, 960 pixels wide, and returned in 349 to 466 ms.
[Sanitized runtime results](production-runtime.json) record each response;
[the production token card](production-tokens.png) records the corrected output.

## Outstanding activation evidence

- Authorized production bot credential location.
- Actual prior global registration snapshot.
- Nine-command registration and readback results.

Code deployment and shared configuration are complete. Global command
registration is still pending. Homepage publication remains pending so its
instructions do not advertise unregistered commands.
