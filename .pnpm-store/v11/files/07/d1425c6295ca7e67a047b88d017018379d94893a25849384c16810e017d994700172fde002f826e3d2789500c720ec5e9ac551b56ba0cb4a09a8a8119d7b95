//#region src/api/middlewares/oauth.d.ts
type OAuthState = {
  callbackURL: string;
  codeVerifier: string;
  errorURL?: string;
  newUserURL?: string;
  link?: {
    email: string;
    userId: string;
  };
  expiresAt: number;
  requestSignUp?: boolean;
  [key: string]: any;
};
declare const getOAuthState: () => Promise<OAuthState | null>, setOAuthState: (value: OAuthState | null) => Promise<void>;
//#endregion
export { getOAuthState };
//# sourceMappingURL=oauth.d.mts.map