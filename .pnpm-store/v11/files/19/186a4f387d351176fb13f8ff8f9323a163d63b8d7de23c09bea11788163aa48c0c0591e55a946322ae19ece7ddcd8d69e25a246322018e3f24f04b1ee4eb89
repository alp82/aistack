import "#nitro/virtual/polyfills";
import { useNitroApp } from "nitro/app";
import { awsRequest, awsResponseHeaders } from "./_utils.mjs";
const nitroApp = useNitroApp();
export const handler = awslambda.streamifyResponse(async (event, responseStream, context) => {
	const request = awsRequest(event, context);
	const response = await nitroApp.fetch(request);
	const httpResponseMetadata = {
		statusCode: response.status,
		...awsResponseHeaders(response)
	};
	if (!httpResponseMetadata.headers["transfer-encoding"]) {
		httpResponseMetadata.headers["transfer-encoding"] = "chunked";
	}
	const body = response.body ?? new ReadableStream({ start(controller) {
		controller.enqueue("");
		controller.close();
	} });
	const writer = awslambda.HttpResponseStream.from(responseStream, httpResponseMetadata);
	const reader = body.getReader();
	await streamToNodeStream(reader, responseStream);
	writer.end();
});
async function streamToNodeStream(reader, writer) {
	let readResult = await reader.read();
	while (!readResult.done) {
		writer.write(readResult.value);
		readResult = await reader.read();
	}
	writer.end();
}
