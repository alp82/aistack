import { WorkerHooks } from "./types.mjs";
import { BaseEnvRunner, EnvRunnerData } from "./common-base-runner.mjs";
declare class DenoProcessEnvRunner extends BaseEnvRunner {
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
export { DenoProcessEnvRunner };