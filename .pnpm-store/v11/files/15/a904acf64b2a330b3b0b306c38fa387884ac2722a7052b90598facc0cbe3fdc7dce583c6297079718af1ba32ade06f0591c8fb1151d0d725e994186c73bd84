import { WorkerHooks } from "./types.mjs";
import { EnvRunnerData } from "./common-base-runner.mjs";
import { NodeWorkerEnvRunner } from "./node-worker-runner.mjs";
declare class VercelEnvRunner extends NodeWorkerEnvRunner {
  constructor(opts: {
    name: string;
    workerEntry?: string;
    hooks?: WorkerHooks;
    data?: EnvRunnerData;
  });
  fetch(input: string | URL | Request, init?: RequestInit): Promise<Response>;
  protected _runtimeType(): string;
}
export { VercelEnvRunner };