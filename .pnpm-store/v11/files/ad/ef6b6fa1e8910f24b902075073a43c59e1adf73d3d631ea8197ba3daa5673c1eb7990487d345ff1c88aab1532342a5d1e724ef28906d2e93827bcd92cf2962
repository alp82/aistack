import { Stats } from "node:fs";
import { EventEmitter } from "node:events";
import { Readable } from "node:stream";
import * as _$jiti from "jiti";
import { DownloadTemplateOptions } from "giget";
/**
 * Calculates the difference between two objects and returns a list of differences.
 *
 * @param {any} obj1 - The first object to compare.
 * @param {any} obj2 - The second object to compare.
 * @param {HashOptions} [opts={}] - Configuration options for hashing the objects. See {@link HashOptions}.
 * @returns {DiffEntry[]} An array with the differences between the two objects.
 */
declare function diff(obj1: any, obj2: any): DiffEntry[];
declare class DiffEntry {
  key: string;
  type: "changed" | "added" | "removed";
  newValue: DiffHashedObject;
  oldValue?: DiffHashedObject | undefined;
  constructor(key: string, type: "changed" | "added" | "removed", newValue: DiffHashedObject, oldValue?: DiffHashedObject | undefined);
  toString(): string;
  toJSON(): string;
}
declare class DiffHashedObject {
  key: string;
  value: any;
  hash?: string | undefined;
  props?: Record<string, DiffHashedObject> | undefined;
  constructor(key: string, value: any, hash?: string | undefined, props?: Record<string, DiffHashedObject> | undefined);
  toString(): string;
  toJSON(): string;
}
type AWF = {
  stabilityThreshold: number;
  pollInterval: number;
};
type BasicOpts = {
  persistent: boolean;
  ignoreInitial: boolean;
  followSymlinks: boolean;
  cwd?: string;
  usePolling: boolean;
  interval: number;
  binaryInterval: number;
  alwaysStat?: boolean;
  depth?: number;
  ignorePermissionErrors: boolean;
  atomic: boolean | number;
};
type ChokidarOptions = Partial<BasicOpts & {
  ignored: Matcher | Matcher[];
  awaitWriteFinish: boolean | Partial<AWF>;
}>;
type MatchFunction = (val: string, stats?: Stats) => boolean;
interface MatcherObject {
  path: string;
  recursive?: boolean;
}
type Matcher = string | RegExp | MatchFunction | MatcherObject;
interface DotenvOptions {
  /**
   * The project root directory (either absolute or relative to the current working directory).
   *
   * Defaults to `options.cwd` in `loadConfig` context, or `process.cwd()` when used as standalone.
   */
  cwd?: string;
  /**
   * What file or files to look in for environment variables (either absolute or relative
   * to the current working directory). For example, `.env`.
   * With the array type, the order enforce the env loading priority (last one overrides).
   */
  fileName?: string | string[];
  /**
   * Whether to interpolate variables within .env.
   *
   * @example
   * ```env
   * BASE_DIR="/test"
   * # resolves to "/test/further"
   * ANOTHER_DIR="${BASE_DIR}/further"
   * ```
   */
  interpolate?: boolean;
  /**
   * An object describing environment variables (key, value pairs).
   */
  env?: NodeJS.ProcessEnv;
  /**
   * Resolve `_FILE` suffixed environment variables by reading the file at the
   * specified path and assigning its trimmed content to the base key.
   *
   * This is useful for container secrets (e.g. Docker, Kubernetes) where
   * sensitive values are mounted as files.
   *
   * @default false
   *
   * @example
   * ```env
   * DATABASE_PASSWORD_FILE="/run/secrets/db_password"
   * # resolves to DATABASE_PASSWORD=<contents of /run/secrets/db_password>
   * ```
   */
  expandFileReferences?: boolean;
}
declare global {
  var __c12_dotenv_vars__: Map<Record<string, any>, Set<string>>;
}
type JitiOptions = NonNullable<Parameters<typeof _$jiti.createJiti>[1]>;
interface ConfigLayerMeta {
  name?: string;
  [key: string]: any;
}
type UserInputConfig = Record<string, any>;
interface C12InputConfig<T extends UserInputConfig = UserInputConfig, MT extends ConfigLayerMeta = ConfigLayerMeta> {
  $test?: T;
  $development?: T;
  $production?: T;
  $env?: Record<string, T>;
  $meta?: MT;
}
interface SourceOptions<T extends UserInputConfig = UserInputConfig, MT extends ConfigLayerMeta = ConfigLayerMeta> {
  /** Custom meta for layer */
  meta?: MT;
  /** Layer config overrides */
  overrides?: T;
  [key: string]: any;
  /**
   * Options for cloning remote sources
   *
   * @see https://giget.unjs.io
   */
  giget?: DownloadTemplateOptions;
  /**
   * Install dependencies after cloning
   *
   * @see https://nypm.unjs.io
   */
  install?: boolean;
  /**
   * Token for cloning private sources
   *
   * @see https://giget.unjs.io#providing-token-for-private-repositories
   */
  auth?: string;
}
interface ConfigLayer<T extends UserInputConfig = UserInputConfig, MT extends ConfigLayerMeta = ConfigLayerMeta> {
  config: T | null;
  source?: string;
  sourceOptions?: SourceOptions<T, MT>;
  meta?: MT;
  cwd?: string;
  configFile?: string;
}
interface ResolvedConfig<T extends UserInputConfig = UserInputConfig, MT extends ConfigLayerMeta = ConfigLayerMeta> extends ConfigLayer<T, MT> {
  config: T;
  layers?: ConfigLayer<T, MT>[];
  cwd?: string;
  _configFile?: string;
}
type ConfigSource = "overrides" | "main" | "rc" | "packageJson" | "defaultConfig";
interface ConfigFunctionContext {
  [key: string]: any;
}
interface ResolvableConfigContext<T extends UserInputConfig = UserInputConfig> {
  configs: Record<ConfigSource, T | null | undefined>;
  rawConfigs: Record<ConfigSource, ResolvableConfig<T> | null | undefined>;
}
type MaybePromise<T> = T | Promise<T>;
type ResolvableConfig<T extends UserInputConfig = UserInputConfig> = MaybePromise<T | null | undefined> | ((ctx: ResolvableConfigContext<T>) => MaybePromise<T | null | undefined>);
interface LoadConfigOptions<T extends UserInputConfig = UserInputConfig, MT extends ConfigLayerMeta = ConfigLayerMeta> {
  name?: string;
  cwd?: string;
  configFile?: string;
  rcFile?: false | string;
  globalRc?: boolean;
  dotenv?: boolean | DotenvOptions;
  envName?: string | false;
  packageJson?: boolean | string | string[];
  defaults?: T;
  defaultConfig?: ResolvableConfig<T>;
  overrides?: ResolvableConfig<T>;
  omit$Keys?: boolean;
  /** Context passed to config functions */
  context?: ConfigFunctionContext;
  resolve?: (id: string, options: LoadConfigOptions<T, MT>) => null | undefined | ResolvedConfig<T, MT> | Promise<ResolvedConfig<T, MT> | undefined | null>;
  /** Custom import function used to load configuration files */
  import?: (id: string) => Promise<unknown>;
  /** Custom resolver for picking which export to use from the loaded module. Default: `(mod) => mod.default || mod` */
  resolveModule?: (mod: any) => any;
  /** Options to override defaults when c12 falls back to [jiti](https://github.com/unjs/jiti) for loading config files. */
  jitiOptions?: JitiOptions;
  giget?: false | DownloadTemplateOptions;
  merger?: (...sources: Array<T | null | undefined>) => T;
  extend?: false | {
    extendKey?: string | string[];
  };
  configFileRequired?: boolean;
}
type DiffEntries = ReturnType<typeof diff>;
type ConfigWatcher<T extends UserInputConfig = UserInputConfig, MT extends ConfigLayerMeta = ConfigLayerMeta> = ResolvedConfig<T, MT> & {
  watchingFiles: string[];
  unwatch: () => Promise<void>;
};
interface WatchConfigOptions<T extends UserInputConfig = UserInputConfig, MT extends ConfigLayerMeta = ConfigLayerMeta> extends LoadConfigOptions<T, MT> {
  chokidarOptions?: ChokidarOptions;
  debounce?: false | number;
  onWatch?: (event: {
    type: "created" | "updated" | "removed";
    path: string;
  }) => void | Promise<void>;
  acceptHMR?: (context: {
    getDiff: () => DiffEntries;
    newConfig: ResolvedConfig<T, MT>;
    oldConfig: ResolvedConfig<T, MT>;
  }) => void | boolean | Promise<void | boolean>;
  onUpdate?: (context: {
    getDiff: () => ReturnType<typeof diff>;
    newConfig: ResolvedConfig<T, MT>;
    oldConfig: ResolvedConfig<T, MT>;
  }) => void | Promise<void>;
}
export { C12InputConfig, ChokidarOptions, type ConfigWatcher, type DotenvOptions, ResolvedConfig, type WatchConfigOptions };