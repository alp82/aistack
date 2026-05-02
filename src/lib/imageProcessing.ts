/**
 * Client-side image conversion to WebP via canvas.
 *
 * Used by IconUploadField for the file-picker / drag-drop path. The URL-paste
 * path goes through the server-side TS API route at /api/icons/from-url
 * because canvas cannot fetch cross-origin images.
 *
 * Supported inputs: any format the browser's <img> element decodes
 * (PNG, JPEG, GIF, SVG, WebP). HEIC/AVIF are intentionally rejected upstream
 * by extension because Safari/Chrome have inconsistent decoder support.
 *
 * No `limitInputPixels` equivalent on the client. Source files are user-picked
 * via <input type="file">, so attacker-controlled inputs aren't a concern here.
 */

const DEFAULT_MAX_DIM = 512;
const DEFAULT_QUALITY = 0.85;

function fitWithin(
	width: number,
	height: number,
	maxDim: number,
): { width: number; height: number } {
	if (width <= maxDim && height <= maxDim) {
		return { width, height };
	}
	const ratio = Math.min(maxDim / width, maxDim / height);
	return {
		width: Math.max(1, Math.round(width * ratio)),
		height: Math.max(1, Math.round(height * ratio)),
	};
}

function loadImage(blob: Blob): Promise<HTMLImageElement> {
	return new Promise((resolve, reject) => {
		const url = URL.createObjectURL(blob);
		const img = new Image();
		img.onload = () => {
			URL.revokeObjectURL(url);
			resolve(img);
		};
		img.onerror = () => {
			URL.revokeObjectURL(url);
			reject(new Error("Failed to decode image"));
		};
		img.src = url;
	});
}

/**
 * Convert a File or Blob to a WebP Blob, fit-within `maxDim` pixels.
 * Throws if the canvas/encode pipeline fails or the source isn't an image.
 */
export async function convertToWebP(
	source: File | Blob,
	maxDim: number = DEFAULT_MAX_DIM,
	quality: number = DEFAULT_QUALITY,
): Promise<Blob> {
	if (source.type && !source.type.startsWith("image/")) {
		throw new Error(`Not an image — content-type is "${source.type}"`);
	}

	const img = await loadImage(source);
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
				resolve(blob);
			},
			"image/webp",
			quality,
		);
	});
}
