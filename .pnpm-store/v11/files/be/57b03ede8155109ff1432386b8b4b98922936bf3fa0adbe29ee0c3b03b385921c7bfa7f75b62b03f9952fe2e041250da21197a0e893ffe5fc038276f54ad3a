import { User } from "../../types/models.mjs";
import { InferOptionSchema } from "../../types/plugins.mjs";
import "../../types/index.mjs";
import { BackupCodeOptions } from "./backup-codes/index.mjs";
import { OTPOptions } from "./otp/index.mjs";
import { schema } from "./schema.mjs";
import { TOTPOptions } from "./totp/index.mjs";
import { BetterAuthPlugin, LiteralString } from "@better-auth/core";

//#region src/plugins/two-factor/types.d.ts
interface TwoFactorOptions {
  /**
   * Application Name
   */
  issuer?: string | undefined;
  /**
   * TOTP OPtions
   */
  totpOptions?: Omit<TOTPOptions, "issuer"> | undefined;
  /**
   * OTP Options
   */
  otpOptions?: OTPOptions | undefined;
  /**
   * Backup code options
   */
  backupCodeOptions?: BackupCodeOptions | undefined;
  /**
   * Skip verification on enabling two factor authentication.
   * @default false
   */
  skipVerificationOnEnable?: boolean | undefined;
  /**
   * Custom schema for the two factor plugin
   */
  schema?: InferOptionSchema<typeof schema> | undefined;
}
interface UserWithTwoFactor extends User {
  /**
   * If the user has enabled two factor authentication.
   */
  twoFactorEnabled: boolean;
}
interface TwoFactorProvider {
  id: LiteralString;
  endpoints?: BetterAuthPlugin["endpoints"] | undefined;
}
interface TwoFactorTable {
  userId: string;
  secret: string;
  backupCodes: string;
  enabled: boolean;
}
//#endregion
export { TwoFactorOptions, TwoFactorProvider, TwoFactorTable, UserWithTwoFactor };
//# sourceMappingURL=types.d.mts.map