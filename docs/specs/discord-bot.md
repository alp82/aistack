# Discord bot spec

Decided on [#168](https://github.com/alp82/aistack/issues/168), part of
[map #159](https://github.com/alp82/aistack/issues/159). Platform facts come from
[docs/research/discord-bot-2026-08.md](https://github.com/alp82/aistack/blob/research/discord-bot/docs/research/discord-bot-2026-08.md)
([#167](https://github.com/alp82/aistack/issues/167)). Terms are defined in
[CONTEXT.md](../../CONTEXT.md). Written 2026-08-18.

## Verdict

**Build.** The bot is line 3 of the missing list in [DIRECTION.md](../../DIRECTION.md).
The frame comes from [#18](https://github.com/alp82/aistack/issues/18): distribution,
not discussion. The bot puts stack cards and measured numbers where builders already
talk. A follow-up build map owns the execution. The order against the other build maps
belongs to [#169](https://github.com/alp82/aistack/issues/169).

## The product

An installable Discord app. Slash commands post stack cards and measured numbers into
the channel where a user invokes them. The bot pushes nothing on its own. Every figure
it shows is already public on the web.

## Commands

v1 carries four commands.

| Command | Argument | Output |
|---|---|---|
| `/stack` | stack, optional | the stack card |
| `/tokens` | stack, optional | the measured numbers for the stack |
| `/leaderboard` | none | the top builders by 30-day token volume |
| `/model` | model name | adoption and token share for the model |

`/stack` posts the stack card embed. `/tokens` posts a text embed with the measured
numbers: 30-day tokens, model shares, harnesses, and spend where the stack consented.
With no argument, both commands need a linked account and use your own stack.

`/leaderboard` reads the existing leaderboard query. `/model` needs one new aggregate
query over measured snapshots. `/tool` waits for a later version, because stack counts
alone make a thin card.

## Output format

Classic embeds throughout, no Components V2. The stack card embed carries the existing
OG image from `/api/og/stack/<slug>` and one button that links to the stack page. The
numeric commands post text embeds with fields and the same link button. Replies post
publicly in the channel. Where the invoking user cannot post, Discord forces the reply
ephemeral.

Money rules carry over from the web. A spend figure sums only stacks with `publishCost`
consent. Every dollar figure prints the price-table id and the share of tokens it
covers. Positive claims only.

## Account linking

Linking exists from the start. `/link` replies ephemerally with a signed short-lived
URL. The user opens it, signs in on the site, and the site stores the Discord user id
on their creator row. The settings page that stores the link also removes it. This is
one mutation and one small page, with no new auth provider. The `discordUserId` field
already exists on creators and is written by nothing today. In v1 only `/stack` and
`/tokens` with no argument require a linked account.

## Install model

Both install contexts from day one: guild install and user install. Commands run in
guilds, bot DMs, and private channels. The app needs zero privileged intents. A guild
install takes a member with Manage Server. A user install follows the user into any
server without admin consent.

## Hosting

The Convex interactions endpoint, with no gateway process. The `httpAction` verifies
the Ed25519 signature on the raw body, answers the registration ping, and defers within
the 3-second window. A scheduled action computes the reply and patches it within the
15-minute token life. Interaction responses are exempt from the global rate limit, and
the command handlers reuse the existing rate-limit helper against abuse.

The trade is accepted: the bot shows no online presence. No v1 command needs the
gateway. The endpoint stays the same if a gateway daemon later joins the prod server,
so that upgrade needs no rework.

## Launch

Three venues, decided on #168:

1. The install link in the site footer.
2. A broadcast email, in the important-updates category.
3. A listing in the Discord App Directory.

The directory listing needs discovery enabled and a privacy policy URL on the app
profile. Verification becomes required past 100 servers.

## Out of scope

- Posting newsletter issues to a Discord channel. Ruled out on #168.
- Message events, bot presence, and any DM the user did not invoke.
- Two-way Discord sync, a non-goal since #18.

## Later extensions, not v1

- `/tool <name>` with a card worth posting.
- A gateway daemon on the prod server, if a feature ever needs message events.
- App verification and whatever growth past 100 servers demands.
