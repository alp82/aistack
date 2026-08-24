import { encode, createRawStreamDeserializePlugin, parseRedirect, isNotFound } from "@tanstack/router-core";
import { fromCrossJSON, toJSONAsync } from "seroval";
import invariant from "tiny-invariant";
import { getDefaultSerovalPlugins } from "../getDefaultSerovalPlugins.js";
import { TSS_CONTENT_TYPE_FRAMED, TSS_FORMDATA_CONTEXT, X_TSS_RAW_RESPONSE, X_TSS_SERIALIZED, validateFramedProtocolVersion } from "../constants.js";
import { createFrameDecoder } from "./frame-decoder.js";
let serovalPlugins = null;
const hop = Object.prototype.hasOwnProperty;
function hasOwnProperties(obj) {
  for (const _ in obj) {
    if (hop.call(obj, _)) {
      return true;
    }
  }
  return false;
}
async function serverFnFetcher(url, args, handler) {
  if (!serovalPlugins) {
    serovalPlugins = getDefaultSerovalPlugins();
  }
  const _first = args[0];
  const first = _first;
  const type = first.data instanceof FormData ? "formData" : "payload";
  const headers = first.headers ? new Headers(first.headers) : new Headers();
  headers.set("x-tsr-serverFn", "true");
  if (type === "payload") {
    headers.set(
      "accept",
      `${TSS_CONTENT_TYPE_FRAMED}, application/x-ndjson, application/json`
    );
  }
  if (first.method === "GET") {
    if (type === "formData") {
      throw new Error("FormData is not supported with GET requests");
    }
    const serializedPayload = await serializePayload(first);
    if (serializedPayload !== void 0) {
      const encodedPayload = encode({
        payload: serializedPayload
      });
      if (url.includes("?")) {
        url += `&${encodedPayload}`;
      } else {
        url += `?${encodedPayload}`;
      }
    }
  }
  let body = void 0;
  if (first.method === "POST") {
    const fetchBody = await getFetchBody(first);
    if (fetchBody?.contentType) {
      headers.set("content-type", fetchBody.contentType);
    }
    body = fetchBody?.body;
  }
  return await getResponse(
    async () => handler(url, {
      method: first.method,
      headers,
      signal: first.signal,
      body
    })
  );
}
async function serializePayload(opts) {
  let payloadAvailable = false;
  const payloadToSerialize = {};
  if (opts.data !== void 0) {
    payloadAvailable = true;
    payloadToSerialize["data"] = opts.data;
  }
  if (opts.context && hasOwnProperties(opts.context)) {
    payloadAvailable = true;
    payloadToSerialize["context"] = opts.context;
  }
  if (payloadAvailable) {
    return serialize(payloadToSerialize);
  }
  return void 0;
}
async function serialize(data) {
  return JSON.stringify(
    await Promise.resolve(toJSONAsync(data, { plugins: serovalPlugins }))
  );
}
async function getFetchBody(opts) {
  if (opts.data instanceof FormData) {
    let serializedContext = void 0;
    if (opts.context && hasOwnProperties(opts.context)) {
      serializedContext = await serialize(opts.context);
    }
    if (serializedContext !== void 0) {
      opts.data.set(TSS_FORMDATA_CONTEXT, serializedContext);
    }
    return { body: opts.data };
  }
  const serializedBody = await serializePayload(opts);
  if (serializedBody) {
    return { body: serializedBody, contentType: "application/json" };
  }
  return void 0;
}
async function getResponse(fn) {
  let response;
  try {
    response = await fn();
  } catch (error) {
    if (error instanceof Response) {
      response = error;
    } else {
      console.log(error);
      throw error;
    }
  }
  if (response.headers.get(X_TSS_RAW_RESPONSE) === "true") {
    return response;
  }
  const contentType = response.headers.get("content-type");
  invariant(contentType, "expected content-type header to be set");
  const serializedByStart = !!response.headers.get(X_TSS_SERIALIZED);
  if (serializedByStart) {
    let result;
    if (contentType.includes(TSS_CONTENT_TYPE_FRAMED)) {
      validateFramedProtocolVersion(contentType);
      if (!response.body) {
        throw new Error("No response body for framed response");
      }
      const { getOrCreateStream, jsonChunks } = createFrameDecoder(
        response.body
      );
      const rawStreamPlugin = createRawStreamDeserializePlugin(getOrCreateStream);
      const plugins = [rawStreamPlugin, ...serovalPlugins || []];
      const refs = /* @__PURE__ */ new Map();
      result = await processFramedResponse({
        jsonStream: jsonChunks,
        onMessage: (msg) => fromCrossJSON(msg, { refs, plugins }),
        onError(msg, error) {
          console.error(msg, error);
        }
      });
    } else if (contentType.includes("application/x-ndjson")) {
      const refs = /* @__PURE__ */ new Map();
      result = await processServerFnResponse({
        response,
        onMessage: (msg) => fromCrossJSON(msg, { refs, plugins: serovalPlugins }),
        onError(msg, error) {
          console.error(msg, error);
        }
      });
    } else if (contentType.includes("application/json")) {
      const jsonPayload = await response.json();
      result = fromCrossJSON(jsonPayload, { plugins: serovalPlugins });
    }
    invariant(result, "expected result to be resolved");
    if (result instanceof Error) {
      throw result;
    }
    return result;
  }
  if (contentType.includes("application/json")) {
    const jsonPayload = await response.json();
    const redirect = parseRedirect(jsonPayload);
    if (redirect) {
      throw redirect;
    }
    if (isNotFound(jsonPayload)) {
      throw jsonPayload;
    }
    return jsonPayload;
  }
  if (!response.ok) {
    throw new Error(await response.text());
  }
  return response;
}
async function processServerFnResponse({
  response,
  onMessage,
  onError
}) {
  if (!response.body) {
    throw new Error("No response body");
  }
  const reader = response.body.pipeThrough(new TextDecoderStream()).getReader();
  let buffer = "";
  let firstRead = false;
  let firstObject;
  while (!firstRead) {
    const { value, done } = await reader.read();
    if (value) buffer += value;
    if (buffer.length === 0 && done) {
      throw new Error("Stream ended before first object");
    }
    if (buffer.endsWith("\n")) {
      const lines = buffer.split("\n").filter(Boolean);
      const firstLine = lines[0];
      if (!firstLine) throw new Error("No JSON line in the first chunk");
      firstObject = JSON.parse(firstLine);
      firstRead = true;
      buffer = lines.slice(1).join("\n");
    } else {
      const newlineIndex = buffer.indexOf("\n");
      if (newlineIndex >= 0) {
        const line = buffer.slice(0, newlineIndex).trim();
        buffer = buffer.slice(newlineIndex + 1);
        if (line.length > 0) {
          firstObject = JSON.parse(line);
          firstRead = true;
        }
      }
    }
  }
  (async () => {
    try {
      while (true) {
        const { value, done } = await reader.read();
        if (value) buffer += value;
        const lastNewline = buffer.lastIndexOf("\n");
        if (lastNewline >= 0) {
          const chunk = buffer.slice(0, lastNewline);
          buffer = buffer.slice(lastNewline + 1);
          const lines = chunk.split("\n").filter(Boolean);
          for (const line of lines) {
            try {
              onMessage(JSON.parse(line));
            } catch (e) {
              onError?.(`Invalid JSON line: ${line}`, e);
            }
          }
        }
        if (done) {
          break;
        }
      }
    } catch (err) {
      onError?.("Stream processing error:", err);
    }
  })();
  return onMessage(firstObject);
}
async function processFramedResponse({
  jsonStream,
  onMessage,
  onError
}) {
  const reader = jsonStream.getReader();
  const { value: firstValue, done: firstDone } = await reader.read();
  if (firstDone || !firstValue) {
    throw new Error("Stream ended before first object");
  }
  const firstObject = JSON.parse(firstValue);
  (async () => {
    try {
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        if (value) {
          try {
            onMessage(JSON.parse(value));
          } catch (e) {
            onError?.(`Invalid JSON: ${value}`, e);
          }
        }
      }
    } catch (err) {
      onError?.("Stream processing error:", err);
    }
  })();
  return onMessage(firstObject);
}
export {
  serverFnFetcher
};
//# sourceMappingURL=serverFnFetcher.js.map
