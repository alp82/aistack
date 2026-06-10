// By-tag accent: stable color per project, hashed from its first tag

export type Accent = { text: string; bg: string; border: string };

export const TAG_PALETTE: Accent[] = [
	{ text: "text-cyan-400", bg: "bg-cyan-500/10", border: "border-cyan-500/40" },
	{
		text: "text-violet-400",
		bg: "bg-violet-500/10",
		border: "border-violet-500/40",
	},
	{
		text: "text-amber-400",
		bg: "bg-amber-500/10",
		border: "border-amber-500/40",
	},
	{ text: "text-rose-400", bg: "bg-rose-500/10", border: "border-rose-500/40" },
	{
		text: "text-emerald-400",
		bg: "bg-emerald-500/10",
		border: "border-emerald-500/40",
	},
	{ text: "text-sky-400", bg: "bg-sky-500/10", border: "border-sky-500/40" },
];

export function accentFor(key: string): Accent {
	let h = 0;
	for (let i = 0; i < key.length; i++) h = (h * 31 + key.charCodeAt(i)) >>> 0;
	return TAG_PALETTE[h % TAG_PALETTE.length];
}
