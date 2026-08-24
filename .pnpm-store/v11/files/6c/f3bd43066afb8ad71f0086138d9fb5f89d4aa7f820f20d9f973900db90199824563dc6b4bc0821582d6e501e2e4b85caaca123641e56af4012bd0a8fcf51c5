//#region src/client/online-manager.d.ts
type OnlineListener = (online: boolean) => void;
declare const kOnlineManager: unique symbol;
interface OnlineManager {
  setOnline(online: boolean): void;
  isOnline: boolean;
  subscribe(listener: OnlineListener): () => void;
  setup(): () => void;
}
//#endregion
export { OnlineListener, OnlineManager, kOnlineManager };
//# sourceMappingURL=online-manager.d.mts.map