import { describe, expect, it } from "vitest";
import { leaderboardJsonLd, serializeJsonLd } from "../jsonLd";
import { board, row } from "./fixture";

describe("leaderboard structured data", () => {
	it("wraps an ItemList in a Dataset with the measurement technique", () => {
		const data = leaderboardJsonLd(board());
		expect(data["@type"]).toBe("Dataset");
		expect(data.measurementTechnique).toBe(
			"local scan of agent session logs, published by each stack's owner",
		);
		const list = data.mainEntity;
		expect(list["@type"]).toBe("ItemList");
		expect(list.numberOfItems).toBe(2);
		expect(list.itemListElement[0].position).toBe(1);
		expect(list.itemListElement[0].item.url).toContain("/stacks/orcdev-abc123");
	});

	it("publishes a partially priced spend as minValue, never value", () => {
		const data = leaderboardJsonLd(board());
		const props = data.mainEntity.itemListElement[0].item.additionalProperty;
		const spend = props.find((p) => p.name === "apiEquivalentSpendUSD");
		expect(spend).toMatchObject({ minValue: 167_331 });
		expect(spend).not.toHaveProperty("value");
	});

	it("publishes a fully priced spend as value", () => {
		const data = leaderboardJsonLd(board());
		const props = data.mainEntity.itemListElement[1].item.additionalProperty;
		const spend = props.find((p) => p.name === "apiEquivalentSpendUSD");
		expect(spend).toMatchObject({ value: 6042 });
		expect(spend).not.toHaveProperty("minValue");
	});

	it("omits spend entirely when cost is not published", () => {
		const data = leaderboardJsonLd(board({ rows: [row({ spend: null })] }));
		const props = data.mainEntity.itemListElement[0].item.additionalProperty;
		expect(
			props.find((p) => p.name === "apiEquivalentSpendUSD"),
		).toBeUndefined();
	});

	it("cannot be broken out of with a script-closing stack name", () => {
		const html = serializeJsonLd(
			leaderboardJsonLd(board({ rows: [row({ name: "</script><b>x" })] })),
		);
		expect(html).not.toContain("</script>");
	});
});
