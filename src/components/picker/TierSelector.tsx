import { BrutalistToggle } from "../ui/brutalist-toggle";
import { BrutalistSelect } from "../ui/brutalist-select";

type Tier = {
	tierId: string;
	name: string;
};

type TierSelectorProps = {
	tiers: Tier[];
	value: string;
	onChange: (tierId: string) => void;
	size?: "default" | "sm";
	className?: string;
};

export function TierSelector({
	tiers,
	value,
	onChange,
	size = "sm",
	className,
}: TierSelectorProps) {
	if (tiers.length === 0) return null;

	const options = tiers.map((t) => ({ value: t.tierId, label: t.name }));

	if (tiers.length <= 3) {
		return (
			<BrutalistToggle
				options={options}
				value={value}
				onChange={onChange}
				size={size}
				className={className}
			/>
		);
	}

	return (
		<BrutalistSelect
			options={options}
			value={value}
			onChange={onChange}
			size={size}
			placeholder="Select tier"
		/>
	);
}
