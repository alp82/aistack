// @vitest-environment jsdom
/**
 * Tests for the useClipboard hook (TC-CB-01..06).
 */
import { act, renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { useClipboard } from "@/lib/useClipboard";

afterEach(() => {
	vi.useRealTimers();
	vi.unstubAllGlobals();
	vi.restoreAllMocks();
});

describe("useClipboard", () => {
	// TC-CB-01: clipboard.writeText resolves → copy() resolves true, copied flips back after 2000ms.
	it("TC-CB-01: writeText resolves → copy() true, copied=true until 2000ms then false; failed stays false", async () => {
		vi.useFakeTimers();
		const writeText = vi.fn().mockResolvedValue(undefined);
		vi.stubGlobal("navigator", { clipboard: { writeText } });

		const { result } = renderHook(() => useClipboard());

		let returnValue: boolean | undefined;
		await act(async () => {
			returnValue = await result.current.copy("hello");
		});

		expect(returnValue).toBe(true);
		expect(result.current.copied).toBe(true);
		expect(result.current.failed).toBe(false);

		// Still true at 1999ms
		await act(async () => {
			vi.advanceTimersByTime(1999);
		});
		expect(result.current.copied).toBe(true);
		expect(result.current.failed).toBe(false);

		// False at exactly 2000ms
		await act(async () => {
			vi.advanceTimersByTime(1);
		});
		expect(result.current.copied).toBe(false);
		expect(result.current.failed).toBe(false);
	});

	// TC-CB-02: writeText rejects AND execCommand returns false → copy() false, failed=true then resets.
	it("TC-CB-02: writeText rejects + execCommand false → copy() false, failed=true until resetMs then false; copied stays false", async () => {
		vi.useFakeTimers();
		const writeText = vi.fn().mockRejectedValue(new Error("denied"));
		vi.stubGlobal("navigator", { clipboard: { writeText } });
		vi.spyOn(document, "execCommand").mockReturnValue(false);

		const { result } = renderHook(() => useClipboard());

		let returnValue: boolean | undefined;
		await act(async () => {
			returnValue = await result.current.copy("hello");
		});

		expect(returnValue).toBe(false);
		expect(result.current.copied).toBe(false);
		expect(result.current.failed).toBe(true);

		// Still failed at resetMs - 1ms
		await act(async () => {
			vi.advanceTimersByTime(1999);
		});
		expect(result.current.copied).toBe(false);
		expect(result.current.failed).toBe(true);

		// Resets to false at exactly resetMs
		await act(async () => {
			vi.advanceTimersByTime(1);
		});
		expect(result.current.copied).toBe(false);
		expect(result.current.failed).toBe(false);
	});

	// TC-CB-03: navigator.clipboard undefined, execCommand returns true → copy() true, timer works.
	it("TC-CB-03: no clipboard API + execCommand true → copy() true, resets after 2000ms; failed stays false", async () => {
		vi.useFakeTimers();
		// Remove clipboard from navigator
		vi.stubGlobal("navigator", {});
		vi.spyOn(document, "execCommand").mockReturnValue(true);

		const { result } = renderHook(() => useClipboard());

		let returnValue: boolean | undefined;
		await act(async () => {
			returnValue = await result.current.copy("hello");
		});

		expect(returnValue).toBe(true);
		expect(result.current.copied).toBe(true);
		expect(result.current.failed).toBe(false);

		await act(async () => {
			vi.advanceTimersByTime(2000);
		});
		expect(result.current.copied).toBe(false);
		expect(result.current.failed).toBe(false);
	});

	// TC-CB-04: writeText rejects, execCommand returns true → copy() true, timer works.
	it("TC-CB-04: writeText rejects + execCommand true → copy() true, resets after resetMs; failed stays false", async () => {
		vi.useFakeTimers();
		const writeText = vi.fn().mockRejectedValue(new Error("denied"));
		vi.stubGlobal("navigator", { clipboard: { writeText } });
		vi.spyOn(document, "execCommand").mockReturnValue(true);

		const { result } = renderHook(() => useClipboard({ resetMs: 2000 }));

		let returnValue: boolean | undefined;
		await act(async () => {
			returnValue = await result.current.copy("hello");
		});

		expect(returnValue).toBe(true);
		expect(result.current.copied).toBe(true);
		expect(result.current.failed).toBe(false);

		await act(async () => {
			vi.advanceTimersByTime(2000);
		});
		expect(result.current.copied).toBe(false);
		expect(result.current.failed).toBe(false);
	});

	// TC-CB-05: unmount before timer fires → no setState-after-unmount console.error.
	it("TC-CB-05: unmount before timer fires produces no console.error", async () => {
		vi.useFakeTimers();
		const writeText = vi.fn().mockResolvedValue(undefined);
		vi.stubGlobal("navigator", { clipboard: { writeText } });

		const consoleSpy = vi.spyOn(console, "error");

		const { result, unmount } = renderHook(() => useClipboard());

		await act(async () => {
			await result.current.copy("hello");
		});

		// Unmount before the 2000ms reset timer fires
		unmount();

		// Advance past the timer
		await act(async () => {
			vi.advanceTimersByTime(3000);
		});

		expect(consoleSpy).not.toHaveBeenCalled();
	});

	// TC-CB-06: resetMs=3000, second copy() resets the timer from scratch.
	it("TC-CB-06: resetMs=3000, second copy() cancels the first timer and starts fresh", async () => {
		vi.useFakeTimers();
		const writeText = vi.fn().mockResolvedValue(undefined);
		vi.stubGlobal("navigator", { clipboard: { writeText } });

		const { result } = renderHook(() => useClipboard({ resetMs: 3000 }));

		// First copy
		await act(async () => {
			await result.current.copy("hello");
		});
		expect(result.current.copied).toBe(true);

		// Advance 1500ms (still within the 3000ms window)
		await act(async () => {
			vi.advanceTimersByTime(1500);
		});
		expect(result.current.copied).toBe(true);

		// Second copy - should restart the timer
		await act(async () => {
			await result.current.copy("hello again");
		});

		// Advance another 1500ms: total 3000ms from first copy, but only 1500ms from second
		await act(async () => {
			vi.advanceTimersByTime(1500);
		});
		// Still true because second copy's 3000ms has not elapsed
		expect(result.current.copied).toBe(true);

		// Advance the remaining 1500ms of the second copy's timer
		await act(async () => {
			vi.advanceTimersByTime(1500);
		});
		expect(result.current.copied).toBe(false);
	});
});
