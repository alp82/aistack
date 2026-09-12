import { execFileSync } from 'node:child_process'
import { setTimeout } from 'node:timers/promises'
import { rendererReady } from './lib/discordRegistration.ts'

const { EXPECTED_COMMIT, DISCORD_RENDER_ORIGIN } = process.env
if (!EXPECTED_COMMIT || !DISCORD_RENDER_ORIGIN) throw new Error('Set EXPECTED_COMMIT and DISCORD_RENDER_ORIGIN')
let ready = false
const deadline = Date.now() + 20 * 60_000
for (let attempt = 0; Date.now() < deadline; attempt++) {
  if (attempt % 6 === 0 && execFileSync('git', ['ls-remote', 'origin', 'refs/heads/main'], { encoding: 'utf8' }).split('\t')[0] !== EXPECTED_COMMIT) {
    console.log('A newer main revision superseded this renderer wait.')
    process.exit(0)
  }
  if (await rendererReady(DISCORD_RENDER_ORIGIN, EXPECTED_COMMIT)) { ready = true; break }
  if (attempt % 6 === 0) console.log('Waiting for Coolify to deploy the matching renderer revision...')
  await setTimeout(Math.min(10_000, Math.max(0, deadline - Date.now())))
}
if (!ready) throw new Error('Matching Coolify renderer did not become ready within 20 minutes; no commands were registered')
console.log(`Renderer ready at ${EXPECTED_COMMIT}`)
