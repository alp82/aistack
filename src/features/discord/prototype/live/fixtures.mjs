// Throwaway fixtures for real Discord interaction testing. No database reads.
export const PEOPLE = [
	{
		handle: "alice",
		tokens: 9.1,
		usage: 34,
		monthly: 95,
		mix: [30, 40, 20, 10],
		median: 48000,
		harness: 55,
	},
	{
		handle: "bob",
		tokens: 15.8,
		usage: 58,
		monthly: 200,
		mix: [60, 15, 10, 15],
		median: 80000,
		harness: 50,
	},
	{
		handle: "carol",
		tokens: 6.2,
		usage: 24,
		monthly: 75,
		mix: [20, 25, 40, 15],
		median: 56000,
		harness: 80,
	},
];
export const SELF = {
	handle: "you",
	tokens: 12.4,
	usage: 42,
	monthly: 155,
	mix: [45, 25, 12, 18],
	median: 64000,
	harness: 70,
};
export const MODELS = [
	["GPT-5.6 Sol", 45],
	["Claude Opus 5", 25],
	["Claude Fable 5.1", 12],
	["Claude Fable 5", 8],
	["GPT-6 Astra", 5],
	["GPT-5.4", 3],
	["Claude Sonnet 5", 2],
];
export const DEFAULT_MODEL_MIN_SHARE = 5;
export const TOOLS = [
	["Claude Code", 120],
	["Cursor", 20],
	["ChatGPT", 10],
	["Perplexity", 5],
];
export const HARNESS_NAMES = ["Claude Code", "Codex"];
// Existing brand assets already used by the app. Prices and usage stay synthetic.
export const ITEM_ICONS = {
	...Object.fromEntries(
		MODELS.map(([name]) => [
			name,
			name.startsWith("GPT") ? "chatgpt" : "claude",
		]),
	),
	"Claude Code": "claude",
	Codex: "codex",
	Cursor: "cursor",
	ChatGPT: "chatgpt",
	Perplexity: "perplexity",
};
export const COMMAND_NAMES = [
	"tokens",
	"cost",
	"context",
	"harness",
	"compare",
];
export const COMMANDS = COMMAND_NAMES.map((name) => ({
	name,
	description: {
		tokens: "Prototype: your tokens and model usage",
		cost: "Prototype: monthly subscriptions and top three tools",
		context: "Prototype: your context matrix",
		harness: "Prototype: your usage by harness",
		compare: "Prototype: compare tokens, cost, and models with another person",
	}[name],
	type: 1,
	integration_types: [0, 1],
	contexts: [0, 1, 2],
	...(name === "compare"
		? {
				options: [
					{
						name: "person",
						description: "Search a prototype creator: alice, bob, or carol",
						type: 3,
						required: false,
						autocomplete: true,
					},
				],
			}
		: {}),
}));

export function findPeople(query = "") {
	return PEOPLE.filter((person) =>
		person.handle.includes(String(query).trim().toLowerCase()),
	);
}

export function dates(days) {
	const end = new Date();
	const start = new Date(
		Date.UTC(
			end.getUTCFullYear(),
			end.getUTCMonth(),
			end.getUTCDate() - days + 1,
		),
	);
	const format = (date) =>
		date.toLocaleDateString("en-GB", {
			day: "numeric",
			month: "short",
			year: "numeric",
			timeZone: "UTC",
		});
	return `${format(start)} to ${format(end)}`;
}

export function controlRows(state) {
	const id = (action) => `dp:${state.id}:${action}`;
	const profileLink = (label, handle) => ({
		type: 2,
		style: 5,
		label: label.slice(0, 70),
		url: `https://aistack.to/@${encodeURIComponent(handle)}`,
	});
	const button = (label, action, style = 2) => ({
		type: 2,
		label,
		style,
		custom_id: id(action),
	});
	const rows = [
		{
			type: 1,
			components: [
				button(`${state.days} days`, "range"),
				button(state.person ? "Change person" : "Compare", "people", 1),
				...(!state.person &&
				["tokens", "cost"].includes(state.command) &&
				(state.command === "cost" ||
					MODELS.some(([, share]) => share < DEFAULT_MODEL_MIN_SHARE))
					? [
							button(
								state.full
									? state.command === "tokens"
										? "5% and up"
										: "Top three"
									: "Full list",
								"full",
							),
						]
					: []),
				profileLink(
					state.person ? state.requester : "Profile",
					state.profileHandle || SELF.handle,
				),
				...(state.person ? [profileLink(state.person, state.person)] : []),
			],
		},
	];
	if (state.panel === "range")
		rows.push({
			type: 1,
			components: [
				...[1, 7, 30].map((days) => button(`${days} days`, `days-${days}`)),
				button("Custom days", "custom-days"),
			],
		});
	if (state.panel === "people") {
		const people = findPeople(state.search);
		if (people.length)
			rows.push({
				type: 1,
				components: [
					{
						type: 3,
						custom_id: id("person"),
						placeholder: "Choose a person",
						min_values: 1,
						max_values: 1,
						options: people.map(({ handle }) => ({
							label: handle,
							value: handle,
						})),
					},
				],
			});
		rows.push({
			type: 1,
			components: [
				button(
					people.length ? "Search people" : "No matches. Search again",
					"search-person",
				),
			],
		});
	}
	return rows;
}

export function replyPayload(state) {
	const factor = state.days / 7;
	const footer = "PROTOTYPE · synthetic people, measurements, and prices";
	const date = dates(state.days);
	const components = controlRows(state);
	const embed = { color: 0xc5f442, footer: { text: footer } };
	const requester =
		state.requester.replace(/[@*_`~|<>]/g, "").slice(0, 60) || "Requester";
	const usageDisclosure =
		"Price source: prototype-fixture/no-real-prices · 100% of tokens priced";
	if (state.command === "compare" && !state.person) {
		return {
			embeds: [
				{
					...embed,
					title: "Choose a person to compare with",
					description:
						"Try alice, bob, or carol below. These are synthetic creators.",
				},
			],
			components,
		};
	}
	if (state.person || state.command === "context") {
		return {
			embeds: [
				{
					...embed,
					title: state.person
						? `${requester} vs ${state.person}`
						: `${requester}: context per call`,
					description: `${date}${state.person && state.command === "cost" ? "\nCurrent monthly subscriptions" : ""}${state.command === "context" ? "\nDesktop · Claude Code" : ""}`,
					image: { url: "attachment://stats.png" },
					...(state.person && state.command === "compare"
						? {
								footer: { text: `${footer}\n${usageDisclosure} on both sides` },
							}
						: {}),
				},
			],
			components,
		};
	}
	const titles = {
		tokens: `${requester}: ${(SELF.tokens * factor).toFixed(1)}M tokens`,
		cost: `${requester}: $${SELF.monthly} / month`,
		harness: `${requester}: harness usage`,
	};
	return {
		embeds: [
			{
				...embed,
				title: titles[state.command],
				image: { url: "attachment://stats.png" },
				...(state.command === "cost"
					? { footer: { text: `${footer}\n${usageDisclosure}` } }
					: {}),
			},
		],
		components,
	};
}
