/** Public profile order, also used when Discord selects a creator's first stack. */
export function orderCreatorStacks<
  T extends { updatedAt: number; _id: string },
>(stacks: T[]): T[] {
  return [...stacks].sort(
    (a, b) => b.updatedAt - a.updatedAt || a._id.localeCompare(b._id),
  )
}
