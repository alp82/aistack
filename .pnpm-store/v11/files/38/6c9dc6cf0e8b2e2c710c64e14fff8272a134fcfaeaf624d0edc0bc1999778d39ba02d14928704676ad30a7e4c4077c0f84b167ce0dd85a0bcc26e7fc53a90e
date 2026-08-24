import { PrettifyDeep } from "./helper.mjs";
import { InferAPI } from "./api.mjs";
import { InferPluginTypes, InferSession, InferUser } from "./models.mjs";
import { InferPluginErrorCodes } from "./plugins.mjs";
import { router } from "../api/index.mjs";
import { AuthContext, BetterAuthOptions } from "@better-auth/core";
import { BASE_ERROR_CODES } from "@better-auth/core/error";

//#region src/types/auth.d.ts
type Auth<Options extends BetterAuthOptions = BetterAuthOptions> = {
  handler: (request: Request) => Promise<Response>;
  api: InferAPI<ReturnType<typeof router<Options>>["endpoints"]>;
  options: Options;
  $ERROR_CODES: InferPluginErrorCodes<Options> & typeof BASE_ERROR_CODES;
  $context: Promise<AuthContext>;
  /**
   * Share types
   */
  $Infer: InferPluginTypes<Options> extends {
    Session: any;
  } ? InferPluginTypes<Options> : {
    Session: {
      session: PrettifyDeep<InferSession<Options>>;
      user: PrettifyDeep<InferUser<Options>>;
    };
  } & InferPluginTypes<Options>;
};
//#endregion
export { Auth };
//# sourceMappingURL=auth.d.mts.map