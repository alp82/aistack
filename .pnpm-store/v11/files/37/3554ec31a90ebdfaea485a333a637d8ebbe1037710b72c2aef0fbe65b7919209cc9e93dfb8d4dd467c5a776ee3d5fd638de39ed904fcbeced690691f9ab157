import { HTTPHandler } from "h3";
import { Nitro } from "nitro/types";
declare class NitroDevApp {
  #private;
  nitro: Nitro;
  fetch: (req: Request) => Response | Promise<Response>;
  constructor(nitro: Nitro, catchAllHandler?: HTTPHandler);
}
export { NitroDevApp };