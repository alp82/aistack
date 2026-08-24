import "#nitro/virtual/polyfills";
import { useNitroApp } from "nitro/app";
import { awsRequest, awsResponseHeaders, awsResponseBody } from "./_utils.mjs";
const nitroApp = useNitroApp();
export async function handler(event, context) {
	const request = awsRequest(event, context);
	const response = await nitroApp.fetch(request);
	return {
		statusCode: response.status,
		...awsResponseHeaders(response),
		...await awsResponseBody(response)
	};
}
