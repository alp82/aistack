import { internalMutation } from './_generated/server'
import { v } from 'convex/values'
import type { Id } from './_generated/dataModel'
import type { GenericMutationCtx, DataModelFromSchemaDefinition } from 'convex/server'
import type schema from './schema'
import { toolsData } from './seeds/tools'
import { creatorsData } from './seeds/creators'
import { stacksData } from './seeds/stacks'

type Ctx = GenericMutationCtx<DataModelFromSchemaDefinition<typeof schema>>

async function clearTable(
  ctx: Ctx,
  table: "stacks" | "creators" | "tools" | "waitlist",
) {
  const docs = await ctx.db.query(table).collect();
  for (const doc of docs) {
    await ctx.db.delete(doc._id);
  }
}

export const seedAll = internalMutation({
  args: {},
  returns: v.null(),
  handler: async (ctx) => {
    const now = Date.now()

    await clearTable(ctx, "stacks");
    await clearTable(ctx, "creators");
    await clearTable(ctx, "tools");

    // ============ TOOLS ============
    const toolIds: Record<string, Id<'tools'>> = {}
    for (const tool of toolsData) {
      const id = await ctx.db.insert('tools', {
        ...tool,
        createdAt: now,
        updatedAt: now,
      })
      toolIds[tool.slug] = id
    }

    // ============ CREATORS ============
    const creatorIds: Record<string, Id<'creators'>> = {}
    for (const creator of creatorsData) {
      const id = await ctx.db.insert('creators', {
        ...creator,
        createdAt: now,
      })
      creatorIds[creator.slug] = id
    }

    // ============ STACKS ============
    const stackIds: Record<string, Id<'stacks'>> = {}
    for (const stack of stacksData) {
      const creatorId = creatorIds[stack.creatorSlug]
      if (!creatorId) continue

      const toolSubscriptions = stack.toolSubscriptions.map((sub) => {
        const toolId = toolIds[sub.toolSlug];
        if (!toolId) throw new Error(`Tool not found: ${sub.toolSlug}`);

        const result: {
          toolId: Id<"tools">;
          tierId?: string;
          primaryUsageLabel: string;
          price: {
            pricingType: "fixed" | "usage" | "mixed";
            fixed?: { currency: string; amount: number; period: "month" | "year" | "one_time" };
            usage?: { unit: string; pricePerUnit: number; currency: string; notes?: string };
          };
          priceKind: "regular" | "discounted" | "bundle" | "usage_based";
          bundleName?: string;
          notes?: string;
        } = {
          toolId,
          tierId: sub.tierId,
          primaryUsageLabel: sub.primaryUsageLabel,
          price: sub.price,
          priceKind: sub.priceKind,
        };
        const maybeBundleName = (sub as { bundleName?: string }).bundleName;
        const maybeNotes = (sub as { notes?: string }).notes;
        if (maybeBundleName) result.bundleName = maybeBundleName;
        if (maybeNotes) result.notes = maybeNotes;
        return result;
      });

      const id = await ctx.db.insert('stacks', {
        slug: stack.slug,
        creatorId,
        oneLiner: stack.oneLiner,
        description: (stack as { description?: string }).description,
        stackUrl: (stack as { stackUrl?: string }).stackUrl,
        prompts: (stack as { prompts?: number }).prompts,
        rules: (stack as { rules?: number }).rules,
        skills: (stack as { skills?: number }).skills,
        mcps: (stack as { mcps?: number }).mcps,
        resources: (stack as { resources?: Array<{ label: string; url: string }> }).resources,
        teamSize: stack.teamSize,
        toolSubscriptions,
        fixedTotal: stack.fixedTotal,
        usageTotalNotes: stack.usageTotalNotes,
        hasUsageComponent: stack.hasUsageComponent,
        published: true,
        createdAt: now,
        updatedAt: now,
        bundleCosts: stack.bundleCosts,
      })
      stackIds[stack.slug] = id
    }

    console.log('Seed completed successfully!')
    console.log(`Created ${Object.keys(toolIds).length} tools`)
    console.log(`Created ${Object.keys(creatorIds).length} creators`)
    console.log(`Created ${Object.keys(stackIds).length} stacks`)

    return null
  },
})
