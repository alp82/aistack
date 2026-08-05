// @vitest-environment jsdom
/**
 * The fun-fact deck (#80's fifteen framings, built by #81).
 *
 * The deck exists to make a token count feel like something, and the whole
 * reason it is allowed to be fun is that it never overstates:
 *
 *   1. EVERY CARD NAMES THE EXACT COUNT and says the dollar figure is not money
 *      spent. A stack that keeps cost private still reads as complete.
 *   2. EVERY CARD STATES ITS ASSUMPTION. Thirteen rest on words per token and
 *      say so; electricity and video rest on something else and carry their own
 *      note instead of borrowing that one.
 *   3. NO CARD CLAIMS A THING WENT UNUSED (#40).
 */
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { TIPS, TokenTip } from "../tokens/TokenTips";

const REAL = 4_709_720_000;

afterEach(cleanup);

describe("every framing in the deck", () => {
	it("names the exact token count and calls the money what it is not", () => {
		for (const { key } of TIPS) {
			cleanup();
			render(<TokenTip tokens={REAL} usd={6026} tip={key} />);
			expect(screen.getByText("4,709,720,000")).toBeInTheDocument();
			expect(screen.getByText("Not money spent.")).toBeInTheDocument();
			expect(
				screen.getByText(/would cost at public list prices/),
			).toBeInTheDocument();
		}
	});

	it("states the assumption it rests on", () => {
		const shared = "rough: about 0.75 words per token.";
		for (const { key } of TIPS) {
			cleanup();
			render(<TokenTip tokens={REAL} usd={6026} tip={key} />);
			if (key === "power") {
				expect(
					screen.getByText(/No vendor publishes a per-token figure/),
				).toBeInTheDocument();
			} else if (key === "video") {
				expect(screen.getByText(/vision math, not words/)).toBeInTheDocument();
			} else {
				expect(screen.getByText(shared)).toBeInTheDocument();
			}
		}
	});

	it("reads as complete on a stack that publishes no cost", () => {
		for (const { key } of TIPS) {
			cleanup();
			render(<TokenTip tokens={REAL} usd={null} tip={key} />);
			expect(document.body.textContent).not.toContain("$");
			expect(
				screen.getByText(/This stack does not publish a cost/),
			).toBeInTheDocument();
		}
	});

	it("never says a listed thing went unused", () => {
		for (const { key } of TIPS) {
			cleanup();
			render(<TokenTip tokens={REAL} usd={6026} tip={key} />);
			const text = (document.body.textContent ?? "").toLowerCase();
			for (const banned of ["not seen", "unused", "never used", "no longer"]) {
				expect(text).not.toContain(banned);
			}
		}
	});
});

describe("the cards the owner judged", () => {
	it("counts the shelf of novels", () => {
		render(<TokenTip tokens={REAL} usd={6026} tip="books" />);
		expect(screen.getByText("39,000 novels")).toBeInTheDocument();
		expect(screen.getByText(/3,300 times over/)).toBeInTheDocument();
	});

	it("reports video as runtime, never as scripts read", () => {
		// The one defect the audit found: converting words into film scripts and
		// then reporting those films' running time changes modality mid-sentence.
		render(<TokenTip tokens={REAL} usd={6026} tip="video" />);
		expect(screen.getByText("486 hours")).toBeInTheDocument();
		expect(screen.getByText("2,691")).toBeInTheDocument();
		expect(document.body.textContent).not.toMatch(/script/i);
	});

	it("holds its shape when a stack has just started measuring", () => {
		for (const { key } of TIPS) {
			cleanup();
			render(<TokenTip tokens={1200} usd={0.04} tip={key} />);
			expect(screen.getByText("1,200")).toBeInTheDocument();
		}
	});
});
