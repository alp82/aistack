import { stringifyQuery } from "ufo";

export function awsRequest(event, context) {
	const method = awsEventMethod(event);
	const url = awsEventURL(event);
	const headers = awsEventHeaders(event);
	const body = awsEventBody(event);
	const req = new Request(url, {
		method,
		headers,
		body
	});
	
	req.runtime ??= { name: "aws-lambda" };
	// @ts-expect-error (add to srvx types)
	req.runtime.aws ??= {
		event,
		context
	};
	return new Request(url, {
		method,
		headers,
		body
	});
}
function awsEventMethod(event) {
	return event.httpMethod || event.requestContext?.http?.method || "GET";
}
function awsEventURL(event) {
	const hostname = event.headers.host || event.headers.Host || event.requestContext?.domainName || ".";
	const path = event.path || event.rawPath;
	const query = awsEventQuery(event);
	const protocol = (event.headers["X-Forwarded-Proto"] || event.headers["x-forwarded-proto"]) === "http" ? "http" : "https";
	return new URL(`${path}${query ? `?${query}` : ""}`, `${protocol}://${hostname}`);
}
function awsEventQuery(event) {
	if (typeof event.rawQueryString === "string") {
		return event.rawQueryString;
	}
	const queryObj = {
		...event.queryStringParameters,
		...event.multiValueQueryStringParameters
	};
	return stringifyQuery(queryObj);
}
function awsEventHeaders(event) {
	const headers = new Headers();
	for (const [key, value] of Object.entries(event.headers)) {
		if (value) {
			headers.set(key, value);
		}
	}
	if ("cookies" in event && event.cookies) {
		for (const cookie of event.cookies) {
			headers.append("cookie", cookie);
		}
	}
	return headers;
}
function awsEventBody(event) {
	if (!event.body) {
		return undefined;
	}
	if (event.isBase64Encoded) {
		return Buffer.from(event.body || "", "base64");
	}
	return event.body;
}

export function awsResponseHeaders(response) {
	const headers = Object.create(null);
	for (const [key, value] of response.headers) {
		if (value) {
			headers[key] = Array.isArray(value) ? value.join(",") : String(value);
		}
	}
	const cookies = response.headers.getSetCookie();
	return cookies.length > 0 ? {
		headers,
		cookies,
		multiValueHeaders: { "set-cookie": cookies }
	} : { headers };
}



export async function awsResponseBody(response) {
	if (!response.body) {
		return { body: "" };
	}
	const buffer = await toBuffer(response.body);
	const contentType = response.headers.get("content-type") || "";
	return isTextType(contentType) ? { body: buffer.toString("utf8") } : {
		body: buffer.toString("base64"),
		isBase64Encoded: true
	};
}
function isTextType(contentType = "") {
	return /^text\/|\/(javascript|json|xml)|utf-?8/i.test(contentType);
}
function toBuffer(data) {
	return new Promise((resolve, reject) => {
		const chunks = [];
		data.pipeTo(new WritableStream({
			write(chunk) {
				chunks.push(chunk);
			},
			close() {
				resolve(Buffer.concat(chunks));
			},
			abort(reason) {
				reject(reason);
			}
		})).catch(reject);
	});
}
