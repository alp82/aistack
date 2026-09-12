# Discord statistics renderer

The web server accepts `POST /api/discord/render`. Convex supplies a fresh,
consent-filtered `DiscordAnswer` from `discordStats.readAnswer` for each person.
The renderer never queries Convex, ranks rows, or prices usage.

## Request contract

Send UTF-8 JSON with `Content-Type: application/json`:

```ts
{
  version: 1,
  command: 'tokens' | 'cost' | 'context' | 'harness' | 'compare',
  full: boolean,
  subject: DiscordAnswer,
  comparison: DiscordAnswer | null,
}
```

Both answers must have identical range bounds. Context and harness comparisons
use the subject's selected harness on both sides. Absent counterpart evidence
renders `n/a`. The transport opens the picker for `/compare` without a person.

Sign the exact serialized body once. The signature input is the timestamp,
one newline, and those exact body bytes. Use HMAC-SHA256 with the dedicated
shared secret, encoded as lowercase hex:

- `x-aistack-render-timestamp`: 13-digit Unix time in milliseconds.
- `x-aistack-render-signature`: 64-character signature.

The server accepts up to 60 seconds of clock skew in either direction. Do not
send a Discord token, interaction ID, or other credential in the body.

## Configuration

Set `DISCORD_RENDER_SECRET` to the same random secret of at least 32 characters
in the web service and Convex. The Convex transport also needs the trusted web
renderer origin. Missing renderer secret produces 503.

`DISCORD_RENDER_ICON_ORIGINS` on the web server is a comma-separated list of
trusted catalog/storage origins. Include the Convex storage origin and any
canonical catalog origins whose icons should render. Local mirrored storage
uses `http://127.0.0.1:3210`. Production uses its own storage origin. Explicit
origins are required; redirects and credentials in URLs are refused. Missing,
unapproved, oversized, or failed icons render a neutral mark. Never add an
origin solely because it appeared in a request.

## Bounds and failures

Requests are limited to 512 KiB, 250 entries per catalog/list, and 180 days per
period. The strict schema rejects unknown fields and non-finite/negative
measurements. Render dimensions are 960 pixels wide and at most 24,000 pixels
high, with a 24-million input pixel bound and 8 MiB output limit. Oversized full
lists fail explicitly. The transport must still apply Discord's current
interaction upload limit to returned bytes.

At most two renders run concurrently per process. Icons load in four workers,
with a four-second total fetch budget, 1.5-second per-fetch timeout, 256 KiB
response bound and one-million-pixel decode bound. They are resized before
embedding. Sharp rasterizes the escaped SVG with square marks. No personalized
image is publicly cached; all endpoint responses send `Cache-Control: no-store`.

Failures use generic text: 401 for signature/expiry, 400 for schema, 413 for
body size, 415 for content type, 503 for missing configuration or concurrency,
and 500 for rasterization/output failure. Responses never include request data
or credentials. Convex owns retry/recovery and consent rechecks before delivery.

## Validation

`src/features/discord/server/render.test.ts` rasterizes every starter and person
comparison, checks null/zero, context evidence, subscriptions, citations,
consent, icon failure, authentication, body limits and concurrency recovery.
A compile-time assignment checks that the Convex answer fits the render schema.

Run `pnpm build`, start `.output/server/index.mjs` on an unused local port, then
send signed requests containing local `discordStats.readAnswer` results. This
checks the deployed route and packaged native Sharp/libvips libraries. The
renderer ticket records the specific runtime validation. This requires no
Discord registration, deployment or message send.

## Durable interaction transport

Convex sets `DISCORD_RENDER_ORIGIN` to the trusted web origin, for example
`https://aistack.to`. It must be an origin without credentials, a path, query,
or fragment. The transport signs the exact request body described above and
bounds the returned stream to the smaller of 8 MiB and Discord's interaction
upload limit. `DISCORD_BOT_TOKEN` is never required for fulfillment.

`discordSessions` stores requester and application/message binding, the selected
creator/stack IDs, UTC date anchor, view, revision, fixed one-hour expiry, modal
nonce, and current operation. It stores no webhook token or rendered statistics.
The scheduled action temporarily receives the triggering interaction token.
An atomic update reservation and one-time worker claim serialize both picker and
data changes. Modal opening validates the same bindings without changing the
visible revision. Modal submission consumes its nonce and reserves an update.

A worker rereads the pinned public records, renders, then rereads consent before
upload. A change causes one fresh render attempt. The subject supplies the harness
for both comparison sides. A successful multipart PATCH replaces the attachment
set, embed reference and controls together, then commits the visible revision.
Picker-only edits preserve the attachment. All messages suppress mentions.

A rejected or failed render keeps the confirmed view and provides a private
recovery message when the interaction path is available. An ambiguous PATCH,
failed commit after delivery, or stranded worker makes the session unusable.
Workers get two minutes and cannot be reclaimed. One-hour expiry never extends;
the hourly cleanup removes at most 500 expired sessions per pass and schedules
more bounded passes while expired rows remain. Historical PNGs
remain on Discord. Old signed requests expire after five minutes, preventing
replay after session cleanup.

Private identity recovery offers linking instructions and a creator picker.
Selecting a real creator creates a public answer and binds controls to its new
message. Creator browsing requires no account link. Live client verification of
this transition and the remaining install-context cases belongs to the acceptance
ticket. The owner waived another live acceptance round for this release.

`convex/discordStatsLifecycle.test.ts` exercises the signed HTTP handler, durable
Convex state, fresh data queries, HMAC request and multipart transport with a
controlled Discord/renderer HTTP boundary. It covers refinements, modal nonces,
privacy recovery, consent changes, date anchors, replay, expiry, worker claims,
comparison harnesses and failure/retry behavior. It does not substitute for live
Discord desktop/mobile acceptance.


## Deployment readiness

`GET /api/discord/render` returns the Coolify `SOURCE_COMMIT` and whether the
runtime signing secret is configured, with no-store. It returns no credentials
or user data. The production workflow waits for its exact commit and verifies
that an unsigned POST is rejected before registering commands. The route imports
the native renderer, so a missing Sharp runtime also prevents readiness. Native
PNG and font output were verified during the initial production rollout.

See [release operations](discord-release.md) for automatic registration and retries.
