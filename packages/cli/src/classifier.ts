import type { ScannedFile } from "./scanner.js";
import type { InstructionItem } from "./api.js";
import { basename, dirname } from "node:path";

export function classify(files: ScannedFile[]): InstructionItem[] {
	const skillDirs = new Map<string, ScannedFile[]>();
	const nonSkillFiles: ScannedFile[] = [];

	for (const file of files) {
		if (file.type === "skill") {
			const dir = dirname(file.relativePath);
			const existing = skillDirs.get(dir) ?? [];
			existing.push(file);
			skillDirs.set(dir, existing);
		} else {
			nonSkillFiles.push(file);
		}
	}

	const items: InstructionItem[] = [];

	for (const file of nonSkillFiles) {
		const tags = file.source === "global" ? ["global"] : undefined;
		items.push({
			type: file.type,
			name: file.relativePath,
			files: [
				{
					name: basename(file.relativePath),
					content: file.content,
					path: file.relativePath,
					tags,
				},
			],
		});
	}

	for (const [dir, dirFiles] of skillDirs) {
		const isGlobal = dirFiles[0]?.source === "global";
		items.push({
			type: "skill",
			name: dir,
			files: dirFiles.map((f) => ({
				name: basename(f.relativePath),
				content: f.content,
				path: f.relativePath,
				tags: isGlobal ? ["global"] : undefined,
			})),
		});
	}

	return items;
}

export function isGlobalItem(item: InstructionItem): boolean {
	return item.files.some((f) => f.tags?.includes("global"));
}
