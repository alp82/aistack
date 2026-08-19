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

The verdict and the captured endpoint behavior are in the resolution comment on
the ticket.
