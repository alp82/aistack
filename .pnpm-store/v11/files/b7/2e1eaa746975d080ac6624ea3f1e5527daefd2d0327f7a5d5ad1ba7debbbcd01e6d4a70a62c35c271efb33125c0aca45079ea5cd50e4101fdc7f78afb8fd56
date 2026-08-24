import { IncomingMessage, ServerResponse } from "node:http";

//#region src/adapters/node/request.d.ts
declare function getRequest({
  request,
  base,
  bodySizeLimit
}: {
  base: string;
  bodySizeLimit?: number;
  request: IncomingMessage;
}): Request;
declare function setResponse(res: ServerResponse, response: Response): Promise<void>;
//#endregion
export { getRequest, setResponse };
//# sourceMappingURL=request.d.mts.map