import { VIRTUAL_MODULES } from "@tanstack/start-server-core";
import { VITE_ENVIRONMENT_NAMES, TRANSFORM_ID_REGEX } from "../constants.js";
import { StartCompiler, LookupKindsPerEnv, detectKindsInCode, KindDetectionPatterns } from "./compiler.js";
import { cleanId } from "./utils.js";
function getTransformCodeFilterForEnv(env) {
  const validKinds = LookupKindsPerEnv[env];
  const patterns = [];
  for (const [kind, pattern] of Object.entries(KindDetectionPatterns)) {
    if (validKinds.has(kind)) {
      patterns.push(pattern);
    }
  }
  return patterns;
}
const getLookupConfigurationsForEnv = (env, framework) => {
  const commonConfigs = [
    {
      libName: `@tanstack/${framework}-start`,
      rootExport: "createServerFn",
      kind: "Root"
    },
    {
      libName: `@tanstack/${framework}-start`,
      rootExport: "createIsomorphicFn",
      kind: "IsomorphicFn"
    },
    {
      libName: `@tanstack/${framework}-start`,
      rootExport: "createServerOnlyFn",
      kind: "ServerOnlyFn"
    },
    {
      libName: `@tanstack/${framework}-start`,
      rootExport: "createClientOnlyFn",
      kind: "ClientOnlyFn"
    }
  ];
  if (env === "client") {
    return [
      {
        libName: `@tanstack/${framework}-start`,
        rootExport: "createMiddleware",
        kind: "Root"
      },
      {
        libName: `@tanstack/${framework}-start`,
        rootExport: "createStart",
        kind: "Root"
      },
      ...commonConfigs
    ];
  } else {
    return [
      ...commonConfigs,
      {
        libName: `@tanstack/${framework}-router`,
        rootExport: "ClientOnly",
        kind: "ClientOnlyJSX"
      }
    ];
  }
};
const SERVER_FN_LOOKUP = "server-fn-module-lookup";
function resolveViteId(id) {
  return `\0${id}`;
}
const validateServerFnIdVirtualModule = `virtual:tanstack-start-validate-server-fn-id`;
function parseIdQuery(id) {
  if (!id.includes("?")) return { filename: id, query: {} };
  const [filename, rawQuery] = id.split(`?`, 2);
  const query = Object.fromEntries(new URLSearchParams(rawQuery));
  return { filename, query };
}
function generateManifestModule(serverFnsById, includeClientReferencedCheck) {
  const manifestEntries = Object.entries(serverFnsById).map(([id, fn]) => {
    const baseEntry = `'${id}': {
                functionName: '${fn.functionName}',
        importer: () => import(${JSON.stringify(fn.extractedFilename)})${includeClientReferencedCheck ? `,
        isClientReferenced: ${fn.isClientReferenced ?? true}` : ""}
      }`;
    return baseEntry;
  }).join(",");
  const getServerFnByIdParams = includeClientReferencedCheck ? "id, opts" : "id";
  const clientReferencedCheck = includeClientReferencedCheck ? `
      // If called from client, only allow client-referenced functions
      if (opts?.fromClient && !serverFnInfo.isClientReferenced) {
        throw new Error('Server function not accessible from client: ' + id)
      }
` : "";
  return `
    const manifest = {${manifestEntries}}

    export async function getServerFnById(${getServerFnByIdParams}) {
              const serverFnInfo = manifest[id]
              if (!serverFnInfo) {
                throw new Error('Server function info not found for ' + id)
              }
${clientReferencedCheck}
              const fnModule = await serverFnInfo.importer()

              if (!fnModule) {
                console.info('serverFnInfo', serverFnInfo)
                throw new Error('Server function module not resolved for ' + id)
              }

              const action = fnModule[serverFnInfo.functionName]

              if (!action) {
                  console.info('serverFnInfo', serverFnInfo)
                  console.info('fnModule', fnModule)

                throw new Error(
                  \`Server function module export not resolved for serverFn ID: \${id}\`,
                )
              }
              return action
            }
          `;
}
function startCompilerPlugin(opts) {
  const compilers = {};
  const serverFnsById = {};
  const onServerFnsById = (d) => {
    Object.assign(serverFnsById, d);
  };
  let root = process.cwd();
  const resolvedResolverVirtualImportId = resolveViteId(
    VIRTUAL_MODULES.serverFnResolver
  );
  const ssrEnvName = VITE_ENVIRONMENT_NAMES.server;
  const ssrIsProvider = opts.providerEnvName === ssrEnvName;
  const appliedResolverEnvironments = new Set(
    ssrIsProvider ? [opts.providerEnvName] : [ssrEnvName, opts.providerEnvName]
  );
  function perEnvServerFnPlugin(environment) {
    const transformCodeFilter = getTransformCodeFilterForEnv(environment.type);
    return {
      name: `tanstack-start-core::server-fn:${environment.name}`,
      enforce: "pre",
      applyToEnvironment(env) {
        return env.name === environment.name;
      },
      configResolved(config) {
        root = config.root;
        config.command;
      },
      transform: {
        filter: {
          id: {
            exclude: new RegExp(`${SERVER_FN_LOOKUP}$`),
            include: TRANSFORM_ID_REGEX
          },
          code: {
            include: transformCodeFilter
          }
        },
        async handler(code, id) {
          let compiler = compilers[this.environment.name];
          if (!compiler) {
            const mode = this.environment.mode === "build" ? "build" : "dev";
            compiler = new StartCompiler({
              env: environment.type,
              envName: environment.name,
              root,
              lookupKinds: LookupKindsPerEnv[environment.type],
              lookupConfigurations: getLookupConfigurationsForEnv(
                environment.type,
                opts.framework
              ),
              mode,
              framework: opts.framework,
              providerEnvName: opts.providerEnvName,
              generateFunctionId: opts.generateFunctionId,
              onServerFnsById,
              getKnownServerFns: () => serverFnsById,
              loadModule: async (id2) => {
                if (this.environment.mode === "build") {
                  const loaded = await this.load({ id: id2 });
                  const code2 = loaded.code ?? "";
                  compiler.ingestModule({ code: code2, id: id2 });
                } else if (this.environment.mode === "dev") {
                  await this.environment.fetchModule(
                    id2 + "?" + SERVER_FN_LOOKUP
                  );
                } else {
                  throw new Error(
                    `could not load module ${id2}: unknown environment mode ${this.environment.mode}`
                  );
                }
              },
              resolveId: async (source, importer) => {
                const r = await this.resolve(source, importer);
                if (r) {
                  if (!r.external) {
                    return cleanId(r.id);
                  }
                }
                return null;
              }
            });
            compilers[this.environment.name] = compiler;
          }
          const detectedKinds = detectKindsInCode(code, environment.type);
          const result = await compiler.compile({
            id,
            code,
            detectedKinds
          });
          return result;
        }
      },
      hotUpdate(ctx) {
        const compiler = compilers[this.environment.name];
        ctx.modules.forEach((m) => {
          if (m.id) {
            const deleted = compiler?.invalidateModule(m.id);
            if (deleted) {
              m.importers.forEach((importer) => {
                if (importer.id) {
                  compiler?.invalidateModule(importer.id);
                }
              });
            }
          }
        });
      }
    };
  }
  return [
    ...opts.environments.map(perEnvServerFnPlugin),
    {
      name: "tanstack-start-core:capture-server-fn-module-lookup",
      // we only need this plugin in dev mode
      apply: "serve",
      applyToEnvironment(env) {
        return !!opts.environments.find((e) => e.name === env.name);
      },
      transform: {
        filter: {
          id: new RegExp(`${SERVER_FN_LOOKUP}$`)
        },
        handler(code, id) {
          const compiler = compilers[this.environment.name];
          compiler?.ingestModule({ code, id: cleanId(id) });
        }
      }
    },
    // Validate server function ID in dev mode
    {
      name: "tanstack-start-core:validate-server-fn-id",
      apply: "serve",
      load: {
        filter: {
          id: new RegExp(resolveViteId(validateServerFnIdVirtualModule))
        },
        handler(id) {
          const parsed = parseIdQuery(id);
          if (parsed.query.id && serverFnsById[parsed.query.id]) {
            return `export {}`;
          }
          this.error(`Invalid server function ID: ${parsed.query.id}`);
        }
      }
    },
    // Manifest plugin for server environments
    {
      name: "tanstack-start-core:server-fn-resolver",
      enforce: "pre",
      applyToEnvironment: (env) => {
        return appliedResolverEnvironments.has(env.name);
      },
      configResolved(config) {
        root = config.root;
        config.command;
      },
      resolveId: {
        filter: { id: new RegExp(VIRTUAL_MODULES.serverFnResolver) },
        handler() {
          return resolvedResolverVirtualImportId;
        }
      },
      load: {
        filter: { id: new RegExp(resolvedResolverVirtualImportId) },
        handler() {
          if (this.environment.name !== opts.providerEnvName) {
            return `export { getServerFnById } from '@tanstack/start-server-core/server-fn-ssr-caller'`;
          }
          if (this.environment.mode !== "build") {
            const mod = `
            export async function getServerFnById(id) {
              const validateIdImport = ${JSON.stringify(validateServerFnIdVirtualModule)} + '?id=' + id
              await import(/* @vite-ignore */ '/@id/__x00__' + validateIdImport)
              const decoded = Buffer.from(id, 'base64url').toString('utf8')
              const devServerFn = JSON.parse(decoded)
              const mod = await import(/* @vite-ignore */ devServerFn.file)
              return mod[devServerFn.export]
            }
            `;
            return mod;
          }
          const includeClientReferencedCheck = !ssrIsProvider;
          return generateManifestModule(
            serverFnsById,
            includeClientReferencedCheck
          );
        }
      }
    }
  ];
}
export {
  startCompilerPlugin
};
//# sourceMappingURL=plugin.js.map
