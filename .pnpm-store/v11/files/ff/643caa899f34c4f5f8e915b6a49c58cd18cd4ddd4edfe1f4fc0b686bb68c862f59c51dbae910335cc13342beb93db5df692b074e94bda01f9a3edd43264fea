import { BackupCodeOptions, backupCode2fa, generateBackupCodes, getBackupCodes, verifyBackupCode } from "./backup-codes/index.mjs";
import { OTPOptions, otp2fa } from "./otp/index.mjs";
import { TOTPOptions, totp2fa } from "./totp/index.mjs";
import { TwoFactorOptions, TwoFactorProvider, TwoFactorTable, UserWithTwoFactor } from "./types.mjs";
import { twoFactor } from "./index.mjs";
import * as _better_fetch_fetch79 from "@better-fetch/fetch";

//#region src/plugins/two-factor/client.d.ts
declare const twoFactorClient: (options?: {
  /**
   * a redirect function to call if a user needs to verify
   * their two factor
   */
  onTwoFactorRedirect?: () => void | Promise<void>;
} | undefined) => {
  id: "two-factor";
  $InferServerPlugin: ReturnType<typeof twoFactor>;
  atomListeners: {
    matcher: (path: string) => boolean;
    signal: "$sessionSignal";
  }[];
  pathMethods: {
    "/two-factor/disable": "POST";
    "/two-factor/enable": "POST";
    "/two-factor/send-otp": "POST";
    "/two-factor/generate-backup-codes": "POST";
  };
  fetchPlugins: {
    id: string;
    name: string;
    hooks: {
      onSuccess(context: _better_fetch_fetch79.SuccessContext<any>): Promise<void>;
    };
  }[];
};
//#endregion
export { twoFactorClient };
//# sourceMappingURL=client.d.mts.map