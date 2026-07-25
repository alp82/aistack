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

// Hourly rate-limit table cleanup. Deletes expired apiRateLimits rows to
// prevent unbounded table growth.
crons.interval(
  'rate-limit-cleanup',
  { hours: 1 },
  internal.rateLimit.cleanupExpiredRateLimits,
)

// Nightly measured-snapshot downsample. Keeps every snapshot from the last 90
// days and only the last of each UTC day beyond that, never deleting a stack's
// newest row. See convex/measured.ts gcSnapshots for why downsampling beats a
// hard expiry: the P1 live-stats map inherits this table as a time series.
crons.daily(
  'measured-snapshot-gc',
  { hourUTC: 4, minuteUTC: 30 },
  internal.measured.gcSnapshots,
)

export default crons
