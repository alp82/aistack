import { internalMutation, internalQuery } from "../../_generated/server";
import { v } from "convex/values";

/**
 * Get counts of stacks that may need description migration
 */
export const getStackCounts = internalQuery({
	args: {},
	returns: v.object({
		total: v.number(),
		withDescription: v.number(),
		withLegacyBlocks: v.number(),
	}),
	handler: async (ctx) => {
		const stacks = await ctx.db.query("stacks").collect();
		let withDescription = 0;
		let withLegacyBlocks = 0;

		for (const stack of stacks) {
			if (stack.description && stack.description.trim()) {
				withDescription++;
				// Check for legacy blocks that have iconurl attributes
				if (
					stack.description.includes("iconurl=") ||
					stack.description.includes('iconUrl="') ||
					stack.description.includes("data-tool-id=") ||
					stack.description.includes("data-model-id=") ||
					stack.description.includes("data-bundle-id=")
				) {
					withLegacyBlocks++;
				}
			}
		}

		return {
			total: stacks.length,
			withDescription,
			withLegacyBlocks,
		};
	},
});

/**
 * Build lookup maps for name -> shortId
 */
async function buildLookupMaps(ctx: { db: any }) {
	const tools = await ctx.db.query("tools").collect();
	const models = await ctx.db.query("models").collect();
	const bundles = await ctx.db.query("bundles").collect();

	const toolMap = new Map<string, string>();
	const modelMap = new Map<string, string>();
	const bundleMap = new Map<string, string>();

	for (const tool of tools) {
		if (tool.shortId) {
			toolMap.set(tool.name.toLowerCase(), tool.shortId);
			// Also map by slug for fallback
			toolMap.set(tool.slug.toLowerCase(), tool.shortId);
		}
	}

	for (const model of models) {
		if (model.shortId) {
			modelMap.set(model.name.toLowerCase(), model.shortId);
			modelMap.set(model.slug.toLowerCase(), model.shortId);
		}
	}

	for (const bundle of bundles) {
		if (bundle.shortId) {
			bundleMap.set(bundle.name.toLowerCase(), bundle.shortId);
			bundleMap.set(bundle.slug.toLowerCase(), bundle.shortId);
		}
	}

	return { toolMap, modelMap, bundleMap };
}

/**
 * Migrate a single stack's description to use shortId references
 */
function migrateDescription(
	description: string,
	toolMap: Map<string, string>,
	modelMap: Map<string, string>,
	bundleMap: Map<string, string>,
): { migrated: string; changes: number } {
	let result = description;
	let changes = 0;

	// Migrate tool blocks
	// Pattern: <span data-ai-tool-block ... data-tool-name="Name" ... iconurl="...">Name</span>
	// Or: <span ... data-ai-tool-block ... >Name</span>
	result = result.replace(
		/<span([^>]*data-ai-tool-block[^>]*)>([^<]+)<\/span>/gi,
		(_match, attrs, name) => {
			const trimmedName = name.trim();
			const shortId = toolMap.get(trimmedName.toLowerCase());

			if (!shortId) {
				// Can't find shortId, leave as-is but clean up iconurl
				const cleanedAttrs = attrs
					.replace(/\s*iconurl="[^"]*"/gi, "")
					.replace(/\s*data-tool-id="[^"]*"/gi, "");
				return `<span${cleanedAttrs}>${trimmedName}</span>`;
			}

			changes++;
			// Build clean attributes with shortId
			return `<span data-ai-tool-block="" data-short-id="${shortId}" data-tool-name="${trimmedName}">${trimmedName}</span>`;
		},
	);

	// Migrate model blocks
	result = result.replace(
		/<span([^>]*data-ai-model-block[^>]*)>([^<]+)<\/span>/gi,
		(_match, attrs, name) => {
			const trimmedName = name.trim();
			const shortId = modelMap.get(trimmedName.toLowerCase());

			// Extract provider if present
			const providerMatch = attrs.match(/data-model-provider="([^"]*)"/i);
			const provider = providerMatch ? providerMatch[1] : "";

			if (!shortId) {
				const cleanedAttrs = attrs
					.replace(/\s*iconurl="[^"]*"/gi, "")
					.replace(/\s*data-model-id="[^"]*"/gi, "");
				return `<span${cleanedAttrs}>${trimmedName}</span>`;
			}

			changes++;
			return `<span data-ai-model-block="" data-short-id="${shortId}" data-model-name="${trimmedName}" data-model-provider="${provider}">${trimmedName}</span>`;
		},
	);

	// Migrate bundle blocks
	result = result.replace(
		/<span([^>]*data-ai-bundle-block[^>]*)>([^<]+)<\/span>/gi,
		(_match, attrs, name) => {
			const trimmedName = name.trim();
			const shortId = bundleMap.get(trimmedName.toLowerCase());

			if (!shortId) {
				const cleanedAttrs = attrs
					.replace(/\s*iconurl="[^"]*"/gi, "")
					.replace(/\s*data-bundle-id="[^"]*"/gi, "");
				return `<span${cleanedAttrs}>${trimmedName}</span>`;
			}

			changes++;
			return `<span data-ai-bundle-block="" data-short-id="${shortId}" data-bundle-name="${trimmedName}">${trimmedName}</span>`;
		},
	);

	return { migrated: result, changes };
}

/**
 * Preview migration for a specific stack (doesn't save changes)
 */
export const previewStackMigration = internalQuery({
	args: { stackId: v.id("stacks") },
	returns: v.object({
		stackName: v.string(),
		originalLength: v.number(),
		migratedLength: v.number(),
		changes: v.number(),
		original: v.string(),
		migrated: v.string(),
	}),
	handler: async (ctx, args) => {
		const stack = await ctx.db.get(args.stackId);
		if (!stack) {
			throw new Error("Stack not found");
		}

		const { toolMap, modelMap, bundleMap } = await buildLookupMaps(ctx);
		const description = stack.description || "";
		const { migrated, changes } = migrateDescription(description, toolMap, modelMap, bundleMap);

		return {
			stackName: stack.name,
			originalLength: description.length,
			migratedLength: migrated.length,
			changes,
			original: description.substring(0, 2000), // Truncate for preview
			migrated: migrated.substring(0, 2000),
		};
	},
});

/**
 * Migrate all stack descriptions to use shortId references
 */
export const migrateAllStackDescriptions = internalMutation({
	args: {},
	returns: v.object({
		total: v.number(),
		migrated: v.number(),
		skipped: v.number(),
		totalChanges: v.number(),
		bytesSaved: v.number(),
	}),
	handler: async (ctx) => {
		const { toolMap, modelMap, bundleMap } = await buildLookupMaps(ctx);
		const stacks = await ctx.db.query("stacks").collect();

		let migrated = 0;
		let skipped = 0;
		let totalChanges = 0;
		let bytesSaved = 0;

		for (const stack of stacks) {
			if (!stack.description || !stack.description.trim()) {
				skipped++;
				continue;
			}

			const originalLength = stack.description.length;
			const { migrated: newDescription, changes } = migrateDescription(
				stack.description,
				toolMap,
				modelMap,
				bundleMap,
			);

			if (changes > 0) {
				await ctx.db.patch(stack._id, { description: newDescription });
				migrated++;
				totalChanges += changes;
				bytesSaved += originalLength - newDescription.length;
			} else {
				skipped++;
			}
		}

		return {
			total: stacks.length,
			migrated,
			skipped,
			totalChanges,
			bytesSaved,
		};
	},
});

/**
 * Dry run: preview what would be migrated without making changes
 */
export const dryRunMigration = internalQuery({
	args: {},
	returns: v.object({
		total: v.number(),
		wouldMigrate: v.number(),
		wouldSkip: v.number(),
		estimatedChanges: v.number(),
		estimatedBytesSaved: v.number(),
		samples: v.array(
			v.object({
				stackId: v.id("stacks"),
				stackName: v.string(),
				changes: v.number(),
				bytesSaved: v.number(),
			}),
		),
	}),
	handler: async (ctx) => {
		const { toolMap, modelMap, bundleMap } = await buildLookupMaps(ctx);
		const stacks = await ctx.db.query("stacks").collect();

		let wouldMigrate = 0;
		let wouldSkip = 0;
		let estimatedChanges = 0;
		let estimatedBytesSaved = 0;
		const samples: Array<{
			stackId: any;
			stackName: string;
			changes: number;
			bytesSaved: number;
		}> = [];

		for (const stack of stacks) {
			if (!stack.description || !stack.description.trim()) {
				wouldSkip++;
				continue;
			}

			const originalLength = stack.description.length;
			const { migrated: newDescription, changes } = migrateDescription(
				stack.description,
				toolMap,
				modelMap,
				bundleMap,
			);

			if (changes > 0) {
				wouldMigrate++;
				estimatedChanges += changes;
				const saved = originalLength - newDescription.length;
				estimatedBytesSaved += saved;

				// Keep first 5 samples
				if (samples.length < 5) {
					samples.push({
						stackId: stack._id,
						stackName: stack.name,
						changes,
						bytesSaved: saved,
					});
				}
			} else {
				wouldSkip++;
			}
		}

		return {
			total: stacks.length,
			wouldMigrate,
			wouldSkip,
			estimatedChanges,
			estimatedBytesSaved,
			samples,
		};
	},
});
