import { Adapter, AdapterHookable, AdapterInstance, AdapterOptions, Peer, PeerContext, SyncDriver } from "./adapter.mjs";
import { Server, ServerWebSocket, WebSocketHandler } from "bun";
interface BunAdapter extends AdapterInstance {
  websocket: WebSocketHandler<ContextData>;
  handleUpgrade(req: Request, server: Server<ContextData>): Promise<Response | undefined>;
}
interface BunOptions extends AdapterOptions {}
type ContextData = {
  peer?: BunPeer;
  namespace: string;
  request: Request;
  server?: Server<ContextData>;
  context: PeerContext;
};
declare const bunAdapter: Adapter<BunAdapter, BunOptions>;
declare class BunPeer extends Peer<{
  ws: ServerWebSocket<ContextData>;
  namespace: string;
  request: Request;
  peers: Set<BunPeer>;
  sync?: SyncDriver;
  hooks: AdapterHookable;
}> {
  get remoteAddress(): string;
  get context(): PeerContext;
  get bufferedAmount(): number;
  send(data: unknown, options?: {
    compress?: boolean;
  }): number;
  _publish(topic: string, data: unknown, options?: {
    compress?: boolean;
  }): number;
  subscribe(topic: string): void;
  unsubscribe(topic: string): void;
  close(code?: number, reason?: string): void;
  terminate(): void;
  ping(data?: unknown): number;
}
export { BunAdapter, BunOptions, bunAdapter };