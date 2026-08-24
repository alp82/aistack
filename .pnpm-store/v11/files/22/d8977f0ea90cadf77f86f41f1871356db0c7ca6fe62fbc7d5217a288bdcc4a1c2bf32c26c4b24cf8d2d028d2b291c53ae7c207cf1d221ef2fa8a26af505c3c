//#region src/client/focus-manager.d.ts
type FocusListener = (focused: boolean) => void;
declare const kFocusManager: unique symbol;
interface FocusManager {
  setFocused(focused: boolean): void;
  subscribe(listener: FocusListener): () => void;
  setup(): () => void;
}
//#endregion
export { FocusListener, FocusManager, kFocusManager };
//# sourceMappingURL=focus-manager.d.mts.map