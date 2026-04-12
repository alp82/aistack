import * as p from "@clack/prompts";
import { basename } from "node:path";
import { scanLocal, scanGlobal, type ScannedFile } from "../scanner.js";
import { classify } from "../classifier.js";
import {
	projectsCheck,
	projectsCollect,
	projectGet,
	type InstructionItem,
} from "../api.js";
import {
	getToken,
	getProjectName,
	getExcludedPaths,
	saveProjectSettings,
} from "../config.js";
import {
	banner,
	bold,
	dim,
	divider,
	lime,
	limeBold,
	lines,
	red,
	section,
	yellow,
} from "../theme.js";

export async function collectCommand(options: { global: boolean }) {
	p.intro(banner("collect"));

	const token = getToken();
	if (!token) {
		p.log.error(`Not authenticated. Run ${limeBold("aistack login")} first.`);
		process.exit(1);
	}

	const cwd = process.cwd();
	const savedName = getProjectName(cwd);
	const savedExcluded = getExcludedPaths(cwd);

	const s = p.spinner();
	s.start("Scanning...");

	const localFiles = scanLocal(cwd);
	const globalFiles = options.global ? scanGlobal() : [];
	s.stop("Scan complete");

	if (localFiles.length === 0 && globalFiles.length === 0) {
		p.log.warn("No AI configuration files found.");
		p.outro(dim("nothing to collect"));
		return;
	}

	// Project name
	let projectName: string;
	if (savedName) {
		p.log.info(`${dim("PROJECT")} ${limeBold(savedName)}`);
		projectName = savedName;
	} else {
		const defaultName = basename(cwd);
		const name = await p.text({
			message: "Project name:",
			defaultValue: defaultName,
			placeholder: defaultName,
		});
		if (p.isCancel(name)) {
			p.cancel("Cancelled.");
			process.exit(0);
		}
		projectName = (name as string) || defaultName;
	}

	// Apply saved exclusions
	const allFiles = [...localFiles, ...globalFiles];
	let selectedFiles = allFiles.filter(
		(f) => !savedExcluded.includes(f.relativePath),
	);
	let excluded = allFiles.filter((f) => savedExcluded.includes(f.relativePath));

	// Show file counts
	p.log.info(
		`${lime(String(selectedFiles.length))} included${excluded.length > 0 ? ` · ${dim(String(excluded.length) + " excluded")}` : ""}`,
	);

	// Classify selected files
	let allInstructions = classify(selectedFiles);

	// Fetch existing project and diff
	let existingProject: Awaited<ReturnType<typeof projectGet>> = null;
	try {
		const check = await projectsCheck(token, projectName);
		if (check.exists && check.slug) {
			const shortId = check.slug.includes("-")
				? check.slug.slice(check.slug.lastIndexOf("-") + 1)
				: check.slug;
			existingProject = await projectGet(shortId);
		}
	} catch (err) {
		p.log.error(err instanceof Error ? err.message : String(err));
		process.exit(1);
	}

	// Show file list or diff
	if (existingProject) {
		const diff = diffInstructions(
			allInstructions,
			existingProject.instructions,
		);

		if (diff.changed === 0 && diff.added === 0 && diff.removed === 0) {
			p.log.info("No changes since last collect.");
			p.outro(dim("nothing to upload"));
			return;
		}

		divider();
		section("changes");
		lines(
			diff.details.map((f) => {
				if (f.status === "added") return lime(`+ ${f.name}`);
				if (f.status === "changed") return yellow(`~ ${f.name}`);
				return red(`- ${f.name}`);
			}),
		);
		if (diff.unchanged > 0) {
			lines([dim(`${diff.unchanged} unchanged`)]);
		}
		divider();
	} else {
		const local = selectedFiles.filter((f) => f.source === "local");
		const global = selectedFiles.filter((f) => f.source === "global");

		if (local.length > 0) {
			p.log.step(`${bold("LOCAL")} ${dim(String(local.length))}`);
			divider();
			for (const [type, files] of groupByType(local)) {
				lines([`${lime(type.toUpperCase())} ${dim(`${files.length}`)}`]);
				lines(files.map((f) => dim(`  ${f.relativePath}`)));
			}
			divider();
		}
		if (global.length > 0) {
			p.log.step(`${bold("GLOBAL")} ${dim(String(global.length))}`);
			divider();
			for (const [type, files] of groupByType(global)) {
				lines([`${lime(type.toUpperCase())} ${dim(`${files.length}`)}`]);
				lines(files.map((f) => dim(`  ${f.relativePath}`)));
			}
			divider();
		}
	}

	// Action: upload, customize, or cancel
	const action = await p.select({
		message: existingProject
			? "Upload changes?"
			: `Upload ${bold(String(selectedFiles.length))} files as ${limeBold(projectName)}?`,
		options: [
			{ value: "upload", label: "Upload" },
			{ value: "customize", label: "Select files" },
			{ value: "cancel", label: "Cancel" },
		],
	});

	if (p.isCancel(action) || action === "cancel") {
		p.cancel("Cancelled.");
		process.exit(0);
	}

	if (action === "customize") {
		const selected = await p.multiselect({
			message: "Select files to include:",
			options: allFiles.map((f) => ({
				value: f.relativePath,
				label: f.relativePath,
				hint: `${f.type}${f.source === "global" ? " · global" : ""}`,
			})),
			initialValues: selectedFiles.map((f) => f.relativePath),
		});

		if (p.isCancel(selected)) {
			p.cancel("Cancelled.");
			process.exit(0);
		}

		const selectedSet = new Set(selected as string[]);
		selectedFiles = allFiles.filter((f) => selectedSet.has(f.relativePath));
		excluded = allFiles.filter((f) => !selectedSet.has(f.relativePath));
		allInstructions = classify(selectedFiles);

		if (selectedFiles.length === 0) {
			p.log.warn("No files selected.");
			p.outro(dim("nothing to collect"));
			process.exit(0);
		}
	}

	s.start("Uploading...");
	try {
		const result = await projectsCollect(token, {
			name: projectName,
			instructions: allInstructions,
		});
		s.stop(lime("Uploaded"));
		saveProjectSettings(
			cwd,
			projectName,
			excluded.map((f) => f.relativePath),
		);
		p.log.success(dim(result.url));
		p.outro(lime("done"));
	} catch (err) {
		s.stop("Upload failed");
		p.log.error(err instanceof Error ? err.message : String(err));
		process.exit(1);
	}
}

const TYPE_ORDER = [
	"config",
	"prompt",
	"rule",
	"command",
	"skill",
	"subagent",
	"mcp",
	"hook",
	"custom",
];

function groupByType(files: ScannedFile[]): Map<string, ScannedFile[]> {
	const map = new Map<string, ScannedFile[]>();
	for (const f of files) {
		const existing = map.get(f.type) ?? [];
		existing.push(f);
		map.set(f.type, existing);
	}
	const sorted = new Map<string, ScannedFile[]>();
	for (const type of TYPE_ORDER) {
		const group = map.get(type);
		if (group) sorted.set(type, group);
	}
	for (const [type, group] of map) {
		if (!sorted.has(type)) sorted.set(type, group);
	}
	return sorted;
}

interface DiffResult {
	added: number;
	changed: number;
	removed: number;
	unchanged: number;
	details: Array<{ name: string; status: "added" | "changed" | "removed" }>;
}

function diffInstructions(
	current: InstructionItem[],
	existing: InstructionItem[],
): DiffResult {
	const existingMap = new Map<string, string>();
	for (const item of existing) {
		for (const file of item.files) {
			existingMap.set(file.path ?? file.name, file.content);
		}
	}

	const currentMap = new Map<string, string>();
	for (const item of current) {
		for (const file of item.files) {
			currentMap.set(file.path ?? file.name, file.content);
		}
	}

	const details: DiffResult["details"] = [];
	let added = 0;
	let changed = 0;
	let unchanged = 0;

	for (const [key, content] of currentMap) {
		const prev = existingMap.get(key);
		if (prev === undefined) {
			added++;
			details.push({ name: key, status: "added" });
		} else if (prev !== content) {
			changed++;
			details.push({ name: key, status: "changed" });
		} else {
			unchanged++;
		}
	}

	let removed = 0;
	for (const key of existingMap.keys()) {
		if (!currentMap.has(key)) {
			removed++;
			details.push({ name: key, status: "removed" });
		}
	}

	return { added, changed, removed, unchanged, details };
}
