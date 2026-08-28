// PROTOTYPE. THROWAWAY. Ticket #303, round four.
//
// Settled after round three: I's groups (Time, Code, Models, Kit, Sessions)
// and J's layout (a card grid under the tabs). This round varies only what
// happens INSIDE the grid: hierarchy, whitespace, what leads.
//
//   N  Airy: two columns, generous padding, figure large, body far below.
//   P  Lead card: the group's first item is a full-width hero; the rest are
//      smaller three-column cards showing the picture only.
//   Q  Chart first: the body leads, a slim header row holds name and figure.
//   R  Plates: typographic. Numbered, the name as a sentence heading, the
//      figure inline in the caption, body below, no card chrome.
//   S  Strip + cards: flat items collapse into one compact stat strip at the
//      top of the tab; the chart items become three-column cards.

import { useState } from "react";
import { MONO_LABEL } from "@/features/measured/copy";
import { cn } from "@/lib/utils";
import { Shell, TOPIC, type VariantProps } from "./RoundThree";
import { Delta } from "./shared";

// N ------------------------------------------------------------------------

export const VariantN = {
	name: "Airy cards",
	Component: function N(props: VariantProps) {
		return (
			<Shell {...props} groups={TOPIC}>
				{(items) => (
					<div className="grid gap-6 md:grid-cols-2">
						{items.map((it) => (
							<div
								key={it.id}
								className="border border-stroke-subtle bg-bg-canvas p-8 md:p-10"
							>
								<p className={cn(MONO_LABEL, "text-fg-muted")}>{it.name}</p>
								<p className="mt-4 font-mono text-[56px] font-black leading-none text-accent-lime">
									{it.figure}
								</p>
								<p className="mt-3 max-w-[36ch] text-base text-fg-secondary">
									{it.caption}
								</p>
								{it.delta !== null && (
									<p className="mt-2">
										<Delta value={it.delta} window={props.p.window} />
									</p>
								)}
								{(it.body || it.picture(true)) && (
									<div className="mt-10">
										{it.body ? it.body() : it.picture(true)}
									</div>
								)}
							</div>
						))}
					</div>
				)}
			</Shell>
		);
	},
};

// P ------------------------------------------------------------------------

export const VariantP = {
	name: "Lead card + minor cards",
	Component: function P(props: VariantProps) {
		return (
			<Shell {...props} groups={TOPIC}>
				{(items) => {
					const [lead, ...rest] = items;
					if (!lead) return null;
					return (
						<div>
							<div className="grid gap-10 border border-stroke-subtle bg-bg-canvas p-8 md:grid-cols-[minmax(0,20rem)_1fr]">
								<div>
									<p className={cn(MONO_LABEL, "text-accent-lime")}>
										{lead.name}
									</p>
									<p className="mt-3 font-mono text-[64px] font-black leading-none text-fg-primary">
										{lead.figure}
									</p>
									<p className="mt-3 text-base text-fg-secondary">
										{lead.caption}
									</p>
									{lead.delta !== null && (
										<p className="mt-2">
											<Delta value={lead.delta} window={props.p.window} />
										</p>
									)}
								</div>
								<div className="self-center">
									{lead.body ? lead.body() : lead.picture(true)}
								</div>
							</div>
							<div className="mt-6 grid gap-px border border-stroke-subtle bg-stroke-subtle md:grid-cols-3">
								{rest.map((it) => (
									<div key={it.id} className="bg-bg-canvas p-5">
										<p className={cn(MONO_LABEL, "text-fg-muted")}>{it.name}</p>
										<p className="mt-2 flex items-baseline gap-2">
											<span className="font-mono text-2xl font-black text-accent-lime">
												{it.figure}
											</span>
											<span className="text-[13px] text-fg-secondary">
												{it.caption}
											</span>
										</p>
										<div className="mt-4">{it.picture(true)}</div>
									</div>
								))}
							</div>
						</div>
					);
				}}
			</Shell>
		);
	},
};

// Q ------------------------------------------------------------------------

export const VariantQ = {
	name: "Chart first, slim header",
	Component: function Q(props: VariantProps) {
		return (
			<Shell {...props} groups={TOPIC}>
				{(items) => (
					<div className="grid gap-px border border-stroke-subtle bg-stroke-subtle md:grid-cols-2">
						{items.map((it) => (
							<div key={it.id} className="bg-bg-canvas">
								<div className="flex items-baseline justify-between gap-4 border-b border-stroke-subtle px-5 py-3">
									<span className="text-sm text-fg-primary">{it.name}</span>
									<span className="font-mono text-sm text-fg-secondary">
										<span className="font-black text-accent-lime">
											{it.figure}
										</span>{" "}
										{it.caption}
									</span>
								</div>
								<div className="p-5">
									{it.body ? (
										it.body()
									) : (
										<div className="flex items-center justify-between gap-4">
											<p className="font-mono text-4xl font-black text-fg-primary">
												{it.figure}
											</p>
											{it.delta !== null && (
												<Delta value={it.delta} window={props.p.window} />
											)}
										</div>
									)}
								</div>
							</div>
						))}
					</div>
				)}
			</Shell>
		);
	},
};

// R ------------------------------------------------------------------------

export const VariantR = {
	name: "Typographic plates, no chrome",
	Component: function R(props: VariantProps) {
		return (
			<Shell {...props} groups={TOPIC}>
				{(items) => (
					<div className="grid gap-x-16 gap-y-14 md:grid-cols-2">
						{items.map((it, i) => (
							<div key={it.id} className="grid grid-cols-[3rem_1fr] gap-4">
								<span className="font-mono text-2xl font-black leading-none text-stroke-strong">
									{String(i + 1).padStart(2, "0")}
								</span>
								<div>
									<h3 className="text-xl font-semibold leading-tight text-fg-primary">
										{it.name}
									</h3>
									<p className="mt-2 text-base leading-relaxed text-fg-secondary">
										<span className="font-mono font-black text-accent-lime">
											{it.figure}
										</span>{" "}
										{it.caption}
										{it.delta !== null && (
											<>
												{" "}
												<Delta value={it.delta} window={props.p.window} />
											</>
										)}
									</p>
									{(it.body || it.picture(true)) && (
										<div className="mt-6">
											{it.body ? it.body() : it.picture(true)}
										</div>
									)}
								</div>
							</div>
						))}
					</div>
				)}
			</Shell>
		);
	},
};

// S ------------------------------------------------------------------------

export const VariantS = {
	name: "Stat strip + chart cards",
	Component: function S(props: VariantProps) {
		const [open, setOpen] = useState<string | null>(null);
		return (
			<Shell {...props} groups={TOPIC}>
				{(items) => {
					const flat = items.filter((it) => !it.body);
					const charts = items.filter((it) => !!it.body);
					const openItem = charts.find((it) => it.id === open);
					return (
						<div>
							{flat.length > 0 && (
								<div
									className="grid grid-cols-2 gap-px border border-stroke-subtle bg-stroke-subtle md:grid-cols-4"
									style={{
										gridTemplateColumns: `repeat(${Math.min(4, flat.length)}, minmax(0, 1fr))`,
									}}
								>
									{flat.map((it) => (
										<div key={it.id} className="bg-bg-canvas px-4 py-4">
											<p className="font-mono text-2xl font-black text-fg-primary">
												{it.figure}
											</p>
											<p className={cn(MONO_LABEL, "mt-1 text-fg-muted")}>
												{it.name}
											</p>
											<p className="mt-1 text-[12px] text-fg-secondary">
												{it.caption}
											</p>
										</div>
									))}
								</div>
							)}
							<div className="mt-6 grid gap-6 md:grid-cols-3">
								{charts.map((it) => {
									const on = open === it.id;
									return (
										<button
											key={it.id}
											type="button"
											aria-expanded={on}
											onClick={() => setOpen(on ? null : it.id)}
											className={cn(
												"border p-6 text-left",
												on
													? "border-accent-lime bg-bg-panel/70"
													: "border-stroke-subtle bg-bg-canvas hover:border-stroke-strong",
											)}
										>
											<p className={cn(MONO_LABEL, "text-fg-muted")}>
												{it.name}
											</p>
											<p className="mt-3 font-mono text-4xl font-black leading-none text-accent-lime">
												{it.figure}
											</p>
											<p className="mt-2 text-sm text-fg-secondary">
												{it.caption}
											</p>
											<div className="mt-6">{it.picture(true)}</div>
										</button>
									);
								})}
							</div>
							{openItem && (
								<div className="mt-6 border border-stroke-subtle bg-bg-canvas p-8">
									<p className="mb-4 text-sm text-fg-primary">
										{openItem.name}
									</p>
									{openItem.body?.()}
								</div>
							)}
						</div>
					);
				}}
			</Shell>
		);
	},
};
