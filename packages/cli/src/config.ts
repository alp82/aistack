import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";

const CONFIG_DIR = join(homedir(), ".config", "aistack");
const CREDENTIALS_FILE = join(CONFIG_DIR, "credentials.json");

interface Credentials {
	token: string;
	userId?: string;
}

export function getToken(): string | null {
	if (!existsSync(CREDENTIALS_FILE)) return null;
	try {
		const data = JSON.parse(
			readFileSync(CREDENTIALS_FILE, "utf-8"),
		) as Credentials;
		return data.token ?? null;
	} catch {
		return null;
	}
}

export function saveToken(token: string, userId?: string): void {
	mkdirSync(CONFIG_DIR, { recursive: true });
	writeFileSync(CREDENTIALS_FILE, JSON.stringify({ token, userId }, null, 2));
}

export function clearToken(): void {
	if (existsSync(CREDENTIALS_FILE)) {
		writeFileSync(CREDENTIALS_FILE, "{}");
	}
}

const PROJECTS_FILE = join(CONFIG_DIR, "projects.json");

interface ProjectEntry {
	name: string;
	excluded?: string[];
}

interface ProjectsData {
	[directory: string]: ProjectEntry;
}

function readProjects(): ProjectsData {
	if (!existsSync(PROJECTS_FILE)) return {};
	try {
		const raw = JSON.parse(readFileSync(PROJECTS_FILE, "utf-8"));
		// Migrate old format (string values) to new format
		const data: ProjectsData = {};
		for (const [key, value] of Object.entries(raw)) {
			if (typeof value === "string") {
				data[key] = { name: value };
			} else {
				data[key] = value as ProjectEntry;
			}
		}
		return data;
	} catch {
		return {};
	}
}

function writeProjects(data: ProjectsData): void {
	mkdirSync(CONFIG_DIR, { recursive: true });
	writeFileSync(PROJECTS_FILE, JSON.stringify(data, null, 2));
}

export function getProjectName(directory: string): string | null {
	return readProjects()[directory]?.name ?? null;
}

export function getExcludedPaths(directory: string): string[] {
	return readProjects()[directory]?.excluded ?? [];
}

export function saveProjectSettings(
	directory: string,
	name: string,
	excluded: string[],
): void {
	const data = readProjects();
	data[directory] = {
		name,
		excluded: excluded.length > 0 ? excluded : undefined,
	};
	writeProjects(data);
}
