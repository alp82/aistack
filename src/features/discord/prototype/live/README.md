# Live Discord prototype

Throwaway companion to the browser command-flow prototype, for
[Choose easy command entry and controls for Discord stats](https://github.com/alp82/aistack/issues/403).
It runs a real signed Discord HTTP endpoint with fixture people and prices.
The owner reviewed it in Discord and locked the visual and control design on
2026-09-12. The ticket's resolution is the canonical decision record. This later
live review supersedes the earlier browser-only embed and command-flow proposals.
There are no database reads, account linking, production deployments, or proactive messages.
Model, tool, and harness rows use real names and the existing local brand icons.
Their usage and subscription amounts remain synthetic fixtures.

## Connect a test app

From the repo root, run the local setup helper in your terminal:

```sh
bash scripts/discord-prototype-setup.sh
```

It guides creation of a separate Discord test app, hidden token entry, server
installation, local endpoint/tunnel startup, and test-guild registration. Credentials
go to the ignored `.env.discord-prototype.local`, with mode 600. It never changes the
production application's endpoint. No privileged gateway intents are needed.

For an already configured test app, the required variables are:

```dotenv
DISCORD_PROTOTYPE_APP_ID=your_test_application_id
DISCORD_PROTOTYPE_GUILD_ID=your_test_server_id
DISCORD_PROTOTYPE_PUBLIC_KEY=your_test_application_public_key
DISCORD_PROTOTYPE_BOT_TOKEN=your_test_bot_token
DISCORD_PROTOTYPE_PROFILE_HANDLE=your_aistack_handle
```

Keep the token out of chat and version control. The registration command uses it;
the HTTP endpoint uses the public key and Discord's per-interaction tokens.

Run these in separate terminals at the repo root:

```sh
pnpm discord:prototype
ngrok http 3020
```

Set the test app's General Information > Interactions Endpoint URL to
`https://YOUR-TUNNEL/interactions`. Discord must accept its signature/PING check.
Install the app in the test server with Send Messages, Embed Links, and Attach Files.
Then register:

```sh
pnpm discord:prototype register
```

Registration uses per-command POSTs in the configured test guild. It preserves
unrelated commands and never modifies global commands. The prototype refuses
interactions from other apps or guilds.

## What to try

- `/tokens`: a PNG card with seven-day tokens, a 12% change indicator, and every
  model with at least 5% token share, with aligned amounts and share bars. Full list
  appears only when models below 5% are hidden; 5% and up restores the default.
- `/cost`: a PNG card with current monthly subscription total and top three tools. Measured usage
  is separate; changing range does not change the monthly subscription amount.
- `/context`: an uploaded PNG with the existing 200-cell context matrix design.
- `/harness`: a PNG card with token share and amounts by harness.
- `/compare`: immediately choose a person. Optional `person` autocomplete supports
  `alice`, `bob`, and `carol`, including unique partial matches. The comparison PNG
  shows tokens, measured usage cost, and model mix.
- Compare on an existing answer opens person selection directly and preserves its
  subject. Search people opens a modal, then filters the select on the same message.
- Range offers 1, 7, 30 and custom days. The prototype caps custom ranges at 400;
  the production query limit remains undecided.
- Another account clicking controls receives a private rejection; the public
  answer stays unchanged. Sessions expire after one hour or a server restart.
- Profile link buttons open `/@handle` on aistack.to, with one link per compared
  person. Labels rely on Discord's built-in external-link icon, with no extra
  arrow character. Set `DISCORD_PROTOTYPE_PROFILE_HANDLE` to link the requester to a real
  profile. Without it, the requester uses the `you` fixture handle; compared people
  use their fixture handles. Fixture profile pages may not exist.

The owner has exercised and approved the live presentation. Production acceptance
still needs explicit desktop/mobile, PNG replacement, ambiguous username, modal,
and second-account checks against real data; the visual approval does not establish
that every protocol edge case was exercised manually.

## Local checks and previews

For live refinement, stop the prototype process and replace it with:

```sh
pnpm discord:prototype:watch
```

Keep ngrok running. Node restarts when the server or its imported fixture/reply/image
modules change. Existing Discord messages do not refresh automatically. Run the
slash command again after each restart; the in-memory control sessions are reset.

Reply text, layout, image, fixture, and control changes need only that restart.
Changes to slash command names, descriptions, or options also require
`pnpm discord:prototype register`. Restart manually after changing the env file.
The standalone browser HTML is a separate prototype; editing it does not change
Discord replies.

```sh
pnpm discord:prototype dry-run
pnpm discord:prototype render-preview
```

PNG previews go to `/tmp/aistack-discord-live-preview`. This prototype depends only
on Node 24 and the repository's installed `sharp`. It needs no extra SDK and does
not alter the app or Convex dev servers.

Validation performed: signed local HTTP requests with Discord webhook calls
intercepted locally, including bad signatures, PING, autocomplete, deferred embeds,
requester rejection, person selects, modal field parsing, PNG multipart uploads,
and attachment replacement. PNGs were visually inspected. Test-guild registration
succeeded, and the owner subsequently tested and approved the prototype in Discord.

## Cleanup

```sh
pnpm discord:prototype unregister
```

This removes only these five commands whose descriptions identify them as prototypes
from the configured test guild. Stop the endpoint and tunnel. Remove the test app
from the server when finished. The setup helper is local and disposable.

The [control research](../../../../../docs/research/discord-live-prototype-controls.md)
records Discord API constraints and the remaining live checks. The fixture renderer
lives under `src/features/charts/prototype`; the production chart components and
Discord handler are unchanged.
