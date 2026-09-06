import {
	chmodSync,
	mkdtempSync,
	readFileSync,
	rmSync,
	statSync,
	writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, test } from "vitest";
import {
	clearToken,
	getProjectWorkspaceId,
	getToken,
	saveExcludedPaths,
	saveToken,
} from "./config.js";

/**
 * Credentials keyed by server URL - wayfinder #61 (map #60).
 *
 * The file holds the only plaintext copy of each token (#52 hashed the server
 * side). The old flat form let a localhost login destroy the prod token. These
 * tests pin the map form, the legacy migration, and the do-not-clobber rules.
 */

const PROD = "https://aistack.to";
const LOCAL = "http://localhost:3019";

let dir: string;
let file: string;
const testOnPosix = test.skipIf(process.platform === "win32");

beforeEach(() => {
	dir = mkdtempSync(join(tmpdir(), "aistack-config-"));
	file = join(dir, "credentials.json");
});

afterEach(() => {
	rmSync(dir, { recursive: true, force: true });
});

describe("saveToken / getToken", () => {
	testOnPosix(
		"creates credentials and its directory with restrictive permissions",
		() => {
			const configDir = join(dir, "config");
			const credentialsFile = join(configDir, "credentials.json");

			saveToken("tok-prod", "user-1", PROD, credentialsFile);

			expect(statSync(configDir).mode & 0o777).toBe(0o700);
			expect(statSync(credentialsFile).mode & 0o777).toBe(0o600);
		},
	);

	testOnPosix(
		"repairs an existing credentials file to restrictive permissions",
		() => {
			writeFileSync(file, JSON.stringify({ servers: {} }));
			chmodSync(file, 0o644);

			saveToken("tok-prod", "user-1", PROD, file);

			expect(statSync(file).mode & 0o777).toBe(0o600);
		},
	);

	test("round-trips a token for one server", () => {
		saveToken("tok-prod", "user-1", PROD, file);
		expect(getToken(PROD, file)).toBe("tok-prod");
	});

	test("a localhost login does not clobber the prod token", () => {
		saveToken("tok-prod", "user-1", PROD, file);
		saveToken("tok-local", "user-1", LOCAL, file);
		expect(getToken(PROD, file)).toBe("tok-prod");
		expect(getToken(LOCAL, file)).toBe("tok-local");
	});

	test("returns null for a server with no entry", () => {
		saveToken("tok-prod", "user-1", PROD, file);
		expect(getToken(LOCAL, file)).toBeNull();
	});

	test("returns null when the file does not exist", () => {
		expect(getToken(PROD, file)).toBeNull();
	});

	test("a re-login for the same server replaces only that entry", () => {
		saveToken("tok-old", "user-1", PROD, file);
		saveToken("tok-local", "user-1", LOCAL, file);
		saveToken("tok-new", "user-1", PROD, file);
		expect(getToken(PROD, file)).toBe("tok-new");
		expect(getToken(LOCAL, file)).toBe("tok-local");
	});
});

describe("legacy flat-form migration", () => {
	test("reads a legacy flat file as the current server's token", () => {
		writeFileSync(file, JSON.stringify({ token: "tok-flat", userId: "u1" }));
		expect(getToken(PROD, file)).toBe("tok-flat");
	});

	test("rewrites the flat form to the map on first read", () => {
		writeFileSync(file, JSON.stringify({ token: "tok-flat", userId: "u1" }));
		if (process.platform !== "win32") chmodSync(file, 0o644);
		getToken(PROD, file);
		const raw = JSON.parse(readFileSync(file, "utf-8"));
		expect(raw.token).toBeUndefined();
		expect(raw.servers[PROD]).toEqual({ token: "tok-flat", userId: "u1" });
		if (process.platform !== "win32") {
			expect(statSync(file).mode & 0o777).toBe(0o600);
		}
	});

	test("a login on top of a legacy file keeps the migrated entry", () => {
		writeFileSync(file, JSON.stringify({ token: "tok-flat" }));
		saveToken("tok-local", "user-1", LOCAL, file);
		expect(getToken(PROD, file)).toBe("tok-flat");
		expect(getToken(LOCAL, file)).toBe("tok-local");
	});

	test("a cleared legacy file ({}) reads as empty", () => {
		writeFileSync(file, "{}");
		expect(getToken(PROD, file)).toBeNull();
	});

	test("does not rewrite an unreadable file", () => {
		writeFileSync(file, "not json {");
		expect(getToken(PROD, file)).toBeNull();
		expect(readFileSync(file, "utf-8")).toBe("not json {");
	});
});

describe("clearToken", () => {
	test("removes only the current server's entry", () => {
		saveToken("tok-prod", "user-1", PROD, file);
		saveToken("tok-local", "user-1", LOCAL, file);
		clearToken(LOCAL, file);
		expect(getToken(LOCAL, file)).toBeNull();
		expect(getToken(PROD, file)).toBe("tok-prod");
	});

	test("is a no-op when the file does not exist", () => {
		expect(() => clearToken(PROD, file)).not.toThrow();
	});
});

describe("getProjectWorkspaceId", () => {
	test("keeps one opaque id for a local project workspace", () => {
		const projectsFile = join(dir, "projects.json");
		writeFileSync(
			projectsFile,
			JSON.stringify({ "/work/acme": { excluded: [".env"] } }),
		);
		let calls = 0;
		const createId = () => {
			calls++;
			return "AAAAAAAAAAAAAAAAAAAAAA";
		};

		expect(
			getProjectWorkspaceId("/work/acme", { file: projectsFile, createId }),
		).toBe("AAAAAAAAAAAAAAAAAAAAAA");
		expect(
			getProjectWorkspaceId("/work/acme", { file: projectsFile, createId }),
		).toBe("AAAAAAAAAAAAAAAAAAAAAA");
		expect(calls).toBe(1);
		expect(JSON.parse(readFileSync(projectsFile, "utf-8"))).toEqual({
			"/work/acme": {
				excluded: [".env"],
				workspaceId: "AAAAAAAAAAAAAAAAAAAAAA",
			},
		});
	});

	test("replaces an invalid persisted id", () => {
		const projectsFile = join(dir, "projects.json");
		writeFileSync(
			projectsFile,
			JSON.stringify({ "/work/acme": { workspaceId: "broken" } }),
		);

		expect(
			getProjectWorkspaceId("/work/acme", {
				file: projectsFile,
				createId: () => "BBBBBBBBBBBBBBBBBBBBBB",
			}),
		).toBe("BBBBBBBBBBBBBBBBBBBBBB");
		expect(JSON.parse(readFileSync(projectsFile, "utf-8"))).toEqual({
			"/work/acme": { workspaceId: "BBBBBBBBBBBBBBBBBBBBBB" },
		});
	});

	test("keeps the identifier when exclusions change", () => {
		const projectsFile = join(dir, "projects.json");
		getProjectWorkspaceId("/work/acme", {
			file: projectsFile,
			createId: () => "AAAAAAAAAAAAAAAAAAAAAA",
		});

		saveExcludedPaths("/work/acme", [".env"], projectsFile);

		expect(JSON.parse(readFileSync(projectsFile, "utf-8"))).toEqual({
			"/work/acme": {
				excluded: [".env"],
				workspaceId: "AAAAAAAAAAAAAAAAAAAAAA",
			},
		});
	});
});
