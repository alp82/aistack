function createBodyTooLargeError(maxRequestBodySize) {
	return Object.assign(/* @__PURE__ */ new Error(`Request body exceeds the maximum allowed size of ${maxRequestBodySize} bytes.`), {
		code: "ERR_BODY_TOO_LARGE",
		statusCode: 413,
		status: 413
	});
}
function limitBodyStream(stream, maxRequestBodySize) {
	const reader = stream.getReader();
	let size = 0;
	return new ReadableStream({
		async pull(controller) {
			const { done, value } = await reader.read();
			if (done) {
				controller.close();
				return;
			}
			size += value.byteLength;
			if (size > maxRequestBodySize) {
				const error = createBodyTooLargeError(maxRequestBodySize);
				reader.cancel(error).catch(() => {});
				controller.error(error);
				return;
			}
			controller.enqueue(value);
		},
		cancel(reason) {
			return reader.cancel(reason);
		}
	});
}
function limitRequestBody(request, maxRequestBodySize) {
	if (!request.body) return request;
	return new Request(request, {
		body: limitBodyStream(request.body, maxRequestBodySize),
		duplex: "half"
	});
}
export { createBodyTooLargeError, limitBodyStream, limitRequestBody };
