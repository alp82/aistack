import { AnonymousOptions } from "./types.mjs";
import * as _better_auth_core4 from "@better-auth/core";
import * as better_call140 from "better-call";

//#region src/plugins/anonymous/index.d.ts
declare const anonymous: (options?: AnonymousOptions | undefined) => {
  id: "anonymous";
  endpoints: {
    signInAnonymous: better_call140.StrictEndpoint<"/sign-in/anonymous", {
      method: "POST";
      metadata: {
        openapi: {
          description: string;
          responses: {
            200: {
              description: string;
              content: {
                "application/json": {
                  schema: {
                    type: "object";
                    properties: {
                      user: {
                        $ref: string;
                      };
                      session: {
                        $ref: string;
                      };
                    };
                  };
                };
              };
            };
          };
        };
      };
    }, {
      token: string;
      user: {
        id: string;
        email: string;
        emailVerified: boolean;
        name: string;
        createdAt: Date;
        updatedAt: Date;
      };
    } | null>;
  };
  hooks: {
    after: {
      matcher(ctx: _better_auth_core4.HookEndpointContext): boolean;
      handler: (inputContext: better_call140.MiddlewareInputContext<better_call140.MiddlewareOptions>) => Promise<void>;
    }[];
  };
  options: AnonymousOptions | undefined;
  schema: {
    user: {
      fields: {
        isAnonymous: {
          type: "boolean";
          required: false;
          input: false;
          defaultValue: false;
        };
      };
    };
  };
  $ERROR_CODES: {
    readonly INVALID_EMAIL_FORMAT: "Email was not generated in a valid format";
    readonly FAILED_TO_CREATE_USER: "Failed to create user";
    readonly COULD_NOT_CREATE_SESSION: "Could not create session";
    readonly ANONYMOUS_USERS_CANNOT_SIGN_IN_AGAIN_ANONYMOUSLY: "Anonymous users cannot sign in again anonymously";
  };
};
//#endregion
export { anonymous };
//# sourceMappingURL=index.d.mts.map