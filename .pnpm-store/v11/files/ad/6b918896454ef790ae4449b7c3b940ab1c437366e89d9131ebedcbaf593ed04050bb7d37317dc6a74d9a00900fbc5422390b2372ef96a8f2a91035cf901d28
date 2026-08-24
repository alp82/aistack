import { InvalidRequest } from "../error.mjs";

//#region src/plugins/oidc-provider/utils/prompt.ts
/**
* Parse space-separated prompt string into a set of prompts
*
* @param prompt
*/
function parsePrompt(prompt) {
	const prompts = prompt.split(" ").map((p) => p.trim());
	const set = /* @__PURE__ */ new Set();
	for (const p of prompts) if (p === "login" || p === "consent" || p === "select_account" || p === "none") set.add(p);
	if (set.has("none") && set.size > 1) throw new InvalidRequest("prompt none must only be used alone");
	return new Set(set);
}

//#endregion
export { parsePrompt };
//# sourceMappingURL=prompt.mjs.map