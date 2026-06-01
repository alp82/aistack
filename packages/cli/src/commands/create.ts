import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import * as p from "@clack/prompts";
import { stackGet } from "../api.js";
import { getToken } from "../config.js";
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
	section,
	yellow,
} from "../theme.js";

export async function createCommand() {
	intro("create");

	const token = getToken();
	if (!token) {
		p.log.error(
			`Not authenticated. Run ${limeBold("npx @use-aistack/cli login")} first.`,
		);
		outroError("not authenticated");
		process.exit(1);
	}

	const s = p.spinner();
	s.start("Fetching stack...");

	let stack: Awaited<ReturnType<typeof stackGet>>;
	try {
		stack = await stackGet(token);
		if (!stack) {
			s.stop("Not found");
			p.log.error("No stack found. Create a stack on aistack.to first.");
			outroError("not found");
			process.exit(1);
		}
		s.stop(bold(stack.name));
	} catch (err) {
		s.stop("Failed to fetch stack");
		p.log.error(err instanceof Error ? err.message : String(err));
		outroError("error");
		process.exit(1);
	}

	const localFiles: FileToWrite[] = [];

	for (const item of stack.resources) {
		for (const file of item.files ?? []) {
			localFiles.push({ path: file.path ?? file.name, content: file.content });
		}
	}

	// Linked resources have no files to write — surface them so they aren't
	// silently dropped on download (GitHub repos + package refs like MCP servers).
	const linked = stack.resources.filter(
		(item) => (item.upstream || item.pkg) && !item.files?.length,
	);
	if (linked.length > 0) {
		section("linked", linked.length);
		lines([dim("view only")]);
		lines(
			linked.map((item) =>
				dim(
					item.upstream?.repoUrl ??
						(item.pkg ? `${item.pkg.registry}:${item.pkg.id}` : ""),
				),
			),
		);
	}

	if (localFiles.length === 0) {
		p.log.warn("No local files to write.");
		outroSkipped("nothing to create");
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
		outroSkipped("nothing to write");
		return;
	}

	divider();

	const confirm = await p.confirm({
		message: `Write ${lime(String(toWrite.length))} new files? ${dim(`(${skipped.length} skipped)`)}`,
	});

	if (p.isCancel(confirm) || !confirm) {
		outroCancel();
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
	outro(lime("done"));
}

interface FileToWrite {
	path: string;
	content: string;
}
