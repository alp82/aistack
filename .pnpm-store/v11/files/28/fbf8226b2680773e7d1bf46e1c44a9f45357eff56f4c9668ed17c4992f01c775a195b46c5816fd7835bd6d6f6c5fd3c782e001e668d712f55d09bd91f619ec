import { i as Storage } from "./_chunks/types.mjs";

//#region src/server.d.ts
type StorageServerRequest = {
  request: globalThis.Request;
  key: string;
  type: "read" | "write";
};
interface StorageServerOptions {
  authorize?: (request: StorageServerRequest) => void | Promise<void>;
  resolvePath?: (event: {
    req: Request;
  }) => string;
}
type FetchHandler = (req: globalThis.Request) => globalThis.Response | Promise<globalThis.Response>;
/**
* This function creates a fetch handler for your custom storage server.
*
* The storage server will handle HEAD, GET, PUT and DELETE requests.
* - HEAD: Return if the request item exists in the storage, including a last-modified header if the storage supports it and the meta is stored
* - GET: Return the item if it exists
* - PUT: Sets the item
* - DELETE: Removes the item (or clears the whole storage if the base key was used)
*
* If the request sets the `Accept` header to `application/octet-stream`, the server will handle the item as raw data.
*
* @param storage The storage which should be used for the storage server
* @param options Defining functions such as an authorization check and a custom path resolver
* @returns An object containing then `handle` function for the handler
*/
declare function createStorageHandler(storage: Storage, opts?: StorageServerOptions): (req: globalThis.Request) => globalThis.Response | Promise<globalThis.Response>;
//#endregion
export { FetchHandler, StorageServerOptions, StorageServerRequest, createStorageHandler };