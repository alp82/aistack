import { SITE_URL } from "@/lib/seo";
import type { Board } from "./board";

/**
 * `Dataset` + `ItemList` structured data for `/leaderboard` (#82).
 *
 * Spend is a `PropertyValue` carrying `minValue` AND NO `value` while coverage
 * is under 100%. A consumer that understands `minValue` reports "at least
 * $167,331"; one that does not reports nothing for that row - both outcomes
 * are true. A plain `value` was rejected because it states a figure the
 * visible page refuses to state.
 */

type PropertyValue = {
	"@type": "PropertyValue";
	name: string;
	unitText?: string;
	value?: number;
	minValue?: number;
};

export function leaderboardJsonLd(board: Board) {
	const lastSyncs = board.rows.map((r) => r.lastSyncMs);
	const day = (ms: number) => new Date(ms).toISOString().slice(0, 10);
	const temporalCoverage =
		lastSyncs.length > 0
			? `${day(Math.min(...lastSyncs) - 30 * 24 * 60 * 60 * 1000)}/${day(Math.max(...lastSyncs))}`
			: undefined;

	return {
		"@context": "https://schema.org" as const,
		"@type": "Dataset" as const,
		name: "AI Stack leaderboard - measured tokens over 30 days",
		description:
			`Published AI coding stacks ranked by measured token volume over their ` +
			`rolling 30-day windows, counted on ${board.stackCount} builders' own machines. ` +
			`Windows are offset by up to ${Math.ceil(board.windowSpreadDays)} days. ` +
			`Every spend figure is a lower bound at API list prices.`,
		url: `${SITE_URL}/leaderboard`,
		...(temporalCoverage ? { temporalCoverage } : {}),
		measurementTechnique:
			"local scan of agent session logs, published by each stack's owner",
		creator: {
			"@type": "Organization" as const,
			name: "AI Stack",
			url: SITE_URL,
		},
		mainEntity: {
			"@type": "ItemList" as const,
			itemListOrder: "https://schema.org/ItemListOrderDescending",
			numberOfItems: board.livingCount,
			itemListElement: board.rows.map((row) => {
				const additionalProperty: PropertyValue[] = [
					{
						"@type": "PropertyValue",
						name: "measuredTokens30d",
						value: row.tokens,
					},
				];
				if (row.spend) {
					additionalProperty.push({
						"@type": "PropertyValue",
						name: "apiEquivalentSpendUSD",
						unitText: "USD",
						...(row.spend.exact
							? { value: row.spend.lowerBoundUSD }
							: { minValue: row.spend.lowerBoundUSD }),
					});
				}
				return {
					"@type": "ListItem" as const,
					position: row.rank,
					item: {
						"@type": "Thing" as const,
						name: row.name,
						url: `${SITE_URL}/stacks/${row.slug}`,
						additionalProperty,
					},
				};
			}),
		},
	};
}

/**
 * Serialize for a `<script type="application/ld+json">` block. `<` is escaped
 * so a stack named `</script>…` stays data instead of closing the block.
 */
export function serializeJsonLd(data: unknown): string {
	return JSON.stringify(data).replace(/</g, "\\u003c");
}
