type MachineSight = {
  machine?: string
  receivedAt: number
  _creationTime: number
}

export type FirstSeenMachine = [
  string,
  { assignedAt: number; creationTime: number },
]

/** Sort each machine by its first server sight, independent of its name. */
export function firstSeenMachines(
  rows: readonly MachineSight[]
): FirstSeenMachine[] {
  const machines = new Map<
    string,
    { assignedAt: number; creationTime: number }
  >()
  for (const row of rows) {
    if (row.machine === undefined) continue
    const seen = machines.get(row.machine)
    if (
      !seen ||
      row.receivedAt < seen.assignedAt ||
      (row.receivedAt === seen.assignedAt &&
        row._creationTime < seen.creationTime)
    ) {
      machines.set(row.machine, {
        assignedAt: row.receivedAt,
        creationTime: row._creationTime,
      })
    }
  }
  return [...machines.entries()].sort(
    ([, a], [, b]) =>
      a.assignedAt - b.assignedAt || a.creationTime - b.creationTime
  )
}
