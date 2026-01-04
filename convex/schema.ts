import { defineSchema, defineTable } from 'convex/server'
import { v } from 'convex/values'

export default defineSchema({
  products: defineTable({
    title: v.string(),
    imageId: v.string(),
    price: v.number(),
  }),
  todos: defineTable({
    text: v.string(),
    completed: v.boolean(),
  }),
  waitlist: defineTable({
    email: v.string(),
    userId: v.optional(v.string()),
    provider: v.union(v.literal('email'), v.literal('google')),
    status: v.union(v.literal('pending'), v.literal('registered')),
    joinedAt: v.number(),
    source: v.optional(v.string()),
  })
    .index('by_email', ['email'])
    .index('by_userId', ['userId'])
    .index('by_status', ['status']),
})
