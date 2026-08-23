#!/usr/bin/env node
// PROTOTYPE (alp82/aistack#212). Throwaway code, not production.
//
// Picks the curated stream out of collected.json by headline prefix, and
// prints each pick with a page extract to draft a summary from. The picks
// themselves live in picks.json, so the selection is a data file and not a
// number in a script.
//
// Run: node pick.mjs           -> prints id, source, license, extract
//      node pick.mjs --check   -> prints only the picks that matched nothing

import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const HERE = dirname(fileURLToPath(import.meta.url))
const { items } = JSON.parse(readFileSync(join(HERE, 'collected.json'), 'utf8'))
const picks = JSON.parse(readFileSync(join(HERE, 'picks.json'), 'utf8'))
const checkOnly = process.argv.includes('--check')

const missing = []
for (const p of picks) {
  const found = items.find(
    (i) =>
      i.sourceId === p.sourceId &&
      (p.headline ? i.headline === p.headline : i.headline.startsWith(p.headlineStartsWith))
  )
  if (!found) {
    missing.push(p)
    continue
  }
  if (checkOnly) continue
  console.log(`\n### ${p.id} | ${found.sourceId} | ${found.licenseClass} | ${found.publishedAt.slice(0, 10)}`)
  console.log(found.headline)
  console.log(found.url)
  if (found.hnPoints) console.log(`hn: ${found.hnPoints} points, ${found.hnComments} comments`)
  console.log((found.extract || '(no extract)').slice(0, 900))
}

if (missing.length) {
  console.log(`\nMISSING ${missing.length}:`)
  for (const p of missing) console.log(`  ${p.sourceId} :: ${p.headlineStartsWith}`)
} else if (checkOnly) {
  console.log(`all ${picks.length} picks matched`)
}
