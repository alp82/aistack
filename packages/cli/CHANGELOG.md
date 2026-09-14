# Changelog

## [0.16.6](https://github.com/alp82/aistack/compare/cli-v0.16.5...cli-v0.16.6) (2026-09-14)


### Bug Fixes

* **cli:** avoid broken-pipe race in detached hook validation ([#431](https://github.com/alp82/aistack/issues/431)) ([8d5ec72](https://github.com/alp82/aistack/commit/8d5ec72171fdda24dd5ca82e6765a757feaac2b9))

## [0.16.5](https://github.com/alp82/aistack/compare/cli-v0.16.4...cli-v0.16.5) (2026-09-14)


### Bug Fixes

* **cli:** recover large history scans and improve verbose diagnostics ([#429](https://github.com/alp82/aistack/issues/429)) ([b1cc286](https://github.com/alp82/aistack/commit/b1cc28614c1823535dab45da9928f687e6c428fc))

## [0.16.4](https://github.com/alp82/aistack/compare/cli-v0.16.3...cli-v0.16.4) (2026-09-14)


### Bug Fixes

* **cli:** read each Git repository once and skip diffs of megabyte blobs ([#427](https://github.com/alp82/aistack/issues/427)) ([cf8b1d4](https://github.com/alp82/aistack/commit/cf8b1d4ec6dfbcfdd9f33d64121fac626d046a44))

## [0.16.3](https://github.com/alp82/aistack/compare/cli-v0.16.2...cli-v0.16.3) (2026-09-14)


### Bug Fixes

* **cli:** stop the Cursor read from scanning the whole database per page ([#425](https://github.com/alp82/aistack/issues/425)) ([217ec62](https://github.com/alp82/aistack/commit/217ec626669e534e7cebf650f37bb01bdd314524))

## [0.16.2](https://github.com/alp82/aistack/compare/cli-v0.16.1...cli-v0.16.2) (2026-09-12)


### Bug Fixes

* **cli:** add sync --verbose and read Cursor history once per sync ([#420](https://github.com/alp82/aistack/issues/420)) ([2b5a1dc](https://github.com/alp82/aistack/commit/2b5a1dc29d6356fd4d8d49ea458252460dbc039f))
* **cli:** scan every harness at once and draw a live board with progress bars ([#424](https://github.com/alp82/aistack/issues/424)) ([4601dd2](https://github.com/alp82/aistack/commit/4601dd26a3620eb9e5766038a736ee13799a3921))

## [0.16.1](https://github.com/alp82/aistack/compare/cli-v0.16.0...cli-v0.16.1) (2026-09-11)


### Bug Fixes

* **cli:** bound sync startup requests and clarify progress ([#406](https://github.com/alp82/aistack/issues/406)) ([82bb957](https://github.com/alp82/aistack/commit/82bb957980cb31df10c7448e5d032d282fc1449f))

## [0.16.0](https://github.com/alp82/aistack/compare/cli-v0.15.0...cli-v0.16.0) (2026-09-10)


### Features

* **cli:** collect Grok context maps from retained inference logs ([#397](https://github.com/alp82/aistack/issues/397)) ([982c2ae](https://github.com/alp82/aistack/commit/982c2aeb79ac3e917d6b7e00eeafc483d5759b3c))

## [0.15.0](https://github.com/alp82/aistack/compare/cli-v0.14.0...cli-v0.15.0) (2026-09-10)


### Features

* **cli:** add Cursor sync and measured statistics ([#395](https://github.com/alp82/aistack/issues/395)) ([d402ef9](https://github.com/alp82/aistack/commit/d402ef99173134126cbfd77f4eae3e58f7e852db))

## [0.14.0](https://github.com/alp82/aistack/compare/cli-v0.13.0...cli-v0.14.0) (2026-09-10)


### Features

* **cli:** add Grok Build session auto-sync ([7e6e4e2](https://github.com/alp82/aistack/commit/7e6e4e2ec2fd996f348516e217a5f943b9a5c13f))
* **cli:** collect Grok Build usage safely ([c6d7b10](https://github.com/alp82/aistack/commit/c6d7b105b6c96816a8f2942efac19bda4377a060))
* **cli:** integrate Grok Build pricing and catalog ([75366dc](https://github.com/alp82/aistack/commit/75366dcecef10279c8d3edb06cdcf885d650f41d))
* **cli:** measure Grok Build workflow and inventory ([5fb8378](https://github.com/alp82/aistack/commit/5fb8378446b126f37c560f764a66590a9d93026c))

Grok Build support was validated with automated and synthetic coverage before release. Paid end-to-end sync and native SessionStart checks on Linux, macOS, and Windows remain unrun because the maintainer does not have a subscription. Subscribed users are invited to report their sync and SessionStart results.

## [0.13.0](https://github.com/alp82/aistack/compare/cli-v0.12.4...cli-v0.13.0) (2026-09-07)


### Features

* **cli:** measure per-call context and fold a Context reading ([#361](https://github.com/alp82/aistack/issues/361)) ([faa5367](https://github.com/alp82/aistack/commit/faa5367748cb199a843489bef6c30dc04290dd28)), closes [#358](https://github.com/alp82/aistack/issues/358)
