// PROTOTYPE (alp82/aistack#181). Throwaway.
// Removes every showcase command from the test guild. The app, the bot user,
// and the install stay untouched.
//
// Run: DISCORD_APP_ID=... DISCORD_BOT_TOKEN=... DISCORD_GUILD_ID=... node clear-commands.mjs

const { DISCORD_APP_ID, DISCORD_BOT_TOKEN, DISCORD_GUILD_ID } = process.env;
if (!DISCORD_APP_ID || !DISCORD_BOT_TOKEN || !DISCORD_GUILD_ID) {
	console.error("Set DISCORD_APP_ID, DISCORD_BOT_TOKEN, DISCORD_GUILD_ID.");
	process.exit(1);
}

const res = await fetch(
	`https://discord.com/api/v10/applications/${DISCORD_APP_ID}/guilds/${DISCORD_GUILD_ID}/commands`,
	{
		method: "PUT",
		headers: {
			authorization: `Bot ${DISCORD_BOT_TOKEN}`,
			"content-type": "application/json",
		},
		body: JSON.stringify([]),
	}
);
console.log(res.status, await res.text());
