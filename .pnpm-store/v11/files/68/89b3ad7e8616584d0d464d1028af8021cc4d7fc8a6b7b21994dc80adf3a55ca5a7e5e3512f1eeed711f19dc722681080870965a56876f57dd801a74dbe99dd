import { NitroDevApp } from "./_dev.mjs";
import { RunnerMessageListener, RunnerRPCHooks } from "env-runner";
import { IncomingMessage } from "node:http";
import { Socket } from "node:net";
import { Server, ServerOptions } from "srvx";
import { LoadConfigOptions, Nitro, NitroBuildInfo, NitroConfig, NitroOptions, TaskEvent, TaskRunnerOptions } from "nitro/types";
declare function createNitro(config?: NitroConfig, opts?: LoadConfigOptions): Promise<Nitro>;
declare function loadOptions(configOverrides?: NitroConfig, opts?: LoadConfigOptions): Promise<NitroOptions>;
declare function build(nitro: Nitro): Promise<void>;
declare function copyPublicAssets(nitro: Nitro): Promise<void>;
declare function prepare(nitro: Nitro): Promise<void>;
declare function writeTypes(nitro: Nitro): Promise<void>;
declare function getBuildInfo(root: string): Promise<{
  outputDir?: undefined;
  buildInfo?: undefined;
} | {
  outputDir: string;
  buildInfo?: NitroBuildInfo;
}>;
declare function createDevServer(nitro: Nitro): NitroDevServer;
declare class NitroDevServer extends NitroDevApp implements RunnerRPCHooks {
  #private;
  constructor(nitro: Nitro);
  upgrade(req: IncomingMessage, socket: Socket, head: any): Promise<void>;
  listen(opts?: Partial<Omit<ServerOptions, "fetch">>): Server;
  close(): Promise<void>;
  reload(): void;
  sendMessage(message: unknown): void;
  onMessage(listener: RunnerMessageListener): void;
  offMessage(listener: RunnerMessageListener): void;
}
declare function prerender(nitro: Nitro): Promise<void>;
/** @experimental */
declare function runTask(taskEvent: TaskEvent, opts?: TaskRunnerOptions): Promise<{
  result: unknown;
}>;
/** @experimental */
declare function listTasks(opts?: TaskRunnerOptions): Promise<Record<string, {
  meta: {
    description: string;
  };
}>>;
export { build, copyPublicAssets, createDevServer, createNitro, getBuildInfo, listTasks, loadOptions, prepare, prerender, runTask, writeTypes };