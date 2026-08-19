# Prototype: X owner-paste flow with oEmbed rendering

Throwaway code for [alp82/aistack#179](https://github.com/alp82/aistack/issues/179),
part of [map #159](https://github.com/alp82/aistack/issues/159). The question: does
the owner-paste lane from
[the news pipeline spec](../../docs/specs/news-pipeline.md) work end to end?

`index.html` is one self-contained demo. Open it in a browser, or serve the
directory with a static server. The page fetches the real `publish.x.com` oEmbed
endpoint live with JSONP. The `pasteLane` script block at the top of the inline
script is the pure module: parse, validate, dedupe, and the inbox reducer. That
part can lift into the real Convex collector. The rest of the page is throwaway.

Round two, after the first review: profile links store as their own kind. The
page renders what the official profile embed still gives, and a recent-posts
list on the profile card lets you pick single posts. Each pick runs the normal
post lane live.

Round three: `node server.js` serves the page on port 9006 and adds one API,
`/api/profile-posts?name=NAME`. It pulls the last posts of any profile live,
with the cascade the research file recommends: the FxTwitter API first (plain
JSON, works from Node, so Convex can call it), then the unofficial syndication
timeline endpoint. That endpoint answers 429 to every Node HTTP client
(fingerprint block), so the server shells out to curl for the fallback only.
Behind a plain static server the page falls back to a captured list for
AnthropicAI. The research on all profile-to-posts paths is in
`docs/research/x-profile-posts-2026-08.md`.

The verdict and the captured endpoint behavior are in the resolution comment on
the ticket.
