import { Account, User } from "../types/models.mjs";
import "../types/index.mjs";
import { GenericEndpointContext } from "@better-auth/core";

//#region src/oauth2/link-account.d.ts
declare function handleOAuthUserInfo(c: GenericEndpointContext, opts: {
  userInfo: Omit<User, "createdAt" | "updatedAt">;
  account: Omit<Account, "id" | "userId" | "createdAt" | "updatedAt">;
  callbackURL?: string | undefined;
  disableSignUp?: boolean | undefined;
  overrideUserInfo?: boolean | undefined;
  isTrustedProvider?: boolean | undefined;
}): Promise<{
  error: string;
  data: null;
  isRegister?: undefined;
} | {
  error: string;
  data: null;
  isRegister: boolean;
} | {
  data: {
    session: {
      id: string;
      createdAt: Date;
      updatedAt: Date;
      userId: string;
      expiresAt: Date;
      token: string;
      ipAddress?: string | null | undefined;
      userAgent?: string | null | undefined;
    };
    user: {
      id: string;
      createdAt: Date;
      updatedAt: Date;
      email: string;
      emailVerified: boolean;
      name: string;
      image?: string | null | undefined;
    };
  };
  error: null;
  isRegister: boolean;
}>;
//#endregion
export { handleOAuthUserInfo };
//# sourceMappingURL=link-account.d.mts.map