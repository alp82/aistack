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

const SETTINGS_FILE = join(CONFIG_DIR, "settings.json");

/**
 * Machine-local switches (#56). A separate file from credentials.json so a
 * login overwrite never resets an answered upsell, and clearing settings never
 * touches the token.
 */
export interface Settings {
	/** The post-sync connect-claude upsell was answered (either way). */
	connectClaudeAnswered?: boolean;
}

export function getSettings(): Settings {
	if (!existsSync(SETTINGS_FILE)) return {};
	try {
		const raw = JSON.parse(readFileSync(SETTINGS_FILE, "utf-8"));
		return raw && typeof raw === "object" ? (raw as Settings) : {};
	} catch {
		return {};
	}
}

export function saveSettings(patch: Partial<Settings>): void {
	mkdirSync(CONFIG_DIR, { recursive: true });
	writeFileSync(
		SETTINGS_FILE,
		JSON.stringify({ ...getSettings(), ...patch }, null, 2),
	);
}

const PROJECTS_FILE = join(CONFIG_DIR, "projects.json");

interface ProjectEntry {
	excluded?: string[];
}

interface ProjectsData {
	[directory: string]: ProjectEntry;
}

function readProjects(): ProjectsData {
	if (!existsSync(PROJECTS_FILE)) return {};
	try {
		const raw = JSON.parse(readFileSync(PROJECTS_FILE, "utf-8"));
		// Tolerate legacy entries: string values (oldest) and objects that still
		// carry a `name` field. Only `excluded` is read going forward.
		const data: ProjectsData = {};
		for (const [key, value] of Object.entries(raw)) {
			if (typeof value === "string") {
				data[key] = {};
			} else if (value && typeof value === "object") {
				const excluded = (value as { excluded?: string[] }).excluded;
				data[key] = Array.isArray(excluded) ? { excluded } : {};
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

export function getExcludedPaths(directory: string): string[] {
	return readProjects()[directory]?.excluded ?? [];
}

export function saveExcludedPaths(directory: string, excluded: string[]): void {
	const data = readProjects();
	data[directory] = {
		excluded: excluded.length > 0 ? excluded : undefined,
	};
	writeProjects(data);
}
