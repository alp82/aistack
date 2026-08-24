import { WorkerHooks } from "../../_chunks/types.mjs";
import { BaseEnvRunner, EnvRunnerData } from "../../_chunks/common-base-runner.mjs";
declare class NodeProcessEnvRunner extends BaseEnvRunner {
  #private;
  constructor(opts: {
    name: string;
    workerEntry?: string;
    hooks?: WorkerHooks;
    data?: EnvRunnerData;
    execArgv?: string[];
  });
  sendMessage(message: unknown): void;
  protected _hasRuntime(): boolean;
  protected _runtimeType(): string;
  protected _closeRuntime(): Promise<void>;
}
export { NodeProcessEnvRunner, type EnvRunnerData as ProcessEnvRunnerData };