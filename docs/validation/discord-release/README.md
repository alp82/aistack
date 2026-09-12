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

1. Identify the existing web deployment service and its authorized configuration
   mechanism. The Convex server at `root@10.0.0.20` does not host the web process;
   the existing GitHub workflow deploys Convex only.
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

## Outstanding deployment evidence

- Existing web hosting/deployment mechanism and configuration access.
- Authorized production bot credential location.
- Actual prior global registration snapshot.
- Production configuration, deployment run, renderer runtime and registration
  readback results.

The code and payloads are ready. Production activation has not been performed.
