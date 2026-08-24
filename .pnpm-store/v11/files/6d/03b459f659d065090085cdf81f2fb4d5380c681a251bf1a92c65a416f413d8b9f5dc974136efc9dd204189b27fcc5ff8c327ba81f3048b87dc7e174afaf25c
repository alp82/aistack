import * as z from "zod";
import * as better_call135 from "better-call";

//#region src/plugins/one-tap/index.d.ts
interface OneTapOptions {
  /**
   * Disable the signup flow
   *
   * @default false
   */
  disableSignup?: boolean | undefined;
  /**
   * Google Client ID
   *
   * If a client ID is provided in the social provider configuration,
   * it will be used.
   */
  clientId?: string | undefined;
}
declare const oneTap: (options?: OneTapOptions | undefined) => {
  id: "one-tap";
  endpoints: {
    oneTapCallback: better_call135.StrictEndpoint<"/one-tap/callback", {
      method: "POST";
      body: z.ZodObject<{
        idToken: z.ZodString;
      }, z.core.$strip>;
      metadata: {
        openapi: {
          summary: string;
          description: string;
          responses: {
            200: {
              description: string;
              content: {
                "application/json": {
                  schema: {
                    type: "object";
                    properties: {
                      session: {
                        $ref: string;
                      };
                      user: {
                        $ref: string;
                      };
                    };
                  };
                };
              };
            };
            400: {
              description: string;
            };
          };
        };
      };
    }, {
      error: string;
    } | {
      token: string;
      user: {
        id: string;
        email: string;
        emailVerified: boolean;
        name: string;
        image: string | null | undefined;
        createdAt: Date;
        updatedAt: Date;
      };
    }>;
  };
  options: OneTapOptions | undefined;
};
//#endregion
export { OneTapOptions, oneTap };
//# sourceMappingURL=index.d.mts.map