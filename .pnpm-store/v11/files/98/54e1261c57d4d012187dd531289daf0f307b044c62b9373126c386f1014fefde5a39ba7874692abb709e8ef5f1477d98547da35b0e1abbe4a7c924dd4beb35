import { normalizePath } from "vite";
import { gen, trav } from "./babel.js";
import { matcher } from "./matcher.js";
import { parse } from "@babel/parser";
import * as t from "@babel/types";
const getPropsNameFromFunctionDeclaration = (functionDeclaration) => {
  let propsName = null;
  if (functionDeclaration.type === "FunctionExpression") {
    const firstArgument = functionDeclaration.params[0];
    if (firstArgument && firstArgument.type === "Identifier") {
      propsName = firstArgument.name;
    }
    if (firstArgument && firstArgument.type === "ObjectPattern") {
      firstArgument.properties.forEach((prop) => {
        if (prop.type === "RestElement" && prop.argument.type === "Identifier") {
          propsName = prop.argument.name;
        }
      });
    }
    return propsName;
  }
  if (functionDeclaration.type === "ArrowFunctionExpression") {
    const firstArgument = functionDeclaration.params[0];
    if (firstArgument && firstArgument.type === "Identifier") {
      propsName = firstArgument.name;
    }
    if (firstArgument && firstArgument.type === "ObjectPattern") {
      firstArgument.properties.forEach((prop) => {
        if (prop.type === "RestElement" && prop.argument.type === "Identifier") {
          propsName = prop.argument.name;
        }
      });
    }
    return propsName;
  }
  if (functionDeclaration.type === "FunctionDeclaration") {
    const firstArgument = functionDeclaration.params[0];
    if (firstArgument && firstArgument.type === "Identifier") {
      propsName = firstArgument.name;
    }
    if (firstArgument && firstArgument.type === "ObjectPattern") {
      firstArgument.properties.forEach((prop) => {
        if (prop.type === "RestElement" && prop.argument.type === "Identifier") {
          propsName = prop.argument.name;
        }
      });
    }
    return propsName;
  }
  if (functionDeclaration.init?.type === "ArrowFunctionExpression" || functionDeclaration.init?.type === "FunctionExpression") {
    const firstArgument = functionDeclaration.init.params[0];
    if (firstArgument && firstArgument.type === "Identifier") {
      propsName = firstArgument.name;
    }
    if (firstArgument && firstArgument.type === "ObjectPattern") {
      firstArgument.properties.forEach((prop) => {
        if (prop.type === "RestElement" && prop.argument.type === "Identifier") {
          propsName = prop.argument.name;
        }
      });
    }
  }
  return propsName;
};
const getNameOfElement = (element) => {
  if (element.type === "JSXIdentifier") {
    return element.name;
  }
  if (element.type === "JSXMemberExpression") {
    return `${getNameOfElement(element.object)}.${getNameOfElement(element.property)}`;
  }
  return `${element.namespace.name}:${element.name.name}`;
};
const transformJSX = (element, propsName, file, ignorePatterns) => {
  const loc = element.node.loc;
  if (!loc) return;
  const line = loc.start.line;
  const column = loc.start.column;
  const nameOfElement = getNameOfElement(element.node.name);
  const isIgnored = matcher(ignorePatterns, nameOfElement);
  if (nameOfElement === "Fragment" || nameOfElement === "React.Fragment" || isIgnored) {
    return;
  }
  const hasDataSource = element.node.attributes.some(
    (attr) => attr.type === "JSXAttribute" && attr.name.type === "JSXIdentifier" && attr.name.name === "data-tsd-source"
  );
  const hasSpread = element.node.attributes.some(
    (attr) => attr.type === "JSXSpreadAttribute" && attr.argument.type === "Identifier" && attr.argument.name === propsName
  );
  if (hasSpread || hasDataSource) {
    return;
  }
  element.node.attributes.push(
    t.jsxAttribute(
      t.jsxIdentifier("data-tsd-source"),
      t.stringLiteral(`${file}:${line}:${column + 1}`)
    )
  );
  return true;
};
const transform = (ast, file, ignorePatterns) => {
  let didTransform = false;
  trav(ast, {
    FunctionDeclaration(functionDeclaration) {
      const propsName = getPropsNameFromFunctionDeclaration(
        functionDeclaration.node
      );
      functionDeclaration.traverse({
        JSXOpeningElement(element) {
          const transformed = transformJSX(
            element,
            propsName,
            file,
            ignorePatterns
          );
          if (transformed) {
            didTransform = true;
          }
        }
      });
    },
    ArrowFunctionExpression(path) {
      const propsName = getPropsNameFromFunctionDeclaration(path.node);
      path.traverse({
        JSXOpeningElement(element) {
          const transformed = transformJSX(
            element,
            propsName,
            file,
            ignorePatterns
          );
          if (transformed) {
            didTransform = true;
          }
        }
      });
    },
    FunctionExpression(path) {
      const propsName = getPropsNameFromFunctionDeclaration(path.node);
      path.traverse({
        JSXOpeningElement(element) {
          const transformed = transformJSX(
            element,
            propsName,
            file,
            ignorePatterns
          );
          if (transformed) {
            didTransform = true;
          }
        }
      });
    },
    VariableDeclaration(path) {
      const functionDeclaration = path.node.declarations.find((decl) => {
        return decl.init?.type === "ArrowFunctionExpression" || decl.init?.type === "FunctionExpression";
      });
      if (!functionDeclaration) {
        return;
      }
      const propsName = getPropsNameFromFunctionDeclaration(functionDeclaration);
      path.traverse({
        JSXOpeningElement(element) {
          const transformed = transformJSX(
            element,
            propsName,
            file,
            ignorePatterns
          );
          if (transformed) {
            didTransform = true;
          }
        }
      });
    }
  });
  return didTransform;
};
function addSourceToJsx(code, id, ignore = {}) {
  const [filePath] = id.split("?");
  const location = filePath?.replace(normalizePath(process.cwd()), "");
  const fileIgnored = matcher(ignore.files || [], location);
  if (fileIgnored) {
    return;
  }
  try {
    const ast = parse(code, {
      sourceType: "module",
      plugins: ["jsx", "typescript"]
    });
    const didTransform = transform(ast, location, ignore.components || []);
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
  addSourceToJsx
};
//# sourceMappingURL=inject-source.js.map
