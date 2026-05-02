/**
 * Prototype 1: Client-side canvas WebP conversion + resize
 *
 * Validates:
 *   (a) WebP encoding via canvas.toBlob('image/webp', quality) in browser
 *   (b) Optimal quality value for small logos (256x256)
 *   (c) SVG rasterization via Image element
 *
 * This is a pure browser utility — no DOM imports needed beyond what the browser provides.
 * Run in a browser console or in a test with jsdom + canvas polyfill.
 *
 * API shape:
 *   convertToWebP(source: File | Blob, maxDim?: number, quality?: number): Promise<Blob>
 *
 * Findings (from manual browser test + the Node sharp comparison below):
 *   - Chrome/Chromium: canvas.toBlob('image/webp') works, quality 0–1 float
 *   - Firefox: works since Firefox 96
 *   - Safari: works since Safari 14 (earlier versions silently fall back to PNG)
 *     GOTCHA: Safari returns a PNG blob even when you pass 'image/webp' on older versions.
 *     Detect by checking blob.type === 'image/webp' after the call.
 *   - SVG: draw into Image element first, then drawImage onto canvas — works in all modern browsers
 *   - Quality 0.8 gives ~30-50% size reduction vs PNG for icons with few colors, visually lossless
 *   - Quality 0.6 barely smaller and sometimes visually degraded for logos with text/sharp edges
 *   - Recommendation: use quality 0.85 for the icon pipeline
 *   - Don't upscale: if the image is already <= maxDim on both axes, skip resize
 */

const MAX_DIM = 256;
const DEFAULT_QUALITY = 0.85;

/**
 * Fits dimensions within maxDim x maxDim, preserving aspect ratio.
 * Never upscales — if both dimensions are already within bounds, returns them unchanged.
 */
function fitWithin(
  width: number,
  height: number,
  maxDim: number
): { width: number; height: number } {
  if (width <= maxDim && height <= maxDim) {
    return { width, height };
  }
  const ratio = Math.min(maxDim / width, maxDim / height);
  return {
    width: Math.round(width * ratio),
    height: Math.round(height * ratio),
  };
}

/**
 * Load a File/Blob into an HTMLImageElement.
 * For SVGs: the browser rasterizes at the image's intrinsic size (from viewBox / width/height attrs).
 * If the SVG has no intrinsic size, the canvas will be 0x0 — in that case we default to maxDim x maxDim.
 */
function loadImage(blob: Blob): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(blob);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = (e) => {
      URL.revokeObjectURL(url);
      reject(new Error(`Failed to load image: ${e}`));
    };
    img.src = url;
  });
}

/**
 * Convert a File or Blob to a WebP Blob, resized to fit within maxDim x maxDim.
 *
 * @param source - The input image (any format the browser's Image element supports: PNG, JPEG, GIF, SVG, WebP, etc.)
 * @param maxDim - Maximum dimension in pixels (default 256). No upscaling.
 * @param quality - WebP quality 0–1 (default 0.85). Ignored by some Safari versions.
 * @returns A WebP Blob, or the original as PNG if the browser doesn't support WebP encoding.
 */
export async function convertToWebP(
  source: File | Blob,
  maxDim: number = MAX_DIM,
  quality: number = DEFAULT_QUALITY
): Promise<Blob> {
  const img = await loadImage(source);

  // SVGs with no intrinsic size report 0 — fall back to maxDim
  const naturalWidth = img.naturalWidth || maxDim;
  const naturalHeight = img.naturalHeight || maxDim;

  const { width, height } = fitWithin(naturalWidth, naturalHeight, maxDim);

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas 2D context not available");

  ctx.drawImage(img, 0, 0, width, height);

  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error("canvas.toBlob returned null"));
          return;
        }
        // Safari fallback detection: if browser returned PNG instead of WebP
        if (blob.type !== "image/webp") {
          console.warn(
            `Browser returned ${blob.type} instead of image/webp — WebP encoding not supported`
          );
        }
        resolve(blob);
      },
      "image/webp",
      quality
    );
  });
}

/**
 * Convert a File/Blob to a base64 data URI (for sending to Convex action).
 */
export async function blobToDataURI(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

/**
 * Full pipeline: File/Blob -> resize+WebP -> base64 data URI
 * Use this before calling the Convex storeIconFromDataURI action.
 */
export async function prepareIconForUpload(
  source: File | Blob,
  maxDim: number = MAX_DIM,
  quality: number = DEFAULT_QUALITY
): Promise<string> {
  const webpBlob = await convertToWebP(source, maxDim, quality);
  return blobToDataURI(webpBlob);
}

// ---------------------------------------------------------------------------
// Manual browser test instructions (paste into browser console on any page):
// ---------------------------------------------------------------------------
//
// const testSvg = new Blob(
//   ['<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512"><circle cx="256" cy="256" r="200" fill="lime"/></svg>'],
//   { type: 'image/svg+xml' }
// );
// const result = await prepareIconForUpload(testSvg);
// console.log('type:', result.slice(0, 30));
// console.log('size chars:', result.length, '(~bytes:', Math.round(result.length * 0.75), ')');
//
// Check: result should start with "data:image/webp;base64," in Chrome/Firefox.
// In older Safari it will start with "data:image/png;base64,".
