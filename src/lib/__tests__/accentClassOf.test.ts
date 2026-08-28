import { describe, expect, it } from "vitest";
import { accentClassOf } from "@/lib/accentClassOf";

describe("accentClassOf", () => {
	it("returns the nearest ancestor's accent-<key> class", () => {
		const outer = document.createElement("div");
		outer.className = "accent-teal";
		const inner = document.createElement("div");
		inner.className = "accent-cyan p-2";
		const leaf = document.createElement("span");
		outer.append(inner);
		inner.append(leaf);
		expect(accentClassOf(leaf)).toBe("accent-cyan");
	});

	it("skips a utility class such as hover:text-accent-lime on the way up", () => {
		const wrapper = document.createElement("div");
		wrapper.className = "accent-cyan";
		const link = document.createElement("a");
		link.className = "font-bold hover:text-accent-lime";
		const leaf = document.createElement("span");
		wrapper.append(link);
		link.append(leaf);
		expect(accentClassOf(leaf)).toBe("accent-cyan");
	});

	it("returns undefined when no ancestor carries one", () => {
		const leaf = document.createElement("span");
		document.body.append(leaf);
		expect(accentClassOf(leaf)).toBeUndefined();
		expect(accentClassOf(null)).toBeUndefined();
	});
});
