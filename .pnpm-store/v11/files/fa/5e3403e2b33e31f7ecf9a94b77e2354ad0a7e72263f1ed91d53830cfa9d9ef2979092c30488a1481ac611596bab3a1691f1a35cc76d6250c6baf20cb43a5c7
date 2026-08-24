import { i as Storage, o as StorageValue } from "./_chunks/types.mjs";

//#region src/tracing.d.ts
/**
* All operations that can be traced.
* Meta operations (setMeta, removeMeta, getMeta) use the underlying operation channels
* with meta: true in the tracing data context.
*/
type TracedOperation = "hasItem" | "getItem" | "getMeta" | "setItem" | "setItems" | "removeItem" | "getKeys" | "getItems" | "getItemRaw" | "setItemRaw" | "clear";
interface TraceContext {
  keys: string[];
  /**
  * Whether this operation is working with metadata.
  * When true, the operation is accessing/modifying metadata (e.g., getMeta, setMeta).
  */
  meta?: boolean;
  /**
  * The mount point base path where this operation is being executed.
  * Useful for tracking which storage driver/mount is handling the operation.
  */
  base?: string;
  /**
  * Driver information for the operation.
  */
  driver?: {
    /**
    * The name of the driver handling this operation.
    */
    name?: string;
    /**
    * Driver-specific options.
    */
    options?: any;
  };
}
type MaybeTracedStorage<T extends StorageValue> = Storage<T> & {
  __traced?: boolean;
};
/**
* Wraps a storage instance with tracing capabilities.
* All storage operations will emit tracing events through Node.js diagnostics channels.
*/
declare function withTracing<T extends StorageValue>(storage: MaybeTracedStorage<T>): Storage<T>;
//#endregion
export { TraceContext, TracedOperation, withTracing };