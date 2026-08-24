import { getRequest, setResponse } from "./adapters/node/request.cjs";
import { Router } from "./router.cjs";
import { IncomingMessage, ServerResponse } from "node:http";

//#region src/adapters/node/index.d.ts
declare function toNodeHandler(handler: Router["handler"]): (req: IncomingMessage, res: ServerResponse) => Promise<void>;
//#endregion
export { getRequest, setResponse, toNodeHandler };
//# sourceMappingURL=node.d.cts.map