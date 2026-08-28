import { cleanup, render } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { Dialog } from "@/components/ui/Dialog";

afterEach(cleanup);

describe("Dialog carries the nearest .accent-<key> class into its portal (alp82/aistack#298)", () => {
	it("wraps the portaled overlay in accent-cyan", () => {
		render(
			<div className="accent-cyan">
				<Dialog open onClose={() => {}} title="T">
					<p>body</p>
				</Dialog>
			</div>,
		);
		const dialog = document.body.querySelector('[role="dialog"]');
		expect(dialog?.closest(".accent-cyan")).not.toBeNull();
	});
});
