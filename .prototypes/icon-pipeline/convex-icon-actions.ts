"use node";
/**
 * Prototype 2 + 3: Convex actions for server-side icon ingestion
 *
 * Validates:
 *   - sharp works inside a Convex "use node" action (native binaries, externalPackages: ["*"])
 *   - base64 data URI -> decode -> resize+WebP -> ctx.storage.store(blob) -> returns Id<"_storage">
 *   - URL -> fetch -> resize+WebP -> ctx.storage.store(blob) -> returns Id<"_storage">
 *
 * Dependencies pulled in: sharp (^0.34.5)
 *   sharp bundles libvips statically so no system lib deps. The pnpm postinstall downloads
 *   a prebuilt binary for the target platform (linux-x64 in this project's case).
 *   Size on disk: ~70 MB in node_modules (libvips + sharp binding).
 *   Convex uploads the sharp binary as a Node.js external package - first deploy may be slow.
 *
 * Jimp was evaluated as a fallback but jimp v1 has no WebP encode support (@jimp/js-webp
 * package does not exist). Jimp is therefore eliminated - sharp is the only viable option.
 *
 * GOTCHAS:
 *   1. "use node" directive is REQUIRED at top of file. Without it the Convex bundler targets
 *      the V8 isolate runtime where sharp's native addon cannot load.
 *   2. ctx.storage.store() takes a browser Blob. In Node.js, construct via:
 *        new Blob([buffer], { type: 'image/webp' })
 *      The global Blob is available in Node >= 18 (which Convex uses).
 *   3. sharp handles SVG natively via librsvg (included in its static libvips build).
 *      No extra SVG dep needed server-side.
 *   4. Convex actions have a 2-minute execution timeout. Fetching a slow external URL +
 *      sharp processing is well within this limit for images under a few MB.
 *   5. CORS: actions run server-side so CORS does not apply to fetch(url).
 *      However some icon CDNs block non-browser User-Agents - pass a browser UA if needed.
 *   6. Action invocation cost: Convex charges per action call, not per byte processed.
 *      The storage write itself counts toward storage billing.
 *   7. sharp's resize({ fit: 'inside', withoutEnlargement: true }) is the correct option
 *      for "fit within 256x256, never upscale". Don't use fit: 'contain' (adds padding).
 */

import { action } from "./_generated/server";
import { v } from "convex/values";
import sharp from "sharp";

const MAX_DIM = 256;
const WEBP_QUALITY = 80; // 80 is visually lossless for logos; 60 saves ~5% more but degrades text edges

/**
 * Resize and convert any image buffer to WebP.
 * Returns a Node.js Buffer containing the WebP-encoded bytes.
 */
async function toWebP(input: Buffer): Promise<Buffer> {
  const meta = await sharp(input).metadata();
  const { width = 0, height = 0 } = meta;

  // Only resize if larger than maxDim in either dimension
  const needsResize = width > MAX_DIM || height > MAX_DIM;

  const pipeline = sharp(input);
  if (needsResize) {
    pipeline.resize(MAX_DIM, MAX_DIM, {
      fit: "inside",
      withoutEnlargement: true,
    });
  }

  return pipeline.webp({ quality: WEBP_QUALITY }).toBuffer();
}

/**
 * Action 2: decode a base64 data URI, resize+convert to WebP, store in Convex storage.
 *
 * Args:
 *   dataURI - e.g. "data:image/png;base64,iVBORw0KGgo..."
 *
 * Returns:
 *   storageId: Id<"_storage">
 *
 * Used by the backfill migration and the "paste data URI" path in the admin modal.
 */
export const storeIconFromDataURI = action({
  args: {
    dataURI: v.string(),
  },
  returns: v.string(), // Id<"_storage"> serializes as string
  handler: async (ctx, args) => {
    // Parse data URI: "data:<mimeType>;base64,<base64data>"
    const match = args.dataURI.match(/^data:([^;]+);base64,(.+)$/);
    if (!match) {
      throw new Error("Invalid data URI - expected data:<mime>;base64,<data>");
    }
    const inputBuffer = Buffer.from(match[2], "base64");

    const webpBuffer = await toWebP(inputBuffer);

    // ctx.storage.store() requires a browser Blob - Node >= 18 has global Blob
    const blob = new Blob([webpBuffer], { type: "image/webp" });
    const storageId = await ctx.storage.store(blob);

    return storageId as string;
  },
});

/**
 * Action 3: fetch an image from a URL, resize+convert to WebP, store in Convex storage.
 *
 * Args:
 *   url - public image URL (PNG, JPEG, SVG, WebP, etc.)
 *
 * Returns:
 *   storageId: Id<"_storage">
 *
 * Used by the "paste a URL" path in the admin modal.
 */
export const storeIconFromURL = action({
  args: {
    url: v.string(),
  },
  returns: v.string(), // Id<"_storage"> serializes as string
  handler: async (ctx, args) => {
    const response = await fetch(args.url, {
      // Some icon CDNs (e.g. Clearbit, Favicon.io) block non-browser agents
      headers: {
        "User-Agent":
          "Mozilla/5.0 (compatible; AIStack-iconbot/1.0; +https://aistack.to)",
        Accept: "image/*,*/*;q=0.8",
      },
    });

    if (!response.ok) {
      throw new Error(
        `Failed to fetch icon: ${response.status} ${response.statusText} - ${args.url}`
      );
    }

    const contentType = response.headers.get("content-type") ?? "";
    // Bail early on non-image responses (e.g. HTML error pages)
    if (
      contentType &&
      !contentType.startsWith("image/") &&
      !contentType.includes("svg")
    ) {
      throw new Error(
        `URL did not return an image - content-type: ${contentType}`
      );
    }

    const arrayBuffer = await response.arrayBuffer();
    const inputBuffer = Buffer.from(arrayBuffer);

    const webpBuffer = await toWebP(inputBuffer);

    const blob = new Blob([webpBuffer], { type: "image/webp" });
    const storageId = await ctx.storage.store(blob);

    return storageId as string;
  },
});

// ---------------------------------------------------------------------------
// Manual test: run from the Convex dashboard "Run function" panel or via:
//   npx convex run --prod icon-pipeline/convex-icon-actions:storeIconFromURL \
//     '{"url":"https://www.google.com/images/branding/googlelogo/2x/googlelogo_color_272x92dp.png"}'
//
// Expected: returns a storageId string like "kg2abc123..."
// Then verify with:
//   npx convex run --prod files:getUrl '{"storageId":"<id>"}'
// ---------------------------------------------------------------------------
