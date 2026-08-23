# The X profile lane is owner-triggered only

The owner pastes an X profile link and the lane lists that profile's recent posts. The
owner picks the posts worth keeping, and each pick runs the ordinary post lane: fetch the
official oEmbed embed, store the post id and that embed.

No cron calls the profile lane. Nothing stores a profile as an item. A profile paste that
fails stores nothing and says so in the paste bar.

Why: the listing comes from FxTwitter, and
[alp82/aistack#209](https://github.com/alp82/aistack/issues/209) ruled that path optional.
It has no service agreement, it rests on private X calls, and X terms forbid that access
without written consent. A scheduled caller would make a collection run depend on a
service that can stop answering. An owner-triggered call costs one paste when it fails,
and the owner can always paste the post links instead.

The operator ruled that profile paste ships, against the recommendation to ship post paste
alone. The rules above are how that ruling meets the #209 verdict: the convenience is
real, and nothing in the pipeline depends on it.

Decided in [alp82/aistack#208](https://github.com/alp82/aistack/issues/208), proved in
[alp82/aistack#179](https://github.com/alp82/aistack/issues/179).
