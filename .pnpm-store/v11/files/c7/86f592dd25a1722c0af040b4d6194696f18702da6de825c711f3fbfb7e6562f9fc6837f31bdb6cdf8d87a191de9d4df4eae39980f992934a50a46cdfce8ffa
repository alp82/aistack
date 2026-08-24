import "#nitro/virtual/polyfills";
import { useNitroApp } from "nitro/app";
import { awsResponseBody } from "../../aws-lambda/runtime/_utils.mjs";
const nitroApp = useNitroApp();
export const handler = async function(event, context) {
	const req = new Request(event.url, {
		method: event.method || "GET",
		headers: event.headers,
		body: event.body
	});
	
	req.runtime ??= { name: "stormkit" };
	req.runtime.stormkit ??= {
		event,
		context
	};
	const response = await nitroApp.fetch(req);
	const { body, isBase64Encoded } = await awsResponseBody(response);
	return {
		statusCode: response.status,
		headers: normalizeOutgoingHeaders(response.headers),
		[isBase64Encoded ? "buffer" : "body"]: body
	};
};
function normalizeOutgoingHeaders(headers) {
	return Object.fromEntries(Object.entries(headers).map(([k, v]) => [k, Array.isArray(v) ? v.join(",") : String(v)]));
}
