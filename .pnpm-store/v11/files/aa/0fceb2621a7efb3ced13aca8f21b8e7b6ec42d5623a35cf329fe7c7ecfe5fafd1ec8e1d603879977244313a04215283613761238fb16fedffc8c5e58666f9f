import { anonymous, bearer, emailOTP, genericOAuth, jwt, magicLink, oidcProvider, oneTap, oneTimeToken, phoneNumber, twoFactor, username, } from "better-auth/plugins";
import { passkey } from "@better-auth/passkey";
import { convex } from "./plugins/convex/index.js";
import { convexAdapter } from "./client/adapter.js";
// This is the config used to generate the schema
export const options = {
    database: convexAdapter({}, {}),
    rateLimit: {
        storage: "database",
    },
    plugins: [
        twoFactor(),
        anonymous(),
        username(),
        phoneNumber(),
        magicLink({ sendMagicLink: async () => { } }),
        emailOTP({ sendVerificationOTP: async () => { } }),
        passkey(),
        genericOAuth({
            config: [
                {
                    clientId: "",
                    clientSecret: "",
                    providerId: "",
                },
            ],
        }),
        oneTap(),
        oidcProvider({
            loginPage: "/login",
        }),
        bearer(),
        oneTimeToken(),
        jwt(),
        convex({
            authConfig: { providers: [{ applicationID: "convex", domain: "" }] },
        }),
    ],
}; // assert type to avoid overloading ts compiler
//# sourceMappingURL=auth-options.js.map