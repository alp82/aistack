export type BillingPeriod = "month" | "year" | "one_time";
export type PriceRoundingMode = "round" | "floor" | "exact";

export type FixedPrice = {
	amount: number;
	period: BillingPeriod;
	currency?: string;
};

function normalizeBillingPeriod(
	period?: BillingPeriod | string,
): BillingPeriod {
	if (period === "year" || period === "one_time") {
		return period;
	}

	return "month";
}

export function getNormalizedMonthlyAmount(price?: FixedPrice | null): number {
	if (!price) {
		return 0;
	}

	switch (normalizeBillingPeriod(price.period)) {
		case "month":
			return price.amount;
		case "year":
			return price.amount / 12;
		case "one_time":
			return 0;
		default:
			return 0;
	}
}

export function sumNormalizedMonthlyAmounts(
	prices: Array<FixedPrice | null | undefined>,
): number {
	return prices.reduce(
		(total, price) => total + getNormalizedMonthlyAmount(price),
		0,
	);
}

function applyPriceRounding(
	amount: number,
	rounding: PriceRoundingMode,
): number {
	if (rounding === "exact") {
		return Number(amount.toFixed(2));
	}

	if (rounding === "floor") {
		return Math.floor(amount);
	}

	return Math.round(amount);
}

export function getDisplayPrice(
	amount: number,
	period: BillingPeriod | string = "month",
) {
	const normalizedPeriod = normalizeBillingPeriod(period);

	if (normalizedPeriod === "one_time") {
		return {
			amount,
			suffix: "/once",
		};
	}

	if (normalizedPeriod === "year") {
		return {
			amount: amount / 12,
			suffix: "/mo",
		};
	}

	return {
		amount,
		suffix: "/mo",
	};
}

export function formatPriceAmount(amount: number): string {
	const rounded = Number(amount.toFixed(2));

	if (Number.isInteger(rounded)) {
		return String(rounded);
	}

	return rounded
		.toFixed(2)
		.replace(/\.0+$/, "")
		.replace(/(\.\d*[1-9])0+$/, "$1");
}

export function formatPriceDisplay(
	amount: number,
	period: BillingPeriod | string = "month",
	rounding: PriceRoundingMode = "round",
) {
	const display = getDisplayPrice(amount, period);
	const roundedAmount = applyPriceRounding(display.amount, rounding);

	return {
		amount: roundedAmount,
		amountText: formatPriceAmount(roundedAmount),
		suffix: display.suffix,
	};
}

export type SortableTool = {
	name: string;
	priceKind: "regular" | "discounted" | "bundle" | "usage_based" | "sponsored";
	price: {
		fixed?: { amount: number; period: "month" | "year" | "one_time" } | null;
	};
	originalTierPrice?: {
		amount: number;
		period: "month" | "year" | "one_time";
	} | null;
};

export function sortToolsByPrice<T extends SortableTool>(tools: T[]): T[] {
	return [...tools].sort((a, b) => {
		// The price the owner set wins: an overwritten tier price is the real
		// price. The tier's list price only speaks when no price is set.
		const sortPrice = (t: SortableTool) =>
			getNormalizedMonthlyAmount(t.price.fixed ?? t.originalTierPrice);

		const groupOrder = (t: SortableTool) => {
			if (t.priceKind === "bundle") return 1;
			if (sortPrice(t) > 0) return 0;
			return 2;
		};

		const groupA = groupOrder(a);
		const groupB = groupOrder(b);
		if (groupA !== groupB) return groupA - groupB;
		if (groupA === 0) {
			const diff = sortPrice(b) - sortPrice(a);
			if (diff !== 0) return diff;
		}
		return a.name.localeCompare(b.name);
	});
}

export function orderToolsForDisplay<
	T extends SortableTool & { kind: "main" | "misc" },
>(tools: T[]): T[] {
	const main = tools.filter((t) => t.kind === "main");
	const misc = tools.filter((t) => t.kind === "misc");
	return [...sortToolsByPrice(main), ...sortToolsByPrice(misc)];
}

export function formatPricingSummary(
	fixedTotal?: FixedPrice | null,
	hasUsageComponent = false,
): string {
	if (fixedTotal) {
		const display = formatPriceDisplay(fixedTotal.amount, "month", "floor");
		return `$${display.amountText}${display.suffix}${hasUsageComponent ? " + usage" : ""}`;
	}

	if (hasUsageComponent) {
		return "usage-based pricing";
	}

	return "free";
}
