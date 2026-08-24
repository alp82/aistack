import type { Uint8Array_ } from '../../../types/index.js';
/**
 * Cut up a TPM attestation's certInfo into intelligible chunks
 */
export declare function parseCertInfo(certInfo: Uint8Array_): ParsedCertInfo;
type ParsedCertInfo = {
    magic: number;
    type: string;
    qualifiedSigner: Uint8Array_;
    extraData: Uint8Array_;
    clockInfo: {
        clock: Uint8Array_;
        resetCount: number;
        restartCount: number;
        safe: boolean;
    };
    firmwareVersion: Uint8Array_;
    attested: {
        nameAlg: string;
        nameAlgBuffer: Uint8Array_;
        name: Uint8Array_;
        qualifiedName: Uint8Array_;
    };
};
export {};
//# sourceMappingURL=parseCertInfo.d.ts.map