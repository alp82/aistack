# Discord release operations

A push to `main` runs `.github/workflows/deploy-convex.yml`. It deploys that
exact commit to Convex, waits for Coolify to serve the same web commit, then
registers and verifies the global Discord commands. Coolify continues to deploy
the web app automatically. No local registration command is part of production
release.

## One-time credential setup

Store the production bot token as the repository Actions secret
`DISCORD_BOT_TOKEN` in [GitHub repository settings](https://github.com/alp82/aistack/settings/secrets/actions).
The workflow configures the existing production application ID itself. A token
for the test app is rejected before any registration change. Runtime services
continue to use `DISCORD_PUBLIC_KEY` and the renderer configuration, without a
bot token.

Adding this secret is required once. Subsequent pushes update commands
without another owner action. If a token is rotated, replace the secret.

## Retry and verification

Use **Run workflow** on the production deployment workflow with branch `main`,
or dispatch it through the CLI:

```sh
gh workflow run deploy-convex.yml --ref main
```

This retries deployment, readiness and registration together. The registration
step names all verified commands in its log. A missing credential or failed
readback fails the workflow explicitly, even if code deployment succeeded.
Discord clients can retain cached command definitions while changes propagate.

The workflow serializes production releases, deploys a pinned commit and skips
registration when a newer `main` revision supersedes its run. Readiness requires
the matching Coolify `SOURCE_COMMIT`, configured renderer secret and a rejected
unsigned request. An old healthy renderer cannot satisfy a new release. A final
readiness check runs immediately before registration.

`scripts/lib/discordCommandDefinitions.ts` remains the complete canonical set.
The registrar verifies the token's application, saves the prior global response,
and bulk updates only when the writable command contract differs. It then reads
Discord's global list again and verifies names, options, contexts, installation
types and the remaining writable fields. It sends no Discord messages.

## Recovery

Each registration attempt uploads a `discord-registration-<commit>` artifact
containing `before.json`, `approved.json` and, when available, `after.json`.
The prior snapshot is saved before mutation, so a failed update/readback retains
recovery evidence. The artifact contains command definitions and IDs, never the
credential. Retention is 90 days.

Revert failing handler or command changes while retaining the deployment
workflow, then push `main`. The workflow deploys the reverted source and restores
its canonical command set. Use the prior artifact to inspect the exact previous
registration if the source and live list had drifted. Keep additive schema/data
intact. Convex code recovery still runs exclusively through GitHub Actions.

For an isolated test app, the registration script still supports a local
`DISCORD_APP_ID`, `DISCORD_BOT_TOKEN` and optional `DISCORD_GUILD_ID`.
`--dry-run` prints the source payload without credentials or network access.

The ordering and snapshot behavior follow the official
[Discord command API](https://docs.discord.com/developers/interactions/application-commands)
and [GitHub concurrency controls](https://docs.github.com/en/actions/how-tos/write-workflows/choose-when-workflows-run/control-workflow-concurrency).
