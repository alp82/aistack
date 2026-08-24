import { stripMethodCall } from "./utils.js";
function handleCreateMiddleware(candidates, context) {
  if (context.env === "server") {
    throw new Error("handleCreateMiddleware should not be called on the server");
  }
  for (const candidate of candidates) {
    const { inputValidator, server } = candidate.methodChain;
    if (inputValidator) {
      const innerInputExpression = inputValidator.callPath.node.arguments[0];
      if (!innerInputExpression) {
        throw new Error(
          "createMiddleware().inputValidator() must be called with a validator!"
        );
      }
      stripMethodCall(inputValidator.callPath);
    }
    if (server) {
      stripMethodCall(server.callPath);
    }
  }
}
export {
  handleCreateMiddleware
};
//# sourceMappingURL=handleCreateMiddleware.js.map
