import * as p from "@clack/prompts";
import { type Resource, stackCollect, stackGet } from "../api.js";
import { classify } from "../classifier.js";
import { getExcludedPaths, getToken, saveExcludedPaths } from "../config.js";
import { buildRepoLinkResource, detectRepoUrl } from "../git.js";
import { repoNameFromCanonical } from "../github-repo.js";
import { detectHooks } from "../hooks.js";
import { detectMcpServers } from "../mcp.js";
import { detectInstalledPlugins } from "../plugins.js";
import { type ScannedFile, scanGlobal, scanLocal } from "../scanner.js";
import {
	bold,
	dim,
	divider,
	intro,
	lime,
	limeBold,
	lines,
	outro,
	outroCancel,
	outroError,
	outroSkipped,
	red,
	section,
	yellow,
} from "../theme.js";

// Sentinel selection key for the detected repo link. NUL-prefixed so it can
// never collide with a real ScannedFile.relativePath, letting links ride the
// existing excluded[] selection/persistence model with no config.ts changes.
const REPO_LINK_KEY = "\0repo-link";

/**
 * A non-file resource surfaced during collect — the repo link, an installed
 * plugin, etc. Toggleable and persisted exactly like a scanned file, keyed by
 * its sentinel. Everything attaches to the single stack (global) server-side.
 */
interface DetectedLink {
	key: string;
	resource: Resource;
	label: string;
}

export async function collectCommand(options: { global: boolean }) {
	intro("collect");

	const token = getToken();
	if (!token) {
		p.log.error(
			`Not authenticated. Run ${limeBold("npx @use-aistack/cli login")} first.`,
		);
		outroError("not authenticated");
		process.exit(1);
	}

	const cwd = process.cwd();
	const savedExcluded = getExcludedPaths(cwd);

	const s = p.spinner();
	s.start("Scanning...");

	const localFiles = scanLocal(cwd);
	const globalFiles = options.global ? scanGlobal() : [];
	s.stop("Scan complete");

	if (localFiles.length === 0 && globalFiles.length === 0) {
		p.log.warn("No AI configuration files found.");
		outroSkipped("nothing to collect");
		return;
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

	// Detect non-file links: the repo this lives in, installed Claude Code
	// plugins, MCP servers, hooks. Each is toggleable and included by default
	// unless previously deselected. All graceful no-ops.
	const detectedLinks: DetectedLink[] = [];
	const repoUrl = detectRepoUrl(cwd);
	if (repoUrl) {
		detectedLinks.push({
			key: REPO_LINK_KEY,
			resource: buildRepoLinkResource(repoUrl),
			label: `repo · ${repoNameFromCanonical(repoUrl)}`,
		});
	}
	for (const resource of detectInstalledPlugins()) {
		detectedLinks.push({
			key: `\0plugin:${resource.stableKey}`,
			resource,
			label: `plugin · ${resource.name}`,
		});
	}
	for (const resource of detectMcpServers(cwd)) {
		detectedLinks.push({
			key: `\0mcp:${resource.stableKey}`,
			resource,
			label: `mcp · ${resource.name}`,
		});
	}
	for (const resource of detectHooks(cwd)) {
		detectedLinks.push({
			key: `\0hook:${resource.stableKey}`,
			resource,
			label: `hook · ${resource.name}`,
		});
	}

	const includedLinks = new Set(
		detectedLinks
			.filter((l) => !savedExcluded.includes(l.key))
			.map((l) => l.key),
	);
	const withLinks = (base: Resource[]): Resource[] => [
		...base,
		...detectedLinks
			.filter((l) => includedLinks.has(l.key))
			.map((l) => l.resource),
	];

	// Classify selected files
	let allResources = withLinks(classify(selectedFiles));

	// Fetch the existing stack and diff against its resources.
	let existingStack: Awaited<ReturnType<typeof stackGet>> = null;
	try {
		existingStack = await stackGet(token);
	} catch (err) {
		p.log.error(err instanceof Error ? err.message : String(err));
		outroError("error");
		process.exit(1);
	}

	// Show file list or diff
	if (existingStack) {
		const diff = diffResources(allResources, existingStack.resources);
		const changeCount = diff.added + diff.changed + diff.removed;

		if (changeCount === 0) {
			p.log.info("No changes since last collect.");
			outroSkipped("nothing to upload");
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
		const shownLinks = detectedLinks.filter((l) => includedLinks.has(l.key));
		if (shownLinks.length > 0) {
			p.log.step(`${bold("LINKS")} ${dim(String(shownLinks.length))}`);
			divider();
			lines(shownLinks.map((l) => dim(`  ${l.label}`)));
			divider();
		}
	}

	// Action: upload, customize, or cancel
	const action = await p.select({
		message: existingStack
			? "Upload changes?"
			: `Upload ${bold(String(selectedFiles.length))} files to your stack?`,
		options: [
			{ value: "upload", label: "Upload" },
			{ value: "customize", label: "Select files" },
			{ value: "cancel", label: "Cancel" },
		],
	});

	if (p.isCancel(action) || action === "cancel") {
		outroCancel();
		process.exit(0);
	}

	if (action === "customize") {
		const linkOptions = detectedLinks.map((l) => ({
			value: l.key,
			label: l.label,
			hint: "link",
		}));
		const selected = await p.multiselect({
			message: "Select files to include:",
			options: [
				...linkOptions,
				...allFiles.map((f) => ({
					value: f.relativePath,
					label: f.relativePath,
					hint: `${f.type}${f.source === "global" ? " · global" : ""}`,
				})),
			],
			initialValues: [
				...detectedLinks
					.filter((l) => includedLinks.has(l.key))
					.map((l) => l.key),
				...selectedFiles.map((f) => f.relativePath),
			],
		});

		if (p.isCancel(selected)) {
			outroCancel();
			process.exit(0);
		}

		const selectedSet = new Set(selected as string[]);
		selectedFiles = allFiles.filter((f) => selectedSet.has(f.relativePath));
		excluded = allFiles.filter((f) => !selectedSet.has(f.relativePath));
		includedLinks.clear();
		for (const l of detectedLinks) {
			if (selectedSet.has(l.key)) includedLinks.add(l.key);
		}
		allResources = withLinks(classify(selectedFiles));

		if (selectedFiles.length === 0 && includedLinks.size === 0) {
			p.log.warn("No files selected.");
			outroSkipped("nothing to collect");
			process.exit(0);
		}
	}

	s.start("Uploading...");
	try {
		const result = await stackCollect(token, { resources: allResources });
		s.stop(lime("Uploaded"));
		const excludedKeys = excluded.map((f) => f.relativePath);
		for (const l of detectedLinks) {
			if (!includedLinks.has(l.key)) excludedKeys.push(l.key);
		}
		saveExcludedPaths(cwd, excludedKeys);
		p.log.success(dim(result.url));
		outro(lime("done"));
	} catch (err) {
		s.stop("Upload failed");
		p.log.error(err instanceof Error ? err.message : String(err));
		outroError("upload failed");
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

export function diffResources(
	current: Resource[],
	existing: Resource[],
): DiffResult {
	const existingMap = new Map<string, string>();
	for (const item of existing) {
		for (const file of item.files ?? []) {
			existingMap.set(file.path ?? file.name, file.content);
		}
	}

	const currentMap = new Map<string, string>();
	for (const item of current) {
		for (const file of item.files ?? []) {
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

	// Linked resources (GitHub repos AND package refs like MCP servers) carry no
	// files, so the file maps above can't see them. Diff them by stableKey —
	// unique for both `linked:<repo>:<path>` and `linked:pkg:<registry>:<id>` —
	// otherwise a link-only change is invisible and collect wrongly reports
	// "nothing to upload".
	const linkLabel = (item: Resource): string => {
		if (item.upstream)
			return `link: ${repoNameFromCanonical(item.upstream.repoUrl)}`;
		if (item.pkg) return `link: ${item.pkg.id}`;
		return `link: ${item.name}`;
	};
	const linkMap = (items: Resource[]): Map<string, Resource> => {
		const map = new Map<string, Resource>();
		for (const item of items) {
			if ((item.upstream || item.pkg) && !item.files?.length) {
				map.set(item.stableKey, item);
			}
		}
		return map;
	};
	const existingLinks = linkMap(existing);
	const currentLinks = linkMap(current);
	for (const [key, item] of currentLinks) {
		if (!existingLinks.has(key)) {
			added++;
			details.push({ name: linkLabel(item), status: "added" });
		}
	}
	for (const [key, item] of existingLinks) {
		if (!currentLinks.has(key)) {
			removed++;
			details.push({ name: linkLabel(item), status: "removed" });
		}
	}

	return { added, changed, removed, unchanged, details };
}
