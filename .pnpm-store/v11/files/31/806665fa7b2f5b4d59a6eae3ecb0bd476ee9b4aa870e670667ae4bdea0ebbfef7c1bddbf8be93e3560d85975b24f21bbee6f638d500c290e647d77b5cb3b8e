import { gen, trav } from "./babel.js";
import { parse } from "@babel/parser";
const isTanStackDevtoolsImport = (source) => source === "@tanstack/react-devtools" || source === "@tanstack/devtools" || source === "@tanstack/solid-devtools";
const getImportedNames = (importDecl) => {
  return importDecl.specifiers.map((spec) => spec.local.name);
};
const getLeftoverImports = (node) => {
  const finalReferences = [];
  node.traverse({
    JSXAttribute(path) {
      const node2 = path.node;
      const propName = typeof node2.name.name === "string" ? node2.name.name : node2.name.name.name;
      if (propName === "plugins" && node2.value?.type === "JSXExpressionContainer" && node2.value.expression.type === "ArrayExpression") {
        const elements = node2.value.expression.elements;
        elements.forEach((el) => {
          if (el?.type === "ObjectExpression") {
            const props = el.properties;
            const referencesToRemove = props.map((prop) => {
              if (prop.type === "ObjectProperty" && prop.key.type === "Identifier" && prop.key.name === "render") {
                const value = prop.value;
                if (value.type === "JSXElement" && value.openingElement.name.type === "JSXIdentifier") {
                  const elementName = value.openingElement.name.name;
                  return elementName;
                }
                if (value.type === "ArrowFunctionExpression" || value.type === "FunctionExpression") {
                  const body = value.body;
                  if (body.type === "JSXElement" && body.openingElement.name.type === "JSXIdentifier") {
                    const elementName = body.openingElement.name.name;
                    return elementName;
                  }
                }
                if (value.type === "Identifier") {
                  const elementName = value.name;
                  return elementName;
                }
                if (value.type === "CallExpression" && value.callee.type === "Identifier") {
                  const elementName = value.callee.name;
                  return elementName;
                }
                return "";
              }
              return "";
            }).filter(Boolean);
            finalReferences.push(...referencesToRemove);
          }
        });
      }
    }
  });
  return finalReferences;
};
const transform = (ast) => {
  let didTransform = false;
  const devtoolsComponentNames = /* @__PURE__ */ new Set();
  const finalReferences = [];
  const transformations = [];
  trav(ast, {
    ImportDeclaration(path) {
      const importSource = path.node.source.value;
      if (isTanStackDevtoolsImport(importSource)) {
        getImportedNames(path.node).forEach(
          (name) => devtoolsComponentNames.add(name)
        );
        transformations.push(() => {
          path.remove();
        });
        didTransform = true;
      }
    },
    JSXElement(path) {
      const opening = path.node.openingElement;
      if (opening.name.type === "JSXIdentifier" && devtoolsComponentNames.has(opening.name.name)) {
        const refs = getLeftoverImports(path);
        finalReferences.push(...refs);
        transformations.push(() => {
          path.remove();
        });
        didTransform = true;
      }
      if (opening.name.type === "JSXMemberExpression" && opening.name.object.type === "JSXIdentifier" && devtoolsComponentNames.has(opening.name.object.name)) {
        const refs = getLeftoverImports(path);
        finalReferences.push(...refs);
        transformations.push(() => {
          path.remove();
        });
        didTransform = true;
      }
    }
  });
  trav(ast, {
    ImportDeclaration(path) {
      const imports = path.node.specifiers;
      for (const imported of imports) {
        if (imported.type === "ImportSpecifier") {
          if (finalReferences.includes(imported.local.name)) {
            transformations.push(() => {
              path.node.specifiers = path.node.specifiers.filter(
                (spec) => spec !== imported
              );
              if (path.node.specifiers.length === 0) {
                path.remove();
              }
            });
          }
        }
      }
    }
  });
  transformations.forEach((fn) => fn());
  return didTransform;
};
function removeDevtools(code, id) {
  const [filePath] = id.split("?");
  try {
    const ast = parse(code, {
      sourceType: "module",
      plugins: ["jsx", "typescript"]
    });
    const didTransform = transform(ast);
    if (!didTransform) {
      return;
    }
    return gen(ast, {
      sourceMaps: true,
      retainLines: true,
      filename: id,
      sourceFileName: filePath
    });
  } catch (e) {
    return;
  }
}
export {
  removeDevtools
};
//# sourceMappingURL=remove-devtools.js.map
