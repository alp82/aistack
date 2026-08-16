// @vitest-environment jsdom
/**
 * RED tests for the new `convertToCompactDataUrl` export (TC-IMG-01..04).
 * The implementation does not exist yet - these tests are expected to fail
 * until `convertToCompactDataUrl` is added to src/lib/imageProcessing.ts.
 *
 * TC-IMG-04 also serves as a regression guard for the existing `convertToWebP`.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// The new export will live alongside the existing one.
import { convertToCompactDataUrl, convertToWebP } from "@/lib/imageProcessing";

// ---------------------------------------------------------------------------
// DOM stubs
// ---------------------------------------------------------------------------

// jsdom has no real canvas encoder. Stub toBlob to call its callback with a
// small synthetic Blob so the pipeline can complete.
function stubToBlob(mimeType = "image/jpeg") {
	HTMLCanvasElement.prototype.toBlob = vi.fn(function (
		callback: BlobCallback,
		_type?: string,
		_quality?: number,
	) {
		// Synchronously invoke callback with a minimal blob of the requested type.
		callback(new Blob(["x"], { type: mimeType }));
	});
}

// Stub URL.createObjectURL / revokeObjectURL so loadImage doesn't fail on
// jsdom's lack of Blob URL support. jsdom does not define these at all, so
// we assign mocks directly (vi.spyOn would throw on a missing property).
//
// Also stub HTMLCanvasElement.prototype.getContext: jsdom does not implement
// it (returns null), but the production code guards `if (!ctx) throw ...`.
// We need a real minimal 2D-context stub for the canvas pipeline to complete.
let _originalGetContext: typeof HTMLCanvasElement.prototype.getContext;

beforeEach(() => {
	URL.createObjectURL = vi.fn().mockReturnValue("blob:mock");
	URL.revokeObjectURL = vi.fn();

	_originalGetContext = HTMLCanvasElement.prototype.getContext;
	// biome-ignore lint/suspicious/noExplicitAny: test stub
	(HTMLCanvasElement.prototype as any).getContext = vi.fn().mockReturnValue({
		drawImage: vi.fn(),
	});
});

afterEach(() => {
	HTMLCanvasElement.prototype.getContext = _originalGetContext;
});

// Helper: create an HTMLImageElement that immediately fires onload with the
// given natural dimensions when its `src` is set.
function makeImageStub(naturalWidth: number, naturalHeight: number) {
	const proto = HTMLImageElement.prototype;
	// Intercept Image() constructor via prototype descriptor trick - we patch
	// the `src` setter on instances created during the test.
	const originalDescriptor = Object.getOwnPropertyDescriptor(proto, "src");
	Object.defineProperty(proto, "src", {
		set(this: HTMLImageElement, value: string) {
			// Store the value so img.src reads back correctly.
			Object.defineProperty(this, "naturalWidth", {
				value: naturalWidth,
				configurable: true,
			});
			Object.defineProperty(this, "naturalHeight", {
				value: naturalHeight,
				configurable: true,
			});
			// Schedule onload asynchronously to let the constructor finish.
			Promise.resolve().then(() => {
				if (this.onload) {
					(this.onload as (ev: Event) => void)(new Event("load"));
				}
			});
			if (originalDescriptor?.set) {
				originalDescriptor.set.call(this, value);
			}
		},
		configurable: true,
	});

	// Return a cleanup function to restore the descriptor.
	return () => {
		if (originalDescriptor) {
			Object.defineProperty(proto, "src", originalDescriptor);
		} else {
			// @ts-ignore
			delete proto.src;
		}
	};
}

// ---------------------------------------------------------------------------
// TC-IMG-01 / TC-IMG-02 / TC-IMG-03
// ---------------------------------------------------------------------------

describe("convertToCompactDataUrl", () => {
	it("TC-IMG-01: resolves to a data:image/jpeg;base64, string for an image blob", async () => {
		const restore = makeImageStub(100, 100);
		stubToBlob("image/jpeg");

		// Use FileReader stub: jsdom's FileReader does handle Blob → dataURL but
		// produces a short base64 string; that is sufficient for the prefix check.
		const blob = new Blob(["fake-image-data"], { type: "image/jpeg" });
		const result = await convertToCompactDataUrl(blob);

		expect(typeof result).toBe("string");
		expect(result.startsWith("data:image/jpeg;base64,")).toBe(true);

		restore();
	});

	it("TC-IMG-02: rejects non-image blobs (mirrors convertToWebP guard)", async () => {
		const blob = new Blob(["hello world"], { type: "text/plain" });
		await expect(convertToCompactDataUrl(blob)).rejects.toThrow(
			/not an image/i,
		);
	});

	it("TC-IMG-03: canvas is sized within maxDim when source exceeds it", async () => {
		// Source: 2000x1500, maxDim: 512 → longest edge (2000) maps to 512,
		// height → round(1500 * 512/2000) = 384.
		const restore = makeImageStub(2000, 1500);
		stubToBlob("image/jpeg");

		// Spy on the width/height setters of the canvas element to capture what
		// dimensions were written during the convertToCompactDataUrl call.
		const capturedWidths: number[] = [];
		const capturedHeights: number[] = [];

		const origCreate = document.createElement.bind(document);
		vi.spyOn(document, "createElement").mockImplementation(
			(tag: string, options?: ElementCreationOptions) => {
				const el = origCreate(tag, options);
				if (tag === "canvas") {
					const canvasEl = el as HTMLCanvasElement;
					let _w = 0;
					let _h = 0;
					Object.defineProperty(canvasEl, "width", {
						get: () => _w,
						set: (v: number) => {
							_w = v;
							capturedWidths.push(v);
						},
						configurable: true,
					});
					Object.defineProperty(canvasEl, "height", {
						get: () => _h,
						set: (v: number) => {
							_h = v;
							capturedHeights.push(v);
						},
						configurable: true,
					});
					// getContext is already stubbed by the shared beforeEach;
					// no per-canvas override needed here.
				}
				return el;
			},
		);

		const blob = new Blob(["fake-image-data"], { type: "image/jpeg" });
		await convertToCompactDataUrl(blob, { maxDim: 512 });

		// The canvas must have been sized to fit within 512 on the longest edge.
		const finalWidth = capturedWidths.at(-1) ?? 0;
		const finalHeight = capturedHeights.at(-1) ?? 0;
		expect(finalWidth).toBeLessThanOrEqual(512);
		expect(finalHeight).toBeLessThanOrEqual(512);
		// Aspect ratio preserved: 2000x1500 at 512 maxDim → 512x384.
		expect(finalWidth).toBe(512);
		expect(finalHeight).toBe(384);

		vi.restoreAllMocks(); // restores document.createElement spy; shared prototype stub is restored by afterEach
		restore();
	});

	// TC-IMG-04 is in the next describe block (regression guard for convertToWebP).
});

// ---------------------------------------------------------------------------
// TC-IMG-04: convertToWebP regression guard
// ---------------------------------------------------------------------------

describe("convertToWebP (regression guard)", () => {
	it("TC-IMG-04: still resolves to an image/webp Blob", async () => {
		const restore = makeImageStub(64, 64);
		stubToBlob("image/webp");

		const blob = new Blob(["fake-image-data"], { type: "image/png" });
		const result = await convertToWebP(blob);

		expect(result).toBeInstanceOf(Blob);
		expect(result.type).toBe("image/webp");

		restore();
	});
});
