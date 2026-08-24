/// <reference types="node" />
import { URL as URL$1, URLSearchParams } from "node:url";
import { EventEmitter } from "node:events";
import { Duplex, Readable, Writable } from "node:stream";
import { IpcNetConnectOpts, Socket, TcpNetConnectOpts } from "node:net";
import { Blob, File } from "node:buffer";
import { ConnectionOptions, TLSSocket } from "node:tls";
type Json = string | number | boolean | null | Json[] | {
  [id: string]: Json;
};
/**
 * Wrangler configuration types. The JSDoc on these fields is also the source
 * of truth for the equivalent fields in `@cloudflare/config`
 * (`packages/config/src/types.ts` — `UserConfig` — and the binding option
 * interfaces in `packages/config/src/config.ts`). When editing prose here,
 * mirror the changes there.
 */
/**
 * The `Environment` interface declares all the configuration fields that
 * can be specified for an environment.
 *
 * This could be the top-level default environment, or a specific named environment.
 */
interface Environment extends EnvironmentInheritable, EnvironmentNonInheritable {}
type SimpleRoute = string;
type ZoneIdRoute = {
  pattern: string;
  zone_id: string;
  custom_domain?: boolean;
};
type ZoneNameRoute = {
  pattern: string;
  zone_name: string;
  custom_domain?: boolean;
};
type CustomDomainRoute = {
  pattern: string;
  custom_domain: boolean;
  enabled?: boolean;
  previews_enabled?: boolean;
};
type Route = SimpleRoute | ZoneIdRoute | ZoneNameRoute | CustomDomainRoute;
/**
 * Configuration in wrangler for Cloudchamber
 */
type CloudchamberConfig = {
  image?: string;
  location?: string;
  instance_type?: "dev" | "basic" | "standard" | "lite" | "standard-1" | "standard-2" | "standard-3" | "standard-4";
  vcpu?: number;
  memory?: string;
  ipv4?: boolean;
};
type UnsafeBinding = {
  /**
   * The name of the binding provided to the Worker
   */
  name: string;
  /**
   * The 'type' of the unsafe binding.
   */
  type: string;
  dev?: {
    plugin: {
      /**
       * Package is the bare specifier of the package that exposes plugins to integrate into Miniflare via a named `plugins` export.
       * @example "@cloudflare/my-external-miniflare-plugin"
       */
      package: string;
      /**
       * Plugin is the name of the plugin exposed by the package.
       * @example "MY_UNSAFE_PLUGIN"
       */
      name: string;
    };
    /**
     * Optional mapping of unsafe bindings names to options provided for the plugin.
     */
    options?: Record<string, unknown>;
  };
  [key: string]: unknown;
};
/**
 * Configuration for a container application
 */
type ContainerApp = {
  /**
   * Name of the application
   * @optional Defaults to `worker_name-class_name` if not specified.
   */
  name?: string;
  /**
   * Number of application instances
   * @deprecated
   * @hidden
   */
  instances?: number;
  /**
   * Number of maximum application instances.
   * @optional
   */
  max_instances?: number;
  /**
   * The path to a Dockerfile, or an image URI for the Cloudflare registry.
   */
  image: string;
  /**
   * Build context of the application.
   * @optional - defaults to the directory of `image`.
   */
  image_build_context?: string;
  /**
   * Image variables available to the image at build-time only.
   * For runtime env vars, refer to https://developers.cloudflare.com/containers/examples/env-vars-and-secrets/
   * @optional
   */
  image_vars?: Record<string, string>;
  /**
   * The class name of the Durable Object the container is connected to.
   */
  class_name: string;
  /**
   * The scheduling policy of the application
   * @optional
   * @default "default"
   */
  scheduling_policy?: "default" | "moon" | "regional";
  /**
   * The instance type to be used for the container.
   * Select from one of the following named instance types:
   *  - lite: 1/16 vCPU, 256 MiB memory, and 2 GB disk
   *  - basic: 1/4 vCPU, 1 GiB memory, and 4 GB disk
   *  - standard-1: 1/2 vCPU, 4 GiB memory, and 8 GB disk
   *  - standard-2: 1 vCPU, 6 GiB memory, and 12 GB disk
   *  - standard-3: 2 vCPU, 8 GiB memory, and 16 GB disk
   *  - standard-4: 4 vCPU, 12 GiB memory, and 20 GB disk
   *  - dev: 1/16 vCPU, 256 MiB memory, and 2 GB disk (deprecated, use "lite" instead)
   *  - standard: 1 vCPU, 4 GiB memory, and 4 GB disk (deprecated, use "standard-1" instead)
   *
   * Customers on an enterprise plan have the additional option to set custom limits.
   *
   * @optional
   * @default "dev"
   */
  instance_type?: "dev" | "basic" | "standard" | "lite" | "standard-1" | "standard-2" | "standard-3" | "standard-4" | {
    /** @defaults to 0.0625 (1/16 vCPU) */vcpu?: number; /** @defaults to 256 MiB */
    memory_mib?: number; /** @defaults to 2 GB */
    disk_mb?: number;
  };
  ssh?: {
    /**
     * If enabled, those with write access to a container will be able to SSH into it through Wrangler.
     * @default false
     */
    enabled: boolean;
    /**
     * Port that the SSH service is running on
     * @defaults to 22
     */
    port?: number;
  };
  /**
   * @deprecated Use `ssh` instead.
   * @hidden
   */
  wrangler_ssh?: {
    enabled: boolean;
    port?: number;
  };
  /**
   * SSH public keys to put in the container's authorized_keys file.
   */
  authorized_keys?: {
    name: string;
    public_key: string;
  }[];
  /**
   * Trusted user CA keys to put in the container's trusted_user_ca_keys file.
   */
  trusted_user_ca_keys?: {
    name?: string;
    public_key: string;
  }[];
  /**
   * @deprecated Use top level `containers` fields instead.
   * `configuration.image` should be `image`
   * limits should be set via `instance_type`
   * @hidden
   */
  configuration?: {
    image?: string;
    labels?: {
      name: string;
      value: string;
    }[];
    secrets?: {
      name: string;
      type: "env";
      secret: string;
    }[];
    disk?: {
      size_mb: number;
    };
    vcpu?: number;
    memory_mib?: number;
  };
  /**
   * Scheduling constraints for container placement.
   */
  constraints?: {
    /**
     * Limit container placement to specific geographic regions.
     */
    regions?: ("ENAM" | "WNAM" | "EEUR" | "WEUR" | "APAC" | "SAM" | "ME" | "OC" | "AFR")[];
    /**
     * Restrict containers to compliance boundaries.
     */
    jurisdiction?: "eu" | "fedramp";
    /**
     * @hidden
     */
    cities?: string[];
    /**
     * @deprecated Use `tiers` instead
     * @hidden
     */
    tier?: number;
    /**
     * @hidden
     */
    tiers?: number[];
  };
  /**
   * Scheduling affinities
   * @hidden
   */
  affinities?: {
    colocation?: "datacenter";
    hardware_generation?: "highest-overall-performance";
  };
  /**
   * @deprecated use the `class_name` field instead.
   * @hidden
   */
  durable_objects?: {
    namespace_id: string;
  };
  /**
   * Configures what percentage of instances should be updated at each step of a rollout.
   * You can specify this as a single number, or an array of numbers.
   *
   * If this is a single number, each step will progress by that percentage.
   * The options are 5, 10, 20, 25, 50 or 100.
   *
   * If this is an array, each step specifies the cumulative rollout progress.
   * The final step must be 100.
   *
   * This can be overridden adhoc by deploying with the `--containers-rollout=immediate` flag,
   * which will roll out to 100% of instances in one step.
   *
   * @optional
   * @default [10,100]
   * */
  rollout_step_percentage?: number | number[];
  /**
   * How a rollout should be created. It supports the following modes:
   *  - full_auto: The container application will be rolled out fully automatically.
   *  - none: The container application won't have a roll out or update.
   *  - manual: The container application will be rollout fully by manually actioning progress steps.
   * @optional
   * @default "full_auto"
   * @hidden
   */
  rollout_kind?: "full_auto" | "none" | "full_manual";
  /**
   * Configures the grace period (in seconds) for active instances before being shutdown during a rollout.
   * @optional
   * @default 0
   */
  rollout_active_grace_period?: number;
  /**
   * Directly passed to the API without wrangler-side validation or transformation.
   * @hidden
   */
  unsafe?: Record<string, unknown>;
};
/**
 * Configuration in wrangler for Durable Object Migrations
 */
type DurableObjectMigration = {
  /** A unique identifier for this migration. */tag: string; /** The new Durable Objects being defined. */
  new_classes?: string[]; /** The new SQLite Durable Objects being defined. */
  new_sqlite_classes?: string[]; /** The Durable Objects being renamed. */
  renamed_classes?: {
    from: string;
    to: string;
  }[]; /** The Durable Objects being removed. */
  deleted_classes?: string[];
};
/**
 * The `EnvironmentInheritable` interface declares all the configuration fields for an environment
 * that can be inherited (and overridden) from the top-level environment.
 */
interface EnvironmentInheritable {
  /**
   * The name of your Worker. Alphanumeric + dashes only.
   *
   * @inheritable
   */
  name: string | undefined;
  /**
   * This is the ID of the account associated with your zone.
   * You might have more than one account, so make sure to use
   * the ID of the account associated with the zone/route you
   * provide, if you provide one. It can also be specified through
   * the CLOUDFLARE_ACCOUNT_ID environment variable.
   *
   * @inheritable
   */
  account_id: string | undefined;
  /**
   * A date in the form yyyy-mm-dd, which will be used to determine
   * which version of the Workers runtime is used.
   *
   * More details at https://developers.cloudflare.com/workers/configuration/compatibility-dates
   *
   * @inheritable
   */
  compatibility_date: string | undefined;
  /**
   * A list of flags that enable features from upcoming features of
   * the Workers runtime, usually used together with compatibility_date.
   *
   * More details at https://developers.cloudflare.com/workers/configuration/compatibility-flags/
   *
   * @default []
   * @inheritable
   */
  compatibility_flags: string[];
  /**
   * The entrypoint/path to the JavaScript file that will be executed.
   *
   * @inheritable
   */
  main: string | undefined;
  /**
   * If true then Wrangler will traverse the file tree below `base_dir`;
   * Any files that match `rules` will be included in the deployed Worker.
   * Defaults to true if `no_bundle` is true, otherwise false.
   *
   * @inheritable
   */
  find_additional_modules: boolean | undefined;
  /**
   * Determines whether Wrangler will preserve bundled file names.
   * Defaults to false.
   * If left unset, files will be named using the pattern ${fileHash}-${basename},
   * for example, `34de60b44167af5c5a709e62a4e20c4f18c9e3b6-favicon.ico`.
   *
   * @inheritable
   */
  preserve_file_names: boolean | undefined;
  /**
   * The directory in which module rules should be evaluated when including additional files into a Worker deployment.
   * This defaults to the directory containing the `main` entry point of the Worker if not specified.
   *
   * @inheritable
   */
  base_dir: string | undefined;
  /**
   * Whether we use <name>.<subdomain>.workers.dev to
   * test and deploy your Worker.
   *
   * For reference, see https://developers.cloudflare.com/workers/wrangler/configuration/#workersdev
   *
   * @default true
   * @breaking
   * @inheritable
   */
  workers_dev: boolean | undefined;
  /**
   * Whether we use <version>-<name>.<subdomain>.workers.dev to
   * serve Preview URLs for your Worker.
   *
   * @default false
   * @inheritable
   */
  preview_urls: boolean | undefined;
  /**
   * A list of routes that your Worker should be published to.
   * Only one of `routes` or `route` is required.
   *
   * Only required when workers_dev is false, and there's no scheduled Worker (see `triggers`)
   *
   * For reference, see https://developers.cloudflare.com/workers/wrangler/configuration/#types-of-routes
   *
   * @inheritable
   */
  routes: Route[] | undefined;
  /**
   * A route that your Worker should be published to. Literally
   * the same as routes, but only one.
   * Only one of `routes` or `route` is required.
   *
   * Only required when workers_dev is false, and there's no scheduled Worker
   *
   * @inheritable
   */
  route: Route | undefined;
  /**
   * Path to a custom tsconfig
   *
   * @inheritable
   */
  tsconfig: string | undefined;
  /**
   * The function to use to replace jsx syntax.
   *
   * @default "React.createElement"
   * @inheritable
   */
  jsx_factory: string;
  /**
   * The function to use to replace jsx fragment syntax.
   *
   * @default "React.Fragment"
   * @inheritable
   */
  jsx_fragment: string;
  /**
   * A list of migrations that should be uploaded with your Worker.
   *
   * These define changes in your Durable Object declarations.
   *
   * More details at https://developers.cloudflare.com/workers/learning/using-durable-objects#configuring-durable-object-classes-with-migrations
   *
   * @default []
   * @inheritable
   */
  migrations: DurableObjectMigration[];
  /**
   * "Cron" definitions to trigger a Worker's "scheduled" function.
   *
   * Lets you call Workers periodically, much like a cron job.
   *
   * More details here https://developers.cloudflare.com/workers/platform/cron-triggers
   *
   * For reference, see https://developers.cloudflare.com/workers/wrangler/configuration/#triggers
   *
   * @default {crons:[]}
   * @inheritable
   */
  triggers: {
    crons: string[] | undefined;
  };
  /**
   * Specify limits for runtime behavior.
   * Only supported for the "standard" Usage Model
   *
   * For reference, see https://developers.cloudflare.com/workers/wrangler/configuration/#limits
   *
   * @inheritable
   */
  limits: UserLimits | undefined;
  /**
   * An ordered list of rules that define which modules to import,
   * and what type to import them as. You will need to specify rules
   * to use Text, Data, and CompiledWasm modules, or when you wish to
   * have a .js file be treated as an ESModule instead of CommonJS.
   *
   * For reference, see https://developers.cloudflare.com/workers/wrangler/configuration/#bundling
   *
   * @inheritable
   */
  rules: Rule[];
  /**
   * Configures a custom build step to be run by Wrangler when building your Worker.
   *
   * Refer to the [custom builds documentation](https://developers.cloudflare.com/workers/cli-wrangler/configuration#build)
   * for more details.
   *
   * For reference, see https://developers.cloudflare.com/workers/wrangler/configuration/#custom-builds
   *
   * @default {watch_dir:"./src"}
   */
  build: {
    /** The command used to build your Worker. On Linux and macOS, the command is executed in the `sh` shell and the `cmd` shell for Windows. The `&&` and `||` shell operators may be used. */command?: string; /** The directory in which the command is executed. */
    cwd?: string; /** The directory to watch for changes while using wrangler dev, defaults to the current working directory */
    watch_dir?: string | string[];
  };
  /**
   * Skip internal build steps and directly deploy script
   * @inheritable
   */
  no_bundle: boolean | undefined;
  /**
   * Minify the script before uploading.
   * @inheritable
   */
  minify: boolean | undefined;
  /**
   * Set the `name` property to the original name for functions and classes renamed during minification.
   *
   * See https://esbuild.github.io/api/#keep-names
   *
   * @default true
   * @inheritable
   */
  keep_names: boolean | undefined;
  /**
   * Designates this Worker as an internal-only "first-party" Worker.
   *
   * @inheritable
   */
  first_party_worker: boolean | undefined;
  /**
   * List of bindings that you will send to logfwdr
   *
   * @default {bindings:[]}
   * @inheritable
   */
  logfwdr: {
    bindings: {
      /** The binding name used to refer to logfwdr */name: string; /** The destination for this logged message */
      destination: string;
    }[];
  };
  /**
   * Send Trace Events from this Worker to Workers Logpush.
   *
   * This will not configure a corresponding Logpush job automatically.
   *
   * For more information about Workers Logpush, see:
   * https://blog.cloudflare.com/logpush-for-workers/
   *
   * @inheritable
   */
  logpush: boolean | undefined;
  /**
   * Include source maps when uploading this worker.
   *
   * For reference, see https://developers.cloudflare.com/workers/wrangler/configuration/#source-maps
   *
   * @inheritable
   */
  upload_source_maps: boolean | undefined;
  /**
   * Specify how the Worker should be located to minimize round-trip time.
   *
   * More details: https://developers.cloudflare.com/workers/platform/smart-placement/
   *
   * @inheritable
   */
  placement: {
    mode: "off" | "smart";
    hint?: string;
  } | {
    mode?: "targeted";
    region: string;
  } | {
    mode?: "targeted";
    host: string;
  } | {
    mode?: "targeted";
    hostname: string;
  } | undefined;
  /**
   * Specify the directory of static assets to deploy/serve
   *
   * More details at https://developers.cloudflare.com/workers/frameworks/
   *
   * For reference, see https://developers.cloudflare.com/workers/wrangler/configuration/#assets
   *
   * @inheritable
   */
  assets: Assets | undefined;
  /**
   * Specify the observability behavior of the Worker.
   *
   * For reference, see https://developers.cloudflare.com/workers/wrangler/configuration/#observability
   *
   * @inheritable
   */
  observability: Observability | undefined;
  /**
   * Specify the cache behavior of the Worker.
   *
   * @inheritable
   */
  cache: CacheOptions$1 | undefined;
  /**
   * Specify the compliance region mode of the Worker.
   *
   * Although if the user does not specify a compliance region, the default is `public`,
   * it can be set to `undefined` in configuration to delegate to the CLOUDFLARE_COMPLIANCE_REGION environment variable.
   */
  compliance_region: "public" | "fedramp_high" | undefined;
  /**
   * Configuration for Python modules.
   *
   * @inheritable
   */
  python_modules: {
    /**
     * A list of glob patterns to exclude files from the python_modules directory when bundling.
     *
     * Patterns are relative to the python_modules directory and use glob syntax.
     *
     * @default ["**\*.pyc"]
     */
    exclude: string[];
  };
  /**
   * Configuration for Worker Previews.
   *
   * Previews are branches of your Worker's main instance used to test features
   * in development outside of production. This block defines the settings
   * used when creating Preview deployments via `wrangler preview`.
   *
   * For reference, see https://developers.cloudflare.com/workers/wrangler/configuration/#previews
   *
   * @inheritable
   */
  previews: PreviewsConfig | undefined;
}
type DurableObjectBindings = {
  /** The name of the binding used to refer to the Durable Object */name: string; /** The exported class name of the Durable Object */
  class_name: string; /** The script where the Durable Object is defined (if it's external to this Worker) */
  script_name?: string; /** The service environment of the script_name to bind to */
  environment?: string;
}[];
type WorkflowBinding = {
  /** The name of the binding used to refer to the Workflow */binding: string; /** The name of the Workflow */
  name: string; /** The exported class name of the Workflow */
  class_name: string; /** The script where the Workflow is defined (if it's external to this Worker) */
  script_name?: string; /** Whether the Workflow should be remote or not in local development */
  remote?: boolean; /** Optional limits for the Workflow */
  limits?: {
    /** Maximum number of steps a Workflow instance can execute */steps?: number;
  }; /** Optional cron schedule(s) for automatically triggering workflow instances */
  schedules?: string | string[];
};
/**
 * The `EnvironmentNonInheritable` interface declares all the configuration fields for an environment
 * that cannot be inherited from the top-level environment, and must be defined specifically.
 *
 * If any of these fields are defined at the top-level then they should also be specifically defined
 * for each named environment.
 */
interface EnvironmentNonInheritable {
  /**
   * A map of values to substitute when deploying your Worker.
   *
   * NOTE: This field is not automatically inherited from the top level environment,
   * and so must be specified in every named environment.
   *
   * @default {}
   * @nonInheritable
   */
  define: Record<string, string>;
  /**
   * A map of environment variables to set when deploying your Worker.
   *
   * NOTE: This field is not automatically inherited from the top level environment,
   * and so must be specified in every named environment.
   *
   * For reference, see https://developers.cloudflare.com/workers/wrangler/configuration/#environment-variables
   *
   * @default {}
   * @nonInheritable
   */
  vars: Record<string, string | Json>;
  /**
   * Secrets configuration.
   *
   * NOTE: This field is not automatically inherited from the top level environment,
   * and so must be specified in every named environment.
   *
   * For reference, see https://developers.cloudflare.com/workers/wrangler/configuration/#secrets-configuration-property
   *
   * @nonInheritable
   */
  secrets?: {
    /**
     * List of secret names that are required by your Worker.
     * When defined, this property:
     * - Replaces .dev.vars/.env/process.env inference for type generation
     * - Enables local dev validation with warnings for missing secrets
     */
    required?: string[];
  };
  /**
   * A list of durable objects that your Worker should be bound to.
   *
   * For more information about Durable Objects, see the documentation at
   * https://developers.cloudflare.com/workers/learning/using-durable-objects
   *
   * NOTE: This field is not automatically inherited from the top level environment,
   * and so must be specified in every named environment.
   *
   * For reference, see https://developers.cloudflare.com/workers/wrangler/configuration/#durable-objects
   *
   * @default {bindings:[]}
   * @nonInheritable
   */
  durable_objects: {
    bindings: DurableObjectBindings;
  };
  /**
   * A list of workflows that your Worker should be bound to.
   *
   * NOTE: This field is not automatically inherited from the top level environment,
   * and so must be specified in every named environment.
   *
   * @default []
   * @nonInheritable
   */
  workflows: WorkflowBinding[];
  /**
   * Cloudchamber configuration
   *
   * NOTE: This field is not automatically inherited from the top level environment,
   * and so must be specified in every named environment.
   *
   * @default {}
   * @nonInheritable
   */
  cloudchamber: CloudchamberConfig;
  /**
   * Container related configuration
   *
   * NOTE: This field is not automatically inherited from the top level environment,
   * and so must be specified in every named environment.
   *
   * @default []
   * @nonInheritable
   */
  containers?: ContainerApp[];
  /**
   * These specify any Workers KV Namespaces you want to
   * access from inside your Worker.
   *
   * To learn more about KV Namespaces,
   * see the documentation at https://developers.cloudflare.com/workers/learning/how-kv-works
   *
   * NOTE: This field is not automatically inherited from the top level environment,
   * and so must be specified in every named environment.
   *
   * For reference, see https://developers.cloudflare.com/workers/wrangler/configuration/#kv-namespaces
   *
   * @default []
   * @nonInheritable
   */
  kv_namespaces: {
    /** The binding name used to refer to the KV Namespace */binding: string; /** The ID of the KV namespace */
    id?: string; /** The ID of the KV namespace used during `wrangler dev` */
    preview_id?: string; /** Whether the KV namespace should be remote or not in local development */
    remote?: boolean;
  }[];
  /**
   * These specify bindings to send email from inside your Worker.
   *
   * NOTE: This field is not automatically inherited from the top level environment,
   * and so must be specified in every named environment.
   *
   * For reference, see https://developers.cloudflare.com/workers/wrangler/configuration/#email-bindings
   *
   * @default []
   * @nonInheritable
   */
  send_email: {
    /** The binding name used to refer to the this binding */name: string; /** If this binding should be restricted to a specific verified address */
    destination_address?: string; /** If this binding should be restricted to a set of verified addresses */
    allowed_destination_addresses?: string[]; /** If this binding should be restricted to a set of sender addresses */
    allowed_sender_addresses?: string[]; /** Whether the binding should be remote or not in local development */
    remote?: boolean;
  }[];
  /**
   * Specifies Queues that are bound to this Worker environment.
   *
   * NOTE: This field is not automatically inherited from the top level environment,
   * and so must be specified in every named environment.
   *
   * For reference, see https://developers.cloudflare.com/workers/wrangler/configuration/#queues
   *
   * @default {consumers:[],producers:[]}
   * @nonInheritable
   */
  queues: {
    /** Producer bindings */producers?: {
      /** The binding name used to refer to the Queue in the Worker. */binding: string; /** The name of this Queue. */
      queue: string; /** The number of seconds to wait before delivering a message */
      delivery_delay?: number; /** Whether the Queue producer should be remote or not in local development */
      remote?: boolean;
    }[]; /** Consumer configuration */
    consumers?: {
      /** The name of the queue from which this consumer should consume. */queue: string; /** The consumer type. Only "worker" is supported in wrangler config. Default is "worker". */
      type?: "worker"; /** The maximum number of messages per batch */
      max_batch_size?: number; /** The maximum number of seconds to wait to fill a batch with messages. */
      max_batch_timeout?: number; /** The maximum number of retries for each message. */
      max_retries?: number; /** The queue to send messages that failed to be consumed. */
      dead_letter_queue?: string; /** The maximum number of concurrent consumer Worker invocations. Leaving this unset will allow your consumer to scale to the maximum concurrency needed to keep up with the message backlog. */
      max_concurrency?: number | null; /** The number of milliseconds to wait for pulled messages to become visible again */
      visibility_timeout_ms?: number; /** The number of seconds to wait before retrying a message */
      retry_delay?: number;
    }[];
  };
  /**
   * Specifies R2 buckets that are bound to this Worker environment.
   *
   * NOTE: This field is not automatically inherited from the top level environment,
   * and so must be specified in every named environment.
   *
   * For reference, see https://developers.cloudflare.com/workers/wrangler/configuration/#r2-buckets
   *
   * @default []
   * @nonInheritable
   */
  r2_buckets: {
    /** The binding name used to refer to the R2 bucket in the Worker. */binding: string; /** The name of this R2 bucket at the edge. */
    bucket_name?: string; /** The preview name of this R2 bucket at the edge. */
    preview_bucket_name?: string; /** The jurisdiction that the bucket exists in. Default if not present. */
    jurisdiction?: string; /** Whether the R2 bucket should be remote or not in local development */
    remote?: boolean;
  }[];
  /**
   * Specifies D1 databases that are bound to this Worker environment.
   *
   * NOTE: This field is not automatically inherited from the top level environment,
   * and so must be specified in every named environment.
   *
   * For reference, see https://developers.cloudflare.com/workers/wrangler/configuration/#d1-databases
   *
   * @default []
   * @nonInheritable
   */
  d1_databases: {
    /** The binding name used to refer to the D1 database in the Worker. */binding: string; /** The name of this D1 database. */
    database_name?: string; /** The UUID of this D1 database (not required). */
    database_id?: string; /** The UUID of this D1 database for Wrangler Dev (if specified). */
    preview_database_id?: string; /** The name of the migrations table for this D1 database (defaults to 'd1_migrations'). */
    migrations_table?: string; /** The path to the directory of migrations for this D1 database (defaults to './migrations'). */
    migrations_dir?: string;
    /**
     * A glob pattern (relative to the Wrangler config file) used to discover
     * migration files for this D1 database. Defaults to `${migrations_dir}/*.sql`
     * if not specified.
     *
     * Use this to opt in to nested layouts such as `migrations/*\/migration.sql`
     * (as produced by some ORMs).
     *
     * When `migrations_pattern` is set, `migrations_dir` must also be set, and
     * `migrations_pattern` must start with `${migrations_dir}/`. This keeps the
     * relationship between the two settings explicit and lets Wrangler record
     * each migration's name in the migrations table as a path relative to
     * `migrations_dir`.
     */
    migrations_pattern?: string; /** Internal use only. */
    database_internal_env?: string; /** Whether the D1 database should be remote or not in local development */
    remote?: boolean;
  }[];
  /**
   * Specifies Vectorize indexes that are bound to this Worker environment.
   *
   * NOTE: This field is not automatically inherited from the top level environment,
   * and so must be specified in every named environment.
   *
   * For reference, see https://developers.cloudflare.com/workers/wrangler/configuration/#vectorize-indexes
   *
   * @default []
   * @nonInheritable
   */
  vectorize: {
    /** The binding name used to refer to the Vectorize index in the Worker. */binding: string; /** The name of the index. */
    index_name: string; /** Whether the Vectorize index should be remote or not in local development */
    remote?: boolean;
  }[];
  /**
   * Specifies AI Search namespace bindings that are bound to this Worker environment.
   * Each binding is scoped to a namespace and allows dynamic instance CRUD within it.
   *
   * NOTE: This field is not automatically inherited from the top level environment,
   * and so must be specified in every named environment.
   *
   * @default []
   * @nonInheritable
   */
  ai_search_namespaces: {
    /** The binding name used to refer to the AI Search namespace in the Worker. */binding: string; /** The user-chosen namespace name. Must exist in Cloudflare at deploy time. */
    namespace: string; /** Whether the AI Search namespace binding should be remote in local development */
    remote?: boolean;
  }[];
  /**
   * Specifies AI Search instance bindings that are bound to this Worker environment.
   * Each binding is bound directly to a single pre-existing instance within the "default" namespace.
   *
   * NOTE: This field is not automatically inherited from the top level environment,
   * and so must be specified in every named environment.
   *
   * @default []
   * @nonInheritable
   */
  ai_search: {
    /** The binding name used to refer to the AI Search instance in the Worker. */binding: string; /** The user-chosen instance name. Must exist in Cloudflare at deploy time. */
    instance_name: string; /** Whether the AI Search instance binding should be remote in local development */
    remote?: boolean;
  }[];
  /**
   * Specifies Agent Memory namespace bindings that are bound to this Worker environment.
   *
   * NOTE: This field is not automatically inherited from the top level environment,
   * and so must be specified in every named environment.
   *
   * @default []
   * @nonInheritable
   */
  agent_memory: {
    /** The binding name used to refer to the Agent Memory namespace in the Worker. */binding: string; /** The user-chosen namespace name. Must exist in Cloudflare at deploy time. */
    namespace: string; /** Whether the Agent Memory binding should be remote in local development */
    remote?: boolean;
  }[];
  /**
   * Cloudflare Web Search binding. There is exactly one shared web corpus, so the
   * binding is zero-config -- only the variable name is required, declared as a
   * single object (not an array).
   *
   * NOTE: This field is not automatically inherited from the top level environment,
   * and so must be specified in every named environment.
   *
   * @default {}
   * @nonInheritable
   */
  websearch: {
    /** The binding name used to refer to Web Search in the Worker. */binding: string; /** Whether the Web Search binding should be remote or not in local development */
    remote?: boolean;
  } | undefined;
  /**
   * Specifies Hyperdrive configs that are bound to this Worker environment.
   *
   * NOTE: This field is not automatically inherited from the top level environment,
   * and so must be specified in every named environment.
   *
   * For reference, see https://developers.cloudflare.com/workers/wrangler/configuration/#hyperdrive
   *
   * @default []
   * @nonInheritable
   */
  hyperdrive: {
    /** The binding name used to refer to the project in the Worker. */binding: string; /** The id of the database. */
    id: string; /** The local database connection string for `wrangler dev` */
    localConnectionString?: string;
  }[];
  /**
   * Specifies service bindings (Worker-to-Worker) that are bound to this Worker environment.
   *
   * NOTE: This field is not automatically inherited from the top level environment,
   * and so must be specified in every named environment.
   *
   * For reference, see https://developers.cloudflare.com/workers/wrangler/configuration/#service-bindings
   *
   * @default []
   * @nonInheritable
   */
  services: {
    /** The binding name used to refer to the bound service. */binding: string;
    /**
     * The name of the service.
     * To bind to a worker in a specific environment,
     * you should use the format `<worker_name>-<environment_name>`.
     */
    service: string;
    /**
     * @hidden
     * @deprecated you should use `service: <worker_name>-<environment_name>` instead.
     * This refers to the deprecated concept of 'service environments'.
     * The environment of the service (e.g. production, staging, etc).
     */
    environment?: string; /** Optionally, the entrypoint (named export) of the service to bind to. */
    entrypoint?: string; /** Optional properties that will be made available to the service via ctx.props. */
    props?: Record<string, unknown>; /** Whether the service binding should be remote or not in local development */
    remote?: boolean;
  }[] | undefined;
  /**
   * Specifies analytics engine datasets that are bound to this Worker environment.
   *
   * NOTE: This field is not automatically inherited from the top level environment,
   * and so must be specified in every named environment.
   *
   * For reference, see https://developers.cloudflare.com/workers/wrangler/configuration/#analytics-engine-datasets
   *
   * @default []
   * @nonInheritable
   */
  analytics_engine_datasets: {
    /** The binding name used to refer to the dataset in the Worker. */binding: string; /** The name of this dataset to write to. */
    dataset?: string;
  }[];
  /**
   * A browser that will be usable from the Worker.
   *
   * NOTE: This field is not automatically inherited from the top level environment,
   * and so must be specified in every named environment.
   *
   * For reference, see https://developers.cloudflare.com/workers/wrangler/configuration/#browser-rendering
   *
   * @default {}
   * @nonInheritable
   */
  browser: {
    binding: string; /** Whether the Browser binding should be remote or not in local development */
    remote?: boolean;
  } | undefined;
  /**
   * Binding to the AI project.
   *
   * NOTE: This field is not automatically inherited from the top level environment,
   * and so must be specified in every named environment.
   *
   * For reference, see https://developers.cloudflare.com/workers/wrangler/configuration/#workers-ai
   *
   * @default {}
   * @nonInheritable
   */
  ai: {
    binding: string;
    staging?: boolean; /** Whether the AI binding should be remote or not in local development */
    remote?: boolean;
  } | undefined;
  /**
   * Binding to Cloudflare Images
   *
   * NOTE: This field is not automatically inherited from the top level environment,
   * and so must be specified in every named environment.
   *
   * For reference, see https://developers.cloudflare.com/workers/wrangler/configuration/#images
   *
   * @default {}
   * @nonInheritable
   */
  images: {
    binding: string; /** Whether the Images binding should be remote or not in local development */
    remote?: boolean;
  } | undefined;
  /**
   * Binding to Cloudflare Media Transformations
   *
   * NOTE: This field is not automatically inherited from the top level environment,
   * and so must be specified in every named environment.
   *
   * @default {}
   * @nonInheritable
   */
  media: {
    binding: string; /** Whether the Media binding should be remote or not */
    remote?: boolean;
  } | undefined;
  /**
   * Binding to Cloudflare Stream
   *
   * NOTE: This field is not automatically inherited from the top level environment,
   * and so must be specified in every named environment.
   *
   * @default {}
   * @nonInheritable
   */
  stream: {
    binding: string; /** Whether the Stream binding should be remote or not in local development */
    remote?: boolean;
  } | undefined;
  /**
   * Binding to the Worker Version's metadata
   */
  version_metadata: {
    binding: string;
  } | undefined;
  /**
   * "Unsafe" tables for features that aren't directly supported by wrangler.
   *
   * NOTE: This field is not automatically inherited from the top level environment,
   * and so must be specified in every named environment.
   *
   * @default {}
   * @nonInheritable
   */
  unsafe: {
    /**
     * A set of bindings that should be put into a Worker's upload metadata without changes. These
     * can be used to implement bindings for features that haven't released and aren't supported
     * directly by wrangler or miniflare.
     */
    bindings?: UnsafeBinding[];
    /**
     * Arbitrary key/value pairs that will be included in the uploaded metadata.  Values specified
     * here will always be applied to metadata last, so can add new or override existing fields.
     */
    metadata?: {
      [key: string]: unknown;
    };
    /**
     * Used for internal capnp uploads for the Workers runtime
     */
    capnp?: {
      base_path: string;
      source_schemas: string[];
      compiled_schema?: never;
    } | {
      base_path?: never;
      source_schemas?: never;
      compiled_schema: string;
    };
  };
  /**
   * Specifies a list of mTLS certificates that are bound to this Worker environment.
   *
   * NOTE: This field is not automatically inherited from the top level environment,
   * and so must be specified in every named environment.
   *
   * For reference, see https://developers.cloudflare.com/workers/wrangler/configuration/#mtls-certificates
   *
   * @default []
   * @nonInheritable
   */
  mtls_certificates: {
    /** The binding name used to refer to the certificate in the Worker */binding: string; /** The uuid of the uploaded mTLS certificate */
    certificate_id: string; /** Whether the mtls fetcher should be remote or not in local development */
    remote?: boolean;
  }[];
  /**
   * Specifies a list of Tail Workers that are bound to this Worker environment
   *
   * NOTE: This field is not automatically inherited from the top level environment,
   * and so must be specified in every named environment.
   *
   * @default []
   * @nonInheritable
   */
  tail_consumers?: TailConsumer[];
  /**
   * Specifies a list of Streaming Tail Workers that are bound to this Worker environment
   *
   * NOTE: This field is not automatically inherited from the top level environment,
   * and so must be specified in every named environment.
   *
   * @default []
   * @nonInheritable
   */
  streaming_tail_consumers?: StreamingTailConsumer[];
  /**
   * Specifies namespace bindings that are bound to this Worker environment.
   *
   * NOTE: This field is not automatically inherited from the top level environment,
   * and so must be specified in every named environment.
   *
   * For reference, see https://developers.cloudflare.com/workers/wrangler/configuration/#dispatch-namespace-bindings-workers-for-platforms
   *
   * @default []
   * @nonInheritable
   */
  dispatch_namespaces: {
    /** The binding name used to refer to the bound service. */binding: string; /** The namespace to bind to. */
    namespace: string; /** Details about the outbound Worker which will handle outbound requests from your namespace */
    outbound?: DispatchNamespaceOutbound; /** Whether the Dispatch Namespace should be remote or not in local development */
    remote?: boolean;
  }[];
  /**
   * Specifies list of Pipelines bound to this Worker environment
   *
   * NOTE: This field is not automatically inherited from the top level environment,
   * and so must be specified in every named environment.
   *
   * @default []
   * @nonInheritable
   */
  pipelines: {
    /** The binding name used to refer to the bound service. */binding: string; /** Id of the Stream to bind */
    stream?: string;
    /**
     * Id of the Stream to bind
     * @deprecated Use `stream` instead.
     */
    pipeline?: string; /** Whether the pipeline should be remote or not in local development */
    remote?: boolean;
  }[];
  /**
   * Specifies Secret Store bindings that are bound to this Worker environment.
   *
   * NOTE: This field is not automatically inherited from the top level environment,
   * and so must be specified in every named environment.
   *
   * @default []
   * @nonInheritable
   */
  secrets_store_secrets: {
    /** The binding name used to refer to the bound service. */binding: string; /** Id of the secret store */
    store_id: string; /** Name of the secret */
    secret_name: string;
  }[];
  /**
   * Specifies Artifacts bindings that are bound to this Worker environment.
   * Artifacts provides git-compatible file storage on Cloudflare Workers.
   *
   * NOTE: This field is not automatically inherited from the top level environment,
   * and so must be specified in every named environment.
   *
   * @default []
   * @nonInheritable
   */
  artifacts: {
    /** The binding name used to refer to the Artifacts instance. */binding: string; /** The namespace to use. */
    namespace: string; /** Whether to use the remote Artifacts service in local dev. */
    remote?: boolean;
  }[];
  /**
   * **DO NOT USE**. Hello World Binding Config to serve as an explanatory example.
   *
   * NOTE: This field is not automatically inherited from the top level environment,
   * and so must be specified in every named environment.
   *
   * @default []
   * @nonInheritable
   */
  unsafe_hello_world: {
    /** The binding name used to refer to the bound service. */binding: string; /** Whether the timer is enabled */
    enable_timer?: boolean;
  }[];
  /**
   * Specifies Flagship feature flag bindings that are bound to this Worker environment.
   *
   * NOTE: This field is not automatically inherited from the top level environment,
   * and so must be specified in every named environment.
   *
   * @default []
   * @nonInheritable
   */
  flagship: {
    /** The binding name used to refer to the bound Flagship service. */binding: string; /** The Flagship app ID to bind to. */
    app_id: string; /** Set to `true` to suppress the remote binding warning in local dev. Flagship bindings are always remote. */
    remote?: boolean;
  }[];
  /**
   * Specifies rate limit bindings that are bound to this Worker environment.
   *
   * NOTE: This field is not automatically inherited from the top level environment,
   * and so must be specified in every named environment.
   *
   * @default []
   * @nonInheritable
   */
  ratelimits: {
    /** The binding name used to refer to the rate limiter in the Worker. */name: string; /** The namespace ID for this rate limiter. */
    namespace_id: string; /** Simple rate limiting configuration. */
    simple: {
      /** The maximum number of requests allowed in the time period. */limit: number; /** The time period in seconds (10 for ten seconds, 60 for one minute). */
      period: 10 | 60;
    };
  }[];
  /**
   * Specifies Worker Loader bindings that are bound to this Worker environment.
   *
   * NOTE: This field is not automatically inherited from the top level environment,
   * and so must be specified in every named environment.
   *
   * @default []
   * @nonInheritable
   */
  worker_loaders: {
    /** The binding name used to refer to the Worker Loader in the Worker. */binding: string;
  }[];
  /**
   * Specifies VPC services that are bound to this Worker environment.
   *
   * NOTE: This field is not automatically inherited from the top level environment,
   * and so must be specified in every named environment.
   *
   * @default []
   * @nonInheritable
   */
  vpc_services: {
    /** The binding name used to refer to the VPC service in the Worker. */binding: string; /** The service ID of the VPC connectivity service. */
    service_id: string; /** Whether the VPC service is remote or not */
    remote?: boolean;
  }[];
  /**
   * Specifies VPC networks that are bound to this Worker environment.
   *
   * NOTE: This field is not automatically inherited from the top level environment,
   * and so must be specified in every named environment.
   *
   * @default []
   * @nonInheritable
   */
  vpc_networks: ({
    /** The binding name used to refer to the VPC network in the Worker. */binding: string; /** The tunnel ID of the Cloudflare Tunnel to route traffic through. Mutually exclusive with network_id. */
    tunnel_id: string; /** Whether the VPC network is remote or not */
    remote?: boolean;
  } | {
    /** The binding name used to refer to the VPC network in the Worker. */binding: string; /** The network ID to route traffic through. Mutually exclusive with tunnel_id. */
    network_id: string; /** Whether the VPC network is remote or not */
    remote?: boolean;
  })[];
}
/**
 * The raw environment configuration that we read from the config file.
 *
 * All the properties are optional, and will be replaced with defaults in the configuration that
 * is used in the rest of the codebase.
 */
type RawEnvironment = Partial<Environment>;
/**
 * A bundling resolver rule, defining the modules type for paths that match the specified globs.
 */
type Rule = {
  type: ConfigModuleRuleType;
  globs: string[];
  fallthrough?: boolean;
};
/**
 * The possible types for a `Rule`.
 */
type ConfigModuleRuleType = "ESModule" | "CommonJS" | "CompiledWasm" | "Text" | "Data" | "PythonModule" | "PythonRequirement";
type TailConsumer = {
  /** The name of the service tail events will be forwarded to. */service: string; /** (Optional) The environment of the service. */
  environment?: string;
};
type StreamingTailConsumer = {
  /** The name of the service streaming tail events will be forwarded to. */service: string;
};
interface DispatchNamespaceOutbound {
  /** Name of the service handling the outbound requests */
  service: string;
  /** (Optional) Name of the environment handling the outbound requests. */
  environment?: string;
  /** (Optional) List of parameter names, for sending context from your dispatch Worker to the outbound handler */
  parameters?: string[];
}
interface UserLimits {
  /** Maximum allowed CPU time for a Worker's invocation in milliseconds */
  cpu_ms?: number;
  /** Maximum allowed number of fetch requests that a Worker's invocation can execute */
  subrequests?: number;
}
type Assets = {
  /** Absolute path to assets directory */directory?: string; /** Name of `env` binding property in the User Worker. */
  binding?: string; /** How to handle HTML requests. */
  html_handling?: "auto-trailing-slash" | "force-trailing-slash" | "drop-trailing-slash" | "none"; /** How to handle requests that do not match an asset. */
  not_found_handling?: "single-page-application" | "404-page" | "none";
  /**
   * Matches will be routed to the User Worker, and matches to negative rules will go to the Asset Worker.
   *
   * Can also be `true`, indicating that every request should be routed to the User Worker.
   */
  run_worker_first?: string[] | boolean;
};
interface Observability {
  /** If observability is enabled for this Worker */
  enabled?: boolean;
  /** The sampling rate */
  head_sampling_rate?: number;
  logs?: {
    enabled?: boolean; /** The sampling rate */
    head_sampling_rate?: number; /** Set to false to disable invocation logs */
    invocation_logs?: boolean;
    /**
     * If logs should be persisted to the Cloudflare observability platform where they can be queried in the dashboard.
     *
     * @default true
     */
    persist?: boolean;
    /**
     * What destinations logs emitted from the Worker should be sent to.
     *
     * @default []
     */
    destinations?: string[];
  };
  traces?: {
    enabled?: boolean; /** The sampling rate */
    head_sampling_rate?: number;
    /**
     * If traces should be persisted to the Cloudflare observability platform where they can be queried in the dashboard.
     *
     * @default true
     */
    persist?: boolean;
    /**
     * What destinations traces emitted from the Worker should be sent to.
     *
     * @default []
     */
    destinations?: string[];
  };
}
interface CacheOptions$1 {
  /** If cache is enabled for this Worker */
  enabled: boolean;
}
type DockerConfiguration = {
  /** Socket used by miniflare to communicate with Docker */socketPath: string; /** Docker image name for the container egress interceptor sidecar */
  containerEgressInterceptorImage?: string;
};
type ContainerEngine = {
  localDocker: DockerConfiguration;
} | string;
/**
 * Configuration for Worker Previews.
 *
 * This defines the settings used when creating Preview deployments.
 * Previews are branches of your Worker's main instance used to test features
 * during feature development outside of production.
 *
 * The `previews` block contains any intentionally divergent configuration intended solely for Previews, including:
 * - All non-inheritable properties (environment variables and bindings like KV, D1, R2, etc.)
 * - Select inheritable properties: `logpush`, `observability`, `limits`, `cache`
 *
 * @inheritable
 */
interface PreviewsConfig extends Partial<EnvironmentNonInheritable>, Partial<Pick<EnvironmentInheritable, "logpush" | "observability" | "limits" | "cache">> {}
/**
 * This is the static type definition for the configuration object.
 *
 * It reflects a normalized and validated version of the configuration that you can write in a Wrangler configuration file,
 * and optionally augment with arguments passed directly to wrangler.
 *
 * For more information about the configuration object, see the
 * documentation at https://developers.cloudflare.com/workers/cli-wrangler/configuration
 *
 * Notes:
 *
 * - Fields that are only specified in `ConfigFields` and not `Environment` can only appear
 *   in the top level config and should not appear in any environments.
 * - Fields that are specified in `PagesConfigFields` are only relevant for Pages projects
 * - All top level fields in config and environments are optional in the Wrangler configuration file.
 *
 * Legend for the annotations:
 *
 * - `@breaking`: the deprecation/optionality is a breaking change from Wrangler v1.
 * - `@todo`: there's more work to be done (with details attached).
 */
type RawConfig = Partial<ConfigFields<RawDevConfig>> & PagesConfigFields & RawEnvironment & EnvironmentMap & {
  $schema?: string;
};
interface ConfigFields<Dev extends RawDevConfig> {
  /**
   * A boolean to enable "legacy" style wrangler environments (from Wrangler v1).
   * These have been superseded by Services, but there may be projects that won't
   * (or can't) use them. If you're using a legacy environment, you can set this
   * to `true` to enable it.
   */
  legacy_env: boolean;
  /**
   * Whether Wrangler should send usage metrics to Cloudflare for this project.
   *
   * When defined this will override any user settings.
   * Otherwise, Wrangler will use the user's preference.
   */
  send_metrics: boolean | undefined;
  /**
   * Options to configure the development server that your worker will use.
   *
   * For reference, see https://developers.cloudflare.com/workers/wrangler/configuration/#local-development-settings
   */
  dev: Dev;
  /**
   * The definition of a Worker Site, a feature that lets you upload
   * static assets with your Worker.
   *
   * More details at https://developers.cloudflare.com/workers/platform/sites
   *
   * For reference, see https://developers.cloudflare.com/workers/wrangler/configuration/#workers-sites
   */
  site: {
    /**
     * The directory containing your static assets.
     *
     * It must be a path relative to your Wrangler configuration file.
     * Example: bucket = "./public"
     *
     * If there is a `site` field then it must contain this `bucket` field.
     */
    bucket: string;
    /**
     * The location of your Worker script.
     *
     * @deprecated DO NOT use this (it's a holdover from Wrangler v1.x). Either use the top level `main` field, or pass the path to your entry file as a command line argument.
     * @breaking
     */
    "entry-point"?: string;
    /**
     * An exclusive list of .gitignore-style patterns that match file
     * or directory names from your bucket location. Only matched
     * items will be uploaded. Example: include = ["upload_dir"]
     *
     * @optional
     * @default []
     */
    include?: string[];
    /**
     * A list of .gitignore-style patterns that match files or
     * directories in your bucket that should be excluded from
     * uploads. Example: exclude = ["ignore_dir"]
     *
     * @optional
     * @default []
     */
    exclude?: string[];
  } | undefined;
  /**
   * A list of wasm modules that your worker should be bound to. This is
   * the "legacy" way of binding to a wasm module. ES module workers should
   * do proper module imports.
   */
  wasm_modules: {
    [key: string]: string;
  } | undefined;
  /**
   * A list of text files that your worker should be bound to. This is
   * the "legacy" way of binding to a text file. ES module workers should
   * do proper module imports.
   */
  text_blobs: {
    [key: string]: string;
  } | undefined;
  /**
   * A list of data files that your worker should be bound to. This is
   * the "legacy" way of binding to a data file. ES module workers should
   * do proper module imports.
   */
  data_blobs: {
    [key: string]: string;
  } | undefined;
  /**
   * A map of module aliases. Lets you swap out a module for any others.
   * Corresponds with esbuild's `alias` config
   *
   * For reference, see https://developers.cloudflare.com/workers/wrangler/configuration/#module-aliasing
   */
  alias: {
    [key: string]: string;
  } | undefined;
  /**
   * By default, the Wrangler configuration file is the source of truth for your environment configuration, like a terraform file.
   *
   * If you change your vars in the dashboard, wrangler *will* override/delete them on its next deploy.
   *
   * If you want to keep your dashboard vars when wrangler deploys, set this field to true.
   *
   * @default false
   * @nonInheritable
   */
  keep_vars?: boolean;
}
interface PagesConfigFields {
  /**
   * The directory of static assets to serve.
   *
   * The presence of this field in a Wrangler configuration file indicates a Pages project,
   * and will prompt the handling of the configuration file according to the
   * Pages-specific validation rules.
   */
  pages_build_output_dir?: string;
}
interface DevConfig {
  /**
   * IP address for the local dev server to listen on,
   *
   * @default localhost
   */
  ip: string;
  /**
   * Port for the local dev server to listen on
   *
   * @default 8787
   */
  port: number | undefined;
  /**
   * Port for the local dev server's inspector to listen on
   *
   * @default 9229
   */
  inspector_port: number | undefined;
  /**
   * IP address for the local dev server's inspector to listen on
   *
   * @default 127.0.0.1
   */
  inspector_ip: string | undefined;
  /**
   * Protocol that local wrangler dev server listens to requests on.
   *
   * @default http
   */
  local_protocol: "http" | "https";
  /**
   * Protocol that wrangler dev forwards requests on
   *
   * Setting this to `http` is not currently implemented for remote mode.
   * See https://github.com/cloudflare/workers-sdk/issues/583
   *
   * @default https
   */
  upstream_protocol: "https" | "http";
  /**
   * Host to forward requests to, defaults to the host of the first route of project
   */
  host: string | undefined;
  /**
   * When developing, whether to build and connect to containers. This requires a Docker daemon to be running.
   * Defaults to `true`.
   *
   * @default true
   */
  enable_containers: boolean;
  /**
   * Either the Docker unix socket i.e. `unix:///var/run/docker.sock` or a full configuration.
   * Note that windows is only supported via WSL at the moment
   */
  container_engine: ContainerEngine | undefined;
  /**
   * Re-generate your worker types when your Wrangler configuration file changes.
   *
   * @default false
   */
  generate_types: boolean;
}
type RawDevConfig = Partial<DevConfig>;
interface EnvironmentMap {
  /**
   * The `env` section defines overrides for the configuration for different environments.
   *
   * All environment fields can be specified at the top level of the config indicating the default environment settings.
   *
   * - Some fields are inherited and overridable in each environment.
   * - But some are not inherited and must be explicitly specified in every environment, if they are specified at the top level.
   *
   * For more information, see the documentation at https://developers.cloudflare.com/workers/cli-wrangler/configuration#environments
   *
   * @default {}
   */
  env?: {
    [envName: string]: RawEnvironment;
  };
}
type AutocompletePrimitiveBaseType<T> = T extends string ? string : T extends number ? number : T extends boolean ? boolean : never;
type Autocomplete<T> = T | (AutocompletePrimitiveBaseType<T> & Record<never, never>);
/**
 * The header type declaration of `undici`.
 */
type IncomingHttpHeaders = Record<string, string | string[] | undefined>;
type HeaderNames = Autocomplete<'Accept' | 'Accept-CH' | 'Accept-Charset' | 'Accept-Encoding' | 'Accept-Language' | 'Accept-Patch' | 'Accept-Post' | 'Accept-Ranges' | 'Access-Control-Allow-Credentials' | 'Access-Control-Allow-Headers' | 'Access-Control-Allow-Methods' | 'Access-Control-Allow-Origin' | 'Access-Control-Expose-Headers' | 'Access-Control-Max-Age' | 'Access-Control-Request-Headers' | 'Access-Control-Request-Method' | 'Age' | 'Allow' | 'Alt-Svc' | 'Alt-Used' | 'Authorization' | 'Cache-Control' | 'Clear-Site-Data' | 'Connection' | 'Content-Disposition' | 'Content-Encoding' | 'Content-Language' | 'Content-Length' | 'Content-Location' | 'Content-Range' | 'Content-Security-Policy' | 'Content-Security-Policy-Report-Only' | 'Content-Type' | 'Cookie' | 'Cross-Origin-Embedder-Policy' | 'Cross-Origin-Opener-Policy' | 'Cross-Origin-Resource-Policy' | 'Date' | 'Device-Memory' | 'ETag' | 'Expect' | 'Expect-CT' | 'Expires' | 'Forwarded' | 'From' | 'Host' | 'If-Match' | 'If-Modified-Since' | 'If-None-Match' | 'If-Range' | 'If-Unmodified-Since' | 'Keep-Alive' | 'Last-Modified' | 'Link' | 'Location' | 'Max-Forwards' | 'Origin' | 'Permissions-Policy' | 'Priority' | 'Proxy-Authenticate' | 'Proxy-Authorization' | 'Range' | 'Referer' | 'Referrer-Policy' | 'Retry-After' | 'Sec-Fetch-Dest' | 'Sec-Fetch-Mode' | 'Sec-Fetch-Site' | 'Sec-Fetch-User' | 'Sec-Purpose' | 'Sec-WebSocket-Accept' | 'Server' | 'Server-Timing' | 'Service-Worker-Navigation-Preload' | 'Set-Cookie' | 'SourceMap' | 'Strict-Transport-Security' | 'TE' | 'Timing-Allow-Origin' | 'Trailer' | 'Transfer-Encoding' | 'Upgrade' | 'Upgrade-Insecure-Requests' | 'User-Agent' | 'Vary' | 'Via' | 'WWW-Authenticate' | 'X-Content-Type-Options' | 'X-Frame-Options'>;
type IANARegisteredMimeType = Autocomplete<'audio/aac' | 'video/x-msvideo' | 'image/avif' | 'video/av1' | 'application/octet-stream' | 'image/bmp' | 'text/css' | 'text/csv' | 'application/vnd.ms-fontobject' | 'application/epub+zip' | 'image/gif' | 'application/gzip' | 'text/html' | 'image/x-icon' | 'text/calendar' | 'image/jpeg' | 'text/javascript' | 'application/json' | 'application/ld+json' | 'audio/x-midi' | 'audio/mpeg' | 'video/mp4' | 'video/mpeg' | 'audio/ogg' | 'video/ogg' | 'application/ogg' | 'audio/opus' | 'font/otf' | 'application/pdf' | 'image/png' | 'application/rtf' | 'image/svg+xml' | 'image/tiff' | 'video/mp2t' | 'font/ttf' | 'text/plain' | 'application/wasm' | 'video/webm' | 'audio/webm' | 'image/webp' | 'font/woff' | 'font/woff2' | 'application/xhtml+xml' | 'application/xml' | 'application/zip' | 'video/3gpp' | 'video/3gpp2' | 'model/gltf+json' | 'model/gltf-binary'>;
type KnownHeaderValues = {
  'content-type': IANARegisteredMimeType;
};
type HeaderRecord = { [K in HeaderNames | Lowercase<HeaderNames>]?: Lowercase<K> extends keyof KnownHeaderValues ? KnownHeaderValues[Lowercase<K>] : string };
declare class BodyReadable extends Readable {
  constructor(opts: {
    resume: (this: Readable, size: number) => void | null;
    abort: () => void | null;
    contentType?: string;
    contentLength?: number;
    highWaterMark?: number;
  });
  /** Consumes and returns the body as a string
   *  https://fetch.spec.whatwg.org/#dom-body-text
   */
  text(): Promise<string>;
  /** Consumes and returns the body as a JavaScript Object
   *  https://fetch.spec.whatwg.org/#dom-body-json
   */
  json(): Promise<unknown>;
  /** Consumes and returns the body as a Blob
   *  https://fetch.spec.whatwg.org/#dom-body-blob
   */
  blob(): Promise<Blob>;
  /** Consumes and returns the body as an Uint8Array
   *  https://fetch.spec.whatwg.org/#dom-body-bytes
   */
  bytes(): Promise<Uint8Array>;
  /** Consumes and returns the body as an ArrayBuffer
   *  https://fetch.spec.whatwg.org/#dom-body-arraybuffer
   */
  arrayBuffer(): Promise<ArrayBuffer>;
  /** Not implemented
   *
   *  https://fetch.spec.whatwg.org/#dom-body-formdata
   */
  formData(): Promise<never>;
  /** Returns true if the body is not null and the body has been consumed
   *
   *  Otherwise, returns false
   *
   * https://fetch.spec.whatwg.org/#dom-body-bodyused
   */
  readonly bodyUsed: boolean;
  /**
   * If body is null, it should return null as the body
   *
   *  If body is not null, should return the body as a ReadableStream
   *
   *  https://fetch.spec.whatwg.org/#dom-body-body
   */
  readonly body: never | undefined;
  /** Dumps the response body by reading `limit` number of bytes.
   * @param opts.limit Number of bytes to read (optional) - Default: 131072
   * @param opts.signal AbortSignal to cancel the operation (optional)
   */
  dump(opts?: {
    limit: number;
    signal?: AbortSignal;
  }): Promise<void>;
}
type BodyInit = ArrayBuffer | AsyncIterable<Uint8Array> | Blob | FormData | Iterable<Uint8Array> | NodeJS.ArrayBufferView | URLSearchParams | null | string;
interface SpecIterator<T, TReturn = any, TNext = undefined> {
  next(...args: [] | [TNext]): IteratorResult<T, TReturn>;
}
interface SpecIteratorObject<T, TReturn = undefined, TNext = unknown> extends SpecIterator<T, TReturn, TNext> {
  [Symbol.iterator](): SpecIteratorObject<T, TReturn, TNext>;
  map<U>(callbackfn: (value: T, index: number) => U): SpecIteratorObject<U>;
  filter<S extends T>(predicate: (value: T, index: number) => value is S): SpecIteratorObject<S>;
  filter(predicate: (value: T, index: number) => unknown): SpecIteratorObject<T>;
  take(limit: number): SpecIteratorObject<T>;
  drop(count: number): SpecIteratorObject<T>;
  flatMap<U>(callbackfn: (value: T, index: number) => Iterator<U> | Iterable<U>): SpecIteratorObject<U>;
  reduce(callbackfn: (previousValue: T, currentValue: T, currentIndex: number) => T): T;
  reduce(callbackfn: (previousValue: T, currentValue: T, currentIndex: number) => T, initialValue: T): T;
  reduce<U>(callbackfn: (previousValue: U, currentValue: T, currentIndex: number) => U, initialValue: U): U;
  toArray(): T[];
  forEach(callbackfn: (value: T, index: number) => void): void;
  some(predicate: (value: T, index: number) => unknown): boolean;
  every(predicate: (value: T, index: number) => unknown): boolean;
  find<S extends T>(predicate: (value: T, index: number) => value is S): S | undefined;
  find(predicate: (value: T, index: number) => unknown): T | undefined;
  readonly [Symbol.toStringTag]: string;
}
interface SpecIterableIterator<T> extends SpecIteratorObject<T> {
  [Symbol.iterator](): SpecIterableIterator<T>;
}
interface SpecIterable<T> {
  [Symbol.iterator](): SpecIterableIterator<T>;
}
type HeadersInit = [string, string][] | HeaderRecord | Headers;
declare class Headers implements SpecIterable<[string, string]> {
  constructor(init?: HeadersInit);
  readonly append: (name: string, value: string) => void;
  readonly delete: (name: string) => void;
  readonly get: (name: string) => string | null;
  readonly has: (name: string) => boolean;
  readonly set: (name: string, value: string) => void;
  readonly getSetCookie: () => string[];
  readonly forEach: (callbackfn: (value: string, key: string, iterable: Headers) => void, thisArg?: unknown) => void;
  readonly keys: () => SpecIterableIterator<string>;
  readonly values: () => SpecIterableIterator<string>;
  readonly entries: () => SpecIterableIterator<[string, string]>;
  readonly [Symbol.iterator]: () => SpecIterableIterator<[string, string]>;
}
declare module 'node:buffer' {
  interface File {
    readonly [Symbol.toStringTag]: string;
  }
}
/**
 * A `string` or `File` that represents a single value from a set of `FormData` key-value pairs.
 */
declare type FormDataEntryValue = string | File;
/**
 * Provides a way to easily construct a set of key/value pairs representing form fields and their values, which can then be easily sent using fetch().
 */
declare class FormData {
  /**
   * Appends a new value onto an existing key inside a FormData object,
   * or adds the key if it does not already exist.
   *
   * The difference between `set()` and `append()` is that if the specified key already exists, `set()` will overwrite all existing values with the new one, whereas `append()` will append the new value onto the end of the existing set of values.
   *
   * @param name The name of the field whose data is contained in `value`.
   * @param value The field's value. This can be [`Blob`](https://developer.mozilla.org/en-US/docs/Web/API/Blob)
    or [`File`](https://developer.mozilla.org/en-US/docs/Web/API/File). If none of these are specified the value is converted to a string.
   * @param fileName The filename reported to the server, when a Blob or File is passed as the second parameter. The default filename for Blob objects is "blob". The default filename for File objects is the file's filename.
   */
  append(name: string, value: unknown, fileName?: string): void;
  /**
   * Set a new value for an existing key inside FormData,
   * or add the new field if it does not already exist.
   *
   * @param name The name of the field whose data is contained in `value`.
   * @param value The field's value. This can be [`Blob`](https://developer.mozilla.org/en-US/docs/Web/API/Blob)
    or [`File`](https://developer.mozilla.org/en-US/docs/Web/API/File). If none of these are specified the value is converted to a string.
   * @param fileName The filename reported to the server, when a Blob or File is passed as the second parameter. The default filename for Blob objects is "blob". The default filename for File objects is the file's filename.
   *
   */
  set(name: string, value: unknown, fileName?: string): void;
  /**
   * Returns the first value associated with a given key from within a `FormData` object.
   * If you expect multiple values and want all of them, use the `getAll()` method instead.
   *
   * @param {string} name A name of the value you want to retrieve.
   *
   * @returns A `FormDataEntryValue` containing the value. If the key doesn't exist, the method returns null.
   */
  get(name: string): FormDataEntryValue | null;
  /**
   * Returns all the values associated with a given key from within a `FormData` object.
   *
   * @param {string} name A name of the value you want to retrieve.
   *
   * @returns An array of `FormDataEntryValue` whose key matches the value passed in the `name` parameter. If the key doesn't exist, the method returns an empty list.
   */
  getAll(name: string): FormDataEntryValue[];
  /**
   * Returns a boolean stating whether a `FormData` object contains a certain key.
   *
   * @param name A string representing the name of the key you want to test for.
   *
   * @return A boolean value.
   */
  has(name: string): boolean;
  /**
   * Deletes a key and its value(s) from a `FormData` object.
   *
   * @param name The name of the key you want to delete.
   */
  delete(name: string): void;
  /**
   * Executes given callback function for each field of the FormData instance
   */
  forEach: (callbackfn: (value: FormDataEntryValue, key: string, iterable: FormData) => void, thisArg?: unknown) => void;
  /**
   * Returns an [`iterator`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Iteration_protocols) allowing to go through all keys contained in this `FormData` object.
   * Each key is a `string`.
   */
  keys: () => SpecIterableIterator<string>;
  /**
   * Returns an [`iterator`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Iteration_protocols) allowing to go through all values contained in this object `FormData` object.
   * Each value is a [`FormDataValue`](https://developer.mozilla.org/en-US/docs/Web/API/FormDataEntryValue).
   */
  values: () => SpecIterableIterator<FormDataEntryValue>;
  /**
   * Returns an [`iterator`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Iteration_protocols) allowing to go through the `FormData` key/value pairs.
   * The key of each pair is a string; the value is a [`FormDataValue`](https://developer.mozilla.org/en-US/docs/Web/API/FormDataEntryValue).
   */
  entries: () => SpecIterableIterator<[string, FormDataEntryValue]>;
  /**
   * An alias for FormData#entries()
   */
  [Symbol.iterator]: () => SpecIterableIterator<[string, FormDataEntryValue]>;
  readonly [Symbol.toStringTag]: string;
}
declare function buildConnector(options?: buildConnector.BuildOptions): buildConnector.connector;
declare namespace buildConnector {
  export type BuildOptions = (ConnectionOptions | TcpNetConnectOpts | IpcNetConnectOpts) & {
    allowH2?: boolean;
    maxCachedSessions?: number | null;
    socketPath?: string | null;
    timeout?: number | null;
    port?: number;
    keepAlive?: boolean | null;
    keepAliveInitialDelay?: number | null;
    typeOfService?: number | null;
  };
  export interface Options {
    hostname: string;
    host?: string;
    protocol: string;
    port: string;
    servername?: string;
    localAddress?: string | null;
    socketPath?: string | null;
    httpSocket?: Socket;
  }
  export type Callback = (...args: CallbackArgs) => void;
  type CallbackArgs = [null, Socket | TLSSocket] | [Error, null];
  export interface connector {
    (options: buildConnector.Options, callback: buildConnector.Callback): void;
  }
}
declare class ClientStats {
  constructor(pool: Client);
  /** If socket has open connection. */
  connected: boolean;
  /** Number of open socket connections in this client that do not have an active request. */
  pending: number;
  /** Number of currently active requests of this client. */
  running: number;
  /** Number of active, pending, or queued requests of this client. */
  size: number;
}
type ClientConnectOptions = Omit<Dispatcher.ConnectOptions, 'origin'>;
/**
 * A basic HTTP/1.1 client, mapped on top a single TCP/TLS connection. Pipelining is disabled by default.
 */
declare class Client extends Dispatcher {
  constructor(url: string | URL$1, options?: Client.Options);
  /** Property to get and set the pipelining factor. */
  pipelining: number;
  /** `true` after `client.close()` has been called. */
  closed: boolean;
  /** `true` after `client.destroyed()` has been called or `client.close()` has been called and the client shutdown has completed. */
  destroyed: boolean;
  /** Aggregate stats for a Client. */
  readonly stats: ClientStats; // Override dispatcher APIs.
  override connect(options: ClientConnectOptions): Promise<Dispatcher.ConnectData>;
  override connect(options: ClientConnectOptions, callback: (err: Error | null, data: Dispatcher.ConnectData) => void): void;
}
declare namespace Client {
  export interface OptionsInterceptors {
    Client: readonly Dispatcher.DispatchInterceptor[];
  }
  export interface Options {
    /** TODO */
    interceptors?: OptionsInterceptors;
    /** The maximum length of request headers in bytes. Default: Node.js' `--max-http-header-size` or `16384` (16KiB). */
    maxHeaderSize?: number;
    /** The amount of time, in milliseconds, the parser will wait to receive the complete HTTP headers (Node 14 and above only). Default: `300e3` milliseconds (300s). */
    headersTimeout?: number;
    /** @deprecated unsupported socketTimeout, use headersTimeout & bodyTimeout instead */
    socketTimeout?: never;
    /** @deprecated unsupported requestTimeout, use headersTimeout & bodyTimeout instead */
    requestTimeout?: never;
    /** TODO */
    connectTimeout?: number;
    /** The timeout after which a request will time out, in milliseconds. Monitors time between receiving body data. Use `0` to disable it entirely. Default: `300e3` milliseconds (300s). */
    bodyTimeout?: number;
    /** @deprecated unsupported idleTimeout, use keepAliveTimeout instead */
    idleTimeout?: never;
    /** @deprecated unsupported keepAlive, use pipelining=0 instead */
    keepAlive?: never;
    /** the timeout, in milliseconds, after which a socket without active requests will time out. Monitors time between activity on a connected socket. This value may be overridden by *keep-alive* hints from the server. Default: `4e3` milliseconds (4s). */
    keepAliveTimeout?: number;
    /** @deprecated unsupported maxKeepAliveTimeout, use keepAliveMaxTimeout instead */
    maxKeepAliveTimeout?: never;
    /** the maximum allowed `idleTimeout`, in milliseconds, when overridden by *keep-alive* hints from the server. Default: `600e3` milliseconds (10min). */
    keepAliveMaxTimeout?: number;
    /** A number of milliseconds subtracted from server *keep-alive* hints when overriding `idleTimeout` to account for timing inaccuracies caused by e.g. transport latency. Default: `1e3` milliseconds (1s). */
    keepAliveTimeoutThreshold?: number;
    /** TODO */
    socketPath?: string;
    /** The amount of concurrent requests to be sent over the single TCP/TLS connection according to [RFC7230](https://tools.ietf.org/html/rfc7230#section-6.3.2). Default: `1`. */
    pipelining?: number;
    /** @deprecated use the connect option instead */
    tls?: never;
    /** If `true`, an error is thrown when the request content-length header doesn't match the length of the request body. Default: `true`. */
    strictContentLength?: boolean;
    /** TODO */
    maxCachedSessions?: number;
    /** TODO */
    connect?: Partial<buildConnector.BuildOptions> | buildConnector.connector;
    /** TODO */
    maxRequestsPerClient?: number;
    /** TODO */
    localAddress?: string;
    /** Max response body size in bytes, -1 is disabled */
    maxResponseSize?: number;
    /** Enables a family autodetection algorithm that loosely implements section 5 of RFC 8305. */
    autoSelectFamily?: boolean;
    /** The amount of time in milliseconds to wait for a connection attempt to finish before trying the next address when using the `autoSelectFamily` option. */
    autoSelectFamilyAttemptTimeout?: number;
    /**
     * @description Enables support for H2 if the server has assigned bigger priority to it through ALPN negotiation.
     * @default false
     */
    allowH2?: boolean;
    /**
     * @description Dictates the maximum number of concurrent streams for a single H2 session. It can be overridden by a SETTINGS remote frame.
     * @default 100
     */
    maxConcurrentStreams?: number;
    /**
     * @description Sets the HTTP/2 stream-level flow-control window size (SETTINGS_INITIAL_WINDOW_SIZE).
     * @default 262144
     */
    initialWindowSize?: number;
    /**
     * @description Sets the HTTP/2 connection-level flow-control window size (ClientHttp2Session.setLocalWindowSize).
     * @default 524288
     */
    connectionWindowSize?: number;
    /**
     * @description Time interval between PING frames dispatch
     * @default 60000
     */
    pingInterval?: number;
  }
  export interface SocketInfo {
    localAddress?: string;
    localPort?: number;
    remoteAddress?: string;
    remotePort?: number;
    remoteFamily?: string;
    timeout?: number;
    bytesWritten?: number;
    bytesRead?: number;
  }
}
declare namespace Errors {
  export class UndiciError extends Error {
    name: string;
    code: string;
  }
  /** Connect timeout error. */
  export class ConnectTimeoutError extends UndiciError {
    name: 'ConnectTimeoutError';
    code: 'UND_ERR_CONNECT_TIMEOUT';
  }
  /** A header exceeds the `headersTimeout` option. */
  export class HeadersTimeoutError extends UndiciError {
    name: 'HeadersTimeoutError';
    code: 'UND_ERR_HEADERS_TIMEOUT';
  }
  /** Headers overflow error. */
  export class HeadersOverflowError extends UndiciError {
    name: 'HeadersOverflowError';
    code: 'UND_ERR_HEADERS_OVERFLOW';
  }
  /** A body exceeds the `bodyTimeout` option. */
  export class BodyTimeoutError extends UndiciError {
    name: 'BodyTimeoutError';
    code: 'UND_ERR_BODY_TIMEOUT';
  }
  export class ResponseError extends UndiciError {
    constructor(message: string, code: number, options: {
      headers?: IncomingHttpHeaders | string[] | null;
      body?: null | Record<string, any> | string;
    });
    name: 'ResponseError';
    code: 'UND_ERR_RESPONSE';
    statusCode: number;
    body: null | Record<string, any> | string;
    headers: IncomingHttpHeaders | string[] | null;
  }
  /** Passed an invalid argument. */
  export class InvalidArgumentError extends UndiciError {
    name: 'InvalidArgumentError';
    code: 'UND_ERR_INVALID_ARG';
  }
  /** Returned an invalid value. */
  export class InvalidReturnValueError extends UndiciError {
    name: 'InvalidReturnValueError';
    code: 'UND_ERR_INVALID_RETURN_VALUE';
  }
  /** The request has been aborted by the user. */
  export class RequestAbortedError extends UndiciError {
    name: 'AbortError';
    code: 'UND_ERR_ABORTED';
  }
  /** Expected error with reason. */
  export class InformationalError extends UndiciError {
    name: 'InformationalError';
    code: 'UND_ERR_INFO';
  }
  /** Request body length does not match content-length header. */
  export class RequestContentLengthMismatchError extends UndiciError {
    name: 'RequestContentLengthMismatchError';
    code: 'UND_ERR_REQ_CONTENT_LENGTH_MISMATCH';
  }
  /** Response body length does not match content-length header. */
  export class ResponseContentLengthMismatchError extends UndiciError {
    name: 'ResponseContentLengthMismatchError';
    code: 'UND_ERR_RES_CONTENT_LENGTH_MISMATCH';
  }
  /** Trying to use a destroyed client. */
  export class ClientDestroyedError extends UndiciError {
    name: 'ClientDestroyedError';
    code: 'UND_ERR_DESTROYED';
  }
  /** Trying to use a closed client. */
  export class ClientClosedError extends UndiciError {
    name: 'ClientClosedError';
    code: 'UND_ERR_CLOSED';
  }
  /** There is an error with the socket. */
  export class SocketError extends UndiciError {
    name: 'SocketError';
    code: 'UND_ERR_SOCKET';
    socket: Client.SocketInfo | null;
  }
  /** Encountered unsupported functionality. */
  export class NotSupportedError extends UndiciError {
    name: 'NotSupportedError';
    code: 'UND_ERR_NOT_SUPPORTED';
  }
  /** No upstream has been added to the BalancedPool. */
  export class BalancedPoolMissingUpstreamError extends UndiciError {
    name: 'MissingUpstreamError';
    code: 'UND_ERR_BPL_MISSING_UPSTREAM';
  }
  export class HTTPParserError extends UndiciError {
    name: 'HTTPParserError';
    code: string;
  }
  /** The response exceed the length allowed. */
  export class ResponseExceededMaxSizeError extends UndiciError {
    name: 'ResponseExceededMaxSizeError';
    code: 'UND_ERR_RES_EXCEEDED_MAX_SIZE';
  }
  export class RequestRetryError extends UndiciError {
    constructor(message: string, statusCode: number, headers?: IncomingHttpHeaders | string[] | null, body?: null | Record<string, any> | string);
    name: 'RequestRetryError';
    code: 'UND_ERR_REQ_RETRY';
    statusCode: number;
    data: {
      count: number;
    };
    headers: Record<string, string | string[]>;
  }
  export class SecureProxyConnectionError extends UndiciError {
    constructor(cause?: Error, message?: string, options?: Record<any, any>);
    name: 'SecureProxyConnectionError';
    code: 'UND_ERR_PRX_TLS';
  }
  export class MaxOriginsReachedError extends UndiciError {
    name: 'MaxOriginsReachedError';
    code: 'UND_ERR_MAX_ORIGINS_REACHED';
  }
  /** SOCKS5 proxy related error. */
  export class Socks5ProxyError extends UndiciError {
    constructor(message?: string, code?: string);
    name: 'Socks5ProxyError';
    code: string;
  }
  /** WebSocket decompressed message exceeded maximum size. */
  export class MessageSizeExceededError extends UndiciError {
    name: 'MessageSizeExceededError';
    code: 'UND_ERR_WS_MESSAGE_SIZE_EXCEEDED';
  }
}
type AbortSignal$1 = unknown;
type UndiciHeaders = Record<string, string | string[]> | IncomingHttpHeaders | string[] | Iterable<[string, string | string[] | undefined]> | null;
/** Dispatcher is the core API used to dispatch requests. */
declare class Dispatcher extends EventEmitter {
  /** Dispatches a request. This API is expected to evolve through semver-major versions and is less stable than the preceding higher level APIs. It is primarily intended for library developers who implement higher level APIs on top of this. */
  dispatch(options: Dispatcher.DispatchOptions, handler: Dispatcher.DispatchHandler): boolean;
  /** Starts two-way communications with the requested resource. */
  connect<TOpaque = null>(options: Dispatcher.ConnectOptions<TOpaque>, callback: (err: Error | null, data: Dispatcher.ConnectData<TOpaque>) => void): void;
  connect<TOpaque = null>(options: Dispatcher.ConnectOptions<TOpaque>): Promise<Dispatcher.ConnectData<TOpaque>>;
  /** Compose a chain of dispatchers */
  compose(dispatchers: Dispatcher.DispatcherComposeInterceptor[]): Dispatcher.ComposedDispatcher;
  compose(...dispatchers: Dispatcher.DispatcherComposeInterceptor[]): Dispatcher.ComposedDispatcher;
  /** Performs an HTTP request. */
  request<TOpaque = null>(options: Dispatcher.RequestOptions<TOpaque>, callback: (err: Error | null, data: Dispatcher.ResponseData<TOpaque>) => void): void;
  request<TOpaque = null>(options: Dispatcher.RequestOptions<TOpaque>): Promise<Dispatcher.ResponseData<TOpaque>>;
  /** For easy use with `stream.pipeline`. */
  pipeline<TOpaque = null>(options: Dispatcher.PipelineOptions<TOpaque>, handler: Dispatcher.PipelineHandler<TOpaque>): Duplex;
  /** A faster version of `Dispatcher.request`. */
  stream<TOpaque = null>(options: Dispatcher.RequestOptions<TOpaque>, factory: Dispatcher.StreamFactory<TOpaque>, callback: (err: Error | null, data: Dispatcher.StreamData<TOpaque>) => void): void;
  stream<TOpaque = null>(options: Dispatcher.RequestOptions<TOpaque>, factory: Dispatcher.StreamFactory<TOpaque>): Promise<Dispatcher.StreamData<TOpaque>>;
  /** Upgrade to a different protocol. */
  upgrade(options: Dispatcher.UpgradeOptions, callback: (err: Error | null, data: Dispatcher.UpgradeData) => void): void;
  upgrade(options: Dispatcher.UpgradeOptions): Promise<Dispatcher.UpgradeData>;
  /** Closes the client and gracefully waits for enqueued requests to complete before invoking the callback (or returning a promise if no callback is provided). */
  close(callback: () => void): void;
  close(): Promise<void>;
  /** Destroy the client abruptly with the given err. All the pending and running requests will be asynchronously aborted and error. Waits until socket is closed before invoking the callback (or returning a promise if no callback is provided). Since this operation is asynchronously dispatched there might still be some progress on dispatched requests. */
  destroy(err: Error | null, callback: () => void): void;
  destroy(callback: () => void): void;
  destroy(err: Error | null): Promise<void>;
  destroy(): Promise<void>;
  on(eventName: 'connect', callback: (origin: URL$1, targets: readonly Dispatcher[]) => void): this;
  on(eventName: 'disconnect', callback: (origin: URL$1, targets: readonly Dispatcher[], error: Errors.UndiciError) => void): this;
  on(eventName: 'connectionError', callback: (origin: URL$1, targets: readonly Dispatcher[], error: Errors.UndiciError) => void): this;
  on(eventName: 'drain', callback: (origin: URL$1) => void): this;
  once(eventName: 'connect', callback: (origin: URL$1, targets: readonly Dispatcher[]) => void): this;
  once(eventName: 'disconnect', callback: (origin: URL$1, targets: readonly Dispatcher[], error: Errors.UndiciError) => void): this;
  once(eventName: 'connectionError', callback: (origin: URL$1, targets: readonly Dispatcher[], error: Errors.UndiciError) => void): this;
  once(eventName: 'drain', callback: (origin: URL$1) => void): this;
  off(eventName: 'connect', callback: (origin: URL$1, targets: readonly Dispatcher[]) => void): this;
  off(eventName: 'disconnect', callback: (origin: URL$1, targets: readonly Dispatcher[], error: Errors.UndiciError) => void): this;
  off(eventName: 'connectionError', callback: (origin: URL$1, targets: readonly Dispatcher[], error: Errors.UndiciError) => void): this;
  off(eventName: 'drain', callback: (origin: URL$1) => void): this;
  addListener(eventName: 'connect', callback: (origin: URL$1, targets: readonly Dispatcher[]) => void): this;
  addListener(eventName: 'disconnect', callback: (origin: URL$1, targets: readonly Dispatcher[], error: Errors.UndiciError) => void): this;
  addListener(eventName: 'connectionError', callback: (origin: URL$1, targets: readonly Dispatcher[], error: Errors.UndiciError) => void): this;
  addListener(eventName: 'drain', callback: (origin: URL$1) => void): this;
  removeListener(eventName: 'connect', callback: (origin: URL$1, targets: readonly Dispatcher[]) => void): this;
  removeListener(eventName: 'disconnect', callback: (origin: URL$1, targets: readonly Dispatcher[], error: Errors.UndiciError) => void): this;
  removeListener(eventName: 'connectionError', callback: (origin: URL$1, targets: readonly Dispatcher[], error: Errors.UndiciError) => void): this;
  removeListener(eventName: 'drain', callback: (origin: URL$1) => void): this;
  prependListener(eventName: 'connect', callback: (origin: URL$1, targets: readonly Dispatcher[]) => void): this;
  prependListener(eventName: 'disconnect', callback: (origin: URL$1, targets: readonly Dispatcher[], error: Errors.UndiciError) => void): this;
  prependListener(eventName: 'connectionError', callback: (origin: URL$1, targets: readonly Dispatcher[], error: Errors.UndiciError) => void): this;
  prependListener(eventName: 'drain', callback: (origin: URL$1) => void): this;
  prependOnceListener(eventName: 'connect', callback: (origin: URL$1, targets: readonly Dispatcher[]) => void): this;
  prependOnceListener(eventName: 'disconnect', callback: (origin: URL$1, targets: readonly Dispatcher[], error: Errors.UndiciError) => void): this;
  prependOnceListener(eventName: 'connectionError', callback: (origin: URL$1, targets: readonly Dispatcher[], error: Errors.UndiciError) => void): this;
  prependOnceListener(eventName: 'drain', callback: (origin: URL$1) => void): this;
  listeners(eventName: 'connect'): ((origin: URL$1, targets: readonly Dispatcher[]) => void)[];
  listeners(eventName: 'disconnect'): ((origin: URL$1, targets: readonly Dispatcher[], error: Errors.UndiciError) => void)[];
  listeners(eventName: 'connectionError'): ((origin: URL$1, targets: readonly Dispatcher[], error: Errors.UndiciError) => void)[];
  listeners(eventName: 'drain'): ((origin: URL$1) => void)[];
  rawListeners(eventName: 'connect'): ((origin: URL$1, targets: readonly Dispatcher[]) => void)[];
  rawListeners(eventName: 'disconnect'): ((origin: URL$1, targets: readonly Dispatcher[], error: Errors.UndiciError) => void)[];
  rawListeners(eventName: 'connectionError'): ((origin: URL$1, targets: readonly Dispatcher[], error: Errors.UndiciError) => void)[];
  rawListeners(eventName: 'drain'): ((origin: URL$1) => void)[];
  emit(eventName: 'connect', origin: URL$1, targets: readonly Dispatcher[]): boolean;
  emit(eventName: 'disconnect', origin: URL$1, targets: readonly Dispatcher[], error: Errors.UndiciError): boolean;
  emit(eventName: 'connectionError', origin: URL$1, targets: readonly Dispatcher[], error: Errors.UndiciError): boolean;
  emit(eventName: 'drain', origin: URL$1): boolean;
}
declare namespace Dispatcher {
  export interface ComposedDispatcher extends Dispatcher {}
  export type Dispatch = Dispatcher['dispatch'];
  export type DispatcherComposeInterceptor = (dispatch: Dispatch) => Dispatch;
  export interface DispatchOptions {
    origin?: string | URL$1;
    path: string;
    method: HttpMethod;
    /** Default: `null` */
    body?: string | Buffer | Uint8Array | Readable | null | FormData;
    /** Default: `null` */
    headers?: UndiciHeaders;
    /** Query string params to be embedded in the request URL. Default: `null` */
    query?: Record<string, any>;
    /** Whether the requests can be safely retried or not. If `false` the request won't be sent until all preceding requests in the pipeline have completed. Default: `true` if `method` is `HEAD` or `GET`. */
    idempotent?: boolean;
    /** Whether the response is expected to take a long time and would end up blocking the pipeline. When this is set to `true` further pipelining will be avoided on the same connection until headers have been received. Defaults to `method !== 'HEAD'`. */
    blocking?: boolean;
    /** The IP Type of Service (ToS) value for the request socket. Must be an integer between 0 and 255. Default: `0` */
    typeOfService?: number | null;
    /** Upgrade the request. Should be used to specify the kind of upgrade i.e. `'Websocket'`. Default: `method === 'CONNECT' || null`. */
    upgrade?: boolean | string | null;
    /** The amount of time, in milliseconds, the parser will wait to receive the complete HTTP headers. Defaults to 300 seconds. */
    headersTimeout?: number | null;
    /** The timeout after which a request will time out, in milliseconds. Monitors time between receiving body data. Use 0 to disable it entirely. Defaults to 300 seconds. */
    bodyTimeout?: number | null;
    /** Whether the request should stablish a keep-alive or not. Default `false` */
    reset?: boolean;
    /** Whether Undici should throw an error upon receiving a 4xx or 5xx response from the server. Defaults to false */
    throwOnError?: boolean;
    /** For H2, it appends the expect: 100-continue header, and halts the request body until a 100-continue is received from the remote server */
    expectContinue?: boolean;
  }
  export interface ConnectOptions<TOpaque = null> {
    origin: string | URL$1;
    path: string;
    /** Default: `null` */
    headers?: UndiciHeaders;
    /** Default: `null` */
    signal?: AbortSignal$1 | EventEmitter | null;
    /** This argument parameter is passed through to `ConnectData` */
    opaque?: TOpaque;
    /** Default: `null` */
    responseHeaders?: 'raw' | null;
  }
  export interface RequestOptions<TOpaque = null> extends DispatchOptions {
    /** Default: `null` */
    opaque?: TOpaque;
    /** Default: `null` */
    signal?: AbortSignal$1 | EventEmitter | null;
    /** Default: `null` */
    onInfo?: (info: {
      statusCode: number;
      headers: Record<string, string | string[]>;
    }) => void;
    /** Default: `null` */
    responseHeaders?: 'raw' | null;
    /** Default: `64 KiB` */
    highWaterMark?: number;
  }
  export interface PipelineOptions<TOpaque = null> extends RequestOptions<TOpaque> {
    /** `true` if the `handler` will return an object stream. Default: `false` */
    objectMode?: boolean;
  }
  export interface UpgradeOptions {
    path: string;
    /** Default: `'GET'` */
    method?: string;
    /** Default: `null` */
    headers?: UndiciHeaders;
    /** A string of comma separated protocols, in descending preference order. Default: `'Websocket'` */
    protocol?: string;
    /** Default: `null` */
    signal?: AbortSignal$1 | EventEmitter | null;
    /** Default: `null` */
    responseHeaders?: 'raw' | null;
  }
  export interface ConnectData<TOpaque = null> {
    statusCode: number;
    headers: IncomingHttpHeaders;
    socket: Duplex;
    opaque: TOpaque;
  }
  export interface ResponseData<TOpaque = null> {
    statusCode: number;
    statusText: string;
    headers: IncomingHttpHeaders;
    body: BodyReadable & BodyMixin;
    trailers: Record<string, string>;
    opaque: TOpaque;
    context: object;
  }
  export interface PipelineHandlerData<TOpaque = null> {
    statusCode: number;
    headers: IncomingHttpHeaders;
    opaque: TOpaque;
    body: BodyReadable;
    context: object;
  }
  export interface StreamData<TOpaque = null> {
    opaque: TOpaque;
    trailers: Record<string, string>;
  }
  export interface UpgradeData<TOpaque = null> {
    headers: IncomingHttpHeaders;
    socket: Duplex;
    opaque: TOpaque;
  }
  export interface StreamFactoryData<TOpaque = null> {
    statusCode: number;
    headers: IncomingHttpHeaders;
    opaque: TOpaque;
    context: object;
  }
  export type StreamFactory<TOpaque = null> = (data: StreamFactoryData<TOpaque>) => Writable;
  export interface DispatchController {
    get aborted(): boolean;
    get paused(): boolean;
    get reason(): Error | null;
    abort(reason: Error): void;
    pause(): void;
    resume(): void;
  }
  export interface DispatchHandler {
    onRequestStart?(controller: DispatchController, context: any): void;
    onRequestUpgrade?(controller: DispatchController, statusCode: number, headers: IncomingHttpHeaders, socket: Duplex): void;
    onResponseStart?(controller: DispatchController, statusCode: number, headers: IncomingHttpHeaders, statusMessage?: string): void;
    onResponseData?(controller: DispatchController, chunk: Buffer): void;
    onResponseEnd?(controller: DispatchController, trailers: IncomingHttpHeaders): void;
    onResponseError?(controller: DispatchController, error: Error): void;
    /** Invoked before request is dispatched on socket. May be invoked multiple times when a request is retried when the request at the head of the pipeline fails. */
    /** @deprecated */
    onConnect?(abort: (err?: Error) => void): void;
    /** Invoked when an error has occurred. */
    /** @deprecated */
    onError?(err: Error): void;
    /** Invoked when request is upgraded either due to a `Upgrade` header or `CONNECT` method. */
    /** @deprecated */
    onUpgrade?(statusCode: number, headers: Buffer[] | string[] | null, socket: Duplex): void;
    /** Invoked when response is received, before headers have been read. **/
    /** @deprecated */
    onResponseStarted?(): void;
    /** Invoked when statusCode and headers have been received. May be invoked multiple times due to 1xx informational headers. */
    /** @deprecated */
    onHeaders?(statusCode: number, headers: Buffer[], resume: () => void, statusText: string): boolean;
    /** Invoked when response payload data is received. */
    /** @deprecated */
    onData?(chunk: Buffer): boolean;
    /** Invoked when response payload and trailers have been received and the request has completed. */
    /** @deprecated */
    onComplete?(trailers: string[] | null): void;
    /** Invoked when a body chunk is sent to the server. May be invoked multiple times for chunked requests */
    /** @deprecated */
    onBodySent?(chunkSize: number, totalBytesSent: number): void;
  }
  export type PipelineHandler<TOpaque = null> = (data: PipelineHandlerData<TOpaque>) => Readable;
  export type HttpMethod = Autocomplete<'GET' | 'HEAD' | 'POST' | 'PUT' | 'DELETE' | 'CONNECT' | 'OPTIONS' | 'TRACE' | 'PATCH'>;
  /**
   * @link https://fetch.spec.whatwg.org/#body-mixin
   */
  interface BodyMixin {
    readonly body?: never;
    readonly bodyUsed: boolean;
    arrayBuffer(): Promise<ArrayBuffer>;
    blob(): Promise<Blob>;
    bytes(): Promise<Uint8Array>;
    formData(): Promise<never>;
    json(): Promise<unknown>;
    text(): Promise<string>;
  }
  export interface DispatchInterceptor {
    (dispatch: Dispatch): Dispatch;
  }
}
/** The scope associated with a mock dispatch. */
declare class MockScope<TData extends object = object> {
  constructor(mockDispatch: MockInterceptor.MockDispatch<TData>);
  /** Delay a reply by a set amount of time in ms. */
  delay(waitInMs: number): MockScope<TData>;
  /** Persist the defined mock data for the associated reply. It will return the defined mock data indefinitely. */
  persist(): MockScope<TData>;
  /** Define a reply for a set amount of matching requests. */
  times(repeatTimes: number): MockScope<TData>;
}
/** The interceptor for a Mock. */
declare class MockInterceptor {
  constructor(options: MockInterceptor.Options, mockDispatches: MockInterceptor.MockDispatch[]);
  /** Mock an undici request with the defined reply. */
  reply<TData extends object = object>(replyOptionsCallback: MockInterceptor.MockReplyOptionsCallback<TData>): MockScope<TData>;
  reply<TData extends object = object>(statusCode: number, data?: TData | Buffer | string | MockInterceptor.MockResponseDataHandler<TData>, responseOptions?: MockInterceptor.MockResponseOptions): MockScope<TData>;
  /** Mock an undici request by throwing the defined reply error. */
  replyWithError<TError extends Error = Error>(error: TError): MockScope;
  /** Set default reply headers on the interceptor for subsequent mocked replies. */
  defaultReplyHeaders(headers: IncomingHttpHeaders): MockInterceptor;
  /** Set default reply trailers on the interceptor for subsequent mocked replies. */
  defaultReplyTrailers(trailers: Record<string, string>): MockInterceptor;
  /** Set automatically calculated content-length header on subsequent mocked replies. */
  replyContentLength(): MockInterceptor;
}
declare namespace MockInterceptor {
  /** MockInterceptor options. */
  export interface Options {
    /** Path to intercept on. */
    path: string | RegExp | ((path: string) => boolean);
    /** Method to intercept on. Defaults to GET. */
    method?: string | RegExp | ((method: string) => boolean);
    /** Body to intercept on. */
    body?: string | RegExp | ((body: string) => boolean);
    /** Headers to intercept on. */
    headers?: Record<string, string | RegExp | ((body: string) => boolean)> | ((headers: Record<string, string>) => boolean);
    /** Query params to intercept on */
    query?: Record<string, any>;
  }
  export interface MockDispatch<TData extends object = object, TError extends Error = Error> extends Options {
    times: number | null;
    persist: boolean;
    consumed: boolean;
    data: MockDispatchData<TData, TError>;
  }
  export interface MockDispatchData<TData extends object = object, TError extends Error = Error> extends MockResponseOptions {
    error: TError | null;
    statusCode?: number;
    data?: TData | string;
  }
  export interface MockResponseOptions {
    headers?: IncomingHttpHeaders;
    trailers?: Record<string, string>;
  }
  export interface MockResponseCallbackOptions {
    path: string;
    method: string;
    headers?: Headers | Record<string, string>;
    origin?: string;
    body?: BodyInit | Dispatcher.DispatchOptions['body'] | null;
  }
  export type MockResponseDataHandler<TData extends object = object> = (opts: MockResponseCallbackOptions) => TData | Buffer | string;
  export type MockReplyOptionsCallback<TData extends object = object> = (opts: MockResponseCallbackOptions) => {
    statusCode: number;
    data?: TData | Buffer | string;
    responseOptions?: MockResponseOptions;
  };
}
export { RawConfig };