// PROTOTYPE (alp82/aistack#181). Throwaway.
// The command routing, shared by both transports (endpoint and gateway).

import { errorUnknownStack, payloads, stackCard } from "./payloads.mjs";

const optionValue = (interaction, name) =>
	interaction.data?.options?.find((o) => o.name === name)?.value;

// The routing a real handler would do, reduced to the showcase cases.
// /stack builds its card from the slug, so any real stack works. /tokens
// carries hardcoded numbers for one stack, because the figures have no
// public per-stack API to read here.
export async function reply(interaction) {
	const command = interaction.data?.name;
	if (command === "stack" || command === "tokens") {
		const slug = optionValue(interaction, "stack");
		if (!slug) return payloads.unlinked;
		if (slug === "empty-stack") return payloads.errorNoData;
		if (command === "stack") return stackCard(slug);
		if (slug === "my-cool-stack") return errorUnknownStack(slug);
		if (slug !== "alpers-agent-stack-unw0sl") {
			return {
				flags: 64,
				content:
					"The prototype carries measured numbers for `alpers-agent-stack-unw0sl` only. The real bot reads any stack.",
			};
		}
		return payloads.tokens;
	}
	if (command === "model") {
		const name = optionValue(interaction, "model");
		if (name === "gpt-9") return payloads.errorUnknownModel;
		return payloads.model;
	}
	if (command === "link") return payloads.link;
	return { flags: 64, content: `Unknown command: ${command}` };
}

// The spec's hosting model: acknowledge inside the 3-second window, compute,
// then patch the original reply through the webhook. /leaderboard walks it.
export async function patchLeaderboard(interaction) {
	await new Promise((r) => setTimeout(r, 1500));
	const url = `https://discord.com/api/v10/webhooks/${interaction.application_id}/${interaction.token}/messages/@original`;
	const res = await fetch(url, {
		method: "PATCH",
		headers: { "content-type": "application/json" },
		body: JSON.stringify(payloads.leaderboard),
	});
	console.log(`patched /leaderboard reply: ${res.status}`);
}
