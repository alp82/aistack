import { internalMutation, internalQuery } from "../../_generated/server";
import { v } from "convex/values";

type LegacyInstruction = {
	type: string;
	name: string;
	description?: string;
	content?: string;
	url?: string;
	trigger?: string;
	files?: Array<{
		name: string;
		content: string;
		path?: string;
		tags?: string[];
	}>;
	path?: string;
};

type MigratedInstruction = {
	type: string;
	name: string;
	description?: string;
	files: Array<{
		name: string;
		content: string;
		path?: string;
		tags?: string[];
	}>;
};

function migrateInstruction(instruction: LegacyInstruction): {
	migrated: MigratedInstruction;
	changed: boolean;
} {
	const { content, path, url, trigger, files, type, ...rest } = instruction;

	// Rename plugin → hook
	const newType = type === "plugin" ? "hook" : type;

	// Build files array from existing files or legacy content field
	let newFiles: MigratedInstruction["files"];
	if (files && files.length > 0) {
		newFiles = files.map((f, i) => ({
			name: f.name,
			content: f.content,
			path: f.path ?? (i === 0 && path ? path : undefined),
			tags: f.tags,
		}));
	} else if (content) {
		newFiles = [
			{
				name: instruction.name,
				content,
				path: path || undefined,
			},
		];
	} else {
		newFiles = [];
	}

	const changed =
		type !== newType ||
		content !== undefined ||
		path !== undefined ||
		url !== undefined ||
		trigger !== undefined ||
		!files;

	return {
		migrated: { ...rest, type: newType, files: newFiles },
		changed,
	};
}

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
