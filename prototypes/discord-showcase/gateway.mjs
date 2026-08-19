// PROTOTYPE (alp82/aistack#181). Throwaway.
//
// The second transport: receive interactions over the GATEWAY websocket, an
// OUTBOUND connection, so no public URL is needed. The spec's chosen hosting
// is the Convex interactions endpoint; the gateway here is only transport for
// the showcase, and the rendering in Discord is identical either way.
//
// Zero dependencies: Node 22+ ships a WebSocket client.
//
// Run: DISCORD_BOT_TOKEN=... node gateway.mjs

import { reply, patchLeaderboard } from "./routing.mjs";

const TOKEN = process.env.DISCORD_BOT_TOKEN;
if (!TOKEN) {
	console.error("Set DISCORD_BOT_TOKEN.");
	process.exit(1);
}

async function respond(interaction, data) {
	const url = `https://discord.com/api/v10/interactions/${interaction.id}/${interaction.token}/callback`;
	const res = await fetch(url, {
		method: "POST",
		headers: { "content-type": "application/json" },
		body: JSON.stringify(data),
	});
	console.log(`  callback: ${res.status}${res.ok ? "" : ` ${await res.text()}`}`);
}

function connect() {
	const ws = new WebSocket("wss://gateway.discord.gg/?v=10&encoding=json");
	let heartbeat = null;
	let seq = null;

	ws.addEventListener("message", (event) => {
		const msg = JSON.parse(event.data);
		if (msg.s) seq = msg.s;

		if (msg.op === 10) {
			heartbeat = setInterval(
				() => ws.send(JSON.stringify({ op: 1, d: seq })),
				msg.d.heartbeat_interval
			);
			ws.send(
				JSON.stringify({
					op: 2,
					d: {
						token: TOKEN,
						intents: 0,
						properties: { os: "linux", browser: "showcase", device: "showcase" },
					},
				})
			);
			return;
		}
		if (msg.op === 11) return; // heartbeat ack
		if (msg.t === "READY") {
			console.log(`ready as ${msg.d.user.username}`);
			return;
		}
		if (msg.t === "INTERACTION_CREATE" && msg.d.type === 2) {
			const interaction = msg.d;
			console.log(`command: /${interaction.data?.name}`);
			if (interaction.data?.name === "leaderboard") {
				respond(interaction, { type: 5 }).then(() =>
					patchLeaderboard(interaction).catch((e) => console.log(`patch failed: ${e}`))
				);
				return;
			}
			respond(interaction, { type: 4, data: reply(interaction) });
		}
	});

	ws.addEventListener("close", (event) => {
		clearInterval(heartbeat);
		console.log(`gateway closed (${event.code}), reconnecting in 3s`);
		setTimeout(connect, 3000);
	});
	ws.addEventListener("error", () => {});
}

connect();
