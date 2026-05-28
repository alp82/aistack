# TODO
* API for stacks + tools
* add github link in footer
* lazy loading upvotes fails
* og:image downloadable in profile
* og:image generation faulty
    * https://aistack.to/stacks/orcdev-u9ckco
    * logos missing
    * order wrong
* github actions security (see below)
* show real prices without sponsoring/discounts
* CLI workflow
    * uploaded files don't appear in project
    * custom instructions cards disappear after saving and even destroy next header
    * hide/ignore env sections in mcp.json
    * https://www.codacy.com/ai-inventory
    * https://github.com/dyoshikawa/rulesync
    * https://github.com/caliber-ai-org/ai-setup
    * https://github.com/FutureExcited/vibe-rules
    * npx aistack login
    * npx aistack collect
    * npx aistack create
* stacks and projects structure
    * use https://trees.software
    * project card ugly
    * nicer description cards - with remove button
    * model card: replace with other version
    * reorder tools and models
    * project back navigation more obvious
    * mermaid diagrams
* https://elio.devS
* models page
    * easy adding models
* price tiers for sibling products: claude code vs claude ai
* ai stack knowledge/learning area
    * article grid with nice bg borders: https://www.aihero.dev/posts
    * use the same editor. new feature: crosslinking articles
    * user comments - one level deep threaded
* fix tests
* e2e tests
* currency settings
* alert and logic when removing tools from sidebar
* when remove last block of one item in text, ask to also remove in sidebar? dialog
* tools in stack can be "work" -  like sponsored
* AI stack tools
    * https://x.com/hridoyreh/status/2032720794682581474
    * https://solaris.buildclub.ai
    * https://buildclub.ai
* multiple stacks per user
    * work & private
* admin for editing aliases
    * e.g. amp, opus, etc.
* og image: bigger tool icons

## one-stack-per-creator invariant — CLI silently picks first stack via getFirstStackByCreator in convex/httpCli.ts:179; should enforce server-side or surface stack-picker to user.

## resourceLinks N+1 — resolveLinkedResources does a per-link ctx.db.get; listByCreator and listProjectResourcesByStack call it per project. Batch the by_owner reads in a later perf pass.

## resources Phase 2 follow-ups (deferred from Phase 1 schema split)
* Deploy B: after running `npx convex run migrations/20260528_clear_embedded_resources:run`, remove the embedded `resources` field from `stacks` + `projects` in convex/schema.ts (distinct commit/deploy).
* updateResourceContent (convex/resources.ts) hand-rolls the by-owner + soft-delete read instead of going through resourceLinks.ts — extract `resolveLinkedResourceDocs(ctx, ownerKind, ownerId): Doc<'resources'>[]` and route both it and resolveLinkedResources through it (keep single-owner so the N+1 batching pass has one chokepoint).
* resourceLinks.ts interface widens ownerId to string + castOwnerId unchecked `as` — tighten the 3 public signatures to a discriminated union `{ownerKind:'stack', ownerId: Id<'stacks'>} | {ownerKind:'project', ownerId: Id<'projects'>}`, delete castOwnerId (schema column stays v.string()).
* Write vocab is upsert-only; Phase 3 (GitHub links) / Phase 6 (library) will likely need `unlinkResourceFromOwner(ctx, ownerKind, ownerId, stableKey)` to drop one link without deleting the shared row.

```
# GitHub Actions Audit — alp82/aistack

**Repo:** https://github.com/alp82/aistack
**Audited commit:** `2f6aa696e8ac3a0c6823b4a0e20d6e08a45bb452` (main, 2026-05-10)
**Date:** 2026-05-17
**Surface:** `.github/workflows/deploy-convex.yml`, `.github/workflows/publish-cli.yml`. No repo-root composite action. No referenced local scripts inside workflows.
**Tools:** zizmor 1.25.1, actionlint, pinact 3.9.2, historical IOC sub-agent (all-refs sweep).

---

## Summary

Two workflows. Both are reasonably minimal but share one structural weakness — **all eight third-party action references are pinned to floating tags, not commit SHAs**. Combined with the high-value secrets each workflow handles (a production SSH key, an npm publish token), this is the single exploit path worth fixing immediately: it is the literal tj-actions / reviewdog vector from March 2025.

A second concern is design rather than vulnerability: `deploy-convex.yml` does `ssh prod "pnpm i && pnpm convex deploy"`, which runs unvetted dependency install scripts directly on the production host. This is outside the CI security boundary, but it is the larger blast radius in practice.

No historical IOCs (Shai-Hulud, npmjs.help, webhook.site, s1ngularity markers, tj-actions/changed-files), no deleted/renamed workflows, no leaked secrets in git history (regex hits resolved to PNG base64 in `convex/seeds/tools.ts`), no self-hosted runners, no `pull_request_target` / `workflow_run` / `issue_comment` triggers, no expression injection sinks.

---

## High

### H1 — All third-party actions pinned to floating tags (8 occurrences)

**Pattern:** `uses: <owner>/<action>@v<N>` instead of `uses: <owner>/<action>@<40-char-sha> # vX.Y.Z`.

**Locations:**
- `.github/workflows/deploy-convex.yml:13` — `actions/checkout@v4`
- `.github/workflows/deploy-convex.yml:16` — `pnpm/action-setup@v3`
- `.github/workflows/deploy-convex.yml:21` — `actions/setup-node@v4`
- `.github/workflows/deploy-convex.yml:30` — `webfactory/ssh-agent@v0.9.0`
- `.github/workflows/publish-cli.yml:18` — `actions/checkout@v4`
- `.github/workflows/publish-cli.yml:21` — `pnpm/action-setup@v3`
- `.github/workflows/publish-cli.yml:26` — `actions/setup-node@v4`

**Why it matters:** Git tags are mutable. When the `tj-actions/changed-files` maintainer was compromised in March 2025, the attacker force-pushed the `v35`/`v44`/etc tags to point at malicious commits — and every consumer using `@v44` started running that code on its next run, with no commit, no review, no notification. The same shape applies here: anyone who compromises one of the four action owners (`actions`, `pnpm`, `webfactory`) and force-pushes a major tag can immediately:

- In `deploy-convex.yml`: read `PROD_SSH_PRIVATE_KEY`, `PROD_SSH_HOST`, `PROD_SSH_USER` from the job environment once `webfactory/ssh-agent` loads them, then SSH into the prod box. Because the ssh-agent step is followed by an `ssh` step that connects, the agent socket is live in `/tmp` and reachable from any other step in the same job. RCE on prod.
- In `publish-cli.yml`: read `NPM_TOKEN` (exported as `NODE_AUTH_TOKEN`) during the publish step, then publish a malicious version of the CLI to npm. With `--provenance` set, the malicious version even gets a Sigstore attestation, lending it false credibility. From there, Shai-Hulud-style enumeration of the maintainer's other npm packages is one API call away.

**Kill chain (publish path):** attacker compromises any of the upstream action repos (e.g. `pnpm/action-setup` maintainer account, weakest of the three) → force-pushes `v3` tag to malicious commit → next time the maintainer pushes a `cli-v*` tag → `publish-cli.yml` resolves `pnpm/action-setup@v3` to the malicious SHA → malicious step reads `process.env.NPM_TOKEN` (or the `~/.npmrc` written by `setup-node`'s registry-url config) → posts token to attacker server → attacker publishes a Trojan version of `@aistack/cli` (or whatever the package name is) → users `pnpm i -g @aistack/cli` and run preinstall RCE.

**Owner liveness:** `github.com/actions`, `github.com/pnpm`, `github.com/webfactory` all currently resolve `200`. No repojacking exposure today, but pinning to tags still means future compromise of those accounts compromises this repo.

**Fix:** SHA-pin every action with the canonical-version comment so `pinact --verify` can keep it honest. `pinact` already produced the exact substitutions; apply them as-is:

```yaml
- uses: actions/checkout@34e114876b0b11c390a56381ad16ebd13914f8d5 # v4.3.1
- uses: pnpm/action-setup@a3252b78c470c02df07e9d59298aecedc3ccdd6d # v3.0.0
- uses: actions/setup-node@49933ea5288caeca8642d1e84afbd3f7d6820020 # v4.4.0
- uses: webfactory/ssh-agent@dc588b651fe13675774614f8e6a936a468676387 # v0.9.0
```

Add a `pinact run --check --verify` step (or pre-commit hook) so new additions can't slip back to floating tags. Renovate / Dependabot can bump SHA pins on a schedule, giving you the supply-chain isolation without the manual maintenance cost.

**Source:** zizmor (`unpinned-uses`, error severity, 7 instances), pinact (--verify confirmed all upstream SHAs resolve cleanly).

**Refs:** https://github.blog/security/supply-chain-security/tj-actions-changed-files-incident/ · https://docs.github.com/en/actions/security-for-github-actions/security-guides/security-hardening-for-github-actions#using-third-party-actions

---

### H2 — Production deploy runs `pnpm i` on the prod host inside the deploy command

**Location:** `.github/workflows/deploy-convex.yml:41`

```yaml
ssh ${{ secrets.PROD_SSH_USER }}@${{ secrets.PROD_SSH_HOST }} \
  "bash -l -c 'cd ~/aistack && git pull && /root/.local/share/pnpm/pnpm i && /root/.local/share/pnpm/pnpm convex deploy'"
```

**Why it matters:** Every dependency lifecycle script (`preinstall`, `install`, `postinstall`) in the entire pnpm tree runs as **root** (`/root/.local/share/pnpm/` implies the deploy user is root, or at minimum has root-owned pnpm state) on the production box, every push to main. This is the same threat class as Shai-Hulud, qix-bundle, and chalk/debug — except instead of running in CI and stealing a publish token, it runs directly on the production host. A single compromised transitive dependency → instant prod RCE, no workflow file to audit, no CI logs to grep, no review checkpoint.

The CI workflow itself is also not running `pnpm install` with `--ignore-scripts` or with a frozen lockfile-only check before the SSH step, so even the local `pnpm install` on the runner (line 27) is exposed. But the runner is ephemeral; the prod host is not.

**Kill chain:** attacker publishes a malicious version of a tiny transitive dep (the classic `is-promise`-shaped target) → semver range in `pnpm-lock.yaml` allows the new version → maintainer runs `pnpm update` locally and pushes → CI deploys → `pnpm i` on prod runs the preinstall script → attacker has shell on the Convex host. The `git pull` step ensures the prod box pulls whatever the lockfile says, so the attacker doesn't even need to push a code change — only the lockfile bump matters.

**Fix:** Build the deployable artifact (or at minimum, `node_modules`) on the CI runner, then `rsync` it to prod and have the prod step only run `pnpm convex deploy` against the prebuilt tree. If `pnpm i` must run on prod, run it with `--frozen-lockfile --ignore-scripts` and run any required scripts only for the explicitly-vetted packages. Better yet: run Convex deploys from the runner itself, using `CONVEX_DEPLOY_KEY`, and stop SSHing into prod at all — Convex supports this natively. The current architecture forces every CI pipeline compromise into a production compromise, with no isolation.

**Source:** agent reasoning (composite design issue, no single tool flagged it).

**Refs:** https://socket.dev/blog/shai-hulud-the-npm-supply-chain-worm · https://docs.convex.dev/production/hosting/preview-deployments#using-convex_deploy_key

---

## Medium

### M1 — Default `GITHUB_TOKEN` permissions on `deploy-convex.yml`

**Location:** `.github/workflows/deploy-convex.yml:8` (no `permissions:` block at job or workflow level)

**Why it matters:** Without an explicit `permissions:` block, the job inherits the repo's default `GITHUB_TOKEN` scopes — for public repos on most orgs this is `contents: write` plus several other write scopes. The workflow doesn't need any of them: it only checks out code and SSHes out. A compromised dependency in `pnpm install` (step on line 27) running with `contents: write` can push commits or add `.github/workflows/*.yml` files to the repo, which is the Shai-Hulud lateral-movement primitive.

**Fix:** Add to the workflow (or to the job):

```yaml
permissions:
  contents: read
```

`publish-cli.yml` already does this correctly (it sets `contents: read` plus the `id-token: write` it needs for npm provenance).

**Source:** zizmor (`excessive-permissions`).

### M2 — `actions/checkout` persists credentials by default in both workflows

**Locations:** `.github/workflows/deploy-convex.yml:13`, `.github/workflows/publish-cli.yml:18`

**Why it matters:** `actions/checkout` writes `GITHUB_TOKEN` into `.git/config` of the checked-out tree by default. Any subsequent step in the same job (including `pnpm install`'s lifecycle scripts) can read it and use it to push to the repo. Once M1 is fixed (so the token is read-only), this is mitigated; until then, it stacks with M1.

**Fix:** `with: { persist-credentials: false }` on both checkouts. Cheap defense in depth even after M1.

**Source:** zizmor (`artipacked`).

### M3 — Tag-triggered publish workflow has no tag protection

**Location:** `.github/workflows/publish-cli.yml:3-6` (`on: push: tags: cli-v*`)

**Why it matters:** Anyone who can push a `cli-v*` tag to the repo can trigger an npm publish. There is no manual approval gate, no environment requirement, and (as far as the workflow surface shows) no tag-protection rule enforced via repo settings. If a maintainer's git push credentials are stolen — without the npm token being stolen — the attacker can still ship a malicious version by triggering this workflow with a crafted tag pointing at a malicious commit.

**Fix:** Either put the publish job inside a GitHub `environment:` that requires manual approval, or configure a tag-protection rule (Settings → Tags) restricting `cli-v*` to a small set of maintainers. The `id-token: write` provenance is good but does not protect against an authorized-from-GitHub's-view attacker.

**Source:** agent reasoning.

---

## Additional observations

- `cache: 'pnpm'` in `publish-cli.yml:29` triggers zizmor's `cache-poisoning` advisory (Low). The risk is theoretical here because no untrusted PR workflow writes to the same cache scope, but if you ever add a CI workflow that runs on `pull_request` and uses the same pnpm cache key, that workflow could plant a poisoned cache that this release workflow then restores from. Keep this in mind before adding any PR-triggered workflow.
- `ssh-keyscan -H ${{ secrets.PROD_SSH_HOST }}` (`deploy-convex.yml:37`) interpolates a secret into a shell command rather than passing it as an argv. Secrets aren't attacker-controlled, so this isn't a vulnerability, but the pattern is fragile — a host value containing a space or shell metacharacter would break the step in surprising ways. Prefer `ssh-keyscan -H "$HOST"` with `env: { HOST: ${{ secrets.PROD_SSH_HOST }} }`.
- The deploy workflow trusts that `~/aistack` on prod is at a clean checkout. If anyone has SSHed in and added uncommitted changes, the `git pull` will fail or merge unexpectedly. Not a security finding, just an operational papercut.
- No CodeQL, no `dependency-review-action`, no `osv-scanner` workflows on PRs. Adding one (gated to PRs from the same repo, not forks) would catch known-CVE deps before they reach the prod `pnpm i`.

---

## Categories checked, clean

`pull_request_target` / `workflow_run` / `issue_comment` triggers (none exist); script injection from `github.event.*` into `run:` blocks (none); self-hosted runners (none); GitHub OIDC to cloud roles (only npm provenance, which is appropriate); composite actions in this repo (none published); repojacking exposure on the three action owners (all live); secret leakage in git history (false-positive regex hits only — embedded PNG data URIs); deleted/renamed workflows (none); force-pushed tags (no tags exist).

---

## Priority recommendation

1. SHA-pin all third-party actions (H1) — single highest-leverage fix, ~5 minutes with the snippets above.
2. Stop running `pnpm i` on the prod host as part of deploy (H2) — architectural, but the current design routes every supply-chain incident directly into your production environment.
3. Add `permissions: contents: read` to `deploy-convex.yml` (M1) and `persist-credentials: false` on both checkouts (M2) — cheap defense-in-depth.
4. Gate `publish-cli.yml` behind a protected environment or tag-protection rule (M3).
```