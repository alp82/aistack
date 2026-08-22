// PROTOTYPE (alp82/aistack#181). Throwaway.
// Writes index.html: the one self-contained demo page. Payload JSON is
// inlined from payloads.mjs, so the page and the bot cannot drift apart.
//
// Run: node gen-demo.mjs

import { writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { payloads } from "./payloads.mjs";

const esc = (s) =>
	s.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");

const sections = [
	{
		key: "stack",
		title: "/stack",
		invoke: "/stack stack:alpers-agent-stack-unw0sl",
		check:
			"The OG card image renders full width. The title links to the stack page. One button below the embed: View stack. The lime bar sits on the left edge.",
		notes:
			"All figures live in the OG image, served by the site. Any real slug works: the card is built from the OG endpoint, and an unknown slug gets the unknown-stack error.",
	},
	{
		key: "tokens",
		title: "/tokens",
		invoke: "/tokens stack:alpers-agent-stack-unw0sl",
		check:
			"Fields lay out in two columns on desktop, one on phones. Numbers sit in monospace (inline code). Footer carries the price-table ids.",
		notes:
			"Tokens, syncs, top model, harnesses, and spend are live leaderboard figures from 2026-08-19. The '10 more models' line is inferred from the stack's model count.",
	},
	{
		key: "leaderboard",
		title: "/leaderboard",
		invoke: "/leaderboard",
		check:
			"This one defers first: Discord shows 'thinking' for about 1.5 seconds, then the embed patches in. That is the spec's hosting model. Rank lines link to each stack.",
		notes: "All four rows and the totals are live figures from 2026-08-19.",
	},
	{
		key: "model",
		title: "/model",
		invoke: "/model model:gpt-5.6-sol",
		check: "Three short inline fields. Does a three-field embed feel too thin as a card?",
		notes:
			"Token share 72% is live. 'Measured on 4' and 'leads 3' are inferred from the ranked rows, not queried.",
	},
	{
		key: "link",
		title: "/link",
		invoke: "/link",
		check:
			"Ephemeral: only you see it. The signed URL shows as plain text plus a button. The URL is a sample, the page does not exist yet, so the button 404s.",
		notes: "Sample token in the URL. Real one would be signed and short-lived.",
	},
	{
		key: "unlinked",
		title: "Unlinked-user prompt",
		invoke: "/tokens   (no argument)",
		check:
			"Ephemeral plain text, no embed. Is plain text right here, or does it need the lime embed frame?",
		notes: "Also fires for /stack with no argument.",
	},
	{
		key: "errorUnknownStack",
		title: "Error: unknown stack",
		invoke: "/tokens stack:my-cool-stack",
		check: "Ephemeral plain text with the corrected example in monospace.",
		notes: "",
	},
	{
		key: "errorUnknownModel",
		title: "Error: unknown model",
		invoke: "/model model:gpt-9",
		check: "Ephemeral plain text.",
		notes: "",
	},
	{
		key: "errorNoData",
		title: "Error: no measured history",
		invoke: "/tokens stack:empty-stack",
		check: "Ephemeral plain text with the CLI pointer.",
		notes: "The slug empty-stack is wired in the prototype server as the no-data case.",
	},
];

const body = sections
	.map(
		(s) => `
<section>
	<h2>${esc(s.title)}</h2>
	<p class="invoke">Type in Discord: <code>${esc(s.invoke)}</code></p>
	<p>${esc(s.check)}</p>
	${s.notes ? `<p class="notes">${esc(s.notes)}</p>` : ""}
	<details><summary>Payload JSON</summary><pre>${esc(
		JSON.stringify(payloads[s.key], null, 2)
	)}</pre></details>
</section>`
	)
	.join("\n");

const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Discord bot message-type showcase</title>
<style>
	:root { color-scheme: dark; }
	* { box-sizing: border-box; border-radius: 0 !important; }
	body { margin: 0; background: #101014; color: #e6e6ea; font: 16px/1.5 system-ui, sans-serif; }
	main { max-width: 720px; margin: 0 auto; padding: 16px; }
	header { border-bottom: 2px solid #a3e635; padding: 16px 0; margin-bottom: 8px; }
	header h1 { font: 700 20px/1.3 ui-monospace, monospace; margin: 0; color: #a3e635; }
	header p { margin: 8px 0 0; color: #9a9aa3; }
	h2 { font: 700 16px/1.3 ui-monospace, monospace; color: #a3e635; margin: 0 0 8px; }
	section { border: 1px solid #2a2a32; padding: 16px; margin: 16px 0; }
	.invoke code { background: #1c1c22; padding: 2px 6px; font-family: ui-monospace, monospace; }
	.notes { color: #9a9aa3; font-size: 14px; }
	details { margin-top: 8px; }
	summary { font-family: ui-monospace, monospace; color: #9a9aa3; cursor: pointer; }
	pre { background: #1c1c22; padding: 12px; overflow-x: auto; font-size: 12px; margin: 8px 0 0; }
	ol { padding-left: 20px; }
	a { color: #a3e635; }
</style>
</head>
<body>
<main>
<header>
	<h1>Ticket alp82/aistack#181 · Discord bot message-type showcase</h1>
	<p>Every message type from <a href="https://github.com/alp82/aistack/blob/main/docs/specs/discord-bot.md">the Discord bot spec</a>, wired as real slash commands on a test guild. This page lists each invocation, what to check in the real rendering, and the exact payload the bot sends. The verdict lands in the ticket resolution.</p>
</header>
<section>
	<h2>How to drive it</h2>
	<p>The commands live on the test guild. Type each invocation below in the test channel. Ephemeral replies show only to you, so you must invoke those yourself. Screenshot each result and attach the set to the ticket.</p>
</section>
${body}
</main>
</body>
</html>
`;

const HERE = dirname(fileURLToPath(import.meta.url));
writeFileSync(join(HERE, "index.html"), html);
console.log("wrote index.html");
