# Dataset structured data: the `license` field on `/leaderboard`

**Date:** 2026-10-01
**Status:** decided 2026-10-01. The owner chose CC BY 4.0. The markup declares
`https://creativecommons.org/licenses/by/4.0/` and `/leaderboard` prints the
same licence.
**Trigger:** Google Search Console reports the non-critical issue *Missing field
"license"* for the `Dataset` item "AI Stack leaderboard - measured tokens over
30 days" on `https://aistack.to/leaderboard`, first detected 2026-09-25.
**Markup source:** `src/features/leaderboard/jsonLd.ts`

Method: every page below was downloaded on 2026-10-01 and read as raw text.
Quotes are verbatim. Anything not found in a primary source is marked
**UNVERIFIED** or **INFERENCE**.

## Verdict

* `license` is a **recommended** property, not a required one. The item stays
  valid and eligible without it. Omitting it is allowed; the cost is that the
  GSC warning stays.
* Google accepts two forms: a **URL**, or a **`CreativeWork`** with `name` and
  `url`. The one rule is that the URL must pin a **specific license version**.
* The docs say nothing about data without an open license, "all rights
  reserved", or terms of use. Google's own example of the `CreativeWork` form is
  a "Custom license" at a site-owned URL, so a link to an own license/terms
  document is a documented *shape*. Whether a general terms-of-use page counts
  is **not stated**.
* The site has no terms or license page today, so there is nothing truthful to
  link yet. The choice is the owner's: pick a license for the leaderboard data,
  publish it on a page, then mark it up - or leave the field out.

## 1. What Google expects for `license`

Source: <https://developers.google.com/search/docs/appearance/structured-data/dataset>
(English, "Last updated 2026-09-08 UTC"). Listed under **Recommended
properties**:

> `license` - URL or CreativeWork
>
> A license under which the dataset is distributed. For example:
>
> ```
> "license" : "https://creativecommons.org/publicdomain/zero/1.0/"
> ```
>
> ```
> "license" : {
>   "@type": "CreativeWork",
>   "name": "Custom license",
>   "url": "https://example.com/custom_license"
> }
> ```
>
> **Additional guidelines**
>
> Provide a URL that unambiguously identifies a specific version of the license used.
>
> Recommended: `"license" : "https://creativecommons.org/licenses/by/4.0"`
>
> Not recommended: `"license" : "https://creativecommons.org/licenses/by"`

The German page GSC links to
(<https://developers.google.com/search/docs/appearance/structured-data/dataset?hl=de>,
"Zuletzt aktualisiert: 2026-09-12 (UTC)") is a translation with the same
content: "Eine Lizenz, unter der der Datensatz verbreitet wird." and "Füge eine
URL ein, die eine bestimmte Version der verwendeten Lizenz eindeutig angibt."
Same two examples, same recommended / not-recommended pair.

The same page adds one sentence of motivation: "Add `identifier`, `license`, and
`sameAs` for datasets that provide provenance and license information."

What the page does **not** say:

* It does not mention SPDX. The string "spdx" appears on neither language
  version. Google gives no list of accepted license URLs.
* It does not mention terms of use, copyright, "all rights reserved", or
  proprietary data.
* It does not say whether the deed URL or the legal-code URL is preferred. Its
  own examples use the deed URLs.

Schema.org agrees on the type. <https://schema.org/license> (V30.1, 2026-09-16):
"A license document that applies to this content, typically indicated by URL."
Expected types: `CreativeWork`, `URL`. Used on: `CreativeWork`. `Dataset`
inherits it through `CreativeWork` (<https://schema.org/Dataset>).

## 2. All Dataset properties Google supports

Source: same Google page, section "Structured data type definitions". The
leaderboard column shows what `leaderboardJsonLd()` emits, checked against the
live page on 2026-10-01.

### Required

| Property | Type | Google's rule | Leaderboard |
|---|---|---|---|
| `description` | Text | "The summary must be between 50 and 5000 characters long." May include Markdown. | present, 223 chars |
| `name` | Text | "Use unique names for distinct datasets whenever possible." | present |

### Recommended

| Property | Type | Note from the doc | Leaderboard |
|---|---|---|---|
| `alternateName` | Text | aliases, abbreviations | missing |
| `creator` | Person or Organization | use ORCID / ROR in `sameAs` to identify uniquely | present (`Organization`, `name`, `url`; no `sameAs`) |
| `citation` | Text or CreativeWork | related academic articles only, not the dataset itself | missing, not applicable |
| `funder` | Person or Organization | | missing, not applicable |
| `hasPart` or `isPartOf` | URL or Dataset | | missing |
| `identifier` | URL, Text, or PropertyValue | DOI or Compact Identifier | missing |
| `isAccessibleForFree` | Boolean | "Whether the dataset is accessible without payment." | **missing** |
| `keywords` | Text | "Keywords summarizing the dataset." | **missing** |
| `license` | URL or CreativeWork | see section 1 | **missing (the GSC issue)** |
| `measurementTechnique` | Text or URL | "proposed and pending standardization at schema.org" | present |
| `sameAs` | URL | reference page that identifies the dataset | missing |
| `spatialCoverage` | Text or Place | "Only include this property if the dataset has a spatial dimension." | missing, not applicable |
| `temporalCoverage` | Text | ISO 8601 interval, e.g. `"1950-01-01/2013-12-18"`; "Only include this property if the dataset has a temporal dimension." | present (`2026-08-29/2026-10-01`) |
| `variableMeasured` | Text or PropertyValue | "The variable that this dataset measures." Pending at schema.org. | **missing** |
| `version` | Text or Number | | missing |
| `url` | URL | "Location of a page describing the dataset." | present |
| `includedInDataCatalog` | DataCatalog | "The catalog to which the dataset belongs." | missing, not applicable |
| `distribution` | DataDownload | where to download the data, and the format | missing (no download exists) |
| `distribution.encodingFormat` | Text or URL | | missing |

`distribution.contentUrl` (URL) is **required once `distribution` is present**.

Other rules on the same page:

* "We recommend limiting all textual properties to 5000 characters or less.
  Google Dataset Search only uses the first 5000 characters of any textual
  property."
* The doc documents `mainEntity` only for `csvw:Table`. The leaderboard puts an
  `ItemList` there. Google's page neither supports nor forbids that; GSC has not
  flagged it. **UNVERIFIED** whether Google reads it.
* The page's machine-generated summary blob says "required properties
  (description, name, creator)". The property table itself lists `creator` under
  Recommended. The table is the authority; the leaderboard has `creator` either
  way.

The three bold "missing" rows besides `license` (`isAccessibleForFree`,
`keywords`, `variableMeasured`) are the cheap ones: the values are facts the
page already states. GSC reported only `license`, so adding them is optional.

## 3. Is omitting `license` acceptable?

Yes, per three Google sources:

* Dataset doc, "How to add structured data": "fix any critical errors. Consider
  also fixing any non-critical issues that may be flagged in the tool, as they
  can help improve the quality of your structured data (however, this isn't
  necessary to be eligible for rich results)."
* Dataset doc: "You must include the required properties for your content to be
  eligible for display as a rich result. You can also include the recommended
  properties to add more information about your content".
* Search Console help, rich result reports
  (<https://support.google.com/webmasters/answer/7552505?hl=en>): "A valid item
  is an item that doesn't have any critical issues and can appear on Google as a
  rich result." Non-critical issues are listed under "Improve item appearance".
* General structured data guidelines
  (<https://developers.google.com/search/docs/appearance/structured-data/sd-policies>,
  last updated 2026-07-10): "Items that are missing required properties are not
  eligible for rich results. The more recommended properties that you provide,
  the higher quality the result is to users."

Whether a missing `license` lowers ranking or filtering inside Google Dataset
Search is **UNVERIFIED** - none of these pages says so.

## 4. Data with no open license

**The docs give no guidance.** What they do establish:

1. The `CreativeWork` form exists for a license that has no well-known URL.
   Google's example is literally `"name": "Custom license"` at
   `https://example.com/custom_license`.
2. Schema.org defines the value as "a license document that applies to this
   content". **INFERENCE:** a page on aistack.to that states the terms under
   which the leaderboard data may be reused fits that definition. A general
   terms-of-use page that never mentions the data fits it poorly. No primary
   source confirms or rejects a terms-of-use page as a `license` value.
3. The markup must be true. sd-policies: "Don't use structured data to deceive
   or mislead users" and "Don't mark up content that is not visible to readers
   of the page." A license claimed in JSON-LD and stated nowhere on the site
   breaks both. State the license visibly, then mark it up.
4. Schema.org has neighbouring properties for non-license terms:
   `usageInfo` ("can reference additional information, e.g. community
   expectations on preferred linking and citation conventions, as well as
   purchasing details", <https://schema.org/usageInfo>) and
   `acquireLicensePage` (<https://schema.org/acquireLicensePage>). Google's
   Dataset page lists neither, so they will **not** clear the GSC warning.

Repo facts that bear on the choice:

* `src/routes/` has no terms, legal, or license page. There is no URL to link.
* The repo `LICENSE` is MIT. It covers the code. Whether it covers the
  published leaderboard data is the owner's call, not something the file says.
* The rows are published by each stack's owner. Whether the site may relicense
  that data under an open license is a legal question. **UNVERIFIED**, out of
  scope.

Three honest options:

| Option | Markup | Clears GSC warning | Needs |
|---|---|---|---|
| Leave it out | none | no | nothing; item stays valid |
| Own terms | `{"@type":"CreativeWork","name":"...","url":"https://aistack.to/<page>"}` | yes | a public page stating reuse terms for the data, versioned or dated so the URL pins "a specific version" |
| Open license | `"license": "<canonical URL from section 5>"` | yes | owner decision + a visible statement on `/leaderboard` |

## 5. Canonical license URLs

Creative Commons prints a "Canonical URL" block on each deed and legal-code
page. Open Data Commons and SPDX are cited for ODbL.

| License | Canonical URL | Owning source |
|---|---|---|
| CC BY 4.0 | `https://creativecommons.org/licenses/by/4.0/` | "Canonical URL" on <https://creativecommons.org/licenses/by/4.0/> (the legalcode page prints the same URL) |
| CC BY-SA 4.0 | `https://creativecommons.org/licenses/by-sa/4.0/` | "Canonical URL" on <https://creativecommons.org/licenses/by-sa/4.0/> |
| CC0 1.0 | `https://creativecommons.org/publicdomain/zero/1.0/` | "Canonical URL" on <https://creativecommons.org/publicdomain/zero/1.0/> |
| ODbL 1.0 | `https://opendatacommons.org/licenses/odbl/1-0/` | full legal text served there by Open Data Commons; `/licenses/odbl/1.0/` redirects to it |

SPDX identifiers and the URLs SPDX records in `seeAlso`
(<https://spdx.org/licenses/>, per-license JSON at
`https://spdx.org/licenses/<ID>.json`):

| SPDX id | `seeAlso` |
|---|---|
| `CC-BY-4.0` | `https://creativecommons.org/licenses/by/4.0/legalcode` |
| `CC-BY-SA-4.0` | `https://creativecommons.org/licenses/by-sa/4.0/legalcode` |
| `CC0-1.0` | `https://creativecommons.org/publicdomain/zero/1.0/legalcode` |
| `ODbL-1.0` | `http://www.opendatacommons.org/licenses/odbl/1.0/`, `https://opendatacommons.org/licenses/odbl/1-0/` |

Notes:

* Google's "recommended" example omits the trailing slash
  (`https://creativecommons.org/licenses/by/4.0`). That URL redirects to the
  slash form, which is the one Creative Commons calls canonical. Use the slash
  form. For CC0 Google's own example already has the slash.
* SPDX points at `/legalcode`; Creative Commons and Google's examples point at
  the deed root. Both pin the version, which is the only rule Google states.
  Which one Google Dataset Search normalises better is **UNVERIFIED**.
* An SPDX page URL (`https://spdx.org/licenses/CC-BY-4.0.html`) also pins a
  version. Google's doc never mentions SPDX, so its acceptance is
  **UNVERIFIED**.

## Side observation, unrelated to the license field

While fetching the live page, the first three requests to
`https://aistack.to/leaderboard` returned **HTTP 500** with the "This page
didn't load" shell and no JSON-LD. The embedded error read "Server Error -
Function execution timed out (maximum duration: 1s)". Seven later requests
returned 200 with the `Dataset` block. If Googlebot hits the cold path it sees
no structured data at all. Not investigated further.

## Sources

* Google Search Central, Dataset structured data (EN): <https://developers.google.com/search/docs/appearance/structured-data/dataset>
* Same, German: <https://developers.google.com/search/docs/appearance/structured-data/dataset?hl=de>
* Google, general structured data guidelines: <https://developers.google.com/search/docs/appearance/structured-data/sd-policies>
* Search Console help, rich result status reports: <https://support.google.com/webmasters/answer/7552505?hl=en>
* Schema.org: <https://schema.org/Dataset>, <https://schema.org/license>, <https://schema.org/usageInfo>, <https://schema.org/acquireLicensePage>
* Creative Commons: <https://creativecommons.org/licenses/by/4.0/>, <https://creativecommons.org/licenses/by-sa/4.0/>, <https://creativecommons.org/publicdomain/zero/1.0/>
* Open Data Commons: <https://opendatacommons.org/licenses/odbl/1-0/>
* SPDX license list: <https://spdx.org/licenses/>
