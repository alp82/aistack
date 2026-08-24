import { SERVER_PROP } from "./constants.js";
function pruneServerOnlySubtrees({
  rootRouteNode,
  acc
}) {
  const routeNodes = [];
  const routeTree = prune({ ...rootRouteNode, children: acc.routeTree }, routeNodes)?.children || [];
  routeNodes.pop();
  return {
    routeTree,
    routeNodes
  };
}
function prune(node, collectedRouteNodes) {
  const newChildren = [];
  let allChildrenServerOnly = true;
  for (const child of node.children || []) {
    const newChild = prune(child, collectedRouteNodes);
    if (newChild) {
      newChildren.push(newChild);
      allChildrenServerOnly = false;
    }
  }
  const allServerOnly = node.createFileRouteProps?.has(SERVER_PROP) && node.createFileRouteProps.size === 1 && allChildrenServerOnly;
  if (allServerOnly) {
    return null;
  }
  collectedRouteNodes.push(node);
  return { ...node, children: newChildren };
}
export {
  pruneServerOnlySubtrees
};
//# sourceMappingURL=pruneServerOnlySubtrees.js.map
