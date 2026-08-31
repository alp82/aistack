# Stacks are always public

Before this decision a stack carried a `published` boolean. The browser could create or
save a draft, publication required at least one manually selected catalog tool, and the
public reads returned null while the flag was false. Measured sync did not share that
lifecycle. It could successfully store a reading against the same row and then tell the
owner to open a URL that the public read hid.

We decided that **a stack is public as soon as it is created and cannot be unpublished**.
Creation requires its one-line summary and nothing from the manual catalog pickers.
Editing has one Save action. Public stack reads, profiles, leaderboards, activity,
analytics and Discord resolve every stack row unless a separate moderation rule hides
it. Browser-local recovery may preserve an unsaved stack, but no server-side stack has a
draft state.

Two alternatives lost. Making sync publish a draft would let an unrelated measurement
change the owner's page lifecycle. Keeping drafts but teaching sync to refuse them would
preserve the contradiction and send the owner back to the editor to select a tool the
adapter may already have measured. Both retain a state transition that has no useful
product meaning.

## Consequences

The stack create mutation emits `stack.created`; there is no publication event or
publication analytics event. A legacy `published: false` row is still public while the
migration removes the field, so deploy order cannot hide an existing stack. The
`20260831_stacks_always_public` migration clears the field and renames stored
`stack.published` activity events. After it has run in production, a schema cleanup can
remove the temporary optional field, old event validator and `by_published` index.

The words publish, private and consent remain valid for measured data. They describe
which local measurements and review names leave a machine, not whether the stack page
exists.
