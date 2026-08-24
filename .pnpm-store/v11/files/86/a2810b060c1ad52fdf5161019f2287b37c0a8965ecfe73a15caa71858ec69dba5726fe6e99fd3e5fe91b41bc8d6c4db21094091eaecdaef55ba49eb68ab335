import { AsyncLocalStorage } from "node:async_hooks";
import { H3Event, toResponse, getRequestIP as getRequestIP$1, getRequestHost as getRequestHost$1, getRequestURL, getRequestProtocol as getRequestProtocol$1, sanitizeStatusCode, sanitizeStatusMessage, parseCookies, setCookie as setCookie$1, deleteCookie as deleteCookie$1, useSession as useSession$1, getSession as getSession$1, updateSession as updateSession$1, sealSession as sealSession$1, unsealSession as unsealSession$1, clearSession as clearSession$1, getValidatedQuery as getValidatedQuery$1 } from "h3-v2";
const GLOBAL_EVENT_STORAGE_KEY = Symbol.for("tanstack-start:event-storage");
const globalObj = globalThis;
if (!globalObj[GLOBAL_EVENT_STORAGE_KEY]) {
  globalObj[GLOBAL_EVENT_STORAGE_KEY] = new AsyncLocalStorage();
}
const eventStorage = globalObj[GLOBAL_EVENT_STORAGE_KEY];
function isPromiseLike(value) {
  return typeof value.then === "function";
}
function getSetCookieValues(headers) {
  const headersWithSetCookie = headers;
  if (typeof headersWithSetCookie.getSetCookie === "function") {
    return headersWithSetCookie.getSetCookie();
  }
  const value = headers.get("set-cookie");
  return value ? [value] : [];
}
function mergeEventResponseHeaders(response, event) {
  if (response.ok) {
    return;
  }
  const eventSetCookies = getSetCookieValues(event.res.headers);
  if (eventSetCookies.length === 0) {
    return;
  }
  const responseSetCookies = getSetCookieValues(response.headers);
  response.headers.delete("set-cookie");
  for (const cookie of responseSetCookies) {
    response.headers.append("set-cookie", cookie);
  }
  for (const cookie of eventSetCookies) {
    response.headers.append("set-cookie", cookie);
  }
}
function attachResponseHeaders(value, event) {
  if (isPromiseLike(value)) {
    return value.then((resolved) => {
      if (resolved instanceof Response) {
        mergeEventResponseHeaders(resolved, event);
      }
      return resolved;
    });
  }
  if (value instanceof Response) {
    mergeEventResponseHeaders(value, event);
  }
  return value;
}
function requestHandler(handler) {
  return (request, requestOpts) => {
    const h3Event = new H3Event(request);
    const response = eventStorage.run(
      { h3Event },
      () => handler(request, requestOpts)
    );
    return toResponse(attachResponseHeaders(response, h3Event), h3Event);
  };
}
function getH3Event() {
  const event = eventStorage.getStore();
  if (!event) {
    throw new Error(
      `No StartEvent found in AsyncLocalStorage. Make sure you are using the function within the server runtime.`
    );
  }
  return event.h3Event;
}
function getRequest() {
  const event = getH3Event();
  return event.req;
}
function getRequestHeaders() {
  return getH3Event().req.headers;
}
function getRequestHeader(name) {
  return getRequestHeaders().get(name) || void 0;
}
function getRequestIP(opts) {
  return getRequestIP$1(getH3Event(), opts);
}
function getRequestHost(opts) {
  return getRequestHost$1(getH3Event(), opts);
}
function getRequestUrl(opts) {
  return getRequestURL(getH3Event(), opts);
}
function getRequestProtocol(opts) {
  return getRequestProtocol$1(getH3Event(), opts);
}
function setResponseHeaders(headers) {
  const event = getH3Event();
  for (const [name, value] of Object.entries(headers)) {
    event.res.headers.set(name, value);
  }
}
function getResponseHeaders() {
  const event = getH3Event();
  return event.res.headers;
}
function getResponseHeader(name) {
  const event = getH3Event();
  return event.res.headers.get(name) || void 0;
}
function setResponseHeader(name, value) {
  const event = getH3Event();
  if (Array.isArray(value)) {
    event.res.headers.delete(name);
    for (const valueItem of value) {
      event.res.headers.append(name, valueItem);
    }
  } else {
    event.res.headers.set(name, value);
  }
}
function removeResponseHeader(name) {
  const event = getH3Event();
  event.res.headers.delete(name);
}
function clearResponseHeaders(headerNames) {
  const event = getH3Event();
  if (headerNames && headerNames.length > 0) {
    for (const name of headerNames) {
      event.res.headers.delete(name);
    }
  } else {
    for (const name of event.res.headers.keys()) {
      event.res.headers.delete(name);
    }
  }
}
function getResponseStatus() {
  return getH3Event().res.status || 200;
}
function setResponseStatus(code, text) {
  const event = getH3Event();
  if (code) {
    event.res.status = sanitizeStatusCode(code, event.res.status);
  }
  if (text) {
    event.res.statusText = sanitizeStatusMessage(text);
  }
}
function getCookies() {
  const event = getH3Event();
  return parseCookies(event);
}
function getCookie(name) {
  return getCookies()[name] || void 0;
}
function setCookie(name, value, options) {
  const event = getH3Event();
  setCookie$1(event, name, value, options);
}
function deleteCookie(name, options) {
  const event = getH3Event();
  deleteCookie$1(event, name, options);
}
function getDefaultSessionConfig(config) {
  return {
    name: "start",
    ...config
  };
}
function useSession(config) {
  const event = getH3Event();
  return useSession$1(event, getDefaultSessionConfig(config));
}
function getSession(config) {
  const event = getH3Event();
  return getSession$1(event, getDefaultSessionConfig(config));
}
function updateSession(config, update) {
  const event = getH3Event();
  return updateSession$1(event, getDefaultSessionConfig(config), update);
}
function sealSession(config) {
  const event = getH3Event();
  return sealSession$1(event, getDefaultSessionConfig(config));
}
function unsealSession(config, sealed) {
  const event = getH3Event();
  return unsealSession$1(event, getDefaultSessionConfig(config), sealed);
}
function clearSession(config) {
  const event = getH3Event();
  return clearSession$1(event, { name: "start", ...config });
}
function getResponse() {
  const event = getH3Event();
  return event.res;
}
function getValidatedQuery(schema) {
  return getValidatedQuery$1(getH3Event(), schema);
}
export {
  clearResponseHeaders,
  clearSession,
  deleteCookie,
  getCookie,
  getCookies,
  getRequest,
  getRequestHeader,
  getRequestHeaders,
  getRequestHost,
  getRequestIP,
  getRequestProtocol,
  getRequestUrl,
  getResponse,
  getResponseHeader,
  getResponseHeaders,
  getResponseStatus,
  getSession,
  getValidatedQuery,
  removeResponseHeader,
  requestHandler,
  sealSession,
  setCookie,
  setResponseHeader,
  setResponseHeaders,
  setResponseStatus,
  unsealSession,
  updateSession,
  useSession
};
//# sourceMappingURL=request-response.js.map
