import {
	existsSync,
	mkdirSync,
	mkdtempSync,
	readFileSync,
	rmSync,
	writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, test } from "vitest";
import {
	grokAutoSyncHookInstalled,
	grokHookCommand,
	installGrokAutoSyncHook,
	removeGrokAutoSyncHook,
} from "./grokHook.js";

let dir: string;
let file: string;

beforeEach(() => {
	dir = mkdtempSync(join(tmpdir(), "aistack-grok-hook-"));
	file = join(dir, "home with spaces", "hooks", "aistack.json");
	mkdirSync(join(dir, "home with spaces", "hooks"), { recursive: true });
});

afterEach(() => rmSync(dir, { recursive: true, force: true }));

describe("the owned Grok Build hook source", () => {
	test("installs one global SessionStart command and is idempotent", () => {
		expect(installGrokAutoSyncHook(file, "linux").ok).toBe(true);
		expect(installGrokAutoSyncHook(file, "linux").ok).toBe(true);
		const value = JSON.parse(readFileSync(file, "utf-8"));
		expect(value.hooks.SessionStart).toHaveLength(1);
		expect(value.hooks.SessionStart[0].hooks).toHaveLength(1);
		expect(grokAutoSyncHookInstalled(file)).toBe(true);
	});

	test("coexists with imported hooks because it owns a separate source", () => {
		expect(installGrokAutoSyncHook(file).ok).toBe(true);
		expect(readFileSync(file, "utf-8")).not.toContain(".claude");
		expect(readFileSync(file, "utf-8")).not.toContain(".cursor");
	});

	test("refuses malformed or foreign content in its owned path", () => {
		writeFileSync(file, "{ broken", { flag: "w" });
		expect(installGrokAutoSyncHook(file).ok).toBe(false);
		rmSync(file);
		writeFileSync(file, JSON.stringify({ hooks: { Stop: [] } }));
		expect(installGrokAutoSyncHook(file).ok).toBe(false);
	});

	test("removes only the owned source", () => {
		installGrokAutoSyncHook(file);
		expect(removeGrokAutoSyncHook(file).ok).toBe(true);
		expect(existsSync(file)).toBe(false);
	});

	test("refuses removal when the source contains foreign hooks", () => {
		writeFileSync(file, JSON.stringify({ hooks: { Stop: [] } }));
		expect(removeGrokAutoSyncHook(file).ok).toBe(false);
		expect(existsSync(file)).toBe(true);
	});
});

describe("platform command construction", () => {
	test("Linux detaches with setsid and silences output", () => {
		const command = grokHookCommand("linux");
		expect(command).toContain("setsid nohup");
		expect(command).toContain("AISTACK_HOOK_SOURCE=grok");
		expect(command).toContain(">/dev/null 2>&1 &");
		expect(command).toContain("sync --auto");
	});

	test("macOS detaches without relying on unavailable setsid", () => {
		const command = grokHookCommand("darwin");
		expect(command).toContain("nohup sh");
		expect(command).not.toContain("setsid");
		expect(command).toContain("</dev/null >/dev/null 2>&1 &");
		expect(command).toContain("sync --auto");
	});

	test("Windows detaches through Start-Process and silences output", () => {
		const command = grokHookCommand("win32");
		expect(command).toContain("Start-Process");
		expect(command).toContain("AISTACK_HOOK_SOURCE=grok");
		expect(command).toContain(">NUL 2>&1");
		expect(command).toContain("sync --auto");
	});
});
