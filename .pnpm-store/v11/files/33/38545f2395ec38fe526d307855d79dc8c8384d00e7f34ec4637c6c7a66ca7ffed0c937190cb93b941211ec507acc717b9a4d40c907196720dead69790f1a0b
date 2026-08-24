import { InferUser } from "../../types/models.mjs";
import "../../types/index.mjs";
import { BetterAuthOptions } from "@better-auth/core";
import * as z from "zod";
import * as better_call946 from "better-call";

//#region src/api/routes/sign-in.d.ts
declare const socialSignInBodySchema: z.ZodObject<{
  callbackURL: z.ZodOptional<z.ZodString>;
  newUserCallbackURL: z.ZodOptional<z.ZodString>;
  errorCallbackURL: z.ZodOptional<z.ZodString>;
  provider: z.ZodType<"github" | "apple" | "atlassian" | "cognito" | "discord" | "facebook" | "figma" | "microsoft" | "google" | "huggingface" | "slack" | "spotify" | "twitch" | "twitter" | "dropbox" | "kick" | "linear" | "linkedin" | "gitlab" | "tiktok" | "reddit" | "roblox" | "salesforce" | "vk" | "zoom" | "notion" | "kakao" | "naver" | "line" | "paybin" | "paypal" | "polar" | "vercel" | (string & {}), unknown, z.core.$ZodTypeInternals<"github" | "apple" | "atlassian" | "cognito" | "discord" | "facebook" | "figma" | "microsoft" | "google" | "huggingface" | "slack" | "spotify" | "twitch" | "twitter" | "dropbox" | "kick" | "linear" | "linkedin" | "gitlab" | "tiktok" | "reddit" | "roblox" | "salesforce" | "vk" | "zoom" | "notion" | "kakao" | "naver" | "line" | "paybin" | "paypal" | "polar" | "vercel" | (string & {}), unknown>>;
  disableRedirect: z.ZodOptional<z.ZodBoolean>;
  idToken: z.ZodOptional<z.ZodObject<{
    token: z.ZodString;
    nonce: z.ZodOptional<z.ZodString>;
    accessToken: z.ZodOptional<z.ZodString>;
    refreshToken: z.ZodOptional<z.ZodString>;
    expiresAt: z.ZodOptional<z.ZodNumber>;
  }, z.core.$strip>>;
  scopes: z.ZodOptional<z.ZodArray<z.ZodString>>;
  requestSignUp: z.ZodOptional<z.ZodBoolean>;
  loginHint: z.ZodOptional<z.ZodString>;
  additionalData: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
}, z.core.$strip>;
declare const signInSocial: <O extends BetterAuthOptions>() => better_call946.StrictEndpoint<"/sign-in/social", {
  method: "POST";
  operationId: string;
  body: z.ZodObject<{
    callbackURL: z.ZodOptional<z.ZodString>;
    newUserCallbackURL: z.ZodOptional<z.ZodString>;
    errorCallbackURL: z.ZodOptional<z.ZodString>;
    provider: z.ZodType<"github" | "apple" | "atlassian" | "cognito" | "discord" | "facebook" | "figma" | "microsoft" | "google" | "huggingface" | "slack" | "spotify" | "twitch" | "twitter" | "dropbox" | "kick" | "linear" | "linkedin" | "gitlab" | "tiktok" | "reddit" | "roblox" | "salesforce" | "vk" | "zoom" | "notion" | "kakao" | "naver" | "line" | "paybin" | "paypal" | "polar" | "vercel" | (string & {}), unknown, z.core.$ZodTypeInternals<"github" | "apple" | "atlassian" | "cognito" | "discord" | "facebook" | "figma" | "microsoft" | "google" | "huggingface" | "slack" | "spotify" | "twitch" | "twitter" | "dropbox" | "kick" | "linear" | "linkedin" | "gitlab" | "tiktok" | "reddit" | "roblox" | "salesforce" | "vk" | "zoom" | "notion" | "kakao" | "naver" | "line" | "paybin" | "paypal" | "polar" | "vercel" | (string & {}), unknown>>;
    disableRedirect: z.ZodOptional<z.ZodBoolean>;
    idToken: z.ZodOptional<z.ZodObject<{
      token: z.ZodString;
      nonce: z.ZodOptional<z.ZodString>;
      accessToken: z.ZodOptional<z.ZodString>;
      refreshToken: z.ZodOptional<z.ZodString>;
      expiresAt: z.ZodOptional<z.ZodNumber>;
    }, z.core.$strip>>;
    scopes: z.ZodOptional<z.ZodArray<z.ZodString>>;
    requestSignUp: z.ZodOptional<z.ZodBoolean>;
    loginHint: z.ZodOptional<z.ZodString>;
    additionalData: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
  }, z.core.$strip>;
  metadata: {
    $Infer: {
      body: z.infer<typeof socialSignInBodySchema>;
      returned: {
        redirect: boolean;
        token?: string | undefined;
        url?: string | undefined;
        user?: InferUser<O> | undefined;
      };
    };
    openapi: {
      description: string;
      operationId: string;
      responses: {
        "200": {
          description: string;
          content: {
            "application/json": {
              schema: {
                type: "object";
                description: string;
                properties: {
                  token: {
                    type: string;
                  };
                  user: {
                    type: string;
                    $ref: string;
                  };
                  url: {
                    type: string;
                  };
                  redirect: {
                    type: string;
                    enum: boolean[];
                  };
                };
                required: string[];
              };
            };
          };
        };
      };
    };
  };
}, {
  redirect: boolean;
  url: string;
} | {
  redirect: boolean;
  token: string;
  url: undefined;
  user: InferUser<O>;
}>;
declare const signInEmail: <O extends BetterAuthOptions>() => better_call946.StrictEndpoint<"/sign-in/email", {
  method: "POST";
  operationId: string;
  use: ((inputContext: better_call946.MiddlewareInputContext<better_call946.MiddlewareOptions>) => Promise<void>)[];
  body: z.ZodObject<{
    email: z.ZodString;
    password: z.ZodString;
    callbackURL: z.ZodOptional<z.ZodString>;
    rememberMe: z.ZodOptional<z.ZodDefault<z.ZodBoolean>>;
  }, z.core.$strip>;
  metadata: {
    allowedMediaTypes: string[];
    $Infer: {
      body: {
        email: string;
        password: string;
        callbackURL?: string | undefined;
        rememberMe?: boolean | undefined;
      };
      returned: {
        redirect: boolean;
        token: string;
        url?: string | undefined;
        user: InferUser<O>;
      };
    };
    openapi: {
      operationId: string;
      description: string;
      responses: {
        "200": {
          description: string;
          content: {
            "application/json": {
              schema: {
                type: "object";
                description: string;
                properties: {
                  redirect: {
                    type: string;
                    enum: boolean[];
                  };
                  token: {
                    type: string;
                    description: string;
                  };
                  url: {
                    type: string;
                    nullable: boolean;
                  };
                  user: {
                    type: string;
                    $ref: string;
                  };
                };
                required: string[];
              };
            };
          };
        };
      };
    };
  };
}, {
  redirect: boolean;
  token: string;
  url?: string | undefined;
  user: InferUser<O>;
}>;
//#endregion
export { signInEmail, signInSocial };
//# sourceMappingURL=sign-in.d.mts.map