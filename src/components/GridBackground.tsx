export function GridBackground() {
	return (
		<div
			className="pointer-events-none fixed inset-0 z-0 opacity-10"
			style={{
				backgroundImage:
					"linear-gradient(to right, var(--stroke-subtle) 1px, transparent 1px), linear-gradient(to bottom, var(--stroke-subtle) 1px, transparent 1px)",
				backgroundSize: "4rem 4rem",
			}}
		/>
	);
}
