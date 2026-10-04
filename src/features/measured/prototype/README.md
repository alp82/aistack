# Sync discovery prototype

Question: where should guests and owners learn how to sync, and how much instruction belongs at each location?

Open http://localhost:3019/prototype/sync-discovery?variant=D with the existing development server. To start the app specifically for this preview, run `pnpm prototype:sync`.

- A: inline command at the point of need.
- B: setup checklist with one next step.
- C: compact invitation opening a shared sync panel.
- D (default): selected A/C mix. Owner commands stay inline; header and public invitations open the panel. Homepage leads with discovery, a sync CTA, a compact returning-user command strip, and example stacks.

All seven locations have before and after panels. Before panels are condensed reconstructions of current source, not screenshots. The gallery uses fixture data; owner previews always assume an existing stack. Guest/member and narrow preview settings are shareable URL parameters. Left/right arrow keys cycle variants. Setup and publication are simulated; copying the command writes only to the clipboard.

This cross-page comparison intentionally uses a dedicated prototype route so all placements can be reviewed together. The production pages are unchanged. Development only, no persistence, no sync execution.

Direction selected: A/C mix. Homepage refinement is ready for visual review. Once a direction is chosen, preserve this prototype on a throwaway branch and link it from the implementation issue, then implement the validated design separately.
