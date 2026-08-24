//#region src/plugins/captcha/constants.ts
const defaultEndpoints = [
	"/sign-up/email",
	"/sign-in/email",
	"/request-password-reset"
];
const Providers = {
	CLOUDFLARE_TURNSTILE: "cloudflare-turnstile",
	GOOGLE_RECAPTCHA: "google-recaptcha",
	HCAPTCHA: "hcaptcha",
	CAPTCHAFOX: "captchafox"
};
const siteVerifyMap = {
	[Providers.CLOUDFLARE_TURNSTILE]: "https://challenges.cloudflare.com/turnstile/v0/siteverify",
	[Providers.GOOGLE_RECAPTCHA]: "https://www.google.com/recaptcha/api/siteverify",
	[Providers.HCAPTCHA]: "https://api.hcaptcha.com/siteverify",
	[Providers.CAPTCHAFOX]: "https://api.captchafox.com/siteverify"
};

//#endregion
export { Providers, defaultEndpoints, siteVerifyMap };
//# sourceMappingURL=constants.mjs.map