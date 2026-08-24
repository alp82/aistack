//#region src/client/broadcast-channel.d.ts
interface BroadcastMessage {
  event?: "session" | undefined;
  data?: {
    trigger?: "signout" | "getSession" | "updateUser";
  } | undefined;
  clientId: string;
  timestamp: number;
}
type BroadcastListener = (message: BroadcastMessage) => void;
declare const kBroadcastChannel: unique symbol;
interface BroadcastChannel {
  post(message: Record<string, unknown>): void;
  subscribe(listener: BroadcastListener): () => void;
  setup(): () => void;
}
declare function getGlobalBroadcastChannel(name?: string): BroadcastChannel;
//#endregion
export { BroadcastChannel, BroadcastListener, BroadcastMessage, getGlobalBroadcastChannel, kBroadcastChannel };
//# sourceMappingURL=broadcast-channel.d.mts.map