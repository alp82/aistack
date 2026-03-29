import { internalMutation, internalQuery } from "../_generated/server";
import { v } from "convex/values";

type InstructionType =
	| "prompt"
	| "rule"
	| "skill"
	| "mcp"
	| "plugin"
	| "subagent";

type LegacyInstruction = {
	type: InstructionType;
	name: string;
	description?: string;
	content?: string;
	url?: string;
	trigger?: string;
	files?: Array<{ name: string; content: string }>;
	path?: string;
};

type MigratedInstruction = {
	type: InstructionType;
	name: string;
	description?: string;
	url?: string;
	trigger?: string;
	files?: Array<{
		name: string;
		content: string;
		path?: string;
		tags?: string[];
	}>;
};

function migrateInstruction(
	instruction: LegacyInstruction,
): { migrated: MigratedInstruction; changed: boolean } {
	const { content, path, files, ...rest } = instruction;

	// Already has files array — add path from instruction level to first file if needed
	if (files && files.length > 0) {
		const migratedFiles = files.map((f, i) => ({
			name: f.name,
			content: f.content,
			path: i === 0 && path ? path : undefined,
		}));
		const changed = path !== undefined;
		return {
			migrated: { ...rest, files: migratedFiles },
			changed: changed || content !== undefined,
		};
	}

	// Single-file mode: content exists at instruction level
	if (content) {
		return {
			migrated: {
				...rest,
				files: [
					{
						name: instruction.name,
						content,
						path: path || undefined,
					},
				],
			},
			changed: true,
		};
	}

	// No content and no files — just strip content/path fields
	const changed = content !== undefined || path !== undefined;
	return { migrated: rest, changed };
}

/**
 * Dry run: preview instruction file migration
 */
export const dryRun = internalQuery({
	args: {},
	returns: v.object({
		total: v.number(),
		withInstructions: v.number(),
		wouldMigrate: v.number(),
		totalInstructionsMigrated: v.number(),
	}),
	handler: async (ctx) => {
		const stacks = await ctx.db.query("stacks").collect();
		let withInstructions = 0;
		let wouldMigrate = 0;
		let totalInstructionsMigrated = 0;

		for (const stack of stacks) {
			const raw = stack as Record<string, unknown>;
			const instructions = raw.instructions as
				| LegacyInstruction[]
				| undefined;
			if (!instructions || instructions.length === 0) continue;
			withInstructions++;

			let stackChanged = false;
			for (const inst of instructions) {
				const { changed } = migrateInstruction(inst);
				if (changed) {
					stackChanged = true;
					totalInstructionsMigrated++;
				}
			}
			if (stackChanged) wouldMigrate++;
		}

		return {
			total: stacks.length,
			withInstructions,
			wouldMigrate,
			totalInstructionsMigrated,
		};
	},
});

/**
 * Migrate all stacks: move instruction content/path into files array
 */
export const run = internalMutation({
	args: {},
	returns: v.object({
		total: v.number(),
		migrated: v.number(),
		instructionsMigrated: v.number(),
	}),
	handler: async (ctx) => {
		const stacks = await ctx.db.query("stacks").collect();
		let migrated = 0;
		let instructionsMigrated = 0;

		for (const stack of stacks) {
			const raw = stack as Record<string, unknown>;
			const instructions = raw.instructions as
				| LegacyInstruction[]
				| undefined;
			if (!instructions || instructions.length === 0) continue;

			let stackChanged = false;
			const newInstructions: MigratedInstruction[] = [];

			for (const inst of instructions) {
				const { migrated: migratedInst, changed } =
					migrateInstruction(inst);
				newInstructions.push(migratedInst);
				if (changed) {
					stackChanged = true;
					instructionsMigrated++;
				}
			}

			if (stackChanged) {
				await ctx.db.patch(stack._id, {
					instructions: newInstructions,
				});
				migrated++;
			}
		}

		return { total: stacks.length, migrated, instructionsMigrated };
	},
});
