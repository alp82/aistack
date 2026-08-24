import { InferOptionSchema } from "../../types/plugins.mjs";
import "../../types/index.mjs";
import { schema } from "./schema.mjs";
import { ENSLookupArgs, ENSLookupResult, SIWEVerifyMessageArgs } from "./types.mjs";
import * as z from "zod";
import * as better_call207 from "better-call";

//#region src/plugins/siwe/index.d.ts
interface SIWEPluginOptions {
  domain: string;
  emailDomainName?: string | undefined;
  anonymous?: boolean | undefined;
  getNonce: () => Promise<string>;
  verifyMessage: (args: SIWEVerifyMessageArgs) => Promise<boolean>;
  ensLookup?: ((args: ENSLookupArgs) => Promise<ENSLookupResult>) | undefined;
  schema?: InferOptionSchema<typeof schema> | undefined;
}
declare const siwe: (options: SIWEPluginOptions) => {
  id: "siwe";
  schema: {
    walletAddress: {
      fields: {
        userId: {
          type: "string";
          references: {
            model: string;
            field: string;
          };
          required: true;
          index: true;
        };
        address: {
          type: "string";
          required: true;
        };
        chainId: {
          type: "number";
          required: true;
        };
        isPrimary: {
          type: "boolean";
          defaultValue: false;
        };
        createdAt: {
          type: "date";
          required: true;
        };
      };
    };
  };
  endpoints: {
    getSiweNonce: better_call207.StrictEndpoint<"/siwe/nonce", {
      method: "POST";
      body: z.ZodObject<{
        walletAddress: z.ZodString;
        chainId: z.ZodDefault<z.ZodOptional<z.ZodNumber>>;
      }, z.core.$strip>;
    }, {
      nonce: string;
    }>;
    verifySiweMessage: better_call207.StrictEndpoint<"/siwe/verify", {
      method: "POST";
      body: z.ZodObject<{
        message: z.ZodString;
        signature: z.ZodString;
        walletAddress: z.ZodString;
        chainId: z.ZodDefault<z.ZodOptional<z.ZodNumber>>;
        email: z.ZodOptional<z.ZodEmail>;
      }, z.core.$strip>;
      requireRequest: true;
    }, {
      token: string;
      success: boolean;
      user: {
        id: string;
        walletAddress: string;
        chainId: number;
      };
    }>;
  };
  options: SIWEPluginOptions;
};
//#endregion
export { SIWEPluginOptions, siwe };
//# sourceMappingURL=index.d.mts.map