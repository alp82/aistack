/**
 * Tests for `uploadStagedAvatar` (v3 contract).
 *
 * TC-UP-01 REPLACED: happy path now resolves to a storageId string, not a URL.
 *   getFileUrl is gone from the signature.
 * TC-UP-02 KEPT: throws on !ok (getFileUrl assertion dropped).
 * TC-UP-03 REPLACED: fetch ok but json has no storageId → throws.
 * TC-UP-04 KEPT: isDataUrl predicate unchanged.
 *
 * These tests reference the new signature:
 *   uploadStagedAvatar(dataUrl, { generateUploadUrl, fetch? }) => Promise<string>
 * The old { getFileUrl } dep is gone. Tests will fail (RED) until the
 * implementation is updated to match this contract.
 */
import { describe, expect, it, vi } from "vitest";

import { isDataUrl, uploadStagedAvatar } from "@/lib/uploadStagedAvatar";

// ---------------------------------------------------------------------------
// TC-UP-01: happy path resolves to storageId string (REPLACED)
// ---------------------------------------------------------------------------

describe("uploadStagedAvatar", () => {
	it("TC-UP-01: resolves to the storageId returned by the upload endpoint", async () => {
		const dataUrl = "data:image/jpeg;base64,AAAA";

		const generateUploadUrl = vi
			.fn()
			.mockResolvedValue("https://upload.example.com");
		const mockFetch = vi.fn().mockResolvedValue({
			ok: true,
			json: async () => ({ storageId: "abc123" }),
		});

		const result = await uploadStagedAvatar(dataUrl, {
			generateUploadUrl,
			fetch: mockFetch,
		});

		expect(result).toBe("abc123");
		expect(generateUploadUrl).toHaveBeenCalledTimes(1);
		expect(mockFetch).toHaveBeenCalledWith(
			"https://upload.example.com",
			expect.objectContaining({ method: "POST" }),
		);
		// getFileUrl must NOT be called — it no longer exists in the signature
	});

	// ---------------------------------------------------------------------------
	// TC-UP-02: non-ok fetch response → throws (KEPT)
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

		await expect(
			uploadStagedAvatar(dataUrl, {
				generateUploadUrl,
				fetch: mockFetch,
			}),
		).rejects.toThrow();
	});

	// ---------------------------------------------------------------------------
	// TC-UP-03: fetch ok but json has no storageId → throws (REPLACED)
	// ---------------------------------------------------------------------------

	it("TC-UP-03: throws when response json has no storageId field", async () => {
		const dataUrl = "data:image/jpeg;base64,AAAA";

		const generateUploadUrl = vi
			.fn()
			.mockResolvedValue("https://upload.example.com");
		const mockFetch = vi.fn().mockResolvedValue({
			ok: true,
			// storageId deliberately absent
			json: async () => ({ something: "else" }),
		});

		await expect(
			uploadStagedAvatar(dataUrl, {
				generateUploadUrl,
				fetch: mockFetch,
			}),
		).rejects.toThrow();
	});
});

// ---------------------------------------------------------------------------
// TC-UP-04: data: detection predicate (KEPT, unchanged)
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
