import { mutation, query } from './_generated/server'
import { v } from 'convex/values'

export const joinWaitlist = mutation({
  args: {
    email: v.string(),
    source: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Check if email already exists
    const existing = await ctx.db
      .query('waitlist')
      .withIndex('by_email', (q) => q.eq('email', args.email.toLowerCase()))
      .first()
    
    if (existing) {
      throw new Error('Email already registered for waitlist')
    }

    // Add to waitlist with null userId for email submissions
    const waitlistId = await ctx.db.insert('waitlist', {
      email: args.email.toLowerCase(),
      userId: undefined,
      provider: 'email',
      status: 'pending',
      joinedAt: Date.now(),
      source: args.source,
    })

    return waitlistId
  },
})

export const joinWaitlistWithAuth = mutation({
  args: {
    source: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Get current authenticated user
    const user = await ctx.auth.getUserIdentity()
    if (!user) {
      throw new Error('User not authenticated')
    }

    // Extract a cleaner user ID from the tokenIdentifier
    // The format is "http://127.0.0.1:3211|token", we want just the token part
    const cleanUserId = user.tokenIdentifier.split('|')[1]

    // Check if user already exists
    const existing = await ctx.db
      .query('waitlist')
      .withIndex('by_userId', (q) => q.eq('userId', cleanUserId))
      .first()
    
    if (existing) {
      throw new Error('User already on waitlist')
    }

    // Add to waitlist
    const waitlistId = await ctx.db.insert('waitlist', {
      email: user.email!,
      userId: cleanUserId,
      provider: 'google',
      status: 'registered',
      joinedAt: Date.now(),
      source: args.source,
    })

    return waitlistId
  },
})

export const getWaitlistStatus = query({
  args: {
    email: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    if (!args.email) {
      // Check for authenticated user
      const user = await ctx.auth.getUserIdentity()
      if (!user) return null
      
      // Extract clean user ID
      const cleanUserId = user.tokenIdentifier.split('|')[1]
      
      return await ctx.db
        .query('waitlist')
        .withIndex('by_userId', (q) => q.eq('userId', cleanUserId))
        .first()
    }

    // Check by email
    return await ctx.db
      .query('waitlist')
      .withIndex('by_email', (q) => q.eq('email', args.email!.toLowerCase()))
      .first()
  },
})

export const getWaitlistCount = query({
  args: {},
  handler: async (ctx) => {
    const waitlist = await ctx.db
      .query('waitlist')
      .collect()
    
    return waitlist.length
  },
})
