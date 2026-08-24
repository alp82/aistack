import chalk from "chalk";
import { normalizePath } from "vite";
import { gen, trav } from "./babel.js";
import { parse } from "@babel/parser";
import * as t from "@babel/types";
const transform = (ast, filePath, port) => {
  let didTransform = false;
  trav(ast, {
    CallExpression(path) {
      const callee = path.node.callee;
      if (callee.type === "MemberExpression" && callee.object.type === "Identifier" && callee.object.name === "console" && callee.property.type === "Identifier" && (callee.property.name === "log" || callee.property.name === "error")) {
        const location = path.node.loc;
        if (!location) {
          return;
        }
        const [lineNumber, column] = [
          location.start.line,
          location.start.column
        ];
        const finalPath = `${filePath}:${lineNumber}:${column + 1}`;
        path.node.arguments.unshift(
          t.stringLiteral(
            `${chalk.magenta("LOG")} ${chalk.blueBright(`${finalPath} - http://localhost:${port}/__tsd/open-source?source=${encodeURIComponent(finalPath)}`)}
 → `
          )
        );
        didTransform = true;
      }
    }
  });
  return didTransform;
};
function enhanceConsoleLog(code, id, port) {
  const [filePath] = id.split("?");
  const location = filePath?.replace(normalizePath(process.cwd()), "");
  try {
    const ast = parse(code, {
      sourceType: "module",
      plugins: ["jsx", "typescript"]
    });
    const didTransform = transform(ast, location, port);
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
  enhanceConsoleLog
};
//# sourceMappingURL=enhance-logs.js.map
