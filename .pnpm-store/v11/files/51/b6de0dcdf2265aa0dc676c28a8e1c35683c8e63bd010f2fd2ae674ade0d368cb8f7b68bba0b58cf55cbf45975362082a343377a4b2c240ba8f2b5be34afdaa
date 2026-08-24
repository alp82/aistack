import { PhoneNumberOptions, UserWithPhoneNumber } from "./types.mjs";
import { phoneNumber } from "./index.mjs";

//#region src/plugins/phone-number/client.d.ts
declare const phoneNumberClient: () => {
  id: "phoneNumber";
  $InferServerPlugin: ReturnType<typeof phoneNumber>;
  atomListeners: {
    matcher(path: string): path is "/phone-number/verify" | "/sign-in/phone-number" | "/phone-number/update";
    signal: "$sessionSignal";
  }[];
};
//#endregion
export { phoneNumberClient };
//# sourceMappingURL=client.d.mts.map