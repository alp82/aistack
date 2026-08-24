import { HTTPError } from "h3";
import { getRequestURL } from "h3";
import { readFile } from "node:fs/promises";
import { resolve, dirname } from "node:path";
import consola from "consola";
import { defineNitroErrorHandler } from "./utils.mjs";
import { FastResponse } from "srvx";
const errorHandler = defineNitroErrorHandler(async function defaultNitroErrorHandler(error, event) {
	const res = await defaultHandler(error, event);
	return new FastResponse(typeof res.body === "string" ? res.body : JSON.stringify(res.body, null, 2), res);
});
export default errorHandler;
export async function defaultHandler(error, event, opts) {
	const unhandled = error.unhandled ?? !HTTPError.isError(error);
	const { status = 500, statusText = "" } = unhandled ? {} : error;
	const url = getRequestURL(event, {
		xForwardedHost: true,
		xForwardedProto: true
	});
	
	if (status === 404) {
		const baseURL = import.meta.baseURL || "/";
		if (/^\/[^/]/.test(baseURL) && !url.pathname.startsWith(baseURL)) {
			return {
				status: 302,
				statusText: "Found",
				headers: new Headers({ location: `${baseURL}${url.pathname.slice(1)}${url.search}` }),
				body: `Redirecting...`
			};
		}
	}
	
	await loadStackTrace(error).catch(consola.error);
	const { Youch } = await import("youch");
	
	const youch = new Youch();
	
	if (unhandled && !opts?.silent) {
		const ansiError = (await youch.toANSI(error)).replaceAll(process.cwd(), ".");
		consola.error(`[request error] [${event.req.method}] ${url}\n\n`, ansiError);
	}
	
	const useJSON = opts?.json ?? !event.req.headers.get("accept")?.includes("text/html");
	const headers = new Headers(unhandled ? {} : error.headers);
	if (useJSON) {
		headers.set("Content-Type", "application/json; charset=utf-8");
		const jsonBody = typeof error.toJSON === "function" ? error.toJSON() : {
			status,
			statusText,
			message: error.message
		};
		return {
			status,
			statusText,
			headers,
			body: {
				error: true,
				stack: error.stack?.split("\n").map((line) => line.trim()),
				...jsonBody
			}
		};
	}
	
	headers.set("Content-Type", "text/html; charset=utf-8");
	return {
		status,
		statusText: unhandled ? "" : error.statusText,
		headers,
		body: await youch.toHTML(error, { request: {
			url: url.href,
			method: event.req.method,
			headers: Object.fromEntries(event.req.headers.entries())
		} })
	};
}

export async function loadStackTrace(error) {
	if (!(error instanceof Error)) {
		return;
	}
	const { ErrorParser } = await import("youch-core");
	const parsed = await new ErrorParser().defineSourceLoader(sourceLoader).parse(error);
	const stack = error.message + "\n" + parsed.frames.map((frame) => fmtFrame(frame)).join("\n");
	Object.defineProperty(error, "stack", { value: stack });
	if (error.cause) {
		await loadStackTrace(error.cause).catch(consola.error);
	}
}
async function sourceLoader(frame) {
	if (!frame.fileName || frame.fileType !== "fs" || frame.type === "native") {
		return;
	}
	if (frame.type === "app") {
		
		const rawSourceMap = await readFile(`${frame.fileName}.map`, "utf8").catch(() => {});
		if (rawSourceMap) {
			const { SourceMapConsumer } = await import("source-map");
			const consumer = await new SourceMapConsumer(rawSourceMap);
			
			const originalPosition = consumer.originalPositionFor({
				line: frame.lineNumber,
				column: frame.columnNumber
			});
			if (originalPosition.source && originalPosition.line) {
				
				frame.fileName = resolve(dirname(frame.fileName), originalPosition.source);
				frame.lineNumber = originalPosition.line;
				frame.columnNumber = originalPosition.column || 0;
			}
		}
	}
	const contents = await readFile(frame.fileName, "utf8").catch(() => {});
	return contents ? { contents } : undefined;
}
function fmtFrame(frame) {
	if (frame.type === "native") {
		return frame.raw;
	}
	const src = `${frame.fileName || ""}:${frame.lineNumber}:${frame.columnNumber})`;
	return frame.functionName ? `at ${frame.functionName} (${src}` : `at ${src}`;
}
