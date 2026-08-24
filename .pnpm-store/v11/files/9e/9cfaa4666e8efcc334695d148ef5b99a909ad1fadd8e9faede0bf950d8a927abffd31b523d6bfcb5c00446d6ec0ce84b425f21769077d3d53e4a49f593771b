import type { COSEAlgorithmIdentifier, CredentialDeviceType, RegistrationResponseJSON, Uint8Array_, WebAuthnCredential } from '../types/index.js';
import { type AttestationFormat, type AttestationStatement } from '../helpers/decodeAttestationObject.js';
import type { AuthenticationExtensionsAuthenticatorOutputs } from '../helpers/decodeAuthenticatorExtensions.js';
/**
 * Configurable options when calling `verifyRegistrationResponse()`
 */
export type VerifyRegistrationResponseOpts = Parameters<typeof verifyRegistrationResponse>[0];
/**
 * Verify that the user has legitimately completed the registration process
 *
 * **Options:**
 *
 * @param response - Response returned by **@simplewebauthn/browser**'s `startAuthentication()`
 * @param expectedChallenge - The base64url-encoded `options.challenge` returned by `generateRegistrationOptions()`
 * @param expectedOrigin - Website URL (or array of URLs) that the registration should have occurred on
 * @param expectedRPID - RP ID (or array of IDs) that was specified in the registration options
 * @param expectedType **(Optional)** - The response type expected ('webauthn.create')
 * @param requireUserPresence **(Optional)** - Enforce user presence by the authenticator (or skip it during auto registration) Defaults to `true`
 * @param requireUserVerification **(Optional)** - Enforce user verification by the authenticator (via PIN, fingerprint, etc...) Defaults to `true`
 * @param supportedAlgorithmIDs **(Optional)** - Array of numeric COSE algorithm identifiers supported for attestation by this RP. See https://www.iana.org/assignments/cose/cose.xhtml#algorithms. Defaults to all supported algorithm IDs
 * @param attestationSafetyNetEnforceCTSCheck **(Optional)** - Require that an Android device's system integrity has not been tampered with if it uses SafetyNet attestation. Defaults to `true`
 */
export declare function verifyRegistrationResponse(options: {
    response: RegistrationResponseJSON;
    expectedChallenge: string | ((challenge: string) => boolean | Promise<boolean>);
    expectedOrigin: string | string[];
    expectedRPID?: string | string[];
    expectedType?: string | string[];
    requireUserPresence?: boolean;
    requireUserVerification?: boolean;
    supportedAlgorithmIDs?: COSEAlgorithmIdentifier[];
    attestationSafetyNetEnforceCTSCheck?: boolean;
}): Promise<VerifiedRegistrationResponse>;
/**
 * Result of registration verification
 *
 * @param verified If the assertion response could be verified
 * @param registrationInfo.fmt Type of attestation
 * @param registrationInfo.counter The number of times the authenticator reported it has been used.
 * **Should be kept in a DB for later reference to help prevent replay attacks!**
 * @param registrationInfo.aaguid Authenticator's Attestation GUID indicating the type of the
 * authenticator
 * @param registrationInfo.credentialPublicKey The credential's public key
 * @param registrationInfo.credentialID The credential's credential ID for the public key above
 * @param registrationInfo.credentialType The type of the credential returned by the browser
 * @param registrationInfo.userVerified Whether the user was uniquely identified during attestation
 * @param registrationInfo.attestationObject The raw `response.attestationObject` Buffer returned by
 * the authenticator
 * @param registrationInfo.credentialDeviceType Whether this is a single-device or multi-device
 * credential. **Should be kept in a DB for later reference!**
 * @param registrationInfo.credentialBackedUp Whether or not the multi-device credential has been
 * backed up. Always `false` for single-device credentials. **Should be kept in a DB for later
 * reference!**
 * @param registrationInfo.origin The origin of the website that the registration occurred on
 * @param registrationInfo?.rpID The RP ID that the registration occurred on, if one or more were
 * specified in the registration options
 * @param registrationInfo?.authenticatorExtensionResults The authenticator extensions returned
 * by the browser
 */
export type VerifiedRegistrationResponse = {
    verified: false;
    registrationInfo?: never;
} | {
    verified: true;
    registrationInfo: {
        fmt: AttestationFormat;
        aaguid: string;
        credential: WebAuthnCredential;
        credentialType: 'public-key';
        attestationObject: Uint8Array_;
        userVerified: boolean;
        credentialDeviceType: CredentialDeviceType;
        credentialBackedUp: boolean;
        origin: string;
        rpID?: string;
        authenticatorExtensionResults?: AuthenticationExtensionsAuthenticatorOutputs;
    };
};
/**
 * Values passed to all attestation format verifiers, from which they are free to use as they please
 */
export type AttestationFormatVerifierOpts = {
    aaguid: Uint8Array_;
    attStmt: AttestationStatement;
    authData: Uint8Array_;
    clientDataHash: Uint8Array_;
    credentialID: Uint8Array_;
    credentialPublicKey: Uint8Array_;
    rootCertificates: string[];
    rpIdHash: Uint8Array_;
    verifyTimestampMS?: boolean;
    attestationSafetyNetEnforceCTSCheck?: boolean;
};
//# sourceMappingURL=verifyRegistrationResponse.d.ts.map