//#region src/plugins/siwe/types.d.ts

interface CacaoHeader {
  t: "caip122";
}
interface CacaoPayload {
  domain: string;
  aud: string;
  nonce: string;
  iss: string;
  version?: string | undefined;
  iat?: string | undefined;
  nbf?: string | undefined;
  exp?: string | undefined;
  statement?: string | undefined;
  requestId?: string | undefined;
  resources?: string[] | undefined;
  type?: string | undefined;
}
interface Cacao {
  h: CacaoHeader;
  p: CacaoPayload;
  s: {
    t: "eip191" | "eip1271";
    s: string;
    m?: string | undefined;
  };
}
interface SIWEVerifyMessageArgs {
  message: string;
  signature: string;
  address: string;
  chainId: number;
  cacao?: Cacao | undefined;
}
interface ENSLookupArgs {
  walletAddress: string;
}
interface ENSLookupResult {
  name: string;
  avatar: string;
}
//#endregion
export { ENSLookupArgs, ENSLookupResult, SIWEVerifyMessageArgs };
//# sourceMappingURL=types.d.mts.map