import http from "node:http";
import { WebSocket, WebSocketServer } from "ws";
import { stringifyWithBigInt, parseWithBigInt } from "../utils/json.js";
class ServerEventBus {
  #eventTarget;
  #clients = /* @__PURE__ */ new Set();
  #sseClients = /* @__PURE__ */ new Set();
  #server = null;
  #wssServer = null;
  #port;
  #debug;
  #dispatcher = (e) => {
    const event = e.detail;
    this.debugLog("Dispatching event from dispatcher, forwarding", event);
    this.emit(event);
  };
  #connectFunction = () => {
    this.debugLog(
      "Connection request made to event-bus, replying back with success"
    );
    this.#eventTarget.dispatchEvent(new CustomEvent("tanstack-connect-success"));
  };
  constructor({ port = 42069, debug = false } = {}) {
    this.#port = port;
    this.#eventTarget = globalThis.__TANSTACK_EVENT_TARGET__ ?? new EventTarget();
    if (!globalThis.__TANSTACK_EVENT_TARGET__) {
      globalThis.__TANSTACK_EVENT_TARGET__ = this.#eventTarget;
    }
    this.#server = globalThis.__TANSTACK_DEVTOOLS_SERVER__ ?? null;
    this.#wssServer = globalThis.__TANSTACK_DEVTOOLS_WSS_SERVER__ ?? null;
    this.#debug = debug;
    this.debugLog("Initializing server event bus");
  }
  debugLog(...args) {
    if (this.#debug) {
      console.log("🌴 [tanstack-devtools:server-bus] ", ...args);
    }
  }
  emitToServer(event) {
    this.debugLog("Emitting event to specific server listeners", event);
    this.#eventTarget.dispatchEvent(
      new CustomEvent(event.type, { detail: event })
    );
    this.debugLog("Emitting event to global server listeners", event);
    this.#eventTarget.dispatchEvent(
      new CustomEvent("tanstack-devtools-global", { detail: event })
    );
  }
  emitEventToClients(event) {
    this.debugLog("Emitting event to clients", event);
    const json = stringifyWithBigInt(event);
    for (const client of this.#clients) {
      if (client.readyState === WebSocket.OPEN) {
        client.send(json);
      }
    }
    for (const res of this.#sseClients) {
      res.write(`data: ${json}

`);
    }
  }
  emit(event) {
    this.emitEventToClients(event);
    this.emitToServer(event);
  }
  createSSEServer() {
    if (this.#server) {
      return this.#server;
    }
    const server = http.createServer((req, res) => {
      if (req.url === "/__devtools/sse") {
        res.writeHead(200, {
          "Content-Type": "text/event-stream",
          "Cache-Control": "no-cache",
          Connection: "keep-alive",
          "Access-Control-Allow-Origin": "*"
        });
        res.write("\n");
        this.debugLog("New SSE client connected");
        this.#sseClients.add(res);
        req.on("close", () => this.#sseClients.delete(res));
        return;
      }
      if (req.url === "/__devtools/send" && req.method === "POST") {
        let body = "";
        req.on("data", (chunk) => body += chunk);
        req.on("end", () => {
          try {
            const msg = parseWithBigInt(body);
            this.debugLog("Received event from client", msg);
            this.emitToServer(msg);
          } catch {
          }
        });
        res.writeHead(200).end();
        return;
      }
      res.statusCode = 404;
      res.end();
    });
    globalThis.__TANSTACK_DEVTOOLS_SERVER__ = server;
    this.#server = server;
    return server;
  }
  createWebSocketServer() {
    if (this.#wssServer) {
      return this.#wssServer;
    }
    const wss = new WebSocketServer({ noServer: true });
    this.#wssServer = wss;
    globalThis.__TANSTACK_DEVTOOLS_WSS_SERVER__ = wss;
    return wss;
  }
  handleNewConnection(wss) {
    wss.on("connection", (ws) => {
      this.debugLog("New WebSocket client connected");
      this.#clients.add(ws);
      ws.on("close", () => {
        this.debugLog("WebSocket client disconnected");
        this.#clients.delete(ws);
      });
      ws.on("message", (msg) => {
        this.debugLog("Received message from WebSocket client", msg.toString());
        const data = parseWithBigInt(msg.toString());
        this.emitToServer(data);
      });
    });
  }
  start() {
    if (process.env.NODE_ENV !== "development") return;
    if (this.#server || this.#wssServer) {
      return;
    }
    this.debugLog("Starting server event bus");
    const server = this.createSSEServer();
    const wss = this.createWebSocketServer();
    this.#eventTarget.addEventListener(
      "tanstack-dispatch-event",
      this.#dispatcher
    );
    this.#eventTarget.addEventListener(
      "tanstack-connect",
      this.#connectFunction
    );
    this.handleNewConnection(wss);
    server.on("upgrade", (req, socket, head) => {
      if (req.url === "/__devtools/ws") {
        wss.handleUpgrade(req, socket, head, (ws) => {
          this.debugLog("WebSocket connection established");
          wss.emit("connection", ws, req);
        });
      }
    });
    server.listen(this.#port, () => {
      this.debugLog(`Listening on http://localhost:${this.#port}`);
    });
  }
  stop() {
    this.#server?.close(() => {
      this.debugLog("Server stopped");
    });
    this.#wssServer?.close(() => {
      this.debugLog("WebSocket server stopped");
    });
    this.debugLog("Clearing all connections");
    this.#clients.clear();
    this.#sseClients.forEach((res) => res.end());
    this.#sseClients.clear();
    this.debugLog("Cleared all WS/SSE connections");
    this.#server = null;
    this.#wssServer = null;
    this.#eventTarget.removeEventListener(
      "tanstack-dispatch-event",
      this.#dispatcher
    );
    this.#eventTarget.removeEventListener(
      "tanstack-connect",
      this.#connectFunction
    );
    this.debugLog("[tanstack-devtools] All connections cleared");
  }
}
export {
  ServerEventBus
};
//# sourceMappingURL=server.js.map
