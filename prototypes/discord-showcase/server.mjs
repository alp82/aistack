// PROTOTYPE (alp82/aistack#181). Throwaway.
//
// One process, two jobs:
//   GET  /              the demo page (index.html)
//   POST /interactions  a real Discord interactions endpoint: verifies the
//                       Ed25519 signature on the raw body, answers the PING,
//                       and replies to the slash commands with the payloads
//                       from payloads.mjs. /leaderboard demonstrates the
//                       spec's hosting model: defer, then patch the reply.
//
// Zero dependencies. Ed25519 verification uses node:crypto.
//
// Run:  DISCORD_PUBLIC_KEY=<hex> node server.mjs   (port 9003, host 0.0.0.0)

import { readFileSync } from "node:fs";
import { createServer } from "node:http";
import { createPublicKey, verify } from "node:crypto";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { reply, patchLeaderboard } from "./routing.mjs";

const PORT = Number(process.env.PORT ?? 9003);
const PUBLIC_KEY_HEX = process.env.DISCORD_PUBLIC_KEY ?? "";
const HERE = dirname(fileURLToPath(import.meta.url));

// Raw 32-byte Ed25519 key -> SPKI DER, so node:crypto can load it.
const SPKI_PREFIX = Buffer.from("302a300506032b6570032100", "hex");
const publicKey = PUBLIC_KEY_HEX
	? createPublicKey({
			key: Buffer.concat([SPKI_PREFIX, Buffer.from(PUBLIC_KEY_HEX, "hex")]),
			format: "der",
			type: "spki",
		})
	: null;

function verifySignature(req, rawBody) {
	if (!publicKey) return false;
	const sig = req.headers["x-signature-ed25519"];
	const ts = req.headers["x-signature-timestamp"];
	if (typeof sig !== "string" || typeof ts !== "string") return false;
	try {
		return verify(
			null,
			Buffer.concat([Buffer.from(ts), rawBody]),
			publicKey,
			Buffer.from(sig, "hex")
		);
	} catch {
		return false;
	}
}

const json = (res, status, body) => {
	res.writeHead(status, { "content-type": "application/json" });
	res.end(JSON.stringify(body));
};

createServer((req, res) => {
	if (req.method === "GET") {
		res.writeHead(200, { "content-type": "text/html; charset=utf-8" });
		res.end(readFileSync(join(HERE, "index.html")));
		return;
	}
	if (req.method !== "POST" || !req.url.startsWith("/interactions")) {
		res.writeHead(404);
		res.end();
		return;
	}
	const chunks = [];
	req.on("data", (c) => chunks.push(c));
	req.on("end", () => {
		const rawBody = Buffer.concat(chunks);
		if (!verifySignature(req, rawBody)) {
			console.log("rejected: bad signature");
			json(res, 401, { error: "invalid request signature" });
			return;
		}
		const interaction = JSON.parse(rawBody.toString());
		if (interaction.type === 1) {
			console.log("ping acknowledged");
			json(res, 200, { type: 1 });
			return;
		}
		if (interaction.type === 2) {
			const command = interaction.data?.name;
			console.log(`command: /${command}`);
			if (command === "leaderboard") {
				json(res, 200, { type: 5 });
				patchLeaderboard(interaction).catch((e) => console.log(`patch failed: ${e}`));
				return;
			}
			reply(interaction)
				.then((data) => json(res, 200, { type: 4, data }))
				.catch((e) => {
					console.log(`reply failed: ${e}`);
					json(res, 200, { type: 4, data: { flags: 64, content: "The site did not answer." } });
				});
			return;
		}
		json(res, 200, { type: 4, data: { flags: 64, content: "Unhandled interaction type." } });
	});
}).listen(PORT, "0.0.0.0", () => {
	console.log(`listening on 0.0.0.0:${PORT}, public key ${publicKey ? "set" : "MISSING"}`);
});
