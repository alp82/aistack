/**
 * RED tests for the new `uploadStagedAvatar` helper (TC-UP-01..04).
 * The implementation does not exist yet — these tests are expected to fail
 * at import time until `src/lib/uploadStagedAvatar.ts` is created.
 *
 * TC-UP-04 cannot be cleanly isolated as a pure unit without extracting a
 * tiny detection predicate from handleSave. It is covered here as a trivial
 * string-check case; if the implementer does not extract it as a separate
 * export, TC-UP-04 should be verified manually.
 */
import { describe, expect, it, vi } from "vitest";

// The helper to be extracted. Import will fail (RED) until the file exists.
import { isDataUrl, uploadStagedAvatar } from "@/lib/uploadStagedAvatar";

// ---------------------------------------------------------------------------
// TC-UP-01: happy path
// ---------------------------------------------------------------------------

describe("uploadStagedAvatar", () => {
	it("TC-UP-01: resolves to the storage URL returned by getFileUrl", async () => {
		const dataUrl = "data:image/jpeg;base64,AAAA";

		const generateUploadUrl = vi
			.fn()
			.mockResolvedValue("https://upload.example.com");
		const mockFetch = vi.fn().mockResolvedValue({
			ok: true,
			json: async () => ({ storageId: "s1" }),
		});
		const getFileUrl = vi
			.fn()
			.mockResolvedValue("https://storage.example.com/s1");

		const result = await uploadStagedAvatar(dataUrl, {
			generateUploadUrl,
			getFileUrl,
			fetch: mockFetch,
		});

		expect(result).toBe("https://storage.example.com/s1");
		expect(generateUploadUrl).toHaveBeenCalledTimes(1);
		expect(mockFetch).toHaveBeenCalledWith(
			"https://upload.example.com",
			expect.objectContaining({ method: "POST" }),
		);
		expect(getFileUrl).toHaveBeenCalledWith({ storageId: "s1" });
	});

	// ---------------------------------------------------------------------------
	// TC-UP-02: non-ok fetch response → throws
	// ---------------------------------------------------------------------------

	it("TC-UP-02: throws when the upload fetch responds with !ok", async () => {
		const dataUrl = "data:image/jpeg;base64,AAAA";

		const generateUploadUrl = vi
			.fn()
			.mockResolvedValue("https://upload.example.com");
		const mockFetch = vi.fn().mockResolvedValue({
			ok: false,
			json: async () => ({}),
		});
		const getFileUrl = vi.fn();

		await expect(
			uploadStagedAvatar(dataUrl, {
				generateUploadUrl,
				getFileUrl,
				fetch: mockFetch,
			}),
		).rejects.toThrow();

		// getFileUrl must NOT have been called — image must not be silently dropped.
		expect(getFileUrl).not.toHaveBeenCalled();
	});

	// ---------------------------------------------------------------------------
	// TC-UP-03: getFileUrl returns null/falsy → throws
	// ---------------------------------------------------------------------------

	it("TC-UP-03: throws when getFileUrl returns a falsy URL", async () => {
		const dataUrl = "data:image/jpeg;base64,AAAA";

		const generateUploadUrl = vi
			.fn()
			.mockResolvedValue("https://upload.example.com");
		const mockFetch = vi.fn().mockResolvedValue({
			ok: true,
			json: async () => ({ storageId: "s2" }),
		});
		const getFileUrl = vi.fn().mockResolvedValue(null);

		await expect(
			uploadStagedAvatar(dataUrl, {
				generateUploadUrl,
				getFileUrl,
				fetch: mockFetch,
			}),
		).rejects.toThrow();
	});
});

// ---------------------------------------------------------------------------
// TC-UP-04: data: detection predicate
// A non-data-URL should NOT be treated as a staged avatar and must be left
// untouched. This is expressed here as a unit on the exported `isDataUrl`
// predicate that the implementer should extract from handleSave's detection
// branch. If `isDataUrl` is not exported separately, this test fails at import
// (RED) and the implementer is guided to extract it. Manual verification note:
// the handleSave integration (guest → sign-in → persist round-trip) remains
// a manual test because it requires auth + full-page navigation + Convex.
// ---------------------------------------------------------------------------

describe("isDataUrl", () => {
	it("TC-UP-04: returns true only for data: scheme strings", () => {
		expect(isDataUrl("data:image/jpeg;base64,AAAA")).toBe(true);
		expect(isDataUrl("data:image/png;base64,iVBOR")).toBe(true);
		expect(isDataUrl("https://storage.convex.cloud/abc")).toBe(false);
		expect(isDataUrl("https://example.com/avatar.jpg")).toBe(false);
		expect(isDataUrl("")).toBe(false);
	});
});
