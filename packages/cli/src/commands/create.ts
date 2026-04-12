import * as p from "@clack/prompts";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { projectGet } from "../api.js";
import {
	banner,
	bold,
	dim,
	divider,
	lime,
	lines,
	section,
	yellow,
} from "../theme.js";

export async function createCommand(slugOrShortId: string) {
	p.intro(banner("create"));

	const s = p.spinner();
	s.start("Fetching project...");

	const shortId = slugOrShortId.includes("-")
		? slugOrShortId.slice(slugOrShortId.lastIndexOf("-") + 1)
		: slugOrShortId;

	let project: Awaited<ReturnType<typeof projectGet>>;
	try {
		project = await projectGet(shortId);
		if (!project) {
			s.stop("Not found");
			p.log.error(`Project "${slugOrShortId}" not found.`);
			process.exit(1);
		}
		s.stop(bold(project.name));
	} catch (err) {
		s.stop("Failed to fetch project");
		p.log.error(err instanceof Error ? err.message : String(err));
		process.exit(1);
	}

	const localFiles: FileToWrite[] = [];
	const globalFiles: FileToWrite[] = [];

	for (const item of project.instructions) {
		for (const file of item.files) {
			const writePath = file.path ?? file.name;
			const isGlobal = file.tags?.includes("global");
			if (isGlobal) {
				globalFiles.push({ path: writePath, content: file.content });
			} else {
				localFiles.push({ path: writePath, content: file.content });
			}
		}
	}

	if (globalFiles.length > 0) {
		section("global config", globalFiles.length);
		lines([dim("view only")]);
		lines(globalFiles.map((f) => dim(f.path)));
	}

	if (localFiles.length === 0) {
		p.log.warn("No local files to write.");
		p.outro(dim("nothing to create"));
		return;
	}

	const cwd = process.cwd();
	const toWrite: FileToWrite[] = [];
	const skipped: { path: string; differs: boolean }[] = [];

	for (const f of localFiles) {
		const fullPath = join(cwd, f.path);
		if (existsSync(fullPath)) {
			const existing = readFileSync(fullPath, "utf-8");
			skipped.push({ path: f.path, differs: existing !== f.content });
		} else {
			toWrite.push(f);
		}
	}

	section("local files", localFiles.length);
	lines(toWrite.map((f) => lime(`+ ${f.path}`)));
	lines(
		skipped.map((f) =>
			f.differs
				? `${yellow(`= ${f.path}`)} ${dim("(differs)")}`
				: dim(`= ${f.path} (identical)`),
		),
	);

	if (toWrite.length === 0) {
		divider();
		p.log.info("All local files already exist.");
		p.outro(dim("nothing to write"));
		return;
	}

	divider();

	const confirm = await p.confirm({
		message: `Write ${lime(String(toWrite.length))} new files? ${dim(`(${skipped.length} skipped)`)}`,
	});

	if (p.isCancel(confirm) || !confirm) {
		p.cancel("Cancelled.");
		process.exit(0);
	}

	for (const f of toWrite) {
		const fullPath = join(cwd, f.path);
		const dir = dirname(fullPath);
		mkdirSync(dir, { recursive: true });
		writeFileSync(fullPath, f.content);
	}

	p.log.success(
		`${lime(String(toWrite.length))} written, ${dim(String(skipped.length) + " skipped")}`,
	);
	p.outro(lime("done"));
}

interface FileToWrite {
	path: string;
	content: string;
}
