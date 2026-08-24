import { emailOTP } from "./index.mjs";

//#region src/plugins/email-otp/client.d.ts
declare const emailOTPClient: () => {
  id: "email-otp";
  $InferServerPlugin: ReturnType<typeof emailOTP>;
  atomListeners: {
    matcher: (path: string) => path is "/email-otp/verify-email" | "/sign-in/email-otp";
    signal: "$sessionSignal";
  }[];
};
//#endregion
export { emailOTPClient };
//# sourceMappingURL=client.d.mts.map