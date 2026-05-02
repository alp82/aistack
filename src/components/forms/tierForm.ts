export interface TierFormData {
	id: string;
	name: string;
	pricingType: "fixed" | "usage" | "mixed";
	fixedAmount: number;
	fixedPeriod: "month" | "year" | "one_time";
	isDefault: boolean;
}

export function createEmptyTier(isDefault = false): TierFormData {
	return {
		id: crypto.randomUUID(),
		name: "",
		pricingType: "fixed",
		fixedAmount: 0,
		fixedPeriod: "month",
		isDefault,
	};
}
