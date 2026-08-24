import { AuthorityKeyIdentifierExtension, CRLDistributionPointsExtension, SubjectKeyIdentifierExtension, X509Crl, } from '@peculiar/x509';
import { fetch } from './fetch.js';
const cacheRevokedCerts = {};
/**
 * A method to pull a CRL from a certificate and compare its serial number to the list of revoked
 * certificate serial numbers within the CRL.
 *
 * CRL certificate structure referenced from https://tools.ietf.org/html/rfc5280#page-117
 */
export async function isCertRevoked(cert) {
    const { extensions } = cert;
    if (!extensions) {
        return false;
    }
    let extAuthorityKeyID;
    let extSubjectKeyID;
    let extCRLDistributionPoints;
    extensions.forEach((ext) => {
        if (ext instanceof AuthorityKeyIdentifierExtension) {
            extAuthorityKeyID = ext;
        }
        else if (ext instanceof SubjectKeyIdentifierExtension) {
            extSubjectKeyID = ext;
        }
        else if (ext instanceof CRLDistributionPointsExtension) {
            extCRLDistributionPoints = ext;
        }
    });
    // Check to see if we've got cached info for the cert's CA
    let keyIdentifier = undefined;
    if (extAuthorityKeyID && extAuthorityKeyID.keyId) {
        keyIdentifier = extAuthorityKeyID.keyId;
    }
    else if (extSubjectKeyID) {
        /**
         * We might be dealing with a self-signed root certificate. Check the
         * Subject key Identifier extension next.
         */
        keyIdentifier = extSubjectKeyID.keyId;
    }
    if (keyIdentifier) {
        const cached = cacheRevokedCerts[keyIdentifier];
        if (cached) {
            const now = new Date();
            // If there's a nextUpdate then make sure we're before it
            if (!cached.nextUpdate || cached.nextUpdate > now) {
                return cached.revokedCerts.indexOf(cert.serialNumber) >= 0;
            }
        }
    }
    const crlURL = extCRLDistributionPoints?.distributionPoints?.[0].distributionPoint?.fullName?.[0]
        .uniformResourceIdentifier;
    // If no URL is provided then we have nothing to check
    if (!crlURL) {
        return false;
    }
    // Download and read the CRL
    let certListBytes;
    try {
        const respCRL = await fetch(crlURL);
        certListBytes = await respCRL.arrayBuffer();
    }
    catch (_err) {
        return false;
    }
    let data;
    try {
        data = new X509Crl(certListBytes);
    }
    catch (_err) {
        // Something was malformed with the CRL, so pass
        return false;
    }
    const newCached = {
        revokedCerts: [],
        nextUpdate: undefined,
    };
    // nextUpdate
    if (data.nextUpdate) {
        newCached.nextUpdate = data.nextUpdate;
    }
    // revokedCertificates
    const revokedCerts = data.entries;
    if (revokedCerts) {
        for (const cert of revokedCerts) {
            const revokedHex = cert.serialNumber;
            newCached.revokedCerts.push(revokedHex);
        }
        // Cache the results
        if (keyIdentifier) {
            cacheRevokedCerts[keyIdentifier] = newCached;
        }
        return newCached.revokedCerts.indexOf(cert.serialNumber) >= 0;
    }
    return false;
}
