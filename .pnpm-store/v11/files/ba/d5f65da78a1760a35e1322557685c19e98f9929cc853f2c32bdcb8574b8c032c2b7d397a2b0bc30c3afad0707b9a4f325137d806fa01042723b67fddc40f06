import "#nitro/virtual/polyfills";
import { parseURL } from "ufo";
import { useNitroApp } from "nitro/app";
import { getAzureParsedCookiesFromHeaders } from "./_utils.mjs";
const nitroApp = useNitroApp();
export async function handle(context, req) {
	let url;
	if (req.headers["x-ms-original-url"]) {
		
		const parsedURL = parseURL(req.headers["x-ms-original-url"]);
		url = parsedURL.pathname + parsedURL.search;
	} else {
		
		
		url = "/api/" + (req.params.url || "");
	}
	const request = new Request(url, {
		method: req.method || undefined,
		
		
		body: req.bufferBody ?? req.rawBody
	});
	const response = await nitroApp.fetch(request);
	
	
	context.res = {
		status: response.status,
		body: response.body,
		cookies: getAzureParsedCookiesFromHeaders(response.headers),
		headers: Object.fromEntries([...response.headers.entries()].filter(([key]) => key !== "set-cookie"))
	};
}
