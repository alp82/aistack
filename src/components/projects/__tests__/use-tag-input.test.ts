import { act, renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { useTagInput } from "@/components/projects/useTagInput";

describe("useTagInput", () => {
	// TC-A-01
	it("addTag trims whitespace", () => {
		const { result } = renderHook(() => useTagInput([]));
		act(() => result.current.addTag("  react  "));
		expect(result.current.tags).toContain("react");
	});

	// TC-A-02
	it("addTag lowercases input", () => {
		const { result } = renderHook(() => useTagInput([]));
		act(() => result.current.addTag("TypeScript"));
		expect(result.current.tags).toContain("typescript");
	});

	// TC-A-03
	it("addTag dedupes: adding an existing tag keeps length at 1", () => {
		const { result } = renderHook(() => useTagInput(["react"]));
		act(() => result.current.addTag("react"));
		expect(result.current.tags).toHaveLength(1);
	});

	// TC-A-04
	it("addTag with whitespace-only string is a no-op", () => {
		const { result } = renderHook(() => useTagInput([]));
		act(() => result.current.addTag("   "));
		expect(result.current.tags).toHaveLength(0);
	});

	// TC-A-05
	it("addTag with empty string is a no-op", () => {
		const { result } = renderHook(() => useTagInput([]));
		act(() => result.current.addTag(""));
		expect(result.current.tags).toHaveLength(0);
	});

	// TC-A-06
	it("removeTag removes the matched tag and keeps order of remaining", () => {
		const { result } = renderHook(() =>
			useTagInput(["react", "typescript", "nextjs"]),
		);
		act(() => result.current.removeTag("typescript"));
		expect(result.current.tags).toEqual(["react", "nextjs"]);
	});

	// TC-A-07
	it("removeTag with absent tag is a no-op", () => {
		const { result } = renderHook(() => useTagInput(["react"]));
		act(() => result.current.removeTag("vue"));
		expect(result.current.tags).toEqual(["react"]);
	});

	// TC-A-08
	it("reset clears all tags", () => {
		const { result } = renderHook(() => useTagInput(["react", "typescript"]));
		act(() => result.current.reset());
		expect(result.current.tags).toEqual([]);
	});

	// TC-A-09
	it("trim + lowercase + dedupe together: adding '  React  ' when 'react' exists keeps length 1", () => {
		const { result } = renderHook(() => useTagInput(["react"]));
		act(() => result.current.addTag("  React  "));
		expect(result.current.tags).toHaveLength(1);
		expect(result.current.tags[0]).toBe("react");
	});
});
