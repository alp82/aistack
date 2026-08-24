import { WorkerHooks } from "../../_chunks/types.mjs";
import { BaseEnvRunner, EnvRunnerData } from "../../_chunks/common-base-runner.mjs";
declare class SelfEnvRunner extends BaseEnvRunner {
  #private;
  constructor(opts: {
    name: string;
    hooks?: WorkerHooks;
    data?: EnvRunnerData;
  });
  fetch(input: string | URL | Request, init?: RequestInit): Promise<Response>;
  upgrade(context: {
    node: {
      req: import("node:http").IncomingMessage;
      socket: import("node:net").Socket;
      head: any;
    };
  }): Promise<void>;
  sendMessage(message: unknown): void;
  invalidateModule(specifier: string): Promise<void>;
  reloadModule(): Promise<void>;
  protected _hasRuntime(): boolean;
  protected _runtimeType(): string;
  protected _closeRuntime(): Promise<void>;
}
export { SelfEnvRunner, type EnvRunnerData as SelfEnvRunnerData };