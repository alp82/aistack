interface OutputBundleConfig {
  version: "v1";
  runConfig: RunConfig;
  metadata: Metadata;
  outputFiles?: OutputFiles;
}
interface RunConfig {
  runCommand: string;
  environmentVariables?: EnvVarConfig[];
  concurrency?: number;
  cpu?: number;
  memoryMiB?: number;
  minInstances?: number;
  maxInstances?: number;
}
interface Metadata {
  adapterPackageName: string;
  adapterVersion: string;
  framework: string;
  frameworkVersion?: string;
}
interface OutputFiles {
  serverApp: ServerApp;
}
interface ServerApp {
  include: string[];
}
interface EnvVarConfig {
  variable: string;
  value: string;
  availability: Availability[];
}
declare enum Availability {
  Runtime = "RUNTIME",
  Build = "BUILD"
}
export { OutputBundleConfig };