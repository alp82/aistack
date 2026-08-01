import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { dirname, join } from "node:path";
import { BASE_URL } from "./api.js";

const CONFIG_DIR = join(homedir(), ".config", "aistack");
const CREDENTIALS_FILE = join(CONFIG_DIR, "credentials.json");

interface ServerCredentials {
	token: string;
	userId?: string;
}

/**
 * Credentials keyed by server URL (#61). Since hash-at-rest (#52) the server
 * stores only a hash, so this file holds the only plaintext copy of each
 * token. The old flat `{token, userId}` form let a localhost login overwrite
 * the prod token, which was unrecoverable. The map keeps one entry per server.
 */
interface CredentialsFile {
	servers: Record<string, ServerCredentials>;
}

/** Where a legacy flat token is assumed to come from. */
const DEFAULT_SERVER_URL = "https://aistack.to";

/**
 * Read the credentials file and lift the legacy flat form into the map.
 *
 * A legacy token carries no record of which server issued it. It is assigned
 * to the default prod URL, not the caller's current server: every real flat
 * token came from prod, and keying it under a localhost caller would put it
 * exactly where the next localhost login overwrites it.
 */
function readCredentials(file: string): {
	data: CredentialsFile;
	legacy: boolean;
} {
	const empty = { data: { servers: {} }, legacy: false };
	if (!existsSync(file)) return empty;
	try {
		const raw = JSON.parse(readFileSync(file, "utf-8"));
		if (!raw || typeof raw !== "object") return empty;
		if (raw.servers && typeof raw.servers === "object") {
			return {
				data: { servers: raw.servers as Record<string, ServerCredentials> },
				legacy: false,
			};
		}
		if (typeof raw.token === "string" && raw.token) {
			return {
				data: {
					servers: {
						[DEFAULT_SERVER_URL]: { token: raw.token, userId: raw.userId },
					},
				},
				legacy: true,
			};
		}
		// A cleared legacy file is `{}` — empty, but safe to rewrite.
		return { data: { servers: {} }, legacy: true };
	} catch {
		// Do not rewrite an unreadable file. It may still hold a token that a
		// human can recover, and this file holds the only plaintext copy.
		return empty;
	}
}

function writeCredentials(file: string, data: CredentialsFile): void {
	mkdirSync(dirname(file), { recursive: true });
	writeFileSync(file, JSON.stringify(data, null, 2));
}

export function getToken(
	serverUrl: string = BASE_URL,
	file: string = CREDENTIALS_FILE,
): string | null {
	const { data, legacy } = readCredentials(file);
	if (legacy) writeCredentials(file, data);
	return data.servers[serverUrl]?.token ?? null;
}

export function saveToken(
	token: string,
	userId?: string,
	serverUrl: string = BASE_URL,
	file: string = CREDENTIALS_FILE,
): void {
	const { data } = readCredentials(file);
	data.servers[serverUrl] = { token, userId };
	writeCredentials(file, data);
}

/** Remove only the current server's entry. Other servers keep their tokens. */
export function clearToken(
	serverUrl: string = BASE_URL,
	file: string = CREDENTIALS_FILE,
): void {
	if (!existsSync(file)) return;
	const { data } = readCredentials(file);
	delete data.servers[serverUrl];
	writeCredentials(file, data);
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
