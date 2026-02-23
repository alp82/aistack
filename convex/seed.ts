import { internalMutation } from './_generated/server'
import { v } from 'convex/values'
import type { Id } from './_generated/dataModel'
import type { GenericMutationCtx, DataModelFromSchemaDefinition } from 'convex/server'
import type schema from './schema'
import { toolsData } from './seeds/tools'
import { creatorsData } from './seeds/creators'
import { stacksData } from './seeds/stacks'
import { bundlesData } from './seeds/bundles'
import { modelsData } from './seeds/models'

type Ctx = GenericMutationCtx<DataModelFromSchemaDefinition<typeof schema>>

async function clearTable(
  ctx: Ctx,
  table: "stacks" | "creators" | "tools" | "bundles" | "waitlist" | "models",
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
    await clearTable(ctx, "bundles");
    await clearTable(ctx, "creators");
    await clearTable(ctx, "tools");
    await clearTable(ctx, "models");

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

    // ============ BUNDLES ============
    const bundleIds: Record<string, Id<'bundles'>> = {}
    for (const bundle of bundlesData) {
      const id = await ctx.db.insert('bundles', {
        name: bundle.name,
        slug: bundle.slug,
        description: bundle.description,
        iconUrl: bundle.iconUrl,
        websiteUrl: bundle.websiteUrl,
        toolSlugs: bundle.toolSlugs,
        tiers: bundle.tiers,
        reviewStatus: bundle.reviewStatus,
        createdAt: now,
        updatedAt: now,
      })
      bundleIds[bundle.slug] = id
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
          kind: "main" | "misc";
          primaryUsageLabel: string;
          price: {
            pricingType: "fixed" | "usage" | "mixed";
            fixed?: { currency: string; amount: number; period: "month" | "year" | "one_time" };
            usage?: { unit: string; pricePerUnit: number; currency: string; notes?: string };
          };
          priceKind: "regular" | "discounted" | "bundle" | "usage_based";
          bundleSlug?: string;
          notes?: string;
        } = {
          toolId,
          tierId: sub.tierId,
          kind: sub.kind,
          primaryUsageLabel: sub.primaryUsageLabel,
          price: sub.price,
          priceKind: sub.priceKind,
        };
        const maybeBundleSlug = (sub as { bundleSlug?: string }).bundleSlug;
        const maybeNotes = (sub as { notes?: string }).notes;
        if (maybeBundleSlug) result.bundleSlug = maybeBundleSlug;
        if (maybeNotes) result.notes = maybeNotes;
        return result;
      });

      const bundleSubscriptions = (stack as { bundleSubscriptions?: Array<{ bundleSlug: string; tierId: string; notes?: string }> }).bundleSubscriptions?.map((bs) => {
        const bundleId = bundleIds[bs.bundleSlug];
        if (!bundleId) throw new Error(`Bundle not found: ${bs.bundleSlug}`);
        const result: { bundleId: Id<"bundles">; tierId: string; notes?: string } = {
          bundleId,
          tierId: bs.tierId,
        };
        if (bs.notes) result.notes = bs.notes;
        return result;
      });

      // Get creator name for stack name
      const creatorDoc = await ctx.db.get(creatorId);
      const creatorName = creatorDoc?.name ?? 'Unknown';
      
      const id = await ctx.db.insert('stacks', {
        name: `${creatorName}'s Stack`,
        slug: stack.slug,
        creatorId,
        oneLiner: stack.oneLiner,
        description: (stack as { description?: string }).description,
        instructions: (stack as { instructions?: Array<{ type: 'prompt' | 'rule' | 'skill' | 'mcp' | 'plugin' | 'subagent'; name: string; description?: string; content?: string; url?: string; trigger?: string }> }).instructions,
        teamSize: stack.teamSize,
        toolSubscriptions,
        bundleSubscriptions,
        fixedTotal: stack.fixedTotal,
        usageTotalNotes: stack.usageTotalNotes,
        hasUsageComponent: stack.hasUsageComponent,
        published: true,
        createdAt: now,
        updatedAt: now,
      })
      stackIds[stack.slug] = id
    }

    // ============ MODELS ============
    const modelIds: Record<string, Id<'models'>> = {}
    for (const model of modelsData) {
      const id = await ctx.db.insert('models', {
        ...model,
        createdAt: now,
        updatedAt: now,
      })
      modelIds[model.slug] = id
    }

    console.log('Seed completed successfully!')
    console.log(`Created ${Object.keys(toolIds).length} tools`)
    console.log(`Created ${Object.keys(bundleIds).length} bundles`)
    console.log(`Created ${Object.keys(creatorIds).length} creators`)
    console.log(`Created ${Object.keys(stackIds).length} stacks`)
    console.log(`Created ${Object.keys(modelIds).length} models`)

    return null
  },
})
