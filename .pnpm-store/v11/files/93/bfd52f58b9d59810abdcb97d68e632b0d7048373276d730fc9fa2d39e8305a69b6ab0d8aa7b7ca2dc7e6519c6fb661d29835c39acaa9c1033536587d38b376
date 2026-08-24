# More utils

> More H3 utilities.

## Base

### `withBase(base, input)`

Returns a new event handler that removes the base url of the event before calling the original handler.

**Example:**

```ts
const api = new H3()
 .get("/", () => "Hello API!");
const app = new H3();
 .use("/api/**", withBase("/api", api.handler));
```

## Event

### `getEventContext(event)`

Gets the context of the event, if it does not exists, initializes a new context on `req.context`.

### `isEvent(input)`

Checks if the input is an H3Event object.

### `isHTTPEvent(input)`

Checks if the input is an object with `{ req: Request }` signature.

### `mockEvent(_request, options?)`

## Middleware

### `bodyLimit(limit)`

Define a middleware that checks whether request body size is within specified limit.

If body size exceeds the limit, throws a `413` Request Entity Too Large response error. If you need custom handling for this case, use `assertBodySize` instead.

### `onError(hook)`

Define a middleware that runs when an error occurs.

You can return a new Response from the handler to gracefully handle the error.

### `onRequest(hook)`

Define a middleware that runs on each request.

### `onResponse(hook)`

Define a middleware that runs after Response is generated.

You can return a new Response from the handler to replace the original response.

## WebSocket

### `defineWebSocket(hooks)`

Define WebSocket hooks.

### `defineWebSocketHandler()`

Define WebSocket event handler.

## Adapters

### `defineNodeHandler(handler)`

### `defineNodeMiddleware(handler)`

### `fromNodeHandler(handler)`

### `fromWebHandler(handler)`
