const TSS_FORMDATA_CONTEXT = "__TSS_CONTEXT";
const TSS_SERVER_FUNCTION = Symbol.for("TSS_SERVER_FUNCTION");
const TSS_SERVER_FUNCTION_FACTORY = Symbol.for(
  "TSS_SERVER_FUNCTION_FACTORY"
);
const X_TSS_SERIALIZED = "x-tss-serialized";
const X_TSS_RAW_RESPONSE = "x-tss-raw";
const X_TSS_CONTEXT = "x-tss-context";
const TSS_CONTENT_TYPE_FRAMED = "application/x-tss-framed";
const FrameType = {
  /** Seroval JSON chunk (NDJSON line) */
  JSON: 0,
  /** Raw stream data chunk */
  CHUNK: 1,
  /** Raw stream end (EOF) */
  END: 2,
  /** Raw stream error */
  ERROR: 3
};
const FRAME_HEADER_SIZE = 9;
const TSS_FRAMED_PROTOCOL_VERSION = 1;
const TSS_CONTENT_TYPE_FRAMED_VERSIONED = `${TSS_CONTENT_TYPE_FRAMED}; v=${TSS_FRAMED_PROTOCOL_VERSION}`;
const FRAMED_VERSION_REGEX = /;\s*v=(\d+)/;
function parseFramedProtocolVersion(contentType) {
  const match = contentType.match(FRAMED_VERSION_REGEX);
  return match ? parseInt(match[1], 10) : void 0;
}
function validateFramedProtocolVersion(contentType) {
  const serverVersion = parseFramedProtocolVersion(contentType);
  if (serverVersion === void 0) {
    return;
  }
  if (serverVersion !== TSS_FRAMED_PROTOCOL_VERSION) {
    throw new Error(
      `Incompatible framed protocol version: server=${serverVersion}, client=${TSS_FRAMED_PROTOCOL_VERSION}. Please ensure client and server are using compatible versions.`
    );
  }
}
export {
  FRAME_HEADER_SIZE,
  FrameType,
  TSS_CONTENT_TYPE_FRAMED,
  TSS_CONTENT_TYPE_FRAMED_VERSIONED,
  TSS_FORMDATA_CONTEXT,
  TSS_FRAMED_PROTOCOL_VERSION,
  TSS_SERVER_FUNCTION,
  TSS_SERVER_FUNCTION_FACTORY,
  X_TSS_CONTEXT,
  X_TSS_RAW_RESPONSE,
  X_TSS_SERIALIZED,
  parseFramedProtocolVersion,
  validateFramedProtocolVersion
};
//# sourceMappingURL=constants.js.map
