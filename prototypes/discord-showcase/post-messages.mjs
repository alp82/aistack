// PROTOTYPE (alp82/aistack#181). Throwaway.
// Fallback path: post the four PUBLIC message types as plain bot messages to
// a channel. Ephemeral types cannot post this way: they only exist as
// interaction replies, so they need the real slash commands.
//
// Run: DISCORD_BOT_TOKEN=... DISCORD_CHANNEL_ID=... node post-messages.mjs

import { payloads } from "./payloads.mjs";

const { DISCORD_BOT_TOKEN, DISCORD_CHANNEL_ID } = process.env;
if (!DISCORD_BOT_TOKEN || !DISCORD_CHANNEL_ID) {
	console.error("Set DISCORD_BOT_TOKEN and DISCORD_CHANNEL_ID.");
	process.exit(1);
}

for (const name of ["stack", "tokens", "leaderboard", "model"]) {
	const res = await fetch(
		`https://discord.com/api/v10/channels/${DISCORD_CHANNEL_ID}/messages`,
		{
			method: "POST",
			headers: {
				authorization: `Bot ${DISCORD_BOT_TOKEN}`,
				"content-type": "application/json",
			},
			body: JSON.stringify(payloads[name]),
		}
	);
	console.log(name, res.status, res.ok ? "" : await res.text());
}
