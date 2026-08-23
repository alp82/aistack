#!/usr/bin/env node
// PROTOTYPE (alp82/aistack#212). Throwaway code, not production.
//
// Runs the page script against a stub document, so a reference error in a
// variant fails here instead of on the operator's phone. It renders every
// surface and variant, publishes the whole waiting set through each act, and
// checks the public page picks the items up.
//
// Run: node smoke.mjs

import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import vm from 'node:vm'

const HERE = dirname(fileURLToPath(import.meta.url))
const html = readFileSync(join(HERE, 'index.html'), 'utf8')
const script = html.match(/<script>([\s\S]*?)<\/script>/)[1]

const nodes = {}
const stubNode = (id) => (nodes[id] ??= { id, innerHTML: '', scrollIntoView() {} })
const sandbox = {
  document: {
    getElementById: stubNode,
    addEventListener() {},
  },
  window: { scrollTo() {} },
  console,
}
const ctx = vm.createContext(sandbox)
vm.runInContext(`${script}\nglobalThis.__state = state; globalThis.__render = render; globalThis.__pending = pending; globalThis.__publish = publish; globalThis.__data = DATA;`, ctx)

const { __state: state, __render: render, __pending: pendingFn, __data: DATA } = sandbox

const fails = []
const check = (ok, what) => {
  if (!ok) fails.push(what)
  console.log(`${ok ? 'ok  ' : 'FAIL'} ${what}`)
}

// The model surface, which is what the page opens on.
state.surface = 'model'
render()
check(/approval alone publishes nothing/i.test(nodes.surface.innerHTML), 'the model surface states what approve does')
check(/Knowledge base/.test(nodes.surface.innerHTML), 'the model surface names both projections')

// Every surface and variant renders something.
for (const surface of ['admin', 'public']) {
  for (const variant of ['A', 'B', 'C']) {
    state.surface = surface
    if (surface === 'admin') state.act = variant
    else state.page = variant
    render()
    const out = nodes.surface.innerHTML
    check(out.length > 2000, `${surface} ${variant} renders (${out.length} chars)`)
    check(!/undefined|\[object Object\]/.test(out), `${surface} ${variant} has no undefined in the markup`)
  }
}

// The topic drill-in of page A.
state.surface = 'public'
state.page = 'A'
state.openTopic = 'coding-agents'
render()
check(/All topics/.test(nodes.surface.innerHTML), 'page A drills into a topic')
state.openTopic = null

// Every published item shows up on page B unfiltered.
state.page = 'B'
render()
const shown = (nodes.surface.innerHTML.match(/<article class="entry">/g) ?? []).length
check(shown === state.published.size, `page B shows all ${state.published.size} public items (saw ${shown})`)

// The compact release strip removes the release entries and adds one strip.
state.compactReleases = true
render()
const compacted = (nodes.surface.innerHTML.match(/<article class="entry">/g) ?? []).length
check(compacted < shown, `compact releases collapses rows (${shown} -> ${compacted})`)
check(/releases-strip/.test(nodes.surface.innerHTML), 'compact releases renders the strip')
state.compactReleases = false

// The cc-by body and its attribution are on the page.
state.page = 'C'
render()
check(/CC BY 4.0/.test(nodes.surface.innerHTML), 'the cc-by attribution renders')
check(/opencode contributors, MIT/.test(nodes.surface.innerHTML), 'the MIT release-notes notice renders')

// Publishing the whole waiting set empties it and fills the public page.
const before = state.published.size
const waiting = pendingFn().filter((i) => i.summary)
sandbox.__publish(waiting.map((i) => i.id), 'smoke')
check(state.published.size === before + waiting.length, `publishing ${waiting.length} items lands them public`)
check(pendingFn().length === 1, 'the one undrafted item is still waiting')

// The X embed reaches the page once its item is public, and no script tag
// rides along with it.
render()
check(/twitter-tweet/.test(nodes.surface.innerHTML), 'the X embed renders on the public page')
check(!/<script/i.test(nodes.surface.innerHTML), 'no script tag reaches the public page')

// The undrafted item never reaches the public page through any act.
const undrafted = DATA.items.find((i) => !i.summary)
check(!state.published.has(undrafted.id), `the undrafted item (${undrafted.id}) stays private`)

console.log(fails.length ? `\n${fails.length} FAILED` : '\nall checks passed')
process.exit(fails.length ? 1 : 0)
