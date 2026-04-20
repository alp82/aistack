import type { ScannedFile } from "./scanner.js";
import type { InstructionItem } from "./api.js";
import { basename, dirname } from "node:path";
import { computeStableKey } from "./stableKey.js";

export function classify(files: ScannedFile[]): InstructionItem[] {
	// Group by {group, scope, type, containing directory}
	const groups = new Map<string, ScannedFile[]>();
	const singletons: ScannedFile[] = [];

	const singletonRoots = new Set([
		".",
		"~",
		"~/.claude",
		"~/.cursor",
		"~/.continue",
		".claude",
		".cursor",
		".github",
	]);

	for (const file of files) {
		const dir = dirname(file.relativePath);
		const isSingleton = singletonRoots.has(dir);

		if (isSingleton) {
			singletons.push(file);
		} else {
			const key = `${file.group}:${file.source}:${file.type}:${dir}`;
			const existing = groups.get(key) ?? [];
			existing.push(file);
			groups.set(key, existing);
		}
	}

	const items: InstructionItem[] = [];
	const scope = (source: string) =>
		source === "global" ? ("global" as const) : ("project" as const);

	// Singletons: one InstructionItem per file
	for (const file of singletons) {
		const s = scope(file.source);
		const relPath = file.relativePath
			.replace(/^~\/\.[^/]+\//, "")
			.replace(/^\.[^/]+\//, "");
		items.push({
			type: file.type,
			name: file.relativePath,
			group: file.group,
			scope: s,
			stableKey: computeStableKey(file.group, file.type, relPath),
			files: [
				{
					name: basename(file.relativePath),
					content: file.content,
					path: file.relativePath,
				},
			],
		});
	}

	// Groups: one InstructionItem per directory group
	for (const [, groupFiles] of groups) {
		const first = groupFiles[0];
		const dir = dirname(first.relativePath);
		const s = scope(first.source);
		const relPath = dir
			.replace(/^~\/\.claude\//, "")
			.replace(/^\.claude\//, "")
			.replace(/^~\/\.cursor\//, "")
			.replace(/^\.cursor\//, "");
		const typeLabel =
			first.type === "subagent" ? "subagents" : `${first.type}s`;

		items.push({
			type: first.type,
			name: dir,
			description: `${groupFiles.length} ${typeLabel}`,
			group: first.group,
			scope: s,
			stableKey: computeStableKey(first.group, first.type, relPath),
			files: groupFiles.map((f) => ({
				name: basename(f.relativePath),
				content: f.content,
				path: f.relativePath,
			})),
		});
	}

	return items;
}
