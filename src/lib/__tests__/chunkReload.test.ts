import { describe, expect, it } from "vitest";
import { claimChunkReload, isChunkLoadError } from "@/lib/chunkReload";

function memoryStorage() {
	const map = new Map<string, string>();
	return {
		getItem: (key: string) => map.get(key) ?? null,
		setItem: (key: string, value: string) => {
			map.set(key, value);
		},
	};
}

describe("isChunkLoadError", () => {
	it("matches the browser messages for a missing dynamic import", () => {
		expect(
			isChunkLoadError(
				new TypeError(
					"Failed to fetch dynamically imported module: https://aistack.to/assets/index-B7PJlfTK.js",
				),
			),
		).toBe(true);
		expect(
			isChunkLoadError(new TypeError("Importing a module script failed.")),
		).toBe(true);
		expect(
			isChunkLoadError(
				new TypeError("error loading dynamically imported module: /a.js"),
			),
		).toBe(true);
	});

	it("ignores other errors", () => {
		expect(isChunkLoadError(new Error("Stack not found"))).toBe(false);
		expect(isChunkLoadError(undefined)).toBe(false);
	});
});

describe("claimChunkReload", () => {
	it("allows one reload, then refuses inside the window", () => {
		const storage = memoryStorage();
		expect(claimChunkReload(storage, 1_000)).toBe(true);
		expect(claimChunkReload(storage, 5_000)).toBe(false);
	});

	it("allows another reload once the window has passed", () => {
		const storage = memoryStorage();
		expect(claimChunkReload(storage, 1_000)).toBe(true);
		expect(claimChunkReload(storage, 60_000)).toBe(true);
	});

	it("refuses without storage or when storage throws", () => {
		expect(claimChunkReload(undefined, 1_000)).toBe(false);
		const throwing = {
			getItem: () => {
				throw new Error("blocked");
			},
			setItem: () => {},
		};
		expect(claimChunkReload(throwing, 1_000)).toBe(false);
	});
});
