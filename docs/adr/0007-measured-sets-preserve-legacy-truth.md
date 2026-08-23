# Measured sets preserve legacy truth

Version 2 payloads carry sorted active-day dates and project workspace identifiers instead of counts. Sets make cross-source unions exact, while version 1 rows remain immutable and readable.

## Project workspace identifiers

A project workspace is one local directory. The CLI assigns a persistent random identifier, so paths and repository names never leave the machine. Two clones in different directories or on different machines remain two project workspaces.

## Legacy rows

At each current or historical point, the server unions every known set. The server compares that union with each legacy count and keeps the largest value.

The result is exact when every source carries a set. One legacy source is also exact by itself. Every other legacy mix is a lower-bound reading.

## Window

When source windows differ, the merged window spans the earliest start through the latest end. Its day count is the inclusive calendar span, so the denominator covers every date in the union.

Why: [alp82/aistack#252](https://github.com/alp82/aistack/issues/252).
