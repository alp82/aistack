import crypto from "node:crypto";
import * as t from "@babel/types";
import { parseAst, generateFromAst } from "@tanstack/router-utils";
import babel from "@babel/core";
import { findReferencedIdentifiers, deadCodeElimination } from "babel-dead-code-elimination";
import { handleCreateServerFn } from "./handleCreateServerFn.js";
import { handleCreateMiddleware } from "./handleCreateMiddleware.js";
import { handleCreateIsomorphicFn } from "./handleCreateIsomorphicFn.js";
import { handleEnvOnlyFn } from "./handleEnvOnly.js";
import { handleClientOnlyJSX } from "./handleClientOnlyJSX.js";
const LookupSetup = {
  ServerFn: {
    type: "methodChain",
    candidateCallIdentifier: /* @__PURE__ */ new Set(["handler"])
  },
  Middleware: {
    type: "methodChain",
    candidateCallIdentifier: /* @__PURE__ */ new Set(["server", "client", "createMiddlewares"])
  },
  IsomorphicFn: {
    type: "methodChain",
    candidateCallIdentifier: /* @__PURE__ */ new Set(["server", "client"])
  },
  ServerOnlyFn: { type: "directCall", factoryName: "createServerOnlyFn" },
  ClientOnlyFn: { type: "directCall", factoryName: "createClientOnlyFn" },
  ClientOnlyJSX: { type: "jsx", componentName: "ClientOnly" }
};
const KindDetectionPatterns = {
  ServerFn: /\bcreateServerFn\b|\.\s*handler\s*\(/,
  Middleware: /createMiddleware/,
  IsomorphicFn: /createIsomorphicFn/,
  ServerOnlyFn: /createServerOnlyFn/,
  ClientOnlyFn: /createClientOnlyFn/,
  ClientOnlyJSX: /<ClientOnly|import\s*\{[^}]*\bClientOnly\b/
};
const LookupKindsPerEnv = {
  client: /* @__PURE__ */ new Set([
    "Middleware",
    "ServerFn",
    "IsomorphicFn",
    "ServerOnlyFn",
    "ClientOnlyFn"
  ]),
  server: /* @__PURE__ */ new Set([
    "ServerFn",
    "IsomorphicFn",
    "ServerOnlyFn",
    "ClientOnlyFn",
    "ClientOnlyJSX"
    // Only transform on server to remove children
  ])
};
const KindHandlers = {
  ServerFn: handleCreateServerFn,
  Middleware: handleCreateMiddleware,
  IsomorphicFn: handleCreateIsomorphicFn,
  ServerOnlyFn: handleEnvOnlyFn,
  ClientOnlyFn: handleEnvOnlyFn
  // ClientOnlyJSX is handled separately via JSX traversal, not here
};
const AllLookupKinds = Object.keys(LookupSetup);
function detectKindsInCode(code, env) {
  const detected = /* @__PURE__ */ new Set();
  const validForEnv = LookupKindsPerEnv[env];
  for (const kind of AllLookupKinds) {
    if (validForEnv.has(kind) && KindDetectionPatterns[kind].test(code)) {
      detected.add(kind);
    }
  }
  return detected;
}
const IdentifierToKinds = /* @__PURE__ */ new Map();
for (const kind of AllLookupKinds) {
  const setup = LookupSetup[kind];
  if (setup.type === "methodChain") {
    for (const id of setup.candidateCallIdentifier) {
      let kinds = IdentifierToKinds.get(id);
      if (!kinds) {
        kinds = /* @__PURE__ */ new Set();
        IdentifierToKinds.set(id, kinds);
      }
      kinds.add(kind);
    }
  }
}
const DirectCallFactoryNames = /* @__PURE__ */ new Set();
for (const kind of AllLookupKinds) {
  const setup = LookupSetup[kind];
  if (setup.type === "directCall") {
    DirectCallFactoryNames.add(setup.factoryName);
  }
}
function needsDirectCallDetection(kinds) {
  for (const kind of kinds) {
    if (LookupSetup[kind].type === "directCall") {
      return true;
    }
  }
  return false;
}
function areAllKindsTopLevelOnly(kinds) {
  return kinds.size === 1 && kinds.has("ServerFn");
}
function needsJSXDetection(kinds) {
  for (const kind of kinds) {
    if (LookupSetup[kind].type === "jsx") {
      return true;
    }
  }
  return false;
}
function isNestedDirectCallCandidate(node) {
  let calleeName;
  if (t.isIdentifier(node.callee)) {
    calleeName = node.callee.name;
  } else if (t.isMemberExpression(node.callee) && t.isIdentifier(node.callee.property)) {
    calleeName = node.callee.property.name;
  }
  return calleeName !== void 0 && DirectCallFactoryNames.has(calleeName);
}
function isTopLevelDirectCallCandidate(path) {
  const node = path.node;
  const isSimpleCall = t.isIdentifier(node.callee) || t.isMemberExpression(node.callee) && t.isIdentifier(node.callee.object) && t.isIdentifier(node.callee.property);
  if (!isSimpleCall) {
    return false;
  }
  const parent = path.parent;
  if (!t.isVariableDeclarator(parent) || parent.init !== node) {
    return false;
  }
  const grandParent = path.parentPath.parent;
  if (!t.isVariableDeclaration(grandParent)) {
    return false;
  }
  return t.isProgram(path.parentPath.parentPath?.parent);
}
class StartCompiler {
  constructor(options) {
    this.options = options;
    this.validLookupKinds = options.lookupKinds;
  }
  moduleCache = /* @__PURE__ */ new Map();
  initialized = false;
  validLookupKinds;
  resolveIdCache = /* @__PURE__ */ new Map();
  exportResolutionCache = /* @__PURE__ */ new Map();
  // Fast lookup for direct imports from known libraries (e.g., '@tanstack/react-start')
  // Maps: libName → (exportName → Kind)
  // This allows O(1) resolution for the common case without async resolveId calls
  knownRootImports = /* @__PURE__ */ new Map();
  // For generating unique function IDs in production builds
  entryIdToFunctionId = /* @__PURE__ */ new Map();
  functionIds = /* @__PURE__ */ new Set();
  // Cached root path with trailing slash for dev mode function ID generation
  _rootWithTrailingSlash;
  /**
   * Generates a unique function ID for a server function.
   * In dev mode, uses a base64-encoded JSON with file path and export name.
   * In build mode, uses SHA256 hash or custom generator.
   */
  generateFunctionId(opts) {
    if (this.mode === "dev") {
      let file = opts.extractedFilename;
      if (opts.extractedFilename.startsWith(this.rootWithTrailingSlash)) {
        file = opts.extractedFilename.slice(this.rootWithTrailingSlash.length);
      }
      file = `/@id/${file}`;
      const serverFn = {
        file,
        export: opts.functionName
      };
      return Buffer.from(JSON.stringify(serverFn), "utf8").toString("base64url");
    }
    const entryId = `${opts.filename}--${opts.functionName}`;
    let functionId = this.entryIdToFunctionId.get(entryId);
    if (functionId === void 0) {
      if (this.options.generateFunctionId) {
        functionId = this.options.generateFunctionId({
          filename: opts.filename,
          functionName: opts.functionName
        });
      }
      if (!functionId) {
        functionId = crypto.createHash("sha256").update(entryId).digest("hex");
      }
      if (this.functionIds.has(functionId)) {
        let deduplicatedId;
        let iteration = 0;
        do {
          deduplicatedId = `${functionId}_${++iteration}`;
        } while (this.functionIds.has(deduplicatedId));
        functionId = deduplicatedId;
      }
      this.entryIdToFunctionId.set(entryId, functionId);
      this.functionIds.add(functionId);
    }
    return functionId;
  }
  get mode() {
    return this.options.mode ?? "dev";
  }
  get rootWithTrailingSlash() {
    if (this._rootWithTrailingSlash === void 0) {
      this._rootWithTrailingSlash = this.options.root.endsWith("/") ? this.options.root : `${this.options.root}/`;
    }
    return this._rootWithTrailingSlash;
  }
  async resolveIdCached(id, importer) {
    if (this.mode === "dev") {
      return this.options.resolveId(id, importer);
    }
    const cacheKey = importer ? `${importer}::${id}` : id;
    const cached = this.resolveIdCache.get(cacheKey);
    if (cached !== void 0) {
      return cached;
    }
    const resolved = await this.options.resolveId(id, importer);
    this.resolveIdCache.set(cacheKey, resolved);
    return resolved;
  }
  getExportResolutionCache(moduleId) {
    let cache = this.exportResolutionCache.get(moduleId);
    if (!cache) {
      cache = /* @__PURE__ */ new Map();
      this.exportResolutionCache.set(moduleId, cache);
    }
    return cache;
  }
  async init() {
    this.knownRootImports.set(
      "@tanstack/start-fn-stubs",
      /* @__PURE__ */ new Map([
        ["createIsomorphicFn", "IsomorphicFn"],
        ["createServerOnlyFn", "ServerOnlyFn"],
        ["createClientOnlyFn", "ClientOnlyFn"]
      ])
    );
    await Promise.all(
      this.options.lookupConfigurations.map(async (config) => {
        let libExports = this.knownRootImports.get(config.libName);
        if (!libExports) {
          libExports = /* @__PURE__ */ new Map();
          this.knownRootImports.set(config.libName, libExports);
        }
        libExports.set(config.rootExport, config.kind);
        if (config.kind !== "Root") {
          const setup = LookupSetup[config.kind];
          if (setup.type === "jsx") {
            return;
          }
        }
        const libId = await this.resolveIdCached(config.libName);
        if (!libId) {
          throw new Error(`could not resolve "${config.libName}"`);
        }
        let rootModule = this.moduleCache.get(libId);
        if (!rootModule) {
          rootModule = {
            bindings: /* @__PURE__ */ new Map(),
            exports: /* @__PURE__ */ new Map(),
            id: libId,
            reExportAllSources: []
          };
          this.moduleCache.set(libId, rootModule);
        }
        rootModule.exports.set(config.rootExport, config.rootExport);
        rootModule.exports.set("*", config.rootExport);
        rootModule.bindings.set(config.rootExport, {
          type: "var",
          init: null,
          // Not needed since resolvedKind is set
          resolvedKind: config.kind
        });
        this.moduleCache.set(libId, rootModule);
      })
    );
    this.initialized = true;
  }
  /**
   * Extracts bindings and exports from an already-parsed AST.
   * This is the core logic shared by ingestModule and ingestModuleFromAst.
   */
  extractModuleInfo(ast, id) {
    const bindings = /* @__PURE__ */ new Map();
    const exports = /* @__PURE__ */ new Map();
    const reExportAllSources = [];
    for (const node of ast.program.body) {
      if (t.isImportDeclaration(node)) {
        const source = node.source.value;
        for (const s of node.specifiers) {
          if (t.isImportSpecifier(s)) {
            const importedName = t.isIdentifier(s.imported) ? s.imported.name : s.imported.value;
            bindings.set(s.local.name, { type: "import", source, importedName });
          } else if (t.isImportDefaultSpecifier(s)) {
            bindings.set(s.local.name, {
              type: "import",
              source,
              importedName: "default"
            });
          } else if (t.isImportNamespaceSpecifier(s)) {
            bindings.set(s.local.name, {
              type: "import",
              source,
              importedName: "*"
            });
          }
        }
      } else if (t.isVariableDeclaration(node)) {
        for (const decl of node.declarations) {
          if (t.isIdentifier(decl.id)) {
            bindings.set(decl.id.name, {
              type: "var",
              init: decl.init ?? null
            });
          }
        }
      } else if (t.isExportNamedDeclaration(node)) {
        if (node.declaration) {
          if (t.isVariableDeclaration(node.declaration)) {
            for (const d of node.declaration.declarations) {
              if (t.isIdentifier(d.id)) {
                exports.set(d.id.name, d.id.name);
                bindings.set(d.id.name, { type: "var", init: d.init ?? null });
              }
            }
          }
        }
        for (const sp of node.specifiers) {
          if (t.isExportNamespaceSpecifier(sp)) {
            exports.set(sp.exported.name, sp.exported.name);
          } else if (t.isExportSpecifier(sp)) {
            const local = sp.local.name;
            const exported = t.isIdentifier(sp.exported) ? sp.exported.name : sp.exported.value;
            exports.set(exported, local);
            if (node.source) {
              bindings.set(local, {
                type: "import",
                source: node.source.value,
                importedName: local
              });
            }
          }
        }
      } else if (t.isExportDefaultDeclaration(node)) {
        const d = node.declaration;
        if (t.isIdentifier(d)) {
          exports.set("default", d.name);
        } else {
          const synth = "__default_export__";
          bindings.set(synth, { type: "var", init: d });
          exports.set("default", synth);
        }
      } else if (t.isExportAllDeclaration(node)) {
        reExportAllSources.push(node.source.value);
      }
    }
    const info = {
      id,
      bindings,
      exports,
      reExportAllSources
    };
    this.moduleCache.set(id, info);
    return info;
  }
  ingestModule({ code, id }) {
    const ast = parseAst({ code });
    const info = this.extractModuleInfo(ast, id);
    return { info, ast };
  }
  invalidateModule(id) {
    return this.moduleCache.delete(id);
  }
  async compile({
    code,
    id,
    detectedKinds
  }) {
    if (!this.initialized) {
      await this.init();
    }
    const fileKinds = detectedKinds ? new Set([...detectedKinds].filter((k) => this.validLookupKinds.has(k))) : this.validLookupKinds;
    if (fileKinds.size === 0) {
      return null;
    }
    const checkDirectCalls = needsDirectCallDetection(fileKinds);
    const canUseFastPath = areAllKindsTopLevelOnly(fileKinds);
    const { ast } = this.ingestModule({ code, id });
    const candidatePaths = [];
    const chainCallPaths = /* @__PURE__ */ new Map();
    const jsxCandidatePaths = [];
    const checkJSX = needsJSXDetection(fileKinds);
    const moduleInfo = this.moduleCache.get(id);
    if (canUseFastPath) {
      const candidateIndices = [];
      for (let i = 0; i < ast.program.body.length; i++) {
        const node = ast.program.body[i];
        let declarations;
        if (t.isVariableDeclaration(node)) {
          declarations = node.declarations;
        } else if (t.isExportNamedDeclaration(node) && node.declaration) {
          if (t.isVariableDeclaration(node.declaration)) {
            declarations = node.declaration.declarations;
          }
        }
        if (declarations) {
          for (const decl of declarations) {
            if (decl.init && t.isCallExpression(decl.init)) {
              if (isMethodChainCandidate(decl.init, fileKinds)) {
                candidateIndices.push(i);
                break;
              }
            }
          }
        }
      }
      if (candidateIndices.length === 0) {
        return null;
      }
      babel.traverse(ast, {
        Program(programPath) {
          const bodyPaths = programPath.get("body");
          for (const idx of candidateIndices) {
            const stmtPath = bodyPaths[idx];
            if (!stmtPath) continue;
            stmtPath.traverse({
              CallExpression(path) {
                const node = path.node;
                const parent = path.parent;
                if (t.isMemberExpression(parent) && t.isCallExpression(path.parentPath.parent)) {
                  chainCallPaths.set(node, path);
                  return;
                }
                if (isMethodChainCandidate(node, fileKinds)) {
                  candidatePaths.push(path);
                }
              }
            });
          }
          programPath.stop();
        }
      });
    } else {
      babel.traverse(ast, {
        CallExpression: (path) => {
          const node = path.node;
          const parent = path.parent;
          if (t.isMemberExpression(parent) && t.isCallExpression(path.parentPath.parent)) {
            chainCallPaths.set(node, path);
            return;
          }
          if (isMethodChainCandidate(node, fileKinds)) {
            candidatePaths.push(path);
            return;
          }
          if (checkDirectCalls) {
            if (isTopLevelDirectCallCandidate(path)) {
              candidatePaths.push(path);
            } else if (isNestedDirectCallCandidate(node)) {
              candidatePaths.push(path);
            }
          }
        },
        // Pattern 3: JSX element pattern (e.g., <ClientOnly>)
        // Collect JSX elements where the component is imported from a known package
        // and resolves to a JSX kind (e.g., ClientOnly from @tanstack/react-router)
        JSXElement: (path) => {
          if (!checkJSX) return;
          const openingElement = path.node.openingElement;
          const nameNode = openingElement.name;
          if (!t.isJSXIdentifier(nameNode)) return;
          const componentName = nameNode.name;
          const binding = moduleInfo.bindings.get(componentName);
          if (!binding || binding.type !== "import") return;
          const knownExports = this.knownRootImports.get(binding.source);
          if (!knownExports) return;
          const kind = knownExports.get(binding.importedName);
          if (kind !== "ClientOnlyJSX") return;
          jsxCandidatePaths.push(path);
        }
      });
    }
    if (candidatePaths.length === 0 && jsxCandidatePaths.length === 0) {
      return null;
    }
    const resolvedCandidates = await Promise.all(
      candidatePaths.map(async (path) => ({
        path,
        kind: await this.resolveExprKind(path.node, id)
      }))
    );
    const validCandidates = resolvedCandidates.filter(
      ({ kind }) => this.validLookupKinds.has(kind)
    );
    if (validCandidates.length === 0 && jsxCandidatePaths.length === 0) {
      return null;
    }
    const pathsToRewrite = [];
    for (const { path, kind } of validCandidates) {
      const node = path.node;
      const methodChain = {
        middleware: null,
        inputValidator: null,
        handler: null,
        server: null,
        client: null
      };
      let currentNode = node;
      let currentPath = path;
      while (true) {
        const callee = currentNode.callee;
        if (!t.isMemberExpression(callee)) {
          break;
        }
        if (t.isIdentifier(callee.property)) {
          const name = callee.property.name;
          if (name in methodChain) {
            const args = currentPath.get("arguments");
            const firstArgPath = Array.isArray(args) && args.length > 0 ? args[0] ?? null : null;
            methodChain[name] = {
              callPath: currentPath,
              firstArgPath
            };
          }
        }
        if (!t.isCallExpression(callee.object)) {
          break;
        }
        currentNode = callee.object;
        const nextPath = chainCallPaths.get(currentNode);
        if (!nextPath) {
          break;
        }
        currentPath = nextPath;
      }
      pathsToRewrite.push({ path, kind, methodChain });
    }
    const refIdents = findReferencedIdentifiers(ast);
    const context = {
      ast,
      id,
      code,
      env: this.options.env,
      envName: this.options.envName,
      root: this.options.root,
      framework: this.options.framework,
      providerEnvName: this.options.providerEnvName,
      generateFunctionId: (opts) => this.generateFunctionId(opts),
      getKnownServerFns: () => this.options.getKnownServerFns?.() ?? {},
      onServerFnsById: this.options.onServerFnsById
    };
    const candidatesByKind = /* @__PURE__ */ new Map();
    for (const { path: candidatePath, kind, methodChain } of pathsToRewrite) {
      const candidate = { path: candidatePath, methodChain };
      const existing = candidatesByKind.get(kind);
      if (existing) {
        existing.push(candidate);
      } else {
        candidatesByKind.set(kind, [candidate]);
      }
    }
    for (const [kind, candidates] of candidatesByKind) {
      const handler = KindHandlers[kind];
      handler(candidates, context, kind);
    }
    for (const jsxPath of jsxCandidatePaths) {
      handleClientOnlyJSX(jsxPath);
    }
    deadCodeElimination(ast, refIdents);
    return generateFromAst(ast, {
      sourceMaps: true,
      sourceFileName: id,
      filename: id
    });
  }
  async resolveIdentifierKind(ident, id, visited = /* @__PURE__ */ new Set()) {
    const info = await this.getModuleInfo(id);
    const binding = info.bindings.get(ident);
    if (!binding) {
      return "None";
    }
    if (binding.resolvedKind) {
      return binding.resolvedKind;
    }
    const vKey = `${id}:${ident}`;
    if (visited.has(vKey)) {
      return "None";
    }
    visited.add(vKey);
    const resolvedKind = await this.resolveBindingKind(binding, id, visited);
    binding.resolvedKind = resolvedKind;
    return resolvedKind;
  }
  /**
   * Recursively find an export in a module, following `export * from` chains.
   * Returns the module info and binding if found, or undefined if not found.
   */
  async findExportInModule(moduleInfo, exportName, visitedModules = /* @__PURE__ */ new Set()) {
    const isBuildMode = this.mode === "build";
    if (isBuildMode && visitedModules.size === 0) {
      const moduleCache = this.exportResolutionCache.get(moduleInfo.id);
      if (moduleCache) {
        const cached = moduleCache.get(exportName);
        if (cached !== void 0) {
          return cached ?? void 0;
        }
      }
    }
    if (visitedModules.has(moduleInfo.id)) {
      return void 0;
    }
    visitedModules.add(moduleInfo.id);
    const localBindingName = moduleInfo.exports.get(exportName);
    if (localBindingName) {
      const binding = moduleInfo.bindings.get(localBindingName);
      if (binding) {
        const result = { moduleInfo, binding };
        if (isBuildMode) {
          this.getExportResolutionCache(moduleInfo.id).set(exportName, result);
        }
        return result;
      }
    }
    if (moduleInfo.reExportAllSources.length > 0) {
      const results = await Promise.all(
        moduleInfo.reExportAllSources.map(async (reExportSource) => {
          const reExportTarget = await this.resolveIdCached(
            reExportSource,
            moduleInfo.id
          );
          if (reExportTarget) {
            const reExportModule = await this.getModuleInfo(reExportTarget);
            return this.findExportInModule(
              reExportModule,
              exportName,
              visitedModules
            );
          }
          return void 0;
        })
      );
      for (const result of results) {
        if (result) {
          if (isBuildMode) {
            this.getExportResolutionCache(moduleInfo.id).set(exportName, result);
          }
          return result;
        }
      }
    }
    if (isBuildMode) {
      this.getExportResolutionCache(moduleInfo.id).set(exportName, null);
    }
    return void 0;
  }
  async resolveBindingKind(binding, fileId, visited = /* @__PURE__ */ new Set()) {
    if (binding.resolvedKind) {
      return binding.resolvedKind;
    }
    if (binding.type === "import") {
      const knownExports = this.knownRootImports.get(binding.source);
      if (knownExports) {
        const kind = knownExports.get(binding.importedName);
        if (kind) {
          binding.resolvedKind = kind;
          return kind;
        }
      }
      const target = await this.resolveIdCached(binding.source, fileId);
      if (!target) {
        return "None";
      }
      const importedModule = await this.getModuleInfo(target);
      const found = await this.findExportInModule(
        importedModule,
        binding.importedName
      );
      if (!found) {
        return "None";
      }
      const { moduleInfo: foundModule, binding: foundBinding } = found;
      if (foundBinding.resolvedKind) {
        return foundBinding.resolvedKind;
      }
      const resolvedKind2 = await this.resolveBindingKind(
        foundBinding,
        foundModule.id,
        visited
      );
      foundBinding.resolvedKind = resolvedKind2;
      return resolvedKind2;
    }
    const resolvedKind = await this.resolveExprKind(
      binding.init,
      fileId,
      visited
    );
    binding.resolvedKind = resolvedKind;
    return resolvedKind;
  }
  /**
   * Checks if an identifier is a direct import from a known factory library.
   * Returns true for imports like `import { createServerOnlyFn } from '@tanstack/react-start'`
   * or renamed imports like `import { createServerOnlyFn as myFn } from '...'`.
   * Returns false for local variables that hold the result of calling a factory.
   */
  async isKnownFactoryImport(identName, fileId) {
    const info = await this.getModuleInfo(fileId);
    const binding = info.bindings.get(identName);
    if (!binding || binding.type !== "import") {
      return false;
    }
    const knownExports = this.knownRootImports.get(binding.source);
    return knownExports !== void 0 && knownExports.has(binding.importedName);
  }
  async resolveExprKind(expr, fileId, visited = /* @__PURE__ */ new Set()) {
    if (!expr) {
      return "None";
    }
    while (t.isTSAsExpression(expr) || t.isTSNonNullExpression(expr) || t.isParenthesizedExpression(expr)) {
      expr = expr.expression;
    }
    let result = "None";
    if (t.isCallExpression(expr)) {
      if (!t.isExpression(expr.callee)) {
        return "None";
      }
      const calleeKind = await this.resolveCalleeKind(
        expr.callee,
        fileId,
        visited
      );
      if (calleeKind === "Root" || calleeKind === "Builder") {
        return "Builder";
      }
      if (t.isMemberExpression(expr.callee)) {
        if (this.validLookupKinds.has(calleeKind)) {
          return calleeKind;
        }
      }
      if (t.isIdentifier(expr.callee)) {
        const isFactoryImport = await this.isKnownFactoryImport(
          expr.callee.name,
          fileId
        );
        if (isFactoryImport && this.validLookupKinds.has(calleeKind)) {
          return calleeKind;
        }
      }
    } else if (t.isMemberExpression(expr) && t.isIdentifier(expr.property)) {
      result = await this.resolveCalleeKind(expr.object, fileId, visited);
    }
    if (result === "None" && t.isIdentifier(expr)) {
      result = await this.resolveIdentifierKind(expr.name, fileId, visited);
    }
    return result;
  }
  async resolveCalleeKind(callee, fileId, visited = /* @__PURE__ */ new Set()) {
    if (t.isIdentifier(callee)) {
      return this.resolveIdentifierKind(callee.name, fileId, visited);
    }
    if (t.isMemberExpression(callee) && t.isIdentifier(callee.property)) {
      const prop = callee.property.name;
      const possibleKinds = IdentifierToKinds.get(prop);
      if (possibleKinds) {
        const base = await this.resolveExprKind(callee.object, fileId, visited);
        for (const kind of possibleKinds) {
          if (!this.validLookupKinds.has(kind)) continue;
          if (kind === "ServerFn") {
            if (base === "Root" || base === "Builder") {
              return "ServerFn";
            }
          } else if (kind === "Middleware") {
            if (base === "Root" || base === "Builder" || base === "Middleware") {
              return "Middleware";
            }
          } else if (kind === "IsomorphicFn") {
            if (base === "Root" || base === "Builder" || base === "IsomorphicFn") {
              return "IsomorphicFn";
            }
          }
        }
      }
      if (t.isIdentifier(callee.object)) {
        const info = await this.getModuleInfo(fileId);
        const binding = info.bindings.get(callee.object.name);
        if (binding && binding.type === "import" && binding.importedName === "*") {
          const targetModuleId = await this.resolveIdCached(
            binding.source,
            fileId
          );
          if (targetModuleId) {
            const targetModule = await this.getModuleInfo(targetModuleId);
            const localBindingName = targetModule.exports.get(
              callee.property.name
            );
            if (localBindingName) {
              const exportedBinding = targetModule.bindings.get(localBindingName);
              if (exportedBinding) {
                return await this.resolveBindingKind(
                  exportedBinding,
                  targetModule.id,
                  visited
                );
              }
            }
          } else {
            return "None";
          }
        }
      }
      return this.resolveExprKind(callee.object, fileId, visited);
    }
    return this.resolveExprKind(callee, fileId, visited);
  }
  async getModuleInfo(id) {
    let cached = this.moduleCache.get(id);
    if (cached) {
      return cached;
    }
    await this.options.loadModule(id);
    cached = this.moduleCache.get(id);
    if (!cached) {
      throw new Error(`could not load module info for ${id}`);
    }
    return cached;
  }
}
function isMethodChainCandidate(node, lookupKinds) {
  const callee = node.callee;
  if (!t.isMemberExpression(callee) || !t.isIdentifier(callee.property)) {
    return false;
  }
  const possibleKinds = IdentifierToKinds.get(callee.property.name);
  if (possibleKinds) {
    for (const kind of possibleKinds) {
      if (lookupKinds.has(kind)) {
        return true;
      }
    }
  }
  return false;
}
export {
  KindDetectionPatterns,
  LookupKindsPerEnv,
  StartCompiler,
  detectKindsInCode
};
//# sourceMappingURL=compiler.js.map
