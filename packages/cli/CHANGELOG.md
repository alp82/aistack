# Changelog

## [0.19.1](https://github.com/alp82/aistack/compare/cli-v0.19.0...cli-v0.19.1) (2026-09-24)


### Bug Fixes

* **cli:** show the running version in every command's banner ([#482](https://github.com/alp82/aistack/issues/482)) ([21f508a](https://github.com/alp82/aistack/commit/21f508a4c512af0ae6b646e058acd7be60ca60eb))

## [0.19.0](https://github.com/alp82/aistack/compare/cli-v0.18.1...cli-v0.19.0) (2026-09-24)


### Features

* **cli:** measure token waste per cache lifetime and rate findings by spend ([#480](https://github.com/alp82/aistack/issues/480)) ([a2b6cc0](https://github.com/alp82/aistack/commit/a2b6cc09456ebe2639044026efb1de6fe50accc5))

## [0.18.1](https://github.com/alp82/aistack/compare/cli-v0.18.0...cli-v0.18.1) (2026-09-23)


### Bug Fixes

* **cli:** mark partial syncs per harness so complete readings replace stored days ([#478](https://github.com/alp82/aistack/issues/478)) ([128b87c](https://github.com/alp82/aistack/commit/128b87c75cbb05e569b9e747f9b7722860c8c1c0))

## [0.18.0](https://github.com/alp82/aistack/compare/cli-v0.17.0...cli-v0.18.0) (2026-09-23)


### Features

* **cli:** shorten the sync gate and say what never leaves the machine ([#476](https://github.com/alp82/aistack/issues/476)) ([770e05e](https://github.com/alp82/aistack/commit/770e05e59d218513f4939cd12408f2d520ab2dc1))

## [0.17.0](https://github.com/alp82/aistack/compare/cli-v0.16.11...cli-v0.17.0) (2026-09-23)


### Features

* **cli:** publish token-efficiency atoms (v4) and show the owner their findings ([#474](https://github.com/alp82/aistack/issues/474)) ([fc465f6](https://github.com/alp82/aistack/commit/fc465f6173229f3cd211709d1a7164a716565fb1))

## [0.16.11](https://github.com/alp82/aistack/compare/cli-v0.16.10...cli-v0.16.11) (2026-09-16)


### Bug Fixes

* **cli:** keep large-history syncs reliable and reduce repeated reads ([#459](https://github.com/alp82/aistack/issues/459)) ([b9a7734](https://github.com/alp82/aistack/commit/b9a7734f0b98b729909846e82a8dca325a00abbd))

## [0.16.10](https://github.com/alp82/aistack/compare/cli-v0.16.9...cli-v0.16.10) (2026-09-15)


### Bug Fixes

* **cli:** read Cursor history in bounded memory, off the bubble range, and only when changed ([#450](https://github.com/alp82/aistack/issues/450)) ([d15f61b](https://github.com/alp82/aistack/commit/d15f61b07b910b8b13aefacd81cd7c5147f1f20c))

## [0.16.9](https://github.com/alp82/aistack/compare/cli-v0.16.8...cli-v0.16.9) (2026-09-15)


### Bug Fixes

* **cli:** read a large Cursor database to the end ([#446](https://github.com/alp82/aistack/issues/446)) ([cb643ce](https://github.com/alp82/aistack/commit/cb643ceea1b8326461d02b8d8585a27bc3545da0))

## [0.16.8](https://github.com/alp82/aistack/compare/cli-v0.16.7...cli-v0.16.8) (2026-09-15)


### Bug Fixes

* **cli:** recover large sync reads and reduce Git diff work ([#439](https://github.com/alp82/aistack/issues/439)) ([8af839f](https://github.com/alp82/aistack/commit/8af839f9bae64c5a46b352860ec1803b0aa7b8f8))

## [0.16.7](https://github.com/alp82/aistack/compare/cli-v0.16.6...cli-v0.16.7) (2026-09-14)


### Bug Fixes

* **cli:** publish partial daily usage without losing stored evidence ([#433](https://github.com/alp82/aistack/issues/433)) ([c969bba](https://github.com/alp82/aistack/commit/c969bbac9c1d524e61f5d220c348afa01de3c177))

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
