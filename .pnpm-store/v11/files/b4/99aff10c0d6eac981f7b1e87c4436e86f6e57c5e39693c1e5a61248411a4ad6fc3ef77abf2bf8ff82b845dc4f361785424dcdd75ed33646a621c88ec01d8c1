export declare const tables: {
    user: import("convex/server").TableDefinition<import("convex/values").VObject<{
        image?: string | null | undefined;
        userId?: string | null | undefined;
        twoFactorEnabled?: boolean | null | undefined;
        isAnonymous?: boolean | null | undefined;
        username?: string | null | undefined;
        displayUsername?: string | null | undefined;
        phoneNumber?: string | null | undefined;
        phoneNumberVerified?: boolean | null | undefined;
        createdAt: number;
        updatedAt: number;
        email: string;
        emailVerified: boolean;
        name: string;
    }, {
        name: import("convex/values").VString<string, "required">;
        email: import("convex/values").VString<string, "required">;
        emailVerified: import("convex/values").VBoolean<boolean, "required">;
        image: import("convex/values").VUnion<string | null | undefined, [import("convex/values").VNull<null, "required">, import("convex/values").VString<string, "required">], "optional", never>;
        createdAt: import("convex/values").VFloat64<number, "required">;
        updatedAt: import("convex/values").VFloat64<number, "required">;
        twoFactorEnabled: import("convex/values").VUnion<boolean | null | undefined, [import("convex/values").VNull<null, "required">, import("convex/values").VBoolean<boolean, "required">], "optional", never>;
        isAnonymous: import("convex/values").VUnion<boolean | null | undefined, [import("convex/values").VNull<null, "required">, import("convex/values").VBoolean<boolean, "required">], "optional", never>;
        username: import("convex/values").VUnion<string | null | undefined, [import("convex/values").VNull<null, "required">, import("convex/values").VString<string, "required">], "optional", never>;
        displayUsername: import("convex/values").VUnion<string | null | undefined, [import("convex/values").VNull<null, "required">, import("convex/values").VString<string, "required">], "optional", never>;
        phoneNumber: import("convex/values").VUnion<string | null | undefined, [import("convex/values").VNull<null, "required">, import("convex/values").VString<string, "required">], "optional", never>;
        phoneNumberVerified: import("convex/values").VUnion<boolean | null | undefined, [import("convex/values").VNull<null, "required">, import("convex/values").VBoolean<boolean, "required">], "optional", never>;
        userId: import("convex/values").VUnion<string | null | undefined, [import("convex/values").VNull<null, "required">, import("convex/values").VString<string, "required">], "optional", never>;
    }, "required", "createdAt" | "updatedAt" | "email" | "emailVerified" | "name" | "image" | "userId" | "twoFactorEnabled" | "isAnonymous" | "username" | "displayUsername" | "phoneNumber" | "phoneNumberVerified">, {
        email_name: ["email", "name", "_creationTime"];
        name: ["name", "_creationTime"];
        userId: ["userId", "_creationTime"];
        username: ["username", "_creationTime"];
        phoneNumber: ["phoneNumber", "_creationTime"];
    }, {}, {}>;
    session: import("convex/server").TableDefinition<import("convex/values").VObject<{
        ipAddress?: string | null | undefined;
        userAgent?: string | null | undefined;
        createdAt: number;
        updatedAt: number;
        userId: string;
        expiresAt: number;
        token: string;
    }, {
        expiresAt: import("convex/values").VFloat64<number, "required">;
        token: import("convex/values").VString<string, "required">;
        createdAt: import("convex/values").VFloat64<number, "required">;
        updatedAt: import("convex/values").VFloat64<number, "required">;
        ipAddress: import("convex/values").VUnion<string | null | undefined, [import("convex/values").VNull<null, "required">, import("convex/values").VString<string, "required">], "optional", never>;
        userAgent: import("convex/values").VUnion<string | null | undefined, [import("convex/values").VNull<null, "required">, import("convex/values").VString<string, "required">], "optional", never>;
        userId: import("convex/values").VString<string, "required">;
    }, "required", "createdAt" | "updatedAt" | "userId" | "expiresAt" | "token" | "ipAddress" | "userAgent">, {
        expiresAt: ["expiresAt", "_creationTime"];
        expiresAt_userId: ["expiresAt", "userId", "_creationTime"];
        token: ["token", "_creationTime"];
        userId: ["userId", "_creationTime"];
    }, {}, {}>;
    account: import("convex/server").TableDefinition<import("convex/values").VObject<{
        password?: string | null | undefined;
        accessToken?: string | null | undefined;
        refreshToken?: string | null | undefined;
        idToken?: string | null | undefined;
        accessTokenExpiresAt?: number | null | undefined;
        refreshTokenExpiresAt?: number | null | undefined;
        scope?: string | null | undefined;
        createdAt: number;
        updatedAt: number;
        userId: string;
        accountId: string;
        providerId: string;
    }, {
        accountId: import("convex/values").VString<string, "required">;
        providerId: import("convex/values").VString<string, "required">;
        userId: import("convex/values").VString<string, "required">;
        accessToken: import("convex/values").VUnion<string | null | undefined, [import("convex/values").VNull<null, "required">, import("convex/values").VString<string, "required">], "optional", never>;
        refreshToken: import("convex/values").VUnion<string | null | undefined, [import("convex/values").VNull<null, "required">, import("convex/values").VString<string, "required">], "optional", never>;
        idToken: import("convex/values").VUnion<string | null | undefined, [import("convex/values").VNull<null, "required">, import("convex/values").VString<string, "required">], "optional", never>;
        accessTokenExpiresAt: import("convex/values").VUnion<number | null | undefined, [import("convex/values").VNull<null, "required">, import("convex/values").VFloat64<number, "required">], "optional", never>;
        refreshTokenExpiresAt: import("convex/values").VUnion<number | null | undefined, [import("convex/values").VNull<null, "required">, import("convex/values").VFloat64<number, "required">], "optional", never>;
        scope: import("convex/values").VUnion<string | null | undefined, [import("convex/values").VNull<null, "required">, import("convex/values").VString<string, "required">], "optional", never>;
        password: import("convex/values").VUnion<string | null | undefined, [import("convex/values").VNull<null, "required">, import("convex/values").VString<string, "required">], "optional", never>;
        createdAt: import("convex/values").VFloat64<number, "required">;
        updatedAt: import("convex/values").VFloat64<number, "required">;
    }, "required", "createdAt" | "updatedAt" | "userId" | "password" | "accountId" | "providerId" | "accessToken" | "refreshToken" | "idToken" | "accessTokenExpiresAt" | "refreshTokenExpiresAt" | "scope">, {
        accountId: ["accountId", "_creationTime"];
        accountId_providerId: ["accountId", "providerId", "_creationTime"];
        providerId_userId: ["providerId", "userId", "_creationTime"];
        userId: ["userId", "_creationTime"];
    }, {}, {}>;
    verification: import("convex/server").TableDefinition<import("convex/values").VObject<{
        createdAt: number;
        updatedAt: number;
        expiresAt: number;
        value: string;
        identifier: string;
    }, {
        identifier: import("convex/values").VString<string, "required">;
        value: import("convex/values").VString<string, "required">;
        expiresAt: import("convex/values").VFloat64<number, "required">;
        createdAt: import("convex/values").VFloat64<number, "required">;
        updatedAt: import("convex/values").VFloat64<number, "required">;
    }, "required", "createdAt" | "updatedAt" | "expiresAt" | "value" | "identifier">, {
        expiresAt: ["expiresAt", "_creationTime"];
        identifier: ["identifier", "_creationTime"];
    }, {}, {}>;
    twoFactor: import("convex/server").TableDefinition<import("convex/values").VObject<{
        userId: string;
        secret: string;
        backupCodes: string;
    }, {
        secret: import("convex/values").VString<string, "required">;
        backupCodes: import("convex/values").VString<string, "required">;
        userId: import("convex/values").VString<string, "required">;
    }, "required", "userId" | "secret" | "backupCodes">, {
        userId: ["userId", "_creationTime"];
    }, {}, {}>;
    passkey: import("convex/server").TableDefinition<import("convex/values").VObject<{
        createdAt?: number | null | undefined;
        name?: string | null | undefined;
        transports?: string | null | undefined;
        aaguid?: string | null | undefined;
        userId: string;
        publicKey: string;
        credentialID: string;
        counter: number;
        deviceType: string;
        backedUp: boolean;
    }, {
        name: import("convex/values").VUnion<string | null | undefined, [import("convex/values").VNull<null, "required">, import("convex/values").VString<string, "required">], "optional", never>;
        publicKey: import("convex/values").VString<string, "required">;
        userId: import("convex/values").VString<string, "required">;
        credentialID: import("convex/values").VString<string, "required">;
        counter: import("convex/values").VFloat64<number, "required">;
        deviceType: import("convex/values").VString<string, "required">;
        backedUp: import("convex/values").VBoolean<boolean, "required">;
        transports: import("convex/values").VUnion<string | null | undefined, [import("convex/values").VNull<null, "required">, import("convex/values").VString<string, "required">], "optional", never>;
        createdAt: import("convex/values").VUnion<number | null | undefined, [import("convex/values").VNull<null, "required">, import("convex/values").VFloat64<number, "required">], "optional", never>;
        aaguid: import("convex/values").VUnion<string | null | undefined, [import("convex/values").VNull<null, "required">, import("convex/values").VString<string, "required">], "optional", never>;
    }, "required", "createdAt" | "name" | "userId" | "publicKey" | "credentialID" | "counter" | "deviceType" | "backedUp" | "transports" | "aaguid">, {
        credentialID: ["credentialID", "_creationTime"];
        userId: ["userId", "_creationTime"];
    }, {}, {}>;
    oauthApplication: import("convex/server").TableDefinition<import("convex/values").VObject<{
        type?: string | null | undefined;
        createdAt?: number | null | undefined;
        updatedAt?: number | null | undefined;
        name?: string | null | undefined;
        userId?: string | null | undefined;
        metadata?: string | null | undefined;
        icon?: string | null | undefined;
        clientId?: string | null | undefined;
        clientSecret?: string | null | undefined;
        redirectURLs?: string | null | undefined;
        disabled?: boolean | null | undefined;
    }, {
        name: import("convex/values").VUnion<string | null | undefined, [import("convex/values").VNull<null, "required">, import("convex/values").VString<string, "required">], "optional", never>;
        icon: import("convex/values").VUnion<string | null | undefined, [import("convex/values").VNull<null, "required">, import("convex/values").VString<string, "required">], "optional", never>;
        metadata: import("convex/values").VUnion<string | null | undefined, [import("convex/values").VNull<null, "required">, import("convex/values").VString<string, "required">], "optional", never>;
        clientId: import("convex/values").VUnion<string | null | undefined, [import("convex/values").VNull<null, "required">, import("convex/values").VString<string, "required">], "optional", never>;
        clientSecret: import("convex/values").VUnion<string | null | undefined, [import("convex/values").VNull<null, "required">, import("convex/values").VString<string, "required">], "optional", never>;
        redirectURLs: import("convex/values").VUnion<string | null | undefined, [import("convex/values").VNull<null, "required">, import("convex/values").VString<string, "required">], "optional", never>;
        type: import("convex/values").VUnion<string | null | undefined, [import("convex/values").VNull<null, "required">, import("convex/values").VString<string, "required">], "optional", never>;
        disabled: import("convex/values").VUnion<boolean | null | undefined, [import("convex/values").VNull<null, "required">, import("convex/values").VBoolean<boolean, "required">], "optional", never>;
        userId: import("convex/values").VUnion<string | null | undefined, [import("convex/values").VNull<null, "required">, import("convex/values").VString<string, "required">], "optional", never>;
        createdAt: import("convex/values").VUnion<number | null | undefined, [import("convex/values").VNull<null, "required">, import("convex/values").VFloat64<number, "required">], "optional", never>;
        updatedAt: import("convex/values").VUnion<number | null | undefined, [import("convex/values").VNull<null, "required">, import("convex/values").VFloat64<number, "required">], "optional", never>;
    }, "required", "type" | "createdAt" | "updatedAt" | "name" | "userId" | "metadata" | "icon" | "clientId" | "clientSecret" | "redirectURLs" | "disabled">, {
        clientId: ["clientId", "_creationTime"];
        userId: ["userId", "_creationTime"];
    }, {}, {}>;
    oauthAccessToken: import("convex/server").TableDefinition<import("convex/values").VObject<{
        createdAt?: number | null | undefined;
        updatedAt?: number | null | undefined;
        userId?: string | null | undefined;
        accessToken?: string | null | undefined;
        refreshToken?: string | null | undefined;
        accessTokenExpiresAt?: number | null | undefined;
        refreshTokenExpiresAt?: number | null | undefined;
        clientId?: string | null | undefined;
        scopes?: string | null | undefined;
    }, {
        accessToken: import("convex/values").VUnion<string | null | undefined, [import("convex/values").VNull<null, "required">, import("convex/values").VString<string, "required">], "optional", never>;
        refreshToken: import("convex/values").VUnion<string | null | undefined, [import("convex/values").VNull<null, "required">, import("convex/values").VString<string, "required">], "optional", never>;
        accessTokenExpiresAt: import("convex/values").VUnion<number | null | undefined, [import("convex/values").VNull<null, "required">, import("convex/values").VFloat64<number, "required">], "optional", never>;
        refreshTokenExpiresAt: import("convex/values").VUnion<number | null | undefined, [import("convex/values").VNull<null, "required">, import("convex/values").VFloat64<number, "required">], "optional", never>;
        clientId: import("convex/values").VUnion<string | null | undefined, [import("convex/values").VNull<null, "required">, import("convex/values").VString<string, "required">], "optional", never>;
        userId: import("convex/values").VUnion<string | null | undefined, [import("convex/values").VNull<null, "required">, import("convex/values").VString<string, "required">], "optional", never>;
        scopes: import("convex/values").VUnion<string | null | undefined, [import("convex/values").VNull<null, "required">, import("convex/values").VString<string, "required">], "optional", never>;
        createdAt: import("convex/values").VUnion<number | null | undefined, [import("convex/values").VNull<null, "required">, import("convex/values").VFloat64<number, "required">], "optional", never>;
        updatedAt: import("convex/values").VUnion<number | null | undefined, [import("convex/values").VNull<null, "required">, import("convex/values").VFloat64<number, "required">], "optional", never>;
    }, "required", "createdAt" | "updatedAt" | "userId" | "accessToken" | "refreshToken" | "accessTokenExpiresAt" | "refreshTokenExpiresAt" | "clientId" | "scopes">, {
        accessToken: ["accessToken", "_creationTime"];
        refreshToken: ["refreshToken", "_creationTime"];
        clientId: ["clientId", "_creationTime"];
        userId: ["userId", "_creationTime"];
    }, {}, {}>;
    oauthConsent: import("convex/server").TableDefinition<import("convex/values").VObject<{
        createdAt?: number | null | undefined;
        updatedAt?: number | null | undefined;
        userId?: string | null | undefined;
        clientId?: string | null | undefined;
        scopes?: string | null | undefined;
        consentGiven?: boolean | null | undefined;
    }, {
        clientId: import("convex/values").VUnion<string | null | undefined, [import("convex/values").VNull<null, "required">, import("convex/values").VString<string, "required">], "optional", never>;
        userId: import("convex/values").VUnion<string | null | undefined, [import("convex/values").VNull<null, "required">, import("convex/values").VString<string, "required">], "optional", never>;
        scopes: import("convex/values").VUnion<string | null | undefined, [import("convex/values").VNull<null, "required">, import("convex/values").VString<string, "required">], "optional", never>;
        createdAt: import("convex/values").VUnion<number | null | undefined, [import("convex/values").VNull<null, "required">, import("convex/values").VFloat64<number, "required">], "optional", never>;
        updatedAt: import("convex/values").VUnion<number | null | undefined, [import("convex/values").VNull<null, "required">, import("convex/values").VFloat64<number, "required">], "optional", never>;
        consentGiven: import("convex/values").VUnion<boolean | null | undefined, [import("convex/values").VNull<null, "required">, import("convex/values").VBoolean<boolean, "required">], "optional", never>;
    }, "required", "createdAt" | "updatedAt" | "userId" | "clientId" | "scopes" | "consentGiven">, {
        clientId_userId: ["clientId", "userId", "_creationTime"];
        userId: ["userId", "_creationTime"];
    }, {}, {}>;
    jwks: import("convex/server").TableDefinition<import("convex/values").VObject<{
        createdAt: number;
        publicKey: string;
        privateKey: string;
    }, {
        publicKey: import("convex/values").VString<string, "required">;
        privateKey: import("convex/values").VString<string, "required">;
        createdAt: import("convex/values").VFloat64<number, "required">;
    }, "required", "createdAt" | "publicKey" | "privateKey">, {}, {}, {}>;
    rateLimit: import("convex/server").TableDefinition<import("convex/values").VObject<{
        key?: string | null | undefined;
        count?: number | null | undefined;
        lastRequest?: number | null | undefined;
    }, {
        key: import("convex/values").VUnion<string | null | undefined, [import("convex/values").VNull<null, "required">, import("convex/values").VString<string, "required">], "optional", never>;
        count: import("convex/values").VUnion<number | null | undefined, [import("convex/values").VNull<null, "required">, import("convex/values").VFloat64<number, "required">], "optional", never>;
        lastRequest: import("convex/values").VUnion<number | null | undefined, [import("convex/values").VNull<null, "required">, import("convex/values").VFloat64<number, "required">], "optional", never>;
    }, "required", "key" | "count" | "lastRequest">, {
        key: ["key", "_creationTime"];
    }, {}, {}>;
};
declare const schema: import("convex/server").SchemaDefinition<{
    user: import("convex/server").TableDefinition<import("convex/values").VObject<{
        image?: string | null | undefined;
        userId?: string | null | undefined;
        twoFactorEnabled?: boolean | null | undefined;
        isAnonymous?: boolean | null | undefined;
        username?: string | null | undefined;
        displayUsername?: string | null | undefined;
        phoneNumber?: string | null | undefined;
        phoneNumberVerified?: boolean | null | undefined;
        createdAt: number;
        updatedAt: number;
        email: string;
        emailVerified: boolean;
        name: string;
    }, {
        name: import("convex/values").VString<string, "required">;
        email: import("convex/values").VString<string, "required">;
        emailVerified: import("convex/values").VBoolean<boolean, "required">;
        image: import("convex/values").VUnion<string | null | undefined, [import("convex/values").VNull<null, "required">, import("convex/values").VString<string, "required">], "optional", never>;
        createdAt: import("convex/values").VFloat64<number, "required">;
        updatedAt: import("convex/values").VFloat64<number, "required">;
        twoFactorEnabled: import("convex/values").VUnion<boolean | null | undefined, [import("convex/values").VNull<null, "required">, import("convex/values").VBoolean<boolean, "required">], "optional", never>;
        isAnonymous: import("convex/values").VUnion<boolean | null | undefined, [import("convex/values").VNull<null, "required">, import("convex/values").VBoolean<boolean, "required">], "optional", never>;
        username: import("convex/values").VUnion<string | null | undefined, [import("convex/values").VNull<null, "required">, import("convex/values").VString<string, "required">], "optional", never>;
        displayUsername: import("convex/values").VUnion<string | null | undefined, [import("convex/values").VNull<null, "required">, import("convex/values").VString<string, "required">], "optional", never>;
        phoneNumber: import("convex/values").VUnion<string | null | undefined, [import("convex/values").VNull<null, "required">, import("convex/values").VString<string, "required">], "optional", never>;
        phoneNumberVerified: import("convex/values").VUnion<boolean | null | undefined, [import("convex/values").VNull<null, "required">, import("convex/values").VBoolean<boolean, "required">], "optional", never>;
        userId: import("convex/values").VUnion<string | null | undefined, [import("convex/values").VNull<null, "required">, import("convex/values").VString<string, "required">], "optional", never>;
    }, "required", "createdAt" | "updatedAt" | "email" | "emailVerified" | "name" | "image" | "userId" | "twoFactorEnabled" | "isAnonymous" | "username" | "displayUsername" | "phoneNumber" | "phoneNumberVerified">, {
        email_name: ["email", "name", "_creationTime"];
        name: ["name", "_creationTime"];
        userId: ["userId", "_creationTime"];
        username: ["username", "_creationTime"];
        phoneNumber: ["phoneNumber", "_creationTime"];
    }, {}, {}>;
    session: import("convex/server").TableDefinition<import("convex/values").VObject<{
        ipAddress?: string | null | undefined;
        userAgent?: string | null | undefined;
        createdAt: number;
        updatedAt: number;
        userId: string;
        expiresAt: number;
        token: string;
    }, {
        expiresAt: import("convex/values").VFloat64<number, "required">;
        token: import("convex/values").VString<string, "required">;
        createdAt: import("convex/values").VFloat64<number, "required">;
        updatedAt: import("convex/values").VFloat64<number, "required">;
        ipAddress: import("convex/values").VUnion<string | null | undefined, [import("convex/values").VNull<null, "required">, import("convex/values").VString<string, "required">], "optional", never>;
        userAgent: import("convex/values").VUnion<string | null | undefined, [import("convex/values").VNull<null, "required">, import("convex/values").VString<string, "required">], "optional", never>;
        userId: import("convex/values").VString<string, "required">;
    }, "required", "createdAt" | "updatedAt" | "userId" | "expiresAt" | "token" | "ipAddress" | "userAgent">, {
        expiresAt: ["expiresAt", "_creationTime"];
        expiresAt_userId: ["expiresAt", "userId", "_creationTime"];
        token: ["token", "_creationTime"];
        userId: ["userId", "_creationTime"];
    }, {}, {}>;
    account: import("convex/server").TableDefinition<import("convex/values").VObject<{
        password?: string | null | undefined;
        accessToken?: string | null | undefined;
        refreshToken?: string | null | undefined;
        idToken?: string | null | undefined;
        accessTokenExpiresAt?: number | null | undefined;
        refreshTokenExpiresAt?: number | null | undefined;
        scope?: string | null | undefined;
        createdAt: number;
        updatedAt: number;
        userId: string;
        accountId: string;
        providerId: string;
    }, {
        accountId: import("convex/values").VString<string, "required">;
        providerId: import("convex/values").VString<string, "required">;
        userId: import("convex/values").VString<string, "required">;
        accessToken: import("convex/values").VUnion<string | null | undefined, [import("convex/values").VNull<null, "required">, import("convex/values").VString<string, "required">], "optional", never>;
        refreshToken: import("convex/values").VUnion<string | null | undefined, [import("convex/values").VNull<null, "required">, import("convex/values").VString<string, "required">], "optional", never>;
        idToken: import("convex/values").VUnion<string | null | undefined, [import("convex/values").VNull<null, "required">, import("convex/values").VString<string, "required">], "optional", never>;
        accessTokenExpiresAt: import("convex/values").VUnion<number | null | undefined, [import("convex/values").VNull<null, "required">, import("convex/values").VFloat64<number, "required">], "optional", never>;
        refreshTokenExpiresAt: import("convex/values").VUnion<number | null | undefined, [import("convex/values").VNull<null, "required">, import("convex/values").VFloat64<number, "required">], "optional", never>;
        scope: import("convex/values").VUnion<string | null | undefined, [import("convex/values").VNull<null, "required">, import("convex/values").VString<string, "required">], "optional", never>;
        password: import("convex/values").VUnion<string | null | undefined, [import("convex/values").VNull<null, "required">, import("convex/values").VString<string, "required">], "optional", never>;
        createdAt: import("convex/values").VFloat64<number, "required">;
        updatedAt: import("convex/values").VFloat64<number, "required">;
    }, "required", "createdAt" | "updatedAt" | "userId" | "password" | "accountId" | "providerId" | "accessToken" | "refreshToken" | "idToken" | "accessTokenExpiresAt" | "refreshTokenExpiresAt" | "scope">, {
        accountId: ["accountId", "_creationTime"];
        accountId_providerId: ["accountId", "providerId", "_creationTime"];
        providerId_userId: ["providerId", "userId", "_creationTime"];
        userId: ["userId", "_creationTime"];
    }, {}, {}>;
    verification: import("convex/server").TableDefinition<import("convex/values").VObject<{
        createdAt: number;
        updatedAt: number;
        expiresAt: number;
        value: string;
        identifier: string;
    }, {
        identifier: import("convex/values").VString<string, "required">;
        value: import("convex/values").VString<string, "required">;
        expiresAt: import("convex/values").VFloat64<number, "required">;
        createdAt: import("convex/values").VFloat64<number, "required">;
        updatedAt: import("convex/values").VFloat64<number, "required">;
    }, "required", "createdAt" | "updatedAt" | "expiresAt" | "value" | "identifier">, {
        expiresAt: ["expiresAt", "_creationTime"];
        identifier: ["identifier", "_creationTime"];
    }, {}, {}>;
    twoFactor: import("convex/server").TableDefinition<import("convex/values").VObject<{
        userId: string;
        secret: string;
        backupCodes: string;
    }, {
        secret: import("convex/values").VString<string, "required">;
        backupCodes: import("convex/values").VString<string, "required">;
        userId: import("convex/values").VString<string, "required">;
    }, "required", "userId" | "secret" | "backupCodes">, {
        userId: ["userId", "_creationTime"];
    }, {}, {}>;
    passkey: import("convex/server").TableDefinition<import("convex/values").VObject<{
        createdAt?: number | null | undefined;
        name?: string | null | undefined;
        transports?: string | null | undefined;
        aaguid?: string | null | undefined;
        userId: string;
        publicKey: string;
        credentialID: string;
        counter: number;
        deviceType: string;
        backedUp: boolean;
    }, {
        name: import("convex/values").VUnion<string | null | undefined, [import("convex/values").VNull<null, "required">, import("convex/values").VString<string, "required">], "optional", never>;
        publicKey: import("convex/values").VString<string, "required">;
        userId: import("convex/values").VString<string, "required">;
        credentialID: import("convex/values").VString<string, "required">;
        counter: import("convex/values").VFloat64<number, "required">;
        deviceType: import("convex/values").VString<string, "required">;
        backedUp: import("convex/values").VBoolean<boolean, "required">;
        transports: import("convex/values").VUnion<string | null | undefined, [import("convex/values").VNull<null, "required">, import("convex/values").VString<string, "required">], "optional", never>;
        createdAt: import("convex/values").VUnion<number | null | undefined, [import("convex/values").VNull<null, "required">, import("convex/values").VFloat64<number, "required">], "optional", never>;
        aaguid: import("convex/values").VUnion<string | null | undefined, [import("convex/values").VNull<null, "required">, import("convex/values").VString<string, "required">], "optional", never>;
    }, "required", "createdAt" | "name" | "userId" | "publicKey" | "credentialID" | "counter" | "deviceType" | "backedUp" | "transports" | "aaguid">, {
        credentialID: ["credentialID", "_creationTime"];
        userId: ["userId", "_creationTime"];
    }, {}, {}>;
    oauthApplication: import("convex/server").TableDefinition<import("convex/values").VObject<{
        type?: string | null | undefined;
        createdAt?: number | null | undefined;
        updatedAt?: number | null | undefined;
        name?: string | null | undefined;
        userId?: string | null | undefined;
        metadata?: string | null | undefined;
        icon?: string | null | undefined;
        clientId?: string | null | undefined;
        clientSecret?: string | null | undefined;
        redirectURLs?: string | null | undefined;
        disabled?: boolean | null | undefined;
    }, {
        name: import("convex/values").VUnion<string | null | undefined, [import("convex/values").VNull<null, "required">, import("convex/values").VString<string, "required">], "optional", never>;
        icon: import("convex/values").VUnion<string | null | undefined, [import("convex/values").VNull<null, "required">, import("convex/values").VString<string, "required">], "optional", never>;
        metadata: import("convex/values").VUnion<string | null | undefined, [import("convex/values").VNull<null, "required">, import("convex/values").VString<string, "required">], "optional", never>;
        clientId: import("convex/values").VUnion<string | null | undefined, [import("convex/values").VNull<null, "required">, import("convex/values").VString<string, "required">], "optional", never>;
        clientSecret: import("convex/values").VUnion<string | null | undefined, [import("convex/values").VNull<null, "required">, import("convex/values").VString<string, "required">], "optional", never>;
        redirectURLs: import("convex/values").VUnion<string | null | undefined, [import("convex/values").VNull<null, "required">, import("convex/values").VString<string, "required">], "optional", never>;
        type: import("convex/values").VUnion<string | null | undefined, [import("convex/values").VNull<null, "required">, import("convex/values").VString<string, "required">], "optional", never>;
        disabled: import("convex/values").VUnion<boolean | null | undefined, [import("convex/values").VNull<null, "required">, import("convex/values").VBoolean<boolean, "required">], "optional", never>;
        userId: import("convex/values").VUnion<string | null | undefined, [import("convex/values").VNull<null, "required">, import("convex/values").VString<string, "required">], "optional", never>;
        createdAt: import("convex/values").VUnion<number | null | undefined, [import("convex/values").VNull<null, "required">, import("convex/values").VFloat64<number, "required">], "optional", never>;
        updatedAt: import("convex/values").VUnion<number | null | undefined, [import("convex/values").VNull<null, "required">, import("convex/values").VFloat64<number, "required">], "optional", never>;
    }, "required", "type" | "createdAt" | "updatedAt" | "name" | "userId" | "metadata" | "icon" | "clientId" | "clientSecret" | "redirectURLs" | "disabled">, {
        clientId: ["clientId", "_creationTime"];
        userId: ["userId", "_creationTime"];
    }, {}, {}>;
    oauthAccessToken: import("convex/server").TableDefinition<import("convex/values").VObject<{
        createdAt?: number | null | undefined;
        updatedAt?: number | null | undefined;
        userId?: string | null | undefined;
        accessToken?: string | null | undefined;
        refreshToken?: string | null | undefined;
        accessTokenExpiresAt?: number | null | undefined;
        refreshTokenExpiresAt?: number | null | undefined;
        clientId?: string | null | undefined;
        scopes?: string | null | undefined;
    }, {
        accessToken: import("convex/values").VUnion<string | null | undefined, [import("convex/values").VNull<null, "required">, import("convex/values").VString<string, "required">], "optional", never>;
        refreshToken: import("convex/values").VUnion<string | null | undefined, [import("convex/values").VNull<null, "required">, import("convex/values").VString<string, "required">], "optional", never>;
        accessTokenExpiresAt: import("convex/values").VUnion<number | null | undefined, [import("convex/values").VNull<null, "required">, import("convex/values").VFloat64<number, "required">], "optional", never>;
        refreshTokenExpiresAt: import("convex/values").VUnion<number | null | undefined, [import("convex/values").VNull<null, "required">, import("convex/values").VFloat64<number, "required">], "optional", never>;
        clientId: import("convex/values").VUnion<string | null | undefined, [import("convex/values").VNull<null, "required">, import("convex/values").VString<string, "required">], "optional", never>;
        userId: import("convex/values").VUnion<string | null | undefined, [import("convex/values").VNull<null, "required">, import("convex/values").VString<string, "required">], "optional", never>;
        scopes: import("convex/values").VUnion<string | null | undefined, [import("convex/values").VNull<null, "required">, import("convex/values").VString<string, "required">], "optional", never>;
        createdAt: import("convex/values").VUnion<number | null | undefined, [import("convex/values").VNull<null, "required">, import("convex/values").VFloat64<number, "required">], "optional", never>;
        updatedAt: import("convex/values").VUnion<number | null | undefined, [import("convex/values").VNull<null, "required">, import("convex/values").VFloat64<number, "required">], "optional", never>;
    }, "required", "createdAt" | "updatedAt" | "userId" | "accessToken" | "refreshToken" | "accessTokenExpiresAt" | "refreshTokenExpiresAt" | "clientId" | "scopes">, {
        accessToken: ["accessToken", "_creationTime"];
        refreshToken: ["refreshToken", "_creationTime"];
        clientId: ["clientId", "_creationTime"];
        userId: ["userId", "_creationTime"];
    }, {}, {}>;
    oauthConsent: import("convex/server").TableDefinition<import("convex/values").VObject<{
        createdAt?: number | null | undefined;
        updatedAt?: number | null | undefined;
        userId?: string | null | undefined;
        clientId?: string | null | undefined;
        scopes?: string | null | undefined;
        consentGiven?: boolean | null | undefined;
    }, {
        clientId: import("convex/values").VUnion<string | null | undefined, [import("convex/values").VNull<null, "required">, import("convex/values").VString<string, "required">], "optional", never>;
        userId: import("convex/values").VUnion<string | null | undefined, [import("convex/values").VNull<null, "required">, import("convex/values").VString<string, "required">], "optional", never>;
        scopes: import("convex/values").VUnion<string | null | undefined, [import("convex/values").VNull<null, "required">, import("convex/values").VString<string, "required">], "optional", never>;
        createdAt: import("convex/values").VUnion<number | null | undefined, [import("convex/values").VNull<null, "required">, import("convex/values").VFloat64<number, "required">], "optional", never>;
        updatedAt: import("convex/values").VUnion<number | null | undefined, [import("convex/values").VNull<null, "required">, import("convex/values").VFloat64<number, "required">], "optional", never>;
        consentGiven: import("convex/values").VUnion<boolean | null | undefined, [import("convex/values").VNull<null, "required">, import("convex/values").VBoolean<boolean, "required">], "optional", never>;
    }, "required", "createdAt" | "updatedAt" | "userId" | "clientId" | "scopes" | "consentGiven">, {
        clientId_userId: ["clientId", "userId", "_creationTime"];
        userId: ["userId", "_creationTime"];
    }, {}, {}>;
    jwks: import("convex/server").TableDefinition<import("convex/values").VObject<{
        createdAt: number;
        publicKey: string;
        privateKey: string;
    }, {
        publicKey: import("convex/values").VString<string, "required">;
        privateKey: import("convex/values").VString<string, "required">;
        createdAt: import("convex/values").VFloat64<number, "required">;
    }, "required", "createdAt" | "publicKey" | "privateKey">, {}, {}, {}>;
    rateLimit: import("convex/server").TableDefinition<import("convex/values").VObject<{
        key?: string | null | undefined;
        count?: number | null | undefined;
        lastRequest?: number | null | undefined;
    }, {
        key: import("convex/values").VUnion<string | null | undefined, [import("convex/values").VNull<null, "required">, import("convex/values").VString<string, "required">], "optional", never>;
        count: import("convex/values").VUnion<number | null | undefined, [import("convex/values").VNull<null, "required">, import("convex/values").VFloat64<number, "required">], "optional", never>;
        lastRequest: import("convex/values").VUnion<number | null | undefined, [import("convex/values").VNull<null, "required">, import("convex/values").VFloat64<number, "required">], "optional", never>;
    }, "required", "key" | "count" | "lastRequest">, {
        key: ["key", "_creationTime"];
    }, {}, {}>;
}, true>;
export default schema;
//# sourceMappingURL=schema.d.ts.map