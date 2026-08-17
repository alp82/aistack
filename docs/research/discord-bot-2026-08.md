# Discord bot surfaces and install models

**Ticket:** [Research: Discord bot surfaces and install models](https://github.com/alp82/aistack/issues/167) (map [#159](https://github.com/alp82/aistack/issues/159))
**Date:** 2026-08-17
**Status:** done

Research question: what can a Discord app render, where can it run, and how well does the HTTP-interactions model fit a Convex backend, for an aistack bot that posts stack-card embeds and usage insights.

Note on URLs: `discord.com/developers/docs/*` now 301-redirects to `docs.discord.com/developers/*`. Citations below use the new host. The Developer Policy and Developer ToS redirect to `support-dev.discord.com`, which sits behind a Cloudflare challenge; quotes from those pages were recovered via search snippets and are flagged where full-text verification failed.

## Summary for the aistack use case

- The entire product surface aistack needs (slash commands, rich stack-card output, buttons, image attachments, follow-up webhook messages) works over the HTTP interactions endpoint. No gateway connection is required for any of it. Discord treats HTTP and Gateway as two mutually exclusive delivery paths for interactions, chosen by setting an Interactions Endpoint URL ([interactions overview](https://docs.discord.com/developers/interactions/overview)).
- A Convex `httpAction` is a workable interactions endpoint: it exposes the Fetch-standard Request with raw body access (`request.text()` / `arrayBuffer()`), the default runtime ships `SubtleCrypto`, and Convex's own product notes confirm Ed25519 among the supported signature algorithms. Convex's own blog shows exactly this pattern (verify signature on the raw body inside `httpAction`, using the `discord-interactions` package). Follow-ups are plain HTTPS POSTs to a webhook URL, doable from any Convex action via `fetch`.
- The hard constraint is the 3-second initial response window. The safe pattern on Convex: verify signature, immediately return a deferred response (type 5), schedule an action, and PATCH the real content within the 15-minute interaction token lifetime.
- What Convex cannot do: hold the persistent gateway WebSocket. That rules out (without a separate always-on host) reacting to plain messages, setting bot presence/status, and receiving guild events. None of these are needed for "user runs /stack, bot renders a card".
- Rendering options for the stack card, richest first: Components V2 (container, sections, text display, media gallery; up to 40 components), classic embeds (10 per message, 6000 chars combined), or a server-rendered image uploaded as an attachment and referenced via `attachment://card.png` inside an embed. The attachment route fits aistack's existing OG-image renderer.
- ToS-wise the plan is clean: posting cards in servers where the app is installed and invoked by a user is normal operation. The bright lines are unsolicited DMs (explicitly prohibited without user permission), having a privacy policy, and not training models on message content. The bot does not need any privileged intent for the interactions-only design.

## 1. Output surfaces

### Application commands

Three types ([application commands](https://docs.discord.com/developers/interactions/application-commands)):

- `CHAT_INPUT` (1): slash commands.
- `USER` (2): right-click on a user.
- `MESSAGE` (3): right-click on a message.

Limits (same page): 100 global `CHAT_INPUT` commands, 15 global `USER`, 15 global `MESSAGE`, 1 global `PRIMARY_ENTRY_POINT` command, the same amounts per guild for guild commands, 200 command creates per day per guild, names 1-32 chars, descriptions 1-100 chars, max 25 options per command, max 100 permission overwrites per command.

### Interaction responses

From [receiving and responding](https://docs.discord.com/developers/interactions/receiving-and-responding):

- Callback types include `CHANNEL_MESSAGE_WITH_SOURCE` (4), `DEFERRED_CHANNEL_MESSAGE_WITH_SOURCE` (5, shows a loading state), `DEFERRED_UPDATE_MESSAGE` (6), `UPDATE_MESSAGE` (7), autocomplete (8), `MODAL` (9), `LAUNCH_ACTIVITY` (12).
- "You must send an initial response within 3 seconds of receiving the event."
- The interaction token is "valid for 15 minutes": within that window the app can PATCH the original response, DELETE it, and POST follow-up messages (these use webhook endpoints keyed by application id + interaction token).
- The `EPHEMERAL` flag (64) makes a response visible only to the invoking user. When deferring, `EPHEMERAL` is the only valid flag.
- The docs note a limit of 5 follow-up messages per interaction for user-installed apps used in servers where the app is not installed.

### Embeds

From the [message resource, embed limits](https://docs.discord.com/developers/resources/message#embed-object-embed-limits):

- title 256, description 4096, up to 25 fields, field name 256, field value 1024, footer text 2048, author name 256.
- "The combined sum of characters in all title, description, field.name, field.value, footer.text, and author.name fields across all embeds attached to a message must not exceed 6000 characters."
- Create Message accepts "up to 10 rich embeds" per message; content is capped at 2000 characters ([create message params](https://docs.discord.com/developers/resources/message#create-message-jsonform-params)). Embeds support image, thumbnail, author icon, and footer icon slots.

### Message components (classic) and modals

From the [component reference](https://docs.discord.com/developers/components/reference):

- Legacy set: Action Rows, Buttons (up to 5 per action row), Select Menus (string, user, role, mentionable, channel; max 25 options), Text Inputs (modal only, max 4000 characters).
- Modals are opened only as an interaction response (`MODAL`, type 9).

### Components V2

From the [components overview](https://docs.discord.com/developers/components/overview) and [component reference](https://docs.discord.com/developers/components/reference):

- New types: Container, Section, Text Display, Media Gallery (1-10 media items), File, Separator, Thumbnail, Label.
- "To use components, messages must be sent with the `IS_COMPONENTS_V2` flag (`1<<15`)." (value 32768)
- With the flag set: "The `content` and `embeds` fields will no longer work", attachments do not show by default (they must be surfaced through Media Gallery or File components), and polls and stickers are disabled.
- The flag "can't be removed" once applied to a message.
- "Messages allow up to 40 total components."
- A widely cited limit of 4000 characters combined across Text Display components did not appear in the sections I fetched: treat as unverified until read directly in the reference tables.
- Webhook-executed messages can carry components; interactive components require an application-owned webhook (interaction follow-ups qualify), while non-application webhooks can send non-interactive components with the `with_components` query param ([webhook resource](https://docs.discord.com/developers/resources/webhook)).

### File and image attachments

From the [API reference, uploading files](https://docs.discord.com/developers/reference#uploading-files):

- Files go up as `multipart/form-data` with uniquely named `files[n]` parts and an optional `payload_json` part.
- "Images can also be referenced in embeds using the `attachment://filename` URL."
- Embed-image formats: "Only .jpg, .jpeg, .png, .webp, and .gif may be used at this time."
- "The default limit is 10 MiB for all users, but may be higher for users depending on their Nitro status or by the server's Boost Tier." The docs do not publish a per-tier table on this page; the per-tier numbers (50 MB tier 2, 100 MB tier 3) are user-facing Nitro/boost facts, unverified in the developer docs.
- Maximum total request size when sending a message: 25 MiB ([channel/message docs](https://docs.discord.com/developers/resources/channel)).

### Webhooks

From the [webhook resource](https://docs.discord.com/developers/resources/webhook): three types (Incoming, Channel Follower, Application). Execute Webhook (`POST /webhooks/{id}/{token}`) supports content (2000 chars), up to 10 embeds, components, files, polls, per-message `username` and `avatar_url` overrides, `thread_id` targeting, and `wait=true` to get the created message back. Incoming webhooks need no bot user at all (creatable via the `webhook.incoming` OAuth scope).

### Richer surfaces

- Polls: bots can create polls via Create Message (and webhooks). Limits: 10 answers, question 300 chars, answer 55 chars, duration up to 32 days (default 24h). "Apps are not allowed to vote on polls." ([poll resource](https://docs.discord.com/developers/resources/poll))
- Threads and forums: bots can create threads from messages or standalone, and post to forum/media channels by starting a thread with an initial message (needs `SEND_MESSAGES`). Thread names 1-100 chars. ([channel resource](https://docs.discord.com/developers/resources/channel))
- Activities (embedded apps): "web apps hosted in an iframe that use the Embedded App SDK", launched via an Entry Point command in the App Launcher or the `LAUNCH_ACTIVITY` (12) interaction callback; network traffic goes through Discord's proxy (`/.proxy/` paths). ([activities overview](https://docs.discord.com/developers/activities/overview), [how activities work](https://docs.discord.com/developers/activities/how-activities-work)) Heavyweight; not needed for stack cards.

## 2. Install models

From the [application resource](https://docs.discord.com/developers/resources/application) and [application commands](https://docs.discord.com/developers/interactions/application-commands):

- Two installation contexts via `integration_types`: `GUILD_INSTALL` (0) and `USER_INSTALL` (1). An app can support both, configured in `integration_types_config`.
- Guild install: authorized by a member with `MANAGE_GUILD`; commands visible to all members (subject to command permissions).
- User install: "visible only to the authorizing user", and the app follows the user into their servers, DMs, and group DMs.
- Interaction contexts via `contexts` on each command: `GUILD` (0), `BOT_DM` (1), `PRIVATE_CHANNEL` (2, DMs and group DMs with other users).
- User-installed app constraints (application resource + [user-installable app tutorial](https://docs.discord.com/developers/tutorials/developing-a-user-installable-app)):
  - They hold no server permissions and must "respect the user's permissions in the surface where the app is being used"; where the user cannot post, the app's responses are restricted to ephemeral.
  - They operate through the interactions model only; the tutorial builds them as a plain HTTP endpoint app with no gateway connection and no reliance on a bot presence in the guild.
  - Follow-ups are limited to 5 per interaction in servers where the app is not guild-installed ([receiving and responding](https://docs.discord.com/developers/interactions/receiving-and-responding)).
  - `authorizing_integration_owners` on the interaction tells the app which user or guild authorized it.
  - The exact doc sentence "responses are forced ephemeral in X context" and "no access to guild information" did not surface verbatim in my fetches; the behavior above is what the application resource and tutorial state. Treat finer-grained per-context rules as needing a direct read of the interaction-context tables.
- Verification and growth: "Verification is required for your app to scale past 100 servers" ([How Do I Get My App Verified, support-dev](https://support-dev.discord.com/hc/en-us/articles/23926564536471-How-Do-I-Get-My-App-Verified); page is Cloudflare-gated, quote recovered via search snippet). App Verification is now separate from Privileged Intent review ([Changes to Privileged Intent Access](https://support-dev.discord.com/hc/en-us/articles/40281523410967-Changes-to-Privileged-Intent-Access-for-Discord-Apps), same caveat). A 75-server "eligible to apply" threshold appears in older community material only; unverified in current primary sources.
- App Directory: a searchable hub for installing apps; apps must enable discovery, and editorial placement is by Discord's team ([discovery overview](https://docs.discord.com/developers/discovery/overview)). The eligibility checklist lives in the developer portal per app; not fully verifiable from the public docs page.

## 3. Permissions

- OAuth2 scopes ([oauth2 topic](https://docs.discord.com/developers/topics/oauth2)): `bot` "puts the bot in the user's selected guild by default" with a `permissions` integer in the authorize URL; `applications.commands` "allows your app to add commands to a guild - included by default with the `bot` scope"; also `applications.commands.permissions.update`, `identify`, `webhook.incoming` (mints an incoming webhook during the OAuth flow).
- Permission bitfield ([permissions topic](https://docs.discord.com/developers/topics/permissions)): "Permissions are stored in a variable-length integer serialized into a string" (string serialization since API v8), combined with bitwise OR, checked with AND. Effective permissions = base (everyone role OR member roles), then channel overwrites applied in order: everyone overwrite, role overwrites, member overwrite. `ADMINISTRATOR` bypasses all overwrites. Implicit denials exist (denying `VIEW_CHANNEL` or `SEND_MESSAGES` disables dependent permissions such as `EMBED_LINKS` and `ATTACH_FILES`).
- Per-command gating: `default_member_permissions` is a permission bitfield on the command; `"0"` restricts it to admins unless a server sets overrides ([application commands](https://docs.discord.com/developers/interactions/application-commands)).
- Privileged gateway intents ([gateway topic](https://docs.discord.com/developers/topics/gateway)): `GUILD_PRESENCES`, `GUILD_MEMBERS`, `MESSAGE_CONTENT`. Current docs: "Apps with fewer than 10,000 users can access privileged intents by enabling them in the Developer Portal"; above 10,000 unique users the app requires review, with annual re-review. Passing an unapproved privileged intent closes the gateway connection with close code 4014. (This 10,000-user threshold replaced the old 100-server rule; see the support-dev "Changes to Privileged Intent Access" article.)
- Relevant to aistack: an interactions-only bot needs zero intents. `EMBED_LINKS` and `ATTACH_FILES` matter only for messages the bot sends through the channel API; interaction responses are delivered through the interaction webhook.

## 4. Hosting models and Convex fit

### Gateway (WebSocket)

[Gateway topic](https://docs.discord.com/developers/topics/gateway): a "persistent WebSocket connection" with heartbeats on an interval from the Hello event, an Identify handshake, resume support via `resume_gateway_url` + `session_id`, and mandatory sharding at 2500+ guilds. Required for: receiving guild events (`MESSAGE_CREATE`, member/role/channel events), reading messages, reacting to non-interaction activity, and setting bot presence/status (presence is set via Identify or Update Presence, gateway only).

### HTTP interactions endpoint

[Interactions overview](https://docs.discord.com/developers/interactions/overview): gateway and HTTP are the two delivery paths for interactions; setting an Interactions Endpoint URL opts the app into HTTP. Requirements:

- Verify every request with Ed25519: headers `X-Signature-Ed25519` and `X-Signature-Timestamp`, verify signature over timestamp + raw body against the app public key; respond 401 on failure. Discord actively probes with invalid signatures and removes endpoints that fail the check.
- On registration Discord POSTs a `PING` payload; respond 200 with a `PONG` callback (type 1).
- 3-second initial response deadline; defer (type 5) then edit/follow up via webhook endpoints for up to 15 minutes ([receiving and responding](https://docs.discord.com/developers/interactions/receiving-and-responding)).

### Convex fit

- `httpAction` gives a Fetch-standard `Request`/`Response` pair with raw body access (`.text()`, `.arrayBuffer()`), 20 MB request/response cap ([Convex HTTP actions](https://docs.convex.dev/functions/http-actions)). Raw body access is exactly what the Ed25519 check needs (verify before JSON parse).
- The default Convex runtime exposes `crypto`, `CryptoKey`, and `SubtleCrypto`, and `fetch` in actions ([Convex runtimes](https://docs.convex.dev/functions/runtimes)). Convex's product notes confirm asymmetric signature support including Ed25519 ("You can now generate keypairs for asymmetric signatures in Convex actions", listing Ed25519 alongside RSASSA-PKCS1-v1_5, RSA-PSS, ECDSA; verification available broadly, [Product Updates Vol 18](https://news.convex.dev/product-updates-volume-18/)). Convex's own tutorial implements the Discord verify inside `httpAction` with the `discord-interactions` npm package ([Discord Bot Webhooks with Convex](https://stack.convex.dev/webhooks-with-convex)).
- Deferred flow on Convex: `httpAction` verifies and immediately returns `{type: 5}`, then `ctx.scheduler.runAfter(0, ...)` an action that computes the card and PATCHes `https://discord.com/api/v10/webhooks/{app_id}/{token}/messages/@original` (or POSTs follow-ups). All plain HTTPS via `fetch`, well inside the 15-minute token window.
- Not possible on Convex: the always-on gateway WebSocket (Convex functions are request-scoped). If message-event features or bot presence ever matter, run a tiny gateway daemon on an always-on host (small VPS, Fly.io machine) that forwards relevant events to Convex over HTTP. For the stack-card bot this is unnecessary.
- Minor consequence of no gateway: the bot appears in the member list without an online presence. Command UX is unaffected.

## 5. Rate limits

From the [rate limits topic](https://docs.discord.com/developers/topics/rate-limits):

- Global: "All bots can make up to 50 requests per second to our API."
- Per-route buckets, often scoped per top-level resource (`channel_id`, `guild_id`, `webhook_id`). Headers: `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Reset`, `X-RateLimit-Reset-After`, `X-RateLimit-Bucket`, `X-RateLimit-Scope` (`user`, `global`, `shared`). Parse headers dynamically; do not hardcode.
- 429 responses carry `retry_after` in the JSON body.
- Invalid request limit: "10,000 per 10 minutes"; 401, 403, and 429 responses count, and exceeding it triggers a temporary Cloudflare IP ban. 429s with `X-RateLimit-Scope: shared` do not count.
- Interaction endpoints (responding to interactions) are exempt from the bot's global rate limit.
- Per-message caps recap: 10 embeds, 6000 embed chars combined, 2000 content chars, 40 components (V2), 25 MiB request.
- Webhook execution: the webhook resource documents no numeric per-channel limit. The commonly cited 30 messages/min/channel webhook figure does not appear in the current developer docs: unverified, treat as folklore until Discord documents it. Webhook routes do have their own header-driven buckets (keyed by `webhook_id`).
- DM creation: no numeric limit documented, but the Create DM endpoint warns that rapid mass DM-channel creation gets a bot blocked from opening new DMs ([user resource](https://docs.discord.com/developers/resources/user#create-dm)).

## 6. ToS and Developer Policy constraints

Primary source: [Discord Developer Policy](https://support-dev.discord.com/hc/en-us/articles/8563934450327-Discord-Developer-Policy) and [Developer ToS](https://support-dev.discord.com/hc/en-us/articles/8562894815383-Discord-Developer-Terms-of-Service). Both pages are behind a Cloudflare challenge; the quotes below were recovered through search snippets of the official article and should be re-read in a browser before relying on exact wording.

- Unsolicited DMs: "Do not contact users on Discord without their explicit permission. This includes frequently sending unsolicited direct messages and/or sending direct messages not directly related to maintaining or improving an Application's functionality." The Create DM endpoint doc repeats this operationally: "You should not use this endpoint to DM everyone in a server about something. DMs should generally be initiated by a user action."
- Message content: "Do not use message content obtained through the APIs to train machine learning or AI models (including large language models) unless express permission is granted by Discord." The MESSAGE_CONTENT intent additionally requires an approved use case above the user threshold (section 3). The aistack bot needs neither.
- Privacy: developers must handle user data lawfully; verification requires a privacy policy (part of the App Verification checklist per the support-dev verification article). Ship a privacy policy URL on the app profile before pursuing verification or directory listing.
- Circumvention: "Do not enable your Application to bypass or circumvent Discord's privacy, safety, and/or security features."
- Posting stack cards: a user-invoked command that renders content in the channel it was invoked in is ordinary app behavior and raises no policy issue. Unprompted posting into channels (scheduled digests) is fine in servers whose admins installed the bot and configured the target channel, since installation by a `MANAGE_GUILD` member constitutes the server's consent; avoid anything resembling advertising in servers that did not opt in.
- Monetization: Discord offers native SKUs, entitlements, one-time purchases, and user/guild subscriptions for "Bots and Activities" ([monetization overview](https://docs.discord.com/developers/monetization/overview)). Eligibility details (verification, team, payout region) live in the Premium Apps program pages; not needed for aistack now.

## Sources

Discord developer docs (docs.discord.com, formerly discord.com/developers/docs):

- https://docs.discord.com/developers/interactions/overview
- https://docs.discord.com/developers/interactions/receiving-and-responding
- https://docs.discord.com/developers/interactions/application-commands
- https://docs.discord.com/developers/components/overview
- https://docs.discord.com/developers/components/reference
- https://docs.discord.com/developers/resources/message
- https://docs.discord.com/developers/resources/webhook
- https://docs.discord.com/developers/resources/channel
- https://docs.discord.com/developers/resources/user#create-dm
- https://docs.discord.com/developers/resources/poll
- https://docs.discord.com/developers/resources/application
- https://docs.discord.com/developers/reference (uploading files)
- https://docs.discord.com/developers/topics/gateway
- https://docs.discord.com/developers/topics/oauth2
- https://docs.discord.com/developers/topics/permissions
- https://docs.discord.com/developers/topics/rate-limits
- https://docs.discord.com/developers/activities/overview
- https://docs.discord.com/developers/activities/how-activities-work
- https://docs.discord.com/developers/discovery/overview
- https://docs.discord.com/developers/monetization/overview

Discord official support (Cloudflare-gated; quotes via search snippets):

- https://support-dev.discord.com/hc/en-us/articles/8563934450327-Discord-Developer-Policy
- https://support-dev.discord.com/hc/en-us/articles/8562894815383-Discord-Developer-Terms-of-Service
- https://support-dev.discord.com/hc/en-us/articles/23926564536471-How-Do-I-Get-My-App-Verified
- https://support-dev.discord.com/hc/en-us/articles/40281523410967-Changes-to-Privileged-Intent-Access-for-Discord-Apps

Convex (primary vendor sources):

- https://docs.convex.dev/functions/http-actions
- https://docs.convex.dev/functions/runtimes
- https://news.convex.dev/product-updates-volume-18/
- https://stack.convex.dev/webhooks-with-convex

Unverified items (not found in primary sources): the 30 msgs/min/channel webhook limit, the 4000-char combined Text Display limit, per-boost-tier upload byte counts in developer docs, the historical 75-server verification threshold, and verbatim doc wording for forced-ephemeral rules per interaction context.
