import { Store, StoreValue } from "nanostores";
import { DependencyList } from "react";

//#region src/client/react/react-store.d.ts
type StoreKeys<T> = T extends {
  setKey: (k: infer K, v: any) => unknown;
} ? K : never;
interface UseStoreOptions<SomeStore> {
  /**
   * @default
   * ```ts
   * [store, options.keys]
   * ```
   */
  deps?: DependencyList | undefined;
  /**
   * Will re-render components only on specific key changes.
   */
  keys?: StoreKeys<SomeStore>[] | undefined;
}
/**
 * Subscribe to store changes and get store's value.
 *
 * Can be used with store builder too.
 *
 * ```js
 * import { useStore } from 'nanostores/react'
 *
 * import { router } from '../store/router'
 *
 * export const Layout = () => {
 *   let page = useStore(router)
 *   if (page.route === 'home') {
 *     return <HomePage />
 *   } else {
 *     return <Error404 />
 *   }
 * }
 * ```
 *
 * @param store Store instance.
 * @returns Store value.
 */
declare function useStore<SomeStore extends Store>(store: SomeStore, options?: UseStoreOptions<SomeStore>): StoreValue<SomeStore>;
//#endregion
export { useStore };
//# sourceMappingURL=react-store.d.mts.map