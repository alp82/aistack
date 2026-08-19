// PROTOTYPE (alp82/aistack#181). Throwaway.
// Registers the five showcase commands on ONE test guild, so they appear
// instantly (global commands can take an hour).
//
// Run: DISCORD_APP_ID=... DISCORD_BOT_TOKEN=... DISCORD_GUILD_ID=... node register.mjs

const { DISCORD_APP_ID, DISCORD_BOT_TOKEN, DISCORD_GUILD_ID } = process.env;
if (!DISCORD_APP_ID || !DISCORD_BOT_TOKEN || !DISCORD_GUILD_ID) {
	console.error("Set DISCORD_APP_ID, DISCORD_BOT_TOKEN, DISCORD_GUILD_ID.");
	process.exit(1);
}

const stackOption = {
	type: 3,
	name: "stack",
	description: "Stack slug, like alpers-agent-stack-unw0sl. Empty: your own stack.",
	required: false,
};

const commands = [
	{ name: "stack", description: "Post a stack card", options: [stackOption] },
	{ name: "tokens", description: "Post the measured numbers for a stack", options: [stackOption] },
	{ name: "leaderboard", description: "Top builders by 30-day token volume" },
	{
		name: "model",
		description: "Adoption and token share for a model",
		options: [
			{ type: 3, name: "model", description: "Model name, like gpt-5.6-sol", required: true },
		],
	},
	{ name: "link", description: "Link your aistack account" },
];

const res = await fetch(
	`https://discord.com/api/v10/applications/${DISCORD_APP_ID}/guilds/${DISCORD_GUILD_ID}/commands`,
	{
		method: "PUT",
		headers: {
			authorization: `Bot ${DISCORD_BOT_TOKEN}`,
			"content-type": "application/json",
		},
		body: JSON.stringify(commands),
	}
);
console.log(res.status, await res.text());
