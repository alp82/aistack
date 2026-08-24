import { g as Server, t as BunFetchHandler, y as ServerOptions } from "../_chunks/types.mjs";
import { t as FastURL } from "../_chunks/_url.mjs";
import * as bun from "bun";

//#region src/adapters/bun.d.ts
declare const FastResponse: typeof globalThis.Response;
declare function serve(options: ServerOptions): BunServer;
declare class BunServer implements Server<BunFetchHandler> {
  #private;
  readonly runtime = "bun";
  readonly options: Server["options"];
  readonly bun: Server["bun"];
  readonly serveOptions: bun.Serve.Options<any>;
  readonly fetch: BunFetchHandler;
  constructor(options: ServerOptions);
  serve(): Promise<this>;
  get url(): string | undefined;
  ready(): Promise<this>;
  close(closeAll?: boolean): Promise<void>;
}
//#endregion
export { FastResponse, FastURL, serve };