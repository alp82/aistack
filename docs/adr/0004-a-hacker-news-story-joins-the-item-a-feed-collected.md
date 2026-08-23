# A Hacker News story joins the item a feed already collected

A Hacker News story usually points at an article. That article is the item's link, and
the discussion is the second link on the same item. So one post is one item with two
links, never two rows.

The Hacker News lane writes through the same dedupe key as the feed lane. When the key
already exists, the arrival patches the story id, the points and the comment count onto
that row instead of inserting a twin. The row keeps the headline and the license class
of the lane that collected it first.

A text post has no article, so its discussion page is its link. The first discussion of
one article keeps the row: a second submission is a second discussion, and the one that
gathered the points is the one worth linking.

Why: the vendor feed and Hacker News carry the same OpenAI post on the same morning. Two
rows would make the owner judge one post twice, and the newsletter could then print it
twice. The points and the comment count are the reason to read the discussion, and they
belong on the item the owner is already looking at.

Cost: the license class is decided by whichever lane arrived first, not by the stronger
claim. Both classes allow a headline, a link and our own summary, so nothing is
over-served either way.

Decided in [alp82/aistack#208](https://github.com/alp82/aistack/issues/208), measured in
[alp82/aistack#178](https://github.com/alp82/aistack/issues/178).
