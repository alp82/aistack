import { cronJobs } from 'convex/server'
import { internal } from './_generated/api'

const crons = cronJobs()

// Nightly orphan icon-storage GC. Deletes blobs not referenced by any
// tools/models/bundles row that are at least 24h old.
crons.daily(
  'icon-orphan-gc',
  { hourUTC: 4, minuteUTC: 0 },
  internal.iconStorage.gcOrphans,
)

export default crons
