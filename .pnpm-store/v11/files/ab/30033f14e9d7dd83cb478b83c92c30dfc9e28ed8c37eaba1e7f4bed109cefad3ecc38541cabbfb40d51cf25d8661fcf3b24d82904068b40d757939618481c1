import { type AuthenticationExtensionsAuthenticatorOutputs } from './decodeAuthenticatorExtensions.js';
import type { Uint8Array_ } from '../types/index.js';
/**
 * Make sense of the authData buffer contained in an Attestation
 */
export declare function parseAuthenticatorData(authData: Uint8Array_): ParsedAuthenticatorData;
export type ParsedAuthenticatorData = {
    rpIdHash: Uint8Array_;
    flagsBuf: Uint8Array_;
    flags: {
        up: boolean;
        uv: boolean;
        be: boolean;
        bs: boolean;
        at: boolean;
        ed: boolean;
        flagsInt: number;
    };
    counter: number;
    counterBuf: Uint8Array_;
    aaguid?: Uint8Array_;
    credentialID?: Uint8Array_;
    credentialPublicKey?: Uint8Array_;
    extensionsData?: AuthenticationExtensionsAuthenticatorOutputs;
    extensionsDataBuffer?: Uint8Array_;
};
/**
 * Make it possible to stub the return value during testing
 * @ignore Don't include this in docs output
 */
export declare const _parseAuthenticatorDataInternals: {
    stubThis: (value: ParsedAuthenticatorData) => ParsedAuthenticatorData;
};
//# sourceMappingURL=parseAuthenticatorData.d.ts.map