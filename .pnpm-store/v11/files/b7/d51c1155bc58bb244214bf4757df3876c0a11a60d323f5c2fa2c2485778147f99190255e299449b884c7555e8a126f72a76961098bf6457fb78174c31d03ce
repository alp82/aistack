import * as t from "@babel/types";
import babel from "@babel/core";
import path from "pathe";
import { VITE_ENVIRONMENT_NAMES } from "../constants.js";
import { cleanId, codeFrameError, stripMethodCall } from "./utils.js";
const TSS_SERVERFN_SPLIT_PARAM = "tss-serverfn-split";
const serverRpcTemplate = babel.template.expression(
  `createServerRpc(%%functionId%%, %%fn%%)`
);
const clientRpcTemplate = babel.template.expression(
  `createClientRpc(%%functionId%%)`
);
const ssrRpcManifestTemplate = babel.template.expression(
  `createSsrRpc(%%functionId%%)`
);
const ssrRpcImporterTemplate = babel.template.expression(
  `createSsrRpc(%%functionId%%, () => import(%%extractedFilename%%).then(m => m[%%functionName%%]))`
);
const RuntimeCodeCache = /* @__PURE__ */ new Map();
function getCachedRuntimeCode(framework, type) {
  let cache = RuntimeCodeCache.get(framework);
  if (!cache) {
    cache = {
      provider: babel.template.ast(
        `import { createServerRpc } from '@tanstack/${framework}-start/server-rpc'`,
        { placeholderPattern: false }
      ),
      client: babel.template.ast(
        `import { createClientRpc } from '@tanstack/${framework}-start/client-rpc'`,
        { placeholderPattern: false }
      ),
      ssr: babel.template.ast(
        `import { createSsrRpc } from '@tanstack/${framework}-start/ssr-rpc'`,
        { placeholderPattern: false }
      )
    };
    RuntimeCodeCache.set(framework, cache);
  }
  return cache[type];
}
function getEnvConfig(context, isProviderFile) {
  const { providerEnvName, env } = context;
  const ssrIsProvider = providerEnvName === VITE_ENVIRONMENT_NAMES.server;
  if (isProviderFile) {
    return {
      isClientEnvironment: false,
      ssrIsProvider,
      runtimeCodeType: "provider"
    };
  }
  if (env === "client") {
    return {
      isClientEnvironment: true,
      ssrIsProvider,
      runtimeCodeType: "client"
    };
  }
  return {
    isClientEnvironment: false,
    ssrIsProvider,
    runtimeCodeType: "ssr"
  };
}
function generateProviderRpcStub(functionId, fn) {
  return serverRpcTemplate({
    functionId: t.stringLiteral(functionId),
    fn
  });
}
function generateCallerRpcStub(functionId, functionName, extractedFilename, isClientReferenced, envConfig) {
  if (envConfig.runtimeCodeType === "client") {
    return clientRpcTemplate({
      functionId: t.stringLiteral(functionId)
    });
  }
  if (isClientReferenced || !envConfig.ssrIsProvider) {
    return ssrRpcManifestTemplate({
      functionId: t.stringLiteral(functionId)
    });
  }
  return ssrRpcImporterTemplate({
    functionId: t.stringLiteral(functionId),
    extractedFilename: t.stringLiteral(extractedFilename),
    functionName: t.stringLiteral(functionName)
  });
}
function handleCreateServerFn(candidates, context) {
  if (candidates.length === 0) {
    return;
  }
  const isProviderFile = context.id.includes(TSS_SERVERFN_SPLIT_PARAM);
  const envConfig = getEnvConfig(context, isProviderFile);
  const functionNameSet = /* @__PURE__ */ new Set();
  const exportNames = /* @__PURE__ */ new Set();
  const serverFnsById = {};
  const [baseFilename] = context.id.split("?");
  const extractedFilename = `${baseFilename}?${TSS_SERVERFN_SPLIT_PARAM}`;
  const relativeFilename = path.relative(context.root, baseFilename);
  const knownFns = context.getKnownServerFns();
  const cleanedContextId = cleanId(context.id);
  for (const candidate of candidates) {
    const { path: candidatePath, methodChain } = candidate;
    const { inputValidator, handler } = methodChain;
    if (!candidatePath.parentPath.isVariableDeclarator()) {
      throw new Error("createServerFn must be assigned to a variable!");
    }
    const variableDeclarator = candidatePath.parentPath.node;
    if (!t.isIdentifier(variableDeclarator.id)) {
      throw codeFrameError(
        context.code,
        variableDeclarator.id.loc,
        "createServerFn must be assigned to a simple identifier, not a destructuring pattern"
      );
    }
    const existingVariableName = variableDeclarator.id.name;
    let functionName = `${existingVariableName}_createServerFn_handler`;
    while (functionNameSet.has(functionName)) {
      functionName = incrementFunctionNameVersion(functionName);
    }
    functionNameSet.add(functionName);
    const functionId = context.generateFunctionId({
      filename: relativeFilename,
      functionName,
      extractedFilename
    });
    const knownFn = knownFns[functionId];
    const isClientReferenced = envConfig.isClientEnvironment || !!knownFn;
    const canonicalExtractedFilename = knownFn?.extractedFilename ?? extractedFilename;
    if (inputValidator) {
      const innerInputExpression = inputValidator.callPath.node.arguments[0];
      if (!innerInputExpression) {
        throw new Error(
          "createServerFn().inputValidator() must be called with a validator!"
        );
      }
      if (context.env === "client") {
        stripMethodCall(inputValidator.callPath);
      }
    }
    const handlerFnPath = handler?.firstArgPath;
    if (!handler || !handlerFnPath?.node) {
      throw codeFrameError(
        context.code,
        candidatePath.node.callee.loc,
        `createServerFn must be called with a "handler" property!`
      );
    }
    if (!t.isExpression(handlerFnPath.node)) {
      throw codeFrameError(
        context.code,
        handlerFnPath.node.loc,
        `handler() must be called with an expression, not a ${handlerFnPath.node.type}`
      );
    }
    const handlerFn = handlerFnPath.node;
    if (!isProviderFile) {
      serverFnsById[functionId] = {
        functionName,
        functionId,
        filename: cleanedContextId,
        extractedFilename: canonicalExtractedFilename,
        isClientReferenced
      };
    }
    if (isProviderFile) {
      const executeServerArrowFn = t.arrowFunctionExpression(
        [t.identifier("opts"), t.identifier("signal")],
        t.callExpression(
          t.memberExpression(
            t.identifier(existingVariableName),
            t.identifier("__executeServer")
          ),
          [t.identifier("opts"), t.identifier("signal")]
        )
      );
      const extractedFnInit = generateProviderRpcStub(
        functionId,
        executeServerArrowFn
      );
      const extractedFnStatement = t.variableDeclaration("const", [
        t.variableDeclarator(t.identifier(functionName), extractedFnInit)
      ]);
      const variableDeclaration = candidatePath.parentPath.parentPath;
      if (!variableDeclaration.isVariableDeclaration()) {
        throw new Error(
          "Expected createServerFn to be in a VariableDeclaration"
        );
      }
      variableDeclaration.insertBefore(extractedFnStatement);
      const extractedFnIdentifier = t.identifier(functionName);
      const serverFnNode = t.cloneNode(handlerFn, true);
      handler.callPath.node.arguments = [extractedFnIdentifier, serverFnNode];
      exportNames.add(functionName);
    } else {
      if (t.isIdentifier(handlerFn)) {
        const binding = handlerFnPath.scope.getBinding(handlerFn.name);
        if (binding) {
          binding.path.remove();
        }
      }
      const rpcStub = generateCallerRpcStub(
        functionId,
        functionName,
        canonicalExtractedFilename,
        isClientReferenced,
        envConfig
      );
      handlerFnPath.replaceWith(rpcStub);
    }
  }
  if (isProviderFile) {
    safeRemoveExports(context.ast);
    if (exportNames.size > 0) {
      context.ast.program.body.push(
        t.exportNamedDeclaration(
          void 0,
          Array.from(exportNames).map(
            (name) => t.exportSpecifier(t.identifier(name), t.identifier(name))
          )
        )
      );
    }
  }
  if (!isProviderFile && Object.keys(serverFnsById).length > 0 && context.onServerFnsById) {
    context.onServerFnsById(serverFnsById);
  }
  const runtimeCode = getCachedRuntimeCode(
    context.framework,
    envConfig.runtimeCodeType
  );
  context.ast.program.body.unshift(t.cloneNode(runtimeCode));
}
function makeIdentifierSafe(identifier) {
  return identifier.replace(/[^a-zA-Z0-9_$]/g, "_").replace(/^[0-9]/, "_$&").replace(/^\$/, "_$").replace(/_{2,}/g, "_").replace(/^_|_$/g, "");
}
function incrementFunctionNameVersion(functionName) {
  const [realReferenceName, count] = functionName.split(/_(\d+)$/);
  const resolvedCount = Number(count || "0");
  const suffix = `_${resolvedCount + 1}`;
  return makeIdentifierSafe(realReferenceName) + suffix;
}
function safeRemoveExports(ast) {
  ast.program.body = ast.program.body.flatMap((node) => {
    if (t.isExportNamedDeclaration(node) || t.isExportDefaultDeclaration(node)) {
      if (t.isFunctionDeclaration(node.declaration) || t.isClassDeclaration(node.declaration) || t.isVariableDeclaration(node.declaration)) {
        if (t.isFunctionDeclaration(node.declaration) || t.isClassDeclaration(node.declaration)) {
          if (!node.declaration.id) {
            return node;
          }
        }
        return node.declaration;
      } else if (node.declaration === null) {
        return [];
      }
    }
    return node;
  });
}
export {
  handleCreateServerFn
};
//# sourceMappingURL=handleCreateServerFn.js.map
