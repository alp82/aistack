import { GenericEndpointContext } from "@better-auth/core";

//#region src/oauth2/state.d.ts
declare function generateState(c: GenericEndpointContext, link: {
  email: string;
  userId: string;
} | undefined, additionalData: Record<string, any> | false | undefined): Promise<{
  state: string;
  codeVerifier: string;
}>;
declare function parseState(c: GenericEndpointContext): Promise<{
  [x: string]: unknown;
  callbackURL: string;
  codeVerifier: string;
  expiresAt: number;
  errorURL?: string | undefined;
  newUserURL?: string | undefined;
  link?: {
    email: string;
    userId: string;
  } | undefined;
  requestSignUp?: boolean | undefined;
  state?: string | undefined;
}>;
//#endregion
export { generateState, parseState };
//# sourceMappingURL=state.d.mts.map