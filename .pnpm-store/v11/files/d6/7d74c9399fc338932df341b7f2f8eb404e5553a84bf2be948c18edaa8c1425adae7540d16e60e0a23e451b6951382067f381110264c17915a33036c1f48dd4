import { WorkerHooks } from "./types.mjs";
import { BaseEnvRunner, EnvRunnerData } from "./common-base-runner.mjs";
declare class NodeWorkerEnvRunner extends BaseEnvRunner {
  #private;
  constructor(opts: {
    name: string;
    workerEntry?: string;
    hooks?: WorkerHooks;
    data?: EnvRunnerData;
  });
  sendMessage(message: unknown): void;
  protected _hasRuntime(): boolean;
  protected _runtimeType(): string;
  protected _closeRuntime(): Promise<void>;
}
export { NodeWorkerEnvRunner };