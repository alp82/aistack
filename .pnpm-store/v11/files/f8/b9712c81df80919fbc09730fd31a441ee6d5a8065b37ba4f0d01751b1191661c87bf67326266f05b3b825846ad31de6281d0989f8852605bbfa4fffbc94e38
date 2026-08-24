import { Providers } from "./constants.mjs";

//#region src/plugins/captcha/types.d.ts
interface BaseCaptchaOptions {
  secretKey: string;
  endpoints?: string[] | undefined;
  siteVerifyURLOverride?: string | undefined;
}
interface GoogleRecaptchaOptions extends BaseCaptchaOptions {
  provider: typeof Providers.GOOGLE_RECAPTCHA;
  minScore?: number | undefined;
}
interface CloudflareTurnstileOptions extends BaseCaptchaOptions {
  provider: typeof Providers.CLOUDFLARE_TURNSTILE;
}
interface HCaptchaOptions extends BaseCaptchaOptions {
  provider: typeof Providers.HCAPTCHA;
  siteKey?: string | undefined;
}
interface CaptchaFoxOptions extends BaseCaptchaOptions {
  provider: typeof Providers.CAPTCHAFOX;
  siteKey?: string | undefined;
}
type CaptchaOptions = GoogleRecaptchaOptions | CloudflareTurnstileOptions | HCaptchaOptions | CaptchaFoxOptions;
//#endregion
export { CaptchaOptions };
//# sourceMappingURL=types.d.mts.map