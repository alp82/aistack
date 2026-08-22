# FxTwitter as a non-paid X collector

Date: 2026-08-22. Ticket: alp82/aistack#209. This ticket tests the FxTwitter path from
alp82/aistack#179.

The question has two standards. The collector needs technical success at low volume.
It also needs a stable production dependency.

## Verdict

FxTwitter supports a low-volume, best-effort collector today. It does not support a
stable production dependency by itself.

The live endpoint returned current data through Node. The project also documents useful
pagination, error, and rate-limit behavior.

However, FxTwitter has no published service agreement. Its closest status monitor reports
less than full availability.

The service also calls undocumented X GraphQL endpoints. Those calls use X web-session
credentials, and X can change or block them without notice.

X terms expressly prohibit this automated access without written consent. The MIT license
covers FxEmbed code, but it does not remove the X restriction.

Use FxTwitter only as an optional source for the private inbox. Keep owner paste as the
supported X lane.

## Live behavior

All probes used Node 24.19.0 from this container. The probes ran without FxTwitter
authentication.

Fifteen of fifteen normal calls returned HTTP 200 with valid JSON. The calls covered
OpenAI, AnthropicAI, GoogleDeepMind, simonw, and karpathy.

The test matrix included the live
[AnthropicAI profile-status endpoint](https://api.fxtwitter.com/2/profile/AnthropicAI/statuses).

Response times ranged from 0.75 to 1.46 seconds. A separate invalid profile returned
[HTTP 404 with valid JSON](https://api.fxtwitter.com/2/profile/__aistack_nonexistent_209__/statuses).

A [future `since` value](https://api.fxtwitter.com/2/profile/AnthropicAI/statuses?since=4102444800)
returned HTTP 204 with an empty body. A valid cursor returned the next JSON page.

These results confirm current technical use from a Convex-compatible Node client. They do
not measure long-term availability or data completeness.

The live API exposes an [OpenAPI specification](https://api.fxtwitter.com/2/openapi.json).
It defines `count`, `cursor`, `since`, `with_replies`, and `groupthreads`.

The [`since` route logic](https://github.com/FxEmbed/FxEmbed/blob/85ba21c6e46424ac3e841ab4b2d71d0c5d5f7ee7/src/realms/api/routes/twitter.ts)
does not return an incremental result set. It only returns 204 when no fetched post is newer.

If one post is newer, the route returns the full page. Therefore, the collector must
deduplicate every result by post ID.

The live service did not honor `count=5` exactly. It returned 12 to 20 results across
three tested profiles.

FxEmbed [issue #2011](https://github.com/FxEmbed/FxEmbed/issues/2011) records the same
count defect for the profile-status endpoint.

The result list also included reposts and self-thread replies. The `reposted_by` and
`replying_to` fields identify these cases.

A repost row uses the original post ID and timestamp. It does not expose the repost
event ID or event time, as [issue #2231](https://github.com/FxEmbed/FxEmbed/issues/2231)
records.

The `since` check uses that original timestamp. Therefore, a new repost of an old post
can escape incremental collection.

Do not assume that the list contains only original posts. Do not assume that the requested
count sets an exact response size.

## Public service limits

The [FxEmbed API guide](https://docs.fxembed.com/api/introduction/) documents a limit of
1,000 API v2 requests each minute for each IP address. It recommends self-hosting for
higher use.

This limit easily covers the planned low volume. The guide does not promise a service
agreement, support window, or deprecation period.

FxEmbed names monitor 14 `API (X/Twitter, users)` on its
[status page](https://status.fxtwitter.com/). This is the closest published monitor for
profile collection.

The monitor reports [100.0% for 24 hours](https://status.fxtwitter.com/api/badge/14/uptime/24),
[99.08% for 168 hours](https://status.fxtwitter.com/api/badge/14/uptime/168), and
[99.67% for 720 hours](https://status.fxtwitter.com/api/badge/14/uptime/720).

The 720-hour figure implies about two hours and 23 minutes of detected unavailability.
The status page does not show a separate monitor for the profile-status route.

FxEmbed also records upstream breakage in its issue tracker.

- In [June 2023](https://github.com/FxEmbed/FxEmbed/issues/333), X removed an API path and later blocked guest GraphQL access.
- In [April 2025](https://github.com/FxEmbed/FxEmbed/issues/1283), X required a new transaction header and broke post retrieval.
- In [July 2025](https://github.com/FxEmbed/FxEmbed/issues/1385), X blocked Cloudflare addresses and caused broad API failures.

The maintainer restored service after each change. These incidents predate the profile-status route, but they show the same upstream dependency.

## Upstream dependency

The profile-status endpoint first appeared on 2026-03-24 in
[commit `c517048130`](https://github.com/FxEmbed/FxEmbed/commit/c517048130b230ab80789e6e49cbb28f94a7a705).
The first implementation used an X GraphQL query captured from the X website.

The current
[`profileStatusesAPI`](https://github.com/FxEmbed/FxEmbed/blob/85ba21c6e46424ac3e841ab4b2d71d0c5d5f7ee7/packages/atmosphere/src/providers/twitter/userStatuses.ts)
tries multiple undocumented X timeline queries. This fallback helps with breakage, but
all current profile queries require an account. The
[`queries.ts` source](https://github.com/FxEmbed/FxEmbed/blob/85ba21c6e46424ac3e841ab4b2d71d0c5d5f7ee7/packages/atmosphere/src/providers/twitter/graphql/queries.ts)
sets `requiresAccount` on each query.

The same profile-status code catches an item build error and removes that item. Thus,
an HTTP 200 response can omit one failed item without an error marker.

The
[`GraphQL request code`](https://github.com/FxEmbed/FxEmbed/blob/85ba21c6e46424ac3e841ab4b2d71d0c5d5f7ee7/packages/atmosphere/src/providers/twitter/graphql/request.ts)
marks these calls as account-required. The request code sends them through FxEmbed's X
account path.

The [credential guide](https://docs.fxembed.com/deployment/credentials/) says FxEmbed works
best with X account credentials. It also says use without credentials has lower limits
and excludes sensitive posts.

Operators get these credentials from the `auth_token` and `ct0` browser cookies. Multiple
accounts distribute requests.

Self-hosting can remove the public FxTwitter host as one failure point. It cannot remove
X endpoint changes, X account limits, or X account suspension.

## License and X terms

FxEmbed uses the
[MIT license](https://github.com/FxEmbed/FxEmbed/blob/85ba21c6e46424ac3e841ab4b2d71d0c5d5f7ee7/LICENSE.md).
The license permits use, modification, and self-hosting of the software.

The license provides the software without a warranty. It does not grant rights to X
interfaces, X accounts, or X content.

The current [X Terms of Service](https://x.com/en/tos) contain the same automated-access
restriction in both regional versions. X forbids automated access outside its published
interfaces without a separate agreement.

X also expressly forbids crawling or scraping without written consent. The non-EU terms
took effect on 2026-04-10.

The EU, EFTA, and UK terms took effect on 2026-01-15. This restriction creates an ongoing
terms risk for the FxTwitter upstream path.

X now presents its published API as a
[paid, credit-based service](https://docs.x.com/x-api/getting-started/pricing). It charges
$0.005 for each post read and $0.010 for each user read.

Therefore, X provides no free, published interface for automatic profile collection.
This report describes the terms posture and does not give legal advice.

## Production shape

The news pipeline can tolerate a missed collection run because the owner controls the
private inbox. This tolerance makes optional collection useful.

Use this design if the project accepts the dependency risk:

1. Keep the owner-paste lane available at all times.
2. Treat FxTwitter collection as an optional source.
3. Store the last successful result for each profile.
4. Deduplicate every result by post ID.
5. Treat 204 as a successful run with no changes.
6. Validate the status, content type, `code`, and result shape.
7. Retry timeouts, 429 responses, and 500 responses with limits.
8. Do not retry 400 or 404 responses automatically.
9. Alert on the last successful collection time.
10. Preserve `reposted_by` and `replying_to` for curation.
11. Keep public rendering on the official X oEmbed endpoint.
12. Stop automatic collection after repeated upstream failures.
13. Exclude reposts if the lane needs only authored posts.

Do not describe this lane as stable or supported. Describe it as optional, low-volume,
and subject to loss.

## Decision

The FxTwitter path passes the low-volume technical test. It fails the stable production
dependency test.

FxTwitter also fails an exact repost-event requirement. It does not expose repost event
IDs or event times.

Do not replace owner paste with FxTwitter. Add FxTwitter only if missed runs and sudden
loss do not block the product.

## Primary sources

- [FxEmbed API guide](https://docs.fxembed.com/api/introduction/)
- [FxTwitter runtime OpenAPI file](https://api.fxtwitter.com/2/openapi.json)
- [FxEmbed source at the tested commit](https://github.com/FxEmbed/FxEmbed/tree/85ba21c6e46424ac3e841ab4b2d71d0c5d5f7ee7)
- [Profile-status endpoint introduction](https://github.com/FxEmbed/FxEmbed/commit/c517048130b230ab80789e6e49cbb28f94a7a705)
- [FxEmbed credential guide](https://docs.fxembed.com/deployment/credentials/)
- [FxEmbed self-hosting guide](https://docs.fxembed.com/deployment/)
- [FxEmbed status page](https://status.fxtwitter.com/)
- [June 2023 X API breakage](https://github.com/FxEmbed/FxEmbed/issues/333)
- [April 2025 transaction-header breakage](https://github.com/FxEmbed/FxEmbed/issues/1283)
- [July 2025 Cloudflare block](https://github.com/FxEmbed/FxEmbed/issues/1385)
- [FxEmbed MIT license](https://github.com/FxEmbed/FxEmbed/blob/85ba21c6e46424ac3e841ab4b2d71d0c5d5f7ee7/LICENSE.md)
- [X Terms of Service](https://x.com/en/tos)
- [Official X API pricing](https://docs.x.com/x-api/getting-started/pricing)
