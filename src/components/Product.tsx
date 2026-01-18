import { Plus } from "lucide-react";
import { categoryConfig, type ProductCategory } from "@/config/categoryConfig";
import { cn } from "@/lib/utils";

interface ProductProps {
	logo: string;
	name: string;
	category: ProductCategory;
	avgCost: number;
	pros: string[];
	cons: string[];
	height: number;
}

export function Product({
	logo,
	name,
	category,
	avgCost,
	pros,
	cons,
	height,
}: ProductProps) {
	const config = categoryConfig[category as keyof typeof categoryConfig];
	const Icon = config?.icon || Plus;

	return (
		<div
			className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer group"
			style={{ height: `${height}px` }}
		>
			<div className="flex items-start gap-3">
				<img
					src={logo}
					alt={name}
					className="w-10 h-10 rounded-lg flex-shrink-0"
				/>
				<div className="flex-1 min-w-0">
					<h3 className="font-semibold text-gray-900 text-sm group-hover:text-cyan-600 transition-colors">
						{name}
					</h3>
					<div className="flex items-center gap-2 mt-1">
						<span
							className={cn(
								"inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium",
								config?.bgColor || "bg-gray-100",
								config?.textColor || "text-gray-700",
							)}
						>
							<Icon className="h-3 w-3" />
							{config?.label || category}
						</span>
					</div>
				</div>
				<div className="text-right">
					<span className="text-lg font-bold text-gray-900">${avgCost}</span>
					<span className="text-xs text-gray-500 block">/mo</span>
				</div>
			</div>

			<div className="mt-4 space-y-3">
				{pros.length > 0 && (
					<div className="text-sm">
						<p className="font-medium text-green-700 mb-1">Pros:</p>
						<ul className="space-y-1">
							{pros.slice(0, 4).map((pro, index) => (
								<li
									key={index}
									className="text-green-600 text-xs flex items-start"
								>
									<span className="text-green-500 mr-1">+</span>
									{pro}
								</li>
							))}
						</ul>
					</div>
				)}

				{cons.length > 0 && (
					<div className="text-sm">
						<p className="font-medium text-red-700 mb-1">Cons:</p>
						<ul className="space-y-1">
							{cons.slice(0, 4).map((con, index) => (
								<li
									key={index}
									className="text-red-600 text-xs flex items-start"
								>
									<span className="text-red-500 mr-1">-</span>
									{con}
								</li>
							))}
						</ul>
					</div>
				)}
			</div>
		</div>
	);
}
