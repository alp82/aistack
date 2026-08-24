import * as t from "@babel/types";
function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}
function handleEnvOnlyFn(candidates, context, kind) {
  const targetEnv = kind === "ClientOnlyFn" ? "client" : "server";
  for (const candidate of candidates) {
    const { path } = candidate;
    if (context.env === targetEnv) {
      const innerFn = path.node.arguments[0];
      if (!t.isExpression(innerFn)) {
        throw new Error(
          `create${capitalize(targetEnv)}OnlyFn() must be called with a function!`
        );
      }
      path.replaceWith(innerFn);
    } else {
      path.replaceWith(
        t.arrowFunctionExpression(
          [],
          t.blockStatement([
            t.throwStatement(
              t.newExpression(t.identifier("Error"), [
                t.stringLiteral(
                  `create${capitalize(targetEnv)}OnlyFn() functions can only be called on the ${targetEnv}!`
                )
              ])
            )
          ])
        )
      );
    }
  }
}
export {
  handleEnvOnlyFn
};
//# sourceMappingURL=handleEnvOnly.js.map
