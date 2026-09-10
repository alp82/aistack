import { execFileSync } from "node:child_process";
import {
	mkdirSync,
	mkdtempSync,
	readFileSync,
	rmSync,
	writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, expect, test } from "vitest";
import {
	cursorAutoSyncHookInstalled,
	cursorHookCommand,
	installCursorAutoSyncHook,
	removeCursorAutoSyncHook,
} from "./cursorHook.js";

let dir: string;
let file: string;
beforeEach(() => {
	dir = mkdtempSync(join(tmpdir(), "cursor-hook-"));
	file = join(dir, "home with spaces", "hooks.json");
	mkdirSync(join(dir, "home with spaces"));
});
afterEach(() => rmSync(dir, { recursive: true, force: true }));

test("install, reinstall and removal preserve foreign stop entries, events and settings", () => {
	const foreign = {
		version: 1,
		extra: true,
		hooks: {
			stop: [
				{ command: "echo mine", matcher: "completed" },
				{ command: "npx @use-aistack/cli sync --auto" },
			],
			afterFileEdit: [{ command: "format" }],
		},
	};
	writeFileSync(file, JSON.stringify(foreign));
	expect(cursorAutoSyncHookInstalled(file)).toBe(false);
	for (const os of ["linux", "darwin", "win32"] as const) {
		expect(installCursorAutoSyncHook(file, os).ok).toBe(true);
		expect(installCursorAutoSyncHook(file, os).ok).toBe(true);
		expect(cursorAutoSyncHookInstalled(file)).toBe(true);
		expect(JSON.parse(readFileSync(file, "utf8")).hooks.stop).toHaveLength(3);
	}
	expect(removeCursorAutoSyncHook(file).ok).toBe(true);
	expect(JSON.parse(readFileSync(file, "utf8"))).toEqual(foreign);
	expect(cursorAutoSyncHookInstalled(file)).toBe(false);
	expect(removeCursorAutoSyncHook(file).message).toBe(
		"no Cursor hook to remove",
	);
});
test.each([
	"{ broken",
	"[]",
	'{"version":2}',
	'{"hooks":{"stop":[null]}}',
	'{"hooks":{"stop":{}}}',
])("rejects malformed configuration without rewriting: %s", (content) => {
	writeFileSync(file, content);
	expect(installCursorAutoSyncHook(file).ok).toBe(false);
	expect(removeCursorAutoSyncHook(file).ok).toBe(false);
	expect(cursorAutoSyncHookInstalled(file)).toBe(false);
	expect(readFileSync(file, "utf8")).toBe(content);
});
test("reports write failures as lifecycle results", () => {
	expect(installCursorAutoSyncHook(join(file, "not-a-directory")).ok).toBe(
		true,
	);
	expect(installCursorAutoSyncHook(file).ok).toBe(false);
});
test("Windows uses an explicit noninteractive launcher with no hook output or input", () => {
	const command = cursorHookCommand("win32");
	expect(command).toMatch(
		/^powershell.exe -NoProfile -NonInteractive -EncodedCommand /,
	);
	const script = Buffer.from(
		command.split(" ").at(-1) ?? "",
		"base64",
	).toString("utf16le");
	expect(script).toContain("Start-Process");
	expect(script).toContain("AISTACK_HOOK_SOURCE=cursor");
	expect(script).toContain("<NUL >NUL 2>&1");
	expect(script).toContain("--prefer-offline");
});
test.each(["linux", "darwin"] as const)(
	"%s shell detaches, discards hook input and uses offline fallback",
	async (os) => {
		const receipt = join(dir, "receipt");
		const npx = join(dir, "npx");
		writeFileSync(
			npx,
			'#!/bin/sh\nread -r ignored || :\nprintf "%s %s\\n" "$AISTACK_HOOK_SOURCE" "$*" >> "$HOOK_TEST_RECEIPT"\ncase "$*" in *latest*) exit 1;; esac\n',
			{ mode: 0o755 },
		);
		const output = execFileSync("sh", ["-c", cursorHookCommand(os)], {
			input: '{"email":"private@example.test"}',
			env: {
				...process.env,
				PATH: `${dir}:${process.env.PATH}`,
				HOOK_TEST_RECEIPT: receipt,
			},
			encoding: "utf8",
			timeout: 2000,
		});
		expect(output).toBe("");
		await expect
			.poll(() => {
				try {
					return readFileSync(receipt, "utf8");
				} catch {
					return "";
				}
			})
			.toBe(
				"cursor -y @use-aistack/cli@latest sync --auto\ncursor -y --prefer-offline @use-aistack/cli sync --auto\n",
			);
	},
);
