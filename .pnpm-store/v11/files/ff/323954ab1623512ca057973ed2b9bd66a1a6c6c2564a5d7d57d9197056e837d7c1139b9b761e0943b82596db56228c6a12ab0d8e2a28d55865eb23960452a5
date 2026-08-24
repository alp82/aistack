import { readFileSync, writeFileSync } from "node:fs";
import { gen, trav } from "./babel.js";
import { parse } from "@babel/parser";
import * as t from "@babel/types";
const detectDevtoolsImport = (code) => {
  const devtoolsPackages = [
    "@tanstack/react-devtools",
    "@tanstack/solid-devtools",
    "@tanstack/vue-devtools",
    "@tanstack/svelte-devtools",
    "@tanstack/angular-devtools"
  ];
  try {
    const ast = parse(code, {
      sourceType: "module",
      plugins: ["jsx", "typescript"]
    });
    let hasDevtoolsImport = false;
    trav(ast, {
      ImportDeclaration(path) {
        const importSource = path.node.source.value;
        if (devtoolsPackages.includes(importSource)) {
          hasDevtoolsImport = true;
          path.stop();
        }
      }
    });
    return hasDevtoolsImport;
  } catch (e) {
    return false;
  }
};
const findDevtoolsComponentName = (ast) => {
  let componentName = null;
  const devtoolsPackages = [
    "@tanstack/react-devtools",
    "@tanstack/solid-devtools",
    "@tanstack/vue-devtools",
    "@tanstack/svelte-devtools",
    "@tanstack/angular-devtools"
  ];
  trav(ast, {
    ImportDeclaration(path) {
      const importSource = path.node.source.value;
      if (devtoolsPackages.includes(importSource)) {
        const namedImport = path.node.specifiers.find(
          (spec) => t.isImportSpecifier(spec) && t.isIdentifier(spec.imported) && spec.imported.name === "TanStackDevtools"
        );
        if (namedImport && t.isImportSpecifier(namedImport)) {
          componentName = namedImport.local.name;
          path.stop();
          return;
        }
        const namespaceImport = path.node.specifiers.find(
          (spec) => t.isImportNamespaceSpecifier(spec)
        );
        if (namespaceImport && t.isImportNamespaceSpecifier(namespaceImport)) {
          componentName = `${namespaceImport.local.name}.TanStackDevtools`;
          path.stop();
          return;
        }
      }
    }
  });
  return componentName;
};
const transformAndInject = (ast, injection, devtoolsComponentName) => {
  let didTransform = false;
  const importName = injection.pluginImport?.importName;
  const pluginType = injection.pluginImport?.type || "jsx";
  const displayName = injection.pluginName;
  if (!importName) {
    return false;
  }
  const isNamespaceImport = devtoolsComponentName.includes(".");
  trav(ast, {
    JSXOpeningElement(path) {
      const elementName = path.node.name;
      let matches = false;
      if (isNamespaceImport) {
        if (t.isJSXMemberExpression(elementName)) {
          const fullName = `${t.isJSXIdentifier(elementName.object) ? elementName.object.name : ""}.${t.isJSXIdentifier(elementName.property) ? elementName.property.name : ""}`;
          matches = fullName === devtoolsComponentName;
        }
      } else {
        matches = t.isJSXIdentifier(elementName) && elementName.name === devtoolsComponentName;
      }
      if (matches) {
        const pluginsProp = path.node.attributes.find(
          (attr) => t.isJSXAttribute(attr) && t.isJSXIdentifier(attr.name) && attr.name.name === "plugins"
        );
        if (pluginsProp && t.isJSXAttribute(pluginsProp)) {
          if (pluginsProp.value && t.isJSXExpressionContainer(pluginsProp.value)) {
            const expression = pluginsProp.value.expression;
            if (t.isArrayExpression(expression)) {
              const pluginExists = expression.elements.some((element) => {
                if (!element) return false;
                if (pluginType === "function") {
                  return t.isCallExpression(element) && t.isIdentifier(element.callee) && element.callee.name === importName;
                }
                if (!t.isObjectExpression(element)) return false;
                return element.properties.some((prop) => {
                  if (!t.isObjectProperty(prop) || !t.isIdentifier(prop.key) || prop.key.name !== "name") {
                    return false;
                  }
                  return t.isStringLiteral(prop.value) && prop.value.value === displayName;
                });
              });
              if (!pluginExists) {
                if (pluginType === "function") {
                  expression.elements.push(
                    t.callExpression(t.identifier(importName), [])
                  );
                } else {
                  const renderValue = t.jsxElement(
                    t.jsxOpeningElement(t.jsxIdentifier(importName), [], true),
                    null,
                    [],
                    true
                  );
                  expression.elements.push(
                    t.objectExpression([
                      t.objectProperty(
                        t.identifier("name"),
                        t.stringLiteral(displayName)
                      ),
                      t.objectProperty(t.identifier("render"), renderValue)
                    ])
                  );
                }
                didTransform = true;
              }
            }
          }
        } else {
          let pluginElement;
          if (pluginType === "function") {
            pluginElement = t.callExpression(t.identifier(importName), []);
          } else {
            const renderValue = t.jsxElement(
              t.jsxOpeningElement(t.jsxIdentifier(importName), [], true),
              null,
              [],
              true
            );
            pluginElement = t.objectExpression([
              t.objectProperty(
                t.identifier("name"),
                t.stringLiteral(displayName)
              ),
              t.objectProperty(t.identifier("render"), renderValue)
            ]);
          }
          path.node.attributes.push(
            t.jsxAttribute(
              t.jsxIdentifier("plugins"),
              t.jsxExpressionContainer(t.arrayExpression([pluginElement]))
            )
          );
          didTransform = true;
        }
      }
    }
  });
  if (didTransform) {
    const importDeclaration = t.importDeclaration(
      [t.importSpecifier(t.identifier(importName), t.identifier(importName))],
      t.stringLiteral(injection.packageName)
    );
    let lastImportIndex = -1;
    ast.program.body.forEach((node, index) => {
      if (t.isImportDeclaration(node)) {
        lastImportIndex = index;
      }
    });
    ast.program.body.splice(lastImportIndex + 1, 0, importDeclaration);
  }
  return didTransform;
};
function detectDevtoolsFile(code) {
  return detectDevtoolsImport(code);
}
function injectPluginIntoFile(filePath, injection) {
  try {
    const code = readFileSync(filePath, "utf-8");
    const ast = parse(code, {
      sourceType: "module",
      plugins: ["jsx", "typescript"]
    });
    const devtoolsComponentName = findDevtoolsComponentName(ast);
    if (!devtoolsComponentName) {
      return {
        success: false,
        error: "Could not find TanStackDevtools import"
      };
    }
    const didTransform = transformAndInject(
      ast,
      injection,
      devtoolsComponentName
    );
    if (!didTransform) {
      return {
        success: false,
        error: "Plugin already exists or no TanStackDevtools component found"
      };
    }
    const result = gen(ast, {
      sourceMaps: false,
      retainLines: false
    });
    writeFileSync(filePath, result.code, "utf-8");
    return { success: true };
  } catch (e) {
    console.error("Error injecting plugin:", e);
    return {
      success: false,
      error: e instanceof Error ? e.message : "Unknown error"
    };
  }
}
export {
  detectDevtoolsFile,
  findDevtoolsComponentName,
  injectPluginIntoFile,
  transformAndInject
};
//# sourceMappingURL=inject-plugin.js.map
