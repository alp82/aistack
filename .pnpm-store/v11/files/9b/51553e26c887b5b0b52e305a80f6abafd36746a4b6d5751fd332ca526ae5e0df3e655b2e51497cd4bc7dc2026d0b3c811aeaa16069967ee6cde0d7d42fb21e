import { FrameType } from '@tanstack/start-client-core';
export { FRAME_HEADER_SIZE, FrameType, TSS_CONTENT_TYPE_FRAMED, TSS_CONTENT_TYPE_FRAMED_VERSIONED, TSS_FRAMED_PROTOCOL_VERSION, } from '@tanstack/start-client-core';
/**
 * Encodes a single frame with header and payload.
 */
export declare function encodeFrame(type: FrameType, streamId: number, payload: Uint8Array): Uint8Array;
/**
 * Encodes a JSON frame (type 0, streamId 0).
 */
export declare function encodeJSONFrame(json: string): Uint8Array;
/**
 * Encodes a raw stream chunk frame.
 */
export declare function encodeChunkFrame(streamId: number, chunk: Uint8Array): Uint8Array;
/**
 * Encodes a raw stream end frame.
 */
export declare function encodeEndFrame(streamId: number): Uint8Array;
/**
 * Encodes a raw stream error frame.
 */
export declare function encodeErrorFrame(streamId: number, error: unknown): Uint8Array;
/**
 * Creates a multiplexed ReadableStream from JSON stream and raw streams.
 *
 * The JSON stream emits NDJSON lines (from seroval's toCrossJSONStream).
 * Raw streams are pumped concurrently, interleaved with JSON frames.
 *
 * @param jsonStream Stream of JSON strings (each string is one NDJSON line)
 * @param rawStreams Map of stream IDs to raw binary streams
 */
export declare function createMultiplexedStream(jsonStream: ReadableStream<string>, rawStreams: Map<number, ReadableStream<Uint8Array>>): ReadableStream<Uint8Array>;
