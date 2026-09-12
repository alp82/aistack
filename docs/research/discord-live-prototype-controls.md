# Live Discord prototype controls and setup

Research date: 2026-09-11. Supports [Verify live Discord prototype controls and test setup](https://github.com/alp82/aistack/issues/405) and [Choose easy command entry and controls for Discord stats](https://github.com/alp82/aistack/issues/403). Extends [earlier interaction research](discord-interaction-constraints.md). No Discord registration, messages, or production mutations were performed during research. Client rendering remains a live test.

## Message controls

Classic embeds can coexist with components by omitting `IS_COMPONENTS_V2` (32768). Setting that flag disables `content` and `embeds`. Classic messages permit five Action Rows. Each row holds five buttons or one select. Interactive `custom_id` values must be unique within the message and 1-100 characters. Button labels permit 80 characters. String Select supplies at most 25 fixed options; labels, values, and descriptions permit 100 characters each. Its placeholder permits 150. Use `min_values: 1, max_values: 1` for one person. User Select searches Discord users, so use String Select for app creator handles. These schemas provide no application-backed autocomplete event while typing into a select or modal text input. [Component reference](https://docs.discord.com/developers/components/reference)

Prototype inference: Compare can immediately reveal a creator select on the existing message. A small fixture roster fits without search. Larger catalogs need a Search button, a submitted text query, then a filtered select. Client-side filtering of fixed options is not remote creator search.

## Search modal

Use a Label containing Text Input. Action Row text inputs are deprecated. Modal submissions return the field under the Label's singular `component`; parsers must traverse this shape. [Modal guide](https://docs.discord.com/developers/components/using-modal-components)

Illustrative response to a Search button:

```json
{
  "type": 9,
  "data": {
    "custom_id": "creator-search:session-key",
    "title": "Find a creator",
    "components": [{
      "type": 18,
      "label": "Creator handle",
      "component": {
        "type": 4,
        "custom_id": "query",
        "style": 1,
        "required": true,
        "min_length": 1,
        "max_length": 100
      }
    }]
  }
}
```

This shape intentionally keeps the public message classic while using current modal components. A modal may contain a String Select as well. [Modal guide](https://docs.discord.com/developers/components/using-modal-components)

## Slash autocomplete and guild registration

Optional creator autocomplete uses a STRING option:

```json
{
  "type": 3,
  "name": "person",
  "description": "Creator to compare with",
  "required": false,
  "autocomplete": true
}
```

Handle the focused option's partial value; users can submit arbitrary text, so revalidate. Do not combine `choices` with `autocomplete`. Choice labels and string values permit 100 characters. [Application commands](https://docs.discord.com/developers/interactions/application-commands)

Register each command with `POST /api/v10/applications/{app}/guilds/{guild}/commands`, authorized by the test app's bot token. This upserts the same name in that app/guild and is immediately available. It does not replace unrelated guild commands or the global command set. Bulk guild PUT replaces the entire target guild set, including other command types. Global registration is separate. Guild-create parameters do not include `integration_types` or `contexts`; those configure global commands. [Application commands](https://docs.discord.com/developers/interactions/application-commands#create-guild-application-command)

## Lifecycle and requester checks

Acknowledge within three seconds; tokens last 15 minutes. Slash rendering can return type 5, then PATCH `/webhooks/{application_id}/{interaction_token}/messages/@original`. Button/select updates use type 7 immediately or type 6 before deferred editing. Autocomplete responds type 8 with at most 25 choices. Opening a modal uses type 9 as the initial response; a modal submit cannot open another modal. Modal titles permit 45 characters, IDs 100, and bodies 1-5 components. [Interaction responses](https://docs.discord.com/developers/interactions/receiving-and-responding)

The actor is `member.user.id` in guilds or `user.id` in DMs. Compare it with the stored requester before changing state. Unauthorized clicks return type 4 with `data.flags: 64` and explanatory text. That creates an ephemeral response instead of updating the public message. [Interaction responses](https://docs.discord.com/developers/interactions/receiving-and-responding)

Discord's response table calls types 6/7 component-based but does not spell out modal ancestry. The discord.js implementation explicitly equips modal submits with `message`, `isFromMessage()`, `update()`, and `deferUpdate()`. Its response implementation emits types 7/6. This corroborates Search button -> modal -> update source message. Require the submit's `message`; a modal opened directly from a slash command has no source message to update. Verify this branch live. [ModalSubmitInteraction source](https://raw.githubusercontent.com/discordjs/discord.js/main/packages/discord.js/src/structures/ModalSubmitInteraction.js), [InteractionResponses source](https://raw.githubusercontent.com/discordjs/discord.js/main/packages/discord.js/src/structures/interfaces/InteractionResponses.js)

Prototype inference: keep an opaque session key in IDs and requester/state server-side. Use each new component interaction's token for its update, rather than depending on the original slash token. Reject missing sessions after restart with a private instruction to rerun the command.

## PNG replacement

PATCH the deferred original using multipart `files[0]` plus JSON `payload_json`. `attachments` must enumerate the final retained and new files; omitting it appends uploads. To replace the old PNG, exclude its ID and include only the new file's metadata. Repeat mention restrictions on edits. Application-owned webhooks can send interactive components. [Webhook edits](https://docs.discord.com/developers/resources/webhook#edit-webhook-message)

```json
{
  "attachments": [{ "id": 0, "filename": "chart-next.png" }],
  "embeds": [{ "image": { "url": "attachment://chart-next.png" } }],
  "allowed_mentions": { "parse": [] }
}
```

Include current controls in that payload when changing them. A control-only update can omit attachments and embeds to retain them. [Webhook edits](https://docs.discord.com/developers/resources/webhook#edit-webhook-message)

PNG is supported for embedded uploads. Match the multipart file index to its attachment placeholder ID. Check `attachment_size_limit` from the interaction rather than hardcoding a tier; the current reference states a 20 MiB default. Let the HTTP client generate the multipart boundary. [File upload reference](https://docs.discord.com/developers/reference#uploading-files)

## Minimal isolated setup

Use a separate test application and quiet test guild. In Developer Portal, obtain its Application ID, Public Key, and bot token. Install it to the test guild with `applications.commands` and `bot`; enable Send Messages, Embed Links, and Attach Files for the chart experiment. Start the local server, expose it through an HTTPS tunnel, and set General Information > Interactions Endpoint URL to the tunnel's interaction route. Discord's tutorial demonstrates local development with ngrok. [Official setup tutorial](https://docs.discord.com/developers/quick-start/getting-started)

Verify every request's `X-Signature-Ed25519` over the timestamp concatenated with the unchanged raw request body, using the application's Public Key. Invalid signatures require 401. Verified PING must receive HTTP 200, JSON content type, and `{"type":1}`. Discord checks both during endpoint setup and later sends invalid-signature probes. HTTP interactions need no Gateway connection. [Endpoint setup and verification](https://docs.discord.com/developers/interactions/overview#preparing-for-interactions)

Inference: changing the production application's endpoint would redirect its interactions, so a separate app is the smallest isolation boundary. A tunnel URL change requires updating this test endpoint. A guild-only prototype does not establish DM/user-install behavior; test those contexts separately before selecting final registration settings. Fixtures establish interaction and rendering behavior, not real account linking, consent, or cost correctness.

## Live acceptance checklist

- Run tokens, cost, context, and harness without arguments; inspect PNGs on desktop and mobile.
- Run compare without arguments, select another creator, then change range.
- Run compare with autocomplete, including a manually typed unknown handle.
- Open Compare on each subject and verify subject preservation.
- Open Search, submit a partial handle, select a result; check that one public message updates.
- Click from another account and verify only that actor sees rejection and state stays unchanged.
- Change range repeatedly; verify the old PNG disappears and controls survive.
- Restart the prototype and verify stale controls explain how to recover.
