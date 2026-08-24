import { codeFrameColumns } from "@babel/code-frame";
import * as t from "@babel/types";
function codeFrameError(code, loc, message) {
  const frame = codeFrameColumns(
    code,
    {
      start: loc.start,
      end: loc.end
    },
    {
      highlightCode: true,
      message
    }
  );
  return new Error(frame);
}
function cleanId(id) {
  if (id.startsWith("\0")) {
    id = id.slice(1);
  }
  const queryIndex = id.indexOf("?");
  return queryIndex === -1 ? id : id.substring(0, queryIndex);
}
function stripMethodCall(callPath) {
  if (t.isMemberExpression(callPath.node.callee)) {
    callPath.replaceWith(callPath.node.callee.object);
  }
}
export {
  cleanId,
  codeFrameError,
  stripMethodCall
};
//# sourceMappingURL=utils.js.map
