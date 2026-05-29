# Handover — Project CRUD UI (#3) + Resource-mapping UX (#4)

Self-contained brief for a fresh chat. Goal: make projects and resources first-class, manageable, and intuitive in the web UI. Background lives in auto-memory `project_resources_architecture.md`; this doc is the executable part.

## Where this stands (2026-05-28)

Multi-phase initiative to fix: *projects are CLI-only and invisible after creation; resources are messy and drift out of sync.* The data model was reshaped first; the UI is next.

**Done:**
- **Phase 1 — resources table split.** Embedded `projects.resources[]` / `stacks.resources[]` arrays replaced by two Convex tables: `resources` (creator-owned: `scope` `'global'|'project'`, `type`, `name`, `description?`, `group`, `stableKey`, `files`, `source?`, `upstream?`, `deletedAt`, `shortId`) and `resourceLinks` (join: `resourceId`, `ownerKind` `'stack'|'project'`, `ownerId`, `order`, `addedAt`). Symmetric: one resource row, N links across stacks/projects. Stacks are **never** deletable; projects are.
- **#2 — single-resource unlink primitive.** `unlinkResourceFromOwner(ctx, ownerKind, ownerId, stableKey): boolean` in `convex/lib/resourceLinks.ts` + the auth-gated mutation `unlinkResource({ target: {kind,id}, stableKey })` in `convex/resources.ts`. Removes one link, soft-deletes the resource only if it was the last link. Tested (16 convex tests pass). **Zero UI consumers yet — #4 wires it.**

**Next:** #3 (Project CRUD UI), then #4 (Resource-mapping UX). #3 first because #4's "used by N" + link-picker surfaces only pay off once projects are web-managed.

## Backend foundation (already built — read before starting)

- `convex/schema.ts` — `resources` + `resourceLinks` tables. Indexes: `by_creator_stableKey`, `by_shortId`, `by_resourceId`, `by_owner (ownerKind, ownerId)`.
- `convex/lib/resourceLinks.ts` — the access seam:
  - `resolveLinkedResources(ctx, ownerKind, ownerId): Resource[]` — read-join, strips internal fields to the `Resource` shape.
  - `upsertResourcesForOwner(ctx, {creatorId, ownerKind, ownerId, items, source, defaultScope})` — merge-by-stableKey + resurrect; creates a link if missing.
  - `unlinkResourceFromOwner(...)` / `cascadeUnlinkOwner(...)` — single-link / all-links removal, both soft-delete orphans via the shared `softDeleteIfOrphaned`.
- `convex/resources.ts` — `getResourceBrowserContext({target})` returns `{ stackResources, projectResources, stackName, projectName, isOwner, isEditable, stackId }` (each resource is a full `Resource` incl. `scope`); `updateResourceContent`; `unlinkResource`.
- `convex/projects.ts` — `listByCreator` (233), `updateProject` (343), `publishProject` (381), `reorderProjects` (406), `deleteProject` (434, cascades unlinks). **No `createProject` — that's the one backend gap for #3.**

## Pending backend chores (independent of #3/#4)

- **Deploy B (not done):** the embedded `resources` field is still in `convex/schema.ts` (made optional in Phase 1). After running `npx convex run migrations/20260528_clear_embedded_resources:run`, remove it from `stacks` + `projects`. Neither feature depends on the embedded field (all reads go through `resolveLinkedResources`), but remove it to avoid confusion. Tracked in `TASKS.md`.
- **Deferred Phase-2 refinements** (`TASKS.md`): extract `resolveLinkedResourceDocs` (updateResourceContent hand-rolls a read the module should own); tighten `ownerId` to a discriminated union + delete `castOwnerId`; batch the `resolveLinkedResources` N+1. #4's "used by N" count adds reads to the same hot path — note but don't necessarily fix here.

## Feature #3 — Project CRUD UI

**Approach:** add the missing web `createProject` mutation, then surface create/edit/delete + a "my projects" list. Edit/delete/publish/reorder already exist and are reused.

**Backend gap (must build):** `createProject({ stackId?, name, description?, url?, tags? }) -> { _id, slug }`. Projects are children of stacks, so creation needs a `stackId`; resolve the caller's single stack (one-stack-per-creator today) if omitted, else error. Copy the recipe from `convex/httpCliHelpers.ts:175-188` + `convex/stacks.ts:289-303` (auth → creator → `slugifyAscii(name,'project')` + `generateUniqueShortId`, `published:false`, `source:'web'`, timestamps).

**UX decisions to confirm with the user first:**
- Where does "My Projects" live? (proposed: new `/projects` route + `Header.tsx` nav link, gated on auth)
- Create flow: modal vs inline vs route? (proposed: `Dialog` modal — name required, optional description/url/tags)
- Which stack does a web-created project attach to? (proposed: auto-resolve the creator's single stack; build `createProject` to *accept* optional `stackId` for forward-compat with multi-stack)
- Web-created projects start as drafts? (proposed: yes, like CLI)

**Files:** modify `convex/projects.ts` (+createProject), `src/components/ProjectsSection.tsx` (New Project button — NOT in-flight, safe), `src/components/Header.tsx` (nav link). Create `src/routes/projects.index.tsx` (grid backed by `listByCreator`), `src/components/projects/CreateProjectDialog.tsx`.

## Feature #4 — Resource provenance model + UX (reframed 2026-05-29)

**What it became.** The original "scope-clarity UX" framing was reshaped with the user into a resource **provenance** effort across three axes: reach (`scope`: global vs project), content-location (`storage`: `hosted` = authored/stored on-platform vs `linked` = referenced from a git repo), and repo-ownership (`owner`: a platform creator vs an external GitHub account like `mattpocock`). The point: external community resources should be recognized as external, **shared not copied per user**, and credited to their source. Split into two slices: **model (done)**, then **UI (next)**.

### Slice A — data model — DONE (2026-05-29, backend only)

As-built (see auto-memory `project_resources_architecture.md` → Shipped section for the authoritative detail):
- Single `resources` table. `creatorId`/`source` replaced by `addedBy: Id<'creators'>` + `owner: {kind:'creator',id} | {kind:'github',handle}` + `storage: 'hosted'|'linked'`. `mirrorMode` dropped. `files` now optional.
- **`upstream` presence is the sole storage discriminator**: present ⇒ linked (pure reference, NO `files`), absent ⇒ hosted (`files`, per-creator).
- Dedup branches in `upsertResourcesForOwner`: hosted → `(addedBy, stableKey)` via `by_addedBy_stableKey`; linked → GLOBAL `(repoUrl, path ?? '')` via `by_upstream`, so two creators linking the same repo path share ONE row + two links. Orphan soft-delete (table-wide link count) keeps a shared row alive until its last link drops.
- New helpers in `convex/lib/resourceLinks.ts`: `parseGithubHandle`, `resolveLinkedResourceDocs` (extracted), exported `softDeleteIfOrphaned`. Input/output validator split: `ResourceInput` (schema.ts) for args, `Resource` for returns.
- Reset, not migrate: `convex/migrations/20260529_reset_resources.ts` hard-deletes all `resources` + `resourceLinks` (tested, idempotent).
- **Operational gate before this pushes:** the new required `owner`/`addedBy`/`storage` fields make Convex reject existing rows. Clear both tables (dashboard, or temporarily `schemaValidation:false` → push → run the reset mutation → re-enable) so the schema push succeeds on empty tables.
- Known residual (logged in memory open-questions): the `by_upstream` dedup uses the raw `repoUrl` — not yet canonicalized for trailing-slash / `.git` / `git@`↔`https` variants, so URL spelling differences would fork shared rows. Normalize before it bites.

### Slice B — UI — REMAINING

Hang the original affordances off the shipped model, inside `ResourceBrowser`/`ResourceTree`:
- Origin/scope badge — `scope` (global/project) AND `owner.kind` (mine vs a GitHub handle) are both on the wire now; render monospace, sharp corners, lime per AGENTS.md.
- "Used by N builders" count — cross-creator, falls out of `by_resourceId` (links) / `by_upstream`; fold into `getResourceBrowserContext` or a dedicated query.
- Unlink action — wire the ready `unlinkResource`; confirm dialog since last-link unlink soft-deletes the shared row.
- Attach-existing + create-new — both confirmed in scope. Reintroduce the `isOwnedBy(resource, creatorId)` derived helper here (built then removed in slice A as premature — zero consumers; add it back with a real caller).
- Still display-only: no global↔project scope editing.

## CRITICAL caveats

1. **In-flight uncommitted UI work (dated 2026-05-27, instruction-grouping feature).** These are mid-change — do NOT assume committed state; reconcile before editing: `StackEditor.tsx`, `ResourcePanel.tsx`, `ResourceListItem.tsx`, `editor/AIResourceCard.tsx`, `editor/AIResourceGroup.tsx`, `editor/SlashCommandPlugin.tsx`, `features/stack-editor/components/ToolsSidebar.tsx`, `src/lib/resource-utils.ts`. **Overlap risk is narrow:** the files #3/#4 most need (`ProjectsSection.tsx`, `Header.tsx`, `resources/ResourceBrowser.tsx`, `resources/ResourceTree.tsx`, `convex/projects.ts`, `convex/resources.ts`) are mostly outside this set. Real conflict risk is concentrated in `src/lib/resource-utils.ts` (in-flight AND reused by #4 badges/picker) and `StackEditor.tsx` (if #4 adds link controls to the editor).
2. **Pre-existing test failures (NOT from this work).** 4 failing tests in `src/features/landing/__tests__/` (landing-sections) + `src/features/stack-editor/__tests__/` (editor-sections, editor-status-ui). Baseline — check/fix independently; don't let them block #3/#4.

## How to start (fresh chat)

1. Read this doc + skim the backend foundation files above.
2. Start with #3. Describe the task (project CRUD UI) — the pipeline will confirm intent, then clarify the UX decisions listed above before planning. Confirm the "My Projects" placement, create-flow shape, and stack-attachment behavior early.
3. Then #4. The unlink primitive is ready; the big decision is library-picker vs free-form.
4. Styling: no border-radius, monospace for buttons/labels, brand lime, Tailwind, Lucide. Dev app on localhost:3019 (already running).
