/**
 * Client-side frame decoder for multiplexed responses.
 *
 * Decodes binary frame protocol and reconstructs:
 * - JSON stream (NDJSON lines for seroval)
 * - Raw streams (binary data as ReadableStream<Uint8Array>)
 */
/**
 * Result of frame decoding.
 */
export interface FrameDecoderResult {
    /** Gets or creates a raw stream by ID (for use by deserialize plugin) */
    getOrCreateStream: (id: number) => ReadableStream<Uint8Array>;
    /** Stream of JSON strings (NDJSON lines) */
    jsonChunks: ReadableStream<string>;
}
/**
 * Creates a frame decoder that processes a multiplexed response stream.
 *
 * @param input The raw response body stream
 * @returns Decoded JSON stream and stream getter function
 */
export declare function createFrameDecoder(input: ReadableStream<Uint8Array>): FrameDecoderResult;
